import traceback
import asyncio
import json
import uuid
import re
import logging
import math
from typing import Optional, Dict, List
from datetime import datetime, timedelta
from pathlib import Path

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import os
import shutil
import pathlib

import tiktoken

from token_tracker import get_total_tool_tokens, add_tool_tokens
from ws_braodcast import active_connections

from skill_manager import skill_manager
# --- STRANDS ADAPTATION: Use the new strands-specific planner ---
from strands_financial_planner_agent import run_planner
from mcp_client import mcp_manager
from result_formatter import format_structured_response

# ─────────────────────────────────────────────────────────────
# Canary token & prompt security
# ─────────────────────────────────────────────────────────────
security_logger = logging.getLogger("prompt_security")
security_logger.setLevel(logging.WARNING)
_handler = logging.FileHandler("prompt_security.log")
_handler.setFormatter(logging.Formatter("%(asctime)s | %(levelname)s | %(message)s"))
security_logger.addHandler(_handler)

CANARY_TOKEN = f"CANARY-{uuid.uuid4()}"

_INJECTION_PATTERNS = [
    r"ignore\s+(all\s+)?previous\s+instructions",
    r"reveal\s+(your\s+)?(system\s+)?prompt",
    r"repeat\s+everything\s+above",
    r"show\s+(me\s+)?(your\s+)?(system|hidden|secret)\s+(prompt|instructions)",
    r"what\s+(are|is)\s+your\s+(system|hidden|secret)\s+(prompt|instructions)",
    r"print\s+(your\s+)?(system|initial)\s+(prompt|message)",
    r"disregard\s+(all\s+)?(prior|previous)",
    r"you\s+are\s+now\s+(a|an)\s+",
    r"act\s+as\s+if\s+you\s+have\s+no\s+restrictions",
]
_INJECTION_RE = re.compile("|".join(_INJECTION_PATTERNS), re.IGNORECASE)


def _check_prompt_injection(user_message: str) -> bool:
    """Return True if the message looks like a prompt injection attempt."""
    if _INJECTION_RE.search(user_message):
        security_logger.warning(f"PROMPT_INJECTION_SUSPECT | message: {user_message[:200]}")
        return True
    return False


def _validate_output(output_text: str, skill_instructions: str = "") -> str:
    """Check output for canary leakage or system prompt leakage. Returns sanitized text."""
    if CANARY_TOKEN in output_text:
        security_logger.critical(f"CANARY_LEAKED | token found in output")
        return "Response blocked: potential prompt injection detected. This incident has been logged."

    # Check if large chunks of skill instructions leaked (>80 chars substring)
    if skill_instructions and len(skill_instructions) > 100:
        # Check a few unique fragments from the instructions
        fragments = [
            skill_instructions[i:i+80]
            for i in range(0, min(len(skill_instructions), 400), 100)
        ]
        for frag in fragments:
            if frag in output_text:
                security_logger.warning(f"SYSTEM_PROMPT_LEAKED | fragment found in output")
                return "Response blocked: system instructions were exposed. This incident has been logged."

    return output_text



# ─────────────────────────────────────────────────────────────
# App setup
# ─────────────────────────────────────────────────────────────
app = FastAPI(title="Finance Planner API", version="2.1.0")

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "docs_upload")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ─────────────────────────────────────────────────────────────
# File-based cache (same pattern as portfolio_rebalancing)
# ─────────────────────────────────────────────────────────────
CACHE_DIR = Path(os.getenv("CACHE_DIR", os.path.join(os.path.dirname(__file__), "_cache")))
CACHE_TTL = int(os.getenv("CACHE_TTL_MINUTES", "30"))
CACHE_DIR.mkdir(parents=True, exist_ok=True)


def _cache_path(client_id: str) -> Path:
    return CACHE_DIR / f"{client_id}.json"


def _get_cached(client_id: str) -> dict | None:
    p = _cache_path(client_id)
    if not p.exists():
        return None
    data = json.loads(p.read_text(encoding="utf-8"))
    cached_at = datetime.fromisoformat(data.get("_cached_at", "2000-01-01"))
    if datetime.utcnow() - cached_at > timedelta(minutes=CACHE_TTL):
        p.unlink(missing_ok=True)
        return None
    return data


def _set_cached(client_id: str, result: dict):
    result["_cached_at"] = datetime.utcnow().isoformat()
    _cache_path(client_id).write_text(
        json.dumps(_clean_floats(result), default=str), encoding="utf-8"
    )


