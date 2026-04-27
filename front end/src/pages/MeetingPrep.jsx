import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  ArrowLeft, Home, User, TrendingUp, Target, MessageSquare,
  Lightbulb, BarChart3, AlertTriangle, CheckCircle, Download,
  Send, Sparkles, Clock, Shield, ChevronDown, ChevronUp,
  Search, Compass, Brain, ArrowUpDown, MinusCircle, PlusCircle,
  Map, Activity
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
    bio: 'Marketing executive navigating mid-career and family priorities. Focused on financial independence, securing children\'s college funds and retirement.',
  }
};

const PORTFOLIO_SNAPSHOT = [
  { assetClass: 'Equities', current: 66.2, target: 60, variance: +6.2, status: 'overweight' },
  { assetClass: 'Fixed Income', current: 29.5, target: 35, variance: -5.5, status: 'underweight' },
  { assetClass: 'Cash / Equiv.', current: 4.3, target: 5, variance: -0.7, status: 'on-target' },
];

const RECOMMENDED_TRADES = [
  { action: 'TRIM', ticker: 'ABNDX', name: 'American Funds Bond Fund of America', rationale: 'Bond overweight', clientBrainRationale: 'Reduces rate sensitivity that historically triggers client anxiety', amount: '$20,000', type: 'sell' },
  { action: 'TRIM', ticker: 'CWBFX', name: 'American Funds Capital World Bond', rationale: 'Diversification trim', clientBrainRationale: 'High macro complexity relative to client confidence', amount: '$20,000', type: 'sell' },
  { action: 'ADD', ticker: 'AMECX', name: 'American Funds Investment Co. of America', rationale: 'Income stability', clientBrainRationale: 'Reinforces income narrative aligned with client\'s comfort anchor', amount: '$20,000', type: 'buy' },
  { action: 'ADD', ticker: 'AEPGX', name: 'American Funds EuroPacific Growth', rationale: 'Intl diversification', clientBrainRationale: 'Proven psychological tolerance historically > US growth volatility', amount: '$20,000', type: 'buy' },
];

const ADVISORY_ACTIONS = [
  { icon: Search, label: 'Cost Efficiency', detail: 'Review portfolio expense ratios — CWBFX at 0.98% is highest; consider lower-cost alternatives.' },
  { icon: Compass, label: 'Objective Alignment', detail: 'Reinforce long-term investment strategy and IPS objectives with client.' },
];

const DISCUSSION_ANGLES = [
  {
    icon: BarChart3,
    label: 'Portfolio Perspective',
    color: 'info',
    original: 'Equity underallocation',
    originalDetail: '"Mary, your portfolio is currently over-allocated to equities relative to our long-term target. We want to correct this drift to ensure your risk stays within the agreed IPS boundaries."',
    clientBrain: 'Gap relative to client\'s behavioral tolerance',
    clientBrainDetail: '"Mary, based on how you\'ve responded to past market swings, we\'re adjusting your equity exposure to sit within the range where you\'ve historically felt most comfortable — not just what the model says."',
  },
  {
    icon: Brain,
    label: 'Behavioural Perspective',
    color: 'warning',
    original: 'Gradual changes',
    originalDetail: '"I know market headlines have been stressful. That\'s why we are implementing these changes gradually, rather than all at once, to reduce volatility and keep things smooth."',
    clientBrain: 'Matched to historical approval delays',
    clientBrainDetail: '"We\'re pacing these changes in line with how you\'ve approved adjustments before — smaller, deliberate steps that align with your decision-making style."',
  },
  {
    icon: Activity,
    label: 'Fund-Level Perspective',
    color: 'success',
    original: 'Tactical adjustment',
    originalDetail: '"We are trimming ABNDX and CWBFX which have drifted above target, and adding back to AMECX and AEPGX to restore your allocation and reduce overall portfolio beta."',
    clientBrain: 'Validated as optimal move with future scenarios',
    clientBrainDetail: '"We ran this adjustment through multiple future scenarios — including the ones that have worried you most — and this rebalance holds up well across all of them."',
  },
  {
    icon: Map,
    label: 'Strategic Perspective',
    color: 'primary',
    original: 'Statement',
    originalDetail: '"Think of this as a routine tune-up. This is a realignment to your existing, proven strategy — not a change in our overall game plan. Your long-term objectives remain unchanged."',
    clientBrain: 'Validated as optimal move with future scenarios',
    clientBrainDetail: '"Your long-term plan remains intact. This is a precision adjustment — not a course change — and it\'s been validated against the scenarios most relevant to your goals."',
  },
];

