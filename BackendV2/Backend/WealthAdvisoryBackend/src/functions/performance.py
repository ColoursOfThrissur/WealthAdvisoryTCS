"""
Performance Calculation Functions
Pure Python functions for return calculations.
PriceCache uses yfinance batch fetching — 1 HTTP call for all tickers.
"""
from typing import List, Dict, Tuple, Optional
from datetime import datetime, date, timedelta
import yfinance as yf
import pandas as pd


def get_quarter_dates(year: int, quarter: int) -> Tuple[date, date]:
    quarter_map = {
        1: (date(year, 1, 1), date(year, 3, 31)),
        2: (date(year, 4, 1), date(year, 6, 30)),
        3: (date(year, 7, 1), date(year, 9, 30)),
        4: (date(year, 10, 1), date(year, 12, 31))
    }
    return quarter_map[quarter]


def annualize_return(total_return_pct: float, years: float) -> float:
    if years <= 0:
        return 0.0
    if years <= 1:
        return total_return_pct
    return (((1 + total_return_pct/100) ** (1/years)) - 1) * 100


def calculate_portfolio_value(holdings: List[Dict], prices: Dict[str, float]) -> float:
    total = 0.0
    for holding in holdings:
        ticker = holding["ticker"]
        shares = holding["shares"]
        if ticker in prices:
            total += shares * prices[ticker]
    return total


def calculate_period_return(
    holdings: List[Dict],
    start_prices: Dict[str, float],
    end_prices: Dict[str, float]
) -> float:
    start_value = calculate_portfolio_value(holdings, start_prices)
    end_value = calculate_portfolio_value(holdings, end_prices)
    if start_value == 0:
        return 0.0
    return ((end_value - start_value) / start_value) * 100


def calculate_itd_return(
    holdings: List[Dict],
    current_prices: Dict[str, float]
) -> float:
    total_cost = sum(h.get("cost_basis", 0) for h in holdings)
    total_value = calculate_portfolio_value(holdings, current_prices)
    if total_cost == 0:
        return 0.0
    return ((total_value - total_cost) / total_cost) * 100


def infer_inception_date(holdings: List[Dict]) -> date:
    return date.today() - timedelta(days=3 * 365)


class PriceCache:
    """
    Batch-fetches all tickers in ONE yf.download() call.
    Then slices locally for any date range — zero extra network calls.
    """

    def __init__(self):
        self._data: Dict[str, pd.Series] = {}

    def fetch(self, tickers: List[str], start: str, end: str):
        """Fetch all tickers in a single batch call. start/end are YYYY-MM-DD strings."""
        to_fetch = list(set(t for t in tickers if t not in self._data))
        if not to_fetch:
            return

        print(f"[PRICE-CACHE] Fetching {len(to_fetch)} tickers from {start} to {end}")
        try:
            end_dt = (datetime.fromisoformat(end) + timedelta(days=5)).strftime("%Y-%m-%d")
            df = yf.download(
                to_fetch, start=start, end=end_dt,
                progress=False, auto_adjust=True, threads=True
            )

            if df.empty:
                print(f"[PRICE-CACHE] WARNING: No data returned")
                for t in to_fetch:
                    self._data[t] = pd.Series(dtype=float)
                return

            if len(to_fetch) == 1:
                ticker = to_fetch[0]
                if 'Close' in df.columns:
                    self._data[ticker] = df['Close'].dropna()
                    print(f"[PRICE-CACHE] {ticker}: {len(self._data[ticker])} days")
            else:
                close = (
                    df['Close'] if 'Close' in df.columns
                    else df.xs('Close', axis=1, level=0) if isinstance(df.columns, pd.MultiIndex)
                    else pd.DataFrame()
                )
                for ticker in to_fetch:
                    if ticker in close.columns:
                        self._data[ticker] = close[ticker].dropna()
                        print(f"[PRICE-CACHE] {ticker}: {len(self._data[ticker])} days")
                    else:
                        print(f"[PRICE-CACHE] WARNING: No data for {ticker}")
                        self._data[ticker] = pd.Series(dtype=float)

        except Exception as e:
            print(f"[PRICE-CACHE] Error: {e}")
            for t in to_fetch:
                self._data[t] = pd.Series(dtype=float)

    def get_price_at(self, ticker: str, target_date: str) -> Optional[float]:
        """Get close price on or nearest trading day before target_date."""
        series = self._data.get(ticker)
        if series is None or series.empty:
            return None
        try:
            target = pd.Timestamp(target_date)
            mask = series.index <= target
            if mask.any():
                return float(series[mask].iloc[-1])
            return float(series.iloc[0])
        except Exception:
            return None

    def get_daily_series(self, ticker: str, start_date: str, end_date: str) -> List[float]:
        """Get daily close values within range (for risk metrics)."""
        series = self._data.get(ticker)
        if series is None or series.empty:
            return []
        try:
            mask = (series.index >= pd.Timestamp(start_date)) & (series.index <= pd.Timestamp(end_date))
            return series[mask].tolist()
        except Exception:
            return []


