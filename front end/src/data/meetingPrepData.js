export const CLIENT_DATA = {
  'C005': {
    name: 'David Thompson', tier: 'Premium', riskProfile: 'Moderate Growth',
    lastInteraction: 'Onboarded Feb 14, 2026', sentiment: 'Anxious',
    meetingGoal: 'Cash Deployment, Compliance Review & Behavioral Reassurance', meetingTime: '9:00 AM Today',
    aum: '$1,590,000', age: 54, riskStatus: 'CRITICAL',
    customerId: 'C005', householdId: 'HH005', accountId: 'A005',
    clientType: 'Accumulation – Brokerage', customerType: 'Individual',
    segment: 'High Net Worth', advicePosture: 'Advisory',
    adviceRelationshipType: 'ADVISORY', advisorId: 'ADV001',
    kycStatus: 'Verified', riskProfileId: 'RP_005', lifecycleStage: 'Premium',
    onboardingDate: '2026-02-14', lifecycleEffectiveDate: '2026-02-14',
    dob: '1971-09-30', gender: 'M',
    email: 'd.thompson@email.com', phone: '+1-555-010-5678',
    address: '200 Tech Parkway, San Jose, CA 95110',
    preferredChannel: 'Phone', languagePreference: 'EN',
    regBIOptIn: 'Yes', disclosureMethod: 'Electronic',
    privacyClassification: 'Standard',
    consentMarketing: true, consentAdvice: true, consentThirdParty: false,
    nbaTrigger: 'High idle cash (22% vs 10% target, >$350K) combined with anxious sentiment creates immediate performance, behavioral, and compliance risk — confirming ideal trigger for proactive advisor engagement.',
    profileIntro: 'New HNW client onboarded Feb 2026 — still in early trust-building phase. Tech professional based in San Jose, high income, accumulation-focused. Exhibits high volatility reactivity and tends to defer decisions under market stress. Prefers Phone contact and responds better to structured, data-backed reassurance than open-ended discussion.',
    nbcScript: '"David, I want to start by acknowledging that your caution over the last year has been understandable given the volatility we\'ve seen. The gap we\'re seeing in your overall results isn\'t coming from poor investments or bad timing but it\'s coming from the fact that about 22% of your portfolio is still sitting in cash. That cash gave you comfort, but it also quietly worked against your long-term growth goal and moved the portfolio away from the plan we agreed on together. I would like to walk you through exactly what this means using a phased, structured approach so your money is doing the job it\'s meant to do while still respecting how you feel about market swings. Let\'s focus on getting you back in line with your strategy in a way that feels controlled and thoughtful, rather than reactive."',
  },
  'C012': {
    name: 'Kevin Smyth', tier: 'Standard', riskProfile: 'Moderate',
    lastInteraction: 'Q4 Review (2 months ago)', sentiment: 'Risk-Averse',
    meetingGoal: 'Cash Deployment Review & Behavioral Alignment', meetingTime: '10:00 AM Today',
    aum: '$850,000', age: 44, riskStatus: 'MEDIUM',
    customerId: 'C012', householdId: 'HH012', accountId: 'A012',
    clientType: 'Accumulation – Brokerage', customerType: 'Individual',
    segment: 'Mass Affluent', advicePosture: 'Advisory',
    adviceRelationshipType: 'ADVISORY', advisorId: 'ADV001',
    kycStatus: 'Verified', riskProfileId: 'RP_012', lifecycleStage: 'Growth',
    onboardingDate: '2023-06-10', lifecycleEffectiveDate: '2023-06-10',
    dob: '1980-03-15', gender: 'M',
    email: 'k.smyth@email.com', phone: '+1-555-012-3456',
    address: '45 Maple Street, Austin, TX 78701',
    preferredChannel: 'Email', languagePreference: 'EN',
    regBIOptIn: 'Yes', disclosureMethod: 'Electronic',
    privacyClassification: 'Standard',
    consentMarketing: true, consentAdvice: true, consentThirdParty: false,
    nbaTrigger: 'Defensive bias with 40% cash vs 20% IPS target is materially limiting growth — behavioral framing and education needed to unlock deployment.',
    profileIntro: 'Mass Affluent client, accumulation-focused with a persistent defensive bias. Tends to hold excess cash during uncertainty, prioritising comfort over growth. Responds well to education-led conversations and data-backed framing. Prefers Email contact.',
    nbcScript: '"Kevin, I want to take a moment to show you something that I think will be useful. Your investments — the funds we\'ve chosen together — have actually performed really well over the past year, with returns between 19 and 32 percent. The challenge isn\'t the quality of your portfolio. It\'s that 40% of your money is sitting in cash, which is earning around 4.8% while the rest of your portfolio is doing significantly better. That gap is quietly working against the plan we set up together. I\'m not suggesting we make any sudden moves. What I\'d like to propose is a gradual, structured approach — moving a small portion of that cash into your existing holdings over the next six months. This way, we stay well within your comfort zone while making sure your money is actually working toward your goals."',
  },
  '15634602': {
    name: 'Mary Hargrave', tier: 'Platinum', riskProfile: 'Moderate Growth',
    lastInteraction: 'Q1 Review (3 months ago)', sentiment: 'Anxious about market volatility',
    meetingGoal: 'Portfolio Realignment & Strategy Reassurance', meetingTime: '10:00 AM Today',
    aum: '$577,000', age: 45,
  },
  '15600001': {
    name: 'Alex Morgan', tier: 'Gold', riskProfile: 'Moderate Growth',
    lastInteraction: 'February 15, 2026', sentiment: 'Cautious but improving',
    meetingGoal: 'Reassess portfolio drift and evaluate rebalancing approaches', meetingTime: '10:00 AM Today',
    aum: '$500,000', age: 42,
  },
  '15740900': {
    name: 'Jean Williams', tier: 'Gold', riskProfile: 'Conservative',
    lastInteraction: 'Q4 Review (2 months ago)', sentiment: 'Focused on income stability',
    meetingGoal: 'Investment Planning & Income Strategy', meetingTime: '2:30 PM Today',
    aum: '$52,429', age: 34,
  },
  '15623828': {
    name: 'Marcus Thompson', tier: 'Silver', riskProfile: 'Low Risk',
    lastInteraction: 'Q3 Review (4 months ago)', sentiment: 'Capital preservation focused',
    meetingGoal: 'Portfolio Review & Allocation Adjustment', meetingTime: '4:00 PM Today',
    aum: '$41,185', age: 30,
  },
};

