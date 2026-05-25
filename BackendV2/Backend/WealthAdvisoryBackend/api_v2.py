"""
Agentic Portfolio Report API - New Architecture
Uses Planner Agent + State Manager + Section Agents
"""
import sys
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

sys.path.insert(0, str(Path(__file__).parent / "src"))

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import json
import uuid
from datetime import datetime, timezone
import pytz
import boto3
from botocore.exceptions import ClientError

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from core.orchestrator import orchestrator
from services.client_repository import client_repository

# ─────────────────────────────────────────────────────────────
# Morning Notes — Default Config
# ─────────────────────────────────────────────────────────────
DEFAULT_MORNING_NOTE_CONFIG = {
    "advisor_id": "default",
    "sectors": ["Macro", "Equities", "Fixed Income"],
    "tickers": [],
    "geography": "US",
    "tone": "brief",
    "sections": {
        "top_call": True,
        "overnight": True,
        "key_events": True,
        "trade_ideas": False,
        "earnings_table": False,
        "macro_rates": True
    },
    "opinion": "balanced",
    "schedule": {
        "frequency": "once",
        "morning_time": "06:30",
        "afternoon_time": "13:00",
        "timezone": "US/Eastern",
        "days": ["Mon", "Tue", "Wed", "Thu", "Fri"],
        "paused": False
    }
}

# ─────────────────────────────────────────────────────────────
# AWS clients
# ─────────────────────────────────────────────────────────────
_AWS_REGION = os.getenv("AWS_DEFAULT_REGION", "us-east-1")
_dynamodb = boto3.resource(
    "dynamodb",
    region_name=_AWS_REGION,
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
)
_s3 = boto3.client(
    "s3",
    region_name=_AWS_REGION,
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
)
_CONFIG_TABLE = "WA_MorningNotesConfig"
_NOTES_TABLE  = "WA_MorningNotes"
_S3_BUCKET    = "wa-morning-notes-store"
_ADVISOR_ID   = "default"

# Local fallback paths (used if AWS is unavailable)
_DATA_DIR = Path(__file__).parent / "data"
_CONFIG_FILE = _DATA_DIR / "morning_notes_config.json"
_NOTES_DIR = _DATA_DIR / "morning_notes"
_DATA_DIR.mkdir(exist_ok=True)
_NOTES_DIR.mkdir(exist_ok=True)

# APScheduler instance
scheduler = AsyncIOScheduler()

# Day name → cron day_of_week mapping
_DAY_MAP = {
    "Mon": "mon", "Tue": "tue", "Wed": "wed",
    "Thu": "thu", "Fri": "fri", "Sat": "sat", "Sun": "sun"
}

app = FastAPI(title="Agentic Portfolio Report API v2")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─────────────────────────────────────────────────────────────
# Morning Notes — Config helpers (DynamoDB + local fallback)
# ─────────────────────────────────────────────────────────────
def _load_mn_config() -> dict:
    """Read config from DynamoDB. Falls back to local file then DEFAULT."""
    try:
        table = _dynamodb.Table(_CONFIG_TABLE)
        resp = table.get_item(Key={"advisor_id": _ADVISOR_ID})
        item = resp.get("Item")
        if item:
            item.pop("advisor_id", None)
            return item
    except Exception as e:
        print(f"[CONFIG] DynamoDB read failed: {e} — falling back to local file")
    # Local fallback
    try:
        if _CONFIG_FILE.exists():
            return json.loads(_CONFIG_FILE.read_text(encoding="utf-8"))
    except Exception:
        pass
    return DEFAULT_MORNING_NOTE_CONFIG.copy()


def _save_mn_config(config: dict):
    """Persist config to DynamoDB and local file."""
    try:
        table = _dynamodb.Table(_CONFIG_TABLE)
        table.put_item(Item={"advisor_id": _ADVISOR_ID, **config})
    except Exception as e:
        print(f"[CONFIG] DynamoDB write failed: {e} — saving to local file only")
    # Always write local fallback
    _CONFIG_FILE.write_text(json.dumps(config, indent=2), encoding="utf-8")


