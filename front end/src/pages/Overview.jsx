import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Sparkles, Send, X, ArrowLeft, TrendingUp, FileText,
  AlertTriangle, User, BarChart3, DollarSign, Mail, Users,
  ArrowRight, RefreshCw, ChevronRight
} from 'lucide-react';
import UniversalCard from '../components/UniversalCard';
import BackendChatInterface from '../components/BackendChatInterface';
import { useOverviewContext } from '../contexts/OverviewContext';
import { activeMarketEvent, generateMailPreview } from '../data/marketEventData';
import worklistData from '../data/worklistCustomers.json';
import './Overview.css';

const Overview = () => {
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [eventData, setEventData] = useState(null);
  const { handleEventAlertClick } = useOverviewContext(setIsChatExpanded, setEventData);
  const navigate = useNavigate();
  const location = useLocation();
  const [chatInput, setChatInput] = useState('');
  const [eventChatMessages, setEventChatMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [mailStatus, setMailStatus] = useState({});
  const [selectedMailClient, setSelectedMailClient] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [eventCompleted, setEventCompleted] = useState(false);
  const [hideCompletedEvent, setHideCompletedEvent] = useState(false);

  const [isMeetingsOpen, setIsMeetingsOpen] = useState(false);

  const [selectedProfileId, setSelectedProfileId] = useState(null);

  const priorityProfiles = [
    ...worklistData.rebalancing.filter(c => c.CustomerID !== 15740900 && c.CustomerID !== 15623828).slice(0, 1).map(c => ({
      id: c.CustomerID,
      name: `${c.FirstName} ${c.Surname}`,
      aum: c.NetAssets,
      return: c.PortfolioReturn,
      risk: c.RiskProfile,
      creditScore: c.CreditScore,
      age: c.Age,
      priority: c.Priority || 'Medium',
      riskLabel: c.FirstName === 'Mary' ? 'Moderate Growth' : null,
      trigger: c.Trigger,
      rebalanceReason: c.RebalanceReason,
      keyContext: c.KeyContext || [],
      intro: [
        `${c.Age}y/o`,
        c.Married ? 'married' : 'single',
        c.BusinessOwner ? 'business owner' : null,
        `${c.NumProducts} product${c.NumProducts !== 1 ? 's' : ''}`,
      ].filter(Boolean).join(' \u00b7 '),
      actions: Array.isArray(c.RecommendedActions) && c.RecommendedActions.length && typeof c.RecommendedActions[0] === 'object'
        ? c.RecommendedActions
        : [
            { label: c.RebalanceReason, route: `/client/${c.CustomerID}/rebalancing` },
            ...(c.FirstName === 'Mary' ? [{ label: 'Meeting Prep \u2014 10:00 AM', route: `/meeting-prep/${c.CustomerID}` }] : []),
            ...(c.Priority === 'Critical' && c.FirstName !== 'Mary' ? [{ label: 'Market Event Mailer', route: '/' }] : []),
            ...(c.PortfolioReturn > 0.12 ? [{ label: 'Investment Proposal', route: '/worklist/proposals' }] : []),
          ],
    })),
    {
      id: 15678284,
      name: 'Sam Pai',
      aum: 390000,
      return: 0.087,
      risk: 0.23,
      creditScore: 590,
      age: 35,
      priority: 'Medium',
      trigger: 'Market conditions and portfolio positioning makes this the right opportunity to advance the client\'s long-term goals with a timely proposal',
      rebalanceReason: 'Investment Proposal Review',
      keyContext: ['Portfolio trend: Moderate growth, business owner', 'Client Sensitivity: Family financial planning \u2191', 'Market Backdrop: Rate uncertainty'],
      intro: '35y/o \u00b7 married \u00b7 business owner \u00b7 3 products',
      actions: [
        { label: 'Investment Proposal Review', route: '/action/proposal/15678284' },
        { label: 'Engagement Letter', route: '/client/15678284/profile' },
      ],
    },
    ...worklistData.rebalancing.filter(c => c.CustomerID !== 15740900 && c.CustomerID !== 15623828).slice(1, 5).map(c => ({
      id: c.CustomerID,
      name: `${c.FirstName} ${c.Surname}`,
      aum: c.NetAssets,
      return: c.PortfolioReturn,
      risk: c.RiskProfile,
      creditScore: c.CreditScore,
      age: c.Age,
      priority: c.Priority || 'Medium',
      riskLabel: null,
      trigger: c.Trigger,
      rebalanceReason: c.RebalanceReason,
      keyContext: c.KeyContext || [],
      intro: [
        `${c.Age}y/o`,
        c.Married ? 'married' : 'single',
        c.BusinessOwner ? 'business owner' : null,
        `${c.NumProducts} product${c.NumProducts !== 1 ? 's' : ''}`,
      ].filter(Boolean).join(' \u00b7 '),
      actions: Array.isArray(c.RecommendedActions) && c.RecommendedActions.length && typeof c.RecommendedActions[0] === 'object'
        ? c.RecommendedActions
        : [
            { label: c.RebalanceReason, route: `/client/${c.CustomerID}/rebalancing` },
            ...(c.FirstName === 'Mary' ? [{ label: 'Meeting Prep \u2014 10:00 AM', route: `/meeting-prep/${c.CustomerID}` }] : []),
            ...(c.Priority === 'Critical' && c.FirstName !== 'Mary' ? [{ label: 'Market Event Mailer', route: '/' }] : []),
            ...(c.PortfolioReturn > 0.12 ? [{ label: 'Investment Proposal', route: '/worklist/proposals' }] : []),
          ],
    })),
  ];

  const selectedProfile = priorityProfiles.find(p => p.id === selectedProfileId) || priorityProfiles[0];

  const actionItems = [
    { name: 'Portfolio Rebalancing', count: 12, critical: 3, icon: <TrendingUp size={16} />, onClick: () => navigate('/worklist/rebalancing') },
    { name: 'Investment Proposals',  count: 8,  critical: 2, icon: <FileText size={16} />,   onClick: () => navigate('/worklist/proposals') },
    { name: 'Tax Analysis',          count: 3,  critical: 0, icon: <TrendingUp size={16} />, onClick: () => navigate('/worklist/rebalancing') },
    { name: 'Invest Idle Cash',      count: 5,  critical: 1, icon: <DollarSign size={16} />,  onClick: () => {} },
    { name: 'KYC Expiring',          count: 1,  critical: 1, icon: <User size={16} />,        onClick: () => {} },
    { name: 'Portfolio Review',      count: 12, critical: 0, icon: <BarChart3 size={16} />,   onClick: () => navigate('/worklist/rebalancing') },
  ];

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (location.pathname === '/chat' || searchParams.get('mode')) setIsChatExpanded(true);
    if (searchParams.get('event') === 'mailer') {
      handleEventAlertClick('market-event');
      navigate('/', { replace: true });
    }
  }, [location.search]);

  const handleScroll = (e) => setShowScrollTop(e.target.scrollTop > 300);

  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const msg = chatInput.trim();
    if (eventData) setEventChatMessages(prev => [...prev, { text: msg, sender: 'user' }]);
    setChatInput('');
    if (eventData && (msg.toLowerCase().includes('yes') || msg.toLowerCase().includes('send'))) {
      setLoadingMessage('Sending personalized emails...');
      setIsLoading(true);
      setTimeout(() => { setIsLoading(false); setEventChatMessages(prev => [...prev, { type: 'mail-sent', sender: 'ai' }]); }, 4000);
    } else if (eventData && msg.toLowerCase().includes('email')) {
      setLoadingMessage('Preparing communications...');
      setIsLoading(true);
      setTimeout(() => { setIsLoading(false); setEventChatMessages(prev => [...prev, { type: 'mail-generation', sender: 'ai' }]); }, 3000);
    }
  };

  const handleSuggestionClick = (s) => { setChatInput(s); handleChatSubmit({ preventDefault: () => {} }); };
  const handleReviewMail = (id) => setSelectedMailClient(activeMarketEvent.affectedClients.find(c => c.clientId === id));
  const handleConfirmMail = () => { setMailStatus(prev => ({ ...prev, [selectedMailClient.clientId]: 'confirmed' })); setSelectedMailClient(null); };
  const handleChatExpand = (v) => { setIsChatExpanded(v); if (!v) navigate('/'); };
  const fmt = (v) => v >= 1000000 ? `$${(v/1000000).toFixed(1)}M` : v >= 1000 ? `$${(v/1000).toFixed(0)}K` : `$${v}`;

  return (
    <div className="overview">

      {/* Mail Preview Modal */}
      {selectedMailClient && (
        <div className="mail-preview-modal-overlay" onClick={() => setSelectedMailClient(null)}>
          <div className="mail-preview-modal" onClick={e => e.stopPropagation()}>
            <div className="mail-preview-modal__header">
              <h3>Email Preview — {selectedMailClient.clientName}</h3>
              <button className="mail-preview-modal__close" onClick={() => setSelectedMailClient(null)}><X size={20} /></button>
            </div>
            <div className="mail-preview-modal__content">
              <div className="mail-preview-field"><strong>Subject:</strong> {generateMailPreview(selectedMailClient).subject}</div>
              <div className="mail-preview-field"><strong>To:</strong> {selectedMailClient.clientName}</div>
              <div className="mail-preview-body">
                <p>{generateMailPreview(selectedMailClient).greeting}</p>
                <p>I wanted to reach out regarding a recent market development that affects your portfolio.</p>
                <p>{activeMarketEvent.description}</p>

                <div className="mail-impact-card">
                  <h4>Your Portfolio Impact</h4>
                  <div className="mail-impact-stats">
                    <div className="mail-impact-stat">
                      <span className="mail-impact-label">Energy Exposure</span>
                      <span className="mail-impact-value">{(selectedMailClient.energyExposure * 100).toFixed(0)}%</span>
                    </div>
                    <div className="mail-impact-stat">
                      <span className="mail-impact-label">Industrial Exposure</span>
                      <span className="mail-impact-value">{(selectedMailClient.industrialExposure * 100).toFixed(0)}%</span>
                    </div>
                    <div className="mail-impact-stat">
                      <span className="mail-impact-label">Portfolio Value</span>
                      <span className="mail-impact-value">${selectedMailClient.currentValue.toLocaleString()}</span>
                    </div>
                    <div className="mail-impact-stat">
                      <span className="mail-impact-label">Estimated Impact</span>
                      <span className="mail-impact-value impact-negative">-${selectedMailClient.projectedLoss.toLocaleString()} ({selectedMailClient.lossPercentage}%)</span>
                    </div>
                  </div>
                  <div className="mail-impact-bar">
                    <div className="mail-impact-bar-fill" style={{ width: `${selectedMailClient.lossPercentage * 10}%` }} />
                  </div>
                </div>

                <div className="mail-holdings-card">
                  <h4>Most Affected Holdings</h4>
                  {selectedMailClient.portfolioDetails.topHoldings.map((h, i) => (
                    <div key={i} className="mail-holding-item">
                      <div className="mail-holding-info">
                        <strong>{h.name}</strong>
                        <span className="mail-holding-ticker">{h.ticker}</span>
                      </div>
                      <span className={h.impact < 0 ? 'impact-negative' : ''}>
                        {h.impact < 0 ? '-' : ''}${Math.abs(h.impact).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mail-action-card">
                  <h4>Recommended Action</h4>
                  <p>{selectedMailClient.recommendedAction}</p>
                </div>

                <div className="mail-allocation-card">
                  <h4>Proposed Allocation Adjustment</h4>
                  <div className="mail-allocation-comparison">
                    <div className="mail-allocation-col">
                      <span className="mail-allocation-label">Current</span>
                      <div className="mail-allocation-bars">
                        {[['Bonds', selectedMailClient.portfolioDetails.currentAllocation.bonds, 'var(--info)'],
                          ['Stocks', selectedMailClient.portfolioDetails.currentAllocation.stocks, 'var(--success)'],
                          ['Energy', selectedMailClient.portfolioDetails.currentAllocation.energy, 'var(--warning)']]
                          .map(([label, pct, color]) => (
                            <div key={label} className="mail-allocation-bar">
                              <span>{label}</span>
                              <div className="mail-allocation-bar-bg">
                                <div className="mail-allocation-bar-fill" style={{ width: `${pct}%`, background: color }} />
                              </div>
                              <span>{pct}%</span>
                            </div>
                          ))}
                      </div>
                    </div>
                    <div className="mail-allocation-arrow">→</div>
                    <div className="mail-allocation-col">
                      <span className="mail-allocation-label">Proposed</span>
                      <div className="mail-allocation-bars">
                        {[['Bonds', selectedMailClient.portfolioDetails.proposedAllocation.bonds, 'var(--info)'],
                          ['Stocks', selectedMailClient.portfolioDetails.proposedAllocation.stocks, 'var(--success)'],
                          ['Energy', selectedMailClient.portfolioDetails.proposedAllocation.energy, 'var(--warning)']]
                          .map(([label, pct, color]) => (
                            <div key={label} className="mail-allocation-bar">
                              <span>{label}</span>
                              <div className="mail-allocation-bar-bg">
                                <div className="mail-allocation-bar-fill" style={{ width: `${pct}%`, background: color }} />
                              </div>
                              <span>{pct}%</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>

                <p>I'd like to schedule a brief call to discuss how we can protect your portfolio and ensure you stay on track with your financial goals.</p>
                <p>Best regards,<br/>Your Wealth Advisor</p>
              </div>
            </div>
            <div className="mail-preview-modal__footer">
              <button className="mail-preview-btn mail-preview-btn--cancel" onClick={() => setSelectedMailClient(null)}>Cancel</button>
              <button className="mail-preview-btn mail-preview-btn--confirm" onClick={handleConfirmMail}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Overlay */}
      {isChatExpanded && (
        <div className="overview__chat-overlay">
          <div className="chat-expanded" style={{ gap: 0 }}>
            <div className="chat-expanded__header" style={{ padding: 0 }}>
              <button className="chat-expanded__close" onClick={() => { handleChatExpand(false); setEventData(null); }}>
                <ArrowLeft size={18} /> Back
              </button>
            </div>
            <div className="chat-expanded__content">
              {eventData ? (
                <>
                  <div className="chat-expanded__messages" onScroll={handleScroll}>
                    <div className="chat-expanded__message chat-expanded__message--ai chat-expanded__message--card">
                      <div className="event-overview-card">
                        <div className="event-overview-card__header">
                          <AlertTriangle size={24} color="var(--warning)" />
                          <div>
                            <h3>{activeMarketEvent.title}</h3>
                            <span className="event-overview-card__meta">{activeMarketEvent.timestamp.split('T')[0]} • {activeMarketEvent.severity} Severity • {activeMarketEvent.subtitle}</span>
                          </div>
                        </div>

                        <div className="event-overview-card__section">
                          <h4>Market Impact Brief</h4>
                          <p className="event-overview-card__desc">{activeMarketEvent.eventBrief}</p>
                        </div>

                        <div className="event-overview-card__section">
                          <h4>Portfolio Impact</h4>
                          <p className="event-overview-card__desc">{activeMarketEvent.portfolioImpactExplanation}</p>
                        </div>

                        <div className="event-overview-card__stats">
                          <div className="event-stat"><span className="event-stat__value">{activeMarketEvent.impactSummary.totalAffected}</span><span className="event-stat__label">Clients Affected</span></div>
                          <div className="event-stat"><span className="event-stat__value">{activeMarketEvent.impactSummary.criticalCount}</span><span className="event-stat__label">Critical</span></div>
                          <div className="event-stat"><span className="event-stat__value">{activeMarketEvent.impactSummary.highCount}</span><span className="event-stat__label">High</span></div>
                          <div className="event-stat"><span className="event-stat__value">{activeMarketEvent.impactSummary.mediumCount}</span><span className="event-stat__label">Medium</span></div>
                          <div className="event-stat"><span className="event-stat__value">${(activeMarketEvent.impactSummary.totalProjectedLoss/1000).toFixed(0)}K</span><span className="event-stat__label">Projected Loss</span></div>
                          <div className="event-stat"><span className="event-stat__value">${(activeMarketEvent.impactSummary.totalExposure/1000000).toFixed(1)}M</span><span className="event-stat__label">Total Exposure</span></div>
                          <div className="event-stat"><span className="event-stat__value">{activeMarketEvent.impactSummary.averageLossPercentage}%</span><span className="event-stat__label">Avg Loss</span></div>
                        </div>

                        <div className="event-overview-card__section">
                          <h4>Priority Client Actions</h4>
                          <div className="event-clients-list">
                            {activeMarketEvent.affectedClients.map((client, idx) => (
                              <div key={client.clientId} className="event-client-row">
                                <span className="event-client-rank">{idx + 1}</span>
                                <div className="event-client-info">
                                  <div className="event-client-name-row">
                                    <strong>{client.clientName}</strong>
                                    <span className="event-client-meta">{client.age} years, {client.riskProfile}</span>
                                    <span className={`severity-badge severity-badge--${client.severity.toLowerCase()}`}>{client.severity}</span>
                                  </div>
                                  <div className="event-client-stats">
                                    <span>${(client.currentValue/1000).toFixed(0)}K</span>
                                    <span className="event-client-return">+{client.portfolioReturn}%</span>
                                    <span className="event-client-loss">-${client.projectedLoss.toLocaleString()} ({client.lossPercentage}%)</span>
                                  </div>
                                  <span className="event-client-action">{client.recommendedAction}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="chat-expanded__message chat-expanded__message--ai chat-expanded__message--card">
                      <div className="chat-suggestions">
                        <p className="chat-suggestions__label">What would you like to do?</p>
                        <div className="chat-suggestions__buttons">
                          <button className="chat-suggestion-btn" onClick={() => handleSuggestionClick('Generate personalized emails for affected clients')}>Generate personalized emails</button>
                          <button className="chat-suggestion-btn" onClick={() => handleSuggestionClick('Review recommended portfolio adjustments')}>Review portfolio adjustments</button>
                        </div>
                      </div>
                    </div>
                    {eventChatMessages.map((msg, idx) => (
                      <div key={idx} className={`chat-expanded__message chat-expanded__message--${msg.sender}${msg.type === 'mail-generation' || msg.type === 'mail-sent' ? ' chat-expanded__message--card' : ''}`}>
                        {msg.type === 'mail-generation' ? (
                          <>
                            <p>I've analysed the {activeMarketEvent.title} impact and prepared personalised communications for all {activeMarketEvent.affectedClients.length} affected clients. Here's the summary:</p>
                            <div className="mail-clients-list">
                              {activeMarketEvent.affectedClients.map(client => (
                                <div key={client.clientId} className="mail-client-item">
                                  <div className="mail-client-info">
                                    <strong>{client.clientName}</strong>
                                    <span className={`severity-badge severity-badge--${client.severity.toLowerCase()}`}>{client.severity}</span>
                                  </div>
                                  <button
                                    className={`mail-action-btn ${mailStatus[client.clientId] === 'confirmed' ? 'mail-action-btn--confirmed' : ''}`}
                                    onClick={() => handleReviewMail(client.clientId)}
                                  >
                                    {mailStatus[client.clientId] === 'confirmed' ? '✓ Confirmed' : 'Review Mail'}
                                  </button>
                                </div>
                              ))}
                            </div>
                            <p className="mail-question">Would you like me to send these personalised emails to all affected clients?</p>
                            <div className="chat-suggestions__buttons">
                              <button className="chat-suggestion-btn" onClick={() => handleSuggestionClick('Yes, send the emails')}>Yes, send the emails</button>
                              <button className="chat-suggestion-btn" onClick={() => handleSuggestionClick('No, I need to review further')}>No, I need to review further</button>
                            </div>
                          </>
                        ) : msg.type === 'mail-sent' ? (
                          <>
                            <p className="success-message">✓ Emails sent successfully</p>
                            <div className="completion-summary">
                              <h4>Market Event Response — {activeMarketEvent.title}</h4>
                              <p className="event-reason">
                                Due to the {activeMarketEvent.title.toLowerCase()}, personalised communications have been sent to all affected clients with recommendations to increase energy hedges and reduce exposure to oil-dependent sectors.
                              </p>
                              <div className="sent-clients-list">
                                {activeMarketEvent.affectedClients.map(client => (
                                  <div key={client.clientId} className="sent-client-item">
                                    <div className="sent-client-header">
                                      <strong>{client.clientName}</strong>
                                      <span className={`severity-badge severity-badge--${client.severity.toLowerCase()}`}>{client.severity}</span>
                                    </div>
                                    <div className="sent-client-details">
                                      <span>Portfolio Impact: -${client.projectedLoss.toLocaleString()} ({client.lossPercentage}%)</span>
                                      <span>Reason: {client.reason}</span>
                                      <span>Action: {client.recommendedAction}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <ul>
                                <li>Follow-up tasks created in CRM</li>
                                <li>Client meetings scheduled for next week</li>
                                <li>Event alert will be cleared from dashboard</li>
                              </ul>
                              <button
                                className="back-to-dashboard-btn"
                                onClick={() => {
                                  setEventCompleted(true);
                                  setEventData(null);
                                  setIsChatExpanded(false);
                                  setTimeout(() => {
                                    setEventCompleted(false);
                                    setHideCompletedEvent(true);
                                  }, 5000);
                                }}
                              >
                                Return to Dashboard
                              </button>
                            </div>
                          </>
                        ) : msg.text}
                      </div>
                    ))}
                    {isLoading && (
                      <div className="chat-expanded__message chat-expanded__message--ai">
                        <div className="chat-loading"><div className="chat-loading__spinner" /><span>{loadingMessage}</span></div>
                      </div>
                    )}
                  </div>
                  <form className="chat-expanded__input" onSubmit={handleChatSubmit}>
                    <input type="text" placeholder="Ask AI..." value={chatInput} onChange={e => setChatInput(e.target.value)} />
                    <button type="submit" disabled={!chatInput.trim()}><Send size={20} /></button>
                  </form>
                </>
              ) : (
                <BackendChatInterface onClose={() => setIsChatExpanded(false)} />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Main Grid ── */}
      <div className={`overview__content${isChatExpanded ? ' overview__content--hidden' : ''}`}>

        {/* LEFT COLUMN */}
        <div className="overview__left">

          {/* Priority Profiles */}
          <div className="ov-card overview__priority-profiles">
            <div className="ov-profiles-split">

              {/* Left list */}
              <div className="ov-profiles-list">
                <div className="ov-profiles-list__head">
                  <div className="ov-profiles-list__head-row">
                    <span className="ov-card__title">Priority Client Actions</span>
                    <div className="ov-profiles-list__head-actions">
                      <button className="ov-morning-refresh" onClick={() => setSelectedProfileId(null)} title="Refresh">
                        <RefreshCw size={13} />
                      </button>
                      <button className="ov-view-all" onClick={() => navigate('/worklist/rebalancing')}>View all</button>
                    </div>
                  </div>
                  <p className="ov-profiles-list__desc">AI-ranked clients requiring action today.</p>
                </div>
                <div className="ov-profiles-list__items">
                  {priorityProfiles.map(p => (
                    <div
                      key={p.id}
                      className={`ov-profiles-list__item${(selectedProfile?.id === p.id) ? ' ov-profiles-list__item--active' : ''}${p.priority === 'Critical' ? ' ov-profiles-list__item--critical' : ''}`}
                      onClick={() => setSelectedProfileId(p.id)}
                    >
                      <div className="ov-profiles-list__avatar">
                        {p.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="ov-profiles-list__info">
                        <span className="ov-profiles-list__name">{p.name}</span>
                        <span className="ov-profiles-list__sub">{p.intro}</span>
                        <span className="ov-profiles-list__aum">
                          {fmt(p.aum)} <span className="ov-profiles-list__ret">+{(p.return*100).toFixed(1)}%</span>
                        </span>
                        <span className="ov-profiles-list__trigger">{p.trigger}</span>
                      </div>
                      {p.priority === 'Critical' && <span className="ov-profiles-list__dot" />}
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
                      <span className="ov-profile-detail__id">#{selectedProfile.id}</span>
                    </div>
                    <span className={`ov-profile__status${selectedProfile.priority === 'Critical' ? ' ov-profile__status--critical' : ''}`}>
                      {selectedProfile.priority === 'Critical' ? 'Critical' : 'Active'}
                    </span>
                  </div>

                  <div className="ov-profile-detail__metrics">
                    {[['AUM', fmt(selectedProfile.aum), false],
                      ['Return', `+${(selectedProfile.return*100).toFixed(1)}%`, true],
                      ['Risk', selectedProfile.riskLabel || `${(selectedProfile.risk*100).toFixed(0)}%`, false],
                      ['Credit', selectedProfile.creditScore, false],
                      ['Age', selectedProfile.age, false]
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
                      With a portfolio return of <strong>+{(selectedProfile.return * 100).toFixed(1)}%</strong> and a risk profile of <strong>{(selectedProfile.risk * 100).toFixed(0)}%</strong>,
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
                        <button key={i}
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

        </div>
        {/* END LEFT COLUMN */}

        {/* RIGHT COLUMN */}
        <div className="overview__right">

          {/* Today's Meetings */}
          <div className="ov-card overview__meetings">
            <div className="ov-card__head">
              <span className="ov-card__title">Meeting Intelligence</span>
              <span className="ov-view-all" onClick={() => navigate('/prioritize')}>View More</span>
            </div>
            <div className="ov-meetings-body">
              {[
                { time: '10:00', period: 'AM', client: 'Alex Morgan', topic: 'Quarterly Review', btn: 'Prep', clientId: '15600001' },
                { time: '2:30',  period: 'PM', client: 'Jean Williams', topic: 'Investment Planning', btn: 'Prep', clientId: '15740900' },
                { time: '4:00',  period: 'PM', client: 'Marcus Thompson', topic: 'Portfolio Review', btn: 'Prep', clientId: '15623828' },
              ].map(m => (
                <div key={m.client} className="ov-meeting-row" style={{ cursor: 'pointer' }} onClick={() => m.clientId && navigate(`/meeting-prep/${m.clientId}`)}>
                  <div className="ov-meeting-row__time">
                    <span>{m.time}</span>
                    <span className="ov-meeting-row__period">{m.period}</span>
                  </div>
                  <div className="ov-meeting-row__info">
                    <span className="ov-meeting-row__client">{m.client}</span>
                    <span className="ov-meeting-row__topic">{m.topic}</span>
                  </div>
                  <button
                    className={`ov-meeting-row__btn${m.live ? ' ov-meeting-row__btn--live' : ''}`}
                    onClick={() => m.clientId && navigate(`/meeting-prep/${m.clientId}`)}
                  >{m.btn}</button>
                </div>
              ))}

            </div>
          </div>

          {/* AI Agentic Actions */}
          <div className="ov-card overview__actions">
            <div className="ov-card__head">
              <span className="ov-card__title">Portfolio Monitor</span>
              <span className="ov-ai-badge"><Sparkles size={10} /> AI</span>
            </div>
            <div className="ov-actions-list">
              {actionItems.map(item => (
                <UniversalCard key={item.name} type="action-list"
                  data={{ name: item.name, clients: `${item.count} clients`, critical: item.critical, icon: item.icon, onClick: item.onClick }}
                />
              ))}
            </div>
          </div>

        </div>
        {/* END RIGHT COLUMN */}

      </div>
    </div>
  );
};

export default Overview;
