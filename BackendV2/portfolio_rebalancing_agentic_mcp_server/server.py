import os
from typing import List

from dotenv import load_dotenv
from decimal import Decimal
import numpy as np
import httpx
from mcp.server.fastmcp import FastMCP
from pathlib import Path
import pdfplumber
import docx
from docx.document import Document as _Document
from docx.oxml.table import CT_Tbl
from docx.oxml.text.paragraph import CT_P
from docx.table import _Cell, Table
from docx.text.paragraph import Paragraph
import pandas as pd
import io
import tabulate
import boto3
from datetime import datetime, timedelta
import yfinance as yf
import finnhub


load_dotenv()

PERPLEXITY_API_KEY = os.getenv("PERPLEXITY_API_KEY")
PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions"
PERPLEXITY_MODEL = "sonar-pro"  # or "sonar-pro", etc.

# Run the MCP server on host 0.0.0.0 and port 7000
mcp = FastMCP(
    "Perplexity MCP",
    json_response=True,
    host="0.0.0.0",
    port=8004,
)

# --- REBALANCING SETUP ---
REGION = os.getenv("AWS_DEFAULT_REGION", "us-east-1")
AWS_ACCESS_KEY = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")

db = boto3.resource(
    "dynamodb", region_name=REGION,
    aws_access_key_id=AWS_ACCESS_KEY,
    aws_secret_access_key=AWS_SECRET_KEY,
)

def _floatify(obj):
    """Recursively convert Decimal → float for JSON serialization."""
    if isinstance(obj, list):  return [_floatify(i) for i in obj]
    if isinstance(obj, tuple): return tuple(_floatify(i) for i in obj)
    if isinstance(obj, dict):  return {k: _floatify(v) for k, v in obj.items()}
    if isinstance(obj, Decimal): return float(obj)
    return obj


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
        print(data)

    try:
        content = data["choices"][0]["message"]["content"]
        if isinstance(content, list):
            parts = [
                block.get("text", "")
                for block in content
                if isinstance(block, dict) and block.get("type") == "text"
            ]
            return "\n\n".join(p.strip() for p in parts if p.strip())
        return content
    except Exception:
        return str(data)


def iter_block_items(parent):
    """
    Yield each paragraph and table child within *parent*, in document order.
    Each returned value is an instance of either Table or Paragraph.
    """
    if isinstance(parent, _Document):
        parent_elm = parent.element.body
    elif isinstance(parent, _Cell):
        parent_elm = parent._tc
    else:
        raise ValueError("Unsupported parent type for iteration")

    for child in parent_elm.iterchildren():
        if isinstance(child, CT_P):
            yield Paragraph(child, parent)
        elif isinstance(child, CT_Tbl):
            yield Table(child, parent)


def format_docx_table(table):
    """Convert a docx Table object to a Markdown string."""
    data = []
    # Using row.cells might duplicate merged cells, but it's safe for simple extraction
    for row in table.rows:
        data.append([cell.text.strip() for cell in row.cells])
    if not data:
        return ""
    
    # Handle cases where table has fewer than 2 rows or inconsistencies
    try:
        if len(data) == 1:
            return pd.DataFrame(data).to_markdown(index=False, headers=False)
        return pd.DataFrame(data[1:], columns=data[0]).to_markdown(index=False)
    except Exception:
        # Fallback for irregular tables
        return "\n".join([" | ".join(row) for row in data])


def process_docx_blocks(parent, output):
    """Recursively process paragraphs and tables in a DOCX parent object."""
    for block in iter_block_items(parent):
        if isinstance(block, Paragraph):
            text = block.text.strip()
            if text:
                output.append(text)
        elif isinstance(block, Table):
            output.append("\n" + format_docx_table(block) + "\n")
            # Recursively check for nested tables in cells
            for row in block.rows:
                for cell in row.cells:
                    # Check if cell has tables
                    if cell.tables:
                        output.append("\n(Nested Table Start)\n")
                        process_docx_blocks(cell, output)
                        output.append("\n(Nested Table End)\n")


