# Wealth Management - Test Endpoints

**Primary (HTTPS via sslip.io):** `https://A-B-C-D.sslip.io` where A-B-C-D is your EC2 public IP (e.g. https://13-218-33-51.sslip.io)

## 1. Frontend
| Endpoint | Method | Description |
|----------|--------|-------------|
| https://wealth.agenticorc.com | GET | SPA home page |

## 2. WealthAdvisory Backend (port 8001)
| Endpoint | Method | Description |
|----------|--------|-------------|
| https://wealth.agenticorc.com/api/health | GET | Health check |
| https://wealth.agenticorc.com/api/session/create | POST | Create report session |
| https://wealth.agenticorc.com/api/clients | GET | List clients |
| https://wealth.agenticorc.com/api/morning-notes | POST | Get morning notes (uses StockStory) |
| https://wealth.agenticorc.com/api/research/{session_id} | POST | Research query (uses StockStory → Perplexity) |
| wss://wealth.agenticorc.com/ws/chat/{session_id} | WebSocket | Chat interface |

**Test:**
```bash
curl https://wealth.agenticorc.com/api/health
```

## 3. StockStory (port 7000)
| Endpoint | Method | Description |
|----------|--------|-------------|
| https://wealth.agenticorc.com/stockstory/health | GET | Health check |
| https://wealth.agenticorc.com/stockstory/process_message | POST | Process message (skills, research) |

**Test:**
```bash
curl https://wealth.agenticorc.com/stockstory/health
curl -X POST https://wealth.agenticorc.com/stockstory/process_message \
  -H "Content-Type: application/json" \
  -d '{"message": "hello", "session_id": "test"}'
```

## 4. Perplexity MCP (port 8000)
MCP SSE server – used internally by StockStory for web search. No simple HTTP health endpoint.

**Indirect test:** Call StockStory with a research-style message; it uses Perplexity under the hood.

| Endpoint | Description |
|----------|-------------|
| https://wealth.agenticorc.com/perplexity/sse | MCP SSE endpoint (requires MCP client) |

## Quick health check (all 4)
```bash
echo "1. Frontend:" && curl -s -o /dev/null -w "%{http_code}" https://wealth.agenticorc.com && echo ""
echo "2. WealthAdvisory:" && curl -s https://wealth.agenticorc.com/api/health | head -c 100
echo ""
echo "3. StockStory:" && curl -s https://wealth.agenticorc.com/stockstory/health
echo ""
echo "4. Perplexity: (no HTTP health - tested via StockStory research)"
```
