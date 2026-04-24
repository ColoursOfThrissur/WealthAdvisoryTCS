# WealthAdvisory — Runbook & Backend Connection Map

---

## Port Map (No Conflicts)

| Service | File | Port |
|---|---|---|
| StockStory Server | `BackendV2/Backend/stockStoryServer/backend/app.py` | **7000** |
| Perplexity MCP | `BackendV2/Backend/perplexitymcp/server.py` | **8000** |
| WealthAdvisory Backend | `BackendV2/Backend/WealthAdvisoryBackend/api_v2.py` | **8001** |
| Portfolio Rebalancing API | `BackendV2/portfolio_rebalancing_agentic_api/app.py` | **8003** |
| Portfolio Rebalancing MCP Server | `BackendV2/portfolio_rebalancing_agentic_mcp_server/server.py` | **8004** |
| Frontend (Vite) | `front end/` | **5173** |

---

## How to Run (6 Terminals — in order)

### Terminal 1 — Perplexity MCP (port 8000)
```bash
cd BackendV2/Backend/perplexitymcp
pip install -r requirements.txt
python server.py
```

### Terminal 2 — StockStory Server (port 7000)
```bash
cd BackendV2/Backend/stockStoryServer/backend
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 7000
```

### Terminal 3 — WealthAdvisory Backend (port 8001)
```bash
cd BackendV2/Backend/WealthAdvisoryBackend
pip install -r requirements.txt
python api_v2.py
```

### Terminal 4 — Portfolio Rebalancing MCP Server (port 8004)
```bash
cd BackendV2/portfolio_rebalancing_agentic_mcp_server
pip install -r requirements.txt
python server.py
```

### Terminal 5 — Portfolio Rebalancing API (port 8003)
```bash
cd BackendV2/portfolio_rebalancing_agentic_api
pip install -r requirements_fallback.txt
uvicorn app:app --host 0.0.0.0 --port 8003
```

### Terminal 6 — Frontend
```bash
cd "front end"
npm install
npm start
```

> Start in order: 1 → 2 → 3 → 4 → 5 → 6
> MCP server (4) must be up before Rebalancing API (5) — it connects on startup via `mcp_config.json`
> StockStory (2) must be up before WealthAdvisory Backend (3) — it's called internally for morning notes and research

---

## Health Checks

```
GET http://localhost:8001/api/health     → WealthAdvisory Backend
GET http://localhost:8003/health         → Portfolio Rebalancing API
GET http://localhost:7000/health         → StockStory Server
GET http://localhost:5173                → Frontend
```

---

## Backend Connection Map

### Frontend → WealthAdvisory Backend (port 8001)

| Frontend File | Endpoint | Purpose |
|---|---|---|
| `config/api.js` | base: `http://localhost:8001` | All `getApiUrl()` calls |
| `services/apiService.js` | `POST /api/session/create` | Create WebSocket session |
| `services/apiService.js` | `GET /api/session/{id}` | Get session status |
| `services/apiService.js` | `POST /api/upload` | Upload portfolio file |
| `services/apiService.js` | `GET /api/download/{filename}` | Download PDF report |
| `hooks/useWebSocket.js` | `WS ws://localhost:8001/ws/chat/{sessionId}` | Real-time chat / report generation |
| `hooks/useReportChat.js` | `POST /api/debug/save-response` | Debug LLM response save |
| `components/BackendChatInterface.jsx` | `GET /api/clients` | List clients for meeting prep |
| `components/BackendChatInterface.jsx` | `GET /api/client/{id}/meeting-prep` | Meeting prep data |
| `components/BackendChatInterface.jsx` | `POST /api/research/{sessionId}` | Research mode queries → StockStory via 7000 |
| `components/MorningNoteCard.jsx` | `POST /api/morning-notes` | Morning notes → StockStory via 7000 |

### Frontend → Portfolio Rebalancing API (port 8003)

| Frontend File | Endpoint | Purpose |
|---|---|---|
| `services/clientDataService.js` | `POST /api/client/{id}/full-analysis` | Full client analysis (cached 30 min) |
| `services/clientDataService.js` | `GET /api/client/{id}/detail` | Client profile + drift |
| `services/clientDataService.js` | `GET /api/client/{id}/risk-analysis` | Risk metrics |
| `services/clientDataService.js` | `GET /api/client/{id}/investment-details` | Sentiment + holdings |
| `services/clientDataService.js` | `GET /api/action/rebalancing/{id}` | Trade recommendations |
| `services/clientDataService.js` | `GET /api/worklist/rebalancing` | Rebalancing worklist (DynamoDB) |
| `services/clientDataService.js` | `GET /api/fund-universe` | Fund universe (DynamoDB FundMaster) |

### Internal Service Calls

| From | To | Endpoint | Purpose |
|---|---|---|---|
| WealthAdvisory Backend (8001) | StockStory (7000) | `POST /process_message` | Morning notes + research queries |
| Portfolio Rebalancing API (8003) | Portfolio Rebalancing MCP (8004) | SSE `/sse` | MCP tools (portfolio data, risk, drift, sentiment) |
| Portfolio Rebalancing MCP (8004) | Perplexity API (external) | HTTPS | Web search for sentiment |
| Portfolio Rebalancing MCP (8004) | AWS DynamoDB | AWS SDK | ClientMaster, Holdings, IPS, FundMaster, Sentiment tables |

---

## Frontend `.env` Variables

```env
VITE_API_BASE_URL=http://localhost:8001          # WealthAdvisory Backend
VITE_WS_BASE_URL=ws://localhost:8001             # WebSocket (same backend)
VITE_REBALANCING_API_URL=http://localhost:8003   # Portfolio Rebalancing API
```

---

## Key Config Files

| File | Purpose |
|---|---|
| `front end/.env` | Frontend API URLs |
| `front end/src/config/api.js` | Exports `API_BASE_URL`, `REBALANCING_API_URL`, `getApiUrl()`, `getWsBaseUrl()` |
| `BackendV2/portfolio_rebalancing_agentic_api/mcp_config.json` | Points Rebalancing API to MCP server at port 8004 |
| `BackendV2/portfolio_rebalancing_agentic_mcp_server/.env` | AWS credentials + Finnhub + Perplexity keys |
| `BackendV2/Backend/WealthAdvisoryBackend/.env` | Gemini + OpenAI + Langfuse keys |
| `BackendV2/Backend/stockStoryServer/backend/.env` | OpenAI + Google API keys |
| `BackendV2/Backend/perplexitymcp/.env` | Perplexity API key |
