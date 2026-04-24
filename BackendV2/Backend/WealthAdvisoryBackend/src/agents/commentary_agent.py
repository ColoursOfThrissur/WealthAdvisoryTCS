"""
Commentary Agent - Step 5: Professional market commentary with sector/index data
"""
import os
from typing import Dict
from dotenv import load_dotenv

load_dotenv()

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage
from functions.market_data_fetcher import (
    fetch_sector_performance,
    fetch_index_performance,
    fetch_holdings_period_returns,
    identify_top_performers,
    identify_laggards
)


from observability.langchain_adapter import LangChainObservabilityAdapter


class CommentaryAgent:
    """Step 5: Market Commentary"""
    
    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            temperature=0.7,
            google_api_key=os.getenv("GEMINI_API_KEY")
        )
        self.observer = LangChainObservabilityAdapter(
            agent_name="commentary_agent",
            description="Generates professional market commentary",
            evaluators=["llm_judge"],
            llm_judge_dimensions=["helpfulness", "accuracy", "hallucination", "safety"],
            llm_judge_model="gpt-4o-mini",
        )
    
    async def execute(self, state_data: Dict) -> Dict:
        """Generate professional market commentary with sector/index context"""
        try:
            holdings = state_data.get("holdings", [])
            period = state_data.get("period", {})
            section_results = state_data.get("section_results", {})
            
            performance_data = section_results.get("performance_summary", {})
            
            portfolio_return = performance_data.get('metrics', {}).get('portfolio_return', 0)
            benchmark_return = performance_data.get('metrics', {}).get('benchmark_return', 0)
            benchmark_raw = state_data.get('benchmark', {})
            if isinstance(benchmark_raw, dict):
                benchmark_name = benchmark_raw.get('name', 'S&P 500')
            else:
                benchmark_names = {"^GSPC": "S&P 500", "^DJI": "Dow Jones", "^IXIC": "NASDAQ", "SPY": "S&P 500 ETF", "QQQ": "NASDAQ 100 ETF"}
                benchmark_name = benchmark_names.get(str(benchmark_raw), str(benchmark_raw) or 'S&P 500')
            
            period_name = period.get('name', 'Q4-2025') if isinstance(period, dict) else str(period)
            start_date = period.get('start_date', '2025-10-01') if isinstance(period, dict) else '2025-10-01'
            end_date = period.get('end_date', '2025-12-31') if isinstance(period, dict) else '2025-12-31'
            
            # Fetch sector and index performance
            sector_returns = await fetch_sector_performance(start_date, end_date)
            index_returns = await fetch_index_performance(start_date, end_date)
            holdings_returns = await fetch_holdings_period_returns(holdings, start_date, end_date)
            
            # Identify leaders and laggards
            top_sectors = identify_top_performers(sector_returns, 3)
            lagging_sectors = identify_laggards(sector_returns, 2)
            
            # Generate commentary using Gemini
            commentary = await self._generate_commentary(
                period_name,
                portfolio_return,
                benchmark_return,
                benchmark_name,
                holdings,
                holdings_returns,
                sector_returns,
                index_returns,
                top_sectors,
                lagging_sectors
            )
            
            return {
                "status": "complete",
                "section": "market_commentary",
                "commentary": commentary['full'],
                "market_summary": commentary['market_summary'],
                "portfolio_impact": commentary['portfolio_impact'],
                "outlook": commentary['outlook'],
                "sector_performance": sector_returns,
                "index_performance": index_returns
            }
            
        except Exception as e:
            import traceback
            return {
                "status": "error",
                "error": f"{str(e)}\n{traceback.format_exc()}"
            }
    

    async def _generate_commentary(self, period: str, portfolio_return: float, 
                                   benchmark_return: float, benchmark_name: str,
                                   holdings: list, holdings_returns: dict,
                                   sector_returns: dict, index_returns: dict,
                                   top_sectors: list, lagging_sectors: list) -> Dict:
        """Generate professional AI commentary with sector/index context"""
        
        tickers = [h.get('ticker') for h in holdings[:5] if h.get('ticker')]
        
        # Format sector performance
        sector_context = f"Top performers: {', '.join(top_sectors)}. Laggards: {', '.join(lagging_sectors)}."
        
        # Format index performance
        index_context = ", ".join([f"{name} {ret:+.1f}%" for name, ret in index_returns.items()])
        
        # Identify portfolio holdings performance
        top_holdings_perf = []
        for ticker in tickers:
            if ticker in holdings_returns:
                top_holdings_perf.append(f"{ticker} {holdings_returns[ticker]:+.1f}%")
        
        # Calculate basis points for professional language
        alpha = portfolio_return - benchmark_return
        basis_points = int(abs(alpha) * 100)
        
        messages = [
            SystemMessage(content="""You are a CFP® professional writing market commentary for a quarterly wealth management report. 
            Write in the style of professional wealth advisors - clear, factual, and client-focused. 
            Use specific numbers and basis points terminology. Avoid generic statements."""),
            HumanMessage(content=f"""
Write professional market commentary for {period} following this structure:

DATA PROVIDED:
- {benchmark_name}: {benchmark_return:+.2f}%
- Portfolio Return: {portfolio_return:+.2f}% (Alpha: {alpha:+.2f}% or {basis_points} basis points)
- Sector Leaders: {', '.join(top_sectors)}
- Sector Laggards: {', '.join(lagging_sectors)}
- Other Indices: {index_context}
- Top Holdings: {', '.join(top_holdings_perf)}

Write 3 detailed paragraphs:

1. Q{period[-4:]} Market Review (3-4 sentences):
   - Start with "Global equity markets" or "US equity markets"
   - Mention the {benchmark_name} performance and what drove it
   - Reference sector performance (technology, consumer discretionary, utilities, real estate)
   - Mention international markets (MSCI EAFE) and currency impacts
   - Reference Federal Reserve policy or interest rate environment

2. Portfolio Impact (2-3 sentences):
   - Explain what drove portfolio performance vs benchmark
   - Reference specific positions or asset classes (mid-cap, technology, QQQ, etc.)
   - Mention any drags (fixed income, international bonds)
   - Use "basis points" terminology

3. Outlook & Positioning (3-4 sentences):
   - Forward-looking view for the coming year
   - Federal Reserve expectations
   - Portfolio positioning strategy (quality equities, duration, real assets)
   - Mention cash position (5%) for liquidity and optionality
   - Reference next rebalancing schedule

Use professional wealth management language. Be specific with numbers. Write as if for a $1M+ client.
""")
        ]
        
        response = await self.observer.ainvoke(self.llm, messages, metadata={"operation": "market_commentary"})
        content = response.content
        
        # Parse sections more intelligently
        paragraphs = [p.strip() for p in content.split('\n\n') if p.strip() and not p.strip().startswith('#')]
        
        market_summary = ""
        portfolio_impact = ""
        outlook = ""
        
        # Try to identify sections by content
        for para in paragraphs:
            para_lower = para.lower()
            # Remove section headers if present
            para_clean = para.split(':', 1)[-1].strip() if ':' in para[:50] else para
            
            if not market_summary and any(word in para_lower for word in ['market', 'equity', 'quarter', 'federal reserve', 'sector']):
                market_summary = para_clean
            elif not portfolio_impact and any(word in para_lower for word in ['portfolio', 'overweight', 'position', 'contributor', 'basis points']):
                portfolio_impact = para_clean
            elif not outlook and any(word in para_lower for word in ['outlook', 'looking', 'forward', 'expect', 'maintain', 'rebalance']):
                outlook = para_clean
        
        # Fallback with enhanced language
        if not market_summary:
            market_summary = (f"Global equity markets posted positive returns in {period}, with US large-cap stocks "
                            f"advancing modestly. The {benchmark_name} gained {benchmark_return:+.2f}% for the quarter. "
                            f"Technology and consumer discretionary sectors led performance, while utilities and real estate lagged.")
        if not portfolio_impact:
            if alpha > 0:
                portfolio_impact = (f"The portfolio's overweight position in domestic mid-cap equities and technology "
                                  f"were the primary contributors to outperformance relative to the benchmark during the quarter. "
                                  f"The portfolio gained {portfolio_return:+.2f}%, outpacing the {benchmark_name} by {basis_points} basis points.")
            else:
                portfolio_impact = (f"The portfolio returned {portfolio_return:+.2f}% during {period}. "
                                  f"The diversified fixed income allocation was a modest drag in a period dominated by large-cap growth equities.")
        if not outlook:
            outlook = (f"Looking into the coming year, we remain constructively positioned in US equities while being mindful of "
                      f"elevated valuations. We continue to recommend holding 5% in cash and short-term equivalents, which provides "
                      f"both a liquidity buffer and optionality to redeploy capital should volatility create more attractive entry points.")
        
        return {
            'full': content,
            'market_summary': market_summary,
            'portfolio_impact': portfolio_impact,
            'outlook': outlook
        }
