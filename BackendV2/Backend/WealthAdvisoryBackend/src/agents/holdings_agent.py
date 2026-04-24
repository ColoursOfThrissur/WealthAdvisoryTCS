"""
Holdings Agent - Step 4: Holdings detail table
Uses PriceCache for QTD returns (same data already fetched by performance agent).
MCP used only for current quote and company profile.
"""
from typing import Dict
from datetime import date
from tools.mcp_tools import MCPTools
from functions.performance import PriceCache, get_quarter_dates


class HoldingsAgent:
    """Step 4: Holdings Detail"""

    async def execute(self, state_data: Dict) -> Dict:
        try:
            holdings = state_data.get("holdings", [])
            period = state_data.get("period", {})

            start_date = period.get("start_date", "2025-10-01")
            end_date = period.get("end_date", "2025-12-31")

            # Build PriceCache for QTD returns (single yfinance batch call)
            tickers = list(set(h["ticker"] for h in holdings))
            cache = PriceCache()
            cache.fetch(tickers, start_date, end_date)

            # Use MCP only for current quote + company profile (not historical prices)
            profiles = {}
            quotes = {}
            try:
                async with MCPTools() as mcp:
                    for t in tickers:
                        try:
                            quotes[t] = await mcp.get_current_quote(t)
                        except Exception:
                            quotes[t] = None
                        try:
                            profiles[t] = await mcp.get_company_profile(t)
                        except Exception:
                            profiles[t] = {}
            except Exception as e:
                print(f"[HOLDINGS] MCP unavailable, using cache prices: {e}")

            holdings_table = []
            total_value = 0

            for holding in holdings:
                ticker = holding["ticker"]
                shares = holding["shares"]

                # Price: prefer live MCP quote, fallback to cache end-of-period price
                quote = quotes.get(ticker)
                if quote and quote.get("price"):
                    price = quote["price"]
                else:
                    price = cache.get_price_at(ticker, end_date) or 0

                value = shares * price
                total_value += value

                # QTD return from cache (no extra network call)
                sp = cache.get_price_at(ticker, start_date)
                ep = cache.get_price_at(ticker, end_date)
                if sp and ep and sp > 0:
                    qtd_return = round((ep - sp) / sp * 100, 2)
                else:
                    qtd_return = 0

                profile = profiles.get(ticker, {})
                holdings_table.append({
                    "security": ticker,
                    "name": profile.get("name", ticker),
                    "asset_class": profile.get("sector", "Unknown"),
                    "shares": shares,
                    "price": price,
                    "value": value,
                    "qtd_return": qtd_return,
                })

            for h in holdings_table:
                h["percentage"] = (h["value"] / total_value * 100) if total_value > 0 else 0

            holdings_table.sort(key=lambda x: x["value"], reverse=True)

            return {
                "status": "complete",
                "section": "holdings_detail",
                "holdings_table": holdings_table,
                "total_value": total_value,
                "total_positions": len(holdings_table),
            }

        except Exception as e:
            import traceback
            return {
                "status": "error",
                "error": f"{str(e)}\n{traceback.format_exc()}",
            }
