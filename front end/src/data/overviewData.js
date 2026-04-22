import { activeMarketEvent } from './marketEventData';

export const overviewMetrics = {
  totalClients: 253,
  totalAUM: 393245267.25,
  aumChange: 22.89,
  cashInHand: 50440.92,
  avgDisposableIncome: 95678,
  criticalPriority: 3,
  highPriority: 2,
  mediumPriority: 2,
  lowPriority: 2
};

// Generate realistic performance data with daily granularity
const generatePerformanceData = (days, startValue, endValue, volatility = 0.02) => {
  const data = [];
  const totalChange = endValue - startValue;
  const trend = totalChange / days;
  
  for (let i = 0; i <= days; i++) {
    const timestamp = Date.now() - (days - i) * 24 * 60 * 60 * 1000;
    const trendValue = startValue + (trend * i);
    const randomVariation = (Math.random() - 0.5) * 2 * volatility * startValue;
    const value = trendValue + randomVariation;
    data.push([timestamp, Math.round(value)]);
  }
  
  return data;
};

export const performanceData = {
  '5D': generatePerformanceData(5, 392500000, 393245267.25, 0.005),
  '1M': generatePerformanceData(30, 388000000, 393245267.25, 0.008),
  '6M': generatePerformanceData(180, 365000000, 393245267.25, 0.012),
  '1Y': generatePerformanceData(365, 320000000, 393245267.25, 0.015),
  '5Y': generatePerformanceData(1825, 200000000, 393245267.25, 0.02)
};

// Advice Quality Metrics - Real-world KPIs for wealth advisors
export const adviceQualityData = {
  '1M': [
    { category: 'Client Satisfaction', score: 92, benchmark: 85 },
    { category: 'Portfolio Performance', score: 88, benchmark: 82 },
    { category: 'Risk Management', score: 95, benchmark: 88 },
    { category: 'Response Time', score: 87, benchmark: 80 },
    { category: 'Compliance', score: 98, benchmark: 95 },
    { category: 'Retention Rate', score: 94, benchmark: 90 }
  ],
  '3M': [
    { category: 'Client Satisfaction', score: 91, benchmark: 85 },
    { category: 'Portfolio Performance', score: 86, benchmark: 82 },
    { category: 'Risk Management', score: 93, benchmark: 88 },
    { category: 'Response Time', score: 89, benchmark: 80 },
    { category: 'Compliance', score: 97, benchmark: 95 },
    { category: 'Retention Rate', score: 93, benchmark: 90 }
  ],
  '6M': [
    { category: 'Client Satisfaction', score: 90, benchmark: 85 },
    { category: 'Portfolio Performance', score: 85, benchmark: 82 },
    { category: 'Risk Management', score: 92, benchmark: 88 },
    { category: 'Response Time', score: 88, benchmark: 80 },
    { category: 'Compliance', score: 96, benchmark: 95 },
    { category: 'Retention Rate', score: 92, benchmark: 90 }
  ],
  '1Y': [
    { category: 'Client Satisfaction', score: 89, benchmark: 85 },
    { category: 'Portfolio Performance', score: 84, benchmark: 82 },
    { category: 'Risk Management', score: 91, benchmark: 88 },
    { category: 'Response Time', score: 86, benchmark: 80 },
    { category: 'Compliance', score: 96, benchmark: 95 },
    { category: 'Retention Rate', score: 91, benchmark: 90 }
  ]
};

export const highlightCards = [
  { label: 'Tax Losses Harvested', value: 15548.55, type: 'currency' },
  { label: 'Retirement RMD 2025', value: 3000.00, type: 'currency' },
  { label: 'Distribution YTD', value: 2700.00, type: 'currency' },
  { label: 'Total Cash in Hand', value: 50440.92, type: 'currency' },
  { label: 'Avg Disposable Income', value: 95678, type: 'currency' },
  { label: 'Critical Priority Clients', value: 3, type: 'number' },
  { label: 'High Priority Clients', value: 2, type: 'number' }
];

export const agentActions = [
  { 
    name: 'DocWiz',
    label: 'Document Processing', 
    clientsNeedingAction: 8,
    totalClients: 45,
    description: 'Client documents pending review',
    priority: 'high'
  },
  { 
    name: 'MeetWiz',
    label: 'Meeting Preparation', 
    clientsNeedingAction: 12,
    totalClients: 38,
    description: 'Upcoming client meetings',
    priority: 'high'
  },
  { 
    name: 'PortfolioWiz',
    label: 'Risk Rebalancing', 
    clientsNeedingAction: 15,
    totalClients: 67,
    description: 'Portfolios requiring rebalancing',
    priority: 'medium'
  },
  { 
    name: 'Sentiment Rebalancer',
    label: 'Market Sentiment', 
    clientsNeedingAction: 5,
    totalClients: 28,
    description: 'Sentiment-based adjustments',
    priority: 'medium'
  },
  { 
    name: 'Request Rebalancer',
    label: 'Client Requests', 
    clientsNeedingAction: 6,
    totalClients: 22,
    description: 'Pending reallocation requests',
    priority: 'high'
  },
  { 
    name: 'FundAllocator',
    label: 'Fund Allocation', 
    clientsNeedingAction: 4,
    totalClients: 19,
    description: 'Optimal fund allocation analysis',
    priority: 'low'
  }
];

export const eventAlerts = [
  {
    type: 'market',
    title: activeMarketEvent.title,
    description: activeMarketEvent.description,
    impact: 'High',
    time: '2h ago',
    icon: 'trending',
    affectedClients: activeMarketEvent.impactSummary.totalAffected,
    eventId: activeMarketEvent.id
  },
  {
    type: 'milestone',
    title: 'Paramount-Warner Bros. Discovery Merger',
    description: 'In a massive media consolidation, Paramount Skydance Corporation (PSKY) announced a definitive agreement to acquire Warner Bros. Discovery (WBD) for $31 per share in cash, creating a new global media entity. This transaction significantly impacted media sector funds.',
    impact: 'Medium',
    time: '5h ago',
    icon: 'calendar'
  }
];
