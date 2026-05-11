import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  User, TrendingUp, Target, MessageSquare,
  BarChart3, AlertTriangle, CheckCircle, Download,
  Sparkles, Clock, Shield, Rocket, Newspaper, ChevronDown
} from 'lucide-react';
import AIBadge from '../components/AIBadge';
import './MeetingPrep.css';

const CLIENT_DATA = {
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
    nbaTrigger: 'Excess idle cash of >$350K above target — compliance escalation triggered. Deploy cash and address behavioral anxiety before drift widens.',
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

const HOLDINGS_DATA = {
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
    returns: [
      { label: '1D',             value: '+0.25%' },
      { label: 'WTD',            value: '+0.80%' },
      { label: 'MTD',            value: '+1.95%' },
      { label: 'QTD',            value: '+3.50%' },
      { label: 'YTD',            value: '+3.50%' },
      { label: '1-Year',         value: '+11.20%' },
      { label: 'Since Inception',value: '+11.20%' },
    ],
    keyInsight: 'Cash allocation is 12% above target — over $350K sitting idle.\n\nDeploying into equities would close the gap to the 90% equity target and improve long-term growth alignment.',
  },
  '15600001': {
    totalValue: '$502,000',
    costBasis: '$450,000',
    unrealizedGL: '$52,000',
    allocation: [
      { asset: 'Equity', pct: 52, value: '$260K', target: 60, diff: -8, status: 'underweight' },
      { asset: 'Bonds', pct: 43, value: '$215K', target: 35, diff: +8, status: 'overweight' },
      { asset: 'Cash', pct: 5, value: '$25K', target: 5, diff: 0, status: 'on-target' },
    ],
    performance: [
      { fund: 'FSPGX', type: 'US Large-Cap Growth (Equity)', weight: 20, y2024: '33.26%', y2025: '18.53%', trend: 'Declining', remarks: 'Concentration Risk' },
      { fund: 'AGTHX', type: 'US Growth (Equity)', weight: 18, y2024: '28.43%', y2025: '19.93%', trend: 'Declining', remarks: '' },
      { fund: 'ABNDX', type: 'Core Bond', weight: 18, y2024: '4.51%', y2025: '6.71%', trend: 'Improving', remarks: '' },
      { fund: 'AEPGX', type: 'International Equity', weight: 17, y2024: '4.66%', y2025: '28.72%', trend: 'Growing', remarks: 'Highly Volatile Diversification Opportunity' },
      { fund: 'CWBFX', type: 'Global Bond', weight: 15, y2024: '3.42%', y2025: '5.62%', trend: 'Improving', remarks: 'Defensive Drag' },
      { fund: 'AMECX', type: 'Income/Balanced', weight: 10, y2024: '9.52%', y2025: '12.55%', trend: 'Improving', remarks: 'Excess Stability' },
      { fund: 'AIVSX', type: 'US Core Equity', weight: 7, y2024: '18.57%', y2025: '14.66%', trend: 'Declining', remarks: 'Core Anchor' },
      { fund: 'ANWPX', type: 'Global Growth Equity', weight: 7, y2024: '14.16%', y2025: '16.18%', trend: 'Improving', remarks: 'Global Balance' },
    ],
    keyInsight: 'Growth concentration risk is emerging on the US equities — FSPGX, AGTHX\n\nInternational and balanced allocations are becoming key growth drivers — AEPGX, AMECX, ANWPX',
  },
};