def _s3_key(date_str: str) -> str:
    """Build S3 key from date string."""
    y, m, _ = date_str.split("-")
    return f"{_ADVISOR_ID}/{y}/{m}/{date_str}.md"


def _save_mn_note(date_str: str, output: str, meta: dict):
    """Save note to S3 (markdown) and DynamoDB (metadata). Local files as fallback."""
    # 1. Save to S3
    if output:
        try:
            _s3.put_object(
                Bucket=_S3_BUCKET,
                Key=_s3_key(date_str),
                Body=output.encode("utf-8"),
                ContentType="text/markdown",
            )
        except Exception as e:
            print(f"[NOTES] S3 write failed: {e} — saving to local file")
            (_NOTES_DIR / f"{date_str}.md").write_text(output, encoding="utf-8")

    # 2. Save metadata to DynamoDB
    try:
        table = _dynamodb.Table(_NOTES_TABLE)
        ttl_value = int((datetime.now(timezone.utc).timestamp()) + 365 * 24 * 3600)
        s3_key_val = _s3_key(date_str) if output else None
        table.put_item(Item={
            "advisor_id": _ADVISOR_ID,
            "date": date_str,
            "s3_key": s3_key_val,
            "status": meta.get("status"),
            "generated_at": meta.get("generated_at"),
            "word_count": meta.get("word_count", 0),
            "topics_covered": meta.get("topics_covered", []),
            "config_snapshot": json.dumps(meta.get("config_snapshot", {})),
            "trigger": meta.get("trigger", "manual"),
            "error": meta.get("error", ""),
            "ttl": ttl_value,
        })
    except Exception as e:
        print(f"[NOTES] DynamoDB write failed: {e} — saving meta to local file")
        (_NOTES_DIR / f"{date_str}.meta.json").write_text(
            json.dumps(meta, indent=2), encoding="utf-8"
        )


def _load_today_note(date_str: str) -> dict | None:
    """Load today's note metadata from DynamoDB and content from S3."""
    try:
        table = _dynamodb.Table(_NOTES_TABLE)
        resp = table.get_item(Key={"advisor_id": _ADVISOR_ID, "date": date_str})
        item = resp.get("Item")
        if not item:
            return None
        if item.get("status") == "completed" and item.get("s3_key"):
            try:
                s3_resp = _s3.get_object(Bucket=_S3_BUCKET, Key=item["s3_key"])
                output = s3_resp["Body"].read().decode("utf-8")
                return {**item, "output": output}
            except Exception as e:
                print(f"[NOTES] S3 read failed: {e}")
                return {**item, "output": ""}
        return item
    except Exception as e:
        print(f"[NOTES] DynamoDB read failed: {e} — falling back to local file")
        # Local fallback
        meta_file = _NOTES_DIR / f"{date_str}.meta.json"
        md_file = _NOTES_DIR / f"{date_str}.md"
        if meta_file.exists():
            meta = json.loads(meta_file.read_text(encoding="utf-8"))
            if md_file.exists():
                meta["output"] = md_file.read_text(encoding="utf-8")
            return meta
        return None


def _delete_today_note(date_str: str):
    """Delete today's note from DynamoDB and S3."""
    try:
        _dynamodb.Table(_NOTES_TABLE).delete_item(
            Key={"advisor_id": _ADVISOR_ID, "date": date_str}
        )
    except Exception as e:
        print(f"[NOTES] DynamoDB delete failed: {e}")
    try:
        _s3.delete_object(Bucket=_S3_BUCKET, Key=_s3_key(date_str))
    except Exception as e:
        print(f"[NOTES] S3 delete failed: {e}")
    # Also clean local fallback files
    for ext in (".md", ".meta.json"):
        f = _NOTES_DIR / f"{date_str}{ext}"
        if f.exists():
            f.unlink()