const MeetingPrep = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [expandedAngle, setExpandedAngle] = useState(null);
  const [clientBrainEnabled, setClientBrainEnabled] = useState(false);

  const client = CLIENT_DATA[clientId] || CLIENT_DATA['15634602'];

  const getVarianceStatus = (status) => {
    if (status === 'overweight') return { label: 'Overweight', icon: <ArrowUpDown size={12} />, cls: 'mp-status--warn' };
    if (status === 'underweight') return { label: 'Underweight', icon: <MinusCircle size={12} />, cls: 'mp-status--warn' };
    return { label: 'On Target', icon: <CheckCircle size={12} />, cls: 'mp-status--ok' };
  };

  return (
    <div className="mp-page">
      {/* Header */}
      <div className="mp-header">
        <div className="mp-header__left">
          <button className="mp-back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} /> Back
          </button>
          <button className="mp-home-btn" onClick={() => navigate('/')}>
            <Home size={16} /> Client Cockpit
          </button>
        </div>
        <div className="mp-header__center">
          <div className="mp-header__badge"><Sparkles size={12} /> AI Meeting Prep</div>
          <h1 className="mp-header__title">Meeting Prep Dashboard</h1>
          <p className="mp-header__subtitle">{client.name}</p>
        </div>
        <div className="mp-header__right">
          <div
            className={`mp-brain-toggle ${clientBrainEnabled ? 'mp-brain-toggle--on' : ''}`}
            onClick={() => setClientBrainEnabled(p => !p)}
          >
            <Brain size={15} />
            <span>Client Brain</span>
            <div className="mp-brain-toggle__switch">
              <div className="mp-brain-toggle__knob" />
            </div>
          </div>
          <button className="mp-action-btn mp-action-btn--ghost">
            <Download size={15} /> Export PDF
          </button>
          <button className="mp-action-btn mp-action-btn--primary">
            <Send size={15} /> Send Orders to Draft
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

        {/* Section 1: Portfolio Snapshot */}
        <section className="mp-section">
          <div className="mp-section__head">
            <div className="mp-section__num">1</div>
            <BarChart3 size={18} />
            <h2 className="mp-section__title">Portfolio Snapshot: Current vs. Target</h2>
            <AIBadge size="sm" />
          </div>
          <p className="mp-section__desc">AI has identified a drift from the target allocation — primarily an equity overweight and fixed-income underweight.</p>
          <div className="mp-table-wrap">
            <table className="mp-table">
              <thead>
                <tr>
                  <th>Asset Class</th>
                  <th>Current Allocation</th>
                  <th>Target Allocation</th>
                  <th>Variance</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {PORTFOLIO_SNAPSHOT.map((row, i) => {
                  const s = getVarianceStatus(row.status);
                  return (
                    <tr key={i}>
                      <td className="mp-td--bold">{row.assetClass}</td>
                      <td>{row.current}%</td>
                      <td>{row.target}%</td>
                      <td className={row.variance > 0 ? 'mp-td--neg' : row.variance < 0 ? 'mp-td--warn' : 'mp-td--ok'}>
                        {row.variance > 0 ? `+${row.variance}%` : `${row.variance}%`}
                      </td>
                      <td><span className={`mp-status ${s.cls}`}>{s.icon}{s.label}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 2: Next Best Action */}
        <section className="mp-section">
          <div className="mp-section__head">
            <div className="mp-section__num">2</div>
            <Target size={18} />
            <h2 className="mp-section__title">Next Best Action: Portfolio & Account</h2>
            <AIBadge size="sm" />
          </div>

          <div className="mp-subsection">
            <h3 className="mp-subsection__title">A. Recommended Trades — Rebalance ~$40,000</h3>
            <div className="mp-table-wrap">
              <table className="mp-table">
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>Fund</th>
                    <th>Original Rationale</th>
                    {clientBrainEnabled && (
                      <th className="mp-th--brain"><Brain size={12} /> Rationale with Client Brain</th>
                    )}
                    <th>Est. Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {RECOMMENDED_TRADES.map((t, i) => (
                    <tr key={i}>
                      <td>
                        <span className={`mp-trade-badge mp-trade-badge--${t.type}`}>
                          {t.type === 'sell' ? <MinusCircle size={12} /> : <PlusCircle size={12} />}
                          {t.action}
                        </span>
                      </td>
                      <td className="mp-td--ticker">{t.ticker}</td>
                      <td className="mp-td--muted">{t.rationale}</td>
                      {clientBrainEnabled && (
                        <td className="mp-td--brain">{t.clientBrainRationale}</td>
                      )}
                      <td className="mp-td--bold">{t.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mp-subsection">
            <h3 className="mp-subsection__title">B. Advisory & Account Actions</h3>
            <div className="mp-advisory-grid">
              {ADVISORY_ACTIONS.map((a, i) => (
                <div key={i} className="mp-advisory-item">
                  <span className="mp-advisory-icon"><a.icon size={18} /></span>
                  <div>
                    <span className="mp-advisory-label">{a.label}</span>
                    <p className="mp-advisory-detail">{a.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 3: Discussion Angles */}
        <section className="mp-section">
          <div className="mp-section__head">
            <div className="mp-section__num">3</div>
            <MessageSquare size={18} />
            <h2 className="mp-section__title">Discussion Angles for Client Interaction</h2>
          </div>
          <p className="mp-section__desc">Use these talking points to guide the conversation with confidence and clarity.</p>

          <div className="mp-table-wrap">
            <table className="mp-table">
              <thead>
                <tr>
                  <th>Angle</th>
                  <th>Original</th>
                  {clientBrainEnabled && <th className="mp-th--brain"><Brain size={12} /> With Client Brain</th>}
                </tr>
              </thead>
              <tbody>
                {DISCUSSION_ANGLES.map((a, i) => (
                  <tr key={i}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="mp-angle-icon" style={{ width: 28, height: 28 }}><a.icon size={14} /></span>
                        <span className="mp-td--bold">{a.label}</span>
                      </div>
                    </td>
                    <td className="mp-td--muted">{a.original}</td>
                    {clientBrainEnabled && <td className="mp-td--brain">{a.clientBrain}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 4: AI Bottom Line */}
        <section className="mp-section mp-section--highlight">
          <div className="mp-section__head">
            <div className="mp-section__num">4</div>
            <Lightbulb size={18} />
            <h2 className="mp-section__title">AI Bottom Line: Overall Portfolio Quality</h2>
            <AIBadge size="sm" />
          </div>
          <div className="mp-bottomline">
            <div className="mp-bottomline__icon"><CheckCircle size={32} /></div>
            <div className="mp-bottomline__body">
              <p className="mp-bottomline__label">System Assessment</p>
              <p className="mp-bottomline__text">
                The portfolio remains well-constructed, diversified, and aligned with the client's long-term objectives.
                The recommended actions are purely <strong>tactical adjustments</strong> designed to enhance strategic adherence
                while maintaining prudent risk management. The equity overweight is driven by strong growth-fund performance —
                a positive signal — but must be corrected to stay within IPS bounds.
                <strong> Proceed with confidence.</strong>
              </p>
              <div className="mp-bottomline__metrics">
                <div className="mp-bl-metric">
                  <span className="mp-bl-metric__val">$577K</span>
                  <span className="mp-bl-metric__label">Portfolio AUM</span>
                </div>
                <div className="mp-bl-metric">
                  <span className="mp-bl-metric__val mp-bl-metric__val--warn">3</span>
                  <span className="mp-bl-metric__label">IPS Breaches</span>
                </div>
                <div className="mp-bl-metric">
                  <span className="mp-bl-metric__val">4</span>
                  <span className="mp-bl-metric__label">Trade Recos</span>
                </div>
                <div className="mp-bl-metric">
                  <span className="mp-bl-metric__val mp-bl-metric__val--green">~$40K</span>
                  <span className="mp-bl-metric__label">Rebalance Amount</span>
                </div>
                {clientBrainEnabled && (
                  <div className="mp-bl-metric mp-bl-metric--brain">
                    <div className="mp-acceptance-wrap">
                      <div className="mp-acceptance-row">
                        <span className="mp-acceptance-tag mp-acceptance-tag--orig">Original</span>
                        <div className="mp-acceptance-bar">
                          <div className="mp-acceptance-bar__fill mp-acceptance-bar__fill--orig" style={{ width: '40%' }} />
                        </div>
                        <span className="mp-acceptance-val">0.4</span>
                      </div>
                      <div className="mp-acceptance-row">
                        <span className="mp-acceptance-tag mp-acceptance-tag--brain">Client Brain</span>
                        <div className="mp-acceptance-bar">
                          <div className="mp-acceptance-bar__fill mp-acceptance-bar__fill--brain" style={{ width: '80%' }} />
                        </div>
                        <span className="mp-acceptance-val mp-acceptance-val--brain">0.8</span>
                      </div>
                    </div>
                    <span className="mp-bl-metric__label">Acceptance Probability</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <p className="mp-footer-note">*** End of AI Prep Brief</p>
        </section>

        {/* Quick Links */}
        <div className="mp-quicklinks">
          <button className="mp-ql-btn" onClick={() => navigate(`/client/15634602/rebalancing`)}>
            <TrendingUp size={15} /> View Full Rebalancing →
          </button>
          <button className="mp-ql-btn" onClick={() => navigate(`/client/15634602/risk-analysis`)}>
            <AlertTriangle size={15} /> Risk Analysis →
          </button>
          <button className="mp-ql-btn" onClick={() => navigate(`/client/15634602/profile`)}>
            <User size={15} /> Client Profile →
          </button>
          <button className="mp-ql-btn" onClick={() => navigate(`/client/15634602/ips`)}>
            <Shield size={15} /> IPS Document →
          </button>
        </div>

      </div>
    </div>
  );
};

export default MeetingPrep;
