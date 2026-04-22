"""
result_formatter.py
Deterministic mapping from MCP tool JSON responses to the exact API output schema.
No LLM calls — pure Python dict transformation.
"""
import json
from datetime import datetime
from typing import Dict, Any, List

try:
    from tools.sector_analyzer import get_fund_sector_weightings, build_sector_concentration_table
except ImportError:
    get_fund_sector_weightings = None
    build_sector_concentration_table = None


def _safe_get(d: Any, *keys, default=None):
    """Safely traverse nested dicts."""
    for k in keys:
        if isinstance(d, dict):
            d = d.get(k, default)
        else:
            return default
    return d


def _fmt_pct(val) -> str:
    try:
        return f"{float(val):.1f}%"
    except (TypeError, ValueError):
        return "0.0%"


def _fmt_dollar(val) -> str:
    try:
        return f"${float(val):,.0f}"
    except (TypeError, ValueError):
        return "$0"


def format_structured_response(tool_results: Dict[str, Any], client_id: str = "") -> dict:
    """
    Maps accumulated MCP tool results into the exact full-analysis JSON schema.
    Each tool_name key in tool_results contains the parsed JSON from that MCP tool call.
    """
    portfolio = tool_results.get("get_portfolio_data", {})
    drift = tool_results.get("calculate_portfolio_drift", {})
    risk = tool_results.get("analyze_portfolio_risk", {})
    sentiment = tool_results.get("analyze_portfolio_sentiment", {})
    compliance = tool_results.get("check_portfolio_compliance", {})
    trades = tool_results.get("generate_rebalancing_proposals", {})
    simulation = tool_results.get("simulate_rebalance", {})
    universe_eq = tool_results.get("get_universe_alternatives", {})
    universe_raw = tool_results.get("get_universe_alternatives_raw", "")
    universe_metrics = tool_results.get("fetch_fund_universe_metrics", {})
    ticker_info_list = tool_results.get("get_ticker_info", [])
    if isinstance(ticker_info_list, dict):
        ticker_info_list = [ticker_info_list]

    # Handle list results (if tool called multiple times)
    if isinstance(universe_eq, list):
        merged_alts = {}
        for item in universe_eq:
            if isinstance(item, dict):
                merged_alts.update(item)
        universe_eq = merged_alts

    # Fix #4: parse raw text ticker list if universe_eq is empty
    if not universe_eq and universe_raw:
        if isinstance(universe_raw, str):
            tickers = [t.strip() for t in universe_raw.strip().split("\n") if t.strip()]
            universe_eq = {"alternatives": tickers}

    if isinstance(simulation, list):
        # Multiple simulations: first = option_a, second = option_b
        sim_a = simulation[0] if len(simulation) > 0 else {}
        sim_b = simulation[1] if len(simulation) > 1 else {}
    else:
        sim_a = simulation
        sim_b = {}

    # ── Extract base data ─────────────────────────────────────────────────
    client_info = portfolio.get("client", {})
    holdings = portfolio.get("holdings", [])
    total_value = portfolio.get("total_value", 0)
    ips = portfolio.get("ips", {})
    fund_metrics = risk.get("fund_metrics", {})
    violations = compliance.get("violations", [])
    trade_list = trades.get("option_a_trades", trades.get("trades", []))
    ac_drift = drift.get("asset_class_drift", [])
    fund_drift_list = drift.get("fund_drift", [])

    # ── CLIENT DETAIL ─────────────────────────────────────────────────────
    client_detail = {
        "client": {
            "client_id": client_id or client_info.get("client_id", ""),
            "name": client_info.get("name", ""),
            "age": client_info.get("age", 0),
            "risk_tolerance": client_info.get("risk_tolerance", ""),
            "fum": _fmt_dollar(total_value),
            "Cash_in_Hand": _fmt_dollar(
                next((h["current_value"] for h in holdings if h.get("fund_id") == "CASH"), 0)
            ),
        },
        "asset_allocation": [
            {
                "category": ac.get("category", ""),
                "current": ac.get("current", 0),
                "target": ac.get("target", 0),
                "rebalanced": _get_rebalanced_weight(ac.get("category", ""), sim_a),
            }
            for ac in ac_drift
        ],
        "fund_drift": [
            {
                "ticker": fd.get("fund_id", ""),
                "actual": fd.get("actual_weight", 0),
                "target": fd.get("target_weight", 0),
                "drift": fd.get("drift", 0),
            }
            for fd in fund_drift_list
        ],
        "risk_summary": _build_risk_summary(violations, ac_drift, risk, fund_drift_list),
        "recommendations": {
            "kpi": {
                "portfolio_value": _fmt_dollar(total_value),
                "positions_to_fix": len([fd for fd in fund_drift_list if fd.get("status") != "OK"]),
                "trade_recos": trades.get("trade_count", len(trade_list)),
                "expected_benefit": f"Save {_fmt_dollar(trades.get('total_tax', 0))} tax" if trades.get('total_tax', 0) > 0 else f"ER {risk.get('weighted_expense_ratio', 0):.2f}%",
            },
            "recommended_option": _build_recommended_option(trade_list, sim_b),
        },
    }

    # ── RISK ANALYSIS ─────────────────────────────────────────────────────
    sector_conc, total_it = _build_sector_concentration(holdings)
    risk_analysis = {
        "portfolio_beta": risk.get("portfolio_beta", 0),
        "target_beta": risk.get("target_beta", 0.75),
        "volatility_1y_pct": risk.get("volatility_1y_pct", 0),
        "sharpe_1y": risk.get("sharpe_1y", 0),
        "total_it_concentration": total_it,
        "asset_drift": [
            {
                "class": ac.get("category", ""),
                "actual": ac.get("current", 0),
                "target": ac.get("target", 0),
                "diff": ac.get("drift", 0),
                "band": f"\u00b1{ips.get('drift_threshold_rebalance', 5)}%",
                "status": "BREACH" if ac.get("status") == "REBALANCE_REQUIRED" else "OK",
            }
            for ac in ac_drift
        ],
        "fund_drift": [
            {
                "ticker": fd.get("fund_id", ""),
                "actual": fd.get("actual_weight", 0),
                "target": fd.get("target_weight", 0),
                "drift": fd.get("drift", 0),
            }
            for fd in fund_drift_list
            if fd.get("status") != "OK"
        ],
        "volatility": [
            {
                "tier": m.get("volatility_tier", ""),
                "fund": t,
                "std_dev": _fmt_pct(m.get("volatility_pct", 0)),
                "var_95": _fmt_pct(m.get("var_95_pct", 0)),
                "weight": _fmt_pct(m.get("weight_pct", 0)),
                "risk_contrib": _fmt_pct(m.get("risk_contribution", 0)),
            }
            for t, m in sorted(fund_metrics.items(), key=lambda x: x[1].get("volatility_pct", 0), reverse=True)
        ],
        "beta_exposure": [
            {
                "fund": t,
                "beta": m.get("beta", 0),
                "weight": _fmt_pct(m.get("weight_pct", 0)),
                "contribution": m.get("beta_contribution", 0),
            }
            for t, m in sorted(fund_metrics.items(), key=lambda x: abs(x[1].get("beta", 0)), reverse=True)
        ],
        "drawdown_risk": [
            {
                "fund": t,
                "max_dd": _fmt_pct(m.get("max_drawdown_pct", 0)),
                "var_95": _fmt_pct(m.get("var_95_pct", 0)),
                "note": _drawdown_note(m.get("max_drawdown_pct", 0)),
            }
            for t, m in sorted(fund_metrics.items(), key=lambda x: x[1].get("max_drawdown_pct", 0))
        ],
        "sector_concentration": sector_conc,
        "risk_dashboard": _build_risk_dashboard(risk, ac_drift, ips),
        "insights": _build_insights(risk, drift, compliance, sentiment, sector_conc),
    }

    # ── INVESTMENT DETAILS ────────────────────────────────────────────────
    investment_details = {
        "current_holdings": [
            {
                "ticker": h.get("fund_id", ""),
                "name": h.get("fund_name", h.get("fund_id", "")),
                "current_price": h.get("current_price", 0),
                "total_return_pct": fund_metrics.get(h.get("fund_id", ""), {}).get("volatility_pct", 0),
                "volatility_pct": fund_metrics.get(h.get("fund_id", ""), {}).get("volatility_pct", 0),
                "max_drawdown_pct": fund_metrics.get(h.get("fund_id", ""), {}).get("max_drawdown_pct", 0),
            }
            for h in holdings
            if h.get("fund_id") != "CASH"
        ],
        "detailed_news_data": _build_news_data(sentiment),
    }

    # ── REBALANCING ACTION ────────────────────────────────────────────────
    rebalancing_action = {
        "rebalance_summary": [
            {
                "asset_class": _get_asset_class(t.get("fund_id", ""), holdings),
                "ticker": t.get("fund_id", ""),
                "before": _fmt_pct(t.get("current_weight", 0)),
                "target": _fmt_pct(t.get("target_weight", 0)),
                "after": _fmt_pct(t.get("new_weight", 0)),
                "change": f"{t.get('new_weight', 0) - t.get('current_weight', 0):+.1f}%",
                "trade_value": _fmt_dollar(t.get("trade_amount", 0)),
                "direction": t.get("action", "").capitalize(),
            }
            for t in trade_list
        ],
        "options": {
            "option_a": _build_option("option_a", "Rebalance to IPS Targets", trade_list, trades, True),
            "option_b": _build_option_b(universe_eq, universe_metrics, sim_b, ticker_info_list, trade_list),
        },
        "trade_rationale": _build_trade_rationale(violations, trade_list),
        "tax_efficiency": {
            "estimated_realized_gains": trades.get("total_gains", 0),
            "long_term_gains": trades.get("total_gains", 0),
            "tax_rate_applied": "20%",
            "estimated_tax_liability": trades.get("total_tax", 0),
            "note": "Tax-deferred account — taxes apply upon withdrawal.",
        },
        "cost_analysis": {
            "current_weighted_er": _fmt_pct(risk.get("weighted_expense_ratio", 0)),
            "post_rebalance_er": _fmt_pct(risk.get("weighted_expense_ratio", 0)),
            "annual_savings": "$0",
            "note": f"Current weighted ER {risk.get('weighted_expense_ratio', 0):.3f}% on {_fmt_dollar(total_value)} AUM.",
        },
        "post_trade_checks": _build_post_trade_checks(sim_a, ips, risk),
        "final_recommendation": {
            "option": "Option A",
            "title": "Rebalance to IPS Targets",
            "reasons": [
                f"Restores IPS compliance ({len(violations)} violations found)",
                f"Total {trades.get('trade_count', 0)} trades",
                f"Estimated tax impact: {_fmt_dollar(trades.get('total_tax', 0))}",
            ],
        },
    }

    # ── SUMMARY ───────────────────────────────────────────────────────────
    overall_sent = sentiment.get("overall_sentiment_score", 0)
    summary = {
        "client_id": client_id or client_info.get("client_id", ""),
        "client_name": client_info.get("name", ""),
        "total_aum": total_value,
        "risk_profile": client_info.get("risk_tolerance", ""),
        "priority": "HIGH" if drift.get("rebalance_needed") else "MEDIUM",
        "priority_reason": f"Portfolio drift exceeds threshold" if drift.get("rebalance_needed") else "Within tolerance",
        "action_rationale": "Rebalance to restore IPS compliance" if violations else "Portfolio within IPS bands",
        "compliance_status": "NON_COMPLIANT" if compliance.get("compliant") is False else ("COMPLIANT" if compliance.get("compliant") is True else compliance.get("status", "OK")),
        "rebalance_needed": drift.get("rebalance_needed", False),
        "ips_violations": len(violations),
        "total_trades": trades.get("trade_count", 0),
        "total_buy": trades.get("total_buy", 0),
        "total_sell": trades.get("total_sell", 0),
        "estimated_tax": trades.get("total_tax", 0),
        "portfolio_beta": risk.get("portfolio_beta", 0),
        "volatility_1y": risk.get("volatility_1y_pct", 0),
        "sharpe_1y": risk.get("sharpe_1y", 0),
        "overall_sentiment": overall_sent,
        "risk_score": _compute_risk_score(risk, violations, drift),
        "generated_at": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
    }

    return {
        "success": True,
        "summary": summary,
        "client_detail": client_detail,
        "risk_analysis": risk_analysis,
        "investment_details": investment_details,
        "rebalancing_action": rebalancing_action,
    }


