"""
Chart Data Generation Functions
Returns Highcharts-compatible JSON configurations
"""
from typing import List, Dict
from datetime import datetime


def generate_performance_chart_data(
    portfolio_history: List[Dict],
    benchmark_history: List[Dict]
) -> Dict:
    """
    Generate Highcharts-compatible JSON for performance line chart.
    
    Args:
        portfolio_history: [{"date": "2025-10-01", "value": 100000}, ...]
        benchmark_history: [{"date": "2025-10-01", "value": 5842.63}, ...]
    
    Returns:
        Highcharts configuration dict
    """
    # Normalize to percentage returns from start
    portfolio_start = portfolio_history[0]["value"] if portfolio_history else 1
    benchmark_start = benchmark_history[0]["value"] if benchmark_history else 1
    
    portfolio_data = []
    for item in portfolio_history:
        timestamp = int(datetime.fromisoformat(item["date"]).timestamp() * 1000)
        normalized_return = ((item["value"] - portfolio_start) / portfolio_start) * 100
        portfolio_data.append([timestamp, round(normalized_return, 2)])
    
    benchmark_data = []
    for item in benchmark_history:
        timestamp = int(datetime.fromisoformat(item["date"]).timestamp() * 1000)
        normalized_return = ((item["value"] - benchmark_start) / benchmark_start) * 100
        benchmark_data.append([timestamp, round(normalized_return, 2)])
    
    return {
        "chart": {
            "type": "line",
            "height": 400
        },
        "title": {
            "text": "Portfolio vs Benchmark Performance"
        },
        "xAxis": {
            "type": "datetime",
            "title": {"text": "Date"}
        },
        "yAxis": {
            "title": {"text": "Return (%)"},
            "labels": {"format": "{value}%"}
        },
        "tooltip": {
            "shared": True,
            "valueSuffix": "%",
            "valueDecimals": 2
        },
        "series": [
            {
                "name": "Portfolio",
                "data": portfolio_data,
                "color": "#3498DB"
            },
            {
                "name": "S&P 500",
                "data": benchmark_data,
                "color": "#95A5A6"
            }
        ],
        "credits": {"enabled": False}
    }


def generate_metrics_table_data(metrics: Dict) -> List[Dict]:
    """
    Generate table data for metrics display.
    
    Args:
        metrics: {
            "portfolio_return": 9.88,
            "benchmark_return": 2.76,
            "alpha": 7.12,
            ...
        }
    
    Returns:
        List of row dicts for table rendering
    """
    return [
        {
            "metric": "Portfolio Return",
            "value": f"{metrics.get('portfolio_return', 0):.2f}%",
            "description": "Period return (price-only)"
        },
        {
            "metric": "Benchmark Return",
            "value": f"{metrics.get('benchmark_return', 0):.2f}%",
            "description": "S&P 500 return"
        },
        {
            "metric": "Alpha",
            "value": f"{metrics.get('alpha', 0):+.2f}%",
            "description": "Outperformance vs benchmark"
        },
        {
            "metric": "Beta",
            "value": f"{metrics.get('beta', 1.0):.2f}",
            "description": "Market sensitivity"
        },
        {
            "metric": "Sharpe Ratio",
            "value": f"{metrics.get('sharpe_ratio', 0):.2f}",
            "description": "Risk-adjusted return"
        },
        {
            "metric": "Volatility",
            "value": f"{metrics.get('volatility', 0):.2f}%",
            "description": "Annualized"
        },
        {
            "metric": "Max Drawdown",
            "value": f"{metrics.get('max_drawdown', 0):.2f}%",
            "description": "Largest peak-to-trough decline"
        }
    ]


def generate_allocation_pie_chart(allocation_data: List[Dict]) -> Dict:
    """
    Generate Highcharts pie chart for asset allocation.
    
    Args:
        allocation_data: [{"name": "Stocks", "value": 75000, "percentage": 75}, ...]
    
    Returns:
        Highcharts configuration dict
    """
    series_data = [
        {"name": item["name"], "y": item["percentage"]}
        for item in allocation_data
    ]
    
    return {
        "chart": {"type": "pie", "height": 400},
        "title": {"text": "Asset Allocation"},
        "tooltip": {"pointFormat": "<b>{point.percentage:.1f}%</b>"},
        "plotOptions": {
            "pie": {
                "dataLabels": {
                    "enabled": True,
                    "format": "<b>{point.name}</b>: {point.percentage:.1f}%"
                }
            }
        },
        "series": [{"name": "Allocation", "data": series_data}],
        "credits": {"enabled": False}
    }


def generate_sector_bar_chart(sector_data: List[Dict]) -> Dict:
    """
    Generate Highcharts bar chart for sector breakdown.
    
    Args:
        sector_data: [{"sector": "Technology", "percentage": 45.2}, ...]
    
    Returns:
        Highcharts configuration dict
    """
    categories = [item["sector"] for item in sector_data]
    values = [item["percentage"] for item in sector_data]
    
    return {
        "chart": {"type": "bar", "height": 400},
        "title": {"text": "Sector Allocation"},
        "xAxis": {"categories": categories},
        "yAxis": {
            "title": {"text": "Percentage (%)"},
            "labels": {"format": "{value}%"}
        },
        "tooltip": {"valueSuffix": "%"},
        "series": [{"name": "Allocation", "data": values, "color": "#3498DB"}],
        "credits": {"enabled": False}
    }


