"""
tools/sector_analyzer.py
Fetches live sector concentration data for held funds using yfinance.
Replaces hardcoded IT weights in api_formatter.py.
"""
import yfinance as yf
import pandas as pd
from typing import Dict, List


# yfinance sector key -> display name mapping
SECTOR_DISPLAY = {
    "technology":            "Technology",
    "consumer_cyclical":     "Consumer Cyclical",
    "communication_services": "Communication Services",
    "financial_services":    "Financial Services",
    "healthcare":            "Healthcare",
    "industrials":           "Industrials",
    "consumer_defensive":    "Consumer Defensive",
    "energy":                "Energy",
    "basic_materials":       "Basic Materials",
    "real_estate":           "Real Estate",
    "utilities":             "Utilities",
}


def get_fund_sector_weightings(fund_ids: List[str]) -> Dict[str, Dict[str, float]]:
    """
    Fetch sector weightings for each fund via yfinance.
    Returns {fund_id: {sector_name: weight_pct}}
    e.g. {"FSPGX": {"Technology": 49.0, "Consumer Cyclical": 13.1}}
    """
    result = {}
    for fund in fund_ids:
        try:
            sw = yf.Ticker(fund).funds_data.sector_weightings
            if isinstance(sw, dict) and sw:
                result[fund] = {
                    SECTOR_DISPLAY.get(k, k.replace("_", " ").title()): round(float(v) * 100, 1)
                    for k, v in sw.items()
                    if v and float(v) > 0
                }
        except Exception:
            result[fund] = {}
    return result


def build_sector_concentration_table(
    holdings: list,
    sector_weightings: Dict[str, Dict[str, float]],
    target_sector: str = "Technology",
) -> tuple:
    """
    Build sector concentration table for a specific sector (default: Technology/IT).
    Returns (table_rows, total_concentration_pct)

    table_rows format matches API_STRUCTURE_CLIENT_DETAIL:
    [{"fund": "FSPGX", "it_percentage": "49.0%", "equity_weight": "27.5%", "it_contribution": "12.79%"}]
    """
    equity_funds = [h for h in holdings if h["asset_class"] in ("Equity", "Income")]
    total_value  = sum(h["current_value"] for h in holdings)
    equity_total = sum(h["current_value"] for h in equity_funds)

    table = []
    total_contribution = 0.0

    for h in equity_funds:
        fid      = h["fund_id"]
        sectors  = sector_weightings.get(fid, {})
        sec_pct  = sectors.get(target_sector, 0.0)
        if sec_pct == 0:
            continue

        eq_weight    = round(h["current_value"] / equity_total * 100, 1) if equity_total else 0
        contribution = round(sec_pct * eq_weight / 100, 2)
        total_contribution += contribution

        table.append({
            "fund":           fid,
            "it_percentage":  f"{sec_pct}%",
            "equity_weight":  f"{eq_weight}%",
            "it_contribution": f"{contribution}%",
        })

    # Sort by contribution descending
    table.sort(key=lambda x: float(x["it_contribution"].rstrip("%")), reverse=True)
    return table, round(total_contribution, 2)


def get_portfolio_sector_breakdown(
    holdings: list,
    sector_weightings: Dict[str, Dict[str, float]],
) -> Dict[str, float]:
    """
    Compute weighted sector exposure across the entire portfolio.
    Returns {sector_name: portfolio_weight_pct}
    """
    total_value = sum(h["current_value"] for h in holdings)
    sector_totals: Dict[str, float] = {}

    for h in holdings:
        fid     = h["fund_id"]
        weight  = h["current_value"] / total_value if total_value else 0
        sectors = sector_weightings.get(fid, {})
        for sector, pct in sectors.items():
            sector_totals[sector] = sector_totals.get(sector, 0.0) + (pct * weight)

    return {k: round(v, 2) for k, v in
            sorted(sector_totals.items(), key=lambda x: x[1], reverse=True)}


def get_sector_industry_breakdown(sector_key: str) -> pd.DataFrame:
    """
    Get industry breakdown within a sector using yfinance.Sector.
    e.g. sector_key = 'technology' returns semiconductors, software, etc.
    """
    try:
        sec = yf.Sector(sector_key)
        return sec.industries[["name", "market weight"]].head(10)
    except Exception:
        return pd.DataFrame()


if __name__ == "__main__":
    import sys, io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

    funds = ["FSPGX", "AGTHX", "AIVSX", "AEPGX", "ANWPX", "AMECX"]
    print("Fetching live sector weightings...")
    sw = get_fund_sector_weightings(funds)

    print("\n=== Top 3 sectors per fund ===")
    for fund, sectors in sw.items():
        top3 = sorted(sectors.items(), key=lambda x: x[1], reverse=True)[:3]
        print(f"  {fund}: {top3}")

    # Mock holdings for testing
    mock_holdings = [
        {"fund_id": "FSPGX", "asset_class": "Equity", "current_value": 75020},
        {"fund_id": "AGTHX", "asset_class": "Equity", "current_value": 50025},
        {"fund_id": "AIVSX", "asset_class": "Equity", "current_value": 49996},
        {"fund_id": "AEPGX", "asset_class": "Equity", "current_value": 75020},
        {"fund_id": "ANWPX", "asset_class": "Equity", "current_value": 24990},
        {"fund_id": "AMECX", "asset_class": "Income", "current_value": 49998},
    ]

    print("\n=== Technology sector concentration ===")
    table, total = build_sector_concentration_table(mock_holdings, sw, "Technology")
    for row in table:
        print(f"  {row}")
    print(f"  Total IT concentration: {total}%")

    print("\n=== Portfolio sector breakdown ===")
    breakdown = get_portfolio_sector_breakdown(mock_holdings, sw)
    for sector, pct in list(breakdown.items())[:5]:
        print(f"  {sector}: {pct:.1f}%")

    print("\n=== Technology industry breakdown ===")
    industries = get_sector_industry_breakdown("technology")
    print(industries.to_string())