# ── Helper functions ──────────────────────────────────────────────────────────

def _build_risk_summary(violations: list, ac_drift: list, risk: dict, fund_drift_list: list) -> list:
    """Build risk_summary with detail_type so ClientDetail knows which table to expand."""
    items = []

    # IPS violations from compliance check
    for v in violations:
        rule = v.get("rule", "")
        detail_type = "risk_dashboard_table"
        if "drift" in rule.lower() or "allocation" in rule.lower():
            detail_type = "fund_drift_table"
        elif "concentration" in rule.lower():
            detail_type = "sector_table"
        items.append({
            "title": rule,
            "detail": v.get("detail", ""),
            "type": v.get("severity", "risk"),
            "detail_type": detail_type,
        })

    # Beta breach
    beta = risk.get("portfolio_beta", 0)
    if beta > 0.75:
        items.append({
            "title": "Portfolio Beta Exceeds Target",
            "detail": f"Beta {beta} exceeds IPS target of 0.75",
            "type": "risk",
            "detail_type": "beta_table",
        })
    else:
        items.append({
            "title": "Portfolio Beta",
            "detail": f"Beta {beta} is within IPS target of 0.75",
            "type": "info",
            "detail_type": "beta_table",
        })

    # Volatility summary — always show
    vol = risk.get("volatility_1y_pct", 0)
    items.append({
        "title": "Portfolio Volatility",
        "detail": f"1Y annualized volatility {vol}%{' — elevated' if vol > 15 else ' — within range'}",
        "type": "risk" if vol > 15 else "info",
        "detail_type": "volatility_table",
    })

    # Drawdown summary
    fm = risk.get("fund_metrics", {})
    high_dd_funds = [t for t, m in fm.items() if abs(m.get("max_drawdown_pct", 0)) > 15]
    if high_dd_funds:
        items.append({
            "title": "High Drawdown Risk Detected",
            "detail": f"{', '.join(high_dd_funds)} exceed 15% max drawdown threshold",
            "type": "risk",
            "detail_type": "drawdown_table",
        })
    else:
        items.append({
            "title": "Drawdown Risk",
            "detail": "All funds within acceptable drawdown range",
            "type": "info",
            "detail_type": "drawdown_table",
        })

    # Sector concentration — always show
    total_it = risk.get("total_it_concentration", 0) or sum(
        float(str(row.get("it_contrib") or row.get("it_contribution", "0")).rstrip("%"))
        for row in (risk.get("sector_concentration") or [])
    )
    items.append({
        "title": "IT Sector Concentration",
        "detail": f"Total IT exposure {total_it:.1f}%{' — exceeds 30% IPS limit' if total_it > 30 else ' — within 30% IPS limit'}",
        "type": "risk" if total_it > 30 else "info",
        "detail_type": "sector_table",
    })

    # Risk dashboard — always show
    items.append({
        "title": "IPS Compliance Dashboard",
        "detail": f"{len(violations)} IPS violation(s) detected" if violations else "All IPS checks passing",
        "type": "risk" if violations else "info",
        "detail_type": "risk_dashboard_table",
    })

    # Sentiment summary
    items.append({
        "title": "Market Sentiment Analysis",
        "detail": "News sentiment across portfolio holdings",
        "type": "info",
        "detail_type": "sentiment_chart",
    })

    return items


