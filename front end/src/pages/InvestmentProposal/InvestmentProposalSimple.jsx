import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Home, Target, TrendingUp, PieChart, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { investmentProposalData } from '../../data/investmentProposalMockData';
import { portfolioData, generatePerformanceData } from './portfolioData';
import AdvancedPortfolioView from './AdvancedPortfolioView';
import './InvestmentProposalSimple.css';

const InvestmentProposalSimple = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const data = investmentProposalData.investment_proposal;
  
  const [selectedRisk, setSelectedRisk] = useState('Moderate');
  const [showMeetingNotes, setShowMeetingNotes] = useState(false);
  const [showOtherOptions, setShowOtherOptions] = useState(false);
  const [showAdvancedView, setShowAdvancedView] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    section1: true,
    section2: false,
    section3: true,
    section4: true,
    section5: false
  });
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [expandedHoldings, setExpandedHoldings] = useState({});

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const toggleHolding = (ticker) => {
    setExpandedHoldings(prev => ({ ...prev, [ticker]: !prev[ticker] }));
  };

  const sortedTickers = [...data.moderate_model_tickers].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const aVal = a[sortConfig.key];
    const bVal = b[sortConfig.key];
    return sortConfig.direction === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
  });

  const allPortfolios = portfolioData.map(p => ({
    name: p.name,
    objective: p.risk === 'Low' ? 'Preserve capital, generate income' :
               p.risk === 'Low-Medium' ? 'Balance income and modest growth' :
               p.risk === 'Medium' ? 'Long-term growth with stability' :
               p.risk === 'Medium-High' ? 'Growth-focused with some volatility' :
               p.risk === 'High' ? 'Maximize growth, accept high risk' :
               p.risk === 'Very Low' ? 'Minimize risk, preserve capital' :
               p.risk === 'Very High' ? 'Aggressive growth strategy' : 'Balanced approach',
    allocation: { stocks: p.stocks, bonds: p.bonds, cash: p.cash },
    expected_return: p.return.replace('%', ''),
    risk_score: p.risk === 'Very Low' ? 1 : p.risk === 'Low' ? 3 : p.risk === 'Low-Medium' ? 4 : p.risk === 'Medium' ? 5 : p.risk === 'Medium-High' ? 6 : p.risk === 'High' ? 8 : 10,
    volatility: p.volatility,
    recommended: p.recommended
  }));

  const recommendedPortfolio = allPortfolios.find(p => p.recommended);
  const alternativePortfolio = allPortfolios.find(p => p.name === 'Moderately Aggressive');
  const otherPortfolios = allPortfolios.filter(p => !p.recommended && p.name !== 'Moderately Aggressive');

  const chartOptions = {
    chart: { backgroundColor: 'transparent', height: 500, zoomType: 'x' },
    title: { text: '', style: { color: 'var(--text-primary)' } },
    xAxis: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      labels: { style: { color: 'var(--text-secondary)' } },
      crosshair: true
    },
    yAxis: {
      title: { text: 'Normalized Value (Start=100)', style: { color: 'var(--text-primary)' } },
      labels: { style: { color: 'var(--text-secondary)' } }
    },
    tooltip: {
      shared: true,
      crosshairs: true,
      backgroundColor: 'var(--bg-secondary)',
      style: { color: 'var(--text-primary)' },
      valueDecimals: 2
    },
    legend: { itemStyle: { color: 'var(--text-primary)' } },
    series: [
      {
        name: "S&P 500",
        data: [100, 104.1, 108.5, 112.3, 116.8, 120.2, 121.5, 122.8, 123.1, 123.8, 124.5, 125.1],
        color: 'var(--info)',
        dashStyle: 'dash',
        lineWidth: 2
      },
      {
        name: "Model Portfolio",
        data: [100, 105.2, 110.8, 115.5, 120.2, 124.9, 127.5, 129.3, 130.8, 132.5, 134.2, 135.8],
        color: 'var(--success)',
        lineWidth: 3
      },
      {
        name: "Current Portfolio",
        data: [100, 102.5, 105.1, 107.8, 110.2, 112.5, 114.8, 115.9, 116.5, 117.1, 117.8, 118.4],
        color: 'var(--error)',
        lineWidth: 3
      }
    ],
    credits: { enabled: false }
  };

  return (
    showAdvancedView ? (
      <AdvancedPortfolioView 
        mockData={data} 
        onBack={() => setShowAdvancedView(false)} 
      />
    ) : (
    <div className="ip-simple-page">
      <div className="ip-simple-header">
        <button onClick={() => navigate('/worklist/proposals')} className="ip-back-btn">
          <ArrowLeft size={18} />
          Back to Worklist
        </button>
        <button onClick={() => navigate('/')} className="ip-home-btn">
          <Home size={16} />
          Home
        </button>
      </div>

      <div className="ip-simple-content">
        {/* Section 1: Client Needs Assessment */}
        <motion.section
          className="ip-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="ip-section-header" onClick={() => toggleSection('section1')}>
            <Target size={22} />
            <h2>Client Profile</h2>
            <div className="ip-header-right">
              <button className="ip-meeting-notes-btn" onClick={(e) => { e.stopPropagation(); setShowMeetingNotes(true); }}>
                Meeting Notes
              </button>
              {expandedSections.section1 ? <ChevronUp size={20} className="ip-chevron-icon" /> : <ChevronDown size={20} className="ip-chevron-icon" />}
            </div>
          </div>

          {expandedSections.section1 && (
            <>
              <div className="client-profile-layout">
                <div className="profile-left">
                  <div className="profile-avatar">
                    <span>SP</span>
                  </div>
                  <div className="profile-info">
                    <h3>Sam Pai</h3>
                    <p className="profile-subtitle">{data.client_profile.age}-year-old professional</p>
                    <p className="profile-description">Managing portfolio with focus on balanced growth and long-term wealth building</p>
                    <div className="profile-badges">
                      <div className="badge-item">
                        <span>✓ KYC Verified</span>
                      </div>
                      <div className="badge-item">
                        <span>✓ AML Clear</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="profile-right">
                  <div className="profile-stats-grid">
                    <div className="stat-box">
                      <label>Total AUM</label>
                      <p>${data.client_profile.net_worth.toLocaleString()}</p>
                    </div>
                    <div className="stat-box">
                      <label>Annual Income</label>
                      <p>${data.client_profile.annual_income.toLocaleString()}</p>
                    </div>
                    <div className="stat-box">
                      <label>Monthly Expenses</label>
                      <p>${data.client_profile.monthly_expenses.toLocaleString()}</p>
                    </div>
                    <div className="stat-box">
                      <label>Risk Tolerance</label>
                      <p>{data.client_profile.risk_tolerance}</p>
                    </div>
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
                <div className="ip-risk-card">
                  <label>Recommended Portfolio</label>
                  <p className="ip-risk-text-large">{data.client_profile.risk_tolerance}</p>
                  <p className="ip-risk-desc">Pai has a moderate risk tolerance, balancing the potential for growth with the need for stability in his investment strategy.</p>
                </div>
              </div>
            </>
          )}
        </motion.section>

        {/* Section 2: Current Holdings */}
        <motion.section
          className="ip-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
        >
          <div className="ip-section-header" onClick={() => toggleSection('section2')}>
            <PieChart size={22} />
            <h2>Current Holdings</h2>
            {expandedSections.section2 ? <ChevronUp size={20} className="ip-chevron-icon" /> : <ChevronDown size={20} className="ip-chevron-icon" />}
          </div>

          {expandedSections.section2 && (
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

        {/* Section 3: Model Portfolio Mapping */}
        <motion.section
          className="ip-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="ip-section-header" onClick={() => toggleSection('section3')}>
            <PieChart size={22} />
            <h2>Model Portfolio Mapping</h2>
            {expandedSections.section3 ? <ChevronUp size={20} className="ip-chevron-icon" /> : <ChevronDown size={20} className="ip-chevron-icon" />}
          </div>

          {expandedSections.section3 && (
            <>
              <div className="ip-portfolio-message">
                <p><strong>Recommended Portfolio:</strong> Based on your risk tolerance and investment goals</p>
              </div>
              
              <div className="portfolio-grid">
                <motion.div
                  className={`portfolio-card ${selectedRisk === 'Moderate' ? 'selected' : ''} recommended`}
                  onClick={() => setSelectedRisk('Moderate')}
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="recommended-badge">Recommended</div>
                  <h4>{recommendedPortfolio.name}</h4>
                  <p className="portfolio-objective">{recommendedPortfolio.objective}</p>
                  <div className="allocation-breakdown">
                    <div className="allocation-stacked-bar">
                      <div className="alloc-seg alloc-seg--stocks" style={{ width: `${recommendedPortfolio.allocation.stocks - 25}%` }}></div>
                      <div className="alloc-seg alloc-seg--bonds" style={{ width: `${recommendedPortfolio.allocation.bonds}%` }}></div>
                      <div className="alloc-seg alloc-seg--funds" style={{ width: '25%' }}></div>
                      <div className="alloc-seg alloc-seg--cash" style={{ width: `${recommendedPortfolio.allocation.cash}%` }}></div>
                    </div>
                    <div className="allocation-item">
                      <span><span className="alloc-dot alloc-dot--stocks"></span>Stocks</span>
                      <span>{recommendedPortfolio.allocation.stocks - 25}%</span>
                    </div>
                    <div className="allocation-item">
                      <span><span className="alloc-dot alloc-dot--bonds"></span>Bonds</span>
                      <span>{recommendedPortfolio.allocation.bonds}%</span>
                    </div>
                    <div className="allocation-item">
                      <span><span className="alloc-dot alloc-dot--funds"></span>Funds</span>
                      <span>25%</span>
                    </div>
                    <div className="allocation-item">
                      <span><span className="alloc-dot alloc-dot--cash"></span>Cash</span>
                      <span>{recommendedPortfolio.allocation.cash}%</span>
                    </div>
                  </div>
                  <div className="portfolio-metrics">
                    <div className="metric">
                      <span className="metric-label">Expected Return</span>
                      <span className="metric-value">{recommendedPortfolio.expected_return}%</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Risk Level</span>
                      <span className="metric-value">{recommendedPortfolio.risk_score}/10</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Volatility</span>
                      <span className="metric-value">{recommendedPortfolio.volatility}</span>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  className={`portfolio-card ${selectedRisk === 'Moderately Aggressive' ? 'selected' : ''} alternative`}
                  onClick={() => setSelectedRisk('Moderately Aggressive')}
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="alternative-badge">Alternative</div>
                  <h4>{alternativePortfolio.name}</h4>
                  <p className="portfolio-objective">{alternativePortfolio.objective}</p>
                  <div className="allocation-breakdown">
                    <div className="allocation-stacked-bar">
                      <div className="alloc-seg alloc-seg--stocks" style={{ width: `${alternativePortfolio.allocation.stocks - 20}%` }}></div>
                      <div className="alloc-seg alloc-seg--bonds" style={{ width: `${alternativePortfolio.allocation.bonds}%` }}></div>
                      <div className="alloc-seg alloc-seg--funds" style={{ width: '20%' }}></div>
                      <div className="alloc-seg alloc-seg--cash" style={{ width: `${alternativePortfolio.allocation.cash}%` }}></div>
                    </div>
                    <div className="allocation-item">
                      <span><span className="alloc-dot alloc-dot--stocks"></span>Stocks</span>
                      <span>{alternativePortfolio.allocation.stocks - 20}%</span>
                    </div>
                    <div className="allocation-item">
                      <span><span className="alloc-dot alloc-dot--bonds"></span>Bonds</span>
                      <span>{alternativePortfolio.allocation.bonds}%</span>
                    </div>
                    <div className="allocation-item">
                      <span><span className="alloc-dot alloc-dot--funds"></span>Funds</span>
                      <span>20%</span>
                    </div>
                    <div className="allocation-item">
                      <span><span className="alloc-dot alloc-dot--cash"></span>Cash</span>
                      <span>{alternativePortfolio.allocation.cash}%</span>
                    </div>
                  </div>
                  <div className="portfolio-metrics">
                    <div className="metric">
                      <span className="metric-label">Expected Return</span>
                      <span className="metric-value">{alternativePortfolio.expected_return}%</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Risk Level</span>
                      <span className="metric-value">{alternativePortfolio.risk_score}/10</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Volatility</span>
                      <span className="metric-value">{alternativePortfolio.volatility}</span>
                    </div>
                  </div>
                </motion.div>
              </div>

              <div className="portfolio-holdings-section">
                <div className="holdings-header" onClick={() => setShowOtherOptions(!showOtherOptions)}>
                  <h3>Portfolio</h3>
                  {showOtherOptions ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
                
                {showOtherOptions && (
                  <div className="holdings-content">
                    <div className="holdings-tabs">
                      <button className="holdings-tab active">Funds</button>
                      <button className="holdings-tab">Bonds</button>
                      <button className="holdings-tab">Stocks</button>
                    </div>
                    
                    <div className="holdings-list">
                      <div className={`holding-item ${expandedHoldings['RLEFX'] ? 'expanded' : ''}`}>
                        <div className="holding-header-row" onClick={() => toggleHolding('RLEFX')}>
                          <div className="holding-info">
                            <span className="holding-ticker">RLEFX</span>
                            <span className="holding-name">American Balanced Fund</span>
                          </div>
                          <div className="holding-header-meta">
                            <span className="holding-summary-hint">4 sources • Low ER</span>
                            <ChevronDown size={18} className="holding-chevron" />
                          </div>
                        </div>
                        <div className="holding-details">
                          <div className="rationale-section">
                            <h5>Rationale</h5>
                            <ul>
                              <li>Lower Total Expense Ratio than peers of same class - American Capital and Global Balanced funds</li>
                              <li>Fund objectives & strategies align with client income conservation and growth outlook</li>
                              <li>Concentration metrics (single-name ~5%, Top‑10 ~22%, sector HHI ~611) support diversified risk for a moderate profile</li>
                              <li>Fund structure avoids loads/12b‑1 and supports payroll-friendly minimums</li>
                            </ul>
                          </div>
                          <div className="data-sources">
                            <h5>Data Sources</h5>
                            <div className="source-tags">
                              <span className="source-tag">Investment Policy Statement</span>
                              <span className="source-tag">Current Investments</span>
                              <span className="source-tag">Fund Prospectus</span>
                              <span className="source-tag">Fund Fact Sheet</span>
                              <span className="source-tag">Annual report</span>
                              <span className="source-tag">Market Performance (yfinance)</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className={`holding-item ${expandedHoldings['VFIAX'] ? 'expanded' : ''}`}>
                        <div className="holding-header-row" onClick={() => toggleHolding('VFIAX')}>
                          <div className="holding-info">
                            <span className="holding-ticker">VFIAX</span>
                            <span className="holding-name">Vanguard 500 Index Fund</span>
                          </div>
                          <div className="holding-header-meta">
                            <span className="holding-summary-hint">2 sources • Index</span>
                            <ChevronDown size={18} className="holding-chevron" />
                          </div>
                        </div>
                        <div className="holding-details">
                          <div className="rationale-section">
                            <h5>Rationale</h5>
                            <ul>
                              <li>Low-cost index fund with minimal expense ratio</li>
                              <li>Broad market exposure to S&P 500 companies</li>
                              <li>Strong historical performance tracking benchmark</li>
                            </ul>
                          </div>
                          <div className="data-sources">
                            <h5>Data Sources</h5>
                            <div className="source-tags">
                              <span className="source-tag">Fund Prospectus</span>
                              <span className="source-tag">Market Performance (yfinance)</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className={`holding-item ${expandedHoldings['SPY'] ? 'expanded' : ''}`}>
                        <div className="holding-header-row" onClick={() => toggleHolding('SPY')}>
                          <div className="holding-info">
                            <span className="holding-ticker">SPY</span>
                            <span className="holding-name">S&P 500 ETF</span>
                          </div>
                          <div className="holding-header-meta">
                            <span className="holding-summary-hint">2 sources • ETF</span>
                            <ChevronDown size={18} className="holding-chevron" />
                          </div>
                        </div>
                        <div className="holding-details">
                          <div className="rationale-section">
                            <h5>Rationale</h5>
                            <ul>
                              <li>Highly liquid ETF with tight bid-ask spreads</li>
                              <li>Diversified exposure to large-cap US equities</li>
                              <li>Tax-efficient structure for long-term holdings</li>
                            </ul>
                          </div>
                          <div className="data-sources">
                            <h5>Data Sources</h5>
                            <div className="source-tags">
                              <span className="source-tag">Fund Fact Sheet</span>
                              <span className="source-tag">Market Performance (yfinance)</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className={`holding-item ${expandedHoldings['QQQ'] ? 'expanded' : ''}`}>
                        <div className="holding-header-row" onClick={() => toggleHolding('QQQ')}>
                          <div className="holding-info">
                            <span className="holding-ticker">QQQ</span>
                            <span className="holding-name">Invesco Trust ETF</span>
                          </div>
                          <div className="holding-header-meta">
                            <span className="holding-summary-hint">2 sources • Growth</span>
                            <ChevronDown size={18} className="holding-chevron" />
                          </div>
                        </div>
                        <div className="holding-details">
                          <div className="rationale-section">
                            <h5>Rationale</h5>
                            <ul>
                              <li>Technology-focused growth exposure</li>
                              <li>Access to innovative large-cap tech companies</li>
                              <li>Strong performance potential for growth-oriented allocation</li>
                            </ul>
                          </div>
                          <div className="data-sources">
                            <h5>Data Sources</h5>
                            <div className="source-tags">
                              <span className="source-tag">Fund Prospectus</span>
                              <span className="source-tag">Market Performance (yfinance)</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </motion.section>

        {/* Section 4: Market Performance Comparison */}
        <motion.section
          className="ip-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <div className="ip-section-header" onClick={() => toggleSection('section4')}>
            <TrendingUp size={22} />
            <h2>Market Performance Comparison</h2>
            {expandedSections.section4 ? <ChevronUp size={20} className="ip-chevron-icon" /> : <ChevronDown size={20} className="ip-chevron-icon" />}
          </div>

          {expandedSections.section4 && (
            <div className="ip-chart-wrapper">
              <HighchartsReact highcharts={Highcharts} options={chartOptions} />
            </div>
          )}
        </motion.section>

        {/* Section 5: Customer Service Toolkit */}
        <motion.section
          className="ip-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="ip-section-header" onClick={() => toggleSection('section5')}>
            <FileText size={22} />
            <h2>Customer Service Toolkit</h2>
            {expandedSections.section5 ? <ChevronUp size={20} className="ip-chevron-icon" /> : <ChevronDown size={20} className="ip-chevron-icon" />}
          </div>

          {expandedSections.section5 && (
            <>
              <div className="ip-onboarding-message">
                <p>To proceed with investment proposal, you may share these pre-filled forms with client.</p>
              </div>
              <div className="documents-grid">
                {data.onboarding_documents.map((doc, idx) => (
                  <motion.div 
                    key={idx} 
                    className="document-card"
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
    </div>
    )
  );
};

export default InvestmentProposalSimple;
