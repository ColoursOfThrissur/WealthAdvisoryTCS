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
    totalValue: '$500,000',
    allocation: [
      { asset: 'Equity', pct: 52, value: '$260K', target: 60, diff: -8, status: 'underweight' },
      { asset: 'Bonds', pct: 43, value: '$215K', target: 35, diff: +8, status: 'overweight' },
      { asset: 'Cash', pct: 5, value: '$25K', target: 5, diff: 0, status: 'on-target' },
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
      'Rebalancing Upside: Moving toward target allocation could enhance returns',
      'International Value: AEPGX showing strong recovery and relative undervaluation',
      'Phased Approach: Client has approved gradual rebalancing strategy',
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
    'US Large-Cap Growth: Tech-heavy funds showing high volatility after strong rally',
    'International equities (AEPGX) lagging but relatively undervalued vs US markets',
    'Bond markets stabilizing, but interest rate uncertainty persists',
    'Increasing interest in income + dividend strategies for stability',
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
    'Frame AEPGX underperformance as a diversification benefit with recovery upside',
    'Present phased rebalancing as lower-risk path vs lump-sum — aligns with client preference',
    'Highlight that bond overweight is stable but capping growth potential',
    'Use Phase 1 approval momentum to build confidence for larger future rebalancing',
  ],
};

const RECOMMENDED_ACTIONS = {
  '15600001': [
    { label: 'Execute Phase 1', desc: 'Proceed with approved $10K bond-to-equity rebalance targeting AMECX and AEPGX', priority: 'high' },
    { label: 'Schedule Follow-up', desc: 'Book review meeting within one month of Phase 1 execution', priority: 'medium' },
    { label: 'Build Toward Target', desc: 'Work toward 60/35/5 allocation over 3-4 phases across 6 months', priority: 'low' },
  ],
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
              <h2 className="mp-card__title">Holdings</h2>
              <AIBadge size="sm" />
            </div>
            <p className="mp-card__desc">Portfolio Value: {holdings.totalValue}</p>
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
            {holdings.keyInsight && <p className="mp-card__insight">{holdings.keyInsight}</p>}
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

          {/* Discussion Angles */}
          <section className="mp-card">
            <div className="mp-card__head">
              <div className="mp-card__icon"><MessageSquare size={15} /></div>
              <h2 className="mp-card__title">Discussion Angles</h2>
              <AIBadge size="sm" />
            </div>
            <ul className="mp-bullets">
              {angles.map((a, i) => <li key={i}>{a}</li>)}
            </ul>
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
              {risk.risks.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
            <h3 className="mp-card__sub" style={{ marginTop: '0.75rem' }}>Opportunities</h3>
            <ul className="mp-bullets mp-bullets--opp">
              {risk.opportunities.map((o, i) => <li key={i}>{o}</li>)}
            </ul>
          </section>

          {/* Client in the News */}
          <section className="mp-card">
            <div className="mp-card__head">
              <div className="mp-card__icon"><Newspaper size={15} /></div>
              <h2 className="mp-card__title">Client in the News</h2>
              <AIBadge size="sm" />
            </div>
            <ul className="mp-bullets">
              {news.map((n, i) => <li key={i}>{n}</li>)}
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
          <h2 className="mp-card__title">Recommended Actions</h2>
          <AIBadge size="sm" />
        </div>
        <div className="mp-actions-row">
          {actions.map((a, i) => (
            <div key={i} className={`mp-action-item mp-action-item--${a.priority}`}>
              <div className="mp-action-item__head">
                <CheckCircle size={14} />
                <span className="mp-action-item__label">{a.label}</span>
                <span className={`mp-action-item__priority mp-action-item__priority--${a.priority}`}>{a.priority}</span>
              </div>
              <p className="mp-action-item__desc">{a.desc}</p>
            </div>
          ))}
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
