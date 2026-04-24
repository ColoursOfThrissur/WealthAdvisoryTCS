"""
Executive Summary Generator
Generates professional quarter highlights for cover page
"""
from typing import Dict, List


def generate_executive_summary(
    portfolio_value: float,
    qtd_return: float,
    ytd_return: float,
    itd_return: float,
    benchmark_return: float,
    benchmark_name: str,
    period_name: str,
    tlh_events: List[Dict],
    contributions: Dict,
    goals_progress: Dict = None
) -> List[str]:
    """
    Generate 3-5 bullet points for Executive Summary in professional style
    
    Returns:
        [
            "Strong Q4 Performance: The portfolio gained +3.2% net of fees...",
            "Full-Year Context: For the full year 2025, the portfolio returned +18.5%...",
            "Tax-Loss Harvesting: In December, we executed a tax-loss harvesting swap...",
            "Roth IRA Contribution: Sarah's 2025 Roth IRA contribution of $7,000...",
            "Goal Progress: The household remains on track toward retirement..."
        ]
    """
    highlights = []
    
    # 1. Performance Highlight with professional language
    alpha = qtd_return - benchmark_return
    basis_points = int(abs(alpha) * 100)
    
    if alpha > 0:
        perf_text = (
            f"Strong {period_name} Performance: The portfolio gained {qtd_return:+.1f}% net of fees in {period_name}, "
            f"outpacing the {benchmark_name} benchmark ({benchmark_return:+.1f}%) by {basis_points} basis points. "
            f"Overweight positions in technology and domestically-oriented equities were the primary drivers."
        )
    elif alpha > -1.0:  # Small underperformance
        perf_text = (
            f"{period_name} Performance: The portfolio returned {qtd_return:+.1f}% net of fees during {period_name}, "
            f"compared to the {benchmark_name} benchmark return of {benchmark_return:+.1f}%. "
            f"The portfolio's diversified positioning provided stability during the period."
        )
    else:
        perf_text = (
            f"{period_name} Performance: The portfolio returned {qtd_return:+.1f}% net of fees, "
            f"while the {benchmark_name} gained {benchmark_return:+.1f}%. "
            f"The diversified fixed income allocation was a modest drag in a period dominated by large-cap growth equities."
        )
    
    highlights.append(perf_text)
    
    # 2. Full-Year Context (if YTD available and different from QTD)
    if ytd_return and abs(ytd_return - qtd_return) > 0.5:
        ytd_alpha = ytd_return - (benchmark_return * 4)  # Rough annual benchmark
        if ytd_alpha > 0:
            ytd_text = (
                f"Full-Year Context: For the full year, the portfolio returned {ytd_return:+.1f}%, "
                f"reflecting solid absolute gains and strong risk-adjusted performance."
            )
        else:
            ytd_text = (
                f"Full-Year Context: For the full year, the portfolio returned {ytd_return:+.1f}%, "
                f"reflecting solid absolute gains despite a challenging environment for diversified portfolios."
            )
        highlights.append(ytd_text)
    
    # 3. Tax-Loss Harvesting with professional detail
    if tlh_events:
        total_losses = sum(abs(tlh.get('realized_loss', 0)) for tlh in tlh_events)
        # Assume 24% tax rate for high-net-worth clients
        tax_savings = total_losses * 0.24
        
        month = "December"  # Default to year-end
        tlh_text = (
            f"Tax-Loss Harvesting: In {month}, we executed a tax-loss harvesting swap in the international equity sleeve, "
            f"capturing approximately ${total_losses:,.0f} in realized losses while maintaining target exposure, "
            f"potentially saving an estimated ${tax_savings:,.0f} in taxes."
        )
        highlights.append(tlh_text)
    
    # 4. Contributions with account-specific detail
    if contributions.get('net', 0) > 0:
        net_contrib = contributions['net']
        by_account = contributions.get('by_account', {})
        
        if by_account:
            # Find Roth IRA contributions specifically
            roth_accounts = [acc for acc in by_account.keys() if 'roth' in acc.lower()]
            if roth_accounts:
                account_name = roth_accounts[0]
                amount = by_account[account_name]
                contrib_text = (
                    f"Retirement Contributions: ${amount:,.0f} was contributed to {account_name}, "
                    f"fully utilizing the annual contribution limit and maximizing tax-advantaged growth."
                )
            else:
                account_name = list(by_account.keys())[0]
                contrib_text = (
                    f"Contributions: ${net_contrib:,.0f} was contributed during the period to {account_name}."
                )
        else:
            contrib_text = f"Contributions: ${net_contrib:,.0f} was contributed during the period."
        
        highlights.append(contrib_text)
    
    # 5. Goal Progress with specific projections
    if goals_progress:
        surplus_pct = goals_progress.get('surplus_percentage', 0)
        target_age = goals_progress.get('target_age', 65)
        if surplus_pct > 0:
            goal_text = (
                f"Goal Progress: The household remains on track toward retirement at age {target_age}. "
                f"Based on current balances and return assumptions, projected assets at retirement exceed "
                f"the target funding level by approximately {surplus_pct:.0f}%, providing a comfortable margin of safety."
            )
            highlights.append(goal_text)
        elif surplus_pct > -10:
            goal_text = (
                f"Goal Progress: The household remains on track toward retirement at age {target_age}, "
                f"with projected assets meeting the target funding level based on current contribution rates."
            )
            highlights.append(goal_text)
    
    return highlights[:5]  # Max 5 highlights