def _load_mn_history(limit: int = 7) -> list:
    """Load last N note metadata rows from DynamoDB."""
    try:
        from boto3.dynamodb.conditions import Key as DKey
        table = _dynamodb.Table(_NOTES_TABLE)
        resp = table.query(
            KeyConditionExpression=DKey("advisor_id").eq(_ADVISOR_ID),
            ScanIndexForward=False,
            Limit=limit,
        )
        return resp.get("Items", [])
    except Exception as e:
        print(f"[NOTES] DynamoDB history query failed: {e} — falling back to local files")
        meta_files = sorted(_NOTES_DIR.glob("*.meta.json"), reverse=True)[:limit]
        history = []
        for f in meta_files:
            try:
                history.append(json.loads(f.read_text(encoding="utf-8")))
            except Exception:
                pass
        return history


def _build_morning_note_prompt(config: dict) -> str:
    """Build a dynamic /morning-note prompt from advisor config."""
    sectors = config.get("sectors", DEFAULT_MORNING_NOTE_CONFIG["sectors"])
    tickers = config.get("tickers", [])
    geography = config.get("geography", "US")
    tone = config.get("tone", "brief")
    sections = config.get("sections", DEFAULT_MORNING_NOTE_CONFIG["sections"])
    opinion = config.get("opinion", "balanced")

    # Base command
    prompt = "/morning-note"

    # Geography
    geo_map = {
        "US": "Focus on US markets only. Mention international developments only if they directly impact US.",
        "Global": "Cover global markets including US, Europe, and Asia-Pacific.",
        "Asia-Pacific": "Focus on Asia-Pacific markets. Include US developments that affect APAC.",
        "Europe": "Focus on European markets. Include US developments that affect Europe."
    }
    prompt += f"\n\n--- GEOGRAPHY ---\n{geo_map.get(geography, geo_map['US'])}"

    # Sectors
    prompt += f"\n\n--- SECTORS ---\nFocus ONLY on these sectors: {', '.join(sectors)}. Ignore unrelated sectors."

    # Tickers watchlist
    if tickers:
        prompt += f"\n\n--- WATCHLIST ---\nAlways check for news on these tickers and mention them if relevant: {', '.join(tickers)}."

    # Tone
    tone_map = {
        "brief": "Use bullet points only. Maximum 3 bullets per section. Keep the entire note under 400 words. No long paragraphs.",
        "balanced": "Mix of short bullets and brief paragraphs. Keep the note under 700 words.",
        "detailed": "Write full paragraphs with reasoning and analysis. Up to 1200 words."
    }
    prompt += f"\n\n--- TONE ---\n{tone_map.get(tone, tone_map['brief'])}"

    # Sections
    disabled = [k for k, v in sections.items() if not v]
    if disabled:
        section_label_map = {
            "trade_ideas": "Trade Ideas",
            "earnings_table": "Earnings Table",
            "macro_rates": "Macro & Rates",
            "overnight": "Overnight/Pre-Market Developments",
            "key_events": "Key Events Today"
        }
        skip_labels = [section_label_map[s] for s in disabled if s in section_label_map]
        if skip_labels:
            prompt += f"\n\n--- SECTIONS TO SKIP ---\nDo NOT include these sections: {', '.join(skip_labels)}. Omit them entirely."

    # Opinion level
    opinion_map = {
        "factual": "Summarise only. Do not give directional calls or strong opinions. State facts.",
        "balanced": "Provide moderate views where relevant. Back opinions with data.",
        "opinionated": "Be opinionated. Give clear directional calls on each item. State your view confidently."
    }
    prompt += f"\n\n--- OPINION LEVEL ---\n{opinion_map.get(opinion, opinion_map['balanced'])}"

    return prompt