const RISK_DATA = {
  'C005': {
    riskMetrics: [
      { label: 'Override Score',      value: '83 / 100', warn: true },
      { label: 'Volatility Reactivity', value: 'High',   warn: true },
      { label: 'Behavioral Risk',     value: 'Elevated', warn: true },
      { label: 'Sentiment',           value: 'Anxious',  warn: true },
    ],
    risks: [
      { label: 'Cash Above Target',       detail: 'Cash at 22% vs 10% target — >$350K idle, Critical compliance flag', severity: 'Critical' },
      { label: 'Compliance Escalation',   detail: 'Advice boundary breached — Cash Deployment NBA escalated to compliance', severity: 'High' },
      { label: 'Behavioral Risk',         detail: 'High volatility reactivity (score 83) — client may resist rebalancing under market stress', severity: 'High' },
      { label: 'Equity Underweight',      detail: '12% below 90% equity target — growth drag compounding over time', severity: 'Medium' },
    ],
    opportunities: [
      { label: 'Deploy >$350K',        detail: 'Close 12% equity gap and align to strategic growth target' },
      { label: 'Rebalancing Upside',   detail: 'Phased equity deployment reduces timing risk while improving allocation' },
      { label: 'Behavioral Alignment', detail: 'Structured reassurance plan can reduce override score over time' },
    ],
  },
  '15600001': {
    risks: [
      { label: 'Portfolio Drift', detail: '8% underweight in equities, 8% overweight in bonds', severity: 'High' },
      { label: 'Growth Limitations', detail: 'Bond overweight limiting long-term growth potential', severity: 'Medium' },
      { label: 'Concentration Risk', detail: 'FSPGX (20%) is tech-heavy and high volatility', severity: 'High' },
      { label: 'Currency Exposure', detail: 'International funds (AEPGX, CWBFX, ANWPX) subject to currency risk', severity: 'Medium' },
    ],
    opportunities: [
      { label: 'Growth', detail: 'Target achievement with Rebalancing' },
      { label: 'Diversification', detail: 'Opportunity with AEPGX' },
      { label: 'Client Alignment', detail: 'Phased allocation' },
    ],
  },
};

const ACTIVITY_DATA = {
  'C005': [
    { date: 'Feb 14, 2026', summary: 'Client onboarded — initial portfolio setup and KYC verified', decision: 'Advisory relationship established; risk profile RP_005 assigned', sentiment: 'Neutral — onboarding phase' },
    { date: 'Mar 2026',     summary: 'Cash allocation flagged above target threshold by compliance monitoring', decision: 'Cash Deployment NBA raised; compliance escalation initiated', sentiment: 'Anxious — concerned about market timing' },
  ],
  '15600001': [
    { date: 'Feb 15, 2026', summary: 'Reassessed portfolio drift; discussed alternative rebalancing', decision: 'Approved Phase 1 rebalance of $10K from bonds to equities', sentiment: 'Cautious but improving' },
    { date: 'Dec 15, 2025', summary: 'Reviewed portfolio drift amid market correction', decision: 'No rebalancing executed; decision deferred', sentiment: 'Fearful and risk-averse' },
  ],
};

const CLIENT_NEWS = {
  '15600001': [
    'US Large-Cap Growth: Tech-heavy funds remain volatile after a strong rally; leadership narrowing increases concentration risk.',
    'International Equities: Valuations remain attractive relative to U.S. markets, with improving fundamentals supporting selective entry.',
    'Bond Markets: Conditions have stabilized, but ongoing rate uncertainty limits incremental upside from bond overweights.',
    'Industry Trends: Continued shift toward low-cost index funds.',
  ],
};

const UPCOMING_MEETINGS = {
  'C005': [
    { date: 'Today', time: '9:00 AM',   topic: 'Cash Deployment & Compliance Review', type: 'In-person' },
    { date: 'Next Month', time: 'TBD',  topic: 'Phase 1 Deployment Follow-up',        type: 'Virtual' },
  ],
  '15600001': [
    { date: 'Today', time: '10:00 AM', topic: 'Portfolio Drift & Rebalancing Review', type: 'In-person' },
    { date: 'Next Month', time: 'TBD', topic: 'Phase 1 Execution Follow-up', type: 'Virtual' },
  ],
};