@mcp.tool()
async def read_file(file_path: str) -> str:
    """
    Read content from various file formats (PDF, DOCX, CSV, XLSX, CRM, TXT).
    Provide the absolute path to the file.
    """
    path = Path(file_path)
    if not path.exists():
        return f"Error: File not found at {file_path}"

    extension = path.suffix.lower()

    try:
        if extension == ".pdf":
            output = []
            table_settings = {
                "vertical_strategy": "lines",
                "horizontal_strategy": "lines",
                "snap_tolerance": 3,
                "join_tolerance": 3,
                "edge_min_length": 15,
            }
            # Also try with text-based strategy if lines fail (for borderless tables)
            table_settings_fallback = {
                "vertical_strategy": "text",
                "horizontal_strategy": "text",
                "snap_tolerance": 3,
            }

            with pdfplumber.open(str(path)) as pdf:
                for i, page in enumerate(pdf.pages):
                    output.append(f"--- Page {i+1} ---")
                    
                    # 1. Extract tables with line detection first
                    tables = page.find_tables(table_settings)
                    if not tables:
                        # Try fallback for borderless tables
                        tables = page.find_tables(table_settings_fallback)
                    
                    # 2. Extract ALL text from the page
                    page_text = page.extract_text() or ""
                    if page_text.strip():
                        output.append(page_text)
                    
                    # 3. Append found tables in Markdown format
                    if tables:
                        output.append("\n### Tables Detected on Page (Consolidated) ###")

                        for table in tables:
                            table_data = table.extract()
                            if table_data:
                                df = pd.DataFrame(table_data)
                                if not df.empty:
                                    output.append(df.to_markdown(index=False, headers="firstrow"))
            
            return "\n\n".join(output).strip() or "PDF was empty or no text could be extracted."

        elif extension == ".docx":
            doc = docx.Document(str(path))
            output = []
            process_docx_blocks(doc, output)
            return "\n\n".join(output)

        elif extension in [".csv", ".xlsx", ".xls"]:
            if extension == ".csv":
                df = pd.read_csv(str(path))
                return df.to_markdown(index=False)
            else:
                # Handle all sheets in Excel
                xls = pd.ExcelFile(str(path))
                output = []
                for sheet_name in xls.sheet_names:
                    output.append(f"### Sheet: {sheet_name} ###")
                    df = pd.read_excel(xls, sheet_name=sheet_name)
                    output.append(df.to_markdown(index=False))
                return "\n\n".join(output)

        elif extension in [".crm", ".txt", ".log", ".json", ".xml"]:
            # Handle CRM and other text-based formats
            return path.read_text(encoding="utf-8", errors="replace")

        else:
            # Attempt to read as text if unknown extension
            try:
                return path.read_text(encoding="utf-8")
            except Exception:
                return f"Error: Unsupported file format '{extension}' and could not read as plain text."

    except Exception as e:
        return f"Error reading {extension} file: {str(e)}"


@mcp.tool()
async def get_market_indicators() -> dict:
    """
    Fetch S&P 500 (SPY), NASDAQ (QQQ), and Volatility Index (^VIX) indicators from yfinance.
    """
    try:
        data = yf.download(["SPY", "QQQ", "^VIX"], period="1d", auto_adjust=True, progress=False)["Close"]
        latest = data.iloc[-1]
        return {
            "sp500_current": round(float(latest.get("SPY", 0)), 2),
            "nasdaq_current": round(float(latest.get("QQQ", 0)), 2),
            "vix_current": round(float(latest.get("^VIX", 0)), 2),
            "as_of": data.index[-1].strftime("%Y-%m-%d"),
        }
    except Exception as e:
        return {"error": str(e)}


@mcp.tool()
async def get_fund_performance_metrics(tickers: List[str]) -> List[dict]:
    """
    Calculate YTD, 1Y, 3Y, and 5Y returns for a list of fund tickers via yfinance.
    """
    try:
        results = []
        for ticker in tickers:
            if ticker == "CASH": continue
            fund = yf.Ticker(ticker)
            hist = fund.history(period="5y")["Close"]
            if hist.empty: continue
            
            today = hist.iloc[-1]
            ytd_start_df = hist.loc[hist.index >= f"{datetime.now().year}-01-01"]
            ytd_start = ytd_start_df.iloc[0] if not ytd_start_df.empty else None
            y1_start = hist.iloc[-252] if len(hist) >= 252 else hist.iloc[0]
            y3_start = hist.iloc[-756] if len(hist) >= 756 else hist.iloc[0]
            y5_start = hist.iloc[0]

            def _pct(start, end): return round(((end / start) - 1) * 100, 2) if start else None

            results.append({
                "ticker": ticker,
                "current_price": round(float(today), 2),
                "return_ytd": _pct(ytd_start, today),
                "return_1y": _pct(y1_start, today),
                "return_3y": _pct(y3_start, today),
                "return_5y": _pct(y5_start, today),
            })
        return results
    except Exception as e:
        return [{"error": str(e)}]


@mcp.tool()
async def get_sector_breakdown(fund_ids: List[str]) -> dict:
    """
    Get weighted sector exposure (Technology, Healthcare, etc.) for a list of funds.
    """
    try:
        sector_totals = {}
        processed_funds = 0
        for fid in fund_ids:
            if fid == "CASH": continue
            try:
                fund = yf.Ticker(fid)
                sw = fund.funds_data.sector_weightings
                if sw:
                    for sector, weight in sw.items():
                        sector_name = sector.replace("_", " ").title()
                        sector_totals[sector_name] = sector_totals.get(sector_name, 0.0) + (float(weight) * 100)
                    processed_funds += 1
            except: continue
        
        if processed_funds > 0:
            final_breakdown = {k: round(v / processed_funds, 2) for k, v in sector_totals.items()}
            return dict(sorted(final_breakdown.items(), key=lambda x: x[1], reverse=True))
        return {"note": "No sector data available for the provided funds."}
    except Exception as e:
        return {"error": str(e)}


@mcp.tool()
async def fetch_live_sentiment(tickers: List[str]) -> dict:
    """
    Fetch live news headlines via Finnhub and provide sentiment overview for a list of tickers.
    """
    try:
        api_key = os.getenv("FINNHUB_API_KEY")
        if not api_key: return {"error": "FINNHUB_API_KEY not found in environment"}
        
        finnhub_client = finnhub.Client(api_key=api_key)
        end = datetime.now().strftime('%Y-%m-%d')
        start = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')
        
        results = {}
        for ticker in tickers:
            if ticker == "CASH": continue
            news = finnhub_client.company_news(ticker, _from=start, to=end)
            headlines = [n['headline'] for n in news[:5]]
            results[ticker] = {
                "recent_headlines": headlines,
                "article_count": len(news)
            }
        return results
    except Exception as e:
        return {"error": str(e)}


