"""
Report Template Configuration
Defines the structure and formatting for professional quarterly reports
"""

REPORT_TEMPLATE = {
    "cover_page": {
        "title": "QUARTERLY PERFORMANCE REPORT",
        "confidential_notice": "CONFIDENTIAL — Prepared for the exclusive use of the named client.",
        "firm_name": "CORNERSTONE WEALTH ADVISORS",
        "default_advisor_credentials": "CFP®"
    },
    
    "executive_summary": {
        "metrics": [
            {"key": "portfolio_value", "label": "Total Portfolio Value", "format": "currency"},
            {"key": "qtd_return", "label": "QTD Return (Net)", "format": "percent", "compare": "benchmark"},
            {"key": "ytd_return", "label": "YTD Return (Net)", "format": "percent", "compare": "benchmark"},
            {"key": "itd_return", "label": "Since Inception", "format": "percent_ann"}
        ],
        "highlights_sections": [
            "strong_performance",
            "full_year_context", 
            "tax_events",
            "contributions",
            "goal_progress"
        ]
    },
    
    "performance_summary": {
        "periods": ["QTD", "YTD", "1-Year", "3-Yr Ann.", "5-Yr Ann.", "ITD Ann."],
        "metrics": ["portfolio", "benchmark", "difference"],
        "chart_type": "bar",
        "account_columns": ["name", "type", "value", "qtd", "ytd", "benchmark"]
    },
    
    "allocation_overview": {
        "columns": ["asset_class", "portfolio_pct", "market_value", "target_pct", "drift"],
        "chart_type": "pie",
        "colors": {
            "US Equity": "#4472C4",
            "International Equity": "#ED7D31",
            "Fixed Income": "#A5A5A5",
            "Alternatives": "#FFC000",
            "Cash & Equivalents": "#5B9BD5"
        }
    },
    
    "holdings_detail": {
        "columns": ["security", "ticker", "asset_class", "shares", "price", "market_value", "portfolio_pct", "qtd_return"],
        "sort_by": "market_value",
        "sort_order": "desc"
    },
    
    "market_commentary": {
        "sections": ["market_review", "portfolio_impact", "outlook"]
    },
    
    "activity_summary": {
        "transaction_columns": ["date", "type", "description", "quantity", "amount"],
        "summary_cards": [
            {"key": "net_contributions", "label": "Net Contributions"},
            {"key": "dividends", "label": "Dividends & Income"},
            {"key": "realized_gains", "label": "Realized Gains/Losses"},
            {"key": "advisory_fees", "label": "Advisory Fees Paid"}
        ]
    },
    
    "planning_notes": {
        "sections": [
            "retirement_progress",
            "education_planning",
            "action_items",
            "next_review"
        ]
    },
    
    "charts": {
        "performance_comparison": {
            "type": "bar",
            "title": "QTD Returns by Account",
            "yAxis": "Return (%)",
            "colors": ["#4472C4", "#ED7D31", "#A5A5A5", "#FFC000"]
        },
        "allocation_pie": {
            "type": "pie",
            "title": "Current Asset Allocation",
            "show_legend": True,
            "data_labels": True
        }
    },
    
    "styling": {
        "colors": {
            "primary": "#002060",
            "secondary": "#4472C4",
            "positive": "#70AD47",
            "negative": "#C00000",
            "neutral": "#7F7F7F"
        }
    }
}


def get_chart_config(chart_type: str) -> dict:
    """Get chart configuration by type"""
    return REPORT_TEMPLATE["charts"].get(chart_type, {})


def get_section_config(section_name: str) -> dict:
    """Get section configuration by name"""
    return REPORT_TEMPLATE.get(section_name, {})
