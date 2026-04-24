"""
Chart Service - Generate Highcharts configurations for reports
"""
from typing import Dict, List


class ChartService:
    """Service for generating chart configurations"""
    
    @staticmethod
    def generate_bar_chart(categories: List[str], series: List[Dict], title: str = "", y_axis_label: str = "Return (%)") -> Dict:
        """Generate bar chart configuration for performance comparison"""
        return {
            "chart": {"type": "column"},
            "title": {"text": title},
            "xAxis": {"categories": categories},
            "yAxis": {
                "title": {"text": y_axis_label},
                "labels": {"format": "{value:.2f}%"}
            },
            "series": series,
            "colors": ["#4472C4", "#ED7D31", "#A5A5A5", "#FFC000"],
            "plotOptions": {
                "column": {
                    "dataLabels": {
                        "enabled": True,
                        "format": "{y:.2f}%"
                    }
                }
            },
            "legend": {"enabled": True},
            "credits": {"enabled": False}
        }
    
    @staticmethod
    def generate_pie_chart(data: List[Dict], title: str = "") -> Dict:
        """Generate pie chart configuration for asset allocation"""
        return {
            "chart": {"type": "pie"},
            "title": {"text": title},
            "series": [{
                "name": "Allocation",
                "data": data,
                "dataLabels": {
                    "enabled": True,
                    "format": "{point.name}: {point.percentage:.2f}%"
                }
            }],
            "plotOptions": {
                "pie": {
                    "allowPointSelect": True,
                    "cursor": "pointer",
                    "showInLegend": True
                }
            },
            "legend": {"enabled": True},
            "credits": {"enabled": False}
        }
    
    @staticmethod
    def generate_line_chart(categories: List[str], series: List[Dict], title: str = "", y_axis_label: str = "Return (%)") -> Dict:
        """Generate line chart configuration for performance trends"""
        return {
            "chart": {"type": "line"},
            "title": {"text": title},
            "xAxis": {"categories": categories},
            "yAxis": {
                "title": {"text": y_axis_label},
                "labels": {"format": "{value:.2f}%"}
            },
            "series": series,
            "colors": ["#4472C4", "#ED7D31"],
            "plotOptions": {
                "line": {
                    "dataLabels": {"enabled": False},
                    "enableMouseTracking": True
                }
            },
            "legend": {"enabled": True},
            "credits": {"enabled": False}
        }
    
    @staticmethod
    def performance_comparison_chart(account_data: List[Dict]) -> Dict:
        """Generate account performance comparison bar chart"""
        categories = [acc["name"] for acc in account_data]
        qtd_data = [acc["qtd"] for acc in account_data]
        
        return ChartService.generate_bar_chart(
            categories=categories,
            series=[{"name": "QTD Return", "data": qtd_data}],
            title="QTD Returns by Account",
            y_axis_label="Return (%)"
        )
    
    @staticmethod
    def allocation_pie_chart(allocation_data: List[Dict]) -> Dict:
        """Generate asset allocation pie chart"""
        pie_data = [
            {
                "name": item["asset_class"],
                "y": item["portfolio_pct"],
                "color": item.get("color")
            }
            for item in allocation_data
        ]
        
        return ChartService.generate_pie_chart(
            data=pie_data,
            title="Current Asset Allocation"
        )
    
    @staticmethod
    def performance_trend_chart(periods: List[str], portfolio_returns: List[float], benchmark_returns: List[float]) -> Dict:
        """Generate performance trend line chart"""
        return ChartService.generate_line_chart(
            categories=periods,
            series=[
                {"name": "Portfolio", "data": portfolio_returns},
                {"name": "Benchmark", "data": benchmark_returns}
            ],
            title="Performance vs Benchmark",
            y_axis_label="Return (%)"
        )


# Global instance
chart_service = ChartService()