export const HOLDINGS_DATA = {
  'C005': {
    totalValue: '$1,590,000',
    costBasis: '$1,420,000',
    unrealizedGL: '$170,000',
    benchmark: 'BM_MSCI_WORLD',
    currency: 'USD',
    allocation: [
      { asset: 'Equity', pct: 78, value: '$1,240K', target: 90, diff: -12, status: 'underweight' },
      { asset: 'Cash',   pct: 22, value: '$350K',   target: 10, diff: +12, status: 'overweight' },
    ],
    performance: [
      { fund: 'RAEFX', type: 'US Large-Cap Growth (Active)',  weight: 9,  y2024: '27.7%', y2025: '2.7%',  trend: 'Declining',  remarks: 'Active Growth Core' },
      { fund: 'RGAHX', type: 'US Large-Cap Growth (Active)',  weight: 8,  y2024: '29.1%', y2025: '2.5%',  trend: 'Declining',  remarks: 'Top 1Y Performer' },
      { fund: 'RMFHX', type: 'US Large-Cap Value/Income',     weight: 7,  y2024: '19.9%', y2025: '3.0%',  trend: 'Stable',     remarks: 'Value Anchor' },
      { fund: 'RIGIX', type: 'Intl Equity (Active)',           weight: 6,  y2024: '32.9%', y2025: '10.7%', trend: 'Growing',    remarks: 'Intl Outperformer' },
      { fund: 'RIDHX', type: 'Multi-Asset Income',             weight: 7,  y2024: '19.9%', y2025: '6.1%',  trend: 'Improving',  remarks: 'Income Diversifier' },
      { fund: 'RGBHX', type: 'Global Balanced',                weight: 5,  y2024: '19.9%', y2025: '5.5%',  trend: 'Improving',  remarks: 'Global Balance' },
      { fund: 'RLEFX', type: 'Moderate Allocation',            weight: 8,  y2024: '26.4%', y2025: '6.0%',  trend: 'Improving',  remarks: 'Allocation Core' },
      { fund: 'FSPGX', type: 'US Large-Cap Growth (Index)',    weight: 6,  y2024: '32.5%', y2025: '4.6%',  trend: 'Declining',  remarks: 'Index Growth' },
      { fund: 'VFIAX', type: 'US Large-Cap Blend (Index)',     weight: 10, y2024: '32.3%', y2025: '8.5%',  trend: 'Improving',  remarks: 'S&P 500 Core' },
      { fund: 'VTIAX', type: 'Intl Equity (Index)',             weight: 6,  y2024: '~19%',  y2025: '~7.5%', trend: 'Growing',    remarks: 'Intl Index' },
    ],
    returns: [
      { label: '1D',             value: '+0.25%' },
      { label: 'WTD',            value: '+0.80%' },
      { label: 'MTD',            value: '+1.95%' },
      { label: 'QTD',            value: '+3.50%' },
      { label: 'YTD',            value: '+3.50%' },
      { label: '1-Year',         value: '+11.20%' },
      { label: 'Since Inception',value: '+11.20%' },
    ],
    keyInsight: [
      'Most equity and balanced holdings delivered 20–32% 1-year returns, yet 22% of the portfolio sat in cash — materially diluting overall outcomes.',
      'Strong fund performance vs anxious client sentiment reveals a clear mismatch — strategic rebalancing out of excess cash is suitability-critical, not optional.',
    ],
  },
  'C012': {
    totalValue: '$850,000',
    costBasis: '$780,000',
    unrealizedGL: '$70,000',
    benchmark: 'S&P 500 / Agg Bond',
    currency: 'USD',
    allocation: [
      { asset: 'Equity', pct: 60, value: '$510K', target: 80, diff: -20, status: 'underweight' },
      { asset: 'Cash',   pct: 40, value: '$340K', target: 20, diff: +20, status: 'overweight' },
    ],
    performance: [
      { fund: 'VFIAX', type: 'US Large-Cap Blend (Index)',   weight: 18, y2024: '32.3%', y2025: '8.5%',  trend: 'Improving', remarks: 'Core Equity Anchor' },
      { fund: 'FSPGX', type: 'US Large-Cap Growth (Index)',  weight: 14, y2024: '32.5%', y2025: '4.6%',  trend: 'Declining', remarks: 'Growth Exposure' },
      { fund: 'VTIAX', type: 'Intl Equity (Index)',           weight: 10, y2024: '~19%',  y2025: '~7.5%', trend: 'Growing',   remarks: 'Intl Diversifier' },
      { fund: 'VXUS',  type: 'Total Intl Stock (Index)',      weight: 8,  y2024: '5.1%',  y2025: '22.4%', trend: 'Growing',   remarks: 'EM & Developed Upside' },
      { fund: 'VYM',   type: 'High Dividend Yield (Equity)',  weight: 6,  y2024: '17.8%', y2025: '5.2%',  trend: 'Stable',    remarks: 'Income Anchor' },
      { fund: 'VWIAX', type: 'Conservative Allocation',       weight: 8,  y2024: '~11%',  y2025: '~3.5%', trend: 'Stable',    remarks: 'Defensive Drag' },
      { fund: 'FBALX', type: 'Balanced',                      weight: 8,  y2024: '~19%',  y2025: '~5.5%', trend: 'Improving', remarks: 'Balanced Buffer' },
      { fund: 'VBTLX', type: 'Total Bond Market (Index)',     weight: 4,  y2024: '4.3%',  y2025: '5.1%',  trend: 'Improving', remarks: 'Defensive Buffer' },
      { fund: 'QQQ',   type: 'US Large-Cap Tech (Index)',     weight: 4,  y2024: '26.6%', y2025: '4.2%',  trend: 'Declining', remarks: 'Tech Satellite' },
      { fund: 'MMKT',  type: 'Money Market / Cash',           weight: 20, y2024: '5.10%', y2025: '4.80%', trend: 'Declining', remarks: 'Excess Cash — Deploy' },
    ],
    returns: [
      { label: '1D',             value: '+0.18%' },
      { label: 'WTD',            value: '+0.55%' },
      { label: 'MTD',            value: '+1.20%' },
      { label: 'QTD',            value: '+2.40%' },
      { label: 'YTD',            value: '+2.40%' },
      { label: '1-Year',         value: '+8.20%' },
      { label: 'Since Inception',value: '+8.97%' },
    ],
    keyInsight: [
      'Kevin\'s equity funds (VFIAX, FSPGX, VXUS) returned 19–32% over the past year — the portfolio is working, but 40% cash means nearly half his wealth is not participating.',
      'The cost of inaction is measurable: $340K in MMKT at 4.8% vs equity average of ~19% represents approximately $48K in foregone annual returns.',
    ],
  },
  '15600001': {
    totalValue: '$502,000',
    costBasis: '$450,000',
    unrealizedGL: '$52,000',
    allocation: [
      { asset: 'Equity', pct: 52, value: '$260K', target: 60, diff: -8, status: 'underweight' },
      { asset: 'Bonds',  pct: 43, value: '$215K', target: 35, diff: +8, status: 'overweight' },
      { asset: 'Cash',   pct: 5,  value: '$25K',  target: 5,  diff: 0,  status: 'on-target' },
    ],
    performance: [
      { fund: 'FSPGX', type: 'US Large-Cap Growth (Equity)', weight: 20, y2024: '33.26%', y2025: '18.53%', trend: 'Declining', remarks: 'Concentration Risk' },
      { fund: 'AGTHX', type: 'US Growth (Equity)',            weight: 18, y2024: '28.43%', y2025: '19.93%', trend: 'Declining', remarks: '' },
      { fund: 'ABNDX', type: 'Core Bond',                     weight: 18, y2024: '4.51%',  y2025: '6.71%',  trend: 'Improving', remarks: '' },
      { fund: 'AEPGX', type: 'International Equity',          weight: 17, y2024: '4.66%',  y2025: '28.72%', trend: 'Growing',   remarks: 'Highly Volatile Diversification Opportunity' },
      { fund: 'CWBFX', type: 'Global Bond',                   weight: 15, y2024: '3.42%',  y2025: '5.62%',  trend: 'Improving', remarks: 'Defensive Drag' },
      { fund: 'AMECX', type: 'Income/Balanced',               weight: 10, y2024: '9.52%',  y2025: '12.55%', trend: 'Improving', remarks: 'Excess Stability' },
      { fund: 'AIVSX', type: 'US Core Equity',                weight: 7,  y2024: '18.57%', y2025: '14.66%', trend: 'Declining', remarks: 'Core Anchor' },
      { fund: 'ANWPX', type: 'Global Growth Equity',          weight: 7,  y2024: '14.16%', y2025: '16.18%', trend: 'Improving', remarks: 'Global Balance' },
    ],
    keyInsight: [
      'FSPGX and AGTHX together at 38% — US growth concentration is the primary risk heading into this meeting.',
      'AEPGX is the standout at +28.72% YTD — international recovery is outpacing domestic growth funds.',
      'Bond overweight (ABNDX + CWBFX = 33%) is limiting upside — 8% above target allocation.',
      'AMECX and ANWPX improving steadily — balanced and global exposure providing stability amid US volatility.',
    ],
  },
};