const DISCUSSION_ANGLES = {
  'C005': [
    { title: 'Cash Deployment Strategy',   desc: 'Review the >$350K idle cash position and present phased equity deployment options to close the 12% gap.' },
    { title: 'Compliance & Reg BI',        desc: 'Walk through the compliance escalation, explain the Cash Deployment NBA, and confirm Reg BI opt-in obligations.' },
    { title: 'Behavioral Reassurance',     desc: 'Address client anxiety and high volatility reactivity — reframe rebalancing as a structured, low-risk plan.' },
    { title: 'Rebalancing to 90% Equity',  desc: 'Present phased rebalancing roadmap: Phase 1 deployment amount, timeline, and target allocation milestones.' },
    { title: 'Follow-up & Monitoring',     desc: 'Set 30-day check-in, define Phase 2 triggers, and confirm preferred communication channel (Phone).' },
  ],
  '15600001': [
    { title: 'Portfolio Drift Check', desc: 'Review current equity underweight vs target and growth impact.' },
    { title: 'Rebalancing Approach', desc: 'Compare phased vs lump-sum rebalancing; reinforce gradual strategy.' },
    { title: 'Fund Performance Highlights', desc: 'Discuss international recovery, manage US growth volatility, and revisit bond role.' },
    { title: 'Execution Plan', desc: 'Confirm Phase-1 $10K rebalance, timing, and mechanics.' },
    { title: 'Next Milestone', desc: 'Set expectations for Phase-2 planning and schedule follow-up.' },
  ],
};

const RECOMMENDED_ACTIONS = {
  'C005': {
    primary: [
      { label: 'Deploy Cash — Phase 1',      desc: 'Initiate structured deployment of idle cash into equities to begin closing the 12% allocation gap.' },
      { label: 'Rebalance to Equity Target', desc: 'Execute phased rebalancing toward 90% equity target; avoid lump-sum to manage behavioral risk.' },
      { label: 'Address Behavioral Anxiety', desc: 'Use structured reassurance script — reframe rebalancing as returning to the agreed strategic plan.' },
    ],
    clientAligned: [
      'Phased Approach: Deploy in increments aligned to client comfort — reduces timing anxiety and compliance risk.',
      'Compliance: Confirm Reg BI opt-in acknowledgment and document advice boundary resolution in CRM.',
      'Follow-Up: Schedule 30-day review to assess Phase 1 impact and plan Phase 2 deployment.',
    ],
  },
  '15600001': {
    primary: [
      { label: 'Execute Phase-1 Rebalance', desc: 'Proceed with the approved $10K bond-to-equity shift' },
      { label: 'Target Selective Equity Adds', desc: 'Increase AEPGX and AMECX exposure; avoid adding to high-volatility growth funds.' },
    ],
    clientAligned: [
      'Phased Approach: Continue $10K increments to align with client comfort and reduce timing risk.',
      'Objective: Reframe rebalancing as returning to the long-term plan, not reacting to markets.',
      'Follow-Up: Reassess portfolio and client confidence within 30 days to plan Phase-2.',
    ],
  },
};

const fallbackClient = {
  name: 'Client', tier: 'Standard', riskProfile: 'Moderate',
  lastInteraction: 'N/A', sentiment: 'N/A', meetingGoal: 'Portfolio Review',
  meetingTime: 'Today', aum: 'N/A', age: 0,
};

