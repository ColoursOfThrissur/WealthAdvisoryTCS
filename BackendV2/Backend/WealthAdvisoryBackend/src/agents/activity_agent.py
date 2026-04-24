"""
Activity Agent - Step 6: Activity summary with enhanced transaction analysis
"""
from typing import Dict, List
from pathlib import Path
import pandas as pd
from datetime import datetime
from functions.advanced_calculations import (
    calculate_realized_gains_losses,
    calculate_fees_from_transactions,
    calculate_net_contributions,
    detect_tax_loss_harvesting,
    calculate_dividends_from_transactions
)


class ActivityAgent:
    """Step 6: Activity Summary with Transaction Support"""
    
    async def execute(self, state_data: Dict) -> Dict:
        """Generate activity summary with enhanced transaction analysis"""
        try:
            holdings = state_data.get("holdings", [])
            period = state_data.get("period", {})
            transactions = state_data.get("transactions", [])
            
            print(f"[ACTIVITY] Processing {len(transactions)} transactions")
            print(f"[ACTIVITY] Period data: {period}")
            print(f"[ACTIVITY] Period type: {type(period)}")
            
            # Handle period data more robustly
            if isinstance(period, dict):
                period_name = period.get('name', 'Q4-2025')
                start_date = period.get('start_date') or period.get('start', '2025-10-01')
                end_date = period.get('end_date') or period.get('end', '2025-12-31')
            else:
                period_name = str(period) if period else 'Q4-2025'
                start_date = '2025-10-01'
                end_date = '2025-12-31'
            
            print(f"[ACTIVITY] Using period: {period_name}, {start_date} to {end_date}")
            
            # Filter transactions by period
            period_transactions = [
                t for t in transactions
                if start_date <= t.get('date', '') <= end_date
            ]
            
            print(f"[ACTIVITY] {len(period_transactions)} transactions in period {start_date} to {end_date}")
            
            if period_transactions:
                # Full transaction analysis
                realized_gl = calculate_realized_gains_losses(period_transactions)
                fees = calculate_fees_from_transactions(period_transactions)
                contributions = calculate_net_contributions(period_transactions)
                dividends = calculate_dividends_from_transactions(period_transactions)
                tlh_events = detect_tax_loss_harvesting(period_transactions)
                
                print(f"[ACTIVITY] Calculated - Trades: {len([t for t in period_transactions if t.get('type', '').upper() in ['BUY', 'SELL']])}, Dividends: ${dividends:,.0f}, Fees: ${fees['total_fees']:,.0f}")
                
                # Format transaction table for PDF
                transaction_table = []
                for t in period_transactions:
                    transaction_table.append({
                        'date': t.get('date', ''),
                        'type': t.get('type', '').title(),
                        'description': t.get('description', '') or f"{t.get('ticker', '')} - {t.get('type', '')}",
                        'quantity': t.get('shares', 0) if t.get('shares') else '',
                        'amount': t.get('amount', 0)
                    })
                
                result = {
                    "status": "complete",
                    "section": "activity_summary",
                    "total_trades": len([t for t in period_transactions if t.get('type', '').upper() in ['BUY', 'SELL']]),
                    "total_dividends": dividends,
                    "total_fees": fees['total_fees'],
                    "net_cashflow": contributions['net'],
                    "net_contributions": contributions['net'],
                    "realized_gains_losses": realized_gl['total_realized'],
                    "tlh_events": tlh_events,
                    "transaction_table": transaction_table,
                    "summary": self._generate_summary({
                        'total_trades': len([t for t in period_transactions if t.get('type', '').upper() in ['BUY', 'SELL']]),
                        'contributions': contributions['contributions'],
                        'withdrawals': contributions['withdrawals'],
                        'dividends': dividends,
                        'fees': fees['total_fees']
                    }, period_name)
                }
            else:
                print(f"[ACTIVITY] No transactions found, using estimates")
                # No transactions - provide minimal data
                result = {
                    "status": "complete",
                    "section": "activity_summary",
                    "total_trades": 0,
                    "total_dividends": 0,
                    "total_fees": 0,
                    "net_cashflow": 0,
                    "net_contributions": 0,
                    "realized_gains_losses": 0,
                    "tlh_events": [],
                    "note": "Transaction data not available for this period.",
                    "summary": f"No transaction data available for {period_name}."
                }
            
            return result
            
        except Exception as e:
            import traceback
            print(f"[ACTIVITY] Error: {traceback.format_exc()}")
            return {
                "status": "error",
                "error": f"{str(e)}\n{traceback.format_exc()}"
            }
    
    def _parse_transactions(self, file_path: str, period: Dict) -> List[Dict]:
        """Parse transaction file (CSV or Excel)"""
        path = Path(file_path)
        
        # Read file
        if path.suffix == '.csv':
            df = pd.read_csv(path)
        elif path.suffix in ['.xlsx', '.xls']:
            df = pd.read_excel(path)
        else:
            return []
        
        # Standardize column names
        df.columns = df.columns.str.lower().str.strip()
        
        # Parse dates
        date_col = None
        for col in ['date', 'trade date', 'transaction date', 'settle date']:
            if col in df.columns:
                date_col = col
                break
        
        if not date_col:
            return []
        
        df[date_col] = pd.to_datetime(df[date_col])
        
        # Filter by period
        start_date = pd.to_datetime(period.get('start_date', '2025-10-01'))
        end_date = pd.to_datetime(period.get('end_date', '2025-12-31'))
        df = df[(df[date_col] >= start_date) & (df[date_col] <= end_date)]
        
        # Parse transactions
        transactions = []
        for _, row in df.iterrows():
            trans = {
                'date': row[date_col].strftime('%Y-%m-%d'),
                'type': self._parse_transaction_type(row),
                'ticker': self._get_value(row, ['ticker', 'symbol', 'security']),
                'shares': self._get_value(row, ['shares', 'quantity'], 0),
                'amount': self._get_value(row, ['amount', 'value', 'price'], 0),
                'description': self._get_value(row, ['description', 'memo', 'notes'], '')
            }
            transactions.append(trans)
        
        return transactions
    
    def _parse_transaction_type(self, row) -> str:
        """Determine transaction type"""
        for col in ['type', 'transaction type', 'action']:
            if col in row.index:
                val = str(row[col]).lower()
                if 'buy' in val or 'purchase' in val:
                    return 'BUY'
                elif 'sell' in val or 'sale' in val:
                    return 'SELL'
                elif 'dividend' in val or 'div' in val:
                    return 'DIVIDEND'
                elif 'fee' in val or 'charge' in val:
                    return 'FEE'
                elif 'deposit' in val or 'contribution' in val:
                    return 'DEPOSIT'
                elif 'withdrawal' in val or 'distribution' in val:
                    return 'WITHDRAWAL'
        return 'OTHER'
    
    def _get_value(self, row, columns: List[str], default=None):
        """Get value from row by trying multiple column names"""
        for col in columns:
            if col in row.index and pd.notna(row[col]):
                return row[col]
        return default
    
    def _analyze_activity(self, transactions: List[Dict]) -> Dict:
        """Analyze transactions"""
        trades = []
        contributions = 0
        withdrawals = 0
        dividends = 0
        fees = 0
        
        for trans in transactions:
            if trans['type'] == 'BUY':
                trades.append({
                    'date': trans['date'],
                    'action': 'BUY',
                    'ticker': trans['ticker'],
                    'shares': trans['shares'],
                    'amount': trans['amount']
                })
            elif trans['type'] == 'SELL':
                trades.append({
                    'date': trans['date'],
                    'action': 'SELL',
                    'ticker': trans['ticker'],
                    'shares': trans['shares'],
                    'amount': trans['amount']
                })
            elif trans['type'] == 'DIVIDEND':
                dividends += abs(trans['amount'])
            elif trans['type'] == 'FEE':
                fees += abs(trans['amount'])
            elif trans['type'] == 'DEPOSIT':
                contributions += abs(trans['amount'])
            elif trans['type'] == 'WITHDRAWAL':
                withdrawals += abs(trans['amount'])
        
        return {
            'trades': trades,
            'contributions': contributions,
            'withdrawals': withdrawals,
            'dividends': dividends,
            'fees': fees,
            'rebalancing': []  # Would detect from trade patterns
        }
    
    def _generate_summary(self, activity: Dict, period: str) -> str:
        """Generate activity summary text"""
        parts = []
        
        if activity.get('total_trades', 0) > 0:
            parts.append(f"{activity['total_trades']} trades executed")
        
        if activity.get('contributions', 0) > 0:
            parts.append(f"${activity['contributions']:,.0f} contributed")
        
        if activity.get('withdrawals', 0) > 0:
            parts.append(f"${activity['withdrawals']:,.0f} withdrawn")
        
        if activity.get('dividends', 0) > 0:
            parts.append(f"${activity['dividends']:,.0f} in dividends")
        
        if activity.get('fees', 0) > 0:
            parts.append(f"${activity['fees']:,.0f} in fees")
        
        if not parts:
            return f"No activity recorded for {period}"
        
        return f"Activity for {period}: " + ", ".join(parts)
    
    async def _fetch_dividends_for_ticker(self, ticker: str, start_date: str, end_date: str) -> List[Dict]:
        """Fetch dividend data from MCP for a single ticker"""
        from tools.mcp_tools import MCPTools
        
        async with MCPTools() as mcp:
            return await mcp.get_dividends(ticker, start_date, end_date)
