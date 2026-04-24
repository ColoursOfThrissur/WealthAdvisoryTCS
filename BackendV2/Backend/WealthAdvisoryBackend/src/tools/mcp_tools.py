"""
MCP Tools for LangChain Agent — yfinance direct implementation.

Replaces the uvx/yfmcp MCP subprocess with direct yfinance calls so this
works reliably on Windows without any external tool installation.
"""
import json
import time
from pathlib import Path
from typing import Dict, List
from datetime import datetime, date

import yfinance as yf

from observability.connector import BaseConnector


class MCPTools:
    """yfinance-backed data wrappers matching the original MCP interface."""

    def __init__(self):
        self._connected = False
        self._price_cache: dict = {}  # (ticker, start, end) -> result

    async def __aenter__(self):
        await self.connect()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.close()

    async def connect(self):
        self._connected = True
        self._price_cache.clear()

    async def close(self):
        self._connected = False
        self._price_cache.clear()

    async def _score_tool_call(self, tool_name: str, latency_ms: float, success: bool):
        try:
            await BaseConnector.score_run(
                score_name=f"tool_{tool_name}_latency_ms",
                value=min(1.0, max(0.0, 1.0 - latency_ms / 10000)),
                comment=f"{'ok' if success else 'error'} in {latency_ms:.0f}ms",
            )
        except Exception:
            pass

    async def get_historical_prices(
        self,
        ticker: str,
        start_date: str,
        end_date: str,
    ) -> Dict:
        """
        Fetch historical daily close prices for a ticker.

        Returns:
            {"ticker": "AAPL", "data": [{"date": "2025-10-01", "close": 150.00}, ...]}
        """
        cache_key = (ticker, start_date, end_date)
        if cache_key in self._price_cache:
            return self._price_cache[cache_key]

        t0 = time.perf_counter()
        success = False
        try:
            start = datetime.fromisoformat(start_date).date()
            end = datetime.fromisoformat(end_date).date()

            from datetime import timedelta
            end_inclusive = end + timedelta(days=5)  # buffer for weekends/holidays

            ticker_obj = yf.Ticker(ticker)
            hist = ticker_obj.history(start=start.isoformat(), end=end_inclusive.isoformat())

            data = []
            for idx, row in hist.iterrows():
                row_date = idx.date() if hasattr(idx, "date") else idx
                if row_date <= end:
                    data.append({
                        "date": row_date.isoformat(),
                        "close": round(float(row["Close"]), 4),
                    })

            success = len(data) > 0
            print(f"[YFINANCE] {ticker} {start_date}→{end_date}: {len(data)} rows")
            result = {"ticker": ticker, "data": data}
            self._price_cache[cache_key] = result
            return result
        except Exception as e:
            print(f"[YFINANCE] Error fetching {ticker} prices: {e}")
            return {"ticker": ticker, "data": []}
        finally:
            await self._score_tool_call("get_price_history", (time.perf_counter() - t0) * 1000, success)

    async def get_current_quote(self, ticker: str) -> Dict:
        """
        Get current price and daily change.

        Returns:
            {"ticker": "AAPL", "price": 262.52, "change": 2.34, "change_percent": 0.90}
        """
        t0 = time.perf_counter()
        success = False
        try:
            info = yf.Ticker(ticker).fast_info
            current_price = float(getattr(info, "last_price", 0) or 0)
            prev_close = float(getattr(info, "previous_close", current_price) or current_price)
            change = current_price - prev_close
            change_pct = (change / prev_close * 100) if prev_close else 0.0
            success = current_price > 0
            return {
                "ticker": ticker,
                "price": round(current_price, 4),
                "change": round(change, 4),
                "change_percent": round(change_pct, 4),
            }
        except Exception as e:
            print(f"[YFINANCE] Error fetching quote for {ticker}: {e}")
            return {"ticker": ticker, "price": 0.0, "change": 0.0, "change_percent": 0.0}
        finally:
            await self._score_tool_call("get_current_quote", (time.perf_counter() - t0) * 1000, success)

    async def get_company_profile(self, ticker: str) -> Dict:
        """
        Get company sector, industry, market cap.

        Returns:
            {"ticker": "AAPL", "name": "Apple Inc.", "sector": "Technology", ...}
        """
        t0 = time.perf_counter()
        success = False
        try:
            info = yf.Ticker(ticker).info
            success = bool(info)
            return {
                "ticker": ticker,
                "name": info.get("longName") or info.get("shortName", ticker),
                "sector": info.get("sector", "Unknown"),
                "industry": info.get("industry", "Unknown"),
                "market_cap": info.get("marketCap", 0),
            }
        except Exception as e:
            print(f"[YFINANCE] Error fetching profile for {ticker}: {e}")
            return {"ticker": ticker, "name": ticker, "sector": "Unknown", "industry": "Unknown", "market_cap": 0}
        finally:
            await self._score_tool_call("get_company_profile", (time.perf_counter() - t0) * 1000, success)

    async def get_company_news(self, ticker: str, limit: int = 5) -> List[Dict]:
        """
        Get recent news headlines for a company.

        Returns:
            [{"title": "...", "publisher": "...", "link": "...", "published": "YYYY-MM-DD"}, ...]
        """
        t0 = time.perf_counter()
        success = False
        try:
            raw_news = yf.Ticker(ticker).news or []
            news = []
            for item in raw_news[:limit]:
                content = item.get("content", item)
                provider = content.get("provider", {}) if isinstance(content, dict) else {}
                pub_date = content.get("pubDate", "") if isinstance(content, dict) else item.get("providerPublishTime", "")
                if isinstance(pub_date, (int, float)):
                    pub_date = datetime.fromtimestamp(pub_date).strftime("%Y-%m-%d")
                elif isinstance(pub_date, str) and len(pub_date) >= 10:
                    pub_date = pub_date[:10]
                news.append({
                    "title": content.get("title", item.get("title", "No title")) if isinstance(content, dict) else item.get("title", "No title"),
                    "publisher": provider.get("displayName", item.get("publisher", "Unknown")),
                    "link": (content.get("canonicalUrl", {}).get("url", "") if isinstance(content, dict) else item.get("link", "")),
                    "published": pub_date,
                })
            success = len(news) > 0
            return news
        except Exception as e:
            print(f"[YFINANCE] Error fetching news for {ticker}: {e}")
            return []
        finally:
            await self._score_tool_call("get_company_news", (time.perf_counter() - t0) * 1000, success)

    async def get_dividends(self, ticker: str, start_date: str, end_date: str) -> List[Dict]:
        """
        Get dividend payments for a ticker within a date range.

        Returns:
            [{"date": "2025-11-15", "amount": 0.25}, ...]
        """
        t0 = time.perf_counter()
        success = False
        try:
            divs = yf.Ticker(ticker).dividends
            start = datetime.fromisoformat(start_date).date()
            end = datetime.fromisoformat(end_date).date()

            result = []
            for idx, amount in divs.items():
                div_date = idx.date() if hasattr(idx, "date") else idx
                if start <= div_date <= end:
                    result.append({"date": div_date.isoformat(), "amount": round(float(amount), 4)})

            success = True
            return result
        except Exception as e:
            print(f"[YFINANCE] Error fetching dividends for {ticker}: {e}")
            return []
        finally:
            await self._score_tool_call("get_dividends", (time.perf_counter() - t0) * 1000, success)
