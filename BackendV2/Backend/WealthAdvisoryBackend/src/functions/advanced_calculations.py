"""
Advanced Calculations for Professional Reports
Drift analysis, realized gains/losses, fees, tax-loss harvesting
"""
from typing import Dict, List, Tuple
from datetime import datetime, timedelta


def calculate_drift_analysis(holdings: List[Dict], target_allocation: Dict, current_prices: Dict) -> Dict:
    """
    Calculate drift between current and target allocation
    
    Returns:
        {
            'US Equity': {'current': 55.0, 'target': 50.0, 'drift': +5.0, 'value': 1016029},
            'Fixed Income': {'current': 20.0, 'target': 25.0, 'drift': -5.0, 'value': 369465},
            ...
        }
    """
    # Calculate current allocation
    total_value = sum(h['shares'] * current_prices.get(h['ticker'], 0) for h in holdings)
    
    current_allocation = {}
    for holding in holdings:
        asset_class = holding.get('asset_class', 'US Equity')
        value = holding['shares'] * current_prices.get(holding['ticker'], 0)
        
        if asset_class not in current_allocation:
            current_allocation[asset_class] = 0
        current_allocation[asset_class] += value
    
    # Calculate percentages and drift
    drift_analysis = {}
    for asset_class, value in current_allocation.items():
        current_pct = (value / total_value * 100) if total_value > 0 else 0
        target_pct = target_allocation.get(asset_class, 0)
        drift = current_pct - target_pct
        
        drift_analysis[asset_class] = {
            'current': current_pct,
            'target': target_pct,
            'drift': drift,
            'value': value
        }
    
    # Add missing target classes with 0 current
    for asset_class, target_pct in target_allocation.items():
        if asset_class not in drift_analysis:
            drift_analysis[asset_class] = {
                'current': 0,
                'target': target_pct,
                'drift': -target_pct,
                'value': 0
            }
    
    return drift_analysis


def calculate_realized_gains_losses(transactions: List[Dict]) -> Dict:
    """
    Calculate realized gains/losses from transactions
    
    Returns:
        {
            'total_realized': -22500,
            'short_term': 0,
            'long_term': -22500,
            'by_ticker': {'EFA': -22500}
        }
    """
    # Track cost basis by ticker (FIFO)
    cost_basis_tracker = {}
    realized_gains = {}
    
    for txn in sorted(transactions, key=lambda x: x['date']):
        ticker = txn.get('ticker')
        if not ticker:
            continue
        
        txn_type = txn.get('type', '').upper()
        shares = txn.get('shares', 0)
        amount = txn.get('amount', 0)
        
        if txn_type in ['BUY', 'PURCHASE']:
            # Add to cost basis
            if ticker not in cost_basis_tracker:
                cost_basis_tracker[ticker] = []
            cost_basis_tracker[ticker].append({
                'date': txn['date'],
                'shares': shares,
                'cost_per_share': amount / shares if shares > 0 else 0
            })
        
        elif txn_type in ['SELL', 'SALE']:
            # Calculate realized gain/loss
            if ticker not in cost_basis_tracker or not cost_basis_tracker[ticker]:
                continue
            
            remaining_shares = shares
            realized = 0
            
            while remaining_shares > 0 and cost_basis_tracker[ticker]:
                lot = cost_basis_tracker[ticker][0]
                
                if lot['shares'] <= remaining_shares:
                    # Sell entire lot
                    cost = lot['shares'] * lot['cost_per_share']
                    proceeds = (lot['shares'] / shares) * amount
                    realized += proceeds - cost
                    remaining_shares -= lot['shares']
                    cost_basis_tracker[ticker].pop(0)
                else:
                    # Partial lot sale
                    cost = remaining_shares * lot['cost_per_share']
                    proceeds = (remaining_shares / shares) * amount
                    realized += proceeds - cost
                    lot['shares'] -= remaining_shares
                    remaining_shares = 0
            
            if ticker not in realized_gains:
                realized_gains[ticker] = 0
            realized_gains[ticker] += realized
    
    total_realized = sum(realized_gains.values())
    
    return {
        'total_realized': total_realized,
        'short_term': 0,  # Would need holding period calculation
        'long_term': total_realized,
        'by_ticker': realized_gains
    }