def calculate_twr_with_cashflows(daily_values: List[float], cashflows: List[Tuple[int, float]]) -> float:
    if not daily_values or len(daily_values) < 2:
        return 0.0
    
    cashflows = sorted(cashflows, key=lambda x: x[0])
    sub_returns = []
    prev_idx = 0
    
    for cf_idx, cf_amount in cashflows:
        if cf_idx > prev_idx and cf_idx < len(daily_values):
            start_val = daily_values[prev_idx]
            end_val = daily_values[cf_idx] - cf_amount
            if start_val > 0:
                sub_returns.append((end_val - start_val) / start_val)
            prev_idx = cf_idx
    
    if prev_idx < len(daily_values) - 1:
        start_val = daily_values[prev_idx]
        end_val = daily_values[-1]
        if start_val > 0:
            sub_returns.append((end_val - start_val) / start_val)
    
    if not sub_returns:
        return ((daily_values[-1] - daily_values[0]) / daily_values[0]) * 100
    
    twr = 1.0
    for r in sub_returns:
        twr *= (1 + r)
    return (twr - 1) * 100


def calculate_mwr_irr(cashflows: List[Tuple[date, float]], final_value: float) -> float:
    try:
        from scipy.optimize import newton
        if not cashflows:
            return 0.0
        
        start_date = min(cf[0] for cf in cashflows)
        
        def npv(rate):
            total = 0
            for cf_date, cf_amount in cashflows:
                years = (cf_date - start_date).days / 365.25
                total += cf_amount / ((1 + rate) ** years)
            years = (cashflows[-1][0] - start_date).days / 365.25
            total += final_value / ((1 + rate) ** years)
            return total
        
        irr = newton(npv, 0.1, maxiter=100)
        return irr * 100
    except:
        return 0.0


async def calculate_multi_period_returns(
    holdings: List[Dict],
    period_end_date: date,
    mcp_tools=None,
    inception_date: date = None,
    benchmark_ticker: str = '^GSPC',
    price_cache: 'PriceCache' = None
) -> Dict[str, Dict[str, float]]:
    """
    Calculate returns for QTD, YTD, 1Y, 3Y, 5Y, ITD.
    When price_cache is provided, uses pure Python slicing (no network calls).
    Falls back to mcp_tools if price_cache is None (backward compat).
    """
    if inception_date is None:
        inception_date = infer_inception_date(holdings)

    tickers = list(set(h['ticker'] for h in holdings))

    year = period_end_date.year
    quarter = (period_end_date.month - 1) // 3 + 1

    periods = {
        'qtd': get_quarter_dates(year, quarter),
        'ytd': (date(year, 1, 1), period_end_date),
        'one_year': (period_end_date - timedelta(days=365), period_end_date),
        'three_year': (period_end_date - timedelta(days=3 * 365), period_end_date),
        'five_year': (period_end_date - timedelta(days=5 * 365), period_end_date),
        'itd': (inception_date, period_end_date)
    }

    results = {}

    for period_name, (start_date, end_date) in periods.items():
        try:
            s = start_date.isoformat()
            e = end_date.isoformat()

            if price_cache is not None:
                # Fast path: pure Python slicing from cache
                start_prices = {t: price_cache.get_price_at(t, s) for t in tickers}
                end_prices   = {t: price_cache.get_price_at(t, e) for t in tickers}
                start_prices = {k: v for k, v in start_prices.items() if v is not None}
                end_prices   = {k: v for k, v in end_prices.items() if v is not None}

                sv = calculate_portfolio_value(holdings, start_prices)
                ev = calculate_portfolio_value(holdings, end_prices)
                total_return = ((ev - sv) / sv * 100) if sv > 0 else 0.0
                years = (end_date - start_date).days / 365.25
                port_ret = annualize_return(total_return, years) if years > 1 else total_return

                bs = price_cache.get_price_at(benchmark_ticker, s)
                be = price_cache.get_price_at(benchmark_ticker, e)
                if bs and be and bs > 0:
                    bt = ((be - bs) / bs * 100)
                    bench_ret = annualize_return(bt, years) if years > 1 else bt
                else:
                    bench_ret = 0.0

            else:
                # Fallback: use mcp_tools (legacy path)
                start_prices = {}
                end_prices   = {}
                for ticker in tickers:
                    hist_data = await mcp_tools.get_historical_prices(ticker, s, e)
                    if hist_data.get('data') and len(hist_data['data']) > 0:
                        start_prices[ticker] = hist_data['data'][0]['close']
                        end_prices[ticker]   = hist_data['data'][-1]['close']

                sv = calculate_portfolio_value(holdings, start_prices)
                ev = calculate_portfolio_value(holdings, end_prices)
                total_return = ((ev - sv) / sv * 100) if sv > 0 else 0.0
                years = (end_date - start_date).days / 365.25
                port_ret = annualize_return(total_return, years) if years > 1 else total_return

                bm_hist = await mcp_tools.get_historical_prices(benchmark_ticker, s, e)
                if bm_hist.get('data') and len(bm_hist['data']) > 0:
                    bt = ((bm_hist['data'][-1]['close'] - bm_hist['data'][0]['close'])
                          / bm_hist['data'][0]['close'] * 100)
                    bench_ret = annualize_return(bt, years) if years > 1 else bt
                else:
                    bench_ret = 0.0

            results[period_name] = {
                'portfolio': round(port_ret, 2),
                'benchmark': round(bench_ret, 2)
            }
        except Exception as e:
            print(f"[PERF] Error calculating {period_name}: {e}")
            results[period_name] = {'portfolio': None, 'benchmark': None}

    return results