def _extract_topics(output: str) -> list:
    """Simple keyword scan to populate topics_covered metadata."""
    keywords = {
        "tech": ["tech", "nvidia", "apple", "microsoft", "semiconductor", "ai ", "software"],
        "macro": ["fed", "inflation", "gdp", "interest rate", "macro", "central bank"],
        "earnings": ["earnings", "eps", "revenue", "beat", "miss", "guidance"],
        "fixed_income": ["bond", "yield", "treasury", "fixed income", "credit"],
        "equities": ["equity", "stock", "s&p", "nasdaq", "dow"],
        "energy": ["oil", "energy", "crude", "opec"],
        "healthcare": ["healthcare", "pharma", "fda", "biotech"],
    }
    lower = output.lower()
    return [topic for topic, words in keywords.items() if any(w in lower for w in words)]


async def _generate_and_store_note(config: dict) -> dict:
    """
    Core generation logic — called by both the API endpoint and the scheduler.
    Returns { success, output, timestamp, word_count, topics_covered }
    """
    import httpx
    date_str = datetime.now().strftime("%Y-%m-%d")
    generated_at = datetime.now().isoformat()

    # Write generating status immediately so UI can show spinner
    _save_mn_note(date_str, "", {
        "date": date_str,
        "status": "generating",
        "generated_at": generated_at,
        "word_count": 0,
        "topics_covered": [],
        "config_snapshot": config,
        "trigger": "manual"
    })

    prompt = _build_morning_note_prompt(config)

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                "http://127.0.0.1:7000/process_message",
                json={"message": prompt}
            )
            response.raise_for_status()
            data = response.json()

        output = data.get("output", "")

        # Strip checklist and artifacts
        cleaned_lines = []
        skip_section = False
        for line in output.split("\n"):
            trimmed = line.strip()
            # Start skipping on any checklist/artifact marker
            if any(marker in trimmed for marker in [
                "Completeness Checklist", "Checklist:", "checklist"
            ]) or trimmed in ("***", "---") and skip_section:
                skip_section = True
                continue
            if skip_section:
                if trimmed.startswith(("[x]", "[ ]", "*Note:", "*   [x]", "*   [ ]")):
                    continue
                # Stop skipping if we hit a real section header
                if trimmed.startswith("**") and trimmed.endswith("**"):
                    skip_section = False
                else:
                    continue
            # Always skip standalone *** and checklist lines
            if trimmed == "***":
                continue
            if trimmed.startswith(("[x]", "[ ]")):
                continue
            if trimmed.startswith("*Note:") and "checklist" in trimmed.lower():
                continue
            cleaned_lines.append(line)
        output = "\n".join(cleaned_lines).rstrip()

        word_count = len(output.split())
        topics = _extract_topics(output)

        meta = {
            "date": date_str,
            "status": "completed",
            "generated_at": generated_at,
            "word_count": word_count,
            "topics_covered": topics,
            "config_snapshot": config,
            "trigger": "manual"
        }
        _save_mn_note(date_str, output, meta)

        return {"success": True, "output": output, "timestamp": generated_at,
                "word_count": word_count, "topics_covered": topics}

    except Exception as e:
        meta = {
            "date": date_str,
            "status": "failed",
            "generated_at": generated_at,
            "word_count": 0,
            "topics_covered": [],
            "config_snapshot": config,
            "error": str(e),
            "trigger": "manual"
        }
        _save_mn_note(date_str, "", meta)
        raise


# ─────────────────────────────────────────────────────────────
# Morning Notes — Scheduler helpers
# ─────────────────────────────────────────────────────────────
async def _scheduled_morning_note():
    """Job fired by APScheduler. Reads latest config and generates note."""
    print("[SCHEDULER] Morning note job fired")
    config = _load_mn_config()
    try:
        result = await _generate_and_store_note({**config, "trigger": "scheduled"})
        print(f"[SCHEDULER] Note generated — {result['word_count']} words, topics: {result['topics_covered']}")
    except Exception as e:
        print(f"[SCHEDULER] Note generation failed: {e}")


