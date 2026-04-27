@echo off
REM ============================================================
REM  ONE-TIME SETUP: Creates venvs + installs deps for all backends
REM  Run this once (or after adding new dependencies)
REM ============================================================

set ROOT=%~dp0

echo.
echo ====== [1/5] Perplexity MCP ======
cd /d "%ROOT%BackendV2\Backend\perplexitymcp"
if not exist ".venv" python -m venv .venv
call .venv\Scripts\activate.bat
pip install -r requirements.txt
call deactivate

echo.
echo ====== [2/5] StockStory Server ======
cd /d "%ROOT%BackendV2\Backend\stockStoryServer\backend"
if not exist ".venv" python -m venv .venv
call .venv\Scripts\activate.bat
pip install -r requirements.txt
call deactivate

echo.
echo ====== [3/5] WealthAdvisory Backend ======
cd /d "%ROOT%BackendV2\Backend\WealthAdvisoryBackend"
if not exist ".venv" python -m venv .venv
call .venv\Scripts\activate.bat
pip install -r requirements.txt
call deactivate

echo.
echo ====== [4/5] Portfolio Rebalancing MCP Server ======
cd /d "%ROOT%BackendV2\portfolio_rebalancing_agentic_mcp_server"
if not exist ".venv" python -m venv .venv
call .venv\Scripts\activate.bat
pip install -r requirements_fallback.txt
call deactivate

echo.
echo ====== [5/5] Portfolio Rebalancing API ======
cd /d "%ROOT%BackendV2\portfolio_rebalancing_agentic_api"
if not exist ".venv" python -m venv .venv
call .venv\Scripts\activate.bat
pip install -r requirements_fallback.txt
call deactivate

echo.
echo ====== ALL VENVS READY ======
echo You can now run start_all.bat
pause