def _clean_floats(obj):
    """Recursively replace nan/inf with None so JSON serialization never fails."""
    if isinstance(obj, float):
        return None if (math.isnan(obj) or math.isinf(obj)) else obj
    if isinstance(obj, dict):
        return {k: _clean_floats(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_clean_floats(v) for v in obj]
    return obj


def _safe_json(data: dict) -> JSONResponse:
    return JSONResponse(content=json.loads(json.dumps(_clean_floats(data), default=str)))

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────────────────────
# Tokenizer
# ─────────────────────────────────────────────────────────────
encoding = tiktoken.encoding_for_model("gpt-4o")

def count_tokens(text: str) -> int:
    return len(encoding.encode(text or ""))

# ─────────────────────────────────────────────────────────────
# In-memory session store
# ─────────────────────────────────────────────────────────────
session_histories: Dict[str, List] = {}
session_skills: Dict[str, dict] = {}  # tracks active skill per session for follow-ups

# ─────────────────────────────────────────────────────────────
# Request model
# ─────────────────────────────────────────────────────────────
class MessageRequest(BaseModel):
    message: str
    session_id: Optional[str] = "default"
    has_files: Optional[bool] = False

class FullAnalysisRequest(BaseModel):
    include_sentiment: bool = True
    selected_fund_universe: Optional[List[str]] = None
    user_prompt: str = ""
    refresh: bool = False

# ─────────────────────────────────────────────────────────────
# Helper: Extract context from uploaded documents
# ─────────────────────────────────────────────────────────────
async def get_docs_context() -> str:
    if not os.path.exists(UPLOAD_DIR):
        return ""
    
    filenames = os.listdir(UPLOAD_DIR)
    if not filenames:
        return ""
    
    client = await mcp_manager.get_client("perplexity")
    if not client:
        return "[WARNING: Could not connect to document processing server]"
    
    all_content = []
    for name in filenames:
        abs_path = os.path.abspath(os.path.join(UPLOAD_DIR, name))
        try:
            print(f"Extracting content from {name} using MCP...")
            result = await client.call_tool("read_file", {"file_path": abs_path})
            
            # Formatting text chunks from MCP response
            content_text = ""
            for item in getattr(result, "content", []):
                if getattr(item, "type", None) == "text":
                    content_text += getattr(item, "text", "")
            
            if content_text:
                all_content.append(f"--- START OF DOCUMENT: {name} ---\n[Location: {abs_path}]\n{content_text.strip()}\n--- END OF DOCUMENT: {name} ---")
            else:
                all_content.append(f"[No text could be extracted from {name}]")
        except Exception as e:
            print(f"Error reading {name} via MCP: {e}")
            all_content.append(f"[Error reading {name}: {str(e)}]")
            
    return "\n\n".join(all_content)

# ─────────────────────────────────────────────────────────────
# Suggestion logic (KEY PART)
# ─────────────────────────────────────────────────────────────
def generate_suggestions(bot_text: str) -> List[str]:
    text = bot_text.lower()

    if "weeks" in text or "specify" in text:
        return [
            "add following week",
            "remove following week",
            "yes proceed"
        ]

    if "proceed" in text or "continue" in text or "no data" in text or "not available" in text:
        return [
            "yes, proceed",
            "no, cancel",
            "try a different company"
          
        ]

    if "analysis" in text or "summary" in text:
        return [
            "Add following week",
            "Remove following week",
            "yes proceed"
        ]

    return []

# ─────────────────────────────────────────────────────────────
# Rebalance config: patch skill instructions based on toggles
# ─────────────────────────────────────────────────────────────
def _apply_rebalance_config(
    skill: dict,
    sentiment: bool = True,
    selected_fund_universe: Optional[List[str]] = None,
) -> dict:
    """Return a modified copy of the skill dict based on rebalance toggles.

    selected_fund_universe semantics:
        None  → first run / not provided → use ALL fund universe (default)
        []    → user deliberately unselected all → skip fund universe entirely
        ["VOO", ...] → use only these tickers for Option B
    """
    import copy
    patched = copy.deepcopy(skill)
    instructions = patched.get("agent_instructions", "")
    addendum = []

    if not sentiment:
        addendum.append(
            "\n\n--- OVERRIDE: SENTIMENT DISABLED ---\n"
            "SKIP step 3 (Sentiment Analysis) entirely. Do NOT call `analyze_portfolio_sentiment`. "
            "Do NOT include a '## Sentiment & Market Context' section in your output. "
            "Do NOT reference sentiment in trade rationales or comparative recommendations. "
            "Remove the 'Sentiment review' item from the Completeness Checklist. "
            "ALL OTHER STEPS (1, 2, 4, 5, 6) MUST STILL BE EXECUTED IN FULL."
        )
    else:
        addendum.append(
            "\n\n--- SENTIMENT ENABLED ---\n"
            "You MUST execute step 3: call `analyze_portfolio_sentiment` and include the "
            "'## Sentiment & Market Context' section in your output. Do NOT skip this step."
        )

    if selected_fund_universe is not None:
        if len(selected_fund_universe) == 0:
            # User deliberately unselected all → skip fund universe entirely
            addendum.append(
                "\n\n--- OVERRIDE: FUND UNIVERSE DISABLED ---\n"
                "SKIP step 5 (Strategy Option B) entirely. Do NOT call `get_universe_alternatives`, "
                "`fetch_fund_universe_metrics`, or `get_ticker_info` for alternatives. "
                "Do NOT generate Option B. Only produce Option A (current holdings). "
                "Remove '## Rebalancing Strategy: Option B' and '## Comparative Recommendation' "
                "sections from your output. The completeness checklist should NOT include Option B. "
                "ALL OTHER STEPS MUST STILL BE EXECUTED IN FULL."
            )
        else:
            # User selected specific funds → restrict Option B to these only
            ticker_list = ", ".join(selected_fund_universe)
            addendum.append(
                f"\n\n--- OVERRIDE: FUND UNIVERSE RESTRICTED ---\n"
                f"You MUST still generate Option B (step 5) and the Comparative Recommendation (step 6). "
                f"However, instead of calling `get_universe_alternatives` to discover alternatives, "
                f"use ONLY the following pre-selected tickers: {ticker_list}. "
                f"You MUST call `fetch_fund_universe_metrics` with tickers [{ticker_list}]. "
                f"You MUST call `get_ticker_info` for each of: {ticker_list}. "
                f"You MUST call `simulate_rebalance` with the Option B trades. "
                f"You MUST include '## Rebalancing Strategy: Option B', "
                f"'### Projected Allocation After Option B', and '## Comparative Recommendation' "
                f"sections in your output. Do NOT skip Option B. Do NOT use any tickers outside this list."
            )
    # else: None → use all fund universe (no override needed)

    if addendum:
        instructions += "".join(addendum)
        patched["agent_instructions"] = instructions

    return patched

# ─────────────────────────────────────────────────────────────
# API: Process message
# ─────────────────────────────────────────────────────────────
@app.post("/process_message")
async def handle_agent_request(request: MessageRequest):
    user_message = request.message.strip()
    session_id = request.session_id or "default"

    # --- MCP DOCUMENT EXTRACTION ---
    if request.has_files:
        doc_context = await get_docs_context()
        if doc_context:
            user_message = f"[UPLOADED DOCUMENTS CONTEXT]\n\n{doc_context}\n\n[USER QUESTION]\n{user_message}"
        
        # NOTE: Immediate cleanup removed so the agent can still call tools directly if desired.
        # Cleanup still happens automatically in /upload_doc on the next upload cycle.
    # -----------------------------

    if not user_message:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    # --- Prompt injection check ---
    is_suspicious = _check_prompt_injection(user_message)

    try:
        history = session_histories.get(session_id, [])
        output_text = ""

        # 1. Check if it's a known Skill command first
        matched_skill = skill_manager.get_skill_for_message(user_message)
        if matched_skill:
            input_tokens = count_tokens(user_message)
            session_skills[session_id] = matched_skill  # remember skill for follow-ups
            patched_skill = _apply_rebalance_config(matched_skill)
            result, _ = await run_planner(user_message, history, patched_skill, user_instructions="", canary_token=CANARY_TOKEN, is_suspicious=is_suspicious)
            # AWS Strands might not natively have .all_messages() like Pydantic AI
            if hasattr(result, "all_messages") and callable(result.all_messages):
                session_histories[session_id] = result.all_messages()
            elif hasattr(result, "messages"):
                session_histories[session_id] = result.messages
            else:
                # Fallback: manually construct generic history
                history.append({"role": "user", "content": user_message})
                history.append({"role": "assistant", "content": str(getattr(result, "output", result))})
                session_histories[session_id] = history
                
            output_text = getattr(result, "output", getattr(result, "text", str(result)))
            if callable(output_text): output_text = output_text()
            if not isinstance(output_text, str): output_text = str(output_text)

        # 2. If it's a slash command but not recognized
        elif user_message.startswith("/"):
            keys = list(skill_manager.skills.keys())
            available = ", ".join(keys) if keys else "None"
            return {
                "output": f"Unknown skill command. Available skills: {available}",
                "suggestions": [],
                "input_tokens": 0,
                "output_tokens": 0,
                "total_input_tokens_conversation": 0,
                "total_output_tokens_conversation": 0,
                "total_tokens_this_request": 0,
                "total_tokens_entire_conversation": 0,
                "total_input_tokens_tools": 0,
                "total_output_tokens_tools": 0,
                "total_tokens_tools": 0,
            }

        # 3. Follow-up to an active skill session (no slash, but skill context exists)
        elif session_skills.get(session_id):
            active_skill = session_skills[session_id]
            input_tokens = count_tokens(user_message)
            print(f"Routing follow-up to STRANDS planner agent (skill: {active_skill.get('command')})")
            patched_skill = _apply_rebalance_config(active_skill)
            result, _ = await run_planner(user_message, history, patched_skill, user_instructions="", canary_token=CANARY_TOKEN, is_suspicious=is_suspicious)
            
            # --- STRANDS ADAPTATION ---
            if hasattr(result, "all_messages") and callable(result.all_messages):
                session_histories[session_id] = result.all_messages()
            elif hasattr(result, "messages"):
                session_histories[session_id] = result.messages
            else:
                history.append({"role": "user", "content": user_message})
                history.append({"role": "assistant", "content": str(getattr(result, "output", result))})
                session_histories[session_id] = history
                
            output_text = getattr(result, "output", getattr(result, "text", str(result)))
            if callable(output_text): output_text = output_text()
            if not isinstance(output_text, str): output_text = str(output_text)

        # 4. No skill matched and no active session — unknown command
        else:
            input_tokens = 0
            return {
                "output": "Unknown command. Please use a skill command like /rebalance <client_id> to get started.",
                "suggestions": [],
                "input_tokens": 0,
                "output_tokens": 0,
                "total_input_tokens_conversation": 0,
                "total_output_tokens_conversation": 0,
                "total_tokens_this_request": 0,
                "total_tokens_entire_conversation": 0,
                "total_input_tokens_tools": 0,
                "total_output_tokens_tools": 0,
                "total_tokens_tools": 0,
            }

        # --- Output security validation ---
        skill_instructions = ""
        if session_skills.get(session_id):
            skill_instructions = session_skills[session_id].get("agent_instructions", "")
        output_text = _validate_output(output_text, skill_instructions)

        # Token count (output)
        output_tokens = count_tokens(output_text)
        add_tool_tokens(input_tokens, output_tokens)

        # Conversation token totals
        # Strands messages can have content as list of blocks [{"text": "..."}] or plain string
        def _get_content(msg):
            c = msg.get("content", "") if isinstance(msg, dict) else getattr(msg, "content", "")
            if isinstance(c, list):
                return " ".join(
                    block.get("text", "") for block in c
                    if isinstance(block, dict) and "text" in block
                )
            return c if isinstance(c, str) else ""
            
        def _get_role(msg):
            if isinstance(msg, dict): return msg.get("role", "")
            return getattr(msg, "role", "")

        total_input_tokens = sum(
            count_tokens(_get_content(msg))
            for msg in session_histories[session_id]
            if _get_role(msg) == "user"
        )

        total_output_tokens = sum(
            count_tokens(_get_content(msg))
            for msg in session_histories[session_id]
            if _get_role(msg) == "assistant"
        )

        total_tokens_conversation = total_input_tokens + total_output_tokens

        total_tool_input, total_tool_output = get_total_tool_tokens()

        # Debug log
        print("-" * 30)
        print(f"Session ID: {session_id}")
        print(f"User message: {user_message}")
        print(f"Input tokens: {input_tokens}")
        print(f"Output tokens: {output_tokens}")
        print(f"Conversation tokens: {total_tokens_conversation}")
        print(f"Tool tokens: {total_tool_input + total_tool_output}")
        print("-" * 30)

        # Suggestions based on bot reply
        suggestions = generate_suggestions(output_text)

        return {
            "output": output_text,
            "suggestions": suggestions,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "total_input_tokens_conversation": total_input_tokens,
            "total_output_tokens_conversation": total_output_tokens,
            "total_tokens_this_request": input_tokens + output_tokens,
            "total_tokens_entire_conversation": total_tokens_conversation,
            "total_input_tokens_tools": total_tool_input,
            "total_output_tokens_tools": total_tool_output,
            "total_tokens_tools": total_tool_input + total_tool_output,
        }

    except Exception as e:
        print("Exception in /process_message")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# ─────────────────────────────────────────────────────────────
# API: Reset session
# ─────────────────────────────────────────────────────────────
@app.post("/reset_session")
async def reset_session(request: MessageRequest):
    session_id = request.session_id or "default"
    session_histories.pop(session_id, None)
    session_skills.pop(session_id, None)
    print(f"Session reset: {session_id}")
    return {"status": "ok", "message": f"Session '{session_id}' has been reset."}

# ─────────────────────────────────────────────────────────────
# WebSocket: summary streaming
# ─────────────────────────────────────────────────────────────
@app.websocket("/ws/summary")
async def websocket_summary_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_connections.append(websocket)
    print("WebSocket client connected")

    try:
        while True:
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=60)
                print("WebSocket received:", data)
            except asyncio.TimeoutError:
                await websocket.send_text(json.dumps({"type": "ping"}))
    except WebSocketDisconnect:
        print("WebSocket client disconnected")
    finally:
        if websocket in active_connections:
            active_connections.remove(websocket)

