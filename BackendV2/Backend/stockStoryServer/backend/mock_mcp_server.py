import sys
import json

def handle_request(line):
    try:
        req = json.loads(line)
        # Handle initialize
        if req.get("method") == "initialize":
            return {
                "jsonrpc": "2.0",
                "id": req.get("id"),
                "result": {
                    "protocolVersion": "2024-11-05",
                    "capabilities": {"tools": {}},
                    "serverInfo": {"name": "mock_server", "version": "1.0.0"}
                }
            }
        
        # Handle tools/list
        elif req.get("method") == "tools/list":
            return {
                "jsonrpc": "2.0",
                "id": req.get("id"),
                "result": {
                    "tools": [
                        {
                            "name": "get_mock_financial_data",
                            "description": "Returns mock financial metrics for a requested ticker symbol.",
                            "inputSchema": {
                                "type": "object",
                                "properties": {
                                    "ticker": {"type": "string", "description": "The stock ticker symbol."}
                                },
                                "required": ["ticker"]
                            }
                        }
                    ]
                }
            }

        # Handle tools/call
        elif req.get("method") == "tools/call":
            params = req.get("params", {})
            name = params.get("name")
            args = params.get("arguments", {})

            if name == "get_mock_financial_data":
                ticker = args.get("ticker", "UNKNOWN")
                return {
                    "jsonrpc": "2.0",
                    "id": req.get("id"),
                    "result": {
                        "content": [
                            {
                                "type": "text",
                                "text": json.dumps({"ticker": ticker, "revenue": "$100B", "mock_pe_ratio": 25.4, "status": "Mock Data Generated Successfully"})
                            }
                        ]
                    }
                }
                
        # Unknown method logic or notifications
        if "id" in req:
            return {"jsonrpc": "2.0", "id": req.get("id"), "error": {"code": -32601, "message": "Method not found"}}
        return None

    except Exception as e:
        return {"jsonrpc": "2.0", "error": {"code": -32700, "message": str(e)}}

if __name__ == "__main__":
    for line in sys.stdin:
        if not line.strip():
            continue
        response = handle_request(line)
        if response:
            sys.stdout.write(json.dumps(response) + "\n")
            sys.stdout.flush()
