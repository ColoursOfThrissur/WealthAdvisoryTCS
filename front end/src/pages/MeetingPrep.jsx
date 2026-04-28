import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  User, TrendingUp, Target, MessageSquare,
  Lightbulb, BarChart3, AlertTriangle, CheckCircle, Download,
  Sparkles, Clock, Shield, ChevronDown, ChevronUp,
  Rocket, Newspaper, Activity
} from 'lucide-react';
import AIBadge from '../components/AIBadge';
import './MeetingPrep.css';

const CLIENT_DATA = {
  '15634602': {
    name: 'Mary Hargrave',
    tier: 'Platinum',
    riskProfile: 'Moderate Growth',
    lastInteraction: 'Q1 Review (3 months ago)',
    sentiment: 'Anxious about market volatility',
    meetingGoal: 'Portfolio Realignment & Strategy Reassurance',
    meetingTime: '10:00 AM Today',
    aum: '$577,000',
    age: 45,
  },
  '15600001': {
    name: 'Alex Morgan',
    tier: 'Gold',
    riskProfile: 'Moderate Growth',
    lastInteraction: 'February 15, 2026',
    sentiment: 'Cautious but improving',
    meetingGoal: 'Reassess increased portfolio drift and evaluate alternative rebalancing approaches',
    meetingTime: '10:00 AM Today',
    aum: '$500,000',
    age: 42,
  },
  '15740900': {
    name: 'Jean Williams',
    tier: 'Gold',
    riskProfile: 'Conservative',
    lastInteraction: 'Q4 Review (2 months ago)',
    sentiment: 'Focused on income stability',
    meetingGoal: 'Investment Planning & Income Strategy',
    meetingTime: '2:30 PM Today',
    aum: '$52,429',
    age: 34,
  },
  '15623828': {
    name: 'Marcus Thompson',
    tier: 'Silver',
    riskProfile: 'Low Risk',
    lastInteraction: 'Q3 Review (4 months ago)',
    sentiment: 'Capital preservation focused',
    meetingGoal: 'Portfolio Review & Allocation Adjustment',
    meetingTime: '4:00 PM Today',
    aum: '$41,185',
    age: 30,
  },
};

const HOLDINGS_DATA = {
  '15600001': {
    totalValue: '$500,000',
    allocation: [
      { asset: 'Equity', pct: 52, value: '$260K', target: 60, diff: -8, status: 'underweight' },
      { asset: 'Bonds', pct: 43, value: '$215K', target: 35, diff: +8, status: 'overweight' },
      { asset: 'Cash', pct: 5, value: '$25K', target: 5, diff: 0, status: 'on-target' },
    ],
    funds: [
      { ticker: 'FSPGX', name: 'Fidelity Large Cap Growth Index', weight: 20 },
      { ticker: 'AGTHX', name: 'American Funds Growth Fund of America', weight: 18 },
      { ticker: 'ABNDX', name: 'American Funds Bond Fund of America', weight: 18 },
      { ticker: 'AEPGX', name: 'American Funds EuroPacific Growth', weight: 17 },
      { ticker: 'CWBFX', name: 'American Funds Capital World Bond', weight: 15 },
      { ticker: 'AMECX', name: 'American Funds Income Fund of America', weight: 10 },
      { ticker: 'AIVSX', name: 'American Funds Investment Company of America', weight: 7 },
      { ticker: 'ANWPX', name: 'American Funds New Perspective', weight: 7 },
    ],
    performance: [
      { ticker: 'AEPGX', y2024: '+4.66%', y2025: '+28.72%', note: 'Strong recovery' },
      { ticker: 'FSPGX', y2024: '+33.26%', y2025: '+18.53%', note: 'Moderated' },
      { ticker: 'AGTHX', y2024: '+28.43%', y2025: '+19.93%', note: 'Declined' },
      { ticker: 'Bonds', y2024: 'Steady', y2025: 'Improving', note: 'Steady improvement' },
    ],
  },
};