def generate_drawdown_chart(daily_values: List[float], dates: List[str]) -> Dict:
    """
    Generate underwater/drawdown chart.
    
    Args:
        daily_values: Daily portfolio values
        dates: Corresponding dates in ISO format
    
    Returns:
        Highcharts configuration dict
    """
    running_max = []
    drawdowns = []
    current_max = 0
    
    for val in daily_values:
        current_max = max(current_max, val)
        running_max.append(current_max)
        drawdown = ((val - current_max) / current_max) * 100 if current_max > 0 else 0
        drawdowns.append(drawdown)
    
    chart_data = []
    for i, date_str in enumerate(dates):
        timestamp = int(datetime.fromisoformat(date_str).timestamp() * 1000)
        chart_data.append([timestamp, round(drawdowns[i], 2)])
    
    return {
        "chart": {"type": "area", "height": 300},
        "title": {"text": "Drawdown Analysis"},
        "xAxis": {"type": "datetime"},
        "yAxis": {
            "title": {"text": "Drawdown (%)"},
            "labels": {"format": "{value}%"}
        },
        "tooltip": {"valueSuffix": "%", "valueDecimals": 2},
        "series": [{
            "name": "Drawdown",
            "data": chart_data,
            "color": "#E74C3C",
            "fillColor": "rgba(231, 76, 60, 0.3)"
        }],
        "credits": {"enabled": False}
    }


def generate_allocation_pie_chart(allocation_data: List[Dict]) -> Dict:
    """
    Generate Highcharts pie chart for asset allocation.
    
    Args:
        allocation_data: [{"name": "Stocks", "value": 75000, "percentage": 75}, ...]
    
    Returns:
        Highcharts configuration dict
    """
    series_data = [
        {"name": item["name"], "y": item["percentage"]}
        for item in allocation_data
    ]
    
    return {
        "chart": {"type": "pie", "height": 400},
        "title": {"text": "Asset Allocation"},
        "tooltip": {
            "pointFormat": "<b>{point.percentage:.1f}%</b>"
        },
        "plotOptions": {
            "pie": {
                "dataLabels": {
                    "enabled": True,
                    "format": "<b>{point.name}</b>: {point.percentage:.1f}%"
                }
            }
        },
        "series": [{"name": "Allocation", "data": series_data}],
        "credits": {"enabled": False}
    }


def generate_sector_bar_chart(sector_data: List[Dict]) -> Dict:
    """
    Generate Highcharts bar chart for sector breakdown.
    
    Args:
        sector_data: [{"sector": "Technology", "percentage": 45.2}, ...]
    
    Returns:
        Highcharts configuration dict
    """
    categories = [item["sector"] for item in sector_data]
    values = [item["percentage"] for item in sector_data]
    
    return {
        "chart": {"type": "bar", "height": 400},
        "title": {"text": "Sector Allocation"},
        "xAxis": {"categories": categories},
        "yAxis": {
            "title": {"text": "Percentage (%)"},
            "labels": {"format": "{value}%"}
        },
        "tooltip": {"valueSuffix": "%"},
        "series": [{"name": "Allocation", "data": values, "color": "#3498DB"}],
        "credits": {"enabled": False}
    }


def generate_drawdown_chart(daily_values: List[float], dates: List[str]) -> Dict:
    """
    Generate underwater/drawdown chart.
    
    Args:
        daily_values: Daily portfolio values
        dates: Corresponding dates in ISO format
    
    Returns:
        Highcharts configuration dict
    """
    # Calculate running max and drawdown
    running_max = []
    drawdowns = []
    current_max = 0
    
    for i, val in enumerate(daily_values):
        current_max = max(current_max, val)
        running_max.append(current_max)
        drawdown = ((val - current_max) / current_max) * 100 if current_max > 0 else 0
        drawdowns.append(drawdown)
    
    # Convert to Highcharts format
    chart_data = []
    for i, date_str in enumerate(dates):
        timestamp = int(datetime.fromisoformat(date_str).timestamp() * 1000)
        chart_data.append([timestamp, round(drawdowns[i], 2)])
    
    return {
        "chart": {"type": "area", "height": 300},
        "title": {"text": "Drawdown Analysis"},
        "xAxis": {"type": "datetime"},
        "yAxis": {
            "title": {"text": "Drawdown (%)"},
            "labels": {"format": "{value}%"}
        },
        "tooltip": {"valueSuffix": "%", "valueDecimals": 2},
        "series": [{
            "name": "Drawdown",
            "data": chart_data,
            "color": "#E74C3C",
            "fillColor": "rgba(231, 76, 60, 0.3)"
        }],
        "credits": {"enabled": False}
    }
