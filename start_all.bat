@echo off
REM ============================================================
REM  DAILY START: Launches all 6 services in separate windows
REM  Order: Perplexity -> StockStory -> WealthAdvisory -> MCP Server -> Rebalancing API -> Frontend
REM ============================================================

set ROOT=%~dp0

echo Starting all services...

REM 1. Perplexity MCP (port 8000) — no deps
start "Perplexity MCP :8000" cmd /k "cd /d "%ROOT%BackendV2\Backend\perplexitymcp" && .venv\Scripts\activate.bat && python server.py"

REM Small delay so MCP is up before dependents
timeout /t 3 /nobreak >nul

REM 2. StockStory Server (port 7000) — no deps
start "StockStory :7000" cmd /k "cd /d "%ROOT%BackendV2\Backend\stockStoryServer\backend" && .venv\Scripts\activate.bat && uvicorn app:app --host 0.0.0.0 --port 7000"

timeout /t 3 /nobreak >nul

REM 3. WealthAdvisory Backend (port 8001) — needs StockStory
start "WealthAdvisory :8001" cmd /k "cd /d "%ROOT%BackendV2\Backend\WealthAdvisoryBackend" && .venv\Scripts\activate.bat && python api_v2.py"

REM 4. Portfolio Rebalancing MCP Server (port 8004) — needs to be up before API
start "Rebalancing MCP :8004" cmd /k "cd /d "%ROOT%BackendV2\portfolio_rebalancing_agentic_mcp_server" && .venv\Scripts\activate.bat && python server.py"

timeout /t 3 /nobreak >nul

REM 5. Portfolio Rebalancing API (port 8003) — needs MCP Server
start "Rebalancing API :8003" cmd /k "cd /d "%ROOT%BackendV2\portfolio_rebalancing_agentic_api" && .venv\Scripts\activate.bat && uvicorn app:app --host 0.0.0.0 --port 8003"

REM 6. Frontend (port 5173)
start "Frontend :5173" cmd /k "cd /d "%ROOT%front end" && npm start"

echo.
echo ====== All 6 services launched ======
echo   Perplexity MCP    http://localhost:8000
echo   StockStory        http://localhost:7000
echo   WealthAdvisory    http://localhost:8001
echo   Rebalancing MCP   http://localhost:8004
echo   Rebalancing API   http://localhost:8003
echo   Frontend          http://localhost:5173
echo.
echo Close individual windows to stop a service.
pause
