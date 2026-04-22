import { useState } from 'react';
import { Users, DollarSign, FileText, Users as UsersIcon, TrendingUp, Bell, BarChart3, Target, RefreshCw, AlertTriangle, Calendar, Award } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';
import { overviewMetrics, performanceData, adviceQualityData, highlightCards, agentActions, eventAlerts } from '../data/overviewData';

export const useOverviewContext = (setIsChatExpanded, setEventData) => {
  const [chartRange, setChartRange] = useState('1Y');
  const [qualityRange, setQualityRange] = useState('1M');

  const handleEventAlertClick = (eventId) => {
    console.log('Event clicked:', eventId);
    setEventData(eventId);
    setIsChatExpanded(true);
  };

  const handleRangeChange = (range) => {
    setChartRange(range);
  };

  const handleQualityRangeChange = (range) => {
    setQualityRange(range);
  };

  const getPercentageChange = (range) => {
    const data = performanceData[range] || performanceData['1Y'];
    const firstValue = data[0][1];
    const lastValue = data[data.length - 1][1];
    const percentChange = ((lastValue - firstValue) / firstValue) * 100;
    return parseFloat(percentChange.toFixed(2));
  };

  const getChartOptions = (range) => {
    const data = performanceData[range] || performanceData['1Y'];
    const percentChange = getPercentageChange(range);
    
    return {
      chart: {
        type: 'area',
        backgroundColor: 'transparent',
        height: 360
      },
      title: { text: null },
      credits: { enabled: false },
      legend: { enabled: false },
      xAxis: {
        type: 'datetime',
        lineColor: 'var(--glass-border)',
        tickColor: 'var(--glass-border)',
        labels: { style: { color: 'var(--text-tertiary)' } }
      },
      yAxis: {
        title: { text: null },
        gridLineColor: 'var(--glass-border)',
        labels: {
          style: { color: 'var(--text-tertiary)' },
          formatter: function() {
            return '$' + (this.value / 1000000).toFixed(0) + 'M';
          }
        }
      },
      tooltip: {
        backgroundColor: 'var(--bg-tertiary)',
        borderColor: 'var(--glass-border)',
        style: { color: 'var(--text-primary)' },
        formatter: function() {
          return '<b>$' + (this.y / 1000000).toFixed(2) + 'M</b>';
        }
      },
      plotOptions: {
        area: {
          fillColor: {
            linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
            stops: [
              [0, 'rgba(16, 185, 129, 0.3)'],
              [1, 'rgba(16, 185, 129, 0.05)']
            ]
          },
          lineWidth: 2,
          lineColor: 'var(--success)',
          marker: { enabled: false },
          states: {
            hover: {
              lineWidth: 3
            }
          }
        }
      },
      series: [{ name: 'AUM', data: data }],
      percentageChange: percentChange
    };
  };

  const getAdviceQualityOptions = (range) => {
    const data = adviceQualityData[range] || adviceQualityData['1M'];
    const categories = data.map(d => d.category);
    const scores = data.map(d => d.score);
    const benchmarks = data.map(d => d.benchmark);
    const avgScore = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
    
    return {
      chart: {
        type: 'column',
        backgroundColor: 'transparent',
        height: 360
      },
      title: { text: null },
      credits: { enabled: false },
      xAxis: {
        categories: categories,
        lineColor: 'var(--glass-border)',
        tickColor: 'var(--glass-border)',
        labels: { 
          style: { color: 'var(--text-tertiary)', fontSize: '11px' },
          rotation: -45
        }
      },
      yAxis: {
        min: 0,
        max: 100,
        title: { text: null },
        gridLineColor: 'var(--glass-border)',
        labels: {
          style: { color: 'var(--text-tertiary)' },
          formatter: function() {
            return this.value + '%';
          }
        }
      },
      tooltip: {
        backgroundColor: 'var(--bg-tertiary)',
        borderColor: 'var(--glass-border)',
        style: { color: 'var(--text-primary)' },
        shared: true,
        formatter: function() {
          let tooltip = '<b>' + this.x + '</b><br/>';
          this.points.forEach(point => {
            tooltip += '<span style="color:' + point.color + '">●</span> ' + 
                      point.series.name + ': <b>' + point.y + '%</b><br/>';
          });
          return tooltip;
        }
      },
      plotOptions: {
        column: {
          borderRadius: 4,
          pointPadding: 0.1,
          groupPadding: 0.15
        }
      },
      legend: {
        enabled: true,
        itemStyle: { color: 'var(--text-secondary)' },
        itemHoverStyle: { color: 'var(--text-primary)' }
      },
      series: [
        {
          name: 'Your Score',
          data: scores,
          color: 'var(--success)'
        },
        {
          name: 'Industry Benchmark',
          data: benchmarks,
          color: 'var(--glass-border)'
        }
      ],
      averageScore: avgScore
    };
  };

  const agentIcons = {
    'DocWiz': <FileText size={20} />,
    'MeetWiz': <UsersIcon size={20} />,
    'PortfolioWiz': <BarChart3 size={20} />,
    'Sentiment Rebalancer': <TrendingUp size={20} />,
    'Request Rebalancer': <Target size={20} />,
    'FundAllocator': <RefreshCw size={20} />
  };

  const cards = {
    chart: {
      type: 'chart',
      data: {
        title: 'Performance Overview',
        metrics: {
          clients: overviewMetrics.totalClients,
          aum: formatCurrency(overviewMetrics.totalAUM),
          change: overviewMetrics.aumChange
        },
        ranges: ['5D', '1M', '6M', '1Y', '5Y'],
        activeRange: chartRange,
        onRangeChange: handleRangeChange,
        chartOptions: getChartOptions(chartRange)
      }
    },
    qualityChart: {
      type: 'chart',
      data: {
        title: 'Advice Quality Metrics',
        metrics: {
          clients: overviewMetrics.totalClients,
          aum: 'Avg Score',
          change: getAdviceQualityOptions(qualityRange).averageScore
        },
        ranges: ['1M', '3M', '6M', '1Y'],
        activeRange: qualityRange,
        onRangeChange: handleQualityRangeChange,
        chartOptions: getAdviceQualityOptions(qualityRange)
      }
    },
    agents: agentActions.map(agent => ({
      type: 'agent',
      data: {
        name: agent.name,
        label: agent.label,
        clientsNeedingAction: agent.clientsNeedingAction,
        totalClients: agent.totalClients,
        description: agent.description,
        priority: agent.priority,
        icon: agentIcons[agent.name],
        onClick: () => console.log('Navigate to', agent.name)
      }
    })),
    stats: highlightCards.slice(4).map(card => ({
      type: 'stat',
      data: {
        label: card.label,
        value: card.value,
        type: card.type,
        icon: <TrendingUp size={20} />
      }
    })),
    alerts: {
      type: 'list',
      data: {
        title: 'Market Events',
        icon: <Bell size={20} />,
        items: eventAlerts.map(alert => ({
          text: alert.title,
          subtext: `${alert.description}${alert.affectedClients ? ` • ${alert.affectedClients} clients affected` : ''} • ${alert.time}`,
          dot: true,
          dotColor: alert.impact === 'High' ? 'var(--critical)' : alert.impact === 'Medium' ? 'var(--high)' : 'var(--medium)',
          onClick: alert.eventId ? () => alert.eventId : null
        })),
        onItemClick: handleEventAlertClick
      }
    }
  };

  return { cards, handleEventAlertClick };
};