# ─────────────────────────────────────────────────────────────
# API: Upload document
# ─────────────────────────────────────────────────────────────
@app.post("/upload_doc")
async def upload_document(files: List[UploadFile] = File(...)):
    try:
        # Clear existing files in UPLOAD_DIR first
        for filename in os.listdir(UPLOAD_DIR):
            file_path = os.path.join(UPLOAD_DIR, filename)
            try:
                if os.path.isfile(file_path) or os.path.islink(file_path):
                    os.remove(file_path)
                elif os.path.isdir(file_path):
                    shutil.rmtree(file_path)
            except Exception as e:
                print(f"Failed to delete {file_path}. Reason: {e}")

        uploaded_files = []
        for file in files:
            file_path = os.path.join(UPLOAD_DIR, file.filename)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            uploaded_files.append(file.filename)
            print(f"File uploaded: {file.filename} -> {file_path}")
            
        return {
            "status": "success",
            "filenames": uploaded_files,
            "count": len(uploaded_files)
        }
    except Exception as e:
        print(f"Upload error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to upload files: {str(e)}")


# ─────────────────────────────────────────────────────────────
# Helper: Run agent for a client and return structured result
# ─────────────────────────────────────────────────────────────
async def _run_agent_for_client(
    client_id: str,
    refresh: bool = False,
    include_sentiment: bool = True,
    selected_fund_universe: Optional[List[str]] = None,
    user_prompt: str = "",
) -> dict:
    """
    Core helper: return cached structured result or run the /rebalance skill
    via the Strands agent, parse the markdown output into structured JSON,
    cache it, and return. ALL 6 API endpoints call this.
    """
    if not refresh:
        cached = _get_cached(client_id)
        if cached:
            return cached

    # Build the user message that triggers the /rebalance skill
    user_message = f"/rebalance {client_id}"

    # Get the rebalance skill
    matched_skill = skill_manager.get_skill_for_message(user_message)
    if not matched_skill:
        raise HTTPException(status_code=400, detail="Rebalance skill not found. Ensure rebalance.json exists in skills/")

    patched_skill = _apply_rebalance_config(
        matched_skill,
        sentiment=include_sentiment,
        selected_fund_universe=selected_fund_universe,
    )

    # Run the Strands agent — returns (AgentResult, tool_results dict)
    result, tool_results = await run_planner(
        user_message,
        [],  # fresh session, no history
        patched_skill,
        user_instructions=user_prompt,
        canary_token=CANARY_TOKEN,
        is_suspicious=False,
        allowed_universe_tickers=selected_fund_universe,
    )

    # Format tool results into structured JSON matching the API schema
    print(f"\n[FULL-ANALYSIS] Tool results collected: {list(tool_results.keys())}")
    structured = format_structured_response(tool_results, client_id=client_id)

    # Cache it
    _set_cached(client_id, structured)
    return structured


