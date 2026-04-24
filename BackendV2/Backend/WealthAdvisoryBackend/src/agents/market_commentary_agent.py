"""
Market Commentary Agent - Generate professional market analysis
"""
import os
import re
from typing import Dict
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage


from observability.langchain_adapter import LangChainObservabilityAdapter


class MarketCommentaryAgent:
    """Generate professional market commentary for quarterly reports"""
    
    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            temperature=0.7,
            google_api_key=os.getenv("GEMINI_API_KEY")
        )
        self.observer = LangChainObservabilityAdapter(
            agent_name="market_commentary_agent",
            description="Generates market commentary for quarterly reports",
            evaluators=["llm_judge"],
            llm_judge_dimensions=["quality", "relevance", "tone", "hallucination", "safety"],
            llm_judge_model="gpt-4o-mini",
        )
    
    async def generate(self, portfolio_data: Dict, period: Dict, performance_data: Dict) -> Dict:
        """Generate market commentary section"""
        try:
            client_name = portfolio_data['client_name']
            period_name = period['name']
            
            # Extract performance metrics
            qtd_return = performance_data.get('metrics', {}).get('portfolio_return', 0)
            benchmark_return = performance_data.get('metrics', {}).get('benchmark_return', 0)
            benchmark_name = performance_data.get('benchmark_name', 'S&P 500')
            
            # Get top holdings for context
            holdings = portfolio_data.get('holdings', [])
            top_holdings = sorted(holdings, key=lambda x: x.get('shares', 0) * x.get('price', 0), reverse=True)[:5]
            holdings_summary = ", ".join([h.get('ticker', '') for h in top_holdings])
            
            # Generate market review
            market_review = await self._generate_market_review(period_name, benchmark_name, benchmark_return)
            
            # Generate portfolio impact
            portfolio_impact = await self._generate_portfolio_impact(
                client_name, qtd_return, benchmark_return, holdings_summary
            )
            
            # Generate outlook
            outlook = await self._generate_outlook(period_name)
            
            return {
                "section": "market_commentary",
                "market_review": market_review,
                "portfolio_impact": portfolio_impact,
                "outlook": outlook,
                "status": "complete",
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            import traceback
            return {
                "section": "market_commentary",
                "status": "error",
                "error": f"{str(e)}\n{traceback.format_exc()}",
                "timestamp": datetime.now().isoformat()
            }
    
    async def _generate_market_review(self, period_name: str, benchmark_name: str, benchmark_return: float) -> str:
        """Generate Q4 Market Review section"""
        messages = [
            SystemMessage(content="You are a CFP writing a quarterly market review. Write ONLY the paragraph content, NO headings, NO bold titles."),
            HumanMessage(content=f"""
Write a market review paragraph (3-4 sentences) for {period_name}:

- {benchmark_name} returned {benchmark_return:+.1f}% for the quarter
- Cover: equity performance, sector trends, interest rates, international markets

IMPORTANT: Write ONLY the paragraph text. Do NOT include:
- Headings like 'Market Review' or '**Market Review**'
- Bold section titles at the start
- Any markdown formatting for titles

Start directly with the content.""")
        ]
        
        response = await self.observer.ainvoke(self.llm, messages, metadata={"operation": "market_commentary_section"})
        content = response.content.strip()
        # Remove any heading patterns
        content = re.sub(r'^\*\*[^*]+\*\*:?\s*', '', content)
        content = re.sub(r'^#+\s+[^\n]+\n', '', content)
        lines = content.split('\n')
        return '\n'.join([l for l in lines if l.strip() and not l.strip().startswith('**') and not l.strip().lower().startswith('market')]).strip()
    
    async def _generate_portfolio_impact(self, client_name: str, qtd_return: float, 
                                        benchmark_return: float, holdings_summary: str) -> str:
        """Generate Portfolio Impact section"""
        messages = [
            SystemMessage(content="You are a CFP explaining portfolio performance. Write ONLY the paragraph content, NO headings, NO bold titles."),
            HumanMessage(content=f"""
Write a portfolio impact paragraph (2-3 sentences):

Portfolio: {qtd_return:+.1f}% | Benchmark: {benchmark_return:+.1f}% | Top Holdings: {holdings_summary}

Explain performance drivers and key contributors.

IMPORTANT: Write ONLY the paragraph. Do NOT include:
- Headings like 'Portfolio Impact' or '**Portfolio Impact**'
- Bold section titles
- Any markdown formatting for titles

Start directly with the content.""")
        ]
        
        response = await self.observer.ainvoke(self.llm, messages, metadata={"operation": "market_commentary_section"})
        content = response.content.strip()
        # Remove any heading patterns
        content = re.sub(r'^\*\*[^*]+\*\*:?\s*', '', content)
        content = re.sub(r'^#+\s+[^\n]+\n', '', content)
        lines = content.split('\n')
        return '\n'.join([l for l in lines if l.strip() and not l.strip().startswith('**') and not l.strip().lower().startswith('portfolio')]).strip()
    
    async def _generate_outlook(self, period_name: str) -> str:
        """Generate Outlook & Positioning section"""
        messages = [
            SystemMessage(content="You are a CFP providing market outlook. Write ONLY the paragraph content, NO headings, NO bold titles."),
            HumanMessage(content=f"""
Write an outlook paragraph (3-4 sentences) for the period following {period_name}:

Cover: market outlook, Fed policy, portfolio positioning, rebalancing plans.

IMPORTANT: Write ONLY the paragraph. Do NOT include:
- Headings like 'Outlook' or '**Outlook & Positioning**'
- Bold section titles
- Any markdown formatting for titles

Start directly with the content.""")
        ]
        
        response = await self.observer.ainvoke(self.llm, messages, metadata={"operation": "market_commentary_section"})
        content = response.content.strip()
        # Remove any heading patterns
        content = re.sub(r'^\*\*[^*]+\*\*:?\s*', '', content)
        content = re.sub(r'^#+\s+[^\n]+\n', '', content)
        lines = content.split('\n')
        return '\n'.join([l for l in lines if l.strip() and not l.strip().startswith('**') and not l.strip().lower().startswith('outlook')]).strip()
