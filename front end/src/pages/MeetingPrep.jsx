import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  User, TrendingUp, Target, MessageSquare,
  BarChart3, AlertTriangle, CheckCircle, Download,
  Sparkles, Clock, Shield, Rocket, Newspaper, ChevronDown
} from 'lucide-react';
import AIBadge from '../components/AIBadge';
import {
  CLIENT_DATA,
  HOLDINGS_DATA,
  RISK_DATA,
  ACTIVITY_DATA,
  CLIENT_NEWS,
  UPCOMING_MEETINGS,
  DISCUSSION_ANGLES,
  RECOMMENDED_ACTIONS,
  FALLBACK_CLIENT,
} from '../data/meetingPrepData';
import './MeetingPrep.css';

const MeetingPrep = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();

  const client   = CLIENT_DATA[clientId]        || FALLBACK_CLIENT;
  const holdings = HOLDINGS_DATA[clientId]      || HOLDINGS_DATA['15600001'];
  const risk     = RISK_DATA[clientId]          || RISK_DATA['15600001'];
  const activity = ACTIVITY_DATA[clientId]      || ACTIVITY_DATA['15600001'];
  const news     = CLIENT_NEWS[clientId]        || CLIENT_NEWS['15600001'];
  const upcoming = UPCOMING_MEETINGS[clientId]  || UPCOMING_MEETINGS['15600001'];
  const angles   = DISCUSSION_ANGLES[clientId]  || DISCUSSION_ANGLES['15600001'];
  const actions  = RECOMMENDED_ACTIONS[clientId]|| RECOMMENDED_ACTIONS['15600001'];

  const isEnhanced = clientId === 'C005' || clientId === 'C012';

  const [newsExpanded,     setNewsExpanded]     = useState(false);
  const [activityExpanded, setActivityExpanded] = useState(false);
  const [anglesExpanded,   setAnglesExpanded]   = useState(false);
  const [showScript,       setShowScript]       = useState(false);
  const [reasoningAction,  setReasoningAction]  = useState(null);

  return (
    <div className="mp-page">

      {/* ── Header ── */}
      <div className="mp-header">
        <div className="mp-header__title-row">
          <Sparkles size={18} style={{ color: isEnhanced ? 'var(--error)' : 'var(--success)', flexShrink: 0 }} />
          <h1 className="mp-header__title">Meeting Prep — {client.name}</h1>
          {isEnhanced && <span className="mp-header__critical">{client.riskStatus}</span>}
          <span className="mp-header__time">{client.meetingTime}</span>
          <button className="mp-export-btn"><Download size={13} /> Export</button>
        </div>
        {isEnhanced && (
          <p className="mp-header__insight">{client.profileIntro}</p>
        )}
        <div className="mp-header__stats">
          <span className="mp-stat"><Shield size={12} /> {client.tier}</span>
          <span className="mp-stat">{client.aum} AUM</span>
          <span className="mp-stat mp-stat--warn"><AlertTriangle size={12} /> {client.sentiment}</span>
          <span className="mp-stat mp-stat--accent"><Target size={12} /> {client.meetingGoal}</span>
        </div>
      </div>

      {/* ── Enhanced clients: reason strip ── */}
      {isEnhanced && (
        <div className="mp-nba-reason">
          <span>{client.nbaTrigger}</span>
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
            {isEnhanced && holdings.returns && (
              <div className="mp-snapshot-kpi">
                <span className="mp-snapshot-kpi__label">1-Year Return</span>
                <span className="mp-snapshot-kpi__value mp-snapshot-kpi__value--positive">
                  {holdings.returns.find(r => r.label === '1-Year')?.value}
                </span>
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
              {holdings.keyInsight.map((line, i) => (
                <div key={i} className="mp-insight-bullet">
                  <span className="mp-insight-bullet__dot" />
                  <span>{line}</span>
                </div>
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
          {isEnhanced && risk.riskMetrics && (
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
            <h2 className="mp-card__title">Discussion Angles</h2>
            <button className="mp-script-btn" onClick={() => setShowScript(true)}>Show Script</button>
            <AIBadge size="sm" />
          </div>
          <div className={`mp-collapsible-body${anglesExpanded ? ' mp-collapsible-body--expanded' : ''}`}>
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
          </div>
          <button className="mp-view-more" onClick={() => setAnglesExpanded(p => !p)}>
            {anglesExpanded ? 'Show less' : 'View more'} <ChevronDown size={12} className={anglesExpanded ? 'mp-chevron--up' : ''} />
          </button>
        </section>

        {/* ROW 3 RIGHT: Next Best Actions */}
        <section className="mp-card mp-card--row3">
          <div className="mp-card__head">
            <div className="mp-card__icon mp-card__icon--accent"><Rocket size={15} /></div>
            <h2 className="mp-card__title">Next Best Actions</h2>
            <AIBadge size="sm" />
          </div>
          <div className="mp-nba-list">
            {actions.primary.map((a, i) => (
              <div key={i} className="mp-nba-card mp-nba-card--primary">
                <div className="mp-nba-card__head">
                  <CheckCircle size={14} />
                  <span className="mp-nba-card__title">{a.label}</span>
                  <button className="mp-view-more mp-view-more--reasoning" onClick={() => a.reasoning && setReasoningAction(a)}>
                    View Agent Reasoning <ChevronDown size={11} />
                  </button>
                </div>
                <p className="mp-nba-card__desc">{a.desc}</p>
              </div>
            ))}
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

      {/* ── Script Modal ── */}
      {showScript && (
        <div className="mp-modal-overlay" onClick={() => setShowScript(false)}>
          <div className="mp-modal" onClick={e => e.stopPropagation()}>
            <div className="mp-modal__head">
              <h3 className="mp-modal__title">NBC Script</h3>
              <button className="mp-modal__close" onClick={() => setShowScript(false)}>✕</button>
            </div>
            <div className="mp-modal__body">
              <p className="mp-modal__script">{client.nbcScript || 'Script coming soon.'}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Agent Reasoning Modal ── */}
      {reasoningAction && (
        <div className="mp-modal-overlay" onClick={() => setReasoningAction(null)}>
          <div className="mp-modal" onClick={e => e.stopPropagation()}>
            <div className="mp-modal__head">
              <h3 className="mp-modal__title">Agent Reasoning — {reasoningAction.label}</h3>
              <button className="mp-modal__close" onClick={() => setReasoningAction(null)}>✕</button>
            </div>
            <div className="mp-modal__body">
              <p className="mp-modal__script">{reasoningAction.reasoning}</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MeetingPrep;
