export const mockClients = [
  {
    clientId: '15678284',
    name: 'Pai',
    gender: 'Male',
    age: 35,
    cashInHand: 8331.75,
    fum: 99981,
    contribution: 'H',
    disposableIncome: 129451,
    agents: [
      { 
        agentType: 'doc',
        name: 'DocWiz', 
        isCompleted: false, 
        completedSteps: [] 
      }
    ],
    priority: 1,
    priorityLabel: "Critical"
  },
  {
    clientId: '15579706',
    name: 'Curtis',
    gender: 'Female',
    age: 46,
    cashInHand: 2766.00,
    fum: 33192,
    contribution: 'H',
    disposableIncome: 77677,
    agents: [
      { 
        agentType: 'fna',
        name: 'MeetWiz', 
        isCompleted: false, 
        completedSteps: [] 
      }
    ],
    priority: 3,
    priorityLabel: "Medium"
  },
  {
    clientId: '15634602',
    name: 'Hargrave',
    gender: 'Female',
    age: 45,
    cashInHand: 6301.25,
    fum: 577000,
    contribution: 'M',
    disposableIncome: 101349,
    agents: [
      { 
        agentType: 'pwiz',
        name: 'Risk Rebalancing', 
        isCompleted: false,
        completedSteps: [] 
      }
    ],
    priority: 2,
    priorityLabel: "High"
  },
  {
    clientId: '15647311',
    name: 'Hill',
    gender: 'Female',
    age: 41,
    cashInHand: 1760.92,
    fum: 21131,
    contribution: 'L',
    disposableIncome: 112543,
    agents: [
      { 
        agentType: 'pwiz',
        name: 'Risk Rebalancing', 
        isCompleted: false,
        completedSteps: [] 
      }
    ],
    priority: 4,
    priorityLabel: "Low"
  },
  {
    clientId: '15619304',
    name: 'Onio',
    gender: 'Female',
    age: 42,
    cashInHand: 7217.33,
    fum: 86608,
    contribution: 'M',
    disposableIncome: 113932,
    agents: [
      { 
        agentType: 'srb',
        name: 'Sentiment Outlook', 
        isCompleted: false, 
        completedSteps: [] 
      }
    ],
    priority: 1,
    priorityLabel: "Critical"
  }
];

export const mockPortfolioData = {
  totalValue: 1234567,
  todayChange: 5432,
  monthChange: 45678,
  percentChange: 12.5,
  allocation: [
    { name: 'Stocks', value: 45, amount: 555555, color: '#10b981' },
    { name: 'Bonds', value: 25, amount: 308642, color: '#3b82f6' },
    { name: 'Real Estate', value: 20, amount: 246913, color: '#f59e0b' },
    { name: 'Cash', value: 10, amount: 123457, color: '#8b5cf6' }
  ]
};

export const mockActivities = [
  { type: 'buy', asset: 'AAPL', amount: 5000, time: '2h ago', date: new Date() },
  { type: 'sell', asset: 'TSLA', amount: 3200, time: '5h ago', date: new Date() },
  { type: 'buy', asset: 'MSFT', amount: 7500, time: '1d ago', date: new Date() }
];

