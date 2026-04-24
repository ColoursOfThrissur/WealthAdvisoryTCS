"""
Executive Summary Generator
Generates 1-page executive summary with key highlights
"""
from typing import Dict, List


def generate_executive_summary(
    client_name: str,
    period_name: str,
    portfolio_value: float,
    qtd_return: float,
    ytd_return: float,
    benchmark_return: float,
    top_performers: List[Dict],
    key_changes: List[str]
) -> Dict:
    """
    Generate executive summary highlights
    
    Returns:
        {
            'title': 'Executive Summary',
            'highlights': ['bullet 1', 'bullet 2', ...],
            'portfolio_value': 1234567.89,
            'qtd_return': 5.25,
            'ytd_return': 12.50
        }
    """
    highlights = []
    
    # Performance highlight
    if qtd_return > benchmark_return:
        outperformance = qtd_return - benchmark_return
        highlights.append(
            f"Portfolio outperformed benchmark by {outperformance:.0f} basis points this quarter, "
            f"returning {qtd_return:.2f}% vs {benchmark_return:.2f}%"
        )
    else:
        underperformance = benchmark_return - qtd_return
        highlights.append(
            f"Portfolio returned {qtd_return:.2f}% this quarter vs benchmark {benchmark_return:.2f}%, "
            f"trailing by {underperformance:.0f} basis points"
        )
    
    # YTD performance
    highlights.append(f"Year-to-date return of {ytd_return:.2f}%")
    
    # Top performers
    if top_performers and len(top_performers) > 0:
        top_3 = top_performers[:3]
        top_names = ", ".join([p['ticker'] for p in top_3])
        highlights.append(f"Top contributors: {top_names}")
    
    # Key changes
    if key_changes:
        for change in key_changes[:2]:
            highlights.append(change)
    
    return {
        'title': 'Executive Summary',
        'highlights': highlights,
        'portfolio_value': portfolio_value,
        'qtd_return': qtd_return,
        'ytd_return': ytd_return
    }