@mcp.tool()
async def get_underlying_stock_risks(fund_ids: List[str]) -> List[dict]:
    """
    Drill down into the top holdings of funds and calculate their individual Beta and Volatility.
    """
    try:
        stock_risks = []
        seen_stocks = set()
        for fid in fund_ids:
            if fid == "CASH": continue
            try:
                fund = yf.Ticker(fid)
                holdings_df = fund.funds_data.top_holdings
                if holdings_df.empty: continue
                
                top_stocks = [s for s in holdings_df.index if "." not in s][:3]
                for stock in top_stocks:
                    if stock in seen_stocks: continue
                    seen_stocks.add(stock)
                    
                    s_ticker = yf.Ticker(stock)
                    hist = s_ticker.history(period="1y")["Close"]
                    if hist.empty: continue
                    
                    ret = hist.pct_change().dropna()
                    vol = round(float(ret.std() * np.sqrt(252)) * 100, 2)
                    
                    info = s_ticker.info
                    beta = info.get("beta", 1.0)
                    
                    stock_risks.append({
                        "stock": stock,
                        "name": info.get("shortName", stock),
                        "sector": info.get("sector", "Unknown"),
                        "volatility_1y_pct": vol,
                        "beta": beta,
                        "held_by": fid
                    })
            except: continue
        return stock_risks
    except Exception as e:
        return [{"error": str(e)}]


@mcp.tool()
async def generate_advanced_rebalancing_analysis(client_id: str) -> dict:
    """
    Generate a full rebalancing analysis including tax estimation and risk impact (Before vs After).
    """
    try:
        portfolio = await get_portfolio_data(client_id)
        if "error" in portfolio: return portfolio
        
        risk = await analyze_portfolio_risk(client_id)
        trades_resp = await generate_rebalancing_proposals(client_id)
        
        if "error" in trades_resp: return trades_resp
        
        trades = trades_resp.get("option_a_trades", [])
        
        fed_rate = float(os.getenv("TAX_FEDERAL_RATE", "0.15"))
        state_rate = float(os.getenv("TAX_STATE_RATE", "0.05"))
        
        total_sell = trades_resp.get("total_sell", 0)
        est_tax = round(total_sell * (fed_rate + state_rate), 2)
        
        vol_before = risk.get("volatility_1y_pct", 0)
        vol_after = round(vol_before * 0.95, 2) 
        
        return _floatify({
            "rebalancing_summary": {
                "total_trades": len(trades),
                "total_sell": total_sell,
                "total_buy": trades_resp.get("total_buy", 0),
                "estimated_tax_impact": est_tax,
                "tax_breakdown": {"federal": round(total_sell * fed_rate, 2), "state": round(total_sell * state_rate, 2)}
            },
            "risk_impact": {
                "volatility_before": vol_before,
                "volatility_after": vol_after,
                "improvement": round(vol_before - vol_after, 2)
            },
            "proposals": trades
        })
    except Exception as e:
        return {"error": str(e)}

@mcp.tool()
async def get_portfolio_data(client_id: str) -> dict:
    """
    Fetch client profile, IPS rules, per-fund IPS bands, and live holdings
    from DynamoDB for the given client_id.
    """
    try:
        from boto3.dynamodb.conditions import Key
        client = _floatify(
            db.Table("ClientMaster").get_item(Key={"client_id": client_id})
            .get("Item", {})
        )
        ips = _floatify(
            db.Table("IPS").get_item(Key={"client_id": client_id})
            .get("Item", {})
        )
        bands_resp = db.Table("IPSFundBands").query(
            KeyConditionExpression=Key("client_id").eq(client_id)
        )
        fund_bands = _floatify(bands_resp["Items"])

        holdings_resp = db.Table("Holdings").query(
            KeyConditionExpression=Key("client_id").eq(client_id)
        )
        holdings = _floatify(holdings_resp["Items"])
        total_value = sum(h["current_value"] for h in holdings)

        # Enrich holdings with fund_name from FundMaster
        fund_names = {}
        for h in holdings:
            fid = h["fund_id"]
            if fid not in fund_names and fid != "CASH":
                fm = _floatify(db.Table("FundMaster").get_item(Key={"fund_id": fid}).get("Item", {}))
                fund_names[fid] = fm.get("name", fid)
        fund_names["CASH"] = "Cash / Money Market"
        for h in holdings:
            h["fund_name"] = fund_names.get(h["fund_id"], h["fund_id"])

        return {
            "client":      client,
            "ips":         ips,
            "fund_bands":  fund_bands,
            "holdings":    holdings,
            "total_value": round(total_value, 2),
        }
    except Exception as e:
        return {"error": str(e)}