export const RISK_DATA = {
  'C005': {
    riskMetrics: [
      { label: 'Override Score',        value: '83 / 100', warn: true },
      { label: 'Volatility Reactivity', value: 'High',     warn: true },
      { label: 'Behavioral Risk',       value: 'Elevated', warn: true },
      { label: 'Sentiment',             value: 'Anxious',  warn: true },
    ],
    risks: [
      { label: 'Cash Above Target',     detail: 'Cash at 22% vs 10% target — >$350K idle, Critical compliance flag', severity: 'Critical' },
      { label: 'Compliance Escalation', detail: 'Advice boundary breached — Cash Deployment NBA escalated to compliance', severity: 'High' },
      { label: 'Behavioral Risk',       detail: 'High volatility reactivity (score 83) — client may resist rebalancing under market stress', severity: 'High' },
      { label: 'Equity Underweight',    detail: '12% below 90% equity target — growth drag compounding over time', severity: 'Medium' },
    ],
    opportunities: [
      { label: 'Deploy >$350K',        detail: 'Close 12% equity gap and align to strategic growth target' },
      { label: 'Rebalancing Upside',   detail: 'Phased equity deployment reduces timing risk while improving allocation' },
      { label: 'Behavioral Alignment', detail: 'Structured reassurance plan can reduce override score over time' },
    ],
  },
  'C012': {
    riskMetrics: [
      { label: 'Behavioral Risk',       value: 'Elevated',   warn: true },
      { label: 'Volatility Reactivity', value: 'High',       warn: true },
      { label: 'Sentiment',             value: 'Risk-Averse', warn: true },
      { label: 'IPS Alignment',         value: 'Misaligned', warn: true },
    ],
    risks: [
      { label: 'Cash Above Target',        detail: 'Cash at 40% vs 20% IPS target — $340K idle, return drag compounding', severity: 'High' },
      { label: 'Behavioral Inconsistency', detail: 'Risk-averse behavior may result in prolonged defensive positioning beyond review cycle', severity: 'Medium' },
      { label: 'IPS Misalignment',         detail: 'Ongoing deviation from agreed asset mix increasing suitability review requirements', severity: 'Medium' },
      { label: 'Compliance Escalation',    detail: 'Excess cash positioning risks escalation if not addressed within current review cycle', severity: 'Medium' },
    ],
    opportunities: [
      { label: 'Deploy $340K',          detail: 'Close 20% equity gap and align to IPS target allocation' },
      { label: 'Education Opportunity', detail: 'Data-backed framing can shift behavioral bias without increasing perceived risk' },
      { label: 'Growth Upside',         detail: 'Equity holdings performing well — increasing allocation captures existing momentum' },
    ],
  },
  '15600001': {
    risks: [
      { label: 'Portfolio Drift',     detail: '8% underweight in equities, 8% overweight in bonds', severity: 'High' },
      { label: 'Growth Limitations',  detail: 'Bond overweight limiting long-term growth potential', severity: 'Medium' },
      { label: 'Concentration Risk',  detail: 'FSPGX (20%) is tech-heavy and high volatility', severity: 'High' },
      { label: 'Currency Exposure',   detail: 'International funds (AEPGX, CWBFX, ANWPX) subject to currency risk', severity: 'Medium' },
    ],
    opportunities: [
      { label: 'Growth',          detail: 'Target achievement with Rebalancing' },
      { label: 'Diversification', detail: 'Opportunity with AEPGX' },
      { label: 'Client Alignment', detail: 'Phased allocation' },
    ],
  },
};

