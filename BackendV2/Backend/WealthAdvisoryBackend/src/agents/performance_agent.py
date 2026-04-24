"""
Performance Summary Agent
Uses PriceCache (yfinance batch) — 1 HTTP call instead of 78+ MCP calls.
MCP is no longer used for historical prices.
"""
import os
import json
import sys
from pathlib import Path
from typing import Dict, List
from datetime import datetime, date as date_type
from dotenv import load_dotenv

load_dotenv()

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage

from functions.performance import (
    calculate_period_return,
    calculate_itd_return,
    calculate_multi_period_returns,
    calculate_portfolio_value,
    PriceCache,
    infer_inception_date
)
from functions.risk import calculate_risk_metrics, calculate_alpha_beta
from functions.narrative_generator import generate_performance_narrative
from services.chart_service import chart_service
from observability.langchain_adapter import LangChainObservabilityAdapter


class PerformanceAgent:
    """Performance Summary agent using yfinance batch fetching."""

    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            temperature=0,
            google_api_key=os.getenv("GEMINI_API_KEY")
        )
        self.observer = LangChainObservabilityAdapter(
            agent_name="performance_agent",
            description="Computes performance metrics and writes narratives",
            evaluators=["llm_judge"],
            llm_judge_dimensions=["accuracy", "conciseness", "hallucination", "safety"],
            llm_judge_model="gpt-4o-mini",
        )

    async def initialize(self):
        """No-op — kept for backward compat with orchestrator."""
        pass

    async def cleanup(self):
        """No-op — kept for backward compat with orchestrator."""
        pass

    async def generate(self, portfolio_data: Dict, period: Dict) -> Dict:
        try:
            holdings = portfolio_data['holdings']
            tickers = list(set(h['ticker'] for h in holdings))

            benchmark_info = portfolio_data.get('benchmark', {})
            benchmark_ticker = benchmark_info.get('ticker', '^GSPC') or '^GSPC'
            benchmark_name = benchmark_info.get('name', 'S&P 500') or 'S&P 500'

            period_end = date_type.fromisoformat(period['end_date'])
            period_start = date_type.fromisoformat(period['start_date'])
            inception = infer_inception_date(holdings)

            # === ONE yfinance batch call for ALL tickers + benchmark ===
            cache = PriceCache()
            all_tickers = tickers + [benchmark_ticker]
            cache.fetch(all_tickers, inception.isoformat(), period_end.isoformat())

            # Multi-period returns (pure Python slicing, zero extra network calls)
            multi_period = await calculate_multi_period_returns(
                holdings, period_end, price_cache=cache,
                benchmark_ticker=benchmark_ticker, inception_date=inception
            )

            # Current prices from cache
            current_prices = {}
            for t in tickers:
                p = cache.get_price_at(t, period_end.isoformat())
                if p:
                    current_prices[t] = p

            portfolio_value = calculate_portfolio_value(holdings, current_prices)

            # Performance table
            performance_table = {
                'periods': ['QTD', 'YTD', '1-Year', '3-Yr Ann.', '5-Yr Ann.', 'ITD Ann.'],
                'portfolio': [
                    multi_period[k]['portfolio']
                    for k in ('qtd', 'ytd', 'one_year', 'three_year', 'five_year', 'itd')
                ],
                'benchmark': [
                    multi_period[k]['benchmark']
                    for k in ('qtd', 'ytd', 'one_year', 'three_year', 'five_year', 'itd')
                ],
                'difference': [
                    (multi_period[k]['portfolio'] or 0) - (multi_period[k]['benchmark'] or 0)
                    for k in ('qtd', 'ytd', 'one_year', 'three_year', 'five_year', 'itd')
                ]
            }

            qtd_return = multi_period['qtd']['portfolio'] or 0.0
            ytd_return = multi_period['ytd']['portfolio'] or 0.0

            # Account-level returns — reuse same cache, zero extra calls
            accounts_data = {}
            for h in holdings:
                acc = h.get('account', 'Main Account')
                accounts_data.setdefault(acc, []).append(h)

            account_list = []
            for acc_name, acc_holdings in accounts_data.items():
                acc_value = sum(
                    h['shares'] * current_prices.get(h['ticker'], 0)
                    for h in acc_holdings
                )
                try:
                    acc_mp = await calculate_multi_period_returns(
                        acc_holdings, period_end, price_cache=cache,
                        benchmark_ticker=benchmark_ticker, inception_date=inception
                    )
                    acc_qtd = acc_mp['qtd']['portfolio'] or 0.0
                    acc_ytd = acc_mp['ytd']['portfolio'] or 0.0
                except Exception as e:
                    print(f"[PERF] Account {acc_name} fallback: {e}")
                    acc_qtd, acc_ytd = qtd_return, ytd_return

                # Detect account type from name
                name_lower = acc_name.lower()
                if 'ira' in name_lower and 'roth' not in name_lower:
                    acc_type = 'Traditional IRA'
                elif 'roth' in name_lower:
                    acc_type = 'Roth IRA'
                elif '529' in name_lower or 'education' in name_lower:
                    acc_type = 'Education'
                else:
                    acc_type = 'Brokerage'

                account_list.append({
                    'name': acc_name, 'type': acc_type,
                    'value': acc_value, 'qtd': acc_qtd,
                    'ytd': acc_ytd, 'benchmark': benchmark_name
                })

            account_list.append({
                'name': 'Total', 'type': '', 'value': portfolio_value,
                'qtd': qtd_return, 'ytd': ytd_return, 'benchmark': ''
            })

            # Risk metrics from portfolio daily values (from cache)
            daily_by_date = {}
            for t in tickers:
                import pandas as pd
                raw = cache._data.get(t)
                if raw is not None and not raw.empty:
                    mask = (raw.index >= pd.Timestamp(period_start)) & (raw.index <= pd.Timestamp(period_end))
                    for idx, val in raw[mask].items():
                        d = str(idx.date())
                        daily_by_date.setdefault(d, {})[t] = float(val)

            shares_map = {}
            for h in holdings:
                shares_map[h['ticker']] = shares_map.get(h['ticker'], 0) + h['shares']

            portfolio_daily = []
            for d in sorted(daily_by_date.keys()):
                day_val = sum(
                    shares_map.get(t, 0) * daily_by_date[d].get(t, 0)
                    for t in tickers if t in daily_by_date[d]
                )
                if day_val > 0:
                    portfolio_daily.append(day_val)

            risk_metrics = calculate_risk_metrics(portfolio_daily) if len(portfolio_daily) >= 2 else {
                'sharpe_ratio': 0, 'volatility': 0, 'max_drawdown': 0, 'sortino_ratio': 0
            }

            alpha = qtd_return - (multi_period['qtd']['benchmark'] or 0.0)

            # Narrative (template, no LLM cost)
            holdings_returns = {t: qtd_return for t in tickers}
            narrative = generate_performance_narrative(
                portfolio_data['client_name'], period['name'],
                qtd_return, multi_period['qtd']['benchmark'] or 0.0,
                alpha, holdings, holdings_returns
            )

            metrics = {
                "portfolio_return": qtd_return,
                "benchmark_return": multi_period['qtd']['benchmark'] or 0.0,
                "alpha": alpha, "beta": 1.0,
                "sharpe_ratio": risk_metrics.get('sharpe_ratio', 0),
                "volatility": risk_metrics.get('volatility', 0),
                "max_drawdown": risk_metrics.get('max_drawdown', 0),
                "itd_return": multi_period['itd']['portfolio'] or 0.0
            }

            executive_highlights = await self._generate_executive_highlights(
                client_name=portfolio_data['client_name'],
                period_name=period['name'],
                portfolio_value=portfolio_value,
                qtd_return=qtd_return, ytd_return=ytd_return,
                itd_return=multi_period['itd']['portfolio'] or 0.0,
                benchmark_return=multi_period['qtd']['benchmark'] or 0.0,
                ytd_benchmark=multi_period['ytd']['benchmark'] or 0.0,
                benchmark_name=benchmark_name,
                holdings=holdings,
                transactions=portfolio_data.get('transactions', []),
                alpha=alpha
            )

            chart_data = chart_service.performance_comparison_chart(
                [a for a in account_list if a['name'] != 'Total']
            )

            print(f"[PERF-DEBUG] QTD portfolio={multi_period['qtd']['portfolio']}, benchmark={multi_period['qtd']['benchmark']}")
            print(f"[PERF-DEBUG] portfolio_value={portfolio_value}")

            return {
                "section": "performance_summary",
                "status": "complete",
                "metrics": metrics,
                "performance_table": performance_table,
                "account_table": {"accounts": account_list},
                "narrative": narrative,
                "executive_highlights": executive_highlights,
                "portfolio_value": portfolio_value,
                "risk_metrics": risk_metrics,
                "chart_data": chart_data,
                "benchmark_name": benchmark_name,
                "client_name": portfolio_data['client_name'],
                "period_name": period['name'],
                "timestamp": datetime.now().isoformat()
            }

        except Exception as e:
            import traceback
            return {
                "section": "performance_summary",
                "status": "error",
                "error": f"{e}\n{traceback.format_exc()}",
                "timestamp": datetime.now().isoformat()
            }

    async def _generate_executive_highlights(self, client_name: str, period_name: str,
                                              portfolio_value: float, qtd_return: float,
                                              ytd_return: float, itd_return: float,
                                              benchmark_return: float, ytd_benchmark: float,
                                              benchmark_name: str,
                                              holdings: list, transactions: list, alpha: float) -> list:
        """Generate executive summary highlights using LLM (with observability)."""
        try:
            contributions = sum(
                t.get('amount', 0) for t in transactions
                if t.get('type', '').lower() in ('contribution', 'deposit')
            )
            tlh_amount = sum(
                abs(t.get('amount', 0)) for t in transactions
                if 'tax' in t.get('type', '').lower() or 'loss' in t.get('type', '').lower()
            )

            messages = [
                SystemMessage(content="You are a CFP® writing executive summary highlights for a quarterly portfolio report. Write 4-5 concise, professional bullet points."),
                HumanMessage(content=f"""Generate executive summary highlights for {client_name}'s {period_name} portfolio report:

Performance:
- Portfolio Value: ${portfolio_value:,.0f}
- QTD Return: {qtd_return:+.1f}% (Benchmark {benchmark_name}: {benchmark_return:+.1f}%)
- YTD Return: {ytd_return:+.1f}% (Benchmark YTD: {ytd_benchmark:+.1f}%)
- ITD Return: {itd_return:+.1f}% annualized
- Alpha: {alpha:+.1f}% ({abs(alpha)*100:.0f} basis points)

Activity:
- Contributions: ${contributions:,.0f}
- Tax-loss harvesting: ${tlh_amount:,.0f} in realized losses
- Total transactions: {len(transactions)}

Write 4-5 bullet points like:
• **Strong Q4 Performance:** The portfolio gained +3.2% net of fees, outpacing the S&P 500 (+2.4%) by 80 basis points.
• **Full-Year Context:** For the full year, the portfolio returned +18.5%, reflecting solid absolute gains.

Use bold headers. Be specific with numbers. Professional CFP tone.""")
            ]

            response = await self.observer.ainvoke(self.llm, messages, metadata={"operation": "performance_narrative"})
            content = response.content.strip()

            highlights = []
            import re
            for line in content.split('\n'):
                line = line.strip()
                if not line:
                    continue
                clean = re.sub(r'^[•\-]\s*', '', line)
                clean = re.sub(r'^\*(?!\*)\s*', '', clean)
                clean = clean.strip()
                if clean and len(clean) > 20:
                    highlights.append(clean)

            if not highlights:
                highlights = [l.strip() for l in content.split('\n')
                              if l.strip() and len(l.strip()) > 30]

            return highlights[:5] if highlights else [
                f"**{period_name} Performance:** Portfolio gained {qtd_return:+.1f}% vs benchmark {benchmark_return:+.1f}%",
                f"**Year-to-Date:** Return of {ytd_return:+.1f}% demonstrates solid progress toward long-term goals"
            ]

        except Exception as e:
            print(f"[EXEC-HIGHLIGHTS] Error: {e}")
            return [
                f"Portfolio returned {qtd_return:+.1f}% in {period_name} vs benchmark {benchmark_return:+.1f}%",
                f"Year-to-date performance: {ytd_return:+.1f}%"
            ]