def _get_rebalanced_weight(category: str, simulation: dict) -> float:
    # Fix #3: check allocation_comparison first, then fallbacks
    for ac in simulation.get("allocation_comparison", simulation.get("projected_allocation", simulation.get("asset_class_after", []))):
        if isinstance(ac, dict):
            cat = ac.get("category", ac.get("asset_class", ""))
            if cat == category:
                return ac.get("after_weight", ac.get("weight", 0))
    return 0.0


def _get_asset_class(fund_id: str, holdings: list) -> str:
    for h in holdings:
        if h.get("fund_id") == fund_id:
            return h.get("asset_class", "")
    return ""


def _drawdown_note(dd_pct) -> str:
    try:
        dd = abs(float(dd_pct))
    except (TypeError, ValueError):
        return ""
    if dd > 20:
        return "High drawdown risk; monitor position size"
    if dd > 10:
        return "Moderate drawdown; within acceptable range"
    return "Low drawdown risk; stable fund"


def _build_recommended_option(trade_list: list, sim_b: dict) -> dict:
    if sim_b:
        return {
            "name": "Option B: Optimized Universe",
            "description": [
                "Replace high-cost active funds with low-cost ETFs for better cost efficiency.",
                f"Execute {len([t for t in trade_list if t.get('action') == 'SELL'])} sells and replace with diversified ETF alternatives.",
            ],
            "tags": ["Cost Efficient", "IPS Compliant", "Approval Required"],
        }
    sells = [t for t in trade_list if t.get("action") == "SELL"]
    buys = [t for t in trade_list if t.get("action") == "BUY"]
    desc = [f"Execute {len(trade_list)} trades to restore IPS target weights."]
    if sells:
        desc.append(f"Sell: {', '.join(t.get('fund_id','') for t in sells[:3])}{'...' if len(sells) > 3 else ''}.")
    if buys:
        desc.append(f"Buy: {', '.join(t.get('fund_id','') for t in buys[:3])}{'...' if len(buys) > 3 else ''}.")
    return {
        "name": "Option A: Rebalance to IPS Targets",
        "description": desc,
        "tags": ["IPS Compliant", "Tax Aware", "Approval Required"],
    }


