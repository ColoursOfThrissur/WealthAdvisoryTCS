import { useParams, useNavigate } from 'react-router-dom';
import {
  User, TrendingUp, Target, MessageSquare,
  BarChart3, AlertTriangle, CheckCircle, Download,
  Sparkles, Clock, Shield, Rocket, Newspaper, Calendar
} from 'lucide-react';
import AIBadge from '../components/AIBadge';
import './MeetingPrep.css';

const CLIENT_DATA = {
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
    keyInsight: 'AEPGX recovered +28.7% YoY; FSPGX moderated to +18.5%. Bond overweight limiting upside.',
  },
};

const RISK_DATA = {
  '15600001': {
    risks: [
      'Portfolio Drift: 8% underweight in equities, 8% overweight in bonds',
      'Growth Limitations: Bond overweight limiting long-term growth potential',
      'Concentration Risk: FSPGX (20%) is tech-heavy and high volatility',
      'Currency Exposure: International funds (AEPGX, CWBFX, ANWPX) subject to currency risk',
    ],
    opportunities: [
      'Growth and Target achievement with Rebalancing',
      'Diversification Opportunity with AEPGX',
      'Client Comfort aligned phased allocation',
    ],
  },
};

const ACTIVITY_DATA = {
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
  '15600001': [
    { date: 'Today', time: '10:00 AM', topic: 'Portfolio Drift & Rebalancing Review', type: 'In-person' },
    { date: 'Next Month', time: 'TBD', topic: 'Phase 1 Execution Follow-up', type: 'Virtual' },
  ],
};

const DISCUSSION_ANGLES = {
  '15600001': [
    { title: 'Portfolio Drift Check', desc: 'Review current equity underweight vs target and growth impact.' },
    { title: 'Rebalancing Approach', desc: 'Compare phased vs lump-sum rebalancing; reinforce gradual strategy.' },
    { title: 'Fund Performance Highlights', desc: 'Discuss international recovery, manage US growth volatility, and revisit bond role.' },
    { title: 'Execution Plan', desc: 'Confirm Phase-1 $10K rebalance, timing, and mechanics.' },
    { title: 'Next Milestone', desc: 'Set expectations for Phase-2 planning and schedule follow-up.' },
  ],
};

const RECOMMENDED_ACTIONS = {
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

  return (
    <div className="mp-page">

      {/* ── Compact Header ── */}
      <div className="mp-header">
        <div className="mp-header__title-row">
          <Sparkles size={18} style={{ color: 'var(--success)', flexShrink: 0 }} />
          <h1 className="mp-header__title">Meeting Prep — {client.name}</h1>
          <span className="mp-header__time">{client.meetingTime}</span>
        </div>
        <div className="mp-header__stats">
          <span className="mp-stat"><Shield size={12} /> {client.tier}</span>
          <span className="mp-stat"><TrendingUp size={12} /> {client.riskProfile}</span>
          <span className="mp-stat">{client.aum} AUM</span>
          <span className="mp-stat mp-stat--warn"><AlertTriangle size={12} /> {client.sentiment}</span>
          <span className="mp-stat mp-stat--accent"><Target size={12} /> {client.meetingGoal}</span>
          <button className="mp-export-btn"><Download size={13} /> Export</button>
        </div>
      </div>

      {/* ── Two-Column Grid ── */}
      <div className="mp-grid">

        {/* LEFT COLUMN */}
        <div className="mp-col">

          {/* Holdings */}
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
            </div>
            <div className="mp-table-wrap">
              <table className="mp-table">
                <thead><tr><th>Asset</th><th>Current</th><th>Target</th><th>Diff</th><th>Status</th></tr></thead>
                <tbody>
                  {holdings.allocation.map((r, i) => (
                    <tr key={i}>
                      <td className="mp-td--bold">{r.asset}</td>
                      <td>{r.pct}%</td>
                      <td>{r.target}%</td>
                      <td className={r.diff > 0 ? 'mp-td--neg' : r.diff < 0 ? 'mp-td--warn' : 'mp-td--ok'}>
                        {r.diff > 0 ? `+${r.diff}%` : r.diff < 0 ? `${r.diff}%` : '—'}
                      </td>
                      <td><span className={`mp-badge ${r.status === 'on-target' ? 'mp-badge--ok' : 'mp-badge--warn'}`}>{r.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {holdings.performance && holdings.performance.length > 0 && (
              <>
                <h3 className="mp-card__sub" style={{ marginTop: '12px' }}>Performance Trends</h3>
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
            {holdings.keyInsight && <p className="mp-card__insight">{holdings.keyInsight}</p>}
          </section>

          {/* Discussion Angles */}
          <section className="mp-card">
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

        </div>

        {/* RIGHT COLUMN */}
        <div className="mp-col">

          {/* Risks & Opportunities */}
          <section className="mp-card">
            <div className="mp-card__head">
              <div className="mp-card__icon mp-card__icon--warn"><AlertTriangle size={15} /></div>
              <h2 className="mp-card__title">Risks & Opportunities</h2>
              <AIBadge size="sm" />
            </div>
            <h3 className="mp-card__sub">Risks</h3>
            <ul className="mp-bullets mp-bullets--risk">
              {risk.risks.map((r, i) => {
                const [label, ...rest] = r.split(':');
                return <li key={i}><strong>{label}</strong>{rest.length ? `:${rest.join(':')}` : ''}</li>;
              })}
            </ul>
            <h3 className="mp-card__sub" style={{ marginTop: '0.75rem' }}>Opportunities</h3>
            <ul className="mp-bullets mp-bullets--opp">
              {risk.opportunities.map((o, i) => <li key={i}>{o}</li>)}
            </ul>
          </section>

          {/* Recent Activity */}
          <section className="mp-card">
            <div className="mp-card__head">
              <div className="mp-card__icon"><Clock size={15} /></div>
              <h2 className="mp-card__title">Recent Activity</h2>
            </div>
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
          </section>

          {/* Fund News */}
          <section className="mp-card">
            <div className="mp-card__head">
              <div className="mp-card__icon"><Newspaper size={15} /></div>
              <h2 className="mp-card__title">Fund News</h2>
              <AIBadge size="sm" />
            </div>
            <ul className="mp-bullets">
              {news.map((n, i) => {
                const [label, ...rest] = n.split(':');
                return <li key={i}><strong>{label}</strong>{rest.length ? `:${rest.join(':')}` : ''}</li>;
              })}
            </ul>
          </section>

          {/* Upcoming Meetings */}
          <section className="mp-card">
            <div className="mp-card__head">
              <div className="mp-card__icon"><Calendar size={15} /></div>
              <h2 className="mp-card__title">Upcoming Meetings</h2>
            </div>
            <div className="mp-meetings-list">
              {upcoming.map((m, i) => (
                <div key={i} className="mp-meeting-row">
                  <div className="mp-meeting-when">
                    <span className="mp-meeting-date">{m.date}</span>
                    <span className="mp-meeting-time">{m.time}</span>
                  </div>
                  <div className="mp-meeting-info">
                    <span className="mp-meeting-topic">{m.topic}</span>
                    <span className="mp-meeting-type">{m.type}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>

      {/* ── Full-Width Bottom: Recommended Actions ── */}
      <section className="mp-card mp-card--actions">
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