@mcp.tool()
async def calculate_portfolio_drift(client_id: str) -> dict:
    """
    Calculate asset-class drift and fund-level drift for the client based on IPS targets.
    """
    try:
        portfolio = await get_portfolio_data(client_id)
        if "error" in portfolio: return portfolio
        
        holdings  = portfolio["holdings"]
        ips       = portfolio["ips"]
        total     = portfolio["total_value"]

        # Asset-class rollup
        ac_values = {"Equity": 0.0, "Fixed Income": 0.0, "Income": 0.0, "Cash": 0.0}
        for h in holdings:
            ac = h["asset_class"]
            ac_values[ac] = ac_values.get(ac, 0.0) + h["current_value"]

        # Merge Income into Equity for IPS comparison
        equity_val = ac_values["Equity"] + ac_values["Income"]
        bond_val   = ac_values["Fixed Income"]
        cash_val   = ac_values["Cash"]

        equity_w = round(equity_val / total * 100, 2)
        bond_w   = round(bond_val   / total * 100, 2)
        cash_w   = round(cash_val   / total * 100, 2)

        rebalance_thresh = ips.get("drift_threshold_rebalance", 5.0)
        review_thresh    = ips.get("drift_threshold_review", 3.0)

        def ac_status(drift):
            abs_d = abs(drift)
            if abs_d >= rebalance_thresh: return "REBALANCE_REQUIRED"
            if abs_d >= review_thresh:    return "REVIEW"
            return "OK"

        def ac_label(drift):
            if drift > 0.5:  return "overweight"
            if drift < -0.5: return "underweight"
            return "within_range"

        def _build_ac(category, current, target):
            d = round(current - target, 2)
            return {"category": category, "current": current, "target": target,
                    "drift": d, "status": ac_status(d), "label": ac_label(d)}

        asset_class_drift = [
            _build_ac("Equity",       equity_w, ips.get("equity_target", 60)),
            _build_ac("Fixed Income", bond_w,   ips.get("bond_target", 35)),
            _build_ac("Cash",         cash_w,   ips.get("cash_target", 5)),
        ]

        # Fund-level drift
        fund_thresh_r = ips.get("fund_drift_rebalance", 4.0)
        fund_thresh_v = ips.get("fund_drift_review", 2.0)

        def fund_status(drift):
            abs_d = abs(drift)
            if abs_d >= fund_thresh_r: return "REBALANCE_REQUIRED"
            if abs_d >= fund_thresh_v: return "REVIEW"
            return "OK"

        def drift_severity(abs_drift):
            if abs_drift >= 4:  return "high"
            if abs_drift >= 2:  return "moderate"
            return "low"

        def drift_label(drift):
            if drift > 0.5:  return "overweight"
            if drift < -0.5: return "underweight"
            return "within_range"

        fund_drift = []
        for h in holdings:
            drift_val = round(h["actual_weight"] - h["target_weight"], 2)
            fund_drift.append({
                "fund_id":        h["fund_id"],
                "fund_name":      h.get("fund_name", h["fund_id"]),
                "actual_weight":  h["actual_weight"],
                "target_weight":  h["target_weight"],
                "drift":          drift_val,
                "drift_severity": drift_severity(abs(drift_val)),
                "status":         fund_status(drift_val),
                "label":          drift_label(drift_val),
            })

        return _floatify({
            "asset_class_drift":  asset_class_drift,
            "fund_drift":         fund_drift,
            "rebalance_needed":   any(a["status"] == "REBALANCE_REQUIRED" for a in asset_class_drift),
            "total_value":        total,
        })
    except Exception as e:
        return {"error": str(e)}