const RISK_DATA = {
  '15600001': {
    metrics: [
      { label: 'Portfolio Beta', value: '0.88', note: 'Defensive vs market 1.00' },
      { label: 'Volatility', value: '~10.5%', note: 'Lower than benchmark 12-14%' },
      { label: 'Sharpe Ratio', value: '~0.72', note: 'Above benchmark 0.65' },
      { label: 'Max Drawdown', value: '-14%', note: 'Better than -20% benchmark' },
    ],
    risks: [
      'Portfolio Drift: 8% underweight in equities, 8% overweight in bonds',
      'Growth Limitations: Bond overweight limiting long-term growth potential',
      'Concentration Risk: FSPGX (20%) is tech-heavy and high volatility',
      'Currency Exposure: International funds (AEPGX, CWBFX, ANWPX) subject to currency risk',
    ],
    opportunities: [
      'Rebalancing Upside: Moving toward target allocation could enhance returns',
      'International Value: AEPGX showing strong recovery and relative undervaluation',
      'Phased Approach: Client has approved gradual rebalancing strategy',
    ],
  },
};

const INTERACTION_DATA = {
  '15600001': [
    {
      date: 'February 15, 2026',
      label: 'Meeting #2',
      objective: 'Reassess increased portfolio drift and evaluate alternative rebalancing approaches',
      points: ['AEPGX underperformance framed as diversification benefit', 'AGTHX expense ratio analysis'],
      sentiment: 'Cautious but improving',
      decision: 'Approved Phase 1 rebalance of $10K from bonds to equities',
      observation: 'Increased acceptance of advisor guidance with gradual execution',
    },
    {
      date: 'December 15, 2025',
      label: 'Meeting #1',
      objective: 'Review portfolio drift amid market correction',
      points: ['Tech correction impact on FSPGX', 'Diversification benefits discussed'],
      sentiment: 'Fearful and risk-averse',
      decision: 'No rebalancing executed; decision deferred',
      observation: 'Primary Concern: Risk of broader market downturn',
    },
  ],
};

const FUND_NEWS = {
  '15600001': {
    insights: [
      'US Large-Cap Growth: Tech-heavy funds like FSPGX showing high volatility after strong rally',
      'International Opportunities: International equities (AEPGX) lagging but relatively undervalued vs US markets',
      'Bond Market Stabilization: Bond markets stabilizing, but interest rate uncertainty persists',
    ],
    impact: [
      'Growth Funds: Volatile but strong long-term return drivers',
      'International Entry Point: Attractive entry opportunity for international exposure',
      'Bond Overweight: Currently stable but limiting upside potential',
    ],
    trends: [
      'Continued shift toward low-cost index funds',
      'Increasing interest in income + dividend strategies for stability',
    ],
  },
};

const CLIENT_ACTIONS = {
  '15600001': {
    immediate: [
      'Phase 1 Execution: Execute approved $10K rebalance from bonds to equities',
      'Follow-up Meeting: Schedule review meeting within one month of Phase 1 execution',
    ],
    deferred: [
      'December 2025: $20K-30K rebalancing recommendation was deferred',
      'Status: Client comfort level has improved since last meeting',
    ],
    requirements: [
      'Gradual Approach: Client prefers phased rebalancing in $10K increments',
      'Avoid Large Changes: Resistance to single-step allocation changes',
    ],
  },
};

const NEXT_BEST_ACTION = {
  '15600001': {
    primary: [
      'Execute Phase 1: Proceed with approved $10K bond-to-equity rebalance',
      'Target Focus: Prioritize AMECX and AEPGX allocation increases while maintaining FSPGX exposure',
    ],
    behavioral: [
      'Gradual Implementation: Continue phased approach given client\'s loss-averse profile',
      'Communication Focus: Frame international underperformance as diversification benefit',
      'Build Confidence: Use successful Phase 1 execution to gain trust for larger rebalancing',
    ],
    longterm: [
      'Target Achievement: Work toward 60% equity / 35% bond / 5% cash allocation',
      'Timeline: Expect 3-4 phases over 6-month period to reach target allocation',
    ],
  },
};

const AGENDA = {
  '15600001': [
    { time: '15 mins', title: 'Portfolio Drift Assessment', items: ['Review current 8% equity underweight vs target', 'Discuss impact of bond overweight on growth potential', 'Present risk-adjusted return analysis'] },
    { time: '20 mins', title: 'Alternative Rebalancing Approaches', items: ['Evaluate dollar-cost averaging vs lump-sum rebalancing', 'Compare phased approach benefits vs timing risk', 'Review tax implications of rebalancing strategy'] },
    { time: '15 mins', title: 'Fund Performance Review', items: ['AEPGX recovery analysis and international outlook', 'FSPGX volatility management in tech-heavy environment', 'Bond fund positioning amid rate environment'] },
    { time: '10 mins', title: 'Implementation Planning', items: ['Confirm Phase 1 execution timeline and mechanics', 'Set expectations for Phase 2 timing and size', 'Schedule next review meeting'] },
  ],
};