export const ACTIVITY_DATA = {
  'C005': [
    { date: 'Feb 14, 2026', summary: 'Client onboarded — initial portfolio setup and KYC verified', decision: 'Advisory relationship established; risk profile RP_005 assigned', sentiment: 'Neutral — onboarding phase' },
    { date: 'Mar 2026',     summary: 'Cash allocation flagged above target threshold by compliance monitoring', decision: 'Cash Deployment NBA raised; compliance escalation initiated', sentiment: 'Anxious — concerned about market timing' },
  ],
  'C012': [
    { date: 'Q4 2025', summary: 'Annual review — discussed cash drag and IPS misalignment', decision: 'Client acknowledged concern but deferred deployment decision', sentiment: 'Cautious — preferred to wait for market clarity' },
    { date: 'Q2 2025', summary: 'Mid-year check-in — cash position flagged above target', decision: 'No action taken; client cited market uncertainty', sentiment: 'Risk-averse — defensive positioning maintained' },
  ],
  '15600001': [
    { date: 'Feb 15, 2026', summary: 'Reassessed portfolio drift; discussed alternative rebalancing', decision: 'Approved Phase 1 rebalance of $10K from bonds to equities', sentiment: 'Cautious but improving' },
    { date: 'Dec 15, 2025', summary: 'Reviewed portfolio drift amid market correction', decision: 'No rebalancing executed; decision deferred', sentiment: 'Fearful and risk-averse' },
  ],
};