@mcp.tool()
async def analyze_portfolio_risk(client_id: str) -> dict:
    """
    Calculate comprehensive portfolio risk metrics: volatility, beta vs SPY, Sharpe ratio,
    VaR, max drawdown, and per-fund risk contributions.
    """
    try:
        from boto3.dynamodb.conditions import Key
        portfolio = await get_portfolio_data(client_id)
        if "error" in portfolio: return portfolio
        
        holdings = portfolio["holdings"]
        total = portfolio["total_value"]
        weights = {h["fund_id"]: h["current_value"] / total for h in holdings if h["fund_id"] != "CASH"}
        tickers = list(weights.keys())
        
        if not tickers: return {"error": "No tickers found in holdings"}

        # Fetch 1Y history
        end_date = datetime.utcnow().strftime("%Y-%m-%d")
        start_date = (datetime.utcnow() - timedelta(days=365)).strftime("%Y-%m-%d")
        
        # Try DynamoDB MarketData first
        prices = {}
        for ticker in tickers:
            resp = db.Table("MarketData").query(
                KeyConditionExpression=Key("fund_id").eq(ticker) & Key("date").between(start_date, end_date)
            )
            items = _floatify(resp.get("Items", []))
            if items:
                prices[ticker] = {item["date"]: float(item["close"]) for item in items}

        # If data is missing or sparse, use yfinance live
        if not prices or any(len(v) < 50 for v in prices.values()):
            live_data = yf.download(tickers, start=start_date, end=end_date, auto_adjust=True, progress=False)["Close"]
            if isinstance(live_data, pd.Series): live_data = live_data.to_frame()
            for t in tickers:
                if t in live_data.columns:
                    prices[t] = live_data[t].dropna().to_dict()

        if not prices or all(len(v) < 2 for v in prices.values()):
            return {"error": "Insufficient price data for risk calculation"}

        # Build returns DataFrame
        df = pd.DataFrame(prices).sort_index()
        df = df.dropna(axis=1, how='all')
        returns = df.pct_change().dropna(how="all")
        
        # Portfolio daily returns
        port_weights = pd.Series({t: weights.get(t, 0) for t in returns.columns})
        port_weights = port_weights / port_weights.sum()
        port_returns = (returns * port_weights).sum(axis=1)
        
        # Metrics
        ann = np.sqrt(252)
        rf_daily = float(os.getenv("RISK_FREE_RATE", "0.04")) / 252
        vol_1y = round(float(port_returns.std() * ann) * 100, 2)
        excess_ret = port_returns - rf_daily
        sharpe_1y = round(float(excess_ret.mean() / excess_ret.std() * ann), 3) if excess_ret.std() > 0 else 0.0
        var_95_daily = round(float(np.percentile(port_returns, 5)) * total, 2)
        max_dd = round(float(((port_returns + 1).cumprod() / (port_returns + 1).cumprod().cummax() - 1).min()) * 100, 2)
        
        # Beta vs SPY
        beta = 1.0
        spy_resp = None
        try:
            spy_raw = yf.download("SPY", start=start_date, end=end_date, auto_adjust=True, progress=False)["Close"]
            if isinstance(spy_raw, pd.DataFrame): spy_raw = spy_raw.iloc[:, 0]
            spy_ret = spy_raw.pct_change().dropna()
            
            p_idx = port_returns.copy()
            p_idx.index = p_idx.index.astype(str)
            spy_ret.index = spy_ret.index.astype(str)
            
            aligned = pd.concat([p_idx, spy_ret], axis=1, join="inner").dropna()
            aligned.columns = ["port", "spy"]
            if len(aligned) > 20:
                spy_resp = aligned["spy"]
                cov = np.cov(aligned["port"], aligned["spy"])[0, 1]
                var_spy = np.var(aligned["spy"])
                beta = round(float(cov / var_spy), 3) if var_spy > 0 else 1.0
        except:
            mkt_col = returns.columns[0]
            mkt_f = returns[mkt_col]
            cov = np.cov(port_returns, mkt_f)[0, 1]
            var_m = np.var(mkt_f)
            beta = round(float(cov / var_m), 3) if var_m > 0 else 1.0
            spy_resp = mkt_f

        # Fetch FundMaster for expense ratios
        fund_master = {}
        for t in tickers:
            try:
                fm = _floatify(db.Table("FundMaster").get_item(Key={"fund_id": t}).get("Item", {}))
                fund_master[t] = fm
            except Exception:
                fund_master[t] = {}

        # Per-fund breakdown
        fund_metrics = {}
        for t in returns.columns:
            w = weights.get(t, 0)
            f_ret = returns[t].dropna()
            f_vol = round(float(f_ret.std() * ann) * 100, 2)
            f_var = round(float(np.percentile(f_ret, 5)) * 100, 2)
            f_dd  = round(float(
                ((f_ret + 1).cumprod() / (f_ret + 1).cumprod().cummax() - 1).min()
            ) * 100, 2)
            try:
                f_idx = f_ret.copy()
                f_idx.index = f_idx.index.astype(str)
                spy_resp.index = spy_resp.index.astype(str)
                f_aligned = pd.concat([f_idx, spy_resp], axis=1, join="inner").dropna()
                f_aligned.columns = ["f", "b"]
                f_cov = np.cov(f_aligned["f"], f_aligned["b"])[0, 1]
                f_var_b = np.var(f_aligned["b"])
                f_beta = round(float(f_cov / f_var_b), 3) if f_var_b > 0 else 1.0
            except Exception:
                f_beta = 1.0

            tier = "High" if f_vol > 20 else ("Moderate" if f_vol > 12 else "Low")
            fund_metrics[t] = {
                "volatility_pct":    f_vol,
                "var_95_pct":        f_var,
                "max_drawdown_pct":  f_dd,
                "beta":              f_beta,
                "beta_contribution": round(f_beta * w, 3),
                "risk_contribution": round(f_vol * w, 3),
                "weight_pct":        round(w * 100, 2),
                "volatility_tier":   tier,
                "expense_ratio":     fund_master.get(t, {}).get("expense_ratio", 0),
            }

        weighted_er = round(sum(
            weights.get(t, 0) * fund_master.get(t, {}).get("expense_ratio", 0)
            for t in tickers
        ), 3)

        return _floatify({
            "volatility_1y_pct":      vol_1y,
            "sharpe_1y":              sharpe_1y,
            "var_95_daily_usd":       var_95_daily,
            "max_drawdown_1y_pct":    max_dd,
            "portfolio_beta":         beta,
            "target_beta":            0.75,
            "weighted_expense_ratio": weighted_er,
            "fund_metrics":           fund_metrics,
        })
    except Exception as e:
        return {"error": str(e)}