def _reschedule_job(config: dict):
    """
    Cancel existing scheduler jobs and create new ones based on config.
    Called on startup and whenever config is saved.
    """
    # Remove existing morning notes jobs
    for job_id in ("mn_morning", "mn_afternoon"):
        if scheduler.get_job(job_id):
            scheduler.remove_job(job_id)

    schedule = config.get("schedule", {})
    if schedule.get("paused", False):
        print("[SCHEDULER] Morning notes scheduler is paused — no jobs created")
        return

    days = schedule.get("days", ["Mon", "Tue", "Wed", "Thu", "Fri"])
    day_of_week = ",".join(_DAY_MAP[d] for d in days if d in _DAY_MAP)
    tz = schedule.get("timezone", "US/Eastern")

    try:
        tz_obj = pytz.timezone(tz)
    except Exception:
        tz_obj = pytz.timezone("US/Eastern")

    morning_time = schedule.get("morning_time", "06:30")
    m_hour, m_min = morning_time.split(":")
    scheduler.add_job(
        _scheduled_morning_note,
        CronTrigger(day_of_week=day_of_week, hour=int(m_hour), minute=int(m_min), timezone=tz_obj),
        id="mn_morning",
        replace_existing=True
    )
    print(f"[SCHEDULER] Morning job set: {morning_time} {tz} on {day_of_week}")

    if schedule.get("frequency") == "twice":
        afternoon_time = schedule.get("afternoon_time", "13:00")
        a_hour, a_min = afternoon_time.split(":")
        scheduler.add_job(
            _scheduled_morning_note,
            CronTrigger(day_of_week=day_of_week, hour=int(a_hour), minute=int(a_min), timezone=tz_obj),
            id="mn_afternoon",
            replace_existing=True
        )
        print(f"[SCHEDULER] Afternoon job set: {afternoon_time} {tz} on {day_of_week}")


@app.on_event("startup")
async def startup_event():
    """Start APScheduler and load morning notes schedule from config."""
    scheduler.start()
    config = _load_mn_config()
    _reschedule_job(config)
    print("[STARTUP] APScheduler started. Morning notes scheduler loaded.")


@app.on_event("shutdown")
async def shutdown_event():
    scheduler.shutdown(wait=False)
    print("[SHUTDOWN] APScheduler stopped.")


@app.get("/api/health")
async def health_check():
    """Health check"""
    return {
        "status": "healthy",
        "service": "agentic-backend-v2",
        "architecture": "planner + state + agents + client_repository",
        "gemini_configured": bool(os.getenv("GEMINI_API_KEY")),
        "total_clients": len(client_repository.clients)
    }


@app.post("/api/session/create")
async def create_session():
    """Create new report generation session"""
    session_id = orchestrator.create_session()
    return {
        "session_id": session_id,
        "created_at": datetime.now().isoformat()
    }


@app.get("/api/session/{session_id}")
async def get_session_status(session_id: str):
    """Get session status"""
    status = await orchestrator.get_session_status(session_id)
    if not status["exists"]:
        raise HTTPException(status_code=404, detail="Session not found")
    return status