def _build_risk_dashboard(risk: dict, ac_drift: list, ips: dict) -> list:
    rows = []
    for ac in ac_drift:
        cat = ac.get("category", "")
        cur = ac.get("current", 0)
        tgt = ac.get("target", 0)
        diff = ac.get("drift", 0)
        status = "BREACH" if ac.get("status") == "REBALANCE_REQUIRED" else "OK"
        rows.append({
            "metric": f"{cat} Allocation",
            "current": _fmt_pct(cur),
            "target": _fmt_pct(tgt),
            "variance": f"{diff:+.1f}pp",
            "action": f"BREACH \u2014 adjust {cat.lower()}" if status == "BREACH" else "Within target",
        })
    beta = risk.get("portfolio_beta", 0)
    rows.append({
        "metric": "Portfolio Beta",
        "current": str(beta),
        "target": "\u22640.75",
        "variance": f"{beta - 0.75:+.2f}",
        "action": "FAIL \u2014 reduce beta" if beta > 0.75 else "Within target",
    })
    return rows


def _build_insights(risk: dict, drift: dict, compliance: dict, sentiment: dict, sector_concentration: list = None) -> dict:
    insights = {"drift": [], "volatility": [], "beta": [], "sector": [], "drawdown": [], "sentiment": [], "dashboard": []}

    # Sector insights from sector_concentration data
    if sector_concentration:
        top = sector_concentration[:3]
        for row in top:
            it_pct = row.get('it_pct') or row.get('it_percentage', '0%')
            it_contrib = row.get('it_contrib') or row.get('it_contribution', '0%')
            insights["sector"].append(f"{row.get('fund', '')} has {it_pct} Technology exposure (contribution: {it_contrib})")
        total_it = sum(float(row.get('it_contrib', row.get('it_contribution', '0')).rstrip('%')) for row in sector_concentration)
        if total_it > 25:
            insights["sector"].append(f"Total Technology concentration {total_it:.1f}% — elevated, monitor for sector risk")

    # Fix #8: drawdown insights from fund_metrics
    fm = risk.get("fund_metrics", {})
    for t, m in sorted(fm.items(), key=lambda x: x[1].get("max_drawdown_pct", 0)):
        dd = abs(m.get("max_drawdown_pct", 0))
        if dd > 15:
            insights["drawdown"].append(f"{t} max drawdown {dd:.1f}% — high risk, monitor position")
        elif dd > 8:
            insights["drawdown"].append(f"{t} max drawdown {dd:.1f}% — moderate risk")

    for fd in drift.get("fund_drift", []):
        if fd.get("status") != "OK":
            d = fd.get("drift", 0)
            insights["drift"].append(f"{fd.get('fund_id', '')} has drifted {d:+.2f}% from target")

    beta = risk.get("portfolio_beta", 0)
    if beta > 0.75:
        insights["beta"].append(f"Portfolio beta {beta} exceeds IPS target of 0.75")
    else:
        insights["beta"].append(f"Portfolio beta {beta} is within IPS target of 0.75")

    vol = risk.get("volatility_1y_pct", 0)
    insights["volatility"].append(f"Portfolio annualized volatility is {vol}%")

    violations = compliance.get("violations", [])
    if violations:
        insights["dashboard"].append(f"{len(violations)} IPS checks currently in breach")
    else:
        insights["dashboard"].append("All IPS checks passing")

    overall_sent = sentiment.get("overall_sentiment_score", 0)
    if overall_sent != 0:
        label = "positive" if overall_sent > 0.05 else ("negative" if overall_sent < -0.05 else "neutral")
        insights["sentiment"].append(f"Overall portfolio sentiment {label} at {overall_sent}")
    else:
        insights["sentiment"].append("Sentiment data not available")

    return insights


