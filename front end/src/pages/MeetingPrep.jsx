import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  User, TrendingUp, Target, MessageSquare,
  Lightbulb, BarChart3, AlertTriangle, CheckCircle, Download,
  Sparkles, Clock, Shield, ArrowUpRight, ArrowDownRight, Minus,
  Rocket, Newspaper, Activity, ChevronRight
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
    meetingGoal: 'Reassess portfolio drift and evaluate rebalancing', meetingTime: '10:00 AM Today',
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
    funds: [
      { ticker: 'FSPGX', name: 'Fidelity Large Cap Growth Index', weight: 20, y2024: '+33.26%', y2025: '+18.53%', trend: 'down' },
      { ticker: 'AGTHX', name: 'American Funds Growth Fund', weight: 18, y2024: '+28.43%', y2025: '+19.93%', trend: 'down' },
      { ticker: 'ABNDX', name: 'American Funds Bond Fund', weight: 18, y2024: 'Steady', y2025: 'Improving', trend: 'up' },
      { ticker: 'AEPGX', name: 'American Funds EuroPacific', weight: 17, y2024: '+4.66%', y2025: '+28.72%', trend: 'up' },
      { ticker: 'CWBFX', name: 'Capital World Bond', weight: 15, y2024: null, y2025: null, trend: null },
      { ticker: 'AMECX', name: 'Income Fund of America', weight: 10, y2024: null, y2025: null, trend: null },
      { ticker: 'AIVSX', name: 'Investment Co. of America', weight: 7, y2024: null, y2025: null, trend: null },
      { ticker: 'ANWPX', name: 'New Perspective Fund', weight: 7, y2024: null, y2025: null, trend: null },
    ],
  },
};

const RISK_DATA = {
  '15600001': {
    risks: [
      { text: 'Portfolio Drift: 8% underweight in equities, 8% overweight in bonds', severity: 'high' },
      { text: 'Growth Limitations: Bond overweight limiting long-term growth potential', severity: 'medium' },
      { text: 'Concentration Risk: FSPGX (20%) is tech-heavy and high volatility', severity: 'high' },
      { text: 'Currency Exposure: International funds subject to currency risk', severity: 'low' },
    ],
    opportunities: [
      { text: 'Rebalancing Upside: Moving toward target allocation could enhance returns', type: 'growth' },
      { text: 'International Value: AEPGX showing strong recovery and relative undervaluation', type: 'value' },
      { text: 'Phased Approach: Client has approved gradual rebalancing strategy', type: 'strategy' },
    ],
  },
};

const FUND_NEWS = {
  '15600001': {
    items: [
      { tag: 'Large-Cap', text: 'Tech-heavy funds like FSPGX showing high volatility after strong rally', sentiment: 'caution' },
      { tag: 'International', text: 'International equities (AEPGX) lagging but relatively undervalued vs US markets', sentiment: 'opportunity' },
      { tag: 'Bonds', text: 'Bond markets stabilizing, but interest rate uncertainty persists', sentiment: 'neutral' },
      { tag: 'Growth', text: 'Growth funds volatile but strong long-term return drivers', sentiment: 'positive' },
      { tag: 'Trend', text: 'Increasing interest in income + dividend strategies for stability', sentiment: 'neutral' },
    ],
  },
};

const INTERACTION_DATA = {
  '15600001': [
    {
      date: 'February 15, 2026', label: 'Meeting #2',
      summary: 'Reassessed portfolio drift. AEPGX underperformance framed as diversification benefit. Client approved Phase 1 rebalance of $10K from bonds to equities.',
      sentiment: 'Cautious but improving',
      outcome: 'Phase 1 approved',
    },
    {
      date: 'December 15, 2025', label: 'Meeting #1',
      summary: 'Reviewed portfolio drift amid market correction. Tech correction impact on FSPGX discussed. Client deferred rebalancing decision.',
      sentiment: 'Fearful and risk-averse',
      outcome: 'No action taken',
    },
  ],
};

const NEXT_STEPS = {
  '15600001': {
    immediate: [
      'Execute Phase 1: Proceed with approved $10K bond-to-equity rebalance',
      'Target Focus: Prioritize AMECX and AEPGX allocation increases',
    ],
    strategy: [
      'Continue phased approach — client prefers $10K increments',
      'Frame international underperformance as diversification benefit',
      'Use successful Phase 1 to build trust for larger rebalancing',
      'Work toward 60/35/5 allocation over 3-4 phases (6 months)',
    ],
  },
};

