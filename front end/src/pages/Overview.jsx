import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Sparkles, Send, X, ArrowLeft, TrendingUp, FileText,
  AlertTriangle, User, BarChart3, DollarSign, Mail, Users,
  ArrowRight, RefreshCw, ChevronRight, SlidersHorizontal
} from 'lucide-react';
import UniversalCard from '../components/UniversalCard';
import BackendChatInterface from '../components/BackendChatInterface';
import { useOverviewContext } from '../contexts/OverviewContext';
import { activeMarketEvent, generateMailPreview } from '../data/marketEventData';
import worklistData from '../data/worklistCustomers.json';
import Spinner from '../components/Spinner';
import './Overview.css';

const Overview = ({ isChatExpanded, setIsChatExpanded }) => {
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
  const [hideCompletedEvent, setHideCompletedEvent] = useState(() => localStorage.getItem('mailerEventCompleted') === 'true');

  const [isMeetingsOpen, setIsMeetingsOpen] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState(null);
  const [meetingTab, setMeetingTab] = useState('today');
  const [showMeetingSettings, setShowMeetingSettings] = useState(false);
  const [autoGenerate, setAutoGenerate] = useState(false);
  const [queueDays, setQueueDays] = useState('1');
  const [googleStatus, setGoogleStatus] = useState(() => localStorage.getItem('googleCalConnected') === 'true' ? 'connected' : 'idle');
  const [prepStatus, setPrepStatus] = useState({});
  const [prepStep, setPrepStep] = useState({});

  const AGENT_STEPS = [
    'Pulling calendar context & meeting notes...',
    'Analysing portfolio & recent activity...',
    'Running risk & compliance checks...',
    'Drafting discussion angles & NBA...',
    'Finalising meeting brief...',
  ];

  const handleGenerate = (clientId) => {
    setPrepStatus(p => ({ ...p, [clientId]: 'generating' }));
    setPrepStep(p => ({ ...p, [clientId]: 0 }));
    let step = 0;
    const interval = setInterval(() => {
      step += 1;
      if (step < AGENT_STEPS.length) {
        setPrepStep(p => ({ ...p, [clientId]: step }));
      } else {
        clearInterval(interval);
        setPrepStatus(p => ({ ...p, [clientId]: 'ready' }));
      }
    }, 4000);
  };

  const handleGoogleConnect = () => {
    window.open('https://accounts.google.com', '_blank');
    setGoogleStatus('loading');
    setTimeout(() => {
      setGoogleStatus('connected');
      localStorage.setItem('googleCalConnected', 'true');
    }, 5000);
  };

  const priorityProfiles = [
    // 1. Mary Hargrave — from worklist, first entry
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
      profession: c.BusinessOwner ? 'business owner' : (c.FirstName === 'Mary' ? 'marketing executive' : null),
      trigger: c.Trigger,
      rebalanceReason: c.RebalanceReason,
      keyContext: c.KeyContext || [],
      intro: [
        `${c.Age}y/o`,
        c.RiskProfile >= 0.35 ? 'moderate growth' : c.RiskProfile >= 0.2 ? 'moderate' : c.RiskProfile >= 0.1 ? 'low risk' : 'conservative',
        c.BusinessOwner ? 'business owner' : (c.FirstName === 'Mary' ? 'marketing executive' : null),
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
    // 2. Sam Pai
    {
      id: 15678284,
      name: 'Sam Pai',
      aum: 390000,
      return: 0.087,
      risk: 0.23,
      creditScore: 590,
      age: 35,
      priority: 'Medium',
      profession: 'business owner',
      trigger: 'Market conditions and portfolio positioning makes this the right opportunity to advance the client\'s long-term goals with a timely proposal',
      rebalanceReason: 'Investment Proposal Review',
      keyContext: ['Portfolio trend: Moderate growth, business owner', 'Client Sensitivity: Family financial planning \u2191', 'Market Backdrop: Rate uncertainty'],
      intro: '35y/o \u00b7 moderate \u00b7 business owner \u00b7 3 products',
      actions: [
        { label: 'Investment Proposal Review', route: '/action/proposal/15678284' },
        { label: 'Engagement Letter', route: '/client/15678284/profile' },
      ],
    },
    // 3. Kevin Smyth
    {
      id: 'C012',
      name: 'Kevin Smyth',
      aum: 850000,
      return: 0.048,
      risk: 0.20,
      creditScore: 680,
      age: 44,
      priority: 'Medium',
      profession: null,
      riskLabel: 'Moderate',
      trigger: 'Defensive bias materially limiting growth — 40% cash vs 20% IPS target creating return drag and increasing suitability review risk.',
      rebalanceReason: 'Cash Deployment',
      keyContext: ['Cash 40% vs 20% target', 'Behavioral inconsistency risk', 'IPS misalignment increasing'],
      intro: '44y/o \u00b7 mass affluent \u00b7 advisory \u00b7 accumulation',
      actions: [
        { label: 'Cash Deployment Review', route: '/client/C012/rebalancing' },
        { label: 'IPS Review', route: '/client/C012/ips' },
      ],
    },
    // 4. Sarah Jenkins
    {
      id: 'C013',
      name: 'Sarah Jenkins',
      aum: 3000000,
      return: 0.143,
      risk: 0.90,
      creditScore: 740,
      age: 48,
      priority: 'High',
      profession: null,
      riskLabel: 'Aggressive Growth',
      trigger: 'Strong returns have pushed equity to 90% vs 80% IPS target — risk beyond comfort zone, rebalancing suitability-critical.',
      rebalanceReason: 'Equity Rebalancing',
      keyContext: ['Equity 90% vs 80% target', 'Volatility risk elevated', 'Suitability review required'],
      intro: '48y/o \u00b7 high net worth \u00b7 advisory \u00b7 accumulation',
      actions: [
        { label: 'Rebalance Portfolio', route: '/client/C013/rebalancing' },
        { label: 'Risk Analysis', route: '/client/C013/risk-analysis' },
      ],
    },
    // 5. David Thompson
    {
      id: 'C005',
      name: 'David Thompson',
      aum: 1590000,
      return: 0.112,
      risk: 0.78,
      creditScore: 720,
      age: 54,
      priority: 'Critical',
      profession: null,
      riskLabel: 'Moderate Growth',
      trigger: 'Excess idle cash of >$350K above target — compliance escalation triggered. Deploy cash and address behavioral anxiety before drift widens.',
      rebalanceReason: 'Cash Deployment & Compliance Escalation',
      keyContext: ['Cash 22% vs 10% target — >$350K idle', 'Compliance: Advice boundary breached', 'Behavioral Risk: Elevated (score 83)'],
      intro: '54y/o · high net worth · advisory · 1 account',
      actions: [
        { label: 'Cash Deployment', route: '/meeting-prep/C005' },
        { label: 'Meeting Prep — 9:00 AM', route: '/meeting-prep/C005' },
      ],
    },
    // 6: Margaret Davis (original position)
    ...worklistData.rebalancing.filter(c => c.CustomerID !== 15740900 && c.CustomerID !== 15623828).slice(2, 3).map(c => ({
      id: c.CustomerID,
      name: `${c.FirstName} ${c.Surname}`,
      aum: c.NetAssets,
      return: c.PortfolioReturn,
      risk: c.RiskProfile,
      creditScore: c.CreditScore,
      age: c.Age,
      priority: c.Priority || 'Medium',
      riskLabel: null,
      profession: c.BusinessOwner ? 'business owner' : null,
      trigger: c.Trigger,
      rebalanceReason: c.RebalanceReason,
      keyContext: c.KeyContext || [],
      intro: [
        `${c.Age}y/o`,
        c.RiskProfile >= 0.35 ? 'moderate growth' : c.RiskProfile >= 0.2 ? 'moderate' : c.RiskProfile >= 0.1 ? 'low risk' : 'conservative',
        c.BusinessOwner ? 'business owner' : null,
        `${c.NumProducts} product${c.NumProducts !== 1 ? 's' : ''}`,
      ].filter(Boolean).join(' \u00b7 '),
      actions: [
        { label: c.RebalanceReason, route: `/client/${c.CustomerID}/rebalancing` },
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

  // Only runs on mount — handles deep-link into chat via ?mode= param
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (location.pathname === '/chat' || searchParams.get('mode')) setIsChatExpanded(true);
  }, []);

  // Runs whenever search params change — handles mass mailer pill click (?event=mailer)
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('event') === 'mailer') {
      handleEventAlertClick('market-event');
      navigate('/', { replace: true });
    }
  }, [location.search]);

  // Clean up when chat closes (e.g. via MainLayout Back button)
  useEffect(() => {
    if (!isChatExpanded) {
      setEventData(null);
      setEventChatMessages([]);
      setMailStatus({});
      setChatInput('');
    }
  }, [isChatExpanded]);

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
  const handleChatExpand = (v) => { setIsChatExpanded(v); if (!v) { setEventData(null); setEventChatMessages([]); setMailStatus({}); setChatInput(''); navigate('/'); } };
  const fmt = (v) => v >= 1000000 ? `$${(v/1000000).toFixed(1)}M` : v >= 1000 ? `$${(v/1000).toFixed(0)}K` : `$${v}`;

  return (
    <div className={`overview${isChatExpanded ? ' overview--chat-open' : ''}`}>

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
          <div className="chat-expanded">
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
                          <div className="event-stat"><span className="event-stat__value">~${(activeMarketEvent.impactSummary.totalProjectedLoss/1000).toFixed(0)}K</span><span className="event-stat__label">Est. Loss (approx)</span></div>
                          <div className="event-stat"><span className="event-stat__value">${(activeMarketEvent.impactSummary.totalExposure/1000000).toFixed(1)}M</span><span className="event-stat__label">Total Exposure</span></div>
                          <div className="event-stat"><span className="event-stat__value">~{activeMarketEvent.impactSummary.averageLossPercentage}%</span><span className="event-stat__label">Avg Loss (approx)</span></div>
                        </div>

                        <div className="event-overview-card__section">
                          <h4>Priority Client Actions</h4>
                          <div className="event-clients-table">
                            <table>
                              <thead>
                                <tr>
                                  <th>#</th>
                                  <th>Client</th>
                                  <th>Severity</th>
                                  <th>Portfolio</th>
                                  <th>Est. Loss (approx)</th>
                                  <th>Recommended Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {activeMarketEvent.affectedClients.map((client, idx) => (
                                  <tr key={client.clientId}>
                                    <td>{idx + 1}</td>
                                    <td>
                                      <strong>{client.clientName}</strong>
                                      <br />
                                      <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{client.age}y · {client.riskProfile}</span>
                                    </td>
                                    <td><span className={`severity-badge severity-badge--${client.severity.toLowerCase()}`}>{client.severity}</span></td>
                                    <td>
                                      ${(client.currentValue/1000).toFixed(0)}K
                                      <br />
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
                                  setHideCompletedEvent(true);
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
                    <span className="ov-card__title">Priority Queue</span>
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
                      className={`ov-profiles-list__item${(selectedProfile?.id === p.id) ? ' ov-profiles-list__item--active' : ''}${p.priority === 'Critical' ? ' ov-profiles-list__item--critical' : p.priority === 'High' ? ' ov-profiles-list__item--high' : ''}`}
                      onClick={() => setSelectedProfileId(p.id)}
                    >
                      <div className="ov-profiles-list__info">
                        <div className="ov-profiles-list__row1">
                          <span className="ov-profiles-list__name">{p.name}</span>
                          <span className={`ov-profiles-list__priority-pill ov-profiles-list__priority-pill--${p.priority.toLowerCase()}`}>{p.priority}</span>
                        </div>
                        <span className="ov-profiles-list__trigger">{p.rebalanceReason}</span>
                        <span className="ov-profiles-list__aum">
                          {fmt(p.aum)} <span className="ov-profiles-list__ret">+{(p.return*100).toFixed(1)}%</span>
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
                    {[['AUM', fmt(selectedProfile.aum), false],
                      ['Return', `+${(selectedProfile.return*100).toFixed(1)}%`, true],
                      ['Risk', selectedProfile.riskLabel || (selectedProfile.risk >= 0.35 ? 'Moderate Growth' : selectedProfile.risk >= 0.2 ? 'Moderate' : selectedProfile.risk >= 0.1 ? 'Low Risk' : 'Conservative'), false],
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

            {/* Row 1: Title + View More */}
            <div className="ov-card__head">
              <span className="ov-card__title">Meeting Intelligence</span>
              <span className="ov-view-all" onClick={() => navigate('/prioritize')}>View More <ChevronRight size={11} /></span>
            </div>

            {/* Row 2: Tabs + Settings icon */}
            <div className="ov-meeting-tabs-row">
              <div className="ov-meeting-tabs">
                <button className={`ov-meeting-tab${meetingTab === 'today' ? ' ov-meeting-tab--active' : ''}`} onClick={() => setMeetingTab('today')}>Today</button>
                <button className={`ov-meeting-tab${meetingTab === 'upcoming' ? ' ov-meeting-tab--active' : ''}`} onClick={() => setMeetingTab('upcoming')}>Upcoming</button>
              </div>
              <button className="ov-settings-btn" onClick={() => setShowMeetingSettings(true)} title="Meeting Prep Settings">
                <SlidersHorizontal size={14} />
              </button>
            </div>

            {/* Fixed date label — always rendered to prevent height jump */}
            <div className="ov-meetings-date-label">
              {meetingTab === 'today'
                ? `Today · ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}`
                : 'Upcoming Meetings'
              }
            </div>

            {/* Scrollable meeting list */}
            <div className="ov-meetings-scroll">
              {meetingTab === 'today' ? (
                [
                  { time: '9:00',  period: 'AM', client: 'David Thompson', topic: 'Cash Deployment & Compliance Review', clientId: 'C005',     generate: true },
                  { time: '10:00', period: 'AM', client: 'Kevin Smyth',    topic: 'Cash Deployment Review',             clientId: 'C012',     generate: true },
                  { time: '2:30',  period: 'PM', client: 'Alex Morgan',    topic: 'Quarterly Review',                   clientId: '15600001', generate: false },
                  { time: '4:00',  period: 'PM', client: 'Mary Hargrave',  topic: 'Portfolio Realignment',              clientId: '15634602', generate: false },
                ]
                .filter(m => !m.generate || googleStatus === 'connected')
                .map(m => {
                  const status = prepStatus[m.clientId];
                  const step   = prepStep[m.clientId] || 0;
                  const isGenerating = status === 'generating';
                  return (
                    <div key={m.clientId} className="ov-meeting-row-wrap">
                      <div className="ov-meeting-row">
                        <div className="ov-meeting-row__time">
                          <span>{m.time}</span>
                          <span className="ov-meeting-row__period">{m.period}</span>
                        </div>
                        {isGenerating ? (
                          <div className="ov-meeting-row__generating">
                            <span className="ov-meeting-row__client">{m.client}</span>
                            <div className="ov-agent-steps-inline">
                              <div className="ov-agent-step ov-agent-step--active">
                                <span className="ov-agent-step__dot" />
                                <span className="ov-agent-step__text">{AGENT_STEPS[step]}</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="ov-meeting-row__info">
                            <span className="ov-meeting-row__client">{m.client}</span>
                            <span className="ov-meeting-row__topic">{m.topic}</span>
                          </div>
                        )}
                        <div className="ov-meeting-row__action">
                          {m.generate ? (
                            status === 'ready' ? (
                              <button className="ov-meeting-row__btn ov-meeting-row__btn--ready" onClick={() => navigate(`/meeting-prep/${m.clientId}`)}>View Prep</button>
                            ) : isGenerating ? (
                              <Spinner size={16} />
                            ) : (
                              <button className="ov-meeting-row__btn ov-meeting-row__btn--generate" onClick={(e) => { e.stopPropagation(); handleGenerate(m.clientId); }}>Generate</button>
                            )
                          ) : (
                            <button className="ov-meeting-row__btn ov-meeting-row__btn--ready" onClick={() => navigate(`/meeting-prep/${m.clientId}`)}>View Prep</button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                [
                  { date: 'Tomorrow',  dateLabel: 'Tomorrow', client: 'Sarah Jenkins',  topic: 'Portfolio Risk Review',  clientId: 'C013' },
                  { date: 'Wed 22',    dateLabel: 'Wed, May 22', client: 'Mary Hargrave',  topic: 'Q2 Rebalancing Review',  clientId: '15634602' },
                  { date: 'Thu 23',    dateLabel: 'Thu, May 23', client: 'Sam Pai',        topic: 'Investment Proposal',    clientId: '15678284' },
                  { date: 'Fri 24',    dateLabel: 'Fri, May 24', client: 'Kevin Smyth',    topic: 'IPS Follow-up',          clientId: 'C012' },
                ].reduce((acc, m, i, arr) => {
                  const prevDate = i > 0 ? arr[i - 1].date : null;
                  if (m.date !== prevDate) {
                    acc.push(<div key={`label-${m.date}`} className="ov-meetings-date-label ov-meetings-date-label--group">{m.dateLabel}</div>);
                  }
                  acc.push(
                    <div key={m.clientId} className="ov-meeting-row ov-meeting-row--upcoming">
                      <div className="ov-meeting-row__date">{m.date}</div>
                      <div className="ov-meeting-row__info">
                        <span className="ov-meeting-row__client">{m.client}</span>
                        <span className="ov-meeting-row__topic">{m.topic}</span>
                      </div>
                      <button className="ov-meeting-row__btn ov-meeting-row__btn--generate" onClick={() => navigate(`/meeting-prep/${m.clientId}`)}>Generate</button>
                    </div>
                  );
                  return acc;
                }, [])
              )}

            </div>

            {/* Status strip */}
            <div className="ov-meetings-status">
              <span className="ov-meetings-status__item ov-meetings-status__item--connected">
                <span className="ov-meetings-status__dot" /> Outlook
              </span>
              <span className={`ov-meetings-status__item${googleStatus === 'connected' ? ' ov-meetings-status__item--connected' : ' ov-meetings-status__item--off'}`}>
                <span className="ov-meetings-status__dot" /> Google
              </span>
              <span className="ov-meetings-status__item ov-meetings-status__item--muted">
                Auto-gen: {autoGenerate ? 'On' : 'Off'}
              </span>
              <span className="ov-meetings-status__item ov-meetings-status__item--muted">
                Queue: {queueDays === '1' ? '1 day' : queueDays === '3' ? '3 days' : '1 week'}
              </span>
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
      {/* Meeting Prep Settings Modal */}
      {showMeetingSettings && (
        <div className="ov-modal-overlay" onClick={() => setShowMeetingSettings(false)}>
          <div className="ov-settings-modal" onClick={e => e.stopPropagation()}>
            <div className="ov-settings-modal__head">
              <span className="ov-settings-modal__title"><SlidersHorizontal size={15} /> Meeting Prep Settings</span>
              <button className="ov-settings-modal__close" onClick={() => setShowMeetingSettings(false)}>✕</button>
            </div>
            <div className="ov-settings-section">
              <span className="ov-settings-section__label">Controls</span>
              <div className="ov-settings-row">
                <div className="ov-settings-row__info">
                  <span className="ov-settings-row__name">Auto-generate prep</span>
                  <span className="ov-settings-row__desc">Automatically generate meeting prep for meetings within 24 hours</span>
                </div>
                <button className={`ov-toggle${autoGenerate ? ' ov-toggle--on' : ''}`} onClick={() => setAutoGenerate(p => !p)}>
                  <span className="ov-toggle__knob" />
                </button>
              </div>
              <div className="ov-settings-row">
                <div className="ov-settings-row__info">
                  <span className="ov-settings-row__name">Queue prep ahead</span>
                  <span className="ov-settings-row__desc">How many days ahead to queue meeting prep</span>
                </div>
                <select className="ov-settings-select" value={queueDays} onChange={e => setQueueDays(e.target.value)}>
                  <option value="1">1 day</option>
                  <option value="3">3 days</option>
                  <option value="7">1 week</option>
                </select>
              </div>
            </div>
            <div className="ov-settings-section ov-settings-section--tinted">
              <span className="ov-settings-section__label">Connectors</span>
              <div className="ov-connector-row">
                <div className="ov-connector-row__left">
                  <div className="ov-connector-logo ov-connector-logo--outlook">O</div>
                  <div className="ov-connector-row__info">
                    <span className="ov-connector-row__name">Outlook Calendar</span>
                    <span className="ov-connector-row__status ov-connector-row__status--connected">
                      <span className="ov-connector-row__status-dot" />Connected
                    </span>
                  </div>
                </div>
                <button className="ov-connector-btn ov-connector-btn--disconnect">Disconnect</button>
              </div>
              <div className="ov-connector-row">
                <div className="ov-connector-row__left">
                  <div className="ov-connector-logo ov-connector-logo--google">G</div>
                  <div className="ov-connector-row__info">
                    <span className="ov-connector-row__name">Google Calendar</span>
                    <span className={`ov-connector-row__status${googleStatus === 'connected' ? ' ov-connector-row__status--connected' : ' ov-connector-row__status--disabled'}`}>
                      <span className="ov-connector-row__status-dot" />
                      {googleStatus === 'connected' ? 'Connected' : 'Not connected'}
                    </span>
                  </div>
                </div>
                {googleStatus === 'idle' && (
                  <button className="ov-connector-btn ov-connector-btn--connect" onClick={handleGoogleConnect}>Connect</button>
                )}
                {googleStatus === 'loading' && (
                  <button className="ov-connector-btn ov-connector-btn--loading" disabled>
                    <Spinner size={12} /> Connecting...
                  </button>
                )}
                {googleStatus === 'connected' && (
                  <button className="ov-connector-btn ov-connector-btn--disconnect" onClick={() => { setGoogleStatus('idle'); localStorage.removeItem('googleCalConnected'); }}>Disconnect</button>
                )}
              </div>
            </div>
            <div className="ov-settings-modal__footer">
              <button className="ov-settings-footer-btn ov-settings-footer-btn--reset" onClick={() => {
                setAutoGenerate(false);
                setQueueDays('1');
                setGoogleStatus('idle');
                setPrepStatus({});
                setPrepStep({});
                localStorage.removeItem('googleCalConnected');
              }}>Reset</button>
              <div className="ov-settings-footer-right">
                <button className="ov-settings-footer-btn ov-settings-footer-btn--cancel" onClick={() => setShowMeetingSettings(false)}>Cancel</button>
                <button className="ov-settings-footer-btn ov-settings-footer-btn--apply" onClick={() => setShowMeetingSettings(false)}>Apply</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Overview;