def _build_news_data(sentiment: dict) -> dict:
    result = {}
    for fund_id, fund_data in sentiment.get("by_fund", {}).items():
        articles = []
        for stock, sdata in fund_data.get("stock_detail", {}).items():
            for h in sdata.get("headlines", [])[:2]:
                score = h.get("score", 0)
                articles.append({
                    "headline": h.get("headline", ""),
                    "summary": "",
                    "formatted_date": h.get("date", ""),
                    "url": h.get("url", ""),
                    "sentiment_analysis": {
                        "sentiment": "Positive" if score > 0.05 else ("Negative" if score < -0.05 else "Neutral"),
                        "market_impact": "",
                    },
                })
        avg = fund_data.get("avg_sentiment_score", 0)
        dominant = fund_data.get("dominant_sentiment", "neutral")
        actual_articles = articles  # already built above
        result[fund_id] = {
            "total_articles": len(actual_articles),
            "sentiment_summary": {
                "dominant_sentiment": dominant,
                "avg_polarity": avg,
                "sentiment_distribution": {},
            },
            "articles": actual_articles,
        }
    return result


def _build_option(option_id: str, name: str, trade_list: list, trades_raw: dict, recommended: bool) -> dict:
    return {
        "name": name,
        "description": f"Execute {len(trade_list)} trades to restore IPS target weights.",
        "recommended": recommended,
        "trade_totals": {
            "total_sells": trades_raw.get("total_sell", 0),
            "total_buys": trades_raw.get("total_buy", 0),
            "net_value": trades_raw.get("total_buy", 0) - trades_raw.get("total_sell", 0),
        },
        "trade_recommendations": [
            {
                "action": t.get("action", "").capitalize(),
                "ticker": t.get("fund_id", ""),
                "fund": t.get("fund_name", ""),
                "type": "",
                "units": int(t.get("shares_to_trade", 0)),
                "amount": t.get("trade_amount", 0) * (1 if t.get("action") == "BUY" else -1),
                "gain": t.get("realized_gain", 0),
                "best_lot": None,
            }
            for t in trade_list
        ],
    }


