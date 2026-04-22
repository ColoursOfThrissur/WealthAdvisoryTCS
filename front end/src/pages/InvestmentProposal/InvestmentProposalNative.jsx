import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Target, TrendingUp, PieChart, ChevronDown, ChevronUp, FileText, MessageSquare, Sparkles, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { investmentProposalData } from '../../data/mockData';
import { chatResponseEngine } from '../../data/mockData';
import PortfolioComparisonCard from './PortfolioComparisonCard';
import ModificationCard from './ModificationCard';
import SuggestionsCard from './SuggestionsCard';
import './InvestmentProposalNative.css';

const InvestmentProposalNative = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [isChatPanelActive, setIsChatPanelActive] = useState(false);
  const data = investmentProposalData.investment_proposal;
  const [selectedRisk, setSelectedRisk] = useState('Moderate');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [showMeetingNotes, setShowMeetingNotes] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    section1: false,
    section1b: false,
    section2: true,
    section3: false,
    section4: false
  });
  const [dynamicCards, setDynamicCards] = useState([]);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { role: 'agent', content: '👋 Hi! I\'m your Investment Proposal Agent. I can help you:\n\n• Compare portfolio options\n• Modify allocations\n• Suggest optimizations\n\nWhat would you like to do?' }
  ]);
  const [isAgentTyping, setIsAgentTyping] = useState(false);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Show only recommended portfolios (primary: Moderate, secondary: Moderately Aggressive)
  const recommendedProfiles = ['Moderate', 'Moderately Aggressive'];
  const selectedPortfolio = data.risk_model_portfolios[selectedRisk];

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const sortedTickers = [...data.moderate_model_tickers].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const aVal = a[sortConfig.key];
    const bVal = b[sortConfig.key];
    return sortConfig.direction === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
  });

  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const userMessage = { role: 'user', content: chatMessage };
    setChatHistory([...chatHistory, userMessage]);
    setChatMessage('');
    setIsAgentTyping(true);

    setTimeout(() => {
      const response = chatResponseEngine.processMessage(chatMessage);
      
      if (response.cardType) {
        const newCard = {
          id: Date.now(),
          type: response.cardType,
          data: response.data
        };
        setDynamicCards([...dynamicCards, newCard]);
      }

      const agentMessage = { role: 'agent', content: response.agentResponse };
      setChatHistory(prev => [...prev, agentMessage]);
      setIsAgentTyping(false);
    }, 800);
  };

  const handleCloseCard = (cardId) => {
    setDynamicCards(dynamicCards.filter(card => card.id !== cardId));
  };

  const handlePortfolioSelect = (portfolio) => {
    setSelectedRisk(portfolio.name);
    const message = { role: 'agent', content: `Portfolio "${portfolio.name}" has been selected and applied to the proposal.` };
    setChatHistory([...chatHistory, message]);
  };

  const handleApplyModification = (allocation) => {
    const message = { role: 'agent', content: `Portfolio allocation has been updated: Equity ${allocation.equity}%, Bonds ${allocation.bonds}%, Cash ${allocation.cash}%` };
    setChatHistory([...chatHistory, message]);
  };

  const handleApplySuggestion = (suggestion) => {
    const message = { role: 'agent', content: `Applied suggestion: "${suggestion.title}". The changes have been incorporated into the proposal.` };
    setChatHistory([...chatHistory, message]);
  };

  const chartOptions = {
    chart: { backgroundColor: 'var(--color-base-800)', height: 500, zoomType: 'x' },
    title: { text: '', style: { color: 'var(--color-text-primary)' } },
    xAxis: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      labels: { style: { color: 'var(--color-text-secondary)' } },
      crosshair: true
    },
    yAxis: {
      title: { text: 'Normalized Value (Start=100)', style: { color: 'var(--color-text-primary)' } },
      labels: { style: { color: 'var(--color-text-secondary)' } }
    },
    tooltip: {
      shared: true,
      crosshairs: true,
      backgroundColor: 'var(--color-base-700)',
      style: { color: 'var(--color-text-primary)' },
      valueDecimals: 2
    },
    legend: { itemStyle: { color: 'var(--color-text-primary)' } },
    series: [
      {
        name: "S&P 500",
        data: [100, 104.1, 108.5, 112.3, 116.8, 120.2, 121.5, 122.8, 123.1, 123.8, 124.5, 125.1],
        color: 'var(--color-accent-primary)',
        dashStyle: 'dash',
        lineWidth: 2
      },
      {
        name: "Model Portfolio",
        data: [100, 105.2, 110.8, 115.5, 120.2, 124.9, 127.5, 129.3, 130.8, 132.5, 134.2, 135.8],
        color: 'var(--color-accent-secondary)',
        lineWidth: 3
      },
      {
        name: "Current Portfolio",
        data: [100, 102.5, 105.1, 107.8, 110.2, 112.5, 114.8, 115.9, 116.5, 117.1, 117.8, 118.4],
        color: 'var(--color-semantic-error)',
        lineWidth: 3
      }
    ],
    credits: { enabled: false }
  };

  return (
    <div className="ip-page">
      <div className="ip-header">
        <button onClick={() => navigate(-1)} className="ip-back-btn">
          <ArrowLeft size={18} />
          Back
        </button>
      </div>
      <div className="ip-content">
        {/* Section 1: Client Needs */}
        <motion.section
          className="ip-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="ip-section-header" onClick={() => toggleSection('section1')}>
            <Target size={22} />
            <h2>Client Needs Assessment</h2>
            <div className="ip-header-right">
              <button className="ip-meeting-notes-btn" onClick={(e) => { e.stopPropagation(); setShowMeetingNotes(true); }}>
                Meeting Notes
              </button>
              {expandedSections.section1 ? <ChevronUp size={20} className="ip-chevron-icon" /> : <ChevronDown size={20} className="ip-chevron-icon" />}
            </div>
          </div>

          {expandedSections.section1 && (
          <>
          <div className="ip-profile-summary">
            <div className="ip-profile-row">
              <div className="ip-profile-item">
                <label>Net Worth</label>
                <p>${data.client_profile.net_worth.toLocaleString()}</p>
              </div>
              <div className="ip-profile-item">
                <label>Annual Income</label>
                <p>${data.client_profile.annual_income.toLocaleString()}</p>
              </div>
              <div className="ip-profile-item">
                <label>Monthly Expenses</label>
                <p>${data.client_profile.monthly_expenses.toLocaleString()}</p>
              </div>
              <div className="ip-profile-item">
                <label>Investment Experience</label>
                <p>{data.client_profile.investment_experience}</p>
              </div>
            </div>
          </div>

          <div className="ip-needs-grid">
            <div className="ip-goals-card">
              <label>Investment Goals</label>
              <ul>
                <li><strong>Retire at Age 60:</strong> Pai aims to retire with $1 million in assets, providing a secure and comfortable retirement.</li>
                <li><strong>Children's College Savings:</strong> Pai intends to save for his children's college education, with ages currently at 12 and 14.</li>
                <li><strong>Supplement Income:</strong> Pai is looking to enhance his income through returns generated from passive investments.</li>
              </ul>
            </div>
            <div className="ip-risk-card ip-risk-centered">
              <p className="ip-risk-text-large">{data.client_profile.risk_tolerance}</p>
              <p className="ip-risk-desc">Pai has a moderate risk tolerance, balancing the potential for growth with the need for stability in his investment strategy.</p>
            </div>
          </div>
          </>
          )}
        </motion.section>

        {/* Section 1b: Current Holdings */}
        <motion.section
          className="ip-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
        >
          <div className="ip-section-header" onClick={() => toggleSection('section1b')}>
            <PieChart size={22} />
            <h2>Current Holdings</h2>
            {expandedSections.section1b ? <ChevronUp size={20} className="ip-chevron-icon" /> : <ChevronDown size={20} className="ip-chevron-icon" />}
          </div>

          {expandedSections.section1b && (
          <div className="ip-table-container">
            <table className="ip-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('ticker')}>Ticker {sortConfig.key === 'ticker' && (sortConfig.direction === 'asc' ? '▲' : '▼')}</th>
                  <th onClick={() => handleSort('name')}>Name {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '▲' : '▼')}</th>
                  <th onClick={() => handleSort('current_price')}>Price {sortConfig.key === 'current_price' && (sortConfig.direction === 'asc' ? '▲' : '▼')}</th>
                  <th onClick={() => handleSort('ytd_change_percent')}>YTD Change {sortConfig.key === 'ytd_change_percent' && (sortConfig.direction === 'asc' ? '▲' : '▼')}</th>
                  <th onClick={() => handleSort('volume')}>Volume {sortConfig.key === 'volume' && (sortConfig.direction === 'asc' ? '▲' : '▼')}</th>
                </tr>
              </thead>
              <tbody>
                {sortedTickers.map((ticker) => (
                  <motion.tr
                    key={ticker.ticker}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    whileHover={{ backgroundColor: 'var(--color-interactive-hover-bg)' }}
                  >
                    <td className="ticker-cell">{ticker.ticker}</td>
                    <td>{ticker.name}</td>
                    <td className="price-cell">${ticker.current_price.toFixed(2)}</td>
                    <td className={`ytd-cell ${ticker.ytd_change_color}`}>{ticker.ytd_change_display}</td>
                    <td className="volume-cell">{(ticker.volume / 1000000).toFixed(2)}M</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </motion.section>

        {/* Section 2: Model Portfolios */}
        <motion.section
          className="ip-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="ip-section-header" onClick={() => toggleSection('section2')}>
            <PieChart size={22} />
            <h2>Model Portfolio Mapping</h2>
            {expandedSections.section2 ? <ChevronUp size={20} className="ip-chevron-icon" /> : <ChevronDown size={20} className="ip-chevron-icon" />}
          </div>

          {expandedSections.section2 && (
          <>
          <div className="ip-risk-selector">
            {recommendedProfiles.map((risk) => (
              <motion.button
                key={risk}
                className={`ip-risk-option ${selectedRisk === risk ? 'active' : ''}`}
                onClick={() => setSelectedRisk(risk)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="risk-name">{risk}</span>
                <span className="risk-objective">{data.risk_model_portfolios[risk].objective}</span>
              </motion.button>
            ))}
          </div>

          <div className="ip-portfolio-info">
            <h3>{selectedRisk} Portfolio</h3>
            <p>{selectedPortfolio.objective}</p>
          </div>

          <div className="ip-allocation-section">
            {selectedRisk === 'Moderate' && data.moderate_portfolio_allocation && (
              <div className="ip-allocation-percentages">
                <h4>Distribution</h4>
                <div className="ip-alloc-bars">
                  {Object.entries(data.moderate_portfolio_allocation).map(([key, val]) => (
                    <div key={key} className="alloc-bar-item">
                      <div className="alloc-bar-label">
                        <span>{key.replace(/_/g, ' ')}</span>
                        <span className="alloc-bar-percent">{val.percentage}%</span>
                      </div>
                      <div className="alloc-bar-track">
                        <div className="alloc-bar-fill" style={{ width: `${val.percentage}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          </>
          )}
        </motion.section>

        {/* Dynamic Cards Area */}
        <AnimatePresence>
          {dynamicCards.map((card) => (
            <div key={card.id}>
              {card.type === 'PORTFOLIO_COMPARISON' && (
                <PortfolioComparisonCard
                  data={card.data}
                  onClose={() => handleCloseCard(card.id)}
                  onSelect={handlePortfolioSelect}
                />
              )}
              {card.type === 'PORTFOLIO_MODIFICATION' && (
                <ModificationCard
                  data={card.data}
                  onClose={() => handleCloseCard(card.id)}
                  onApply={handleApplyModification}
                />
              )}
              {card.type === 'AUTO_SUGGESTIONS' && (
                <SuggestionsCard
                  data={card.data}
                  onClose={() => handleCloseCard(card.id)}
                  onApply={handleApplySuggestion}
                />
              )}
            </div>
          ))}
        </AnimatePresence>

        {/* Section 3: Performance Chart */}
        <motion.section
          className="ip-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="ip-section-header" onClick={() => toggleSection('section3')}>
            <TrendingUp size={22} />
            <h2>Market Performance Comparison</h2>
            {expandedSections.section3 ? <ChevronUp size={20} className="ip-chevron-icon" /> : <ChevronDown size={20} className="ip-chevron-icon" />}
          </div>
          {expandedSections.section3 && (
          <div className="ip-chart-wrapper">
            <HighchartsReact highcharts={Highcharts} options={chartOptions} />
          </div>
          )}
        </motion.section>

        {/* Section 4: Onboarding Kit */}
        <motion.section
          className="ip-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
        >
          <div className="ip-section-header" onClick={() => toggleSection('section4')}>
            <FileText size={22} />
            <h2>Customer Service Toolkit</h2>
            {expandedSections.section4 ? <ChevronUp size={20} className="ip-chevron-icon" /> : <ChevronDown size={20} className="ip-chevron-icon" />}
          </div>
          {expandedSections.section4 && (
          <>
          <div className="ip-onboarding-message">
            <p>To proceed with investment proposal, you may share these pre-filled forms with client.</p>
          </div>
          <div className="ip-onboarding-grid">
            {data.onboarding_documents.map((doc, idx) => (
              <motion.div
                key={idx}
                className="ip-onboarding-card"
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="onboarding-icon">
                  <FileText size={32} />
                </div>
                <h4>{doc.title}</h4>
                <p>{doc.description}</p>
                <a href={doc.link} target="_blank" rel="noopener noreferrer" className="onboarding-link">
                  View Document →
                </a>
              </motion.div>
            ))}
          </div>
          </>
          )}
        </motion.section>
      </div>

      {showMeetingNotes && (
        <div className="ip-modal-overlay" onClick={() => setShowMeetingNotes(false)}>
          <motion.div 
            className="ip-modal-content"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Meeting Notes</h3>
            <ul className="ip-notes-list">
              {data.meeting_notes.map((note, idx) => (
                <li key={idx}>{note}</li>
              ))}
            </ul>
            <button className="ip-modal-close" onClick={() => setShowMeetingNotes(false)}>
              Close
            </button>
          </motion.div>
        </div>
      )}

      {/* Agent Chat Interface */}
      {isChatPanelActive && (
        <motion.div 
          className="ip-agent-panel"
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          transition={{ type: 'spring', damping: 25 }}
        >
          <div className="ip-agent-header">
            <div className="agent-avatar">
              <Sparkles size={24} />
            </div>
            <div className="agent-info">
              <h4>Investment Proposal Agent</h4>
              <span className="agent-status">
                <span className="status-dot"></span>
                Active
              </span>
            </div>
            <button className="agent-close" onClick={() => setIsChatPanelActive(false)}>
              <ChevronDown size={20} />
            </button>
          </div>

          <div className="ip-agent-messages">
            {chatHistory.map((msg, idx) => (
              <motion.div
                key={idx}
                className={`agent-message ${msg.role}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                {msg.role === 'agent' && (
                  <div className="message-avatar">
                    <Sparkles size={16} />
                  </div>
                )}
                <div className="message-bubble">
                  {msg.content}
                </div>
              </motion.div>
            ))}
            {isAgentTyping && (
              <div className="agent-message agent">
                <div className="message-avatar">
                  <Sparkles size={16} />
                </div>
                <div className="message-bubble typing">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
          </div>

          <div className="ip-agent-quick-actions">
            <button onClick={() => { setChatMessage('compare portfolios'); handleChatSubmit({ preventDefault: () => {} }); }}>
              <PieChart size={14} />
              Compare
            </button>
            <button onClick={() => { setChatMessage('modify allocation'); handleChatSubmit({ preventDefault: () => {} }); }}>
              <TrendingUp size={14} />
              Modify
            </button>
            <button onClick={() => { setChatMessage('suggest improvements'); handleChatSubmit({ preventDefault: () => {} }); }}>
              <Zap size={14} />
              Optimize
            </button>
          </div>

          <form className="ip-agent-input" onSubmit={handleChatSubmit}>
            <input
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              placeholder="Ask me anything..."
              disabled={isAgentTyping}
            />
            <button type="submit" disabled={!chatMessage.trim() || isAgentTyping}>
              <MessageSquare size={18} />
            </button>
          </form>
        </motion.div>
      )}
    </div>
  );
};

export default InvestmentProposalNative;