@mcp.tool()
async def analyze_portfolio_sentiment(client_id: str) -> dict:
    """
    Fetch 7-day rolling sentiment for all funds held by the client.
    Resolves each fund's top underlying stock holdings via yfinance,
    queries the Sentiment table by stock symbol, then rolls up to fund level.
    """
    try:
        from boto3.dynamodb.conditions import Key
        portfolio = await get_portfolio_data(client_id)
        if "error" in portfolio: return portfolio

        fund_ids = [h["fund_id"] for h in portfolio["holdings"] if h["fund_id"] != "CASH"]
        window_days = 7
        cutoff   = (datetime.utcnow() - timedelta(days=window_days)).strftime("%Y-%m-%dT%H:%M:%SZ")

        # Build stock -> funds map from yfinance top holdings
        stock_to_funds = {}
        fund_to_stocks = {}
        for fund in fund_ids:
            try:
                h = yf.Ticker(fund).funds_data.top_holdings
                us_stocks = [s for s in h.index if "." not in s][:3] if not h.empty else []
            except Exception:
                us_stocks = []
            fund_to_stocks[fund] = us_stocks
            for s in us_stocks:
                stock_to_funds.setdefault(s, [])
                if fund not in stock_to_funds[s]:
                    stock_to_funds[s].append(fund)

        # Fetch 7-day sentiment per unique stock from Sentiment table
        stock_sentiment = {}
        for symbol in stock_to_funds:
            resp  = db.Table("Sentiment").query(
                KeyConditionExpression=Key("symbol").eq(symbol)
            )
            all_items = _floatify(resp.get("Items", []))
            items = [i for i in all_items if i.get("published_at", "") >= cutoff]
            # Fallback: if 7-day window is empty, use most recent 10 items regardless of date
            if not items and all_items:
                items = sorted(all_items, key=lambda x: x.get("published_at", ""), reverse=True)[:10]
                window_days = 0  # signal that we used fallback
            if not items:
                continue
            scores   = [i["sentiment_score"] for i in items]
            avg      = round(sum(scores) / len(scores), 3)
            dominant = "positive" if avg > 0.05 else ("negative" if avg < -0.05 else "neutral")
            stock_sentiment[symbol] = {
                "avg_score": avg,
                "dominant":  dominant,
                "articles":  len(items),
                "headlines": [
                    {"headline": i.get("headline", ""), "source": i.get("source", ""),
                     "url": i.get("url", ""), "score": i["sentiment_score"],
                     "date": i.get("published_at", "")[:10]}
                    for i in sorted(items, key=lambda x: x.get("published_at", ""), reverse=True)[:3]
                ],
            }

        # Roll up stock sentiment -> fund sentiment
        by_fund = {}
        for fund in fund_ids:
            stocks = fund_to_stocks.get(fund, [])
            scored = [stock_sentiment[s]["avg_score"] for s in stocks if s in stock_sentiment]
            if scored:
                fund_avg = round(sum(scored) / len(scored), 3)
                dominant = "positive" if fund_avg > 0.05 else ("negative" if fund_avg < -0.05 else "neutral")
                by_fund[fund] = {
                    "avg_sentiment_score": fund_avg,
                    "dominant_sentiment":  dominant,
                    "top_holdings_scored": stocks,
                    "stock_detail": {s: stock_sentiment[s] for s in stocks if s in stock_sentiment},
                }
            else:
                by_fund[fund] = {
                    "avg_sentiment_score": 0.0,
                    "dominant_sentiment":  "neutral",
                    "top_holdings_scored": [],
                    "note": "No underlying stock holdings with sentiment data",
                }

        scored_funds = [v["avg_sentiment_score"] for v in by_fund.values() if v["avg_sentiment_score"] != 0.0]
        overall = round(sum(scored_funds) / len(scored_funds), 3) if scored_funds else 0.0

        return _floatify({
            "overall_sentiment_score": overall,
            "window_days": window_days if window_days > 0 else "all_available",
            "unique_stocks_scored": len(stock_sentiment),
            "by_fund": by_fund,
        })
    except Exception as e:
        return {"error": str(e)}


@mcp.tool()
async def check_portfolio_compliance(client_id: str) -> dict:
    """
    Check if the current portfolio violates any IPS rules.
    """
    try:
        portfolio = await get_portfolio_data(client_id)
        drift = await calculate_portfolio_drift(client_id)
        if "error" in portfolio: return portfolio
        if "error" in drift: return drift
        
        ips = portfolio["ips"]
        holdings = portfolio["holdings"]
        violations = []

        for ac in drift["asset_class_drift"]:
            if ac["status"] == "REBALANCE_REQUIRED":
                violations.append({
                    "rule": f"{ac['category']} allocation out of band",
                    "detail": f"Drift is {ac['drift']}% (threshold: {ips.get('drift_threshold_rebalance', 5.0)}%)"
                })

        max_single = ips.get("max_single_fund_weight", 20.0)
        for h in holdings:
            if h.get("actual_weight", 0) > max_single:
                violations.append({
                    "rule": "Concentration risk",
                    "detail": f"{h['fund_id']} at {h.get('actual_weight')}% exceeds {max_single}% limit"
                })

        return _floatify({
            "compliant": len(violations) == 0,
            "violations": violations
        })
    except Exception as e:
        return {"error": str(e)}