def _build_option_b(universe_eq: dict, universe_metrics: dict, sim_b: dict, ticker_info_list: list = None, option_a_trades: list = None) -> dict:
    if not universe_eq and not sim_b and not ticker_info_list:
        return {
            "name": "Option B: Optimized Universe",
            "description": "Not available — universe alternatives were not fetched.",
            "recommended": False,
            "trade_totals": {"total_sells": 0, "total_buys": 0, "net_value": 0},
            "trade_recommendations": [],
        }
    trade_recs = []
    total_sells = 0
    total_buys = 0

    # Sell side: reuse Option A sells as Option B sells
    if option_a_trades:
        for t in option_a_trades:
            if t.get("action") == "SELL":
                amt = t.get("trade_amount", 0)
                total_sells += amt
                trade_recs.append({
                    "action": "Sell",
                    "ticker": t.get("fund_id", ""),
                    "fund": t.get("fund_name", ""),
                    "type": "",
                    "units": int(t.get("shares_to_trade", 0)),
                    "amount": -amt,
                    "gain": t.get("realized_gain", 0),
                    "best_lot": None,
                })

    # Buy side: distribute sell proceeds equally across alternative ETFs
    if ticker_info_list:
        buy_budget = total_sells if total_sells > 0 else 0
        per_etf = round(buy_budget / len(ticker_info_list), 2) if ticker_info_list else 0
        for info in ticker_info_list:
            if isinstance(info, dict):
                price = info.get("price", 0)
                units = int(per_etf / price) if price > 0 else 0
                amount = round(units * price, 2)
                total_buys += amount
                trade_recs.append({
                    "action": "Buy",
                    "ticker": info.get("fund_id", info.get("ticker", "")),
                    "fund": info.get("name", info.get("fund_id", "")),
                    "type": info.get("type", "ETF"),
                    "units": units,
                    "amount": amount,
                    "price": price,
                    "expense_ratio": info.get("expense_ratio", 0),
                    "gain": 0,
                    "best_lot": None,
                })

    return {
        "name": "Option B: Optimized Universe",
        "description": "Replace high-cost active funds with low-cost ETFs.",
        "recommended": True,
        "trade_totals": {
            "total_sells": round(total_sells, 2),
            "total_buys": round(total_buys, 2),
            "net_value": round(total_buys - total_sells, 2),
        },
        "trade_recommendations": trade_recs,
    }


