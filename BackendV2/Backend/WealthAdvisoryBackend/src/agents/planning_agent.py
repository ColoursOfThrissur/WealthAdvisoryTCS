"""
Planning Agent - Step 7: Professional planning notes with goal progress
"""
import os
from typing import Dict
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage
from functions.narrative_generator import generate_action_items
from functions.narrative_generator import generate_action_items


from observability.langchain_adapter import LangChainObservabilityAdapter


class PlanningAgent:
    """Step 7: Planning Notes"""
    
    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            temperature=0.5,
            google_api_key=os.getenv("GEMINI_API_KEY")
        )
        self.observer = LangChainObservabilityAdapter(
            agent_name="planning_agent",
            description="Generates professional planning notes with goal progress",
            evaluators=["llm_judge"],
            llm_judge_dimensions=["helpfulness", "accuracy", "hallucination", "safety"],
            llm_judge_model="gpt-4o-mini",
        )
    
    async def execute(self, state_data: Dict) -> Dict:
        """Generate professional planning notes with action items"""
        try:
            client_name = state_data.get("client_name", "Client")
            period = state_data.get("period", {})
            goals = state_data.get("goals", [])
            section_results = state_data.get("section_results", {})
            
            performance_data = section_results.get("performance_summary", {})
            allocation_data = section_results.get("allocation_overview", {})
            
            portfolio_value = performance_data.get('portfolio_value', 0)
            drift_analysis = allocation_data.get('drift_analysis', {})
            
            period_name = period.get('name', 'Q4-2025') if isinstance(period, dict) else str(period)
            
            print(f"[PLANNING] Generating for {client_name}, portfolio value: ${portfolio_value:,.0f}")
            
            # Generate goal progress
            goal_progress = self._calculate_goal_progress(portfolio_value, goals)
            
            # Generate recommendations
            recommendations = await self._generate_recommendations(
                client_name,
                portfolio_value,
                goal_progress
            )
            
            # Generate action items
            action_items = generate_action_items(period_name, drift_analysis)
            
            # Next review date
            next_review = self._get_next_review_date(period_name)
            
            print(f"[PLANNING] Generated {len(action_items)} action items")
            
            return {
                "status": "complete",
                "section": "planning_notes",
                "recommendations": recommendations,
                "goal_progress": goal_progress,
                "action_items": action_items,
                "next_review": next_review
            }
            
        except Exception as e:
            import traceback
            print(f"[PLANNING] Error: {traceback.format_exc()}")
            return {
                "status": "error",
                "error": f"{str(e)}\n{traceback.format_exc()}"
            }
    
    async def _generate_recommendations(self, client_name: str, 
                                       portfolio_value: float,
                                       goal_progress: Dict) -> str:
        """Generate professional AI recommendations"""
        
        goal_text = ""
        if goal_progress:
            goal_text = f"""Current portfolio value: ${portfolio_value:,.0f}. 
Projected at retirement: ${goal_progress.get('projected_low', 0)/1e6:.1f}M–${goal_progress.get('projected_high', 0)/1e6:.1f}M
Target: ${goal_progress.get('target', 0)/1e6:.1f}M
Surplus: {goal_progress.get('surplus_low', 0):.0f}–{goal_progress.get('surplus_high', 0):.0f}%"""
        
        messages = [
            SystemMessage(content="""You are a CFP® professional writing financial planning notes for a quarterly wealth management report. 
            Write concise, actionable recommendations in 2-3 short paragraphs (2-3 sentences each)."""),
            HumanMessage(content=f"""
Generate concise planning recommendations for {client_name}:

{goal_text}

Write 2-3 SHORT paragraphs (2-3 sentences each):

1. Retirement Goal Progress: Current trajectory and surplus percentage
2. Recommendations: Key actions needed (contributions, rebalancing, reviews)

Be concise and specific. Each paragraph should be 2-3 sentences maximum.
""")
        ]
        
        response = await self.observer.ainvoke(self.llm, messages, metadata={"operation": "planning_notes"})
        return response.content
    
    def _calculate_goal_progress(self, portfolio_value: float, goals: list) -> Dict:
        """Calculate detailed progress toward goals with projections"""
        if not goals:
            return {}
        
        # Retirement goal projection
        retirement_goal = next((g for g in goals if 'retirement' in g.get('goal_type', '').lower()), None)
        
        if retirement_goal:
            target = retirement_goal.get('target_amount', 3900000)  # Default ~$3.9M
            annual_contrib = retirement_goal.get('annual_contribution', 25000)
            years_to_retire = retirement_goal.get('years_to_retirement', 10)
            assumed_return_low = 0.07  # 7%
            assumed_return_high = 0.08  # 8%
            
            # Project future value with contributions
            fv_low = self._future_value(portfolio_value, annual_contrib, assumed_return_low, years_to_retire)
            fv_high = self._future_value(portfolio_value, annual_contrib, assumed_return_high, years_to_retire)
            
            surplus_low = ((fv_low - target) / target) * 100
            surplus_high = ((fv_high - target) / target) * 100
            
            return {
                'type': 'retirement',
                'current': portfolio_value,
                'target': target,
                'projected_low': fv_low,
                'projected_high': fv_high,
                'surplus_low': surplus_low,
                'surplus_high': surplus_high,
                'annual_contribution': annual_contrib,
                'years_to_retirement': years_to_retire,
                'summary': (
                    f"Based on current portfolio value of ${portfolio_value:,.0f} and projected contributions of "
                    f"${annual_contrib:,.0f}/year through retirement, the household is projected to accumulate "
                    f"approximately ${fv_low/1e6:.1f}M–${fv_high/1e6:.1f}M at retirement (assuming {assumed_return_low*100:.0f}–{assumed_return_high*100:.0f}% nominal returns). "
                    f"This exceeds the target retirement funding level of ~${target/1e6:.1f}M by approximately {surplus_low:.0f}–{surplus_high:.0f}%, "
                    f"providing a comfortable margin of safety."
                )
            }
        
        return {}
    
    def _future_value(self, pv: float, pmt: float, rate: float, years: int) -> float:
        """Calculate future value with annual contributions"""
        # FV = PV * (1 + r)^n + PMT * [((1 + r)^n - 1) / r]
        fv_pv = pv * ((1 + rate) ** years)
        fv_pmt = pmt * (((1 + rate) ** years - 1) / rate)
        return fv_pv + fv_pmt
    
    def _get_next_review_date(self, period_name: str) -> str:
        """Get next review date based on period"""
        from datetime import datetime, timedelta
        
        # Add 3 months for quarterly review
        next_date = datetime.now() + timedelta(days=90)
        month_name = next_date.strftime("%B")
        year = next_date.year
        
        return f"Your next scheduled quarterly review meeting is tentatively set for mid-{month_name} {year}."
