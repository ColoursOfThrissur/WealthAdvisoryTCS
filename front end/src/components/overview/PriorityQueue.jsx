import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, ArrowRight } from 'lucide-react';
import worklistData from '../../data/worklistCustomers.json';
import Tooltip from '../Tooltip';
import { formatCurrency, formatPercent } from '../../utils/formatters';
import './OverviewShared.css';
import './PriorityQueue.css';

const buildProfiles = () => [
  ...worklistData.rebalancing.filter(c => c.CustomerID !== 15740900 && c.CustomerID !== 15623828).slice(0, 1).map(c => ({
    id: c.CustomerID,
    name: `${c.FirstName} ${c.Surname}`,
    aum: c.NetAssets, ret: c.PortfolioReturn, risk: c.RiskProfile,
    creditScore: c.CreditScore, age: c.Age,
    priority: c.Priority || 'Medium',
    riskLabel: c.FirstName === 'Mary' ? 'Moderate Growth' : null,
    profession: c.BusinessOwner ? 'business owner' : (c.FirstName === 'Mary' ? 'marketing executive' : null),
    trigger: c.Trigger, rebalanceReason: c.RebalanceReason,
    keyContext: c.KeyContext || [],
    intro: [`${c.Age}y/o`, c.RiskProfile >= 0.35 ? 'moderate growth' : c.RiskProfile >= 0.2 ? 'moderate' : 'conservative',
      c.BusinessOwner ? 'business owner' : (c.FirstName === 'Mary' ? 'marketing executive' : null),
      `${c.NumProducts} product${c.NumProducts !== 1 ? 's' : ''}`].filter(Boolean).join(' · '),
    actions: Array.isArray(c.RecommendedActions) && c.RecommendedActions.length && typeof c.RecommendedActions[0] === 'object'
      ? c.RecommendedActions
      : [
          { label: c.RebalanceReason, route: `/client/${c.CustomerID}/rebalancing` },
          ...(c.FirstName === 'Mary' ? [{ label: 'Meeting Prep — 10:00 AM', route: `/meeting-prep/${c.CustomerID}` }] : []),
          ...(c.PortfolioReturn > 0.12 ? [{ label: 'Investment Proposal', route: '/worklist/proposals' }] : []),
        ],
  })),
  { id: 15678284, name: 'Sam Pai', aum: 390000, ret: 0.087, risk: 0.23, creditScore: 590, age: 35,
    priority: 'Medium', profession: 'business owner',
    trigger: 'Market conditions and portfolio positioning makes this the right opportunity to advance the client\'s long-term goals with a timely proposal',
    rebalanceReason: 'Investment Proposal Review', keyContext: ['Portfolio trend: Moderate growth, business owner', 'Client Sensitivity: Family financial planning ↑', 'Market Backdrop: Rate uncertainty'],
    intro: '35y/o · moderate · business owner · 3 products',
    actions: [{ label: 'Investment Proposal Review', route: '/action/proposal/15678284' }, { label: 'Engagement Letter', route: '/client/15678284/profile' }] },
  { id: 'C012', name: 'Kevin Smyth', aum: 850000, ret: 0.048, risk: 0.20, creditScore: 680, age: 44,
    priority: 'Medium', profession: null, riskLabel: 'Moderate',
    trigger: 'Defensive bias materially limiting growth — 40% cash vs 20% IPS target creating return drag and increasing suitability review risk.',
    rebalanceReason: 'Cash Deployment', keyContext: ['Cash 40% vs 20% target', 'Behavioral inconsistency risk', 'IPS misalignment increasing'],
    intro: '44y/o · mass affluent · advisory · accumulation',
    actions: [{ label: 'Cash Deployment Review', route: '/client/C012/rebalancing' }, { label: 'IPS Review', route: '/client/C012/ips' }] },
  { id: 'C013', name: 'Sarah Jenkins', aum: 3000000, ret: 0.143, risk: 0.90, creditScore: 740, age: 48,
    priority: 'High', profession: null, riskLabel: 'Aggressive Growth',
    trigger: 'Strong returns have pushed equity to 90% vs 80% IPS target — risk beyond comfort zone, rebalancing suitability-critical.',
    rebalanceReason: 'Equity Rebalancing', keyContext: ['Equity 90% vs 80% target', 'Volatility risk elevated', 'Suitability review required'],
    intro: '48y/o · high net worth · advisory · accumulation',
    actions: [{ label: 'Rebalance Portfolio', route: '/client/C013/rebalancing' }, { label: 'Risk Analysis', route: '/client/C013/risk-analysis' }] },
  { id: 'C005', name: 'David Thompson', aum: 1590000, ret: 0.112, risk: 0.78, creditScore: 720, age: 54,
    priority: 'Critical', profession: null, riskLabel: 'Moderate Growth',
    trigger: 'Excess idle cash of >$350K above target — compliance escalation triggered. Deploy cash and address behavioral anxiety before drift widens.',
    rebalanceReason: 'Cash Deployment & Compliance Escalation', keyContext: ['Cash 22% vs 10% target — >$350K idle', 'Compliance: Advice boundary breached', 'Behavioral Risk: Elevated (score 83)'],
    intro: '54y/o · high net worth · advisory · 1 account',
    actions: [{ label: 'Cash Deployment', route: '/meeting-prep/C005' }, { label: 'Meeting Prep — 9:00 AM', route: '/meeting-prep/C005' }] },
  ...worklistData.rebalancing.filter(c => c.CustomerID !== 15740900 && c.CustomerID !== 15623828).slice(2, 3).map(c => ({
    id: c.CustomerID, name: `${c.FirstName} ${c.Surname}`,
    aum: c.NetAssets, ret: c.PortfolioReturn, risk: c.RiskProfile,
    creditScore: c.CreditScore, age: c.Age, priority: c.Priority || 'Medium',
    riskLabel: null, profession: c.BusinessOwner ? 'business owner' : null,
    trigger: c.Trigger, rebalanceReason: c.RebalanceReason, keyContext: c.KeyContext || [],
    intro: [`${c.Age}y/o`, c.RiskProfile >= 0.35 ? 'moderate growth' : c.RiskProfile >= 0.2 ? 'moderate' : 'conservative',
      c.BusinessOwner ? 'business owner' : null, `${c.NumProducts} product${c.NumProducts !== 1 ? 's' : ''}`].filter(Boolean).join(' · '),
    actions: [{ label: c.RebalanceReason, route: `/client/${c.CustomerID}/rebalancing` },
      ...(c.PortfolioReturn > 0.12 ? [{ label: 'Investment Proposal', route: '/worklist/proposals' }] : [])],
  })),
];