const AGENDA = {
  '15600001': [
    { time: '15 min', title: 'Portfolio Drift Assessment', points: ['Review 8% equity underweight', 'Impact of bond overweight on growth', 'Risk-adjusted return analysis'] },
    { time: '20 min', title: 'Rebalancing Approaches', points: ['Dollar-cost averaging vs lump-sum', 'Phased approach benefits', 'Tax implications'] },
    { time: '15 min', title: 'Fund Performance Review', points: ['AEPGX recovery outlook', 'FSPGX volatility management', 'Bond positioning amid rates'] },
    { time: '10 min', title: 'Implementation & Next Steps', points: ['Phase 1 execution timeline', 'Phase 2 expectations', 'Schedule next review'] },
  ],
};

const fallbackClient = {
  name: 'Client', tier: 'Standard', riskProfile: 'Moderate',
  lastInteraction: 'N/A', sentiment: 'N/A',
  meetingGoal: 'Portfolio Review', meetingTime: 'Today', aum: 'N/A', age: 0,
};

const TrendIcon = ({ trend }) => {
  if (trend === 'up') return <ArrowUpRight size={14} className="mp-trend mp-trend--up" />;
  if (trend === 'down') return <ArrowDownRight size={14} className="mp-trend mp-trend--down" />;
  if (trend === 'flat') return <Minus size={14} className="mp-trend mp-trend--flat" />;
  return <span className="mp-trend mp-trend--na">—</span>;
};