export const CLIENT_NEWS = {
  'C005': [
    'Active & Balanced Funds: RAEFX, RGAHX and RLEFX delivered 20–29% 1-year returns — active management is adding value, but 22% cash is diluting the overall outcome.',
    'International Equity: RIGIX returned +32.9% in 2024 and +10.7% YTD — the strongest performer in the portfolio, reinforcing the case for maintaining and growing international exposure.',
    'Cash & Money Markets: With rate cuts underway, holding >$350K in cash is increasingly costly — the window for low-risk deployment into existing strong performers is narrowing.',
    'Compliance & Reg BI: Advisors are under heightened scrutiny for idle cash positions in advisory accounts — proactive deployment documentation is essential to satisfy best-interest obligations.',
  ],
  'C012': [
    'US Equity Markets: Broad market indices delivered 19–32% 1-year returns — prolonged cash holding has cost Kevin meaningful upside relative to his IPS target.',
    'Cash & Money Markets: Money market yields declining toward 4.8% as rate cuts continue — the opportunity cost of holding excess cash is rising, not falling.',
    'Behavioral Finance: Studies show structured, phased deployment plans significantly reduce investor anxiety and improve follow-through vs lump-sum approaches.',
    'Compliance: Sustained IPS deviation beyond two consecutive review cycles typically triggers formal suitability escalation under advisory mandates.',
  ],
  '15600001': [
    'US Large-Cap Growth: Tech-heavy funds remain volatile after a strong rally; leadership narrowing increases concentration risk.',
    'International Equities: Valuations remain attractive relative to U.S. markets, with improving fundamentals supporting selective entry.',
    'Bond Markets: Conditions have stabilized, but ongoing rate uncertainty limits incremental upside from bond overweights.',
    'Industry Trends: Continued shift toward low-cost index funds.',
  ],
};