export const portfolioRebalancingData = {
  client_profile: {
    name: 'Mary Hargrave',
    age: 45,
    risk_tolerance: 'Moderate Growth'
  },
  total_market_value: 577000.35,
  total_cost_basis: 524983.0,
  unrealized_gl: 52017.35,
  unrealized_gl_pct: 9.9,
  current_holdings: [
    { ticker: 'FSPGX', name: 'Fidelity Large Cap Growth Index', asset_class: 'Equity', subclass: 'Core', units: 2420, current_price: 43.37, weight: 18.19, target: 15.0, cost_basis: 62920, market_value: 104955.4, unrealized_gl: 42035.4, exp_ratio: 0.35, total_return_pct: -1.51, monthly_return_pct: -1.79, quarterly_return_pct: -1.79, volatility_pct: '22.47', max_drawdown_pct: '-15.75', volume_trend: 'Normal' },
    { ticker: 'AGTHX', name: 'American Funds Growth Fund of America', asset_class: 'Equity', subclass: 'Aggressive', units: 725, current_price: 76.37, weight: 9.6, target: 10.0, cost_basis: 45675, market_value: 55368.25, unrealized_gl: 9693.25, exp_ratio: 0.59, total_return_pct: 1.69, monthly_return_pct: -2.2, quarterly_return_pct: -2.2, volatility_pct: '23.23', max_drawdown_pct: '-15.3', volume_trend: 'Normal' },
    { ticker: 'AIVSX', name: 'American Funds Investment Company of America', asset_class: 'Equity', subclass: 'Core', units: 862, current_price: 61.35, weight: 9.17, target: 10.0, cost_basis: 47410, market_value: 52883.7, unrealized_gl: 5473.7, exp_ratio: 0.55, total_return_pct: 2.25, monthly_return_pct: -1.67, quarterly_return_pct: -1.67, volatility_pct: '19.82', max_drawdown_pct: '-12.94', volume_trend: 'Normal' },
    { ticker: 'AEPGX', name: 'American Funds EuroPacific Growth', asset_class: 'Equity', subclass: 'Aggressive', units: 1364, current_price: 59.91, weight: 14.16, target: 10.0, cost_basis: 70928, market_value: 81717.24, unrealized_gl: 10789.24, exp_ratio: 0.83, total_return_pct: 4.51, monthly_return_pct: -2.03, quarterly_return_pct: -2.03, volatility_pct: '19.11', max_drawdown_pct: '-14.86', volume_trend: 'Normal' },
    { ticker: 'ANWPX', name: 'American Funds New Perspective', asset_class: 'Equity', subclass: 'Core', units: 510, current_price: 68.83, weight: 6.08, target: 5.0, cost_basis: 22950, market_value: 35103.3, unrealized_gl: 12153.3, exp_ratio: 0.71, total_return_pct: 2.41, monthly_return_pct: -1.85, quarterly_return_pct: -1.85, volatility_pct: '18.36', max_drawdown_pct: '-14.3', volume_trend: 'Normal' },
    { ticker: 'AMECX', name: 'American Funds Income Fund of America', asset_class: 'Equity', subclass: 'Defensive', units: 1923, current_price: 27.02, weight: 9.01, target: 10.0, cost_basis: 46152, market_value: 51959.46, unrealized_gl: 5807.46, exp_ratio: 0.56, total_return_pct: 2.68, monthly_return_pct: -0.84, quarterly_return_pct: -0.84, volatility_pct: '11.65', max_drawdown_pct: '-8.23', volume_trend: 'Normal' },
    { ticker: 'ABNDX', name: 'American Funds Bond Fund of America', asset_class: 'Fixed Income', subclass: 'Bond', units: 9630, current_price: 11.35, weight: 18.94, target: 20.0, cost_basis: 127116, market_value: 109300.5, unrealized_gl: -15897.5, exp_ratio: 0.69, total_return_pct: 1.03, monthly_return_pct: -0.35, quarterly_return_pct: -0.35, volatility_pct: '4.26', max_drawdown_pct: '-2.89', volume_trend: 'Normal' },
    { ticker: 'CWBFX', name: 'American Funds Capital World Bond', asset_class: 'Fixed Income', subclass: 'Bond', units: 3750, current_price: 16.19, weight: 10.52, target: 15.0, cost_basis: 78750, market_value: 60712.5, unrealized_gl: -18037.5, exp_ratio: 0.98, total_return_pct: 0.18, monthly_return_pct: -0.67, quarterly_return_pct: -0.67, volatility_pct: '5.15', max_drawdown_pct: '-3.0', volume_trend: 'Normal' },
    { ticker: 'CASH', name: 'Cash / Money Market', asset_class: 'Cash', subclass: 'Cash', units: 25000, current_price: 1.0, weight: 4.33, target: 5.0, cost_basis: 25000, market_value: 25000.0, unrealized_gl: 0, exp_ratio: 0, total_return_pct: 0.0, monthly_return_pct: 0.0, quarterly_return_pct: 0.0, volatility_pct: '0.0', max_drawdown_pct: '0.0', volume_trend: 'Normal' }
  ],
  ips: {
    objectives: [
      'Provide a sustainable stream of retirement income.',
      'Preserve real capital over time.',
      'Achieve long\u2011term growth of capital above inflation.',
      'Support future spending flexibility and potential legacy goals.'
    ],
    strategy: [
      { asset_class: 'Total Equity', target: 60, range: '55\u201365%', benchmarks: ['MSCI World Index', 'Dow Jones U.S. Select Dividend Index', 'MSCI ACWI ex-USA Index', 'Russell 1000 Growth Index', 'S&P 500 Index', 'MSCI EAFE Index'] },
      { asset_class: 'Fixed Income (Bonds)', target: 35, range: '30\u201340%', benchmarks: ['Bloomberg U.S. Aggregate Bond Index'] },
      { asset_class: 'Cash & Equivalents', target: 5, range: '2\u201310%', benchmarks: ['ICE BofA 3-Month U.S. Treasury Bill Index'] }
    ],
    mandates: [
      'Maintain at least three core asset classes at all times: equities, bonds, cash.',
      'No single fund should exceed 20% of total portfolio value.',
      'No single equity sector should exceed \u226430% of total equity.',
      'Weighted average expense ratio must remain \u2264 1.0%.',
      'Maintain international/global exposure \u2264 15%, with max drift to 20%.',
      'Rebalance when an asset class deviates by \u22655% from its target.'
    ],
    constraints: [
      'Must remain aligned with moderate\u2011risk profile.',
      'No derivatives, except those used inside pooled funds strictly for hedging or efficiency.',
      'No illiquid assets, private investments, or structured products unless via liquid diversified vehicles.',
      'Maintain liquidity for ongoing withdrawals.',
      '5% cash for short\u2011term needs, bonds serve as secondary liquidity source.'
    ]
  },
  onboarding_documents: [
    {
      title: 'Consent Letter',
      description: 'Pre-filled authorization form for portfolio rebalancing with recommended changes.',
      link: '#/documents/rebalancing-consent'
    }
  ]
};