def calculate_fees_from_transactions(transactions: List[Dict]) -> Dict:
    """
    Calculate advisory fees and other fees from transactions
    
    Returns:
        {
            'advisory_fees': 4618,
            'other_fees': 0,
            'total_fees': 4618
        }
    """
    advisory_fees = 0
    other_fees = 0
    
    for txn in transactions:
        txn_type = txn.get('type', '').upper()
        amount = abs(txn.get('amount', 0))
        
        if 'FEE' in txn_type or 'ADVISORY' in txn_type:
            advisory_fees += amount
        elif 'COMMISSION' in txn_type or 'CHARGE' in txn_type:
            other_fees += amount
    
    return {
        'advisory_fees': advisory_fees,
        'other_fees': other_fees,
        'total_fees': advisory_fees + other_fees
    }


def calculate_net_contributions(transactions: List[Dict]) -> Dict:
    """
    Calculate net contributions (deposits - withdrawals)
    
    Returns:
        {
            'contributions': 7000,
            'withdrawals': 0,
            'net': 7000,
            'by_account': {'Sarah Roth IRA': 7000}
        }
    """
    contributions = 0
    withdrawals = 0
    by_account = {}
    
    for txn in transactions:
        txn_type = txn.get('type', '').upper()
        amount = abs(txn.get('amount', 0))
        account = txn.get('account', 'Unknown')
        
        if txn_type in ['CONTRIBUTION', 'DEPOSIT', 'TRANSFER IN']:
            contributions += amount
            by_account[account] = by_account.get(account, 0) + amount
        elif txn_type in ['WITHDRAWAL', 'DISTRIBUTION', 'TRANSFER OUT']:
            withdrawals += amount
            by_account[account] = by_account.get(account, 0) - amount
    
    return {
        'contributions': contributions,
        'withdrawals': withdrawals,
        'net': contributions - withdrawals,
        'by_account': by_account
    }


def detect_tax_loss_harvesting(transactions: List[Dict]) -> List[Dict]:
    """
    Detect tax-loss harvesting pairs (sell at loss + buy similar within 30 days)
    
    Returns:
        [
            {
                'date': '2025-12-18',
                'sell_ticker': 'EFA',
                'buy_ticker': 'BNDX',
                'shares_sold': 300,
                'shares_bought': 600,
                'realized_loss': -22500,
                'estimated_tax_savings': 5625
            }
        ]
    """
    tlh_events = []
    
    # Sort transactions by date
    sorted_txns = sorted(transactions, key=lambda x: x['date'])
    
    for i, txn in enumerate(sorted_txns):
        if txn.get('type', '').upper() not in ['SELL', 'SALE']:
            continue
        
        # Check if it's a loss (would need cost basis)
        # For now, look for "Tax-Loss" in description
        description = txn.get('description', '').lower()
        if 'tax' not in description and 'loss' not in description:
            continue
        
        sell_date = datetime.strptime(txn['date'], '%Y-%m-%d')
        sell_ticker = txn.get('ticker')
        sell_shares = txn.get('shares', 0)
        sell_amount = txn.get('amount', 0)
        
        # Look for buy within 30 days
        for j in range(i+1, len(sorted_txns)):
            buy_txn = sorted_txns[j]
            buy_date = datetime.strptime(buy_txn['date'], '%Y-%m-%d')
            
            if (buy_date - sell_date).days > 30:
                break
            
            if buy_txn.get('type', '').upper() in ['BUY', 'PURCHASE']:
                buy_ticker = buy_txn.get('ticker')
                buy_shares = buy_txn.get('shares', 0)
                buy_amount = buy_txn.get('amount', 0)
                
                # Estimate loss (negative)
                realized_loss = sell_amount - buy_amount
                tax_savings = abs(realized_loss) * 0.25  # Assume 25% tax rate
                
                tlh_events.append({
                    'date': txn['date'],
                    'sell_ticker': sell_ticker,
                    'buy_ticker': buy_ticker,
                    'shares_sold': sell_shares,
                    'shares_bought': buy_shares,
                    'realized_loss': realized_loss,
                    'estimated_tax_savings': tax_savings
                })
                break
    
    return tlh_events


def calculate_dividends_from_transactions(transactions: List[Dict]) -> float:
    """Calculate total dividends from transaction history"""
    total = 0
    
    for txn in transactions:
        txn_type = txn.get('type', '').upper()
        if 'DIVIDEND' in txn_type or 'DIV' in txn_type:
            total += abs(txn.get('amount', 0))
    
    return total
