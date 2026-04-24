import os
import time
import uuid
from datetime import datetime
from typing import List

from dotenv import load_dotenv
import httpx
from mcp.server.fastmcp import FastMCP


load_dotenv()

PERPLEXITY_API_KEY = os.getenv("PERPLEXITY_API_KEY")
PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions"
PERPLEXITY_MODEL = "sonar-pro"
CONTROL_PLANE_URL = os.getenv("CONTROL_PLANE_URL", "http://localhost:8500").rstrip("/")

mcp = FastMCP(
    "Perplexity MCP",
    json_response=True,
    host="0.0.0.0",
    port=8000,
)


async def _report_run(query: str, output: str | None, status: str, latency_ms: float, error: str | None = None):
    """Report tool execution to the control plane."""
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            await client.post(
                f"{CONTROL_PLANE_URL}/agents/register",
                json={
                    "name": "perplexity_mcp",
                    "description": "Perplexity web search MCP server",
                    "framework": "generic",
                    "version": "1.0.0",
                    "evaluators": ["rule_based"],
                },
            )
            await client.post(
                f"{CONTROL_PLANE_URL}/runs",
                json={
                    "agent_name": "perplexity_mcp",
                    "trace_id": str(uuid.uuid4()),
                    "input": query,
                    "output": (output or "")[:2000],
                    "status": status,
                    "latency_ms": latency_ms,
                    "error": error,
                    "metadata": {"model": PERPLEXITY_MODEL},
                    "started_at": datetime.utcnow().isoformat(),
                },
            )
    except Exception:
        pass


@mcp.tool()
async def perplexity_search(
    query: str,
    model: str = PERPLEXITY_MODEL,
) -> str:
    """
    Run a web search or Q&A using Perplexity's API and return the answer as text.
    """
    if not PERPLEXITY_API_KEY:
        raise RuntimeError("PERPLEXITY_API_KEY is not set in the environment or .env file.")

    start = time.perf_counter()
    status = "completed"
    error_msg = None
    result_text = None

    payload = {
        "model": model,
        "messages": [
            {
                "role": "system",
                "content": "You are a helpful assistant. Use web search as needed.",
            },
            {
                "role": "user",
                "content": query,
            },
        ],
    }

    try:
        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(
                PERPLEXITY_API_URL,
                json=payload,
                headers={
                    "Authorization": f"Bearer {PERPLEXITY_API_KEY}",
                    "Content-Type": "application/json",
                },
            )
            response.raise_for_status()
            data = response.json()

        try:
            content_blocks: List[dict] = data["choices"][0]["message"]["content"]
            parts = [
                block.get("text", "")
                for block in content_blocks
                if isinstance(block, dict) and block.get("type") == "text"
            ]
            text = "\n\n".join(p.strip() for p in parts if p.strip())
            result_text = text or str(data)
        except Exception:
            result_text = str(data)

        print(f"[AUDIT] query={query!r}")
        print(f"[AUDIT] result:\n{result_text}")
        print("-" * 60)

        return result_text
    except Exception as exc:
        status = "failed"
        error_msg = str(exc)
        raise
    finally:
        latency_ms = (time.perf_counter() - start) * 1000
        await _report_run(query, result_text, status, latency_ms, error_msg)


if __name__ == "__main__":
    mcp.run(transport="sse")

