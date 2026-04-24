"""
Parameters Agent - Step 1: Collect report parameters
"""
import os
from typing import Dict
from datetime import datetime, date
from dotenv import load_dotenv
import openpyxl
import pandas as pd
from pathlib import Path

from parsers.enhanced_excel_parser import EnhancedExcelParser

load_dotenv()

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage


class ParametersAgent:
    """
    Step 1: Report Parameters
    
    Collects:
    - Client name
    - Reporting period (Q4-2025, custom dates, etc.)
    - Portfolio file (Excel/CSV)
    - Benchmark (default: S&P 500)
    - Optional: firm branding, account filters
    """
    
    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            temperature=0,
            google_api_key=os.getenv("GEMINI_API_KEY")
        )
    
    async def execute(self, collected_data: Dict) -> Dict:
        """
        Process and validate collected parameters
        
        Args:
            collected_data: {
                "client_name": "John Mitchell",
                "period": "Q4-2025" or {"start": "2025-10-01", "end": "2025-12-31"},
                "portfolio_file": "path/to/file.xlsx",
                "transaction_file": "path/to/transactions.csv" (optional),
                "benchmark": "^GSPC" or "SPY" or "QQQ" (optional),
                "accounts_filter": [...] (optional)
            }
        
        Returns:
            {
                "status": "complete",
                "parameters": {
                    "client_name": "John Mitchell",
                    "period": {"name": "Q4-2025", "start_date": "2025-10-01", "end_date": "2025-12-31"},
                    "benchmark": {"ticker": "^GSPC", "name": "S&P 500"},
                    "holdings": [...],
                    "accounts": [...],
                    "transactions": [...]
                }
            }
        """
        
        try:
            print(f"[DEBUG] ParametersAgent received: {list(collected_data.keys())}")
            print(f"[DEBUG] Portfolio file path: {collected_data.get('portfolio_file')}")
            
            # Parse period
            period = await self._parse_period(collected_data.get("period", "Q4-2025"))
            
            # Check if holdings already loaded from repository
            if "holdings" in collected_data and collected_data.get("holdings"):
                print(f"[PARAMS] Using holdings from repository ({len(collected_data['holdings'])} holdings)")
                portfolio_data = {
                    "client_name": collected_data.get("client_name"),
                    "holdings": collected_data["holdings"],
                    "accounts": collected_data.get("accounts", []),
                    "target_allocation": collected_data.get("target_allocation", {}),
                    "transactions": collected_data.get("transactions", []),
                    "goals": [],
                    "client_info": {}
                }
                print(f"[PARAMS] Using {len(portfolio_data['transactions'])} transactions from repository")
            else:
                # Parse portfolio file
                portfolio_data = await self._parse_portfolio_file(collected_data["portfolio_file"])
                print(f"[PARAMS] Parsed {len(portfolio_data.get('transactions', []))} transactions from file")
            
            # Parse transactions if provided (Phase 4)
            transactions = portfolio_data.get("transactions", [])
            if "transaction_file" in collected_data:
                transactions = await self._parse_transaction_file(collected_data["transaction_file"])
            
            # Set benchmark (Phase 5)
            benchmark_ticker = collected_data.get("benchmark", os.getenv("DEFAULT_BENCHMARK", "^GSPC"))
            benchmark = await self._get_benchmark_info(benchmark_ticker)
            
            # Extract client name (from data or provided)
            client_name = collected_data.get("client_name") or portfolio_data.get("client_name", "Client")
            
            parameters = {
                "client_name": client_name,
                "period": period,
                "benchmark": benchmark,
                "holdings": portfolio_data["holdings"],
                "accounts": portfolio_data.get("accounts", []),
                "target_allocation": portfolio_data.get("target_allocation", {}),
                "transactions": portfolio_data.get("transactions", []),
                "goals": portfolio_data.get("goals", []),
                "client_info": portfolio_data.get("client_info", {}),
                "advisor_name": "John",
                "advisor_credentials": "CFP®",
                "report_date": datetime.now().strftime("%B %d, %Y")
            }
            
            print(f"[PARAMS] Parsed {len(parameters['transactions'])} transactions")
            print(f"[PARAMS] Parsed {len(parameters['holdings'])} holdings")
            print(f"[PARAMS] Target allocation: {list(parameters['target_allocation'].keys())}")
            
            return {
                "status": "complete",
                "parameters": parameters,
                "client_name": client_name,
                "period_name": period["name"],
                "message": f"Parameters set for {client_name} - {period['name']} (Benchmark: {benchmark['name']})"
            }
            
        except Exception as e:
            return {
                "status": "error",
                "error": str(e),
                "message": f"Failed to process parameters: {str(e)}"
            }
    
    async def _parse_period(self, period_input) -> Dict:
        """Parse period string or dict into standardized format"""
        
        if isinstance(period_input, dict):
            # Check if it already has the correct format
            if 'start_date' in period_input and 'end_date' in period_input:
                return {
                    "name": period_input.get('name', f"{period_input['start_date']} to {period_input['end_date']}"),
                    "start_date": period_input['start_date'],
                    "end_date": period_input['end_date']
                }
            # Check for 'start' and 'end' keys
            elif 'start' in period_input and 'end' in period_input:
                return {
                    "name": period_input.get('name', f"{period_input['start']} to {period_input['end']}"),
                    "start_date": period_input["start"],
                    "end_date": period_input["end"]
                }
            # If it has a 'name' key, try to parse that
            elif 'name' in period_input:
                return await self._parse_period(period_input['name'])
            else:
                # Fallback: use the dict as-is if it looks valid
                print(f"[PARAMS] Warning: Unexpected period format: {period_input}")
                return await self._parse_period("Q4-2025")  # Default fallback
        
        # Parse period string (e.g., "Q4-2025", "2025", "YTD")
        period_str = str(period_input).upper()
        
        if "Q1" in period_str:
            year = period_str.split("-")[1] if "-" in period_str else str(datetime.now().year)
            return {
                "name": f"Q1-{year}",
                "start_date": f"{year}-01-01",
                "end_date": f"{year}-03-31"
            }
        elif "Q2" in period_str:
            year = period_str.split("-")[1] if "-" in period_str else str(datetime.now().year)
            return {
                "name": f"Q2-{year}",
                "start_date": f"{year}-04-01",
                "end_date": f"{year}-06-30"
            }
        elif "Q3" in period_str:
            year = period_str.split("-")[1] if "-" in period_str else str(datetime.now().year)
            return {
                "name": f"Q3-{year}",
                "start_date": f"{year}-07-01",
                "end_date": f"{year}-09-30"
            }
        elif "Q4" in period_str:
            year = period_str.split("-")[1] if "-" in period_str else str(datetime.now().year)
            return {
                "name": f"Q4-{year}",
                "start_date": f"{year}-10-01",
                "end_date": f"{year}-12-31"
            }
        elif "YTD" in period_str:
            year = str(datetime.now().year)
            return {
                "name": f"YTD-{year}",
                "start_date": f"{year}-01-01",
                "end_date": datetime.now().strftime("%Y-%m-%d")
            }
        else:
            # Default to Q4 of current year
            year = str(datetime.now().year)
            return {
                "name": f"Q4-{year}",
                "start_date": f"{year}-10-01",
                "end_date": f"{year}-12-31"
            }
    
    async def _parse_portfolio_file(self, file_path: str) -> Dict:
        """Parse Excel or CSV portfolio file"""
        
        path = Path(file_path)
        
        if not path.exists():
            raise FileNotFoundError(f"Portfolio file not found: {file_path}")
        
        if path.suffix in ['.xlsx', '.xls']:
            return self._parse_excel(path)
        elif path.suffix == '.csv':
            return self._parse_csv(path)
        else:
            raise ValueError(f"Unsupported file type: {path.suffix}")
    
    def _parse_excel(self, file_path: Path) -> Dict:
        """Parse Excel portfolio file using enhanced parser"""
        
        parser = EnhancedExcelParser()
        data = parser.parse(str(file_path))
        
        # Extract client name from client_info or holdings
        client_name = data['client_info'].get('client_name')
        
        # Enrich holdings with asset class if missing
        for holding in data['holdings']:
            if 'asset_class' not in holding:
                holding['asset_class'] = self._infer_asset_class(holding.get('ticker', ''))
        
        return {
            "client_info": data['client_info'],
            "client_name": client_name,
            "holdings": data['holdings'],
            "accounts": data['accounts'],
            "target_allocation": data['target_allocation'],
            "transactions": data['transactions'],
            "goals": data['goals']
        }
    
    def _parse_csv(self, file_path: Path) -> Dict:
        """Parse CSV portfolio file"""
        
        df = pd.read_csv(file_path)
        
        holdings = []
        client_name = None
        
        for _, row in df.iterrows():
            holding = {}
            
            for col in df.columns:
                if col.lower() in ['ticker', 'symbol']:
                    holding['ticker'] = row[col]
                elif col.lower() in ['shares', 'quantity']:
                    holding['shares'] = float(row[col])
                elif col.lower() in ['cost basis', 'cost_basis', 'basis']:
                    holding['cost_basis'] = float(row[col])
                elif col.lower() in ['account', 'account name']:
                    holding['account'] = row[col]
                elif col.lower() in ['client', 'client name', 'client_name']:
                    if not client_name:
                        client_name = row[col]
            
            if 'ticker' in holding and 'shares' in holding:
                holdings.append(holding)
        
        return {
            "client_name": client_name,
            "holdings": holdings,
            "accounts": list(set([h.get('account', 'Main') for h in holdings]))
        }
    
    async def _get_benchmark_info(self, ticker: str) -> Dict:
        """Get benchmark name from ticker"""
        
        if isinstance(ticker, dict):
            ticker = ticker.get("ticker", "^GSPC")
        
        benchmark_names = {
            "^GSPC": "S&P 500",
            "^DJI": "Dow Jones Industrial Average",
            "^IXIC": "NASDAQ Composite",
            "^RUT": "Russell 2000",
            "SPY": "S&P 500 ETF",
            "QQQ": "NASDAQ 100 ETF",
            "AGG": "Bloomberg Aggregate Bond",
            "VTI": "Total Stock Market ETF",
            "IWM": "Russell 2000 ETF"
        }
        
        return {
            "ticker": ticker,
            "name": benchmark_names.get(ticker, ticker)
        }
    
    def _infer_asset_class(self, ticker: str) -> str:
        """Infer asset class from ticker if not provided"""
        ticker = ticker.upper()
        
        if ticker in ['VOO', 'SPY', 'IVV', 'VTI', 'ITOT', 'QQQ', 'VGT', 'XLK']:
            return 'US Equity'
        elif ticker in ['EFA', 'VEA', 'IEFA', 'VXUS']:
            return 'International Equity'
        elif ticker in ['AGG', 'BND', 'BNDX', 'TLT', 'IEF', 'HYG', 'JNK']:
            return 'Fixed Income'
        elif ticker in ['GLD', 'IAU', 'SLV', 'VNQ', 'XLRE']:
            return 'Alternatives'
        else:
            return 'US Equity'
    
    async def _parse_transaction_file(self, file_path: str) -> list:
        """Parse transaction file (CSV or Excel)"""
        
        path = Path(file_path)
        
        if not path.exists():
            return []
        
        transactions = []
        
        if path.suffix == '.csv':
            df = pd.read_csv(file_path)
        else:
            df = pd.read_excel(file_path)
        
        for _, row in df.iterrows():
            txn = {}
            
            for col in df.columns:
                col_lower = col.lower()
                if col_lower in ['date', 'transaction date', 'trade date']:
                    txn['date'] = pd.to_datetime(row[col]).strftime('%Y-%m-%d')
                elif col_lower in ['type', 'transaction type', 'txn type']:
                    txn['type'] = row[col]
                elif col_lower in ['ticker', 'symbol']:
                    txn['ticker'] = row[col]
                elif col_lower in ['shares', 'quantity']:
                    txn['shares'] = float(row[col] or 0)
                elif col_lower in ['amount', 'value', 'price']:
                    txn['amount'] = float(row[col] or 0)
                elif col_lower in ['account', 'account name']:
                    txn['account'] = row[col]
            
            if 'date' in txn and 'type' in txn:
                transactions.append(txn)
        
        return transactions
