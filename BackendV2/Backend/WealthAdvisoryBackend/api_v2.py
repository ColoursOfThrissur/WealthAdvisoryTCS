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
from datetime import datetime

from core.orchestrator import orchestrator
from services.client_repository import client_repository

app = FastAPI(title="Agentic Portfolio Report API v2")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
    """Get morning notes by calling external morning notes service"""
    import httpx
    from datetime import datetime

    try:
        user_name = request_data.get("user_name", "john")
        prompt = (
            f"/morning-note for {user_name} on yesterday's market recap, "
            "latest macro and economic updates, recent market news and investment implication "
            "for global tech sector"
        )

        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                "http://127.0.0.1:7000/process_message",
                json={"message": prompt}
            )

            if response.status_code == 200:
                data = response.json()

                # Clean up output — remove internal completeness checklist
                if data.get('output'):
                    output_lines = data['output'].split('\n')
                    cleaned_lines = []
                    skip_checklist = False
                    for line in output_lines:
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
                    data['output'] = '\n'.join(cleaned_lines).rstrip()

                return {
                    "success": True,
                    "data": data,
                    "timestamp": datetime.now().isoformat()
                }
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Morning notes service error: {response.text}"
                )

    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Morning notes service timeout")
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"Cannot connect to morning notes service: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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