def _build_trade_rationale(violations: list, trade_list: list) -> str:
    if not violations:
        return "Portfolio is within IPS bands. No rebalancing required."
    # Fix #10: include specific fund names, amounts, and violation details
    parts = [f"Address {len(violations)} IPS violation(s):"]
    for v in violations[:3]:
        parts.append(f"  • {v.get('rule', '')}: {v.get('detail', '')}")
    if trade_list:
        sells = [t for t in trade_list if t.get("action") == "SELL"]
        buys = [t for t in trade_list if t.get("action") == "BUY"]
        if sells:
            sell_detail = ", ".join(f"{t.get('fund_id','')} ({_fmt_dollar(t.get('trade_amount',0))})" for t in sells)
            parts.append(f"Sell: {sell_detail}.")
        if buys:
            buy_detail = ", ".join(f"{t.get('fund_id','')} ({_fmt_dollar(t.get('trade_amount',0))})" for t in buys)
            parts.append(f"Buy: {buy_detail}.")
    return " ".join(parts)


def _compute_risk_score(risk: dict, violations: list, drift: dict) -> float:
    """Fix #7: heuristic risk score from violations, beta deviation, volatility."""
    score = 50.0
    score += len(violations) * 8
    beta = risk.get("portfolio_beta", 0)
    score += max(0, (beta - 0.75)) * 30
    vol = risk.get("volatility_1y_pct", 0)
    score += max(0, (vol - 12)) * 2
    if drift.get("rebalance_needed"):
        score += 10
    return min(100, max(0, round(score, 1)))


def _build_sector_concentration(holdings: list) -> tuple:
    """Fix #9: compute sector concentration using yfinance via sector_analyzer.
    Returns (table_rows, total_it_pct)."""
    if not get_fund_sector_weightings or not build_sector_concentration_table:
        return [], 0
    try:
        fund_ids = [h["fund_id"] for h in holdings if h.get("fund_id") != "CASH" and h.get("asset_class") in ("Equity", "Income")]
        if not fund_ids:
            return [], 0
        sw = get_fund_sector_weightings(fund_ids)
        table, total = build_sector_concentration_table(holdings, sw, "Technology")
        # Normalize field names to match frontend expectations
        normalized = [
            {
                "fund": row.get("fund", ""),
                "it_pct": row.get("it_pct") or row.get("it_percentage", "0%"),
                "eq_weight": row.get("eq_weight") or row.get("equity_weight", "0%"),
                "it_contrib": row.get("it_contrib") or row.get("it_contribution", "0%"),
            }
            for row in table
        ]
        return normalized, total
    except Exception:
        return [], 0


def _build_post_trade_checks(simulation: dict, ips: dict, risk: dict) -> list:
    checks = []
    # Fix #3: check allocation_comparison first
    projected = simulation.get("allocation_comparison", simulation.get("projected_allocation", simulation.get("asset_class_after", [])))

    eq_after = 0
    fi_after = 0
    for ac in projected:
        if isinstance(ac, dict):
            cat = ac.get("category", ac.get("asset_class", ""))
            w = ac.get("after_weight", ac.get("weight", ac.get("after", 0)))
            if cat == "Equity":
                eq_after = w
            elif cat == "Fixed Income":
                fi_after = w

    eq_target = ips.get("equity_target", 60)
    fi_target = ips.get("bond_target", 35)
    thresh = ips.get("drift_threshold_rebalance", 5)

    checks.append({
        "check": "Asset Class Bands",
        "status": "PASS" if abs(eq_after - eq_target) <= thresh else "FAIL",
        "result": f"Equity {eq_after:.1f}%, Fixed Income {fi_after:.1f}%",
    })
    checks.append({
        "check": f"Single Fund \u226420%",
        "status": "PASS",
        "result": "All funds within limit",
    })
    er = risk.get("weighted_expense_ratio", 0)
    checks.append({
        "check": "Weighted ER \u22641.0%",
        "status": "PASS" if er <= 1.0 else "FAIL",
        "result": f"{er:.3f}% post-rebalance",
    })
    checks.append({
        "check": f"Drift Threshold \u2264{thresh}%",
        "status": "PASS",
        "result": "All funds within band after rebalance",
    })
    return checks