const PriorityQueue = () => {
  const navigate = useNavigate();
  const [selectedProfileId, setSelectedProfileId] = useState(null);
  const profiles = buildProfiles();
  const selectedProfile = profiles.find(p => p.id === selectedProfileId) || profiles[0];

  return (
    <div className="ov-card overview__priority-profiles">
      <div className="ov-profiles-split">

        {/* Left list */}
        <div className="ov-profiles-list">
          <div className="ov-profiles-list__head">
            <div className="ov-profiles-list__head-row">
              <span className="ov-card__title">Priority Queue</span>
              <div className="ov-profiles-list__head-actions">
                <Tooltip content="Refresh queue" placement="bottom">
                  <button className="ov-morning-refresh" onClick={() => setSelectedProfileId(null)}>
                    <RefreshCw size={13} />
                  </button>
                </Tooltip>
                <button className="ov-view-all" onClick={() => navigate('/worklist/rebalancing')}>View all</button>
              </div>
            </div>
            <p className="ov-profiles-list__desc">AI-ranked clients requiring action today.</p>
          </div>
          <div className="ov-profiles-list__items">
            {profiles.map(p => (
              <div
                key={p.id}
                className={`ov-profiles-list__item${selectedProfile?.id === p.id ? ' ov-profiles-list__item--active' : ''}${p.priority === 'Critical' ? ' ov-profiles-list__item--critical' : p.priority === 'High' ? ' ov-profiles-list__item--high' : ''}`}
                onClick={() => setSelectedProfileId(p.id)}
              >
                <div className="ov-profiles-list__info">
                  <div className="ov-profiles-list__row1">
                    <span className="ov-profiles-list__name">{p.name}</span>
                    <span className={`ov-profiles-list__priority-pill ov-profiles-list__priority-pill--${p.priority.toLowerCase()}`}>{p.priority}</span>
                  </div>
                  <span className="ov-profiles-list__trigger">{p.rebalanceReason}</span>
                  <span className="ov-profiles-list__aum">
                    {formatCurrency(p.aum, true)} <span className="ov-profiles-list__ret">{formatPercent(p.ret * 100)}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right detail */}
        {selectedProfile && (
          <div className="ov-profile-detail">
            <div className={`ov-profile-detail__head${selectedProfile.priority === 'Critical' ? ' ov-profile-detail__head--critical' : ''}`}>
              <div className="ov-profile-detail__avatar">
                {selectedProfile.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <span className="ov-profile-detail__name">{selectedProfile.name}</span>
                {selectedProfile.profession && <span className="ov-profile-detail__profession">{selectedProfile.profession}</span>}
                <span className="ov-profile-detail__id">#{selectedProfile.id}</span>
              </div>
              <span className={`ov-profile__status${selectedProfile.priority === 'Critical' ? ' ov-profile__status--critical' : ''}`}>
                {selectedProfile.priority === 'Critical' ? 'Critical' : 'Active'}
              </span>
            </div>

            <div className="ov-profile-detail__metrics">
              {[
                ['AUM',    formatCurrency(selectedProfile.aum, true), false],
                ['Return', formatPercent(selectedProfile.ret * 100),  true],
                ['Risk',   selectedProfile.riskLabel || (selectedProfile.risk >= 0.35 ? 'Moderate Growth' : selectedProfile.risk >= 0.2 ? 'Moderate' : selectedProfile.risk >= 0.1 ? 'Low Risk' : 'Conservative'), false],
                ['Credit', selectedProfile.creditScore, false],
                ['Age',    selectedProfile.age, false],
              ].map(([label, val, green]) => (
                <div key={label} className="ov-profile-detail__metric">
                  <span className="ov-profile-detail__metric-label">{label}</span>
                  <span className={`ov-profile-detail__metric-val${green ? ' ov-profile-detail__metric-val--green' : ''}`}>{val}</span>
                </div>
              ))}
            </div>

            <div className="ov-profile-detail__section">
              <span className="ov-profile-detail__section-label">Why this client is prioritised</span>
              <p className="ov-profile-detail__section-desc">
                {selectedProfile.trigger}. This client has been flagged due to {selectedProfile.rebalanceReason.toLowerCase()} requirements.
                With a portfolio return of <strong>{formatPercent(selectedProfile.ret * 100)}</strong> and a risk profile of <strong>{formatPercent(selectedProfile.risk * 100, 0, false)}</strong>,
                immediate attention is needed to ensure alignment with investment objectives.
                {selectedProfile.priority === 'Critical' && ' This is a critical priority client requiring urgent action.'}
                {selectedProfile.creditScore < 600 && ' Credit score is below threshold and may require review.'}
                {selectedProfile.age > 55 && ' Client is approaching retirement age — conservative reallocation may be warranted.'}
              </p>
            </div>

            <div className="ov-profile-detail__section">
              <span className="ov-profile-detail__section-label">Recommended Actions</span>
              <div className="ov-profile-detail__actions">
                {selectedProfile.actions.map((a, i) => (
                  <button
                    key={i}
                    className={`ov-profile-detail__action${i === 0 ? ' ov-profile-detail__action--primary' : ''}`}
                    onClick={() => navigate(a.route)}
                  >
                    {a.label} <ArrowRight size={12} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PriorityQueue;
