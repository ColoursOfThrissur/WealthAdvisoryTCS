import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Send, X, ArrowLeft, TrendingUp, FileText, Calendar, AlertTriangle, User, BarChart3, DollarSign, Mail, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import UniversalCard from '../components/UniversalCard';
import BackendChatInterface from '../components/BackendChatInterface';
import { useOverviewContext } from '../contexts/OverviewContext';
import { activeMarketEvent, generateMailPreview } from '../data/marketEventData';
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
  const [isDayGlanceExpanded, setIsDayGlanceExpanded] = useState(true);
  const [activeMode, setActiveMode] = useState('report');

  const modeSuggestions = {
    email: [
      { label: 'Draft quarterly review email for Sam Pai' },
      { label: 'Notify clients about market event impact' },
      { label: 'Follow-up email after Mary Hargrave meeting' },
      { label: 'Send portfolio rebalancing summary to clients' },
    ],
    meeting: [
      { label: 'Prep for meeting with Mary Hargrave at 10 AM' },
      { label: 'Summarize last meeting with Alex Morgan' },
      { label: 'Create agenda for Sam Pai investment strategy call' },
      { label: 'Pull talking points for quarterly review meetings' },
    ],
    research: [
      { label: 'Research impact of fed rate changes on bonds' },
      { label: 'Analyze oil crisis effect on energy portfolios' },
      { label: 'Macro outlook for emerging markets Q2 2026' },
      { label: 'Compare sector performance: tech vs financials' },
    ],
    report: [
      { label: 'Generate performance report for Sarah Mitchell' },
      { label: 'Create rebalancing summary for top 10 clients' },
      { label: 'Risk exposure report across all portfolios' },
      { label: 'Monthly AUM and client activity digest' },
    ],
  };

  useEffect(() => {
    const currentPath = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);
    console.log('[OVERVIEW] Path:', currentPath, 'Mode:', searchParams.get('mode'));
    if (currentPath === '/chat' || searchParams.get('mode')) {
      console.log('[OVERVIEW] Expanding chat');
      setIsChatExpanded(true);
    }
  }, []);

  const handleScroll = (e) => {
    setShowScrollTop(e.target.scrollTop > 300);
  };

  const scrollToTop = () => {
    document.querySelector('.chat-expanded__messages').scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (chatInput.trim()) {
      const userMessage = chatInput.trim();
      if (eventData) {
        setEventChatMessages(prev => [...prev, { text: userMessage, sender: 'user' }]);
      }
      setChatInput('');
      if (eventData && (userMessage.toLowerCase().includes('yes') || userMessage.toLowerCase().includes('send'))) {
        setLoadingMessage('Sending personalized emails to affected clients...');
        setIsLoading(true);
        setTimeout(() => {
          setIsLoading(false);
          setEventChatMessages(prev => [...prev, { type: 'mail-sent', sender: 'ai' }]);
        }, 4000);
      } else if (eventData && (userMessage.toLowerCase().includes('email') || userMessage.toLowerCase().includes('mail') || userMessage.toLowerCase().includes('personalized'))) {
        setLoadingMessage('Analyzing and preparing personalized communications...');
        setIsLoading(true);
        setTimeout(() => {
          setIsLoading(false);
          setEventChatMessages(prev => [...prev, { type: 'mail-generation', sender: 'ai' }]);
        }, 3000);
      }
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setChatInput(suggestion);
    handleChatSubmit({ preventDefault: () => {} });
  };

  const handleReviewMail = (clientId) => {
    const client = activeMarketEvent.affectedClients.find(c => c.clientId === clientId);
    setSelectedMailClient(client);
  };

  const handleConfirmMail = () => {
    setMailStatus(prev => ({ ...prev, [selectedMailClient.clientId]: 'confirmed' }));
    setSelectedMailClient(null);
  };

  const handleChatExpand = (expanded) => {
    console.log('[OVERVIEW] handleChatExpand:', expanded);
    setIsChatExpanded(expanded);
    if (!expanded) {
      navigate('/');
    }
  };

  const actionCards = [
    { name: 'Portfolio Rebalancing', clients: '12 clients', icon: <TrendingUp size={20} />, urgent: false, onClick: () => navigate('/worklist/rebalancing') },
    { name: 'Investment Proposals', clients: '8 clients', icon: <FileText size={20} />, urgent: false, onClick: () => navigate('/worklist/proposals') },
    { name: 'Tax Analysis', clients: '3 clients', icon: <TrendingUp size={20} />, urgent: false, onClick: () => navigate('/worklist/rebalancing') },
    { name: 'Market Event Mailers', clients: '2 clients', icon: <AlertTriangle size={20} />, urgent: true, onClick: handleEventAlertClick },
    { name: 'Invest Idle Cash', clients: '5 clients', icon: <DollarSign size={20} />, urgent: false, onClick: () => {} },
    { name: 'KYC Expiring', clients: '1 client', icon: <User size={20} />, urgent: true, onClick: () => {} },
    { name: 'Portfolio Review', clients: '12 clients', icon: <BarChart3 size={20} />, urgent: false, onClick: () => navigate('/worklist/rebalancing') },
  ];

  return (
    <div className="overview">
      {/* Mail Preview Modal */}
      {selectedMailClient && (
        <div className="mail-preview-modal-overlay" onClick={() => setSelectedMailClient(null)}>
          <div className="mail-preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mail-preview-modal__header">
              <h3>Email Preview - {selectedMailClient.clientName}</h3>
              <button className="mail-preview-modal__close" onClick={() => setSelectedMailClient(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="mail-preview-modal__content">
              <div className="mail-preview-field">
                <strong>Subject:</strong> {generateMailPreview(selectedMailClient).subject}
              </div>
              <div className="mail-preview-field">
                <strong>To:</strong> {selectedMailClient.clientName}
              </div>
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
                    <div className="mail-impact-bar-fill" style={{ width: `${selectedMailClient.lossPercentage * 10}%` }}></div>
                  </div>
                </div>

                <div className="mail-holdings-card">
                  <h4>Most Affected Holdings</h4>
                  {selectedMailClient.portfolioDetails.topHoldings.map((holding, idx) => (
                    <div key={idx} className="mail-holding-item">
                      <div className="mail-holding-info">
                        <strong>{holding.name}</strong>
                        <span className="mail-holding-ticker">{holding.ticker}</span>
                      </div>
                      <span className={holding.impact < 0 ? 'impact-negative' : ''}>
                        {holding.impact < 0 ? '-' : ''}${Math.abs(holding.impact).toLocaleString()}
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
                        <div className="mail-allocation-bar">
                          <span>Bonds</span>
                          <div className="mail-allocation-bar-bg">
                            <div className="mail-allocation-bar-fill" style={{ width: `${selectedMailClient.portfolioDetails.currentAllocation.bonds}%`, background: 'var(--info)' }}></div>
                          </div>
                          <span>{selectedMailClient.portfolioDetails.currentAllocation.bonds}%</span>
                        </div>
                        <div className="mail-allocation-bar">
                          <span>Stocks</span>
                          <div className="mail-allocation-bar-bg">
                            <div className="mail-allocation-bar-fill" style={{ width: `${selectedMailClient.portfolioDetails.currentAllocation.stocks}%`, background: 'var(--success)' }}></div>
                          </div>
                          <span>{selectedMailClient.portfolioDetails.currentAllocation.stocks}%</span>
                        </div>
                        <div className="mail-allocation-bar">
                          <span>Energy</span>
                          <div className="mail-allocation-bar-bg">
                            <div className="mail-allocation-bar-fill" style={{ width: `${selectedMailClient.portfolioDetails.currentAllocation.energy}%`, background: 'var(--warning)' }}></div>
                          </div>
                          <span>{selectedMailClient.portfolioDetails.currentAllocation.energy}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="mail-allocation-arrow">→</div>
                    <div className="mail-allocation-col">
                      <span className="mail-allocation-label">Proposed</span>
                      <div className="mail-allocation-bars">
                        <div className="mail-allocation-bar">
                          <span>Bonds</span>
                          <div className="mail-allocation-bar-bg">
                            <div className="mail-allocation-bar-fill" style={{ width: `${selectedMailClient.portfolioDetails.proposedAllocation.bonds}%`, background: 'var(--info)' }}></div>
                          </div>
                          <span>{selectedMailClient.portfolioDetails.proposedAllocation.bonds}%</span>
                        </div>
                        <div className="mail-allocation-bar">
                          <span>Stocks</span>
                          <div className="mail-allocation-bar-bg">
                            <div className="mail-allocation-bar-fill" style={{ width: `${selectedMailClient.portfolioDetails.proposedAllocation.stocks}%`, background: 'var(--success)' }}></div>
                          </div>
                          <span>{selectedMailClient.portfolioDetails.proposedAllocation.stocks}%</span>
                        </div>
                        <div className="mail-allocation-bar">
                          <span>Energy</span>
                          <div className="mail-allocation-bar-bg">
                            <div className="mail-allocation-bar-fill" style={{ width: `${selectedMailClient.portfolioDetails.proposedAllocation.energy}%`, background: 'var(--warning)' }}></div>
                          </div>
                          <span>{selectedMailClient.portfolioDetails.proposedAllocation.energy}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <p>I'd like to schedule a brief call to discuss how we can protect your portfolio through diversification and ensure you stay on track with your financial goals.</p>
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
      {isChatExpanded && (
        <div className="overview__chat-overlay">
          <div className="chat-expanded" style={{ gap: 0 }}>
            <div className="chat-expanded__header" style={{ padding: 0 }}>
              <button className="chat-expanded__close" onClick={() => { 
                handleChatExpand(false);
                setEventData(null);
                if (eventData) {
                  setEventChatMessages([]);
                }
              }}>
                <ArrowLeft size={18} />
                Back
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
                        <div className="event-overview-card__section">
                          <h4>Event Analysis</h4>
                          <p>{activeMarketEvent.eventBrief}</p>
                        </div>
                        <div className="event-overview-card__section">
                          <h4>Portfolio Impact</h4>
                          <p>{activeMarketEvent.portfolioImpactExplanation}</p>
                        </div>
                        <div className="event-overview-card__stats">
                          <div className="event-stat">
                            <span className="event-stat__value">{activeMarketEvent.impactSummary.totalAffected}</span>
                            <span className="event-stat__label">Clients Affected</span>
                          </div>
                          <div className="event-stat">
                            <span className="event-stat__value">{activeMarketEvent.impactSummary.criticalCount}</span>
                            <span className="event-stat__label">Critical</span>
                          </div>
                          <div className="event-stat">
                            <span className="event-stat__value">{activeMarketEvent.impactSummary.highCount}</span>
                            <span className="event-stat__label">High Priority</span>
                          </div>
                          <div className="event-stat">
                            <span className="event-stat__value">${(activeMarketEvent.impactSummary.totalProjectedLoss / 1000).toFixed(0)}K</span>
                            <span className="event-stat__label">Projected Loss</span>
                          </div>
                          <div className="event-stat">
                            <span className="event-stat__value">${(activeMarketEvent.impactSummary.totalExposure / 1000000).toFixed(1)}M</span>
                            <span className="event-stat__label">Total Exposure</span>
                          </div>
                          <div className="event-stat">
                            <span className="event-stat__value">{activeMarketEvent.impactSummary.averageLossPercentage}%</span>
                            <span className="event-stat__label">Avg Loss</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="chat-expanded__message chat-expanded__message--ai">
                      <div className="event-clients-table">
                        <h4>Affected Clients</h4>
                        <table>
                          <thead>
                            <tr>
                              <th>Client</th>
                              <th>Severity</th>
                              <th>Exposure</th>
                              <th>Portfolio Value</th>
                              <th>Projected Impact</th>
                              <th>Reason</th>
                            </tr>
                          </thead>
                          <tbody>
                            {activeMarketEvent.affectedClients.map(client => (
                              <tr key={client.clientId}>
                                <td><strong>{client.clientName}</strong></td>
                                <td><span className={`severity-badge severity-badge--${client.severity.toLowerCase()}`}>{client.severity}</span></td>
                                <td>{(client.energyExposure * 100).toFixed(0)}% Energy / {(client.industrialExposure * 100).toFixed(0)}% Industrial</td>
                                <td>${(client.currentValue / 1000).toFixed(0)}K</td>
                                <td className="impact-negative">-${client.projectedLoss.toLocaleString()} ({client.lossPercentage}%)</td>
                                <td>{client.reason}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="chat-suggestions">
                        <p className="chat-suggestions__label">What would you like to do?</p>
                        <div className="chat-suggestions__buttons">
                          <button className="chat-suggestion-btn" onClick={() => handleSuggestionClick('Generate personalized emails for affected clients')}>Generate personalized emails for affected clients</button>
                          <button className="chat-suggestion-btn" onClick={() => handleSuggestionClick('Review recommended portfolio adjustments')}>Review recommended portfolio adjustments</button>
                          <button className="chat-suggestion-btn" onClick={() => handleSuggestionClick('Schedule client meetings')}>Schedule client meetings</button>
                        </div>
                      </div>
                    </div>
                    {eventChatMessages.map((msg, idx) => (
                      <div key={idx} className={`chat-expanded__message chat-expanded__message--${msg.sender}`}>
                        {msg.type === 'mail-generation' ? (
                          <>
                            <p>I've analyzed the market event impact and prepared personalized communications for all 2 affected clients. Here's the summary:</p>
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
                            <p className="mail-question">Would you like me to send these personalized emails to all affected clients?</p>
                            <div className="chat-suggestions__buttons">
                              <button className="chat-suggestion-btn" onClick={() => handleSuggestionClick('Yes, send the emails')}>Yes, send the emails</button>
                              <button className="chat-suggestion-btn" onClick={() => handleSuggestionClick('No, I need to review further')}>No, I need to review further</button>
                            </div>
                          </>
                        ) : msg.type === 'mail-sent' ? (
                          <>
                            <p className="success-message">✓ Emails sent successfully</p>
                            <div className="completion-summary">
                              <h4>Market Event Response - {activeMarketEvent.title}</h4>
                              <p className="event-reason">Due to the Saudi oil supply crisis driving crude prices above $120/barrel, personalized communications have been sent to affected clients with recommendations to increase energy hedges and reduce exposure to oil-dependent sectors.</p>
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
                              <button className="back-to-dashboard-btn" onClick={() => { 
                                setEventData(null); 
                                setIsChatExpanded(false);
                              }}>
                                Return to Dashboard
                              </button>
                            </div>
                          </>
                        ) : (
                          msg.text
                        )}
                      </div>
                    ))}
                    {isLoading && (
                      <div className="chat-expanded__message chat-expanded__message--ai">
                        <div className="chat-loading">
                          <div className="chat-loading__spinner"></div>
                          <span>{loadingMessage}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  {showScrollTop && (
                    <button className="scroll-to-top-btn" onClick={scrollToTop}>
                      <ArrowLeft size={20} style={{ transform: 'rotate(90deg)' }} />
                    </button>
                  )}
                  <form className="chat-expanded__input" onSubmit={handleChatSubmit}>
                    <input
                      type="text"
                      placeholder="Ask AI to modify dashboard, analyze data, or get insights..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                    />
                    <button type="submit" disabled={!chatInput.trim()}>
                      <Send size={20} />
                    </button>
                  </form>
                </>
              ) : (
                <BackendChatInterface onClose={() => setIsChatExpanded(false)} />
              )}
            </div>
          </div>
        </div>
      )}
      {/* Main Dashboard Content - Bento Grid Layout */}
      <div className={`overview__content${isChatExpanded ? ' overview__content--hidden' : ''}${!isDayGlanceExpanded ? ' overview__content--panel-collapsed' : ''}`}>
        
        {/* AI Assistant Interface - Hero Component */}
        <div className="overview__ai-assistant-hero">
          <div className="ai-assistant-welcome">
            <p className="ai-assistant-greeting">Good morning, Derik &mdash; {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            <div className="ai-assistant-welcome-top">
              <Sparkles size={48} className="ai-assistant-icon" />
              <h2>Client Relationship Assist</h2>
            </div>
            <p>Your intelligent assistant for client management, portfolio analysis, and relationship insights.</p>
          </div>
          
          <div className="ai-assistant-input-wrapper">
            {/* Input at top */}
            <textarea 
              placeholder="How can I assist you today?"
              className="ai-assistant-input"
              onClick={() => setIsChatExpanded(true)}
              readOnly
              rows={3}
            />
            
            {/* Mode Chips at bottom left */}
            <div className="ai-assistant-modes">
              <button className={`mode-chip${activeMode === 'email' ? ' mode-chip--active' : ''}`} onClick={() => setActiveMode('email')}>
                <Mail size={14} />
                <span>Email</span>
              </button>
              <button className={`mode-chip${activeMode === 'meeting' ? ' mode-chip--active' : ''}`} onClick={() => setActiveMode('meeting')}>
                <Users size={14} />
                <span>Meeting</span>
              </button>
              <button className={`mode-chip${activeMode === 'research' ? ' mode-chip--active' : ''}`} onClick={() => setActiveMode('research')}>
                <TrendingUp size={14} />
                <span>Research</span>
              </button>
              <button className={`mode-chip${activeMode === 'report' ? ' mode-chip--active' : ''}`} onClick={() => setActiveMode('report')}>
                <FileText size={14} />
                <span>Report</span>
              </button>
            </div>
            
            {/* Submit button at bottom right */}
            <button className="ai-assistant-submit" onClick={() => setIsChatExpanded(true)}>
              <Send size={20} />
            </button>
          </div>
          
          {/* Suggested Prompts */}
          <div className="ai-assistant-suggestions">
            {modeSuggestions[activeMode].map((s, i) => (
              <div
                key={`${activeMode}-${i}`}
                className="suggestion-item"
                onClick={() => setIsChatExpanded(true)}
              >
                <span className="suggestion-item__label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Morning Notes Card */}
        {/* <div className="overview__morning-note">
          <MorningNoteCard onEventClick={handleEventAlertClick} eventCompleted={eventCompleted} hideCompletedEvent={hideCompletedEvent} />
        </div> */}

        {/* Day at a Glance - Collapsible Overlay */}
        <div className={`day-glance-overlay ${isDayGlanceExpanded ? 'day-glance-overlay--expanded' : 'day-glance-overlay--collapsed'}`}>
          <div className="sidebar-section sidebar-section--day-glance">
          <div className="day-glance-header">
            <div className="day-glance-header-top">
              <h3 className="sidebar-section-main-title">Day at a Glance</h3>
            </div>
          </div>
          
          {/* Priority Actions - Combined */}
          <div className="day-glance-subsection">
            <div className="day-glance-subsection-header">
              <h4 className="day-glance-subtitle">Priority Actions</h4>
              <button className="view-more-link" onClick={() => navigate('/prioritize')}>View More</button>
            </div>
            
            {/* Meetings Group */}
            <div className="priority-section-group">
              <div className="meetings-timeline">
              <div className="meeting-timeline-item" onClick={() => console.log('Prep meeting')}>
                <div className="meeting-timeline-left">
                  <div className="meeting-timeline-time">
                    <span className="meeting-time-hour">10:00</span>
                    <span className="meeting-time-period">AM</span>
                  </div>
                  <div className="meeting-timeline-content">
                    <span className="meeting-timeline-client">Mary Hargrave</span>
                    <span className="meeting-timeline-topic">Portfolio Review</span>
                  </div>
                </div>
                <button className="meeting-timeline-action">Prep</button>
              </div>
              <div className="meeting-timeline-item" onClick={() => console.log('Join meeting')}>
                <div className="meeting-timeline-left">
                  <div className="meeting-timeline-time">
                    <span className="meeting-time-hour">11:00</span>
                    <span className="meeting-time-period">AM</span>
                  </div>
                  <div className="meeting-timeline-content">
                    <span className="meeting-timeline-client">Sam Pai</span>
                    <span className="meeting-timeline-topic">Investment Strategy</span>
                  </div>
                </div>
                <button className="meeting-timeline-action meeting-timeline-action--live">Join</button>
              </div>
              <div className="meeting-timeline-item" onClick={() => console.log('Prep meeting')}>
                <div className="meeting-timeline-left">
                  <div className="meeting-timeline-time">
                    <span className="meeting-time-hour">2:30</span>
                    <span className="meeting-time-period">PM</span>
                  </div>
                  <div className="meeting-timeline-content">
                    <span className="meeting-timeline-client">Alex Morgan</span>
                    <span className="meeting-timeline-topic">Quarterly Review</span>
                  </div>
                </div>
                <button className="meeting-timeline-action">Prep</button>
              </div>
              </div>
            </div>

            <div className="priority-section-divider" />
            
            {/* Action Items Group */}
            <div className="priority-section-group">
              <div className="priority-actions-grid">
              {actionCards.map((card) => (
                <div key={card.name} className={card.urgent ? 'action-card-wrapper action-card-wrapper--urgent' : 'action-card-wrapper'}>
                  <UniversalCard
                    type="action-list"
                    data={{ name: card.name, clients: card.clients, icon: card.icon, onClick: card.onClick }}
                  />
                </div>
              ))}
            </div>
            </div>
          </div>
        </div>
        </div>
        
        {/* Toggle Button - Outside overlay */}
        <button 
          className={`day-glance-toggle ${isDayGlanceExpanded ? 'day-glance-toggle--expanded' : 'day-glance-toggle--collapsed'}`}
          onClick={() => setIsDayGlanceExpanded(!isDayGlanceExpanded)}
          aria-label={isDayGlanceExpanded ? 'Collapse' : 'Expand'}
        >
          <span className="day-glance-toggle-text">DAY AT GLANCE</span>
          {isDayGlanceExpanded ? <ChevronRight size={24} /> : <ChevronLeft size={24} />}
        </button>
      </div>
    </div>
  );
};

export default Overview;