const MeetingPrep = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();

  const client = CLIENT_DATA[clientId] || fallbackClient;
  const holdings = HOLDINGS_DATA[clientId] || HOLDINGS_DATA['15600001'];
  const risk = RISK_DATA[clientId] || RISK_DATA['15600001'];
  const activity = ACTIVITY_DATA[clientId] || ACTIVITY_DATA['15600001'];
  const news = CLIENT_NEWS[clientId] || CLIENT_NEWS['15600001'];
  const upcoming = UPCOMING_MEETINGS[clientId] || UPCOMING_MEETINGS['15600001'];
  const angles = DISCUSSION_ANGLES[clientId] || DISCUSSION_ANGLES['15600001'];
  const actions = RECOMMENDED_ACTIONS[clientId] || RECOMMENDED_ACTIONS['15600001'];

  const isDavid = clientId === 'C005';

  const [newsExpanded, setNewsExpanded] = useState(false);
  const [activityExpanded, setActivityExpanded] = useState(false);

  return (
    <div className="mp-page">

      {/* ── Header ── */}
      <div className="mp-header">
        <div className="mp-header__title-row">
          <Sparkles size={18} style={{ color: isDavid ? 'var(--error)' : 'var(--success)', flexShrink: 0 }} />
          <h1 className="mp-header__title">Meeting Prep — {client.name}</h1>
          {isDavid && <span className="mp-header__critical">CRITICAL</span>}
          <span className="mp-header__time">{client.meetingTime}</span>
        </div>
        <div className="mp-header__stats">
          <span className="mp-stat"><Shield size={12} /> {client.tier}</span>
          <span className="mp-stat"><TrendingUp size={12} /> {client.riskProfile}</span>
          <span className="mp-stat">{client.aum} AUM</span>
          {isDavid && <span className="mp-stat"><User size={12} /> {client.segment}</span>}
          {isDavid && <span className="mp-stat"><CheckCircle size={12} /> KYC: {client.kycStatus}</span>}
          {isDavid && <span className="mp-stat"><Shield size={12} /> {client.lifecycleStage}</span>}
          <span className="mp-stat mp-stat--warn"><AlertTriangle size={12} /> {client.sentiment}</span>
          <span className="mp-stat mp-stat--accent"><Target size={12} /> {client.meetingGoal}</span>
          <button className="mp-export-btn"><Download size={13} /> Export</button>
        </div>
      </div>

      {/* ── David: Client Profile Card ── */}
      {isDavid && (
        <div className="mp-card mp-client-profile">
          <div className="mp-card__head">
            <div className="mp-card__icon"><User size={15} /></div>
            <h2 className="mp-card__title">Client Profile</h2>
          </div>
          <div className="mp-cp-grid">
            <div className="mp-cp-section">
              <span className="mp-cp-section__label">Identity</span>
              <div className="mp-cp-rows">
                {[['Customer ID', client.customerId], ['Household ID', client.householdId], ['Account', client.accountId],
                  ['Client Type', client.clientType], ['Customer Type', client.customerType],
                  ['Segment', client.segment], ['Advice Posture', client.advicePosture],
                  ['Relationship Type', client.adviceRelationshipType], ['Advisor ID', client.advisorId],
                ].map(([k, v]) => (
                  <div key={k} className="mp-cp-row"><span className="mp-cp-row__key">{k}</span><span className="mp-cp-row__val">{v}</span></div>
                ))}
              </div>
            </div>
            <div className="mp-cp-section">
              <span className="mp-cp-section__label">Status & Lifecycle</span>
              <div className="mp-cp-rows">
                {[['Risk Status', client.riskStatus], ['KYC Status', client.kycStatus],
                  ['Risk Profile ID', client.riskProfileId], ['Status', 'Active'],
                  ['Lifecycle Stage', client.lifecycleStage], ['Onboarding Date', client.onboardingDate],
                  ['Lifecycle Effective', client.lifecycleEffectiveDate],
                ].map(([k, v]) => (
                  <div key={k} className="mp-cp-row">
                    <span className="mp-cp-row__key">{k}</span>
                    <span className={`mp-cp-row__val${k === 'Risk Status' ? ' mp-cp-row__val--critical' : ''}`}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mp-cp-section">
              <span className="mp-cp-section__label">Personal</span>
              <div className="mp-cp-rows">
                {[['Date of Birth', client.dob], ['Gender', client.gender],
                  ['Email', client.email], ['Phone', client.phone],
                  ['Address', client.address], ['Preferred Channel', client.preferredChannel],
                  ['Language', client.languagePreference],
                ].map(([k, v]) => (
                  <div key={k} className="mp-cp-row"><span className="mp-cp-row__key">{k}</span><span className="mp-cp-row__val">{v}</span></div>
                ))}
              </div>
            </div>
            <div className="mp-cp-section">
              <span className="mp-cp-section__label">Regulatory & Consent</span>
              <div className="mp-cp-rows">
                {[['Reg BI Opt-In', client.regBIOptIn], ['Disclosure Method', client.disclosureMethod],
                  ['Privacy Classification', client.privacyClassification],
                ].map(([k, v]) => (
                  <div key={k} className="mp-cp-row"><span className="mp-cp-row__key">{k}</span><span className="mp-cp-row__val">{v}</span></div>
                ))}
                <div className="mp-cp-row"><span className="mp-cp-row__key">Marketing Consent</span><span className={`mp-cp-row__val ${client.consentMarketing ? 'mp-cp-row__val--yes' : 'mp-cp-row__val--no'}`}>{client.consentMarketing ? 'Yes' : 'No'}</span></div>
                <div className="mp-cp-row"><span className="mp-cp-row__key">Advice Consent</span><span className={`mp-cp-row__val ${client.consentAdvice ? 'mp-cp-row__val--yes' : 'mp-cp-row__val--no'}`}>{client.consentAdvice ? 'Yes' : 'No'}</span></div>
                <div className="mp-cp-row"><span className="mp-cp-row__key">Third-Party Sharing</span><span className={`mp-cp-row__val ${client.consentThirdParty ? 'mp-cp-row__val--yes' : 'mp-cp-row__val--no'}`}>{client.consentThirdParty ? 'Yes' : 'No'}</span></div>
              </div>
            </div>
          </div>
          {client.nbaTrigger && (
            <div className="mp-cp-nba-trigger">
              <AlertTriangle size={13} style={{ color: 'var(--error)', flexShrink: 0 }} />
              <span>{client.nbaTrigger}</span>
            </div>
          )}
        </div>
      )}

      {/* ── 3-Row × 2-Col Grid ── */}
      <div className="mp-grid">

        {/* ROW 1: Portfolio Snapshot + Risks & Opportunities */}
        <section className="mp-card">
          <div className="mp-card__head">
            <div className="mp-card__icon"><BarChart3 size={15} /></div>
            <h2 className="mp-card__title">Portfolio Snapshot</h2>
            <AIBadge size="sm" />
          </div>
          <div className="mp-snapshot-kpis">
            <div className="mp-snapshot-kpi">
              <span className="mp-snapshot-kpi__label">Market Value</span>
              <span className="mp-snapshot-kpi__value">{holdings.totalValue}</span>
            </div>
            <div className="mp-snapshot-kpi">
              <span className="mp-snapshot-kpi__label">Cost Basis</span>
              <span className="mp-snapshot-kpi__value">{holdings.costBasis}</span>
            </div>
            <div className="mp-snapshot-kpi">
              <span className="mp-snapshot-kpi__label">Unrealized Gain/Loss</span>
              <span className="mp-snapshot-kpi__value mp-snapshot-kpi__value--positive">{holdings.unrealizedGL}</span>
            </div>
            {isDavid && holdings.benchmark && (
              <div className="mp-snapshot-kpi">
                <span className="mp-snapshot-kpi__label">Benchmark</span>
                <span className="mp-snapshot-kpi__value" style={{ fontSize: '0.8rem' }}>{holdings.benchmark}</span>
              </div>
            )}
          </div>

          {/* David: allocation variance table */}
          {isDavid && holdings.allocation && (
            <>
              <h3 className="mp-card__sub">Allocation vs Target</h3>
              <div className="mp-table-wrap">
                <table className="mp-table">
                  <thead><tr><th>Asset</th><th>Current</th><th>Value</th><th>Target</th><th>Variance</th><th>Status</th></tr></thead>
                  <tbody>
                    {holdings.allocation.map((a, i) => (
                      <tr key={i}>
                        <td className="mp-td--bold">{a.asset}</td>
                        <td>{a.pct}%</td>
                        <td>{a.value}</td>
                        <td>{a.target}%</td>
                        <td className={a.diff < 0 ? 'mp-td--neg' : a.diff > 0 ? 'mp-td--warn' : 'mp-td--ok'}>{a.diff > 0 ? '+' : ''}{a.diff}%</td>
                        <td><span className={`mp-badge ${a.status === 'on-target' ? 'mp-badge--ok' : 'mp-badge--warn'}`}>{a.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <h3 className="mp-card__sub" style={{ marginTop: '16px' }}>Portfolio Returns</h3>
              <div className="mp-returns-grid">
                {holdings.returns.map((r, i) => (
                  <div key={i} className="mp-return-kpi">
                    <span className="mp-return-kpi__label">{r.label}</span>
                    <span className="mp-return-kpi__value">{r.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Alex / others: fund performance table */}
          {!isDavid && holdings.performance && holdings.performance.length > 0 && (
            <>
              <h3 className="mp-card__sub">Performance Trends</h3>
              <div className="mp-table-wrap">
                <table className="mp-table">
                  <thead><tr><th>Fund</th><th>Fund Type</th><th>Weight</th><th>2024</th><th>2025</th><th>Trend</th><th>Remarks</th></tr></thead>
                  <tbody>
                    {holdings.performance.map((p, i) => (
                      <tr key={i}>
                        <td className="mp-td--bold">{p.fund}</td>
                        <td style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{p.type}</td>
                        <td>{p.weight}%</td>
                        <td>{p.y2024}</td>
                        <td>{p.y2025}</td>
                        <td><span className={`mp-badge ${p.trend === 'Growing' || p.trend === 'Improving' ? 'mp-badge--ok' : p.trend === 'Declining' ? 'mp-badge--warn' : ''}`}>{p.trend}</span></td>
                        <td style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>{p.remarks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          {holdings.keyInsight && (
            <div className="mp-card__insight">
              {holdings.keyInsight.split('\n\n').map((line, i) => (
                <p key={i} style={{ margin: i > 0 ? '6px 0 0 0' : '0' }}>{line}</p>
              ))}
            </div>
          )}
        </section>

        <section className="mp-card">
          <div className="mp-card__head">
            <div className="mp-card__icon mp-card__icon--warn"><AlertTriangle size={15} /></div>
            <h2 className="mp-card__title">Risks & Opportunities</h2>
            <AIBadge size="sm" />
          </div>
          {/* David: risk metrics KPI row (sentiment + propensity) */}
          {isDavid && risk.riskMetrics && (
            <div className="mp-risk-metrics">
              {risk.riskMetrics.map((m, i) => (
                <div key={i} className="mp-risk-metric">
                  <span className="mp-risk-metric__label">{m.label}</span>
                  <span className={`mp-risk-metric__value${m.warn ? ' mp-risk-metric__value--warn' : ''}`}>{m.value}</span>
                </div>
              ))}
            </div>
          )}
          <div className="mp-risk-opp-body">
            <div>
              <h3 className="mp-card__sub">Risks</h3>
              <div className="mp-risk-list">
                {risk.risks.map((r, i) => (
                  <div key={i} className="mp-risk-card">
                    <div className="mp-risk-card__top">
                      <span className="mp-risk-card__label">{r.label}</span>
                    <span className={`mp-risk-card__badge mp-risk-card__badge--${r.severity.toLowerCase()}`}>{r.severity}</span>
                    </div>
                    <span className="mp-risk-card__detail">{r.detail}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="mp-card__sub mp-card__sub--spaced">Opportunities</h3>
              <div className="mp-risk-list">
                {risk.opportunities.map((o, i) => (
                  <div key={i} className="mp-opp-card">
                    <span className="mp-risk-card__label">{o.label}</span>
                    <span className="mp-risk-card__detail">{o.detail}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ROW 2: Recent Activity + Fund News (standard) | Recent Activity + Discussion Angles (David) */}
        <section className="mp-card mp-card--row2">
          <div className="mp-card__head">
            <div className="mp-card__icon"><Clock size={15} /></div>
            <h2 className="mp-card__title">Recent Activity</h2>
          </div>
          <div className={`mp-collapsible-body${activityExpanded ? ' mp-collapsible-body--expanded' : ''}`}>
            <div className="mp-activity-list">
              {activity.map((a, i) => (
                <div key={i} className="mp-activity-row">
                  <span className="mp-activity-date">{a.date}</span>
                  <div className="mp-activity-body">
                    <span className="mp-activity-summary">{a.summary}</span>
                    <span className="mp-activity-decision">→ {a.decision}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button className="mp-view-more" onClick={() => setActivityExpanded(p => !p)}>
            {activityExpanded ? 'Show less' : 'View more'} <ChevronDown size={12} className={activityExpanded ? 'mp-chevron--up' : ''} />
          </button>
        </section>

        {/* Row 2 right: Fund News for standard clients, Discussion Angles for David */}
        {!isDavid ? (
          <section className="mp-card mp-card--row2">
            <div className="mp-card__head">
              <div className="mp-card__icon"><Newspaper size={15} /></div>
              <h2 className="mp-card__title">Fund News</h2>
              <AIBadge size="sm" />
            </div>
            <div className={`mp-collapsible-body${newsExpanded ? ' mp-collapsible-body--expanded' : ''}`}>
              <ul className="mp-bullets">
                {news.map((n, i) => {
                  const [label, ...rest] = n.split(':');
                  return <li key={i}><strong>{label}</strong>{rest.length ? `:${rest.join(':')}` : ''}</li>;
                })}
              </ul>
            </div>
            <button className="mp-view-more" onClick={() => setNewsExpanded(p => !p)}>
              {newsExpanded ? 'Show less' : 'View more'} <ChevronDown size={12} className={newsExpanded ? 'mp-chevron--up' : ''} />
            </button>
          </section>
        ) : (
          <section className="mp-card mp-card--row2">
            <div className="mp-card__head">
              <div className="mp-card__icon"><MessageSquare size={15} /></div>
              <h2 className="mp-card__title">Discussion Angles</h2>
              <AIBadge size="sm" />
            </div>
            <div className="mp-discussion-list">
              {angles.map((a, i) => (
                <div key={i} className="mp-discussion-item">
                  <span className="mp-discussion-num">{i + 1}</span>
                  <div>
                    <span className="mp-discussion-title">{a.title}</span>
                    <span className="mp-discussion-desc">{a.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ROW 3: Discussion Angles + Next Best Actions (standard) | Full-width NBA (David) */}
        {!isDavid && (
          <section className="mp-card mp-card--row3">
            <div className="mp-card__head">
              <div className="mp-card__icon"><MessageSquare size={15} /></div>
              <h2 className="mp-card__title">Discussion Angles</h2>
              <AIBadge size="sm" />
            </div>
            <div className="mp-discussion-list">
              {angles.map((a, i) => (
                <div key={i} className="mp-discussion-item">
                  <span className="mp-discussion-num">{i + 1}</span>
                  <div>
                    <span className="mp-discussion-title">{a.title}</span>
                    <span className="mp-discussion-desc">{a.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className={`mp-card${isDavid ? ' mp-card--full-width' : ' mp-card--row3'}`}>
          <div className="mp-card__head">
            <div className="mp-card__icon mp-card__icon--accent"><Rocket size={15} /></div>
            <h2 className="mp-card__title">Next Best Actions</h2>
            <AIBadge size="sm" />
          </div>
          <div className={`mp-nba-grid${isDavid ? ' mp-nba-grid--wide' : ''}`}>
            <div className="mp-nba-col mp-nba-col--primary">
              <h3 className="mp-nba-col__label">Primary</h3>
              {actions.primary.map((a, i) => (
                <div key={i} className="mp-nba-card mp-nba-card--primary">
                  <div className="mp-nba-card__head">
                    <CheckCircle size={14} />
                    <span className="mp-nba-card__title">{a.label}</span>
                  </div>
                  <p className="mp-nba-card__desc">{a.desc}</p>
                </div>
              ))}
            </div>
            <div className="mp-nba-col mp-nba-col--client">
              <h3 className="mp-nba-col__label">Client Aligned</h3>
              {actions.clientAligned.map((a, i) => {
                const [label, ...rest] = a.split(':');
                return (
                  <div key={i} className="mp-nba-card mp-nba-card--client">
                    <span><strong>{label}</strong>{rest.length ? `:${rest.join(':')}` : ''}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

      </div>

      {/* ── Quick Links ── */}
      <div className="mp-quicklinks">
        <button className="mp-ql-btn" onClick={() => navigate(`/client/${clientId}/rebalancing`)}>
          <TrendingUp size={14} /> Rebalancing
        </button>
        <button className="mp-ql-btn" onClick={() => navigate(`/client/${clientId}/risk-analysis`)}>
          <AlertTriangle size={14} /> Risk Analysis
        </button>
        <button className="mp-ql-btn" onClick={() => navigate(`/client/${clientId}/profile`)}>
          <User size={14} /> Profile
        </button>
        <button className="mp-ql-btn" onClick={() => navigate(`/client/${clientId}/ips`)}>
          <Shield size={14} /> IPS
        </button>
      </div>

    </div>
  );
};

export default MeetingPrep;