export const riskAnalysisData = {
  asset_drift: [
    { class: 'Equity', actual: 66.2, target: 60.0, diff: 6.2, band: '55–65%', status: 'BREACH' },
    { class: 'Fixed Income', actual: 29.46, target: 35.0, diff: -5.54, band: '30–40%', status: 'BREACH' },
    { class: 'Cash', actual: 4.33, target: 5.0, diff: -0.67, band: '2–10%', status: 'IN BAND' }
  ],
  fund_drift: [
    { ticker: 'FSPGX', actual: 18.19, target: 15.0, drift: 3.19 },
    { ticker: 'AGTHX', actual: 9.6, target: 10.0, drift: -0.4 },
    { ticker: 'AIVSX', actual: 9.17, target: 10.0, drift: -0.83 },
    { ticker: 'AEPGX', actual: 14.16, target: 10.0, drift: 4.16 },
    { ticker: 'ANWPX', actual: 6.08, target: 5.0, drift: 1.08 },
    { ticker: 'AMECX', actual: 9.01, target: 10.0, drift: -0.99 },
    { ticker: 'ABNDX', actual: 18.94, target: 20.0, drift: -1.06 },
    { ticker: 'CWBFX', actual: 10.52, target: 15.0, drift: -4.48 },
    { ticker: 'CASH', actual: 4.33, target: 5.0, drift: -0.67 }
  ],
  volatility: [
    { tier: 'High', fund: 'AGTHX', std_dev: '23.23%', var_95: '-1.91%', weight: '9.6%', risk_contrib: '2.23%' },
    { tier: 'High', fund: 'FSPGX', std_dev: '22.47%', var_95: '-1.88%', weight: '18.19%', risk_contrib: '4.09%' },
    { tier: 'Moderate', fund: 'AIVSX', std_dev: '19.82%', var_95: '-1.43%', weight: '9.17%', risk_contrib: '1.82%' },
    { tier: 'Moderate', fund: 'AEPGX', std_dev: '19.11%', var_95: '-1.36%', weight: '14.16%', risk_contrib: '2.71%' },
    { tier: 'Moderate', fund: 'ANWPX', std_dev: '18.36%', var_95: '-1.46%', weight: '6.08%', risk_contrib: '1.12%' },
    { tier: 'Low', fund: 'AMECX', std_dev: '11.65%', var_95: '-0.72%', weight: '9.01%', risk_contrib: '1.05%' },
    { tier: 'Low', fund: 'CWBFX', std_dev: '5.15%', var_95: '-0.49%', weight: '10.52%', risk_contrib: '0.54%' },
    { tier: 'Low', fund: 'ABNDX', std_dev: '4.26%', var_95: '-0.44%', weight: '18.94%', risk_contrib: '0.81%' }
  ],
  beta_exposure: [
    { fund: 'FSPGX', beta: 1.15, weight: '18.19%', contribution: 0.209 },
    { fund: 'AGTHX', beta: 1.05, weight: '9.6%', contribution: 0.101 },
    { fund: 'AIVSX', beta: 0.89, weight: '9.17%', contribution: 0.082 },
    { fund: 'ANWPX', beta: 0.86, weight: '6.08%', contribution: 0.052 },
    { fund: 'AEPGX', beta: 0.65, weight: '14.16%', contribution: 0.092 },
    { fund: 'AMECX', beta: 0.42, weight: '9.01%', contribution: 0.038 },
    { fund: 'ABNDX', beta: -0.02, weight: '18.94%', contribution: -0.004 },
    { fund: 'CWBFX', beta: -0.04, weight: '10.52%', contribution: -0.004 }
  ],
  portfolio_beta: 0.87,
  target_beta: 0.75,
  drawdown_risk: [
    { fund: 'FSPGX', max_dd: '-15.75%', var_95: '-1.88%', note: 'Worst drawdown; 5% chance of losing \u22651.88% daily (~$1,973)' },
    { fund: 'AGTHX', max_dd: '-15.3%', var_95: '-1.91%', note: 'Highest daily VaR; aggressive growth most exposed' },
    { fund: 'AEPGX', max_dd: '-14.86%', var_95: '-1.36%', note: 'International diversification provides modest buffer' },
    { fund: 'ANWPX', max_dd: '-14.3%', var_95: '-1.46%', note: 'Growth-oriented but better downside protection' },
    { fund: 'AIVSX', max_dd: '-12.94%', var_95: '-1.43%', note: 'Value tilt reduces drawdown severity' },
    { fund: 'AMECX', max_dd: '-8.23%', var_95: '-0.72%', note: 'Defensive equity\u2014half the drawdown of growth peers' },
    { fund: 'CWBFX', max_dd: '-3.0%', var_95: '-0.49%', note: 'Convertible bonds offer equity upside with bond floor' },
    { fund: 'ABNDX', max_dd: '-2.89%', var_95: '-0.44%', note: 'Lowest risk; core fixed income anchor' }
  ],
  sector_concentration: [
    { fund: 'FSPGX', it_pct: '46.5%', eq_weight: '27.5%', it_contrib: '12.79%' },
    { fund: 'AGTHX', it_pct: '33.2%', eq_weight: '14.5%', it_contrib: '4.81%' },
    { fund: 'AIVSX', it_pct: '28.2%', eq_weight: '13.8%', it_contrib: '3.89%' },
    { fund: 'AEPGX', it_pct: '22.1%', eq_weight: '21.4%', it_contrib: '4.73%' },
    { fund: 'ANWPX', it_pct: '24.8%', eq_weight: '9.2%', it_contrib: '2.28%' },
    { fund: 'AMECX', it_pct: '18.5%', eq_weight: '13.6%', it_contrib: '2.52%' }
  ],
  total_it_concentration: 31.02,
  underlying_stocks: [
    { stock: 'NVIDIA (NVDA)', sector: 'Tech', weight_pct: 12.7, return_1y_pct: 58.0, beta: 1.85, volatility: 0.52, market_cap: '3.2T', pe_ratio: 65.8, risk_tier: 'High' },
    { stock: 'Apple (AAPL)', sector: 'Tech', weight_pct: 10.8, return_1y_pct: 18.0, beta: 1.25, volatility: 0.32, market_cap: '3.4T', pe_ratio: 29.2, risk_tier: 'Moderate' },
    { stock: 'Microsoft (MSFT)', sector: 'Tech', weight_pct: 9.2, return_1y_pct: 5.0, beta: 0.95, volatility: 0.28, market_cap: '3.1T', pe_ratio: 34.1, risk_tier: 'Moderate' },
    { stock: 'Amazon (AMZN)', sector: 'Cyclical', weight_pct: 4.8, return_1y_pct: 5.0, beta: 1.35, volatility: 0.38, market_cap: '1.8T', pe_ratio: 42.7, risk_tier: 'High' },
    { stock: 'Broadcom (AVGO)', sector: 'Tech', weight_pct: 4.6, return_1y_pct: 73.0, beta: 1.65, volatility: 0.48, market_cap: '680B', pe_ratio: 28.9, risk_tier: 'High' },
    { stock: 'Meta (META)', sector: 'Comm', weight_pct: 4.0, return_1y_pct: 3.0, beta: 1.28, volatility: 0.42, market_cap: '1.3T', pe_ratio: 25.8, risk_tier: 'High' },
    { stock: 'Alphabet A (GOOGL)', sector: 'Comm', weight_pct: 3.8, return_1y_pct: 82.0, beta: 1.12, volatility: 0.34, market_cap: '2.1T', pe_ratio: 23.4, risk_tier: 'Moderate' },
    { stock: 'Tesla (TSLA)', sector: 'Cyclical', weight_pct: 3.7, return_1y_pct: 59.0, beta: 2.15, volatility: 0.68, market_cap: '800B', pe_ratio: 88.1, risk_tier: 'Very High' },
    { stock: 'Alphabet C (GOOG)', sector: 'Comm', weight_pct: 3.1, return_1y_pct: 79.0, beta: 1.12, volatility: 0.34, market_cap: '2.1T', pe_ratio: 23.4, risk_tier: 'Moderate' },
    { stock: 'Eli Lilly (LLY)', sector: 'Health', weight_pct: 2.8, return_1y_pct: 19.0, beta: 0.85, volatility: 0.29, market_cap: '850B', pe_ratio: 58.2, risk_tier: 'Low' }
  ],
  risk_dashboard: [
    { metric: 'Portfolio Std Dev', current: '19.65%', target: '~16.5%', variance: '+3.15pp', action: 'REDUCE via FSPGX sale' },
    { metric: 'Portfolio Beta', current: '0.87', target: '0.75', variance: '+0.12', action: 'REDUCE via equity trim' },
    { metric: 'Daily VaR 95%', current: '-$8,194', target: '-$6,809', variance: '+$1,385', action: 'REDUCE via rebalance' },
    { metric: 'Max Drawdown Exp.', current: '-13.95%', target: '-11.5%', variance: '+2.45pp', action: 'REDUCE via diversification' },
    { metric: 'IT Sector (Equity)', current: '31.0%', target: '\u226430%', variance: '+1.0pp', action: 'Check 4: FAIL' },
    { metric: 'Aggressive Sleeve', current: '35.89%', target: '\u226430%', variance: '+5.89pp', action: 'IPS BREACH' }
  ],
  insights: {
    drift: [
      'Equity exposure at 66.2% exceeds the IPS target, while fixed income remains underweight at 29.46%',
      'AEPGX (+4.16%) and CWBFX (−4.48%) are the largest fund-level drifts, both breaching the ±4% threshold'
    ],
    volatility: [
      'FSPGX and AGTHX show highest volatility (22–23% std dev) contributing most to portfolio risk',
      'High-tier funds contribute 6.32% combined risk despite only 27.79% weight',
      'Risk contribution is concentrated in growth-oriented equity positions'
    ],
    beta: [
      'Portfolio beta (0.87) exceeds target (0.75), indicating higher market sensitivity',
      'FSPGX contributes highest beta exposure (0.209) due to growth focus and large weight',
      'Bond funds show negative beta correlation, acting as portfolio stabilizers'
    ],
    dashboard: [
      'Multiple IPS breaches: IT sector >30%, Aggressive sleeve >30% of total portfolio',
      'All risk metrics point to need for immediate rebalancing to restore IPS compliance',
      'FSPGX reduction is critical action item across multiple risk dimensions'
    ],
    stocks: [
      'Technology sector dominance at 37.3% breaches diversification guidelines',
      'Top 3 high-beta stocks (TSLA, NVDA, AVGO) represent 20.9% of portfolio',
      'Limited defensive positioning with only LLY providing sub-1.0 beta exposure'
    ],
    sector: [
      'IT sector represents 31.0% of equity allocation, breaching 30% IPS limit',
      'FSPGX contributes 12.79% to IT exposure due to 46.5% internal IT weighting',
      'Rebalancing should address sector concentration alongside asset class drift'
    ],
    drawdown: [
      'FSPGX shows worst historical drawdown (−15.75%) with highest daily VaR risk',
      'Growth funds (AGTHX, AEPGX) exhibit 14–15% maximum drawdowns during stress periods',
      'Bond funds provide downside protection with <3% maximum drawdowns'
    ],
    sentiment: [
      'Equity-oriented funds carry positive news momentum, supported by AI infrastructure themes',
      'AMECX, ABNDX, CWBFX flagged negative from macro headwinds and AI disruption pressures',
      'CWBFX replacement particularly supported given both negative sentiment and high expense ratio'
    ]
  },
  risk_summary: [
    { title: 'Portfolio drifted beyond target allocation', detail: 'Equity exposure at 66.2% exceeds the IPS target of 60%, while fixed income remains underweight at 29.46% against a 35% target. Growth-fund outperformance is the primary driver, pushing overall portfolio risk beyond policy limits.', type: 'ips' },
    { title: 'Equities overweight increasing market sensitivity', detail: 'Stocks now dominate the portfolio while bonds and cash (~4%) are under-allocated, reducing downside protection and increasing volatility.', type: 'risk' },
    { title: 'Beta exposure exceeds moderate-risk target', detail: 'Portfolio beta of 0.87 overshoots the 0.75 target for a 60% equity allocation, meaning the portfolio moves more aggressively with the market than the risk profile warrants.', type: 'risk' },
    { title: 'Daily tail-risk exceeds acceptable threshold', detail: 'Portfolio VaR indicates larger potential daily loss than policy permits, signaling excess risk now. Rebalancing reduces daily potential loss by approximately $1,385.', type: 'risk' },
    { title: 'Sector concentration slightly exceeds limits', detail: 'IT exposure at 31% slightly exceeds the 30% IPS cap, driven primarily by FSPGX (46.5% IT, contributing 12.79% to equity IT) alongside AGTHX and AEPGX. Reduce tech weight via FSPGX trim to restore compliance.', type: 'ips' },
    { title: 'Portfolio benefited from AI/semiconductor stock exposure', detail: 'AI beneficiaries (NVDA, AVGO) showed strong momentum with over 58% gains while tech giants (MSFT, AMZN, META) lagged with single digits.', type: 'risk' },
    { title: 'Drawdown risk concentrated in growth funds', detail: 'FSPGX (−15.75%) and AGTHX (−15.3%) carry the deepest max drawdowns, while defensive equity (AMECX) limits losses to −8.23%. Bond funds anchor the portfolio with <3% drawdowns.', type: 'risk' },
    { title: 'Negative market signals on select holdings', detail: 'AMECX (−0.475), ABNDX (−0.58), and CWBFX (−0.575) carry negative sentiment driven by JPMorgan AI loan repricing, ESMA high-risk EU outlook, and AI disruption headlines. CWBFX replacement is supported by both weak sentiment and its high 0.98% expense ratio.', type: 'sentiment' }
  ]
};

