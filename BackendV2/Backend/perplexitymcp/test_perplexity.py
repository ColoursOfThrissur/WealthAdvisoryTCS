"""
Test script for the Perplexity API.
Run: python test_perplexity.py
Or with pytest: pytest test_perplexity.py -v
"""
import os
from typing import List

import httpx
from dotenv import load_dotenv

load_dotenv()

PERPLEXITY_API_KEY = os.getenv("PERPLEXITY_API_KEY")
PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions"
PERPLEXITY_MODEL = "sonar-deep-research"  # or "sonar-pro"


def call_perplexity(query: str, model: str = PERPLEXITY_MODEL) -> str:
    """Call Perplexity API and return the answer text (sync, for testing)."""
    if not PERPLEXITY_API_KEY:
        raise RuntimeError(
            "PERPLEXITY_API_KEY is not set. Add it to .env or export it."
        )

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

    with httpx.Client(timeout=600) as client:
        response = client.post(
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
        return text or str(data)
    except (KeyError, TypeError):
        return str(data)


def test_perplexity_api_key_set():
    """Fail fast if API key is missing."""
    assert PERPLEXITY_API_KEY, "PERPLEXITY_API_KEY must be set in .env or environment"


def test_perplexity_search():
    """Call Perplexity with a simple query and check we get non-empty text."""
    result = call_perplexity("What is 2 + 2? Answer in one short sentence.")
    assert result, "Expected non-empty response from Perplexity"
    assert isinstance(result, str), "Expected string response"
    print("\n--- Perplexity response ---")
    print(result[:500] + ("..." if len(result) > 500 else ""))
    print("---\n")


if __name__ == "__main__":
    if not PERPLEXITY_API_KEY:
        print("Error: PERPLEXITY_API_KEY is not set.")
        print("Add it to .env or run: export PERPLEXITY_API_KEY='your-key'")
        exit(1)

    print("Calling Perplexity API...")
    try:
        answer = call_perplexity("equity markets in US for last night")
        print("Success!\n")
        print("Answer:", answer)
    except httpx.HTTPStatusError as e:
        print(f"API error: {e.response.status_code} - {e.response.text}")
        exit(1)
    except Exception as e:
        print(f"Error: {e}")
        exit(1)