@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    """Upload portfolio file"""
    try:
        # Save to temp directory in agentic-backend
        temp_dir = Path(__file__).parent / "temp"
        temp_dir.mkdir(exist_ok=True)
        
        file_path = temp_dir / f"{uuid.uuid4()}_{file.filename}"
        
        with file_path.open("wb") as f:
            content = await file.read()
            f.write(content)
        
        return {
            "success": True,
            "file_path": str(file_path.absolute()),
            "filename": file.filename
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.websocket("/ws/chat/{session_id}")
async def chat_websocket(websocket: WebSocket, session_id: str):
    """WebSocket endpoint for chat interface"""
    print(f"[WS] New connection request for session: {session_id}")
    await websocket.accept()
    print(f"[WS] Connection accepted for session: {session_id}")
    
    # Store websocket in orchestrator for status updates
    orchestrator.active_websockets[session_id] = websocket
    
    try:
        # Send welcome message
        await websocket.send_json({
            "type": "connected",
            "session_id": session_id
        })
        print(f"[WS] Sent welcome message to session: {session_id}")
        
        while True:
            # Receive message
            data = await websocket.receive_json()
            print(f"[WS] Received message from session {session_id}: {data.get('type')}")
            
            if data["type"] == "message":
                user_message = data["content"]
                uploaded_file = data.get("file_path")
                benchmark = data.get("benchmark")
                
                print(f"[WS] Processing message: '{user_message[:50]}...'")
                print(f"[WS] File: {uploaded_file}, Benchmark: {benchmark}")
                
                # Process through orchestrator (runs as task so WS stays alive)
                import asyncio
                response = await orchestrator.handle_message(
                    session_id,
                    user_message,
                    uploaded_file,
                    benchmark
                )

                print(f"[WS] Sending response type: {response.get('type')}")
                # Send response
                await websocket.send_json(response)

            elif data["type"] == "ping":
                await websocket.send_json({"type": "pong"})
    
    except WebSocketDisconnect:
        print(f"[WS] Client disconnected: {session_id}")
    except Exception as e:
        print(f"[WS] Error in session {session_id}: {str(e)}")
        await websocket.send_json({
            "type": "error",
            "message": f"Error: {str(e)}"
        })
    finally:
        # Remove websocket
        orchestrator.active_websockets.pop(session_id, None)
        print(f"[WS] Cleaned up session: {session_id}")


@app.post("/api/chat/{session_id}")
async def chat_http(session_id: str, message: dict):
    """HTTP endpoint for chat (alternative to WebSocket)"""
    try:
        user_message = message.get("content", "")
        uploaded_file = message.get("file_path")
        
        response = await orchestrator.handle_message(
            session_id,
            user_message,
            uploaded_file
        )
        
        return response
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/download/{filename}")
async def download_pdf(filename: str):
    """Download generated PDF report"""
    from fastapi.responses import FileResponse
    
    try:
        # Security: only allow files from output/reports
        reports_dir = Path(__file__).parent.parent / "output" / "reports"
        file_path = reports_dir / filename
        
        # Validate file exists and is in reports directory
        if not file_path.exists() or not str(file_path).startswith(str(reports_dir)):
            raise HTTPException(status_code=404, detail="File not found")
        
        return FileResponse(
            path=str(file_path),
            filename=filename,
            media_type='application/pdf'
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/debug/save-response")
async def save_debug_response(response_data: dict):
    """Save LLM response to temp file for debugging"""
    try:
        from pathlib import Path
        import json
        
        temp_file = Path(__file__).parent / "temp" / "llm_response_debug.json"
        temp_file.parent.mkdir(exist_ok=True)
        
        with open(temp_file, 'w', encoding='utf-8') as f:
            json.dump(response_data, f, indent=2, ensure_ascii=False)
        
        return {"success": True}
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.post("/api/session/{session_id}/mode")
async def set_session_mode(session_id: str, mode_data: dict):
    """Set session mode (normal/research)"""
    try:
        from core.state_manager import state_manager
        state = state_manager.get_session(session_id)
        
        if not state:
            raise HTTPException(status_code=404, detail="Session not found")
        
        mode = mode_data.get("mode", "normal")
        if mode == "research":
            state.add_data("_research_mode", True)
        else:
            state.collected_data.pop("_research_mode", None)
        
        return {
            "success": True,
            "mode": mode
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/clients")
async def list_clients():
    """List all active clients"""
    try:
        clients = client_repository.list_all_clients()
        return {
            "success": True,
            "total": len(clients),
            "clients": [
                {
                    "client_id": c["client_id"],
                    "name": c["name"],
                    "aum": c["aum"],
                    "risk_profile": c["risk_profile"],
                    "advisor": c["advisor"]
                }
                for c in clients
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/clients/{client_name}")
async def get_client(client_name: str):
    """Get specific client details"""
    try:
        client = client_repository.find_client(client_name)
        if not client:
            raise HTTPException(status_code=404, detail="Client not found")
        
        return {
            "success": True,
            "client": client
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/morning-notes")
async def get_morning_notes(request_data: dict):
    """Generate morning notes using advisor config."""
    try:
        # Config priority: request body config > saved file config > default
        request_config = request_data.get("config")
        if request_config and isinstance(request_config, dict):
            config = {**DEFAULT_MORNING_NOTE_CONFIG, **request_config}
        else:
            config = _load_mn_config()

        result = await _generate_and_store_note(config)
        return {
            "success": True,
            "data": {"output": result["output"]},
            "timestamp": result["timestamp"],
            "word_count": result["word_count"],
            "topics_covered": result["topics_covered"]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/morning-notes/config")
async def get_morning_notes_config():
    """Return current morning notes config. Falls back to default if none saved."""
    config = _load_mn_config()
    return {"success": True, "config": config, "is_default": not _CONFIG_FILE.exists()}


@app.post("/api/morning-notes/config")
async def save_morning_notes_config(config_data: dict):
    """Save morning notes config and reschedule APScheduler job."""
    try:
        # Merge with defaults so partial saves are safe
        config = {**DEFAULT_MORNING_NOTE_CONFIG, **config_data}

        # Basic validation
        if not config.get("sectors"):
            config["sectors"] = DEFAULT_MORNING_NOTE_CONFIG["sectors"]

        schedule = config.get("schedule", {})
        for time_field in ("morning_time", "afternoon_time"):
            t = schedule.get(time_field, "")
            if t and ":" not in t:
                schedule[time_field] = DEFAULT_MORNING_NOTE_CONFIG["schedule"][time_field]
        config["schedule"] = schedule

        _save_mn_config(config)
        _reschedule_job(config)

        return {"success": True, "config": config}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/morning-notes/history")
async def get_morning_notes_history(limit: int = 7):
    """Return metadata for the last N morning notes."""
    try:
        history = _load_mn_history(limit)
        return {"success": True, "history": history, "count": len(history)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/morning-notes/today")
async def get_today_morning_note():
    """Return today's note if already generated."""
    date_str = datetime.now().strftime("%Y-%m-%d")
    item = _load_today_note(date_str)
    if not item:
        return {"success": False, "status": "not_found"}
    if item.get("status") == "completed" and item.get("output"):
        return {
            "success": True,
            "status": "completed",
            "data": {"output": item["output"]},
            "timestamp": item.get("generated_at"),
            "word_count": item.get("word_count"),
            "topics_covered": item.get("topics_covered", []),
            "trigger": item.get("trigger", "manual")
        }
    return {"success": False, "status": item.get("status", "unknown")}


@app.delete("/api/morning-notes/today/reset")
async def reset_today_morning_note():
    """Delete today's note so next generation starts fresh."""
    date_str = datetime.now().strftime("%Y-%m-%d")
    _delete_today_note(date_str)
    return {"success": True}


@app.get("/api/morning-notes/date/{date_str}")
async def get_note_by_date(date_str: str):
    """Return a specific date's note from DynamoDB + S3."""
    item = _load_today_note(date_str)
    if not item:
        return {"success": False, "status": "not_found"}
    if item.get("status") == "completed" and item.get("output"):
        return {
            "success": True,
            "status": "completed",
            "data": {"output": item["output"]},
            "timestamp": item.get("generated_at"),
            "word_count": item.get("word_count"),
            "topics_covered": item.get("topics_covered", []),
        }
    return {"success": False, "status": item.get("status", "unknown")}


@app.get("/api/morning-notes/scheduler/status")
async def scheduler_status():
    """Ops endpoint — shows current scheduler job state."""
    jobs = []
    for job_id in ("mn_morning", "mn_afternoon"):
        job = scheduler.get_job(job_id)
        if job:
            jobs.append({
                "job_id": job_id,
                "next_run": job.next_run_time.isoformat() if job.next_run_time else None,
                "trigger": str(job.trigger)
            })
    config = _load_mn_config()
    return {
        "scheduler_running": scheduler.running,
        "paused": config.get("schedule", {}).get("paused", False),
        "jobs": jobs
    }


# Session-based conversation history for research mode
research_sessions = {}


@app.get("/api/client/{client_id}/meeting-prep")
async def meeting_prep(client_id: str):
    """
    Return structured meeting prep data for a client.
    Pulls from client_repository — no LLM call, fast and deterministic.
    """
    try:
        client = client_repository.clients_by_id.get(client_id)
        if not client:
            raise HTTPException(status_code=404, detail=f"Client '{client_id}' not found")

        holdings = client_repository.get_holdings(client_id)
        transactions = client_repository.get_transactions(client_id)

        # Last 5 transactions as recent activity
        recent_transactions = transactions[-5:] if transactions else []

        # Top holdings by value
        portfolio = holdings.get("portfolio", {})
        positions = portfolio.get("positions", [])
        top_holdings = sorted(positions, key=lambda x: x.get("market_value", 0), reverse=True)[:5]

        return {
            "success": True,
            "data": {
                "client_id": client_id,
                "client_name": client["name"],
                "aum": client["aum"],
                "risk_profile": client["risk_profile"],
                "advisor": client["advisor"],
                "inception_date": client["inception_date"],
                "portfolio_return": client["metadata"].get("portfolio_return", 0),
                "last_report": client["metadata"].get("last_report"),
                "tags": client["metadata"].get("tags", []),
                "top_holdings": top_holdings,
                "recent_transactions": recent_transactions,
                "profile": {
                    "age": client["age"],
                    "country": client["country"],
                    "dependents": client["dependents"],
                    "business_owner": client["business_owner"],
                    "has_mortgage": client["has_mortgage"],
                }
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/research/{session_id}")
async def research_query(session_id: str, request_data: dict):
    """Forward research queries to port 7000 with session memory"""
    import httpx

    try:
        query = request_data.get("query", "")

        if session_id not in research_sessions:
            research_sessions[session_id] = []

        research_sessions[session_id].append({"role": "user", "content": query})

        context = "\n".join([
            f"{msg['role'].upper()}: {msg['content']}"
            for msg in research_sessions[session_id][-5:]
        ])

        prompt = f"/research-equity {query}"
        if len(research_sessions[session_id]) > 1:
            prompt = f"/research-equity Context from previous conversation:\n{context}\n\nNew query: {query}"

        async with httpx.AsyncClient(timeout=240.0) as client:
            response = await client.post(
                "http://127.0.0.1:7000/process_message",
                json={"message": prompt}
            )

            if response.status_code == 200:
                data = response.json()
                answer = data.get('output', '')

                # Clean up output — remove internal completeness checklist
                if answer:
                    cleaned_lines = []
                    skip_checklist = False
                    for line in answer.split('\n'):
                        trimmed = line.strip()
                        if 'Completeness Checklist' in trimmed:
                            skip_checklist = True
                            continue
                        if skip_checklist:
                            if trimmed == '---' or trimmed.startswith('[x]') or trimmed.startswith('[ ]'):
                                continue
                            if trimmed.startswith('*Note:') and 'checklist' in trimmed.lower():
                                continue
                            if trimmed == '':
                                continue
                        else:
                            cleaned_lines.append(line)
                    answer = '\n'.join(cleaned_lines).rstrip()

                research_sessions[session_id].append({"role": "assistant", "content": answer})

                return {
                    "success": True,
                    "answer": answer,
                    "session_id": session_id
                }
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Research service error: {response.text}"
                )

    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Research service timeout")
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"Cannot connect to research service: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
