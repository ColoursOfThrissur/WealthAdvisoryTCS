"""
Report Orchestrator - Main coordinator for agentic report generation
"""
import uuid
import json
from typing import Dict, Optional
from datetime import datetime
from pathlib import Path

from core.state_manager import state_manager, WorkflowState
from core.report_schema import REPORT_SCHEMA, get_missing_dependencies, get_required_inputs
from agents.planner_agent import PlannerAgent
from agents.parameters_agent import ParametersAgent
from agents.performance_agent import PerformanceAgent
from agents.allocation_agent import AllocationAgent
from agents.holdings_agent import HoldingsAgent
from agents.commentary_agent import CommentaryAgent
from agents.activity_agent import ActivityAgent
from agents.planning_agent import PlanningAgent
from agents.output_agent import OutputAgent


class ReportOrchestrator:
    """
    Main orchestrator that coordinates:
    - Planner Agent (interprets intent, plans next action)
    - State Manager (tracks progress)
    - Section Agents (execute specific sections)
    """
    
    def __init__(self):
        self.planner = PlannerAgent()
        self.agents = {
            "ParametersAgent": ParametersAgent(),
            "PerformanceAgent": PerformanceAgent(),
            "AllocationAgent": AllocationAgent(),
            "HoldingsAgent": HoldingsAgent(),
            "CommentaryAgent": CommentaryAgent(),
            "ActivityAgent": ActivityAgent(),
            "PlanningAgent": PlanningAgent(),
            "OutputAgent": OutputAgent()
        }
        self.active_websockets = {}  # session_id -> websocket
    
    async def send_status(self, session_id: str, message: str):
        """Send status update to client"""
        import asyncio
        ws = self.active_websockets.get(session_id)
        print(f"[SEND-STATUS] session={session_id}, ws={'YES' if ws else 'NO'}, msg={message}")
        if ws:
            try:
                await ws.send_json({
                    "type": "status",
                    "message": message
                })
                await asyncio.sleep(0.15)
            except Exception as e:
                print(f"[WS-ERROR] Failed to send status: {e}")
    
    async def handle_research_query(self, session_id: str, query: str, state: WorkflowState) -> Dict:
        """Handle research query with intelligent clarification questions"""
        import aiohttp
        
        # Check if we have a pending research query that needs completion
        pending_query = state.collected_data.get("_pending_research_query")
        pending_ticker = state.collected_data.get("_pending_research_ticker")
        pending_period = state.collected_data.get("_pending_research_period")
        
        # If we have pending ticker and user provides period, combine them
        if pending_ticker and not pending_period:
            # Check if current query looks like a time period
            import re
            time_patterns = [
                r'\bq[1-4]\b', r'\d{4}',  # Q1-Q4, years
                r'\blast\s+(quarter|year|month|week)\b',
                r'\bytd\b', r'\byear.to.date\b',
                r'\brecent\b', r'\blatest\b',
                r'\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\b',
                r'\d{1,2}[/-]\d{1,2}[/-]\d{2,4}'
            ]
            query_lower = query.lower()
            if any(re.search(pattern, query_lower) for pattern in time_patterns):
                # User provided time period, combine with pending ticker
                full_query = f"{pending_ticker} {query}"
                state.collected_data.pop("_pending_research_ticker", None)
                state.collected_data.pop("_pending_research_query", None)
                query = full_query
                print(f"[RESEARCH] Combined pending ticker with period: {full_query}")
        
        # If we have pending period and user provides ticker, combine them
        elif pending_period and not pending_ticker:
            # Check if current query looks like a ticker
            import re
            if re.search(r'\b[A-Z]{2,5}\b', query):
                # User provided ticker, combine with pending period
                full_query = f"{query} {pending_period}"
                state.collected_data.pop("_pending_research_period", None)
                state.collected_data.pop("_pending_research_query", None)
                query = full_query
                print(f"[RESEARCH] Combined pending period with ticker: {full_query}")
        
        # Check if query needs clarification
        clarification = await self._check_research_clarification(query, state)
        
        if clarification.get("needs_clarification"):
            # Store what we have so far
            import re
            
            # Check if query has ticker
            ticker_match = re.search(r'\b([A-Z]{2,5})\b', query)
            if ticker_match:
                state.add_data("_pending_research_ticker", ticker_match.group(1))
            
            # Check if query has time period
            time_patterns = [
                r'\bq[1-4]\b', r'\d{4}',
                r'\blast\s+(quarter|year|month|week)\b',
                r'\bytd\b', r'\byear.to.date\b',
                r'\brecent\b', r'\blatest\b'
            ]
            query_lower = query.lower()
            if any(re.search(pattern, query_lower) for pattern in time_patterns):
                state.add_data("_pending_research_period", query)
            
            state.add_data("_pending_research_query", query)
            return {
                "type": "response",
                "message": clarification["question"],
                "research_mode": True
            }
        
        # Clear any pending data since we have a complete query
        state.collected_data.pop("_pending_research_query", None)
        state.collected_data.pop("_pending_research_ticker", None)
        state.collected_data.pop("_pending_research_period", None)
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    'http://127.0.0.1:7000/process_message',
                    json={"message": f"/morning-note {query}"},
                    timeout=aiohttp.ClientTimeout(total=30)
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        return {
                            "type": "research_result",
                            "message": data.get("output", "Research completed"),
                            "data": data,
                            "research_mode": True
                        }
                    else:
                        return {
                            "type": "error",
                            "message": "Research service unavailable. Please try again later.",
                            "research_mode": True
                        }
        except Exception as e:
            return {
                "type": "error",
                "message": f"Research failed: {str(e)}",
                "research_mode": True
            }
    
    async def _check_research_clarification(self, query: str, state: WorkflowState) -> Dict:
        """Check if research query needs clarification and generate appropriate question"""
        import re
        
        # Quick pattern checks to avoid unnecessary LLM calls
        query_lower = query.lower()
        
        # Check if query has time period indicators
        time_patterns = [
            r'\bq[1-4]\b', r'\d{4}',  # Q1-Q4, years
            r'\blast\s+(quarter|year|month|week)\b',
            r'\bytd\b', r'\byear.to.date\b',
            r'\brecent\b', r'\blatest\b',
            r'\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\b',  # months
            r'\d{1,2}[/-]\d{1,2}[/-]\d{2,4}'  # dates
        ]
        
        has_time_period = any(re.search(pattern, query_lower) for pattern in time_patterns)
        
        # Check if query has ticker (2-5 uppercase letters)
        has_ticker = bool(re.search(r'\b[A-Z]{2,5}\b', query))
        
        # If has both ticker and time period, no clarification needed
        if has_ticker and has_time_period:
            return {
                "needs_clarification": False,
                "question": None,
                "reason": None
            }
        
        # If has ticker but no time period
        if has_ticker and not has_time_period:
            ticker_match = re.search(r'\b([A-Z]{2,5})\b', query)
            if ticker_match:
                ticker = ticker_match.group(1)
                return {
                    "needs_clarification": True,
                    "question": f"What time period would you like information on {ticker}? (e.g., last quarter, YTD, last year, or specific dates)",
                    "reason": "ticker without time period"
                }
        
        # For other cases, use LLM for more nuanced detection
        from langchain_google_genai import ChatGoogleGenerativeAI
        from langchain_core.messages import HumanMessage, SystemMessage
        from observability.langchain_adapter import LangChainObservabilityAdapter
        import os
        
        llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            temperature=0.3,
            google_api_key=os.getenv("GEMINI_API_KEY")
        )
        _orch_observer = LangChainObservabilityAdapter(
            agent_name="orchestrator",
            description="Routes messages and detects research clarification needs",
            evaluators=["llm_judge"],
            llm_judge_dimensions=["accuracy", "helpfulness", "hallucination", "safety"],
            llm_judge_model="gpt-4o-mini",
        )
        
        system_prompt = """You are a financial research assistant. Analyze if the user's research query needs clarification.

COMMON CLARIFICATION SCENARIOS:
1. Sector/industry without specifics (e.g., "tech sector", "healthcare")
   → Ask: "Would you like recent performance, outlook, top holdings, or specific analysis for the [SECTOR] sector?"

2. Vague market query (e.g., "market", "stocks")
   → Ask: "Which market or sector are you interested in? (e.g., S&P 500, tech sector, emerging markets)"

3. Company name without context (e.g., "Apple", "Tesla")
   → Ask: "What would you like to know about [COMPANY]? (e.g., recent performance, financial metrics, news, outlook)"

DO NOT ask for clarification if:
- Query includes both ticker/company AND time period
- Query is a complete question
- Query has sufficient context to proceed

Return JSON:
{
  "needs_clarification": true/false,
  "question": "clarification question" or null,
  "reason": "why clarification is needed" or null
}

Return ONLY valid JSON."""
        
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=f"Query: {query}")
        ]
        
        try:
            response = await _orch_observer.ainvoke(llm, messages, metadata={"operation": "research_clarification"})
            content = response.content.strip()
            
            # Parse JSON response
            if content.startswith("```json"):
                content = content[7:-3].strip()
            elif content.startswith("```"):
                content = content[3:-3].strip()
            
            import json
            result = json.loads(content)
            return result
        except Exception as e:
            print(f"[CLARIFICATION] Error: {e}")
            # Default to no clarification on error
            return {
                "needs_clarification": False,
                "question": None,
                "reason": None
            }
    
    async def handle_message(self, session_id: str, user_message: str, uploaded_file: Optional[str] = None, benchmark: Optional[str] = None) -> Dict:
        """
        Main entry point - handle user message
        
        Args:
            session_id: Unique session identifier
            user_message: User's chat message
            uploaded_file: Path to uploaded file (if any)
        
        Returns:
            {
                "type": "response" | "status" | "result" | "error",
                "message": "...",
                "data": {...},
                "progress": {...}
            }
        """
        print(f"\n[ORCHESTRATOR] ===== NEW MESSAGE =====")
        print(f"[ORCHESTRATOR] Session: {session_id}")
        print(f"[ORCHESTRATOR] Message: {user_message[:100]}...")
        print(f"[ORCHESTRATOR] File: {uploaded_file}")
        print(f"[ORCHESTRATOR] Benchmark: {benchmark}")
        
        # Get or create session state
        state = state_manager.get_or_create_session(session_id)
        state.session_id = session_id  # Store for status updates
        
        # CRITICAL: Check for pending reports FIRST before research mode
        # This ensures follow-up answers to report questions don't get routed to research
        has_pending_report = (
            state.collected_data.get("_pending_sections") or 
            state.collected_data.get("_pending_section") or 
            state.collected_data.get("_pending_full_report")
        )
        
        # Check if message looks like report generation request
        report_keywords = ['report', 'generate', 'create', 'show', 'performance', 'allocation', 'holdings']
        is_report_request = any(keyword in user_message.lower() for keyword in report_keywords)
        
        # If user makes a report request while in research mode, exit research mode
        if state.collected_data.get("_research_mode") and is_report_request:
            print(f"[ORCHESTRATOR] Exiting research mode due to report request")
            state.collected_data.pop("_research_mode", None)
            # Clear any pending research data
            state.collected_data.pop("_pending_research_query", None)
            state.collected_data.pop("_pending_research_ticker", None)
            state.collected_data.pop("_pending_research_period", None)
        
        # Route to research ONLY if in research mode AND no pending reports AND not a report request
        if state.collected_data.get("_research_mode") and not is_report_request and not has_pending_report:
            print(f"[ORCHESTRATOR] Research mode active, routing to research endpoint")
            return await self.handle_research_query(session_id, user_message, state)
        
        # Check if user wants direct research (no clarifications)
        if user_message.strip().startswith("/research-equity"):
            query = user_message.replace("/research-equity", "").strip()
            print(f"[ORCHESTRATOR] Direct research query (no clarifications): {query}")
            
            # Send directly to morning notes service without any clarification logic
            # Add context to make it a complete research request
            research_prompt = f"Provide a comprehensive equity research analysis for {query}. Include recent performance, key metrics, news, and outlook. Focus on the most recent data available."
            
            import aiohttp
            try:
                async with aiohttp.ClientSession() as session:
                    async with session.post(
                        'http://127.0.0.1:7000/process_message',
                        json={"message": f"/morning-note {research_prompt}"},
                        timeout=aiohttp.ClientTimeout(total=120)  # 120 seconds for Perplexity research
                    ) as response:
                        print(f"[RESEARCH] Response status: {response.status}")
                        response_text = await response.text()
                        print(f"[RESEARCH] Response body: {response_text[:500]}...")
                        
                        if response.status == 200:
                            try:
                                data = json.loads(response_text)
                                print(f"[RESEARCH] Parsed data keys: {data.keys()}")
                                return {
                                    "type": "research_result",
                                    "message": data.get("output", "Research completed"),
                                    "data": data,
                                    "research_mode": True
                                }
                            except json.JSONDecodeError as je:
                                print(f"[RESEARCH] JSON parse error: {je}")
                                return {
                                    "type": "error",
                                    "message": f"Invalid response from research service: {str(je)}",
                                    "research_mode": True
                                }
                        else:
                            return {
                                "type": "error",
                                "message": f"Research service error (status {response.status}): {response_text[:200]}",
                                "research_mode": True
                            }
            except aiohttp.ClientTimeout:
                return {
                    "type": "error",
                    "message": "Research request timed out after 120 seconds. Please try a simpler query.",
                    "research_mode": True
                }
            except Exception as e:
                print(f"[RESEARCH] Exception: {type(e).__name__}: {str(e)}")
                return {
                    "type": "error",
                    "message": f"Research failed: {str(e)}",
                    "research_mode": True
                }
        
        # Check if user wants to enter research mode
        if user_message.strip().startswith("/research"):
            query = user_message.replace("/research", "").strip()
            state.add_data("_research_mode", True)
            print(f"[ORCHESTRATOR] Entering research mode with query: {query}")
            if query:
                return await self.handle_research_query(session_id, query, state)
            else:
                return {
                    "type": "response",
                    "message": "Research mode activated. What would you like to research?",
                    "research_mode": True
                }
        
        state.add_chat_message("user", user_message)
        
        print(f"[STATE] Current collected_data keys: {list(state.collected_data.keys())}")
        print(f"[STATE] Completed steps: {state.completed_steps}")
        
        try:
            # If file uploaded, add to collected data with absolute path
            if uploaded_file:
                from pathlib import Path
                file_path = Path(uploaded_file)
                if not file_path.is_absolute():
                    file_path = Path.cwd() / file_path
                abs_path = str(file_path.absolute())
                print(f"[DEBUG] Orchestrator: File uploaded - {abs_path}")
                print(f"[DEBUG] File exists: {file_path.exists()}")
                state.add_data("portfolio_file", abs_path)
                
                # Try to extract client_name and period from filename
                filename = file_path.stem  # e.g., "635fb2ea-b307-467e-8300-e173976490be_john_mitchell_q4_2025"
                
                # Remove UUID prefix if present (format: uuid_actualname)
                if '_' in filename:
                    parts = filename.split('_')
                    # Skip first part if it looks like a UUID (contains hyphens)
                    if '-' in parts[0]:
                        parts = parts[1:]  # Remove UUID
                    
                    filename_clean = '_'.join(parts)
                    parts = filename_clean.lower().split('_')
                else:
                    parts = filename.lower().split('_')
                
                # Look for period pattern (q1, q2, q3, q4, ytd, or year)
                for i, part in enumerate(parts):
                    if part.startswith('q') and len(part) == 2 and part[1].isdigit():
                        # Found quarter
                        if i + 1 < len(parts) and parts[i+1].isdigit():
                            period_str = f"{part.upper()}-{parts[i+1]}"
                            state.add_data("period", period_str)
                            print(f"[FILE-PARSE] Extracted period: {period_str}")
                            
                            # Client name is everything before the period
                            client_parts = parts[:i]
                            if client_parts:
                                client_name = ' '.join(client_parts).title()
                                state.add_data("client_name", client_name)
                                print(f"[FILE-PARSE] Extracted client: {client_name}")
                            break
            
            # If benchmark provided, add to state; default to S&P 500 if not already set
            if benchmark:
                state.add_data("benchmark", benchmark)
            elif "benchmark" not in state.collected_data:
                state.add_data("benchmark", "^GSPC")

            # Step 1: Interpret user intent
            await self.send_status(session_id, "Understanding your request")
            print(f"[ORCHESTRATOR] Calling planner.interpret_user_intent...")
            intent = await self.planner.interpret_user_intent(user_message, state)
            print(f"[PLANNER] ✓ Intent: {intent.get('intent')}, Section: {intent.get('section_requested')}")
            print(f"[PLANNER] ✓ Client found: {intent.get('client_found')}")
            print(f"[PLANNER] ✓ Data provided: {intent.get('data_provided')}")
            
            # Step 1.5: If client found in system, load their data automatically
            if intent.get("client_found") and intent.get("client_data"):
                lookup_result = intent["client_data"]
                client = lookup_result["client"]
                client_id = client["client_id"]
                
                print(f"[ORCHESTRATOR] Loading data for {client['name']} from repository")
                
                # Clear old client data if different client — cascade invalidation
                old_client_id = state.collected_data.get("client_id")
                if old_client_id and old_client_id != client_id:
                    print(f"[STATE] Client changed from {old_client_id} to {client_id}, cascading invalidation")
                    state.invalidate_step_cascade(1, REPORT_SCHEMA)
                    state.completed_steps.clear()
                    state.section_results.clear()
                
                # Data already loaded by ClientLookupAgent
                state.add_data("client_name", client["name"])
                state.add_data("client_id", client_id)
                state.add_data("holdings", lookup_result.get("holdings", []))
                state.add_data("accounts", lookup_result.get("accounts", []))
                state.add_data("target_allocation", lookup_result.get("target_allocation", {}))
                # Only set benchmark from client data if user hasn't explicitly set one
                if "benchmark" not in state.collected_data:
                    state.add_data("benchmark", client.get("benchmark", "^GSPC"))
                state.add_data("transactions", lookup_result.get("transactions", []))
                
                print(f"[ORCHESTRATOR] Loaded {len(lookup_result.get('holdings', []))} holdings for {client['name']}")
                print(f"[ORCHESTRATOR] Loaded {len(lookup_result.get('transactions', []))} transactions for {client['name']}")
            
            # Step 1.6: Update state with any provided data
            if intent.get("data_provided"):
                for key, value in intent["data_provided"].items():
                    if key == "client_name":
                        # If client name provided but not found in repository, keep it
                        if not intent.get("client_found"):
                            state.add_data(key, value)
                            print(f"[STATE] Client '{value}' not in repository, will need file upload")
                    elif key != "portfolio_file" or "portfolio_file" not in state.collected_data:
                        state.add_data(key, value)
                        print(f"[STATE] Added {key} to state")
            
            # Step 1.6: Check if there's a pending full report or section to resume
            # BUT skip pending resume if user explicitly changed intent
            user_changed_intent = intent.get("intent") in ("full_report", "generate_section", "question")

            pending_sections = state.collected_data.get("_pending_sections")
            if pending_sections and not user_changed_intent:
                print(f"[RESUME] Resuming pending sections: {pending_sections}")
                
                # Handle multiple sections
                if ',' in pending_sections:
                    sections_list = [s.strip() for s in pending_sections.split(',')]
                    results = []
                    
                    for section_name in sections_list:
                        section_num = None
                        for num, config in REPORT_SCHEMA["steps"].items():
                            if config["name"] == section_name:
                                section_num = num
                                break
                        
                        if section_num:
                            result = await self._execute_section_with_deps(section_num, state, silent_deps=True)
                            
                            if result.get("status") == "need_input":
                                return {
                                    "type": "response",
                                    "message": result["message"],
                                    "missing_inputs": result.get("missing", []),
                                    "progress": self._get_progress(state)
                                }
                            
                            if result["status"] == "complete":
                                step_config = REPORT_SCHEMA["steps"][section_num]
                                results.append({
                                    "section": step_config["name"],
                                    "title": step_config["title"],
                                    "data": result
                                })
                    
                    state.collected_data.pop("_pending_sections", None)
                    return {
                        "type": "complete",
                        "message": f"✅ Generated {len(results)} sections!",
                        "sections": results,
                        "progress": self._get_progress(state)
                    }
                else:
                    # Single section
                    section_num = None
                    for num, config in REPORT_SCHEMA["steps"].items():
                        if config["name"] == pending_sections:
                            section_num = num
                            break
                    
                    if section_num:
                        result = await self._execute_section_with_deps(section_num, state, silent_deps=True)
                        
                        if result.get("status") == "complete":
                            step_config = REPORT_SCHEMA["steps"][section_num]
                            state.collected_data.pop("_pending_sections", None)
                            return {
                                "type": "result",
                                "message": f"✅ {step_config['title']} complete!",
                                "section": step_config["name"],
                                "data": result,
                                "progress": self._get_progress(state)
                            }
                        elif result.get("status") == "need_input":
                            return {
                                "type": "response",
                                "message": result["message"],
                                "missing_inputs": result.get("missing", []),
                                "progress": self._get_progress(state)
                            }
            
            pending_full = state.collected_data.get("_pending_full_report")
            if pending_full and not user_changed_intent:
                print(f"[RESUME] Resuming pending full report")
                result = await self._generate_full_report(state)
                print(f"[RESUME] Full report result type: {result.get('type')}")
                if result.get("type") == "complete" or result.get("type") == "error":
                    state.collected_data.pop("_pending_full_report", None)
                return result
            
            pending = state.collected_data.get("_pending_section")
            if pending and not user_changed_intent:
                print(f"[RESUME] Checking pending section: {pending}")
                section_num = None
                for num, config in REPORT_SCHEMA["steps"].items():
                    if config["name"] == pending:
                        section_num = num
                        break
                
                if section_num:
                    result = await self._execute_section_with_deps(section_num, state, silent_deps=True)
                    
                    if result.get("status") == "complete":
                        step_config = REPORT_SCHEMA["steps"][section_num]
                        state.collected_data.pop("_pending_section", None)
                        return {
                            "type": "result",
                            "message": f"✅ {step_config['title']} complete!",
                            "section": step_config["name"],
                            "data": result,
                            "progress": self._get_progress(state)
                        }
                    elif result.get("status") == "need_input":
                        # Still missing data, keep pending
                        return {
                            "type": "response",
                            "message": result["message"],
                            "missing_inputs": result.get("missing", []),
                            "progress": self._get_progress(state)
                        }
            
            # Step 2: Handle full report request
            if intent.get("intent") == "full_report":
                print(f"[ROUTE] → full_report path")
                # Clear any pending section (user changed mind)
                state.collected_data.pop("_pending_section", None)

                await self.send_status(session_id, "Starting report generation")
                print(f"[ORCHESTRATOR] Calling _generate_full_report...")
                result = await self._generate_full_report(state)
                print(f"[ORCHESTRATOR] Full report result: {result.get('type')}")
                
                # Store pending if needs input
                if result.get("type") == "response" and result.get("missing_inputs"):
                    state.add_data("_pending_full_report", True)
                    print(f"[STATE] Stored pending full report")
                
                return result
            
            # Step 2.5: Handle "next" / "continue"
            if intent.get("intent") == "generate_report" and not intent.get("section_requested"):
                print(f"[ROUTE] → generate_report (sequential) path")
                return {
                    "type": "response",
                    "message": "Got it! What would you like me to generate?",
                    "progress": self._get_progress(state)
                }
            
            # Step 3: Handle specific section requests
            if intent.get("intent") == "generate_section" and intent.get("section_requested"):
                section_names = intent["section_requested"]
                
                # Clear any pending full report (user changed mind)
                state.collected_data.pop("_pending_full_report", None)
                
                # Store pending request if data is missing
                if intent.get("needs_clarification"):
                    state.add_data("_pending_sections", section_names)
                    print(f"[STATE] Stored pending sections: {section_names}")
                
                # Handle multiple sections (comma-separated)
                if ',' in section_names:
                    sections_list = [s.strip() for s in section_names.split(',')]
                    print(f"[ROUTE] → generate multiple sections: {sections_list}")
                    
                    results = []
                    for section_name in sections_list:
                        # Find section number
                        section_num = None
                        for num, config in REPORT_SCHEMA["steps"].items():
                            if config["name"] == section_name:
                                section_num = num
                                break
                        
                        if section_num:
                            result = await self._execute_section_with_deps(section_num, state, silent_deps=True)
                            
                            if result.get("status") == "need_input":
                                return {
                                    "type": "response",
                                    "message": result["message"],
                                    "missing_inputs": result.get("missing", []),
                                    "progress": self._get_progress(state)
                                }
                            
                            if result["status"] == "complete":
                                step_config = REPORT_SCHEMA["steps"][section_num]
                                results.append({
                                    "section": step_config["name"],
                                    "title": step_config["title"],
                                    "data": result
                                })
                    
                    # Clear pending
                    state.collected_data.pop("_pending_sections", None)
                    
                    # Return all sections
                    return {
                        "type": "complete",
                        "message": f"✅ Generated {len(results)} sections!",
                        "sections": results,
                        "progress": self._get_progress(state)
                    }
                else:
                    # Single section
                    section_name = section_names
                
                # Clear any pending full report (user changed mind)
                state.collected_data.pop("_pending_full_report", None)
                
                # Store pending request if data is missing
                if intent.get("needs_clarification"):
                    state.add_data("_pending_section", section_name)
                    print(f"[STATE] Stored pending section: {section_name}")
                
                print(f"[ROUTE] → generate_section path for: {section_name}")
                
                # Find section number
                section_num = None
                for num, config in REPORT_SCHEMA["steps"].items():
                    if config["name"] == section_name:
                        section_num = num
                        break
                
                if section_num:
                    # Execute section with auto-dependency resolution (silent)
                    result = await self._execute_section_with_deps(section_num, state, silent_deps=True)
                    
                    # Handle input requests
                    if result.get("status") == "need_input":
                        state.add_chat_message("assistant", result["message"])
                        return {
                            "type": "response",
                            "message": result["message"],
                            "missing_inputs": result.get("missing", []),
                            "progress": self._get_progress(state)
                        }
                    
                    # Handle errors
                    if result["status"] == "error":
                        return {
                            "type": "error",
                            "message": f"❌ {result.get('user_message', result.get('error'))}",
                            "error": result.get("error"),
                            "progress": self._get_progress(state)
                        }
                    
                    # Success - only show requested section
                    step_config = REPORT_SCHEMA["steps"][section_num]
                    single_result = {
                        "type": "result",
                        "message": f"✅ {step_config['title']} complete!",
                        "section": step_config["name"],
                        "data": result,
                        "progress": self._get_progress(state)
                    }
                    self._dump_debug_log(single_result, state)
                    return single_result

            # Step 3: Check if clarification needed
            if intent.get("needs_clarification"):
                response = {
                    "type": "response",
                    "message": intent["clarification_question"],
                    "progress": self._get_progress(state)
                }
                state.add_chat_message("assistant", intent["clarification_question"])
                return response
            
            # Step 4: Plan next action
            print(f"[ROUTE] → plan_next_action path")
            plan = await self.planner.plan_next_action(state)
            print(f"[PLANNER] Plan action: {plan.get('action')}, Section: {plan.get('section')}")
            
            if plan["action"] == "request_input":
                # Need more data from user
                response = {
                    "type": "response",
                    "message": plan["message"],
                    "missing_inputs": plan["missing_inputs"],
                    "progress": self._get_progress(state)
                }
                state.add_chat_message("assistant", plan["message"])
                return response
            
            elif plan["action"] == "execute_section":
                # Ready to execute a section (silently for dependencies)
                section_num = plan["section"]
                step_config = REPORT_SCHEMA["steps"][section_num]
                
                print(f"[PLAN-EXEC] Silently executing {step_config['title']}")
                
                # Execute section agent silently
                result = await self._execute_section(section_num, state)
                
                if result["status"] == "complete":
                    state.update_step(section_num, "completed")
                    state.add_section_result(step_config["name"], result)
                    
                    # Don't show Parameters data - just acknowledge
                    if section_num == 1:
                        return {
                            "type": "response",
                            "message": "Portfolio loaded! What section would you like to generate?",
                            "progress": self._get_progress(state)
                        }
                    
                    # For other sections via plan_next_action, show result
                    return {
                        "type": "result",
                        "message": f"✅ {step_config['title']} complete!",
                        "section": step_config["name"],
                        "data": result,
                        "progress": self._get_progress(state)
                    }
                else:
                    # Section failed
                    state.update_step(section_num, "failed")
                    user_msg = result.get("user_message", result.get("error", "Unknown error"))
                    error_msg = f"❌ {step_config['title']}: {user_msg}"
                    
                    response = {
                        "type": "error",
                        "message": error_msg,
                        "error": result.get("error"),
                        "retryable": result.get("retryable", False),
                        "section_number": section_num,
                        "progress": self._get_progress(state)
                    }
                    state.add_chat_message("assistant", error_msg)
                    return response
            
            elif plan["action"] == "complete":
                # All sections done
                response = {
                    "type": "complete",
                    "message": "All sections complete! Ready to generate final PDF report.",
                    "progress": self._get_progress(state),
                    "sections": state.section_results
                }
                state.add_chat_message("assistant", response["message"])
                return response
            
            else:
                # Unknown action
                response = {
                    "type": "error",
                    "message": "Unable to determine next action. Please try again.",
                    "progress": self._get_progress(state)
                }
                return response
        
        except Exception as e:
            error_msg = f"Error processing message: {str(e)}"
            state.add_chat_message("assistant", error_msg)
            return {
                "type": "error",
                "message": error_msg,
                "error": str(e),
                "progress": self._get_progress(state)
            }
    
    async def _execute_section(self, section_number: int, state: WorkflowState, retry_count: int = 0) -> Dict:
        """Execute a specific section agent with retry logic"""
        
        step_config = REPORT_SCHEMA["steps"][section_number]
        agent_class = step_config["agent_class"]
        
        if agent_class not in self.agents:
            return {
                "status": "error",
                "error": f"Agent {agent_class} not implemented yet",
                "user_message": f"This section is not yet available. Please try another section."
            }
        
        agent = self.agents[agent_class]
        
        try:
            # Prepare data for agent - pass both collected_data and section_results
            state_data = {
                **state.collected_data,
                "section_results": state.section_results
            }
            
            # Execute based on section
            if section_number == 1:
                # Parameters agent
                result = await agent.execute(state.collected_data)
                
                # Store parameters in state
                if result["status"] == "complete":
                    for key, value in result["parameters"].items():
                        state.add_data(key, value)
            
            elif section_number == 2:
                # Performance agent (special case - has different interface)
                # Validate holdings exist
                holdings = state.collected_data.get("holdings", [])
                if not holdings:
                    return {
                        "status": "error",
                        "error": "No holdings data available",
                        "user_message": "Cannot calculate performance without portfolio holdings."
                    }
                
                await agent.initialize()
                try:
                    # Map benchmark ticker to name
                    benchmark_ticker = state.collected_data.get("benchmark", "^GSPC")
                    
                    # Handle benchmark as dict or string
                    if isinstance(benchmark_ticker, dict):
                        benchmark_name = benchmark_ticker.get("name", "S&P 500")
                        benchmark_ticker = benchmark_ticker.get("ticker", "^GSPC")
                    else:
                        benchmark_names = {
                            "^GSPC": "S&P 500",
                            "^DJI": "Dow Jones",
                            "^IXIC": "NASDAQ",
                            "SPY": "S&P 500 ETF",
                            "QQQ": "NASDAQ 100 ETF"
                        }
                        benchmark_name = benchmark_names.get(benchmark_ticker, benchmark_ticker)
                    
                    portfolio_data = {
                        "client_name": state.collected_data.get("client_name"),
                        "holdings": holdings,
                        "benchmark": {
                            "ticker": benchmark_ticker,
                            "name": benchmark_name
                        },
                        "transactions": state.collected_data.get("transactions", [])
                    }
                    
                    # Get period - handle dict or string
                    period_data = state.collected_data.get("period", {})
                    if isinstance(period_data, dict):
                        period = period_data
                    else:
                        # If string, should have been parsed by ParametersAgent
                        period = {
                            "name": period_data,
                            "start_date": "2024-10-01",
                            "end_date": "2024-12-31"
                        }
                    
                    result = await agent.generate(portfolio_data, period)
                finally:
                    await agent.cleanup()
            
            else:
                # All other agents (3-8) - pass full state
                result = await agent.execute(state_data)
            
            return result
            
        except Exception as e:
            error_msg = str(e)
            
            # Retry logic for transient errors (max 2 retries)
            if retry_count < 2 and ("timeout" in error_msg.lower() or "connection" in error_msg.lower()):
                print(f"[RETRY] Attempt {retry_count + 1} for {step_config['title']}")
                return await self._execute_section(section_number, state, retry_count + 1)
            
            # User-friendly error messages
            user_message = self._get_user_friendly_error(error_msg, step_config["title"])
            
            return {
                "status": "error",
                "error": error_msg,
                "user_message": user_message,
                "retryable": retry_count < 2
            }
    
    def _get_progress(self, state: WorkflowState) -> Dict:
        """Get progress summary"""
        total = REPORT_SCHEMA["total_steps"]
        completed = len(state.completed_steps)
        
        return {
            "total_steps": total,
            "completed_steps": completed,
            "percentage": int((completed / total) * 100),
            "current_step": state.current_step,
            "completed_sections": [
                REPORT_SCHEMA["steps"][num]["name"] 
                for num in state.completed_steps
            ]
        }
    
    async def get_session_status(self, session_id: str) -> Dict:
        """Get current session status"""
        state = state_manager.get_session(session_id)
        
        if not state:
            return {
                "exists": False,
                "message": "Session not found"
            }
        
        return {
            "exists": True,
            "session_id": session_id,
            "created_at": state.created_at,
            "progress": self._get_progress(state),
            "collected_data": {
                k: v for k, v in state.collected_data.items() 
                if k not in ["holdings", "portfolio_file"]  # Don't send large data
            },
            "missing_inputs": state.missing_inputs
        }
    
    def create_session(self) -> str:
        """Create new session and return ID"""
        session_id = str(uuid.uuid4())
        state_manager.create_session(session_id)
        return session_id
    
    async def _execute_section_with_deps(self, section_num: int, state: WorkflowState, silent_deps: bool = False) -> Dict:
        """
        Execute section with automatic dependency resolution and smart data collection.
        
        Flow:
        1. Check if already complete (use cache)
        2. Check required inputs (ask if missing)
        3. Auto-execute dependencies recursively
        4. Execute requested section
        
        Args:
            section_num: Section number to execute
            state: Current workflow state
        
        Returns:
            Section result dict or input request
        """
        step_config = REPORT_SCHEMA["steps"][section_num]
        print(f"\n[EXEC-WITH-DEPS] Requested: {step_config['title']} (Step {section_num})")
        
        # 1. Check if already complete - invalidate cache if data changed
        if section_num in state.completed_steps:
            # Check if critical data changed (client, period, holdings)
            cached_result = state.section_results.get(step_config["name"], {})
            cache_valid = True
            
            # Invalidate if client or period changed
            if section_num > 1:  # Skip for Parameters
                cached_client = cached_result.get("client_name")
                current_client = state.collected_data.get("client_name")
                
                # Handle period comparison (can be dict or string)
                cached_period = cached_result.get("period_name")
                current_period_data = state.collected_data.get("period")
                if isinstance(current_period_data, dict):
                    current_period = current_period_data.get("name")
                else:
                    current_period = current_period_data
                
                if cached_client != current_client or cached_period != current_period:
                    cache_valid = False
                    print(f"[CACHE] Invalidated - data changed")
            
            if cache_valid:
                print(f"[EXEC-WITH-DEPS] Using cached result")
                return cached_result
            else:
                # Cascade invalidation — remove this step and all dependents
                state.invalidate_step_cascade(section_num, REPORT_SCHEMA)

        # 2. Check required inputs (basic data like holdings, period)
        required = get_required_inputs(section_num)
        print(f"[EXEC-WITH-DEPS] Required inputs: {required['required']}")

        # Only check for truly user-provided inputs.
        # benchmark has a default (^GSPC), so never block on it.
        basic_user_inputs = ['period', 'client_name']
        
        # Only require portfolio_file if holdings not already in state
        if 'holdings' not in state.collected_data:
            basic_user_inputs.append('portfolio_file')
        
        missing = []
        
        for req in required["required"]:
            if req in basic_user_inputs and req not in state.collected_data:
                missing.append(req)
        
        if missing:
            print(f"[EXEC-WITH-DEPS] Missing basic inputs: {missing}")
            return {
                "status": "need_input",
                "missing": missing,
                "message": self._generate_input_request_message(missing, step_config['title'])
            }
        
        # 3. Auto-execute dependencies recursively
        missing_deps = get_missing_dependencies(section_num, state.completed_steps)
        
        if missing_deps:
            print(f"[EXEC-WITH-DEPS] Missing dependencies: {[REPORT_SCHEMA['steps'][d]['title'] for d in missing_deps]}")
            
            for dep_num in missing_deps:
                dep_config = REPORT_SCHEMA["steps"][dep_num]
                print(f"[AUTO-DEP] Executing dependency: {dep_config['title']} (Step {dep_num})")
                
                # Recursive call - may return need_input
                dep_result = await self._execute_section_with_deps(dep_num, state)
                
                # Bubble up input requests
                if dep_result.get("status") == "need_input":
                    print(f"[AUTO-DEP] Dependency needs input, bubbling up")
                    return dep_result
                
                # Handle dependency errors
                if dep_result.get("status") == "error":
                    print(f"[AUTO-DEP] ✗ {dep_config['title']} failed: {dep_result.get('error')}")
                    return {
                        "status": "error",
                        "error": f"Dependency {dep_config['title']} failed: {dep_result.get('error')}",
                        "user_message": f"Unable to generate {step_config['title']} because {dep_config['title']} failed."
                    }
                
                # Dependency succeeded
                if dep_result.get("status") == "complete":
                    if dep_num not in state.completed_steps:
                        state.update_step(dep_num, "completed")
                        state.add_section_result(dep_config["name"], dep_result)
                    print(f"[AUTO-DEP] ✓ {dep_config['title']} complete")
        else:
            print(f"[EXEC-WITH-DEPS] No missing dependencies")
        
        # 4. Execute requested section
        print(f"[EXEC-WITH-DEPS] Executing main section: {step_config['title']}")
        
        # Send status update
        status_messages = {
            1: "Parsing portfolio file and extracting holdings",
            2: "Calculating performance metrics and returns",
            3: "Analyzing asset allocation and diversification",
            4: "Processing individual holdings and positions",
            5: "Fetching market news and generating commentary",
            6: "Analyzing transactions, dividends, and fees",
            7: "Generating planning recommendations",
            8: "Assembling final PDF report"
        }
        
        if section_num in status_messages:
            await self.send_status(state.session_id if hasattr(state, 'session_id') else None, 
                                  status_messages[section_num])
        
        result = await self._execute_section(section_num, state)
        
        if result["status"] == "complete":
            state.update_step(section_num, "completed")
            state.add_section_result(step_config["name"], result)
            result["section"] = step_config["name"]
            print(f"[EXEC-WITH-DEPS] ✓ {step_config['title']} complete")
        else:
            print(f"[EXEC-WITH-DEPS] ✗ {step_config['title']} failed: {result.get('error')}")
        
        return result
    
    def _generate_input_request_message(self, missing_inputs: list, section_title: str) -> str:
        """Generate friendly message for missing inputs"""
        messages = {
            'portfolio_file': 'Please upload your portfolio file (Excel or CSV)',
            'holdings': 'Please upload your portfolio file (Excel or CSV)',
            'period': 'What reporting period? (e.g., Q4-2025, YTD, or custom dates)',
            'client_name': 'What is the client name?'
        }
        
        requests = [messages.get(inp, inp) for inp in missing_inputs]
        return f"To generate {section_title}, I need:\n" + "\n".join(f"• {r}" for r in requests)
    
    def _get_user_friendly_error(self, error: str, section_title: str) -> str:
        """Convert technical errors to user-friendly messages"""
        error_lower = error.lower()
        
        if "file" in error_lower and "not found" in error_lower:
            return "Portfolio file not found. Please upload your file again."
        elif "parse" in error_lower or "invalid" in error_lower:
            return "Unable to read portfolio file. Please check the file format and try again."
        elif "api" in error_lower or "key" in error_lower:
            return "Market data service unavailable. Please check API configuration."
        elif "timeout" in error_lower or "connection" in error_lower:
            return "Connection timeout. Retrying..."
        elif "gemini" in error_lower:
            return "AI service temporarily unavailable. Please try again."
        else:
            return f"Unable to generate {section_title}. Please try again or contact support."
    
    async def _generate_full_report(self, state: WorkflowState) -> Dict:
        """Generate complete report with all 8 sections sequentially"""
        try:
            sections_data = []

            status_messages = {
                1: "Parsing portfolio file and extracting holdings",
                2: "Calculating performance metrics and returns",
                3: "Analyzing asset allocation and diversification",
                4: "Processing individual holdings and positions",
                5: "Fetching market news and generating commentary",
                6: "Analyzing transactions, dividends, and fees",
                7: "Generating planning recommendations",
                8: "Assembling final PDF report"
            }

            for step_num in range(1, REPORT_SCHEMA["total_steps"] + 1):
                if step_num in state.completed_steps:
                    step_config = REPORT_SCHEMA["steps"][step_num]
                    # Send status even for cached steps so UI shows progress
                    if step_num in status_messages:
                        await self.send_status(
                            state.session_id if hasattr(state, 'session_id') else None,
                            status_messages[step_num]
                        )
                    cached = state.section_results.get(step_config["name"])
                    if cached and step_num > 1:
                        sections_data.append({
                            "section": step_config["name"],
                            "title": step_config['title'],
                            "data": self._serialize_section_data(cached)
                        })
                    continue

                step_config = REPORT_SCHEMA["steps"][step_num]
                result = await self._execute_section_with_deps(step_num, state, silent_deps=True)

                if result.get("status") == "complete":
                    if step_num > 1:
                        sections_data.append({
                            "section": step_config["name"],
                            "title": step_config['title'],
                            "data": self._serialize_section_data(result)
                        })
                elif result.get("status") == "need_input":
                    return {
                        "type": "response",
                        "message": result["message"],
                        "missing_inputs": result.get("missing", []),
                        "progress": self._get_progress(state)
                    }
                elif result.get("status") == "error":
                    error_msg = result.get('error', 'Unknown error')
                    print(f"[FULL-REPORT] ⚠️ Step {step_num} ({step_config['title']}) failed: {error_msg}")
                    # Parameters and Performance are critical; others can be skipped
                    if step_num <= 2:
                        return {
                            "type": "error",
                            "message": f"❌ {step_config['title']} failed: {result.get('user_message', error_msg)}",
                            "error": error_msg,
                            "progress": self._get_progress(state)
                        }

            result = {
                "type": "complete",
                "message": "✅ Full Report Complete!",
                "sections": sections_data,
                "progress": self._get_progress(state)
            }
            self._dump_debug_log(result, state)
            return result

        except Exception as e:
            return {
                "type": "error",
                "message": f"Failed to generate full report: {str(e)}",
                "error": str(e)
            }
    
    def _serialize_section_data(self, section_result: Dict) -> Dict:
        """Extract serializable data from section result, removing circular refs"""
        import copy
        
        serialized = {}
        
        # Copy only primitive types and simple structures
        safe_keys = [
            # Performance
            'performance_table', 'account_table', 'portfolio_value', 'metrics', 'narrative',
            'executive_highlights', 'benchmark_name', 'client_name', 'period_name', 'risk_metrics',
            # Allocation
            'allocation_table', 'drift_analysis', 'chart_data',
            # Holdings
            'holdings_table', 'total_positions',
            # Commentary
            'commentary', 'market_summary', 'portfolio_impact', 'outlook', 'news_articles',
            # Activity
            'total_trades', 'total_dividends', 'total_fees', 'net_cashflow', 'net_contributions',
            'summary', 'note', 'realized_gains_losses', 'tlh_events', 'transaction_table',
            # Planning
            'recommendations', 'goal_progress', 'action_items', 'next_review',
            # Output
            'pdf_path', 'pdf_ready', 'total_sections', 'message'
        ]
        
        for key in safe_keys:
            if key in section_result:
                value = section_result[key]
                # Deep copy primitives and simple structures only
                if isinstance(value, (str, int, float, bool, type(None))):
                    serialized[key] = value
                elif isinstance(value, (list, dict)):
                    try:
                        # Try to copy, skip if contains complex objects
                        serialized[key] = copy.deepcopy(value)
                    except (TypeError, RecursionError):
                        # Skip non-serializable values
                        pass
        
        # Handle special nested structures
        if 'report' in section_result and isinstance(section_result['report'], dict):
            report = section_result['report']
            if 'cover_page' in report:
                serialized['cover_page'] = {
                    'client_name': report['cover_page'].get('client_name'),
                    'period': report['cover_page'].get('period')
                }
        
        return serialized

    def _dump_debug_log(self, result: Dict, state: WorkflowState):
        """Write full report payload to debug log (overwrites each call)."""
        try:
            log_path = Path(__file__).resolve().parent.parent.parent / "temp" / "report_debug.json"
            log_path.parent.mkdir(exist_ok=True)
            payload = {
                "timestamp": datetime.now().isoformat(),
                "collected_data_keys": list(state.collected_data.keys()),
                "completed_steps": list(state.completed_steps),
                "result_type": result.get("type"),
                "sections_count": len(result.get("sections", [])),
                "sections": []
            }
            for sec in result.get("sections", []):
                payload["sections"].append({
                    "section": sec.get("section"),
                    "title": sec.get("title"),
                    "data_keys": list((sec.get("data") or {}).keys()),
                    "data": sec.get("data")
                })
            with open(log_path, "w", encoding="utf-8") as f:
                json.dump(payload, f, indent=2, default=str)
            print(f"[DEBUG-LOG] Written to {log_path}")
        except Exception as e:
            print(f"[DEBUG-LOG] Failed: {e}")


# Global orchestrator instance
orchestrator = ReportOrchestrator()