export const UPCOMING_MEETINGS = {
  'C005': [
    { date: 'Today', time: '9:00 AM',  topic: 'Cash Deployment & Compliance Review', type: 'In-person' },
    { date: 'Next Month', time: 'TBD', topic: 'Phase 1 Deployment Follow-up',        type: 'Virtual' },
  ],
  'C012': [
    { date: 'Today', time: '10:00 AM', topic: 'Cash Deployment Review',      type: 'In-person' },
    { date: 'Next Month', time: 'TBD', topic: 'Phase 1 Deployment Follow-up', type: 'Virtual' },
  ],
  '15600001': [
    { date: 'Today', time: '10:00 AM', topic: 'Portfolio Drift & Rebalancing Review', type: 'In-person' },
    { date: 'Next Month', time: 'TBD', topic: 'Phase 1 Execution Follow-up',          type: 'Virtual' },
  ],
};

export const DISCUSSION_ANGLES = {
  'C005': [
    { title: 'Capital Efficiency',     desc: 'Idle cash at 22% creating return drag vs benchmark — present phased deployment to close the 12% equity gap.' },
    { title: 'Risk Containment',       desc: 'Prolonged inactivity risks amplifying anxiety-driven decisions — structured plan now prevents reactive moves later.' },
    { title: 'Compliance & IPS',       desc: 'Sustained deviation from 90% equity IPS target triggers escalation — walk through Reg BI obligation and document resolution.' },
    { title: 'Behavioral Coaching',    desc: 'Override score of 83 signals high reversal risk — use the fund performance data to show David his anxiety is misaligned with actual portfolio results.' },
    { title: 'Follow-up & Monitoring', desc: 'Set 30-day check-in, Phase 2 triggers, confirm Phone as preferred channel.' },
  ],
  'C012': [
    { title: 'Return Drag',          desc: 'Cash at 40% is suppressing returns — show Kevin the cost of inaction using his own fund performance data.' },
    { title: 'Behavioral Framing',   desc: 'Reframe deployment as reducing risk, not adding it — phased approach aligns with his comfort level.' },
    { title: 'Education',            desc: 'Walk through how IPS targets were set and why 20% cash was the agreed ceiling, not a floor.' },
    { title: 'Phased Deployment',    desc: 'Present a structured 3-phase plan to move from 40% to 20% cash over 6 months — small steps reduce anxiety.' },
    { title: 'Follow-up & Review',   desc: 'Set 30-day check-in post Phase 1, confirm Email as preferred channel for progress updates.' },
  ],
  '15600001': [
    { title: 'Portfolio Drift Check',       desc: 'Review current equity underweight vs target and growth impact.' },
    { title: 'Rebalancing Approach',        desc: 'Compare phased vs lump-sum rebalancing; reinforce gradual strategy.' },
    { title: 'Fund Performance Highlights', desc: 'Discuss international recovery, manage US growth volatility, and revisit bond role.' },
    { title: 'Execution Plan',              desc: 'Confirm Phase-1 $10K rebalance, timing, and mechanics.' },
    { title: 'Next Milestone',              desc: 'Set expectations for Phase-2 planning and schedule follow-up.' },
  ],
};

