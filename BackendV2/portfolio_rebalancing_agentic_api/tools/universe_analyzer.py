"""
tools/universe_analyzer.py
Fetches and calculates risk metrics for funds in the investment universe.
Used for fund substitution analysis (Option B rebalancing).
"""
import yfinance as yf
import pandas as pd
import numpy as np
import os
from datetime import datetime, timedelta
from typing import Dict, List, Any


def fetch_universe_risk_metrics(universe_tickers: List[str], target_date: str = None) -> Dict[str, Any]:
    """
    Fetch risk metrics for investment universe funds.
    Args:
        universe_tickers: List of ticker symbols from investment universe
        target_date: Optional target date (format: 'YYYY-MM-DD')
    Returns:
        Dictionary with risk metrics for each fund
    """
    target_dt = datetime.strptime(target_date, '%Y-%m-%d') if target_date else datetime.now()
    start = (target_dt - timedelta(days=400)).strftime('%Y-%m-%d')
    end   = (target_dt + timedelta(days=3)).strftime('%Y-%m-%d')

    # SPY for beta calculation
    spy_ret = None
    try:
        spy_data = yf.download("SPY", start=start, end=end, progress=False, auto_adjust=True)
        if not spy_data.empty:
            spy_hist = spy_data["Close"]
            if isinstance(spy_hist, pd.DataFrame):
                spy_hist = spy_hist.iloc[:, 0]
            spy_hist = spy_hist[spy_hist.index.date <= target_dt.date()]
            if len(spy_hist) > 20:
                spy_ret = spy_hist.pct_change().dropna()
    except Exception:
        pass

    universe_metrics = {}
    ann = np.sqrt(252)
    rf_daily = float(os.getenv("RISK_FREE_RATE", "0.04")) / 252

    # Batch download all tickers at once (much faster than one by one)
    try:
        raw_all = yf.download(
            universe_tickers, start=start, end=end,
            auto_adjust=True, progress=False, group_by="ticker"
        )
    except Exception:
        raw_all = None

    for ticker in universe_tickers:
        try:
            # Extract this ticker from batch download
            if raw_all is not None and len(universe_tickers) > 1:
                if ticker in raw_all.columns.get_level_values(0):
                    hist = raw_all[ticker]["Close"].dropna()
                else:
                    continue
            else:
                raw = yf.download(ticker, start=start, end=end,
                                  progress=False, auto_adjust=True)
                if raw.empty:
                    continue
                hist = raw["Close"]
                if isinstance(hist, pd.DataFrame):
                    hist = hist.iloc[:, 0]
                hist = hist.dropna()

            hist = hist[hist.index.date <= target_dt.date()]
            if len(hist) < 20:
                continue

            price  = float(hist.iloc[-1])
            ret_f  = hist.pct_change().dropna()

            std_dev = round(float(ret_f.std()) * ann * 100, 2) if len(ret_f) > 0 else None

            # Beta vs SPY
            beta = None
            if spy_ret is not None and len(ret_f) > 20:
                aligned = pd.concat([ret_f, spy_ret], axis=1).dropna()
                if len(aligned) > 20:
                    aligned.columns = ["f", "s"]
                    cov = np.cov(aligned["f"], aligned["s"])
                    beta = round(float(cov[0, 1] / cov[1, 1]), 2) if cov[1, 1] != 0 else None

            max_dd  = round(float((hist / hist.cummax() - 1).min()) * 100, 2)
            var_95  = round(float(np.percentile(ret_f.values, 5)) * 100, 2) if len(ret_f) > 0 else None

            excess  = ret_f - rf_daily
            sharpe  = round(float(excess.mean() / excess.std() * ann), 2) if excess.std() > 0 else None

            neg_ret = ret_f[ret_f < 0]
            sortino = round(float(ret_f.mean() / neg_ret.std() * ann), 2) if len(neg_ret) > 1 else None

            one_year_return = round(((hist.iloc[-1] - hist.iloc[0]) / hist.iloc[0]) * 100, 2)

            # Expense ratio from yfinance
            expense_ratio = None
            try:
                info = yf.Ticker(ticker).info
                er = info.get('expenseRatio')
                if er:
                    expense_ratio = round(float(er) * 100, 3)
            except Exception:
                pass

            # Sector weightings
            sector_weightings = {}
            try:
                raw_sw = getattr(yf.Ticker(ticker).funds_data, "sector_weightings", None)
                if isinstance(raw_sw, dict) and raw_sw:
                    sector_weightings = {k: round(float(v) * 100, 1) for k, v in raw_sw.items()}
                elif isinstance(raw_sw, pd.DataFrame) and not raw_sw.empty:
                    sector_weightings = {
                        r["Sector"]: round(float(r["Weighting"]) * 100, 1)
                        for _, r in raw_sw.iterrows() if "Sector" in raw_sw.columns
                    }
            except Exception:
                pass

            universe_metrics[ticker] = {
                'price':            price,
                'std_dev':          std_dev,
                'beta':             beta,
                'max_drawdown':     max_dd,
                'var_95':           var_95,
                'sharpe':           sharpe,
                'sortino':          sortino,
                'one_year_return':  one_year_return,
                'expense_ratio':    expense_ratio,
                'sector_weightings': sector_weightings,
                'data_quality':     'good' if len(ret_f) > 200 else 'limited',
            }
        except Exception:
            continue

    return universe_metrics


