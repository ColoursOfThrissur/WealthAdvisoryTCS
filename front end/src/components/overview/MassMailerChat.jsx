import { useState, useEffect, useRef } from 'react';
import { Send, X, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import BackendChatInterface from '../BackendChatInterface';
import Spinner from '../Spinner';
import { activeMarketEvent, generateMailPreview } from '../../data/marketEventData';
import './MassMailerChat.css';

const MassMailerChat = ({ eventData, isChatExpanded, setIsChatExpanded, setEventData }) => {
  const [chatInput, setChatInput] = useState('');
  const [eventChatMessages, setEventChatMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [mailStatus, setMailStatus] = useState({});
  const [selectedMailClient, setSelectedMailClient] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [eventChatMessages, isLoading]);

  function handleChatSubmit(e) {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const msg = chatInput.trim();
    if (eventData) setEventChatMessages(prev => [...prev, { text: msg, sender: 'user' }]);
    setChatInput('');
    if (eventData && (msg.toLowerCase().includes('yes') || msg.toLowerCase().includes('send'))) {
      setLoadingMessage('Sending personalized emails...');
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        setEventChatMessages(prev => [...prev, { type: 'mail-sent', sender: 'ai' }]);
      }, 4000);
    } else if (eventData && msg.toLowerCase().includes('email')) {
      setLoadingMessage('Preparing communications...');
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        setEventChatMessages(prev => [...prev, { type: 'mail-generation', sender: 'ai' }]);
      }, 3000);
    }
  }

  const handleSuggestionClick = (s) => {
    setChatInput(s);
    handleChatSubmit({ preventDefault: () => {} });
  };

  const handleReviewMail = (id) =>
    setSelectedMailClient(activeMarketEvent.affectedClients.find(c => c.clientId === id));

  const handleConfirmMail = () => {
    setMailStatus(prev => ({ ...prev, [selectedMailClient.clientId]: 'confirmed' }));
    setSelectedMailClient(null);
  };

  if (!isChatExpanded) return null;

  return (
    <>
      {/* Mail Preview Modal */}
      {selectedMailClient && (
        <div className="mail-preview-modal-overlay" onClick={() => setSelectedMailClient(null)}>
          <div className="mail-preview-modal" onClick={e => e.stopPropagation()}>
            <div className="mail-preview-modal__header">
              <h3>Email Preview &mdash; {selectedMailClient.clientName}</h3>
              <button className="mail-preview-modal__close" onClick={() => setSelectedMailClient(null)}>
                <X size={20} />
              </button>
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
                      <span className="mail-impact-value impact-negative">
                        -${selectedMailClient.projectedLoss.toLocaleString()} ({selectedMailClient.lossPercentage}%)
                      </span>
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
                        {[
                          ['Bonds', selectedMailClient.portfolioDetails.currentAllocation.bonds, 'var(--info)'],
                          ['Stocks', selectedMailClient.portfolioDetails.currentAllocation.stocks, 'var(--success)'],
                          ['Energy', selectedMailClient.portfolioDetails.currentAllocation.energy, 'var(--warning)'],
                        ].map(([label, pct, color]) => (
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
                    <div className="mail-allocation-arrow"><ArrowRight size={18} /></div>
                    <div className="mail-allocation-col">
                      <span className="mail-allocation-label">Proposed</span>
                      <div className="mail-allocation-bars">
                        {[
                          ['Bonds', selectedMailClient.portfolioDetails.proposedAllocation.bonds, 'var(--info)'],
                          ['Stocks', selectedMailClient.portfolioDetails.proposedAllocation.stocks, 'var(--success)'],
                          ['Energy', selectedMailClient.portfolioDetails.proposedAllocation.energy, 'var(--warning)'],
                        ].map(([label, pct, color]) => (
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
                <p>Best regards,<br />Your Wealth Advisor</p>
              </div>
            </div>
            <div className="mail-preview-modal__footer">
              <button className="mail-preview-btn mail-preview-btn--cancel" onClick={() => setSelectedMailClient(null)}>Cancel</button>
              <button className="mail-preview-btn mail-preview-btn--confirm" onClick={handleConfirmMail}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Chat overlay */}
      <div className="overview__chat-overlay">

        {/* When eventData is set — mass mailer flow with its own layout */}
        {eventData ? (
          <div className="chat-expanded">
            <div className="chat-expanded__content">
              <div className="chat-expanded__messages">

                {/* Event overview card */}
                <div className="chat-expanded__message chat-expanded__message--ai chat-expanded__message--card">
                  <div className="event-overview-card">
                    <div className="event-overview-card__header">
                      <AlertTriangle size={24} color="var(--warning)" />
                      <div>
                        <h3>{activeMarketEvent.title}</h3>
                        <span className="event-overview-card__meta">
                          {activeMarketEvent.timestamp.split('T')[0]} &middot; {activeMarketEvent.severity} Severity &middot; {activeMarketEvent.subtitle}
                        </span>
                      </div>
                    </div>
                    <div className="event-overview-card__section">
                      <h4>Market Event Summary</h4>
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
                      <div className="event-stat"><span className="event-stat__value">~${(activeMarketEvent.impactSummary.totalProjectedLoss / 1000).toFixed(0)}K</span><span className="event-stat__label">Est. Loss</span></div>
                      <div className="event-stat"><span className="event-stat__value">${(activeMarketEvent.impactSummary.totalExposure / 1000000).toFixed(1)}M</span><span className="event-stat__label">Total Exposure</span></div>
                      <div className="event-stat"><span className="event-stat__value">~{activeMarketEvent.impactSummary.averageLossPercentage}%</span><span className="event-stat__label">Avg Loss</span></div>
                    </div>
                    <div className="event-overview-card__section">
                      <h4>Priority Client Actions</h4>
                      <div className="event-clients-table">
                        <table>
                          <thead>
                            <tr>
                              <th>#</th><th>Client</th><th>Severity</th><th>Portfolio</th><th>Est. Loss</th><th>Recommended Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {activeMarketEvent.affectedClients.map((client, idx) => (
                              <tr key={client.clientId}>
                                <td>{idx + 1}</td>
                                <td>
                                  <strong>{client.clientName}</strong><br />
                                  <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{client.age}y &middot; {client.riskProfile}</span>
                                </td>
                                <td><span className={`severity-badge severity-badge--${client.severity.toLowerCase()}`}>{client.severity}</span></td>
                                <td>
                                  ${(client.currentValue / 1000).toFixed(0)}K<br />
                                  <span style={{ color: 'var(--success)', fontWeight: 600, fontSize: '0.75rem' }}>+{client.portfolioReturn}%</span>
                                </td>
                                <td style={{ color: 'var(--error)', fontWeight: 600 }}>~${client.projectedLoss.toLocaleString()} (~{client.lossPercentage}%)</td>
                                <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{client.recommendedAction}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Initial suggestions */}
                <div className="chat-expanded__message chat-expanded__message--ai chat-expanded__message--card">
                  <div className="chat-suggestions">
                    <p className="chat-suggestions__label">What would you like to do?</p>
                    <div className="chat-suggestions__buttons">
                      <button className="chat-suggestion-btn" onClick={() => handleSuggestionClick('Generate personalized emails for affected clients')}>Generate personalized emails</button>
                      <button className="chat-suggestion-btn" onClick={() => handleSuggestionClick('Review recommended portfolio adjustments')}>Review portfolio adjustments</button>
                    </div>
                  </div>
                </div>

                {/* Conversation messages */}
                {eventChatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`chat-expanded__message chat-expanded__message--${msg.sender}${msg.type === 'mail-generation' || msg.type === 'mail-sent' ? ' chat-expanded__message--card' : ''}`}
                  >
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
                        <p className="success-message"><CheckCircle size={20} /> Emails sent successfully</p>
                        <div className="completion-summary">
                          <h4>Market Event Response &mdash; {activeMarketEvent.title}</h4>
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
                                  <span>Est. Portfolio Impact: ~${client.projectedLoss.toLocaleString()} (~{client.lossPercentage}%)</span>
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
                              setEventData(null);
                              setIsChatExpanded(false);
                              setEventChatMessages([]);
                              setMailStatus({});
                              setChatInput('');
                              localStorage.setItem('mailerEventCompleted', 'true');
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
                    <div className="chat-loading"><Spinner size={22} /><span>{loadingMessage}</span></div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <form className="chat-expanded__input" onSubmit={handleChatSubmit}>
                <input
                  type="text"
                  placeholder="Ask AI..."
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                />
                <button type="submit" disabled={!chatInput.trim()}><Send size={20} /></button>
              </form>
            </div>
          </div>
        ) : (
          /* Normal AI chat — BackendChatInterface fills the overlay directly */
          <BackendChatInterface onClose={() => setIsChatExpanded(false)} />
        )}
      </div>
    </>
  );
};

export default MassMailerChat;