export const RECOMMENDED_ACTIONS = {
  'C005': {
    primary: [
      { label: 'Cash Deployment', desc: 'Deploy >$350K from VMFXX into equities to close the 12% allocation gap.', reasoning: "David's 22% cash position materially exceeds the 10% IPS target, creating return drag and triggering suitability review under the advisory mandate. All regulatory, product, and household checks pass, with no conflicts or liquidity constraints identified." },
      { label: 'Rebalancing',     desc: 'Phased rebalancing toward 90% equity target — avoid lump-sum to manage behavioral risk.', reasoning: "Rebalancing is fully permitted within advisory and product eligibility rules, with no household or compliance blockers. To optimize execution given David's behavioral profile, the model recommends phased rebalancing, avoiding lump-sum actions that could increase anxiety and reversal risk." },
      { label: 'Behavioral',      desc: 'Address override score of 83 — show David his fund performance directly contradicts his anxiety, making the case for deployment data-first rather than reassurance-first.', reasoning: "Despite strong underlying fund performance, David's sentiment remains classified as anxious, increasing the likelihood of reactive, non-goal-aligned decisions. Structured reassurance is recommended, reframing rebalancing as a return to the agreed strategic plan to reduce override propensity and stabilize execution." },
    ],
    clientAligned: [],
  },
  'C012': {
    primary: [
      { label: 'Cash Deployment',    desc: 'Initiate Phase 1 deployment of $85K (10% of portfolio) from cash into VFIAX and VXUS to begin closing the 20% equity gap.', reasoning: 'Cash at 40% materially exceeds the 20% IPS target. All suitability, product eligibility and household checks pass. Phased deployment recommended given behavioral profile — reduces anxiety and reversal risk while restoring IPS alignment.' },
      { label: 'Behavioral Framing', desc: 'Show Kevin his own fund returns — VFIAX +32%, VXUS +22% YTD — to demonstrate the cost of inaction in concrete dollar terms rather than abstract risk language.', reasoning: 'Behavioral inconsistency risk is elevated. Client has deferred twice. Data-backed framing using his own portfolio performance is the most effective intervention to shift defensive positioning without triggering resistance.' },
      { label: 'IPS Realignment',    desc: 'Document a formal 6-month deployment roadmap and confirm in writing — two consecutive deferrals puts the advisory relationship at escalation risk.', reasoning: 'Two consecutive review cycles with IPS deviation increases formal escalation risk under the advisory mandate. Documenting a structured plan satisfies suitability requirements and protects both client and advisor.' },
    ],
    clientAligned: [],
  },
  '15600001': {
    primary: [
      { label: 'Execute Phase-1 Rebalance',    desc: 'Proceed with the approved $10K bond-to-equity shift', reasoning: 'Client approved Phase-1 rebalance in Feb 2026 review. Equity is 8% below target at 52% vs 60% IPS target. Executing now captures current international momentum (AEPGX +28.72% YTD) while staying within the phased approach agreed to reduce timing anxiety.' },
      { label: 'Target Selective Equity Adds', desc: 'Increase AEPGX and AMECX exposure; avoid adding to high-volatility growth funds.', reasoning: 'AEPGX is the standout performer at +28.72% YTD with improving fundamentals. AMECX provides defensive income with improving trend. FSPGX and AGTHX already at 38% combined — adding to them increases concentration risk beyond IPS limits.' },
    ],
    clientAligned: [
      'Phased Approach: Continue $10K increments to align with client comfort and reduce timing risk.',
      'Objective: Reframe rebalancing as returning to the long-term plan, not reacting to markets.',
      'Follow-Up: Reassess portfolio and client confidence within 30 days to plan Phase-2.',
    ],
  },
};

export const FALLBACK_CLIENT = {
  name: 'Client', tier: 'Standard', riskProfile: 'Moderate',
  lastInteraction: 'N/A', sentiment: 'N/A', meetingGoal: 'Portfolio Review',
  meetingTime: 'Today', aum: 'N/A', age: 0,
};