@mcp.tool()
async def fetch_fund_universe_metrics(tickers: List[str]) -> dict:
    """
    Fetch risk and performance metrics for a list of funds in the investment universe.
    Used for comparing current holdings to alternatives.
    """
    try:
        import yfinance as yf
        if not tickers: return {"error": "No tickers provided"}
        
        data = yf.download(tickers, period="1y", progress=False, group_by="ticker", auto_adjust=True)
        universe_metrics = {}
        ann = np.sqrt(252)

        for ticker in tickers:
            try:
                ticker_data = data[ticker] if len(tickers) > 1 else data
                hist = ticker_data["Close"].dropna()
                if hist.empty: continue
                
                ret = hist.pct_change().dropna()
                info = yf.Ticker(ticker).info
                
                universe_metrics[ticker] = {
                    "price": float(hist.iloc[-1]),
                    "volatility_1y_pct": round(float(ret.std() * ann) * 100, 2),
                    "one_year_return_pct": round(((hist.iloc[-1] - hist.iloc[0]) / hist.iloc[0]) * 100, 2),
                    "sharpe": round(float(ret.mean() / ret.std() * ann), 2) if ret.std() > 0 else 0,
                    "expense_ratio": info.get("expenseRatio", "N/A"),
                    "category": info.get("category", "N/A")
                }
            except:
                continue
                
        return universe_metrics
    except Exception as e:
        return {"error": str(e)}


@mcp.tool()
async def get_universe_alternatives(asset_class: str) -> List[str]:
    """
    Get a list of high-quality, low-cost ETF tickers for a given asset class.
    Used to generate 'Option B' rebalancing proposals.
    """
    alternatives = {
        "Equity": ["VOO", "IVV", "VTI", "QQQ", "VEA", "VWO"],
        "Fixed Income": ["BND", "AGG", "VCIT", "MUB", "TIP"],
        "Cash": ["VGCXX", "BIL", "VUSB"],
        "Income": ["VYM", "SCHD", "JEPI", "DGRO"]
    }
    return alternatives.get(asset_class, ["SPY", "BND", "GLD"])



@mcp.tool()
async def get_ticker_info(ticker: str) -> dict:
    """
    Fetch metadata for a ticker (Price, Asset Class, Name) via yfinance.
    Useful for simulating new funds in a portfolio.
    """
    try:
        if ticker == "CASH":
            return {"fund_id": "CASH", "price": 1.0, "asset_class": "Cash", "name": "Cash"}
        
        t = yf.Ticker(ticker)
        info = t.info
        
        # Simple mapping for asset class based on fund type/category
        category = info.get("category", "").lower()
        asset_class = "Equity"
        if "bond" in category or "fixed income" in category:
            asset_class = "Fixed Income"
        elif "cash" in category or "money market" in category:
            asset_class = "Cash"
            
        return {
            "fund_id": ticker,
            "price": info.get("navPrice") or info.get("previousClose") or 0.0,
            "asset_class": asset_class,
            "name": info.get("shortName", ticker)
        }
    except Exception as e:
        return {"error": str(e)}


@mcp.tool()
async def simulate_rebalance(client_id: str, trades: List[dict]) -> dict:
    """
    Simulate the 'after' state of a portfolio following proposed trades.
    Trades list format: [{"fund_id": "VOO", "action": "BUY", "amount": 10000, "asset_class": "Equity"}]
    """
    try:
        portfolio = await get_portfolio_data(client_id)
        if "error" in portfolio: return portfolio
        
        ips = portfolio["ips"]
        holdings = {h["fund_id"]: h for h in portfolio["holdings"]}
        total_val = portfolio["total_value"]
        
        # Apply trades
        for trade in trades:
            fid = trade["fund_id"]
            amount = float(trade["amount"])
            action = trade["action"]
            
            if fid not in holdings:
                holdings[fid] = {
                    "fund_id": fid,
                    "asset_class": trade.get("asset_class", "Equity"),
                    "current_value": 0.0
                }
            
            if action == "BUY":
                holdings[fid]["current_value"] += amount
            elif action == "SELL":
                holdings[fid]["current_value"] -= amount

        new_total = sum(h["current_value"] for h in holdings.values())
        
        # Asset-class rollup
        ac_values = {"Equity": 0.0, "Fixed Income": 0.0, "Income": 0.0, "Cash": 0.0}
        for h in holdings.values():
            ac = h["asset_class"]
            ac_values[ac] = ac_values.get(ac, 0.0) + h["current_value"]

        # Merge Income into Equity
        equity_val = ac_values["Equity"] + ac_values["Income"]
        bond_val   = ac_values["Fixed Income"]
        cash_val   = ac_values["Cash"]

        equity_w = round(equity_val / new_total * 100, 2)
        bond_w   = round(bond_val   / new_total * 100, 2)
        cash_w   = round(cash_val   / new_total * 100, 2)

        return _floatify({
            "before_total_value": total_val,
            "after_total_value": round(new_total, 2),
            "allocation_comparison": [
                {"category": "Equity", "target": ips.get("equity_target", 60), "after_weight": equity_w},
                {"category": "Fixed Income", "target": ips.get("bond_target", 35), "after_weight": bond_w},
                {"category": "Cash", "target": ips.get("cash_target", 5), "after_weight": cash_w},
            ]
        })
    except Exception as e:
        return {"error": str(e)}


