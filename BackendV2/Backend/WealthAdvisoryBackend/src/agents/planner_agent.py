"""
Planner Agent - The brain that orchestrates report generation
Uses Gemini 2.5 Flash to interpret vague prompts and guide users
"""
import os
import json
from typing import Dict, Optional, List
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage

from core.report_schema import REPORT_SCHEMA, get_next_step, get_required_inputs, get_missing_dependencies
from core.state_manager import WorkflowState
from core.tool_registry import get_tools_for_section
from agents.client_lookup_agent import client_lookup_agent
from observability.langchain_adapter import LangChainObservabilityAdapter


class PlannerAgent:
    """
    Planner Agent - Interprets user intent and orchestrates workflow
    
    Responsibilities:
    - Parse vague user prompts
    - Determine current step in workflow
    - Identify missing inputs
    - Guide user with clarifying questions
    - Route to appropriate section agent
    """
    
    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            temperature=0.3,
            google_api_key=os.getenv("GEMINI_API_KEY")
        )
        self.observer = LangChainObservabilityAdapter(
            agent_name="planner_agent",
            description="Interprets user intent and orchestrates report workflow",
            evaluators=["llm_judge"],
            llm_judge_dimensions=["accuracy", "helpfulness", "hallucination", "safety"],
            llm_judge_model="gpt-4o-mini",
        )
    
    async def interpret_user_intent(self, user_message: str, state: WorkflowState) -> Dict:
        """
        Interpret what the user wants to do
        
        Returns:
            {
                "intent": "generate_report" | "generate_section" | "provide_data" | "question",
                "section_requested": "performance_summary" | None,
                "data_provided": {"client_name": "John", ...} | None,
                "client_found": True | False,
                "client_data": {...} | None,
                "needs_clarification": True | False,
                "clarification_question": "..." | None
            }
        """
        
        # First, try to extract client name from message using agent
        extracted_client = await client_lookup_agent.extract_client_from_message(user_message)
        client_found = False
        client_data = None
        
        if extracted_client:
            # Use agent to find and load client data
            lookup_result = await client_lookup_agent.find_and_load_client(extracted_client)
            if lookup_result["found"]:
                client_found = True
                client_data = lookup_result
                print(f"[PlannerAgent] Found client: {lookup_result['client']['name']}")
        
        # Check what data we already have
        has_holdings = 'holdings' in state.collected_data or client_found
        has_period = 'period' in state.collected_data
        has_client = 'client_name' in state.collected_data or client_found
        
        # Get current date for context
        current_date = datetime.now().strftime("%Y-%m-%d")
        current_quarter = f"Q{(datetime.now().month - 1) // 3 + 1}-{datetime.now().year}"
        
        system_prompt = f"""You are a financial report planning assistant. Your job is to understand what the user wants to do.

CURRENT DATE: {current_date}
CURRENT QUARTER: {current_quarter}

PERIOD PARSING RULES:
- "current quarter" / "this quarter" / "Q4" → "{current_quarter}"
- "last quarter" → previous quarter (e.g., Q3-2025 if current is Q4-2025)
- "YTD" / "year to date" → "YTD-{datetime.now().year}"
- "Q1 2025" / "Q1-2025" → "Q1-2025"
- Always convert natural language to format: "Q#-YYYY" or "YTD-YYYY"

IMPORTANT - CHECK STATE FIRST:
- Holdings available: {has_holdings}
- Period available: {has_period}
- Client name available: {has_client}
- Completed sections: {list(state.section_results.keys())}

IF DATA EXISTS, USE IT! Don't ask for it again.
IF HOLDINGS AVAILABLE (from client repository), DO NOT ask for portfolio file upload.

REPORT STRUCTURE:
{json.dumps(REPORT_SCHEMA, indent=2)}

CURRENT STATE:
{state.get_context_summary()}

TASK:
Analyze the user's message and determine their intent using semantic understanding.

Return a JSON object with:
- intent: "full_report" | "generate_section" | "provide_data" | "question"
- section_requested: section name or null
- data_provided: extracted data or null
- needs_clarification: true if missing critical data
- clarification_question: what to ask if needs_clarification

DECISION LOGIC:

1. FULL_REPORT Intent:
   Use when user wants a COMPLETE, COMPREHENSIVE report with ALL sections.
   Semantic indicators:
   - Explicitly says "full", "complete", "entire", "comprehensive"
   - Wants "all sections" or "everything"
   - Says "report" or "statement" without any qualifier
   Examples: "full report", "complete analysis", "quarterly statement", "generate report"
   
   DO NOT use for:
   - "portfolio summary" → this means performance_summary section only
   - "show me my portfolio" → this means performance_summary section only
   - Any request for SPECIFIC sections (even if multiple) → use generate_section
   - "performance and activity" → use generate_section with multiple sections

2. GENERATE_SECTION Intent:
   Use when user wants ONE OR MORE SPECIFIC sections (but not all).
   Semantic indicators:
   - Names specific aspects: performance, allocation, holdings, market, activity, planning
   - Uses "summary" (means performance summary, not full report)
   - Asks "how did I do" or "what's my return" (performance)
   - Asks "what do I own" or "my positions" (holdings)
   - Asks "how is it allocated" or "breakdown" (allocation)
   - Requests multiple specific sections: "performance and activity", "allocation and holdings"
   Examples: "portfolio summary", "show performance", "what's my allocation", "market commentary", "my holdings", "performance and activity"

3. PROVIDE_DATA Intent:
   Use when user is uploading/providing information.
   Examples: "here's the file", "uploaded portfolio", "client is John"

4. QUESTION Intent:
   Use when user asks about the process/system.
   Examples: "how does this work", "what do you need", "help"

SECTION MAPPING (semantic understanding):
- Performance/returns/gains/losses → "performance_summary"
- Allocation/distribution/breakdown/sectors/asset classes → "allocation_overview"
- Holdings/positions/stocks/securities/what I own → "holdings_detail"
- Market/commentary/news/outlook/what happened → "market_commentary"
- Activity/transactions/trades/buys/sells → "activity_summary"
- Planning/recommendations/advice/goals → "planning_notes"

MULTIPLE SECTIONS:
If user requests multiple specific sections (e.g., "performance and activity"), return:
- intent: "generate_section"
- section_requested: "performance_summary,activity_summary" (comma-separated list)

KEY RULE: Only use full_report if user explicitly wants ALL sections or says "full/complete/entire report".

EXAMPLES:
User: "Generate Q4 2025 report for John Mitchell" (client NOT in system, no data in state)
{{
  "intent": "full_report",
  "section_requested": null,
  "data_provided": {{"client_name": "John Mitchell", "period": "Q4-2025"}},
  "needs_clarification": true,
  "clarification_question": "Please upload the portfolio file to begin."
}}

User: "Generate report for David Chen" (client IS in system, holdings available)
{{
  "intent": "full_report",
  "section_requested": null,
  "data_provided": {{"client_name": "David Chen"}},
  "needs_clarification": true,
  "clarification_question": "What reporting period would you like for David Chen's report?"
}}

User: "market summary for current quarter" (no period in state)
{{
  "intent": "generate_section",
  "section_requested": "market_commentary",
  "data_provided": {{"period": "{current_quarter}"}},
  "needs_clarification": false,
  "clarification_question": null
}}

User: "portfolio report for Q4 2025" (no data in state)
{{
  "intent": "full_report",
  "section_requested": null,
  "data_provided": {{"period": "Q4-2025"}},
  "needs_clarification": true,
  "clarification_question": "Please provide the client's name and upload the portfolio file to begin."
}}

User: "Show me the allocation breakdown" (holdings already in state)
{{
  "intent": "generate_section",
  "section_requested": "allocation_overview",
  "data_provided": null,
  "needs_clarification": false,
  "clarification_question": null
}}

User: "market summary" or "get market commentary" (holdings + period in state)
{{
  "intent": "generate_section",
  "section_requested": "market_commentary",
  "data_provided": null,
  "needs_clarification": false,
  "clarification_question": null
}}

User: "yes" or "go ahead" or "continue" (after completing a section)
{{
  "intent": "generate_report",
  "section_requested": null,
  "data_provided": null,
  "needs_clarification": false,
  "clarification_question": null
}}

Return ONLY valid JSON, no other text."""

        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_message)
        ]
        
        response = await self.observer.ainvoke(self.llm, messages, metadata={"operation": "interpret_user_intent"})
        
        try:
            # Extract JSON from response
            content = response.content.strip()
            if content.startswith("```json"):
                content = content[7:-3].strip()
            elif content.startswith("```"):
                content = content[3:-3].strip()
            
            result = json.loads(content)
            
            # Add client data if found
            if client_found:
                result["client_found"] = True
                result["client_data"] = client_data
            else:
                result["client_found"] = False
                result["client_data"] = None
            
            return result
        except Exception as e:
            print(f"[PlannerAgent] Error parsing intent: {e}")
            # Fallback
            return {
                "intent": "question",
                "section_requested": None,
                "data_provided": None,
                "client_found": False,
                "client_data": None,
                "needs_clarification": True,
                "clarification_question": "I didn't understand. Could you rephrase?"
            }
    
    async def plan_next_action(self, state: WorkflowState) -> Dict:
        """
        Determine what should happen next based on current state
        
        Returns:
            {
                "action": "request_input" | "execute_section" | "complete",
                "section": step_number | None,
                "missing_inputs": [...],
                "message": "User-facing message"
            }
        """
        
        # Check if all steps complete
        if len(state.completed_steps) == REPORT_SCHEMA["total_steps"]:
            return {
                "action": "complete",
                "section": None,
                "missing_inputs": [],
                "message": "All sections complete! Ready to generate final PDF report."
            }
        
        # Get next step
        next_step = get_next_step(state.completed_steps)
        
        if not next_step:
            return {
                "action": "error",
                "section": None,
                "missing_inputs": [],
                "message": "Unable to determine next step. Please contact support."
            }
        
        step_num = next_step["step_number"]
        step_name = next_step["name"]
        
        # Check required inputs for this specific step
        required = get_required_inputs(step_num)
        missing = []
        
        for req in required["required"]:
            if req not in state.collected_data:
                missing.append(req)
        
        # Check dependencies (previous sections that must be complete)
        missing_deps = get_missing_dependencies(step_num, state.completed_steps)
        
        if missing:
            # Need to request inputs
            state.set_missing_inputs(missing)
            
            # Generate user-friendly message
            message = await self._generate_input_request_message(step_name, missing, state)
            
            return {
                "action": "request_input",
                "section": step_num,
                "missing_inputs": missing,
                "message": message
            }
        elif missing_deps:
            # Need to complete dependencies first
            dep_names = [REPORT_SCHEMA["steps"][d]["title"] for d in missing_deps]
            return {
                "action": "request_input",
                "section": step_num,
                "missing_inputs": [],
                "message": f"Cannot generate {next_step['title']} yet. Please complete: {', '.join(dep_names)} first."
            }
        else:
            # Ready to execute section
            tools_needed = get_tools_for_section(step_name)
            
            return {
                "action": "execute_section",
                "section": step_num,
                "missing_inputs": [],
                "message": f"Generating {next_step['title']}...",
                "tools": tools_needed
            }
    
    async def _generate_input_request_message(self, section_name: str, missing_inputs: List[str], state: WorkflowState) -> str:
        """Generate friendly message asking for missing inputs"""
        
        system_prompt = f"""You are a helpful financial assistant. Generate a friendly, conversational message asking the user for missing information.

SECTION: {section_name}
MISSING INPUTS: {', '.join(missing_inputs)}

CURRENT DATA: {json.dumps(state.collected_data, indent=2)}

Generate a short, friendly message (1-2 sentences) asking for the missing information. Be specific about what format is needed.

Examples:
- "Please upload your portfolio file (Excel or CSV format) to get started."
- "I need the reporting period. For example: Q4-2025, or a custom date range like 2025-10-01 to 2025-12-31."
- "Which benchmark would you like to use? (Default is S&P 500 / ^GSPC)"

Return ONLY the message text, no JSON."""

        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=f"Generate request message for: {', '.join(missing_inputs)}")
        ]
        
        response = await self.observer.ainvoke(self.llm, messages, metadata={"operation": "interpret_user_intent"})
        return response.content.strip()
    
    async def route_to_agent(self, section_number: int, state: WorkflowState) -> str:
        """
        Determine which section agent to use
        
        Returns:
            Agent class name (e.g., "PerformanceAgent")
        """
        step_config = REPORT_SCHEMA["steps"][section_number]
        return step_config["agent_class"]
    
    async def generate_progress_update(self, state: WorkflowState) -> str:
        """Generate progress summary for user"""
        
        total = REPORT_SCHEMA["total_steps"]
        completed = len(state.completed_steps)
        
        progress_pct = (completed / total) * 100
        
        completed_names = []
        for step_num in state.completed_steps:
            step_config = REPORT_SCHEMA["steps"][step_num]
            completed_names.append(step_config["title"])
        
        message = f"Progress: {completed}/{total} sections complete ({progress_pct:.0f}%)\n\n"
        message += "Completed:\n"
        for name in completed_names:
            message += f"  ✓ {name}\n"
        
        next_step = get_next_step(state.completed_steps)
        if next_step:
            message += f"\nNext: {next_step['title']}"
        
        return message