def format_universe_metrics_for_prompt(universe_metrics: Dict[str, Any]) -> str:
    """Format universe risk metrics into a readable string for LLM prompt."""
    if not universe_metrics:
        return "No risk metrics available for investment universe funds."

    lines = ["INVESTMENT UNIVERSE RISK METRICS:", "=" * 70]
    for ticker, m in universe_metrics.items():
        lines.append(f"\n{ticker}:")
        lines.append(f"  Price:          ${m['price']:.2f}")
        if m['expense_ratio']:
            lines.append(f"  Expense Ratio:  {m['expense_ratio']:.3f}%")
        if m['std_dev']:
            lines.append(f"  Volatility:     {m['std_dev']:.2f}%")
        if m['beta']:
            lines.append(f"  Beta:           {m['beta']:.2f}")
        if m['sharpe']:
            lines.append(f"  Sharpe:         {m['sharpe']:.2f}")
        if m['sortino']:
            lines.append(f"  Sortino:        {m['sortino']:.2f}")
        if m['max_drawdown']:
            lines.append(f"  Max Drawdown:   {m['max_drawdown']:.2f}%")
        if m['var_95']:
            lines.append(f"  VaR 95%:        {m['var_95']:.2f}%")
        if m['one_year_return']:
            lines.append(f"  1Y Return:      {m['one_year_return']:.2f}%")
        if m['sector_weightings']:
            top3 = sorted(m['sector_weightings'].items(), key=lambda x: x[1], reverse=True)[:3]
            lines.append(f"  Top Sectors:    " + ", ".join(f"{s}:{w:.0f}%" for s, w in top3))
        lines.append(f"  Data Quality:   {m['data_quality']}")

    lines += [
        "\n" + "=" * 70,
        "\nFUND SELECTION CRITERIA:",
        "- Lower volatility (std dev) than current holdings",
        "- Lower beta for defensive positioning",
        "- Higher Sharpe/Sortino (better risk-adjusted returns)",
        "- Lower expense ratio",
        "- Different sector exposures to reduce concentration",
    ]
    return "\n".join(lines)


def compare_fund_to_portfolio(fund_metrics: Dict[str, Any], portfolio_metrics: Dict[str, Any]) -> Dict[str, str]:
    """Compare a candidate fund's risk metrics to current portfolio averages."""
    comparison = {}

    if fund_metrics.get('std_dev') and portfolio_metrics.get('volatility_1y_pct'):
        fv, pv = fund_metrics['std_dev'], portfolio_metrics['volatility_1y_pct']
        comparison['volatility'] = ('LOWER (better for stability)' if fv < pv * 0.9
                                    else 'HIGHER (more volatile)' if fv > pv * 1.1
                                    else 'SIMILAR')

    if fund_metrics.get('beta') and portfolio_metrics.get('portfolio_beta'):
        fb, pb = fund_metrics['beta'], portfolio_metrics['portfolio_beta']
        comparison['beta'] = ('LOWER (less market sensitive)' if fb < pb * 0.9
                              else 'HIGHER (more market sensitive)' if fb > pb * 1.1
                              else 'SIMILAR')

    if fund_metrics.get('sharpe') and portfolio_metrics.get('sharpe_1y'):
        fs, ps = fund_metrics['sharpe'], portfolio_metrics['sharpe_1y']
        comparison['sharpe'] = ('HIGHER (better risk-adjusted)' if fs > ps * 1.1
                                else 'LOWER (worse risk-adjusted)' if fs < ps * 0.9
                                else 'SIMILAR')
    return comparison