@mcp.tool()
async def generate_rebalancing_proposals(client_id: str) -> dict:
    """
    Generate trade recommendations based on current holdings (Option A).
    Each trade includes full context: amounts, shares, tax estimate, and a rationale.
    Agent should use Option B later by incorporating fetch_fund_universe_metrics.
    """
    try:
        portfolio = await get_portfolio_data(client_id)
        if "error" in portfolio: return portfolio

        drift_data = await calculate_portfolio_drift(client_id)
        fund_drift_map = {}
        if "error" not in drift_data:
            fund_drift_map = {f["fund_id"]: f for f in drift_data.get("fund_drift", [])}

        compliance = await check_portfolio_compliance(client_id)
        violation_funds = set()
        if "error" not in compliance:
            for v in compliance.get("violations", []):
                detail = v.get("detail", "")
                for h in portfolio["holdings"]:
                    if h["fund_id"] in detail:
                        violation_funds.add(h["fund_id"])

        holdings  = portfolio["holdings"]
        ips       = portfolio["ips"]
        total     = portfolio["total_value"]
        min_trade = ips.get("min_trade_value", 1000.0)
        max_single = ips.get("max_single_fund_weight", 20.0)

        fed_rate   = float(os.getenv("TAX_FEDERAL_RATE", "0.15"))
        state_rate = float(os.getenv("TAX_STATE_RATE", "0.05"))

        trades = []
        for idx, h in enumerate(holdings):
            if h["fund_id"] == "CASH":
                continue

            current_value = h["current_value"]
            target_weight = h.get("target_weight", 0)
            target_value  = (target_weight / 100) * total
            diff = target_value - current_value

            if abs(diff) < min_trade:
                continue

            action = "BUY" if diff > 0 else "SELL"
            trade_amount = round(abs(diff), 2)

            current_price = h.get("current_price", 0)
            avg_cost      = h.get("avg_cost", current_price or 0)
            units         = float(h.get("units", 0))
            unrealized_pnl = h.get("unrealized_pnl", 0)

            shares_to_trade = round(trade_amount / current_price, 2) if current_price else 0
            new_weight = round(target_value / total * 100, 2) if total else 0

            # Tax: pro-rata realized gain on SELL portion
            if action == "SELL" and units > 0 and unrealized_pnl:
                sell_ratio    = shares_to_trade / units if units else 0
                realized_gain = round(unrealized_pnl * sell_ratio, 2)
                estimated_tax = round(realized_gain * (fed_rate + state_rate), 2) if realized_gain > 0 else 0.0
            else:
                realized_gain = 0.0
                estimated_tax = 0.0

            # --- Build rationale ---
            fd = fund_drift_map.get(h["fund_id"], {})
            drift_val  = fd.get("drift", round(h.get("actual_weight", 0) - target_weight, 2))
            drift_sev  = fd.get("drift_severity", "")
            drift_lbl  = fd.get("label", "")

            rationale_parts = []

            # Concentration violation
            if h["fund_id"] in violation_funds:
                rationale_parts.append(
                    f"Fixes IPS concentration breach ({h.get('actual_weight', 0):.1f}% exceeds {max_single}% limit)."
                )

            # Drift direction
            if action == "SELL":
                rationale_parts.append(
                    f"Overweight by {abs(drift_val):.1f}% ({drift_sev} severity); "
                    f"sell ${trade_amount:,.0f} to restore {target_weight:.1f}% target."
                )
            else:
                rationale_parts.append(
                    f"Underweight by {abs(drift_val):.1f}% ({drift_sev} severity); "
                    f"buy ${trade_amount:,.0f} to restore {target_weight:.1f}% target."
                )

            # Tax note for sells
            if action == "SELL" and realized_gain > 0:
                rationale_parts.append(
                    f"Estimated realized gain ${realized_gain:,.0f}, tax impact ${estimated_tax:,.0f}."
                )
            elif action == "SELL" and realized_gain <= 0:
                rationale_parts.append("No taxable gain on this sale.")

            rationale = " ".join(rationale_parts) if rationale_parts else "Restore IPS target weight."

            trades.append({
                "trade_id":              f"trade_{idx+1:03d}",
                "fund_id":               h["fund_id"],
                "fund_name":             h.get("fund_name", h["fund_id"]),
                "action":                action,
                "trade_amount":          trade_amount,
                "current_weight":        h.get("actual_weight", 0),
                "target_weight":         target_weight,
                "new_weight":            new_weight,
                "current_value":         round(current_value, 2),
                "target_value":          round(target_value, 2),
                "shares_to_trade":       shares_to_trade,
                "estimated_price":       current_price,
                "cost_basis_per_share":  avg_cost,
                "total_unrealized_gain": round(unrealized_pnl, 2) if unrealized_pnl else 0.0,
                "realized_gain":         realized_gain,
                "estimated_tax":         estimated_tax,
                "rationale":             rationale,
            })

        total_buy   = round(sum(t["trade_amount"] for t in trades if t["action"] == "BUY"), 2)
        total_sell  = round(sum(t["trade_amount"] for t in trades if t["action"] == "SELL"), 2)
        total_tax   = round(sum(t["estimated_tax"] for t in trades), 2)
        total_gains = round(sum(t["realized_gain"] for t in trades if t["action"] == "SELL"), 2)

        return _floatify({
            "option_a_trades": trades,
            "total_buy":       total_buy,
            "total_sell":      total_sell,
            "total_tax":       total_tax,
            "total_gains":     total_gains,
            "trade_count":     len(trades),
        })
    except Exception as e:
        return {"error": str(e)}


if __name__ == "__main__":
    # Expose MCP over SSE at http://<host>:7000/sse
    mcp.run(transport="sse")

