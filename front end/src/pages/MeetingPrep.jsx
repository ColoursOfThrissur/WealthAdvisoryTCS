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
    nbaTrigger: 'High idle cash (22% vs 10% target, >$350K) combined with anxious sentiment creates immediate performance, behavioral, and compliance risk — confirming ideal trigger for proactive advisor engagement.',
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
    performance: [
      { fund: 'VTI',   type: 'US Total Market (Equity)',      weight: 32, y2024: '23.84%', y2025: '14.20%', trend: 'Declining',  remarks: 'Core Equity Anchor' },
      { fund: 'QQQ',   type: 'US Large-Cap Tech (Equity)',    weight: 20, y2024: '26.57%', y2025: '11.43%', trend: 'Declining',  remarks: 'Concentration Risk' },
      { fund: 'VXUS',  type: 'International Equity',          weight: 16, y2024: '5.12%',  y2025: '22.38%', trend: 'Growing',   remarks: 'Diversification Upside' },
      { fund: 'VMFXX', type: 'Money Market / Cash Equivalent', weight: 22, y2024: '5.28%',  y2025: '4.91%',  trend: 'Declining', remarks: 'Excess Cash — Deploy' },
      { fund: 'BND',   type: 'US Aggregate Bond',             weight: 10, y2024: '4.22%',  y2025: '5.10%',  trend: 'Improving', remarks: 'Defensive Buffer' },
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
    keyInsight: 'Cash drag is the primary issue — VMFXX at 22% is earning ~4.9% while equity targets remain unmet.\n\nDeploying into VTI and VXUS would close the 12% equity gap and improve long-term growth alignment vs MSCI World benchmark.',
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
  'C005': [
    'US Equity Markets: Broad market (VTI) and tech-heavy (QQQ) funds have pulled back in 2025 after strong 2024 gains — a phased entry point may reduce timing risk for cash deployment.',
    'International Equities: VXUS is outperforming US peers YTD (+22%) driven by European and EM recovery — increasing international exposure aligns with MSCI World benchmark target.',
    'Cash & Money Markets: VMFXX yield declining from 5.28% to 4.91% as rate cuts materialise — holding excess cash is increasingly costly relative to equity upside.',
    'Compliance & Reg BI: Advisors are under heightened scrutiny for idle cash positions in advisory accounts — proactive deployment documentation is essential to satisfy best-interest obligations.',
  ],
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
    { title: 'Capital Efficiency',     desc: 'Idle cash at 22% is creating return drag vs MSCI World benchmark — present phased equity deployment to close the 12% gap and restore growth alignment.' },
    { title: 'Risk Containment',       desc: 'Prolonged inactivity may amplify anxiety-driven decisions later — a structured deployment plan now reduces the risk of reactive, poorly-timed moves.' },
    { title: 'Compliance & IPS',       desc: 'Sustained deviation from IPS asset mix (90% equity target) triggers escalation — walk through the Reg BI obligation and document the advice boundary resolution.' },
    { title: 'Behavioral Coaching',    desc: 'Structured deployment can reduce volatility reactivity — reframe rebalancing as returning to the agreed plan, not reacting to markets.' },
    { title: 'Follow-up & Monitoring', desc: 'Set 30-day check-in, define Phase 2 triggers, and confirm preferred communication channel (Phone).' },
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
      { label: 'Cash Deployment',        desc: 'Review cash deployment strategy — initiate structured phased deployment of >$350K idle cash into equities to begin closing the 12% allocation gap.' },
      { label: 'Rebalancing',            desc: 'Rebalance toward equity target — execute phased rebalancing toward 90% equity; avoid lump-sum to manage behavioral risk and timing anxiety.' },
      { label: 'Behavioral',             desc: 'Address anxiety and risk behavior — use structured reassurance to reframe rebalancing as returning to the agreed strategic plan, not reacting to markets.' },
    ],
    clientAligned: [],
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
          <button className="mp-export-btn"><Download size={13} /> Export</button>
        </div>
        <div className="mp-header__stats">
          <span className="mp-stat"><Shield size={12} /> {client.tier}</span>
          <span className="mp-stat"><TrendingUp size={12} /> {client.riskProfile}</span>
          <span className="mp-stat">{client.aum} AUM</span>
          <span className="mp-stat mp-stat--warn"><AlertTriangle size={12} /> {client.sentiment}</span>
          <span className="mp-stat mp-stat--accent"><Target size={12} /> {client.meetingGoal}</span>
        </div>
      </div>

      {/* ── David only: reason strip ── */}
      {isDavid && (
        <div className="mp-nba-reason">
          <AlertTriangle size={13} />
          <span>{client.nbaTrigger}</span>
        </div>
      )}

      {/* ── David only: client profile strip (not a card) ── */}
      {isDavid && (
        <div className="mp-profile-strip">
          <div className="mp-profile-strip__left">
            <span className="mp-profile-strip__name">{client.name}</span>
            <span className="mp-profile-strip__bio">
              {client.age}y/o {client.segment} client · {client.clientType} · Onboarded {client.onboardingDate} · Prefers {client.preferredChannel}
              <span className="mp-profile-strip__ref"> · {client.customerId} · {client.householdId} · {client.accountId} · {client.advisorId}</span>
            </span>
            <div className="mp-profile-strip__badges">
              <span className="mp-profile-strip__badge mp-profile-strip__badge--ok"><CheckCircle size={10} /> KYC {client.kycStatus}</span>
              <span className="mp-profile-strip__badge mp-profile-strip__badge--ok"><Shield size={10} /> {client.lifecycleStage}</span>
              <span className="mp-profile-strip__badge mp-profile-strip__badge--ok">Reg BI: {client.regBIOptIn}</span>
              <span className="mp-profile-strip__badge mp-profile-strip__badge--warn">3rd Party: {client.consentThirdParty ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Single grid — same layout for everyone ── */}
      <div className="mp-grid">

        {/* ROW 1 LEFT: Portfolio Snapshot */}
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
                <span className="mp-snapshot-kpi__value" style={{ fontSize: '0.75rem' }}>{holdings.benchmark}</span>
              </div>
            )}
          </div>
          {holdings.performance && holdings.performance.length > 0 && (
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

        {/* ROW 1 RIGHT: Risks & Opportunities */}
        <section className="mp-card">
          <div className="mp-card__head">
            <div className="mp-card__icon mp-card__icon--warn"><AlertTriangle size={15} /></div>
            <h2 className="mp-card__title">Risks & Opportunities</h2>
            <AIBadge size="sm" />
          </div>
          {/* David only: behavioral risk metrics KPIs */}
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

        {/* ROW 2 LEFT: Recent Activity */}
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

        {/* ROW 2 RIGHT: Fund News */}
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

        {/* ROW 3 LEFT: Discussion Angles */}
        <section className="mp-card mp-card--row3">
          <div className="mp-card__head">
            <div className="mp-card__icon"><MessageSquare size={15} /></div>
            <h2 className="mp-card__title">{isDavid ? 'Decision Angles' : 'Discussion Angles'}</h2>
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

        {/* ROW 3 RIGHT: Next Best Actions */}
        <section className="mp-card mp-card--row3">
          <div className="mp-card__head">
            <div className="mp-card__icon mp-card__icon--accent"><Rocket size={15} /></div>
            <h2 className="mp-card__title">Next Best Actions</h2>
            <AIBadge size="sm" />
          </div>
          <div className="mp-nba-grid">
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
              <button className="mp-view-more" style={{ marginTop: '10px' }}>
                View Agent Reasoning <ChevronDown size={12} />
              </button>
            </div>
          </div>
        </section>

      </div>

      {/* ── Quick Links ── */}
      <div className="mp-quicklinks">
        <span className="mp-ql-label">Jump to</span>
        <button className="mp-ql-btn" onClick={() => navigate(`/client/${clientId}/rebalancing`)}>
          <TrendingUp size={12} /> Rebalancing
        </button>
        <button className="mp-ql-btn" onClick={() => navigate(`/client/${clientId}/risk-analysis`)}>
          <AlertTriangle size={12} /> Risk Analysis
        </button>
        <button className="mp-ql-btn" onClick={() => navigate(`/client/${clientId}/profile`)}>
          <User size={12} /> Profile
        </button>
        <button className="mp-ql-btn" onClick={() => navigate(`/client/${clientId}/ips`)}>
          <Shield size={12} /> IPS
        </button>
      </div>

    </div>
  );
};

export default MeetingPrep;