const MeetingPrep = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [hoveredFund, setHoveredFund] = useState(null);

  const client = CLIENT_DATA[clientId] || fallbackClient;
  const holdings = HOLDINGS_DATA[clientId] || HOLDINGS_DATA['15600001'];
  const risk = RISK_DATA[clientId] || RISK_DATA['15600001'];
  const news = FUND_NEWS[clientId] || FUND_NEWS['15600001'];
  const interactions = INTERACTION_DATA[clientId] || INTERACTION_DATA['15600001'];
  const nextSteps = NEXT_STEPS[clientId] || NEXT_STEPS['15600001'];
  const agenda = AGENDA[clientId] || AGENDA['15600001'];

  return (
    <div className="mp-page">

      {/* Header */}
      <div className="mp-header">
        <div className="mp-header__left" />
        <div className="mp-header__center">
          <div className="mp-header__badge"><Sparkles size={12} /> AI Meeting Prep</div>
          <h1 className="mp-header__title">{client.name}</h1>
          <p className="mp-header__subtitle">{client.meetingTime} · {client.riskProfile} · AUM {client.aum}</p>
        </div>
        <div className="mp-header__right">
          <button className="mp-action-btn mp-action-btn--ghost"><Download size={15} /> Export</button>
        </div>
      </div>

      {/* Banner */}
      <div className="mp-banner">
        <div className="mp-banner__item">
          <Shield size={14} />
          <span className="mp-banner__label">Tier</span>
          <span className="mp-banner__value mp-banner__value--gold">{client.tier}</span>
        </div>
        <div className="mp-banner__divider" />
        <div className="mp-banner__item">
          <Clock size={14} />
          <span className="mp-banner__label">Last Contact</span>
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

        {/* 1. Holdings Snapshot */}
        <section className="mp-card">
          <div className="mp-card__head">
            <BarChart3 size={18} />
            <h2>Holdings Snapshot</h2>
            <AIBadge size="sm" />
            <span className="mp-card__meta">Total: {holdings.totalValue}</span>
          </div>

          {/* Allocation summary chips */}
          <div className="mp-alloc-chips">
            {holdings.allocation.map((a, i) => (
              <div key={i} className={`mp-alloc-chip mp-alloc-chip--${a.status}`}>
                <span className="mp-alloc-chip__name">{a.asset}</span>
                <span className="mp-alloc-chip__pct">{a.pct}%</span>
                <span className="mp-alloc-chip__diff">{a.diff > 0 ? '+' : ''}{a.diff}%</span>
              </div>
            ))}
          </div>

          {/* Fund table */}
          <div className="mp-fund-table-wrap">
            <table className="mp-fund-table">
              <thead>
                <tr>
                  <th>Fund</th>
                  <th className="mp-th-right">Weight</th>
                  <th className="mp-th-right">2024</th>
                  <th className="mp-th-right">2025</th>
                  <th className="mp-th-center">Trend</th>
                </tr>
              </thead>
              <tbody>
                {holdings.funds.map((f, i) => (
                  <tr
                    key={i}
                    className={`mp-fund-row ${hoveredFund === i ? 'mp-fund-row--hover' : ''}`}
                    onMouseEnter={() => setHoveredFund(i)}
                    onMouseLeave={() => setHoveredFund(null)}
                  >
                    <td>
                      <span className="mp-fund-ticker">{f.ticker}</span>
                      <span className="mp-fund-name">{f.name}</span>
                    </td>
                    <td className="mp-td-right">
                      <div className="mp-weight-bar-wrap">
                        <div className="mp-weight-bar" style={{ width: `${(f.weight / 25) * 100}%` }} />
                        <span>{f.weight}%</span>
                      </div>
                    </td>
                    <td className="mp-td-right mp-td-perf">{f.y2024 || '—'}</td>
                    <td className="mp-td-right mp-td-perf">{f.y2025 || '—'}</td>
                    <td className="mp-td-center"><TrendIcon trend={f.trend} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 2. Risks & Opportunities */}
        <section className="mp-card">
          <div className="mp-card__head">
            <AlertTriangle size={18} />
            <h2>Risks & Opportunities</h2>
            <AIBadge size="sm" />
          </div>
          <div className="mp-risk-grid">
            <div className="mp-risk-col">
              <h3 className="mp-risk-col__title mp-risk-col__title--risk">Key Risks</h3>
              {risk.risks.map((r, i) => (
                <div key={i} className={`mp-risk-item mp-risk-item--${r.severity}`}>
                  <span className="mp-risk-dot" />
                  <span>{r.text}</span>
                </div>
              ))}
            </div>
            <div className="mp-risk-col">
              <h3 className="mp-risk-col__title mp-risk-col__title--opp">Opportunities</h3>
              {risk.opportunities.map((o, i) => (
                <div key={i} className="mp-risk-item mp-risk-item--opp">
                  <span className="mp-risk-dot" />
                  <span>{o.text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 3. Fund News */}
        <section className="mp-card">
          <div className="mp-card__head">
            <Newspaper size={18} />
            <h2>Market & Fund Insights</h2>
            <AIBadge size="sm" />
          </div>
          <div className="mp-news-grid">
            {news.items.map((n, i) => (
              <div key={i} className={`mp-news-chip mp-news-chip--${n.sentiment}`}>
                <span className="mp-news-tag">{n.tag}</span>
                <span className="mp-news-text">{n.text}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 4. Recent Activity */}
        <section className="mp-card">
          <div className="mp-card__head">
            <Activity size={18} />
            <h2>Recent Interactions</h2>
          </div>
          <div className="mp-timeline">
            {interactions.map((m, i) => (
              <div key={i} className="mp-tl-item">
                <div className="mp-tl-dot" />
                <div className="mp-tl-content">
                  <div className="mp-tl-head">
                    <span className="mp-tl-label">{m.label}</span>
                    <span className="mp-tl-date">{m.date}</span>
                    <span className={`mp-tl-sentiment ${m.outcome === 'No action taken' ? 'mp-tl-sentiment--warn' : 'mp-tl-sentiment--ok'}`}>
                      {m.outcome}
                    </span>
                  </div>
                  <p className="mp-tl-summary">{m.summary}</p>
                  <span className="mp-tl-mood">Sentiment: {m.sentiment}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 5. Next Steps */}
        <section className="mp-card mp-card--highlight">
          <div className="mp-card__head">
            <Rocket size={18} />
            <h2>Next Steps</h2>
            <AIBadge size="sm" />
          </div>
          <div className="mp-steps">
            <div className="mp-steps__primary">
              {nextSteps.immediate.map((s, i) => (
                <div key={i} className="mp-step-card mp-step-card--primary">
                  <CheckCircle size={16} />
                  <span>{s}</span>
                </div>
              ))}
            </div>
            <div className="mp-steps__secondary">
              <h3 className="mp-steps__subtitle">Strategy & Approach</h3>
              {nextSteps.strategy.map((s, i) => (
                <div key={i} className="mp-step-item">
                  <ChevronRight size={12} />
                  <span>{s}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6. Discussion Angles */}
        <section className="mp-card">
          <div className="mp-card__head">
            <MessageSquare size={18} />
            <h2>Discussion Agenda</h2>
          </div>
          <div className="mp-agenda">
            {agenda.map((item, i) => (
              <div key={i} className="mp-agenda-block">
                <div className="mp-agenda-block__head">
                  <span className="mp-agenda-num">{i + 1}</span>
                  <span className="mp-agenda-title">{item.title}</span>
                  <span className="mp-agenda-time">{item.time}</span>
                </div>
                <div className="mp-agenda-points">
                  {item.points.map((p, j) => (
                    <span key={j} className="mp-agenda-point">{p}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Quick Links */}
        <div className="mp-quicklinks">
          <button className="mp-ql-btn" onClick={() => navigate(`/client/${clientId}/rebalancing`)}>
            <TrendingUp size={15} /> Rebalancing →
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
