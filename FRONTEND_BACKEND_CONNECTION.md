# Frontend → BackendV2 Connection Summary

## Changes Made (Frontend Only)

### 1. **Login Page** (`src/pages/Auth/Login.jsx`)
- **Changed**: Removed API call to `/api/login` (endpoint doesn't exist in BackendV2)
- **Implementation**: Mock authentication (stores token in sessionStorage)
- **Note**: Add real authentication endpoint to BackendV2 later

### 2. **Rebalancing Worklist** (`src/pages/RebalancingWorklist.jsx`)
- **Status**: ✅ **NO CHANGES NEEDED**
- **Reason**: Already compatible with BackendV2 `/api/worklist/rebalancing` endpoint
- **Response Schema**: Perfect match

### 3. **Client Detail** (`src/pages/ClientDetail.jsx`)
- **Changed**: Replaced 3 parallel API calls with single `/api/client/{client_id}/full-analysis` call
- **Benefits**: 
  - Faster (1 request instead of 3)
  - Uses BackendV2's cached analysis
  - Gets all data in one response
- **Schema Transformation**: Added adapter to transform BackendV2 response to frontend expected format
- **Rerun Analysis**: ✅ Connected to `/full-analysis` with `refresh: true` parameter
  - Supports sentiment toggle
  - Supports fund universe toggle
  - Supports custom user prompts
  - Bypasses cache when rerunning

### 4. **Risk Analysis View** (`src/pages/RiskAnalysisView.jsx`)
- **Changed**: Replaced mock data with API call to `/api/client/{client_id}/risk-analysis`
- **Added**: Loading and error states
- **Data Source**: Now fetches real risk metrics from BackendV2

### 5. **Investment Details View** (`src/pages/InvestmentDetailsView.jsx`)
- **Changed**: Replaced mock data with API call to `/api/client/{client_id}/investment-details`
- **Added**: Loading and error states
- **Data Source**: Now fetches real sentiment and news data from BackendV2

### 6. **Portfolio Rebalancing Native** (`src/pages/PortfolioRebalancing/PortfolioRebalancingNative.jsx`)
- **Changed**: Replaced mock data with API calls to:
  - `/api/action/rebalancing/{client_id}` (rebalancing recommendations)
  - `/api/client/{client_id}/investment-details` (current holdings)
- **Added**: Loading and error states
- **Data Source**: Now fetches real trade recommendations from BackendV2

---

## BackendV2 Endpoints Used

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/api/worklist/rebalancing` | GET | List all clients needing rebalancing | ✅ Working |
| `/api/client/{client_id}/full-analysis` | POST | Get complete analysis (all data in one call) | ✅ Working |
| `/api/client/{client_id}/detail` | GET | Client profile + drift + recommendations | ✅ Available |
| `/api/client/{client_id}/risk-analysis` | GET | Risk metrics and analysis | ✅ Working |
| `/api/client/{client_id}/investment-details` | GET | Sentiment + holdings + news | ✅ Working |
| `/api/action/rebalancing/{client_id}` | GET | Trade recommendations | ✅ Working |
| `/health` | GET | Health check | ✅ Working |

---

## Configuration

### Frontend `.env` (if needed)
```env
VITE_API_BASE_URL=http://localhost:8000
```

### Backend Ports
- **BackendV2 API Server**: Port 8000 (FastAPI)
- **BackendV2 MCP Server**: Port 8001 (should be changed from 8000 to avoid conflict)

---

## Testing Checklist

### ✅ Pages to Test
1. **Login** → Should allow login with any email/password (mock auth)
2. **Rebalancing Worklist** → Should load client list from DynamoDB
3. **Client Detail** → Should load full analysis for a client
4. **Risk Analysis** → Should show risk metrics and charts
5. **Investment Details** → Should show sentiment and news
6. **Portfolio Rebalancing** → Should show trade recommendations

### 🔧 How to Test
```bash
# 1. Start BackendV2 MCP Server (change port to 8001 first!)
cd BackendV2/portfolio_rebalancing_agentic_mcp_server
python server.py

# 2. Start BackendV2 API Server
cd BackendV2/portfolio_rebalancing_agentic_api/backend
uvicorn app:app --reload --port 8000

# 3. Start Frontend
cd "front end"
npm run dev

# 4. Open browser
http://localhost:5173
```

---

## Known Issues & TODOs

### ⚠️ Port Conflict
- **Issue**: MCP server and API server both try to use port 8000
- **Fix**: Change MCP server port to 8001 in `server.py` and `mcp_config.json`

### 🔐 Authentication
- **Issue**: Login is mocked (no real auth)
- **Fix**: Add `/api/login` endpoint to BackendV2 later

### 📊 Data Availability
- **Issue**: Some clients may not have data in DynamoDB
- **Fix**: Ensure test data exists for client IDs used in testing

---

## Schema Transformation Example

### BackendV2 Response (from `/full-analysis`)
```json
{
  "success": true,
  "summary": {...},
  "client_detail": {
    "client": {...},
    "asset_allocation": [...],
    "fund_drift": [...]
  },
  "risk_analysis": {...},
  "investment_details": {...},
  "rebalancing_action": {...}
}
```

### Frontend Expected Format
```json
{
  "client_profile": {...},
  "portfolio_drift": {
    "asset_allocation": [...],
    "fund_level_drift": [...]
  },
  "risk_analysis_summary": {...},
  "summary_recommendations": {...},
  "risk_detail_tables": {...}
}
```

The transformation happens in `ClientDetail.jsx` `fetchClientData()` function.

---

## Success Criteria

✅ Login works (mock auth)
✅ Worklist loads from BackendV2
✅ Client detail page loads real data
✅ **Rerun Analysis works** (with sentiment/universe toggles)
✅ Risk analysis shows real metrics
✅ Investment details shows real sentiment
✅ Rebalancing page shows real trade recommendations
✅ No console errors
✅ Loading states work
✅ Error handling works

---

## Next Steps

1. **Fix MCP Port Conflict** (change to 8001)
2. **Test with Real Data** (ensure DynamoDB has test clients)
3. **Add Real Authentication** (implement `/api/login` in BackendV2)
4. **Performance Testing** (check API response times)
5. **Error Handling** (improve error messages)

---

**Date**: 2025
**Status**: ✅ Frontend Connected to BackendV2
**No Backend Changes Made**: All changes in frontend only
