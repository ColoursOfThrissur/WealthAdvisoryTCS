import traceback
import asyncio
from typing import Optional, Dict, List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import tiktoken

from sample_api import agent
from token_tracker import get_total_tool_tokens, add_tool_tokens
from kb_chatbot_integration import handle_knowledge_query

from skill_manager import skill_manager
from financial_planner_agent import run_planner

# ─────────────────────────────────────────────────────────────
# App setup
# ─────────────────────────────────────────────────────────────
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
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
# Health check
# ─────────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {"status": "healthy", "service": "stockstory"}

# ─────────────────────────────────────────────────────────────
# Request model
# ─────────────────────────────────────────────────────────────
class MessageRequest(BaseModel):
    message: str
    session_id: Optional[str] = "default"

class MorningNoteRequest(BaseModel):
    user_name: Optional[str] = "advisor"

# ─────────────────────────────────────────────────────────────
# API: Morning notes
# ─────────────────────────────────────────────────────────────
@app.post("/api/morning-notes")
async def get_morning_notes(request: MorningNoteRequest):
    try:
        skill = skill_manager.get_skill_for_message("/morning-note")
        if not skill:
            raise HTTPException(status_code=500, detail="Morning note skill not found")
        result = await run_planner("Generate today's morning note", [], skill, is_followup=False)
        output_text = result.output or ""
        return {"success": True, "data": {"output": output_text}}
    except Exception as e:
        print("❌ Exception in /api/morning-notes")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# ─────────────────────────────────────────────────────────────
# API: Process message
# ─────────────────────────────────────────────────────────────
@app.post("/process_message")
async def handle_agent_request(request: MessageRequest):
    user_message = request.message.strip()
    session_id = request.session_id or "default"

    if not user_message:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    try:
        history = session_histories.get(session_id, [])

        # 1. Check if it's a known Skill command first
        matched_skill = skill_manager.get_skill_for_message(user_message)
        if matched_skill:
            input_tokens = count_tokens(user_message)
            session_skills[session_id] = matched_skill  # remember skill for follow-ups
            result = await run_planner(user_message, history, matched_skill, is_followup=False)
            session_histories[session_id] = result.all_messages()
            output_text = result.output or ""

        # 2. If it's a slash command but not recognized
        elif user_message.startswith("/"):
            keys = list(skill_manager.skills.keys())
            available = ", ".join(keys) if keys else "None"
            return {
                "output": f"Unknown skill command. Available skills: {available}",
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
            print(f"🔄 Routing follow-up to planner agent (skill: {active_skill.get('command')})")
            result = await run_planner(user_message, history, active_skill, is_followup=True)
            session_histories[session_id] = result.all_messages()
            output_text = result.output or ""

        # 4. Standard fallback for conversational behavior (original stock analyst)
        else:
            # Check knowledge base first
            kb_response = handle_knowledge_query(user_message)
            if kb_response:
                return {
                    "output": kb_response["answer"],
                    "sources": kb_response.get("sources", []),
                    "confidence": kb_response.get("confidence", 0),
                    "input_tokens": 0,
                    "output_tokens": 0
                }

            # Token count (input)
            input_tokens = count_tokens(user_message)

            # Run agent safely (non-blocking)
            result = await asyncio.to_thread(
                agent.run_sync,
                user_message,
                message_history=history
            )

            session_histories[session_id] = result.all_messages()
            output_text = result.output or ""

        # Token count (output)
        output_tokens = count_tokens(output_text)
        add_tool_tokens(input_tokens, output_tokens)

        # Conversation token totals
        total_input_tokens = sum(
            count_tokens(msg.content)
            for msg in session_histories[session_id]
            if getattr(msg, "role", "") == "user"
        )

        total_output_tokens = sum(
            count_tokens(msg.content)
            for msg in session_histories[session_id]
            if getattr(msg, "role", "") == "assistant"
        )

        total_tokens_conversation = total_input_tokens + total_output_tokens

        total_tool_input, total_tool_output = get_total_tool_tokens()

        # Debug log
        print("─────────────────────────────")
        print(f"📨 Session ID: {session_id}")
        print(f"📝 User message: {user_message}")
        print(f"🔢 Input tokens: {input_tokens}")
        print(f"🟢 Output tokens: {output_tokens}")
        print(f"📚 Conversation tokens: {total_tokens_conversation}")
        print(f"🧮 Tool tokens: {total_tool_input + total_tool_output}")
        print("─────────────────────────────")

        return {
            "output": output_text,
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
        print("❌ Exception in /process_message")
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
    print(f"🔁 Session reset: {session_id}")
    return {"status": "ok", "message": f"Session '{session_id}' has been reset."}

