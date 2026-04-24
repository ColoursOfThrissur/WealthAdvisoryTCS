"""
Allocation Agent - Step 3: Asset allocation breakdown with drift analysis
"""
from typing import Dict, List
from tools.mcp_tools import MCPTools
from functions.advanced_calculations import calculate_drift_analysis
from services.chart_service import chart_service
from config.report_template import REPORT_TEMPLATE


class AllocationAgent:
    """Step 3: Allocation Overview"""
    
    async def execute(self, state_data: Dict) -> Dict:
        """Generate allocation breakdown with drift analysis"""
        try:
            holdings = state_data.get("holdings", [])
            target_allocation = state_data.get("target_allocation", {})
            tickers = [h['ticker'] for h in holdings]
            
            # Get current prices via MCP
            async with MCPTools() as mcp:
                quotes = {}
                
                for ticker in tickers:
                    try:
                        quote = await mcp.get_current_quote(ticker)
                        quotes[ticker] = quote['price']
                    except Exception as e:
                        print(f"Warning: Failed to fetch {ticker}: {e}")
                        quotes[ticker] = 100.0
            
            # Calculate allocation by asset class
            allocation = self._calculate_allocation(holdings, quotes, target_allocation)
            
            # Generate chart data
            colors = REPORT_TEMPLATE['allocation_overview']['colors']
            allocation_with_colors = [
                {**item, 'color': colors.get(item['asset_class'], '#999999')}
                for item in allocation['table']
            ]
            
            chart_data = chart_service.allocation_pie_chart(allocation_with_colors)
            
            return {
                "status": "complete",
                "section": "allocation_overview",
                "allocation_table": allocation['table'],
                "chart_data": chart_data,
                "total_value": allocation['total_value']
            }
            
        except Exception as e:
            import traceback
            return {
                "status": "error",
                "error": f"{str(e)}\n{traceback.format_exc()}"
            }
    
    def _calculate_allocation(self, holdings: List[Dict], prices: Dict, target_allocation: Dict = None) -> Dict:
        """Calculate asset allocation by asset class with drift"""
        
        total_value = sum(h['shares'] * prices.get(h['ticker'], 0) for h in holdings)
        
        # Group by asset class
        by_class = {}
        for holding in holdings:
            asset_class = holding.get('asset_class', 'US Equity')
            value = holding['shares'] * prices.get(holding['ticker'], 0)
            
            if asset_class not in by_class:
                by_class[asset_class] = 0
            by_class[asset_class] += value
        
        # Build table with drift
        allocation_table = []
        for asset_class, value in sorted(by_class.items(), key=lambda x: x[1], reverse=True):
            portfolio_pct = (value / total_value * 100) if total_value > 0 else 0
            target_pct = target_allocation.get(asset_class, 0) if target_allocation else 0
            drift = portfolio_pct - target_pct if target_allocation else 0
            
            allocation_table.append({
                'asset_class': asset_class,
                'percentage': round(portfolio_pct, 1),
                'value': round(value, 2),
                'portfolio_pct': round(portfolio_pct, 1),
                'market_value': round(value, 2),
                'target_pct': target_pct,
                'drift': round(drift, 1)
            })
        
        return {
            'table': allocation_table,
            'total_value': total_value
        }