const fallbackClient = {
  name: 'Client',
  tier: 'Standard',
  riskProfile: 'Moderate',
  lastInteraction: 'N/A',
  sentiment: 'N/A',
  meetingGoal: 'Portfolio Review',
  meetingTime: 'Today',
  aum: 'N/A',
  age: 0,
};

const MeetingPrep = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [expandedSections, setExpandedSections] = useState({
    holdings: true, risks: true, history: true, news: true, actions: true, nba: true, agenda: true,
  });

  const client = CLIENT_DATA[clientId] || fallbackClient;
  const holdings = HOLDINGS_DATA[clientId] || HOLDINGS_DATA['15600001'];
  const risk = RISK_DATA[clientId] || RISK_DATA['15600001'];
  const interactions = INTERACTION_DATA[clientId] || INTERACTION_DATA['15600001'];
  const news = FUND_NEWS[clientId] || FUND_NEWS['15600001'];
  const clientActions = CLIENT_ACTIONS[clientId] || CLIENT_ACTIONS['15600001'];
  const nba = NEXT_BEST_ACTION[clientId] || NEXT_BEST_ACTION['15600001'];
  const agenda = AGENDA[clientId] || AGENDA['15600001'];

  const toggle = (key) => setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  const SectionHeader = ({ icon, title, sectionKey, badge }) => (
    <div className="mp-section__head" onClick={() => toggle(sectionKey)} style={{ cursor: 'pointer' }}>
      <div className="mp-section__num">{icon}</div>
      <h2 className="mp-section__title">{title}</h2>
      {badge && <AIBadge size="sm" />}
      <span style={{ marginLeft: 'auto' }}>{expandedSections[sectionKey] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</span>
    </div>
  );

  return (
    <div className="mp-page">
      {/* Header */}
      <div className="mp-header">
        <div className="mp-header__left">
        </div>
        <div className="mp-header__center">
          <div className="mp-header__badge"><Sparkles size={12} /> AI Meeting Prep</div>
          <h1 className="mp-header__title">Meeting Summary</h1>
          <p className="mp-header__subtitle">Meeting Preparation Brief — {client.name}</p>
        </div>
        <div className="mp-header__right">
          <button className="mp-action-btn mp-action-btn--ghost">
            <Download size={15} /> Export PDF
          </button>
        </div>
      </div>

      {/* Client Banner */}
      <div className="mp-banner">
        <div className="mp-banner__item">
          <User size={14} />
          <span className="mp-banner__label">Client</span>
          <span className="mp-banner__value">{client.name}</span>
        </div>
        <div className="mp-banner__divider" />
        <div className="mp-banner__item">
          <Shield size={14} />
          <span className="mp-banner__label">Tier</span>
          <span className="mp-banner__value mp-banner__value--gold">{client.tier}</span>
        </div>
        <div className="mp-banner__divider" />
        <div className="mp-banner__item">
          <TrendingUp size={14} />
          <span className="mp-banner__label">Risk Profile</span>
          <span className="mp-banner__value">{client.riskProfile}</span>
        </div>
        <div className="mp-banner__divider" />
        <div className="mp-banner__item">
          <Clock size={14} />
          <span className="mp-banner__label">Last Interaction</span>
          <span className="mp-banner__value">{client.lastInteraction}</span>
        </div>
        <div className="mp-banner__divider" />
        <div className="mp-banner__item">
          <AlertTriangle size={14} />
          <span className="mp-banner__label">Sentiment</span>
          <span className="mp-banner__value mp-banner__value--warn">{client.sentiment}</span>
        </div>
        <div className="mp-banner__divider" />
        <div className="mp-banner__item">
          <Target size={14} />
          <span className="mp-banner__label">Meeting Goal</span>
          <span className="mp-banner__value mp-banner__value--accent">{client.meetingGoal}</span>
        </div>
      </div>

      <div className="mp-content">

        {/* Holdings Snapshot */}
        <section className="mp-section">
          <SectionHeader icon={<BarChart3 size={18} />} title="Holdings Snapshot" sectionKey="holdings" badge />
          {expandedSections.holdings && (
            <>
              <p className="mp-section__desc">Portfolio Summary (As of 12/31/2025) — Total Portfolio Value: {holdings.totalValue}</p>
              <div className="mp-table-wrap">
                <table className="mp-table">
                  <thead><tr><th>Asset Class</th><th>Current %</th><th>Value</th><th>Target %</th><th>Diff</th><th>Status</th></tr></thead>
                  <tbody>
                    {holdings.allocation.map((r, i) => (
                      <tr key={i}>
                        <td className="mp-td--bold">{r.asset}</td>
                        <td>{r.pct}%</td>
                        <td>{r.value}</td>
                        <td>{r.target}%</td>
                        <td className={r.diff > 0 ? 'mp-td--neg' : r.diff < 0 ? 'mp-td--warn' : 'mp-td--ok'}>
                          {r.diff > 0 ? `+${r.diff}%` : r.diff < 0 ? `${r.diff}%` : '0%'}
                        </td>
                        <td><span className={`mp-status ${r.status === 'overweight' ? 'mp-status--warn' : r.status === 'underweight' ? 'mp-status--warn' : 'mp-status--ok'}`}>{r.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mp-subsection">
                <h3 className="mp-subsection__title">Fund Breakdown</h3>
                <div className="mp-table-wrap">
                  <table className="mp-table">
                    <thead><tr><th>Ticker</th><th>Fund Name</th><th>Weight</th></tr></thead>
                    <tbody>
                      {holdings.funds.map((f, i) => (
                        <tr key={i}>
                          <td className="mp-td--ticker">{f.ticker}</td>
                          <td>{f.name}</td>
                          <td className="mp-td--bold">{f.weight}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mp-subsection">
                <h3 className="mp-subsection__title">2024–2025 Performance Trends</h3>
                <div className="mp-table-wrap">
                  <table className="mp-table">
                    <thead><tr><th>Fund</th><th>2024</th><th>2025</th><th>Note</th></tr></thead>
                    <tbody>
                      {holdings.performance.map((p, i) => (
                        <tr key={i}>
                          <td className="mp-td--ticker">{p.ticker}</td>
                          <td>{p.y2024}</td>
                          <td>{p.y2025}</td>
                          <td className="mp-td--muted">{p.note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </section>

        {/* Risks & Opportunities */}
        <section className="mp-section">
          <SectionHeader icon={<AlertTriangle size={18} />} title="Risks & Opportunities" sectionKey="risks" badge />
          {expandedSections.risks && (
            <>
              <div className="mp-subsection">
                <h3 className="mp-subsection__title">Current Risk Metrics</h3>
                <div className="mp-metrics-grid">
                  {risk.metrics.map((m, i) => (
                    <div key={i} className="mp-metric-card">
                      <span className="mp-metric-card__value">{m.value}</span>
                      <span className="mp-metric-card__label">{m.label}</span>
                      <span className="mp-metric-card__note">{m.note}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mp-two-col">
                <div className="mp-subsection">
                  <h3 className="mp-subsection__title">Key Risks</h3>
                  <ul className="mp-list mp-list--risk">{risk.risks.map((r, i) => <li key={i}>{r}</li>)}</ul>
                </div>
                <div className="mp-subsection">
                  <h3 className="mp-subsection__title">Opportunities</h3>
                  <ul className="mp-list mp-list--opp">{risk.opportunities.map((o, i) => <li key={i}>{o}</li>)}</ul>
                </div>
              </div>
            </>
          )}
        </section>

        {/* Interaction History */}
        <section className="mp-section">
          <SectionHeader icon={<Clock size={18} />} title="Interaction History & Highlights" sectionKey="history" />
          {expandedSections.history && (
            <div className="mp-timeline">
              {interactions.map((m, i) => (
                <div key={i} className="mp-timeline-item">
                  <div className="mp-timeline-item__head">
                    <span className="mp-timeline-item__label">{m.label}</span>
                    <span className="mp-timeline-item__date">{m.date}</span>
                  </div>
                  <p className="mp-timeline-item__obj"><strong>Objective:</strong> {m.objective}</p>
                  <ul className="mp-list">{m.points.map((p, j) => <li key={j}>{p}</li>)}</ul>
                  <div className="mp-timeline-item__meta">
                    <span>Sentiment: <strong>{m.sentiment}</strong></span>
                    <span>Decision: <strong>{m.decision}</strong></span>
                  </div>
                  <p className="mp-timeline-item__obs">{m.observation}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Fund News */}
        <section className="mp-section">
          <SectionHeader icon={<Newspaper size={18} />} title="Fund News" sectionKey="news" badge />
          {expandedSections.news && (
            <div className="mp-two-col">
              <div className="mp-subsection">
                <h3 className="mp-subsection__title">Market Insights</h3>
                <ul className="mp-list">{news.insights.map((n, i) => <li key={i}>{n}</li>)}</ul>
                <h3 className="mp-subsection__title" style={{ marginTop: '1rem' }}>Portfolio Impact</h3>
                <ul className="mp-list">{news.impact.map((n, i) => <li key={i}>{n}</li>)}</ul>
              </div>
              <div className="mp-subsection">
                <h3 className="mp-subsection__title">Industry Trends</h3>
                <ul className="mp-list">{news.trends.map((t, i) => <li key={i}>{t}</li>)}</ul>
              </div>
            </div>
          )}
        </section>

        {/* Client Actions Due */}
        <section className="mp-section">
          <SectionHeader icon={<CheckCircle size={18} />} title="Client Actions Due" sectionKey="actions" />
          {expandedSections.actions && (
            <>
              <div className="mp-subsection">
                <h3 className="mp-subsection__title">Immediate Actions</h3>
                <ul className="mp-list mp-list--action">{clientActions.immediate.map((a, i) => <li key={i}>{a}</li>)}</ul>
              </div>
              <div className="mp-subsection">
                <h3 className="mp-subsection__title">Previously Deferred</h3>
                <ul className="mp-list">{clientActions.deferred.map((d, i) => <li key={i}>{d}</li>)}</ul>
              </div>
              <div className="mp-subsection">
                <h3 className="mp-subsection__title">Client Requirements</h3>
                <ul className="mp-list">{clientActions.requirements.map((r, i) => <li key={i}>{r}</li>)}</ul>
              </div>
            </>
          )}
        </section>

        {/* Next Best Action */}
        <section className="mp-section mp-section--highlight">
          <SectionHeader icon={<Rocket size={18} />} title="Next Best Action" sectionKey="nba" badge />
          {expandedSections.nba && (
            <>
              <div className="mp-subsection">
                <h3 className="mp-subsection__title">Primary Recommendation</h3>
                <ul className="mp-list mp-list--action">{nba.primary.map((p, i) => <li key={i}>{p}</li>)}</ul>
              </div>
              <div className="mp-subsection">
                <h3 className="mp-subsection__title">Behavioral Strategy</h3>
                <ul className="mp-list">{nba.behavioral.map((b, i) => <li key={i}>{b}</li>)}</ul>
              </div>
              <div className="mp-subsection">
                <h3 className="mp-subsection__title">Long-term Positioning</h3>
                <ul className="mp-list">{nba.longterm.map((l, i) => <li key={i}>{l}</li>)}</ul>
              </div>
            </>
          )}
        </section>

        {/* Discussion Angles & Agenda */}
        <section className="mp-section">
          <SectionHeader icon={<MessageSquare size={18} />} title="Discussion Angles & Agenda" sectionKey="agenda" />
          {expandedSections.agenda && (
            <div className="mp-agenda">
              {agenda.map((item, i) => (
                <div key={i} className="mp-agenda-item">
                  <div className="mp-agenda-item__head">
                    <span className="mp-agenda-item__num">{i + 1}</span>
                    <span className="mp-agenda-item__title">{item.title}</span>
                    <span className="mp-agenda-item__time">{item.time}</span>
                  </div>
                  <ul className="mp-list">
                    {item.items.map((pt, j) => <li key={j}>{pt}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Quick Links */}
        <div className="mp-quicklinks">
          <button className="mp-ql-btn" onClick={() => navigate(`/client/${clientId}/rebalancing`)}>
            <TrendingUp size={15} /> View Full Rebalancing →
          </button>
          <button className="mp-ql-btn" onClick={() => navigate(`/client/${clientId}/risk-analysis`)}>
            <AlertTriangle size={15} /> Risk Analysis →
          </button>
          <button className="mp-ql-btn" onClick={() => navigate(`/client/${clientId}/profile`)}>
            <User size={15} /> Client Profile →
          </button>
          <button className="mp-ql-btn" onClick={() => navigate(`/client/${clientId}/ips`)}>
            <Shield size={15} /> IPS Document →
          </button>
        </div>

      </div>
    </div>
  );
};

export default MeetingPrep;