# ─────────────────────────────────────────────────────────────
# API: Full Analysis (all 4 sub-APIs in one call)
# ─────────────────────────────────────────────────────────────
@app.post("/api/client/{client_id}/full-analysis")
async def full_analysis(client_id: str, request: FullAnalysisRequest = None):
    """All 4 APIs in one call. Cached 30 min. Send refresh=true to force re-run."""
    req = request or FullAnalysisRequest()
    try:
        result = await _run_agent_for_client(
            client_id,
            refresh=req.refresh,
            include_sentiment=req.include_sentiment,
            selected_fund_universe=req.selected_fund_universe,
            user_prompt=req.user_prompt,
        )
        summary = result.get("summary", {})
        summary["cache_hit"] = result.get("_cached_at") is not None and not req.refresh
        result["summary"] = summary
        return _safe_json(result)
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────────────────────
# API: Client Detail
# ─────────────────────────────────────────────────────────────
@app.get("/api/client/{client_id}/detail")
async def client_detail(client_id: str, refresh: bool = False):
    """Client profile, drift, risk summary, recommendations."""
    try:
        data = await _run_agent_for_client(client_id, refresh)
        return _safe_json({
            "success": True,
            "_from_cache": not refresh,
            "data": data.get("client_detail", {}),
        })
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────────────────────
# API: Risk Analysis
# ─────────────────────────────────────────────────────────────
@app.get("/api/client/{client_id}/risk-analysis")
async def risk_analysis(client_id: str, refresh: bool = False):
    """Risk score, stress tests, beta/vol/drawdown, LLM insights."""
    try:
        data = await _run_agent_for_client(client_id, refresh)
        return _safe_json({
            "success": True,
            "_from_cache": not refresh,
            "data": data.get("risk_analysis", {}),
        })
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────────────────────
# API: Investment Details
# ─────────────────────────────────────────────────────────────
@app.get("/api/client/{client_id}/investment-details")
async def investment_details(client_id: str, refresh: bool = False):
    """Sentiment headlines, stock holdings, fund performance."""
    try:
        data = await _run_agent_for_client(client_id, refresh)
        return _safe_json({
            "success": True,
            "_from_cache": not refresh,
            "data": data.get("investment_details", {}),
        })
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────────────────────
# API: Rebalancing Action
# ─────────────────────────────────────────────────────────────
@app.get("/api/action/rebalancing/{client_id}")
async def rebalancing_action(client_id: str, refresh: bool = False):
    """Trade list with rationales, tax analysis, approval workflow."""
    try:
        data = await _run_agent_for_client(client_id, refresh)
        return _safe_json({
            "success": True,
            "_from_cache": not refresh,
            "data": data.get("rebalancing_action", {}),
        })
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────────────────────
# API: Worklist (reads from DynamoDB, no agent call)
# ─────────────────────────────────────────────────────────────
@app.get("/api/worklist/rebalancing")
async def worklist(priority: str = "all", search: str = ""):
    """All clients needing rebalancing — reads from DynamoDB PortfolioLatest."""
    try:
        import boto3
        from dotenv import load_dotenv as _ld
        _ld()

        db = boto3.resource(
            "dynamodb",
            region_name=os.getenv("AWS_DEFAULT_REGION", "us-east-1"),
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
        )
        clients = db.Table("ClientMaster").scan()["Items"]
        items = []

        for client in clients:
            cid = client["client_id"]
            name = client.get("name", "")
            if search and search.lower() not in name.lower() and search not in cid:
                continue

            latest = db.Table("PortfolioLatest").get_item(
                Key={"client_id": cid}
            ).get("Item", {})
            if not latest:
                continue

            drift_score = float(latest.get("drift_score", 0))
            rebalance_needed = latest.get("rebalance_needed", False)
            portfolio_value = float(latest.get("portfolio_value", 0))

            if drift_score >= 5 or rebalance_needed:
                p_level, p_label, p_color = 1, "Critical", "#ef4444"
                reason = f"Drift >{drift_score:.1f}% - rebalance required"
            elif drift_score >= 3:
                p_level, p_label, p_color = 2, "High", "#f97316"
                reason = f"Drift {drift_score:.1f}% - review needed"
            elif drift_score >= 1:
                p_level, p_label, p_color = 3, "Medium", "#eab308"
                reason = f"Drift {drift_score:.1f}% - monitor"
            else:
                p_level, p_label, p_color = 4, "Low", "#22c55e"
                reason = "Within tolerance"

            if priority != "all" and str(p_level) != priority:
                continue

            items.append({
                "client_id": cid,
                "client_name": name,
                "aum": portfolio_value,
                "aum_formatted": f"${portfolio_value:,.0f}",
                "risk_profile": client.get("risk_tolerance", ""),
                "priority": {
                    "level": p_level, "label": p_label,
                    "color": p_color, "description": reason,
                },
                "trigger": {
                    "reason": reason, "drift_score": drift_score,
                    "rebalance_needed": rebalance_needed,
                },
                "next_best_action": {
                    "action_label": "Review Portfolio" if p_level <= 2 else "Monitor",
                    "action_url": f"/client/{cid}/rebalancing",
                    "requires_approval": p_level <= 2,
                },
                "metrics": {
                    "equity_weight": float(latest.get("equity_weight", 0)),
                    "bond_weight": float(latest.get("bond_weight", 0)),
                    "volatility_1y": float(latest.get("volatility_1y", 0)),
                    "sharpe_1y": float(latest.get("sharpe_1y", 0)),
                },
            })

        items.sort(key=lambda x: x["priority"]["level"])
        return {
            "success": True,
            "data": {
                "clients": items,
                "summary_stats": {
                    "total_clients": len(items),
                    "critical": sum(1 for c in items if c["priority"]["level"] == 1),
                    "high": sum(1 for c in items if c["priority"]["level"] == 2),
                    "medium": sum(1 for c in items if c["priority"]["level"] == 3),
                    "low": sum(1 for c in items if c["priority"]["level"] == 4),
                    "total_aum": sum(c["aum"] for c in items),
                },
            },
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────────────────────
# API: Cache management
# ─────────────────────────────────────────────────────────────
@app.delete("/api/client/{client_id}/cache")
async def clear_cache(client_id: str):
    """Clear cached analysis for a client."""
    p = _cache_path(client_id)
    if p.exists():
        p.unlink()
        return {"success": True, "message": f"Cache cleared for {client_id}"}
    return {"success": True, "message": "No cache found"}


@app.get("/api/cache/status")
async def cache_status():
    """Show what is cached and TTL remaining."""
    entries = []
    for f in CACHE_DIR.glob("*.json"):
        try:
            data = json.loads(f.read_text(encoding="utf-8"))
            cached_at = datetime.fromisoformat(data.get("_cached_at", "2000-01-01"))
            expires = cached_at + timedelta(minutes=CACHE_TTL)
            entries.append({
                "client_id": f.stem,
                "cached_at": cached_at.isoformat(),
                "expires_at": expires.isoformat(),
                "is_fresh": datetime.utcnow() < expires,
                "ttl_remaining_min": max(0, int((expires - datetime.utcnow()).total_seconds() / 60)),
            })
        except Exception:
            pass
    return {
        "success": True,
        "cache_dir": str(CACHE_DIR),
        "ttl_minutes": CACHE_TTL,
        "entries": entries,
    }


# ─────────────────────────────────────────────────────────────
# API: Fund Universe (all funds from DynamoDB FundMaster)
# ─────────────────────────────────────────────────────────────
@app.get("/api/fund-universe")
async def fund_universe():
    """Return all funds from the FundMaster DynamoDB table."""
    try:
        import boto3
        from decimal import Decimal
        from dotenv import load_dotenv as _ld
        _ld()

        db = boto3.resource(
            "dynamodb",
            region_name=os.getenv("AWS_DEFAULT_REGION", "us-east-1"),
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
        )

        def _decimal_to_float(obj):
            if isinstance(obj, list):    return [_decimal_to_float(i) for i in obj]
            if isinstance(obj, dict):    return {k: _decimal_to_float(v) for k, v in obj.items()}
            if isinstance(obj, Decimal): return float(obj)
            return obj

        table = db.Table("FundMaster")
        result = table.scan()
        items = result.get("Items", [])

        # Handle pagination for large tables
        while "LastEvaluatedKey" in result:
            result = table.scan(ExclusiveStartKey=result["LastEvaluatedKey"])
            items.extend(result.get("Items", []))

        items = _decimal_to_float(items)

        return {
            "success": True,
            "data": items,
            "total_count": len(items),
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────────────────────
# Health check
# ─────────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {"status": "ok", "version": "2.1.0"}



