"""
Market Data Fetcher for Commentary
Uses yfinance batch fetching — 1 HTTP call per group instead of 16+ MCP subprocess connections.
"""
from typing import Dict, List
import yfinance as yf
from datetime import datetime, timedelta


SECTOR_ETFS = {
    'Technology': 'XLK',
    'Consumer Discretionary': 'XLY',
    'Utilities': 'XLU',
    'Real Estate': 'XLRE',
    'Financials': 'XLF',
    'Healthcare': 'XLV',
    'Energy': 'XLE',
    'Materials': 'XLB',
    'Industrials': 'XLI',
    'Consumer Staples': 'XLP',
    'Communication Services': 'XLC'
}

OTHER_INDICES = {
    'MSCI EAFE': 'EFA',
    'Aggregate Bond': 'AGG',
    'High Yield Bond': 'HYG',
    'NASDAQ 100': 'QQQ',
    'Russell 2000': 'IWM'
}


def _batch_returns(tickers_map: Dict[str, str], start_date: str, end_date: str) -> Dict[str, float]:
    """Fetch returns for multiple tickers in ONE yf.download call."""
    tickers = list(tickers_map.values())
    name_by_ticker = {v: k for k, v in tickers_map.items()}

    results = {}
    try:
        end_dt = (datetime.fromisoformat(end_date) + timedelta(days=5)).strftime("%Y-%m-%d")
        df = yf.download(tickers, start=start_date, end=end_dt, progress=False, auto_adjust=True, threads=True)

        if df.empty:
            return {name: 0.0 for name in tickers_map}

        if len(tickers) == 1:
            close = df['Close'].dropna()
            if len(close) >= 2:
                ret = ((close.iloc[-1] - close.iloc[0]) / close.iloc[0]) * 100
                results[name_by_ticker[tickers[0]]] = round(ret, 2)
        else:
            close = df['Close'] if 'Close' in df.columns else df.xs('Close', axis=1, level=0)
            for ticker in tickers:
                name = name_by_ticker[ticker]
                if ticker in close.columns:
                    series = close[ticker].dropna()
                    if len(series) >= 2:
                        ret = ((series.iloc[-1] - series.iloc[0]) / series.iloc[0]) * 100
                        results[name] = round(ret, 2)
                    else:
                        results[name] = 0.0
                else:
                    results[name] = 0.0
    except Exception as e:
        print(f"[MARKET] Batch fetch error: {e}")
        results = {name: 0.0 for name in tickers_map}

    for name in tickers_map:
        if name not in results:
            results[name] = 0.0

    return results


async def fetch_sector_performance(start_date: str, end_date: str) -> Dict[str, float]:
    """Fetch all 11 sector ETF returns in one batch call."""
    return _batch_returns(SECTOR_ETFS, start_date, end_date)


async def fetch_index_performance(start_date: str, end_date: str) -> Dict[str, float]:
    """Fetch major index returns in one batch call."""
    return _batch_returns(OTHER_INDICES, start_date, end_date)


async def fetch_holdings_period_returns(holdings: List[Dict], start_date: str, end_date: str) -> Dict[str, float]:
    """Fetch period returns for each holding in one batch call."""
    ticker_map = {h['ticker']: h['ticker'] for h in holdings if h.get('ticker')}
    return _batch_returns(ticker_map, start_date, end_date)


def identify_top_performers(sector_returns: Dict[str, float], top_n: int = 3) -> List[str]:
    """Identify top performing sectors"""
    sorted_sectors = sorted(sector_returns.items(), key=lambda x: x[1], reverse=True)
    return [f"{sector} ({ret:+.1f}%)" for sector, ret in sorted_sectors[:top_n]]


def identify_laggards(sector_returns: Dict[str, float], bottom_n: int = 2) -> List[str]:
    """Identify lagging sectors"""
    sorted_sectors = sorted(sector_returns.items(), key=lambda x: x[1])
    return [f"{sector} ({ret:+.1f}%)" for sector, ret in sorted_sectors[:bottom_n]]
