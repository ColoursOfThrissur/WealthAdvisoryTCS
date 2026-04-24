import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

  const priorityProfiles = worklistData.rebalancing.slice(0, 6).map(c => ({
    id: c.CustomerID,
    name: `${c.FirstName} ${c.Surname}`,
    aum: c.NetAssets,
    return: c.PortfolioReturn,
    risk: c.RiskProfile,
    creditScore: c.CreditScore,
    age: c.Age,
    priority: c.Priority || 'Medium',
    trigger: c.Trigger,
    rebalanceReason: c.RebalanceReason,
    intro: [
      `${c.Age}y/o`,
      c.Married ? 'married' : 'single',
      c.BusinessOwner ? 'business owner' : null,
      `${c.NumProducts} product${c.NumProducts !== 1 ? 's' : ''}`,
    ].filter(Boolean).join(' · '),
    actions: [
      { label: c.RebalanceReason, route: '/worklist/rebalancing' },
      ...(c.FirstName === 'Mary' ? [{ label: 'Meeting Prep — 10:00 AM', route: `/meeting-prep/${c.CustomerID}` }] : []),
      ...(c.Priority === 'Critical' && c.FirstName !== 'Mary' ? [{ label: 'Market Event Mailer', route: '/' }] : []),
      ...(c.PortfolioReturn > 0.12 ? [{ label: 'Investment Proposal', route: '/worklist/proposals' }] : []),
    ],
  }));

  const selectedProfile = priorityProfiles.find(p => p.id === selectedProfileId) || priorityProfiles[0];

  const actionItems = [
    { name: 'Portfolio Rebalancing', count: 12, critical: 3, icon: <TrendingUp size={16} />, onClick: () => navigate('/worklist/rebalancing') },
    { name: 'Investment Proposals',  count: 8,  critical: 2, icon: <FileText size={16} />,   onClick: () => navigate('/worklist/proposals') },
    { name: 'Tax Analysis',          count: 3,  critical: 0, icon: <TrendingUp size={16} />, onClick: () => navigate('/worklist/rebalancing') },
    { name: 'Market Event Mailers',  count: 2,  critical: 2, icon: <AlertTriangle size={16} />, onClick: handleEventAlertClick },
    { name: 'Invest Idle Cash',      count: 5,  critical: 1, icon: <DollarSign size={16} />,  onClick: () => {} },
    { name: 'KYC Expiring',          count: 1,  critical: 1, icon: <User size={16} />,        onClick: () => {} },
    { name: 'Portfolio Review',      count: 12, critical: 0, icon: <BarChart3 size={16} />,   onClick: () => navigate('/worklist/rebalancing') },
  ];

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (window.location.pathname === '/chat' || searchParams.get('mode')) setIsChatExpanded(true);
  }, []);

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

      {/* Mail Modal */}
      {selectedMailClient && (
        <div className="ov-modal-overlay" onClick={() => setSelectedMailClient(null)}>
          <div className="ov-modal" onClick={e => e.stopPropagation()}>
            <div className="ov-modal__head">
              <span>Email Preview — {selectedMailClient.clientName}</span>
              <button onClick={() => setSelectedMailClient(null)}><X size={18} /></button>
            </div>
            <div className="ov-modal__body">
              <p><strong>Subject:</strong> {generateMailPreview(selectedMailClient).subject}</p>
              <p><strong>To:</strong> {selectedMailClient.clientName}</p>
              <p>{generateMailPreview(selectedMailClient).greeting}</p>
            </div>
            <div className="ov-modal__foot">
              <button className="ov-btn ov-btn--ghost" onClick={() => setSelectedMailClient(null)}>Cancel</button>
              <button className="ov-btn ov-btn--primary" onClick={handleConfirmMail}>Confirm</button>
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
                    <div className="chat-expanded__message chat-expanded__message--ai">
                      <div className="event-overview-card">
                        <div className="event-overview-card__header">
                          <AlertTriangle size={24} color="var(--warning)" />
                          <div>
                            <h3>{activeMarketEvent.title}</h3>
                            <span className="event-overview-card__meta">{activeMarketEvent.timestamp.split('T')[0]} • {activeMarketEvent.severity} Severity</span>
                          </div>
                        </div>
                        <p className="event-overview-card__desc">{activeMarketEvent.description}</p>
                        <div className="event-overview-card__stats">
                          <div className="event-stat"><span className="event-stat__value">{activeMarketEvent.impactSummary.totalAffected}</span><span className="event-stat__label">Affected</span></div>
                          <div className="event-stat"><span className="event-stat__value">{activeMarketEvent.impactSummary.criticalCount}</span><span className="event-stat__label">Critical</span></div>
                          <div className="event-stat"><span className="event-stat__value">${(activeMarketEvent.impactSummary.totalProjectedLoss/1000).toFixed(0)}K</span><span className="event-stat__label">Loss</span></div>
                          <div className="event-stat"><span className="event-stat__value">${(activeMarketEvent.impactSummary.totalExposure/1000000).toFixed(1)}M</span><span className="event-stat__label">Exposure</span></div>
                        </div>
                      </div>
                    </div>
                    <div className="chat-expanded__message chat-expanded__message--ai">
                      <div className="chat-suggestions">
                        <p className="chat-suggestions__label">What would you like to do?</p>
                        <div className="chat-suggestions__buttons">
                          <button className="chat-suggestion-btn" onClick={() => handleSuggestionClick('Generate personalized emails for affected clients')}>Generate personalized emails</button>
                          <button className="chat-suggestion-btn" onClick={() => handleSuggestionClick('Review recommended portfolio adjustments')}>Review portfolio adjustments</button>
                        </div>
                      </div>
                    </div>
                    {eventChatMessages.map((msg, idx) => (
                      <div key={idx} className={`chat-expanded__message chat-expanded__message--${msg.sender}`}>
                        {msg.type === 'mail-generation' ? (
                          <>
                            <p>Prepared communications for all affected clients.</p>
                            <div className="mail-clients-list">
                              {activeMarketEvent.affectedClients.map(client => (
                                <div key={client.clientId} className="mail-client-item">
                                  <strong>{client.clientName}</strong>
                                  <button className={`mail-action-btn ${mailStatus[client.clientId] === 'confirmed' ? 'mail-action-btn--confirmed' : ''}`} onClick={() => handleReviewMail(client.clientId)}>
                                    {mailStatus[client.clientId] === 'confirmed' ? '✓ Confirmed' : 'Review Mail'}
                                  </button>
                                </div>
                              ))}
                            </div>
                            <button className="chat-suggestion-btn" onClick={() => handleSuggestionClick('Yes, send the emails')}>Yes, send the emails</button>
                          </>
                        ) : msg.type === 'mail-sent' ? (
                          <p className="success-message">✓ Emails sent successfully</p>
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
                    <span className="ov-card__title">Priority Profiles</span>
                    <div className="ov-profiles-list__head-actions">
                      <button className="ov-morning-refresh" onClick={() => setSelectedProfileId(null)} title="Refresh">
                        <RefreshCw size={13} />
                      </button>
                      <button className="ov-view-all" onClick={() => navigate('/worklist/rebalancing')}>View all</button>
                    </div>
                  </div>
                  <p className="ov-profiles-list__desc">AI-ranked clients requiring your attention today.</p>
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
                      ['Risk', `${(selectedProfile.risk*100).toFixed(0)}%`, false],
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
              <span className="ov-card__title">Today's Scheduled Meetings</span>
              <span className="ov-view-all" onClick={() => navigate('/prioritize')}>View More</span>
            </div>
            <div className="ov-meetings-body">
              {[
                { time: '10:00', period: 'AM', client: 'Mary Hargrave', topic: 'Portfolio Review', btn: 'Prep', clientId: '15634602' },
                { time: '11:00', period: 'AM', client: 'Sam Pai', topic: 'Investment Strategy', btn: 'Join', live: true },
                { time: '2:30',  period: 'PM', client: 'Alex Morgan', topic: 'Quarterly Review', btn: 'Prep', clientId: null },
              ].map(m => (
                <div key={m.client} className="ov-meeting-row">
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
              <span className="ov-card__title">AI Agentic Actions</span>
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
