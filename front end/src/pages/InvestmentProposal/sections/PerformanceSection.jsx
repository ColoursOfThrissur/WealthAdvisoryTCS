import React from 'react';
import { TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

const PerformanceSection = ({ isExpanded, onToggle }) => {
  const chartOptions = {
    chart: { backgroundColor: 'var(--color-base-800)', height: 500, zoomType: 'x' },
    title: { text: '', style: { color: 'var(--color-text-primary)' } },
    xAxis: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      labels: { style: { color: 'var(--color-text-secondary)' } },
      crosshair: true
    },
    yAxis: {
      title: { text: 'Normalized Value (Start=100)', style: { color: 'var(--color-text-primary)' } },
      labels: { style: { color: 'var(--color-text-secondary)' } }
    },
    tooltip: {
      shared: true,
      crosshairs: true,
      backgroundColor: 'var(--color-base-700)',
      style: { color: 'var(--color-text-primary)' },
      valueDecimals: 2
    },
    legend: { itemStyle: { color: 'var(--color-text-primary)' } },
    series: [
      {
        name: "S&P 500",
        data: [100, 104.1, 108.5, 112.3, 116.8, 120.2, 121.5, 122.8, 123.1, 123.8, 124.5, 125.1],
        color: 'var(--color-accent-primary)',
        dashStyle: 'dash',
        lineWidth: 2
      },
      {
        name: "Model Portfolio",
        data: [100, 105.2, 110.8, 115.5, 120.2, 124.9, 127.5, 129.3, 130.8, 132.5, 134.2, 135.8],
        color: 'var(--color-accent-secondary)',
        lineWidth: 3
      },
      {
        name: "Current Portfolio",
        data: [100, 102.5, 105.1, 107.8, 110.2, 112.5, 114.8, 115.9, 116.5, 117.1, 117.8, 118.4],
        color: 'var(--color-semantic-error)',
        lineWidth: 3
      }
    ],
    credits: { enabled: false }
  };

  return (
    <section className="ip-section">
      <div className="section-header" onClick={onToggle}>
        <TrendingUp size={20} />
        <h2>Market Performance Comparison</h2>
        {isExpanded ? <ChevronUp size={20} className="ip-chevron-icon" /> : <ChevronDown size={20} className="ip-chevron-icon" />}
      </div>
      {isExpanded && (
        <div className="ip-chart-wrapper">
          <HighchartsReact highcharts={Highcharts} options={chartOptions} />
        </div>
      )}
    </section>
  );
};

export default PerformanceSection;