export const investmentProposalData = {
  investment_proposal: {
    client_profile: { 
      name: 'Sam Pai',
      net_worth: 99981,
      annual_income: 129451,
      monthly_expenses: 5000,
      investment_experience: 'Moderate',
      risk_tolerance: 'Moderate'
    },
    meeting_notes: [],
    moderate_model_tickers: [],
    risk_model_portfolios: {
      'Moderate': { objective: 'Balanced growth' },
      'Moderately Aggressive': { objective: 'Growth focused' }
    },
    moderate_portfolio_allocation: {},
    onboarding_documents: []
  }
};

export const chatResponseEngine = {
  processMessage: (msg) => ({ agentResponse: 'Processing...', cardType: null, data: {} })
};


export const rebalancingData = {
  detailed_news_data: {
    'FSPGX': {
      total_articles: 3,
      sentiment_summary: {
        avg_polarity: 0.136,
        dominant_sentiment: 'positive',
        sentiment_distribution: { positive: 2, negative: 0, neutral: 1 }
      },
      articles: [
        { headline: 'S&P 500 Earnings: Tech Sector Revisions Still Robustly Positive', summary: 'As AI filters through the tech sector sub-sectors, well-above average growth is being seen.', sentiment_analysis: { sentiment: 'Positive', market_impact: 'High' }, formatted_date: '2026-03-12', url: '#' },
        { headline: 'Large Cap Growth Funds See Steady Inflows', summary: 'Investors continue to favor large cap growth strategies amid strong earnings momentum.', sentiment_analysis: { sentiment: 'Positive', market_impact: 'Medium' }, formatted_date: '2026-03-10', url: '#' }
      ]
    },
    'AGTHX': {
      total_articles: 4,
      sentiment_summary: {
        avg_polarity: 0.32,
        dominant_sentiment: 'positive',
        sentiment_distribution: { positive: 3, negative: 0, neutral: 1 }
      },
      articles: [
        { headline: 'American Funds Growth Fund Posts Strong Q1 Returns', summary: 'Growth Fund of America outperforms benchmark driven by AI infrastructure and healthcare holdings.', sentiment_analysis: { sentiment: 'Positive', market_impact: 'High' }, formatted_date: '2026-03-11', url: '#' },
        { headline: 'Medicare Drug Access Expansion Boosts Healthcare Holdings', summary: 'Policy changes benefit several top holdings in growth-oriented funds.', sentiment_analysis: { sentiment: 'Positive', market_impact: 'Medium' }, formatted_date: '2026-03-09', url: '#' }
      ]
    },
    'AIVSX': {
      total_articles: 3,
      sentiment_summary: {
        avg_polarity: 0.311,
        dominant_sentiment: 'positive',
        sentiment_distribution: { positive: 2, negative: 0, neutral: 1 }
      },
      articles: [
        { headline: 'Value Stocks Show Resilience Amid Market Volatility', summary: 'Investment Company of America benefits from value tilt as growth rotation pauses.', sentiment_analysis: { sentiment: 'Positive', market_impact: 'Medium' }, formatted_date: '2026-03-10', url: '#' }
      ]
    },
    'AEPGX': {
      total_articles: 2,
      sentiment_summary: {
        avg_polarity: 0.0,
        dominant_sentiment: 'positive',
        sentiment_distribution: { positive: 0, negative: 0, neutral: 2 }
      },
      articles: [
        { headline: 'European Markets Flat as ECB Holds Rates Steady', summary: 'EuroPacific Growth fund sees mixed signals from European and Asian markets.', sentiment_analysis: { sentiment: 'Neutral', market_impact: 'Medium' }, formatted_date: '2026-03-11', url: '#' }
      ]
    },
    'ANWPX': {
      total_articles: 3,
      sentiment_summary: {
        avg_polarity: 0.338,
        dominant_sentiment: 'positive',
        sentiment_distribution: { positive: 2, negative: 0, neutral: 1 }
      },
      articles: [
        { headline: 'Global Diversification Pays Off for New Perspective Fund', summary: 'Balanced global exposure delivers steady returns with lower drawdown than pure US growth.', sentiment_analysis: { sentiment: 'Positive', market_impact: 'Medium' }, formatted_date: '2026-03-10', url: '#' }
      ]
    },
    'AMECX': {
      total_articles: 6,
      sentiment_summary: {
        avg_polarity: -0.475,
        dominant_sentiment: 'negative',
        sentiment_distribution: { positive: 0, negative: 4, neutral: 2 }
      },
      articles: [
        { headline: 'Why The Narrative Around Alarm.com (ALRM) Is Shifting As Analysts Recut Valuation Targets', summary: 'Analysts are revising targets downward amid shifting market dynamics.', sentiment_analysis: { sentiment: 'Negative', market_impact: 'Medium' }, formatted_date: '2026-03-12', url: 'https://finnhub.io/api/news?id=553217877f3b6819188f7926a81d5d7a8655c9779dc1263476c89bdff6257f00' },
        { headline: 'JPMorgan Reprices AI Exposed Software Loans While Shares Screen As Undervalued', summary: 'JPMorgan repricing AI-exposed software loans raises concerns for income fund holdings.', sentiment_analysis: { sentiment: 'Negative', market_impact: 'Medium' }, formatted_date: '2026-03-12', url: 'https://finnhub.io/api/news?id=d821e67ef77af18bd4b5c05a9bf4a080df5579a2b86082a7833b31a4a3617585' },
        { headline: 'Atlassian CEO Cites AI Shift in Latest Round of Job Cuts', summary: 'AI-driven restructuring hits tech workforce, impacting fund sentiment.', sentiment_analysis: { sentiment: 'Negative', market_impact: 'High' }, formatted_date: '2026-03-12', url: 'https://finance.yahoo.com/news/atlassian-ceo-cites-ai-shift-220933887.html' },
        { headline: 'Samsung Display CEO Warns of Higher Costs Amid Iran War Oil Shock', summary: 'Rising costs from geopolitical tensions impact fund holdings.', sentiment_analysis: { sentiment: 'Negative', market_impact: 'Medium' }, formatted_date: '2026-03-12', url: 'https://finance.yahoo.com/news/samsung-display-ceo-warns-higher-025148177.html' }
      ]
    },
    'ABNDX': {
      total_articles: 4,
      sentiment_summary: {
        avg_polarity: -0.58,
        dominant_sentiment: 'negative',
        sentiment_distribution: { positive: 0, negative: 3, neutral: 1 }
      },
      articles: [
        { headline: 'EU Financial Markets Enter 2026 Amid High Risk Environment', summary: 'ESMA warns of elevated risks across European financial markets heading into 2026.', sentiment_analysis: { sentiment: 'Negative', market_impact: 'High' }, formatted_date: '2026-01-15', url: 'https://www.esma.europa.eu/press-news/esma-news/eu-financial-markets-enter-2026-amid-high-risk-environment' },
        { headline: 'AI Concerns Pummel European Software Stocks', summary: 'AI disruption pressures weigh on European bond and software markets.', sentiment_analysis: { sentiment: 'Negative', market_impact: 'High' }, formatted_date: '2026-02-03', url: 'https://www.reuters.com/business/media-telecom/ai-concerns-pummel-european-software-stocks-2026-02-03/' }
      ]
    },
    'CWBFX': {
      total_articles: 4,
      sentiment_summary: {
        avg_polarity: -0.575,
        dominant_sentiment: 'negative',
        sentiment_distribution: { positive: 0, negative: 3, neutral: 1 }
      },
      articles: [
        { headline: 'EU Financial Markets Enter 2026 Amid High Risk Environment', summary: 'ESMA warns of elevated risks across European financial markets heading into 2026.', sentiment_analysis: { sentiment: 'Negative', market_impact: 'High' }, formatted_date: '2026-01-15', url: 'https://www.esma.europa.eu/press-news/esma-news/eu-financial-markets-enter-2026-amid-high-risk-environment' },
        { headline: 'AI Concerns Pummel European Software Stocks', summary: 'AI disruption pressures weigh on European bond and software markets.', sentiment_analysis: { sentiment: 'Negative', market_impact: 'High' }, formatted_date: '2026-02-03', url: 'https://www.reuters.com/business/media-telecom/ai-concerns-pummel-european-software-stocks-2026-02-03/' }
      ]
    }
  }
};