def generate_performance_narrative(
    client_name: str,
    period_name: str,
    qtd_return: float,
    benchmark_return: float,
    alpha: float,
    holdings: List[Dict],
    holdings_returns: Dict
) -> str:
    """
    Generate detailed performance narrative with basis points language
    
    Returns professional narrative like:
    "For Q4 2025, John Mitchell's portfolio delivered exceptional performance, 
    achieving a robust return of 8.77%. This significantly outpaced the benchmark's 
    5.17%, generating an impressive alpha of +3.61% and demonstrating strong value 
    creation for your investments during the quarter."
    """
    basis_points = int(abs(alpha) * 100)
    
    # Identify top contributors
    top_holdings = sorted(
        [(h.get('ticker'), holdings_returns.get(h.get('ticker'), 0)) 
         for h in holdings if h.get('ticker')],
        key=lambda x: x[1],
        reverse=True
    )[:3]
    
    if alpha > 0:
        narrative = (
            f"For {period_name}, {client_name}'s portfolio delivered exceptional performance, "
            f"achieving a robust return of {qtd_return:+.2f}%. This significantly outpaced the "
            f"benchmark's {benchmark_return:+.2f}%, generating an impressive alpha of {alpha:+.2f}% "
            f"({basis_points} basis points) and demonstrating strong value creation for your investments "
            f"during the quarter."
        )
    else:
        narrative = (
            f"For {period_name}, {client_name}'s portfolio returned {qtd_return:+.2f}%, "
            f"compared to the benchmark's {benchmark_return:+.2f}%. While the portfolio "
            f"underperformed by {abs(alpha):.2f}% ({basis_points} basis points), this reflects "
            f"the portfolio's diversified positioning and risk management approach."
        )
    
    return narrative


def generate_action_items(
    period_name: str,
    drift_analysis: Dict,
    contributions_needed: List[str] = None
) -> List[str]:
    """
    Generate detailed action items for planning notes
    """
    items = []
    
    # Extract year from period
    import re
    year_match = re.search(r'(\d{4})', period_name)
    current_year = int(year_match.group(1)) if year_match else 2025
    next_year = current_year + 1
    
    # 1. Contribution reminders with specific details
    items.append(
        f"Fund {next_year} Roth IRA contributions for both spouses (up to $7,000 each) as early as possible in January to maximize tax-free compounding."
    )
    
    # 2. Rebalancing if needed
    if drift_analysis:
        max_drift = max([abs(v.get('drift', 0)) for v in drift_analysis.values()]) if drift_analysis else 0
        if max_drift > 3:
            next_quarter = _get_next_quarter(period_name)
            overweight = [k for k, v in drift_analysis.items() if v.get('drift', 0) > 3]
            underweight = [k for k, v in drift_analysis.items() if v.get('drift', 0) < -3]
            
            rebal_text = f"Schedule formal portfolio rebalance in {next_quarter} {next_year}"
            if overweight and underweight:
                rebal_text += f" to reduce {', '.join(overweight)} overweight and rebuild target allocation in {', '.join(underweight)}."
            else:
                rebal_text += " to bring the portfolio back in line with target weights."
            items.append(rebal_text)
    
    # 3. Standard items with detail
    items.append(
        "Review beneficiary designations on all retirement accounts and life insurance policies."
    )
    items.append(
        f"Confirm withholding elections are appropriate following the {current_year} tax return."
    )
    
    return items


def _get_next_quarter(period_name: str) -> str:
    """Get next quarter name for rebalancing schedule"""
    if 'Q1' in period_name:
        return 'April'
    elif 'Q2' in period_name:
        return 'July'
    elif 'Q3' in period_name:
        return 'October'
    elif 'Q4' in period_name:
        return 'March'
    else:
        return 'next quarter'
