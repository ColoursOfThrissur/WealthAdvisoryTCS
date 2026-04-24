"""
Test PDF Generation - Generate sample report with current design
"""
import sys
from pathlib import Path
from datetime import datetime

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / 'src'))

from services.pdf_generator import PDFGenerator

# Sample report data
sample_report = {
    "cover_page": {
        "firm_name": "Wealth Management Firm",
        "report_title": "Quarterly Portfolio Report",
        "client_name": "John Doe",
        "generation_date": datetime.now().strftime("%B %d, %Y"),
        "period": "Q4-2024"
    },
    "sections": {
        "performance_summary": {
            "portfolio_value": 1500000,
            "metrics": {
                "portfolio_return": 8.5,
                "benchmark_return": 6.2,
                "alpha": 2.3,
                "beta": 1.05
            },
            "performance_table": {
                "periods": ["QTD", "YTD", "1-Year", "3-Yr Ann.", "5-Yr Ann.", "ITD Ann."],
                "portfolio": [8.5, 15.2, 15.2, 12.8, 10.5, 14.2],
                "benchmark": [6.2, 12.1, 12.1, 10.5, 8.9, 11.8],
                "difference": [2.3, 3.1, 3.1, 2.3, 1.6, 2.4]
            },
            "account_table": {
                "accounts": [
                    {"name": "Individual Brokerage", "type": "Taxable", "value": 800000, "qtd": 8.5, "ytd": 15.2, "benchmark": "S&P 500"},
                    {"name": "401k", "type": "Retirement", "value": 700000, "qtd": 8.5, "ytd": 15.2, "benchmark": "S&P 500"},
                    {"name": "Total", "type": "", "value": 1500000, "qtd": 8.5, "ytd": 15.2, "benchmark": ""}
                ]
            },
            "risk_metrics": {
                "sharpe_ratio": 1.25,
                "volatility": 12.5,
                "max_drawdown": -8.2
            },
            "executive_highlights": [
                "<strong>Strong Q4 Performance:</strong> The portfolio gained +8.5% net of fees in Q4, outpacing the S&P 500 benchmark (+6.2%) by 230 basis points.",
                "<strong>Full-Year Context:</strong> For the full year, the portfolio returned +15.2%, reflecting solid absolute gains and outperforming the benchmark.",
                "<strong>Risk Management:</strong> Portfolio volatility remained well-controlled at 12.5%, with a Sharpe ratio of 1.25 indicating strong risk-adjusted returns.",
                "<strong>Goal Progress:</strong> The household remains on track toward retirement goals based on current balances and return assumptions."
            ],
            "narrative": "Your portfolio returned 8.5% during Q4-2024, outperforming the benchmark by 2.3%. This strong performance was driven by strategic positioning in technology and healthcare sectors.",
            "benchmark_name": "S&P 500"
        },
        "allocation_overview": {
            "allocation_table": [
                {"asset_class": "US Equity", "percentage": 60.0, "value": 900000},
                {"asset_class": "International Equity", "percentage": 20.0, "value": 300000},
                {"asset_class": "Fixed Income", "percentage": 15.0, "value": 225000},
                {"asset_class": "Cash", "percentage": 5.0, "value": 75000}
            ]
        },
        "holdings_detail": {
            "holdings_table": [
                {"security": "AAPL", "shares": 1000, "price": 185.50, "value": 185500, "percentage": 12.4, "qtd_return": 15.2},
                {"security": "MSFT", "shares": 800, "price": 375.25, "value": 300200, "percentage": 20.0, "qtd_return": 12.8},
                {"security": "GOOGL", "shares": 500, "price": 142.80, "value": 71400, "percentage": 4.8, "qtd_return": -3.5},
                {"security": "AMZN", "shares": 600, "price": 178.35, "value": 107010, "percentage": 7.1, "qtd_return": 8.9},
                {"security": "NVDA", "shares": 400, "price": 495.20, "value": 198080, "percentage": 13.2, "qtd_return": 22.5}
            ]
        },
        "market_commentary": {
            "market_summary": "<strong>Q4-2024 Market Review:</strong> US equity markets posted strong gains in the fourth quarter of 2024, with the S&P 500 Index returning +6.2%. Technology and healthcare sectors led the advance, while energy lagged.",
            "portfolio_impact": "<strong>Portfolio Impact:</strong> Our portfolio generated a return of 8.5% for the quarter, outperforming the S&P 500 by 230 basis points. Strong performance in technology holdings drove the outperformance.",
            "outlook": "<strong>Outlook & Positioning:</strong> Looking ahead, we anticipate continued market volatility. Our portfolio remains strategically positioned with quality equities and diversified fixed income exposure."
        },
        "activity_summary": {
            "summary": "Activity for Q4-2024: $2,500 in dividends received",
            "total_trades": 5,
            "total_dividends": 2500.00,
            "total_fees": 375.00,
            "net_cashflow": 10000.00,
            "note": "No transaction data available. Upload transaction file for complete activity details."
        },
        "planning_notes": {
            "recommendations": "Your retirement plan remains on track with a 95% probability of success. Continue maximum 401k contributions and consider Roth conversions in lower income years.",
            "action_items": [
                "Fund Roth IRA contributions for 2025",
                "Review beneficiary designations on all accounts",
                "Schedule tax planning meeting before year-end"
            ],
            "next_review": "Your next scheduled quarterly review meeting is tentatively set for mid-March 2025."
        }
    }
}

# Generate PDF
output_dir = Path(__file__).parent / "output" / "reports"
output_dir.mkdir(parents=True, exist_ok=True)

output_path = output_dir / f"test_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"

print(f"Generating test PDF: {output_path}")

try:
    generator = PDFGenerator()
    generator.generate_pdf(sample_report, str(output_path))
    print(f"✓ PDF generated successfully: {output_path}")
except Exception as e:
    print(f"✗ Error generating PDF: {e}")
    import traceback
    traceback.print_exc()
