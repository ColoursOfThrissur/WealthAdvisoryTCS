import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Home, TrendingUp, Newspaper, Target, FileText, ChevronDown, ChevronUp, ArrowRightLeft, AlertTriangle, BarChart3, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import clientDataService from '../../services/clientDataService';
import './PortfolioRebalancingNative.css';

const PortfolioRebalancingNative = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [activeOption, setActiveOption] = useState('option_b');
  const [expandedSections, setExpandedSections] = useState({
    section1: true,
    sectionRebalSummary: true,
    section2: false,
    section3: false,
    section4: false,
    sectionPostTrade: false
  });
  const [expandedTickers, setExpandedTickers] = useState({});

  useEffect(() => {
    const fetchRebalancingData = async () => {
      try {
        setLoading(true);
        
        console.log(`[PortfolioRebalancing] Fetching data for client ${clientId}`);
        
        // Use production-ready service - automatically handles deduplication and queuing
        const [rebalancingResponse, investmentResponse] = await Promise.all([
          clientDataService.getRebalancingAction(clientId),
          clientDataService.getInvestmentDetails(clientId)
        ]);
        
        setData({
          rebalancing: rebalancingResponse.data,
          investment: investmentResponse.data
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRebalancingData();
  }, [clientId]);

  // Create ticker name mapping from current_holdings
  const tickerNames = (data?.investment?.current_holdings || []).reduce((acc, holding) => {
    acc[holding.ticker] = holding.name;
    return acc;
  }, {});

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleTicker = (ticker) => {
    setExpandedTickers(prev => ({ ...prev, [ticker]: !prev[ticker] }));
  };

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const sortedHoldings = [...(data?.investment?.current_holdings || [])].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const aVal = a[sortConfig.key];
    const bVal = b[sortConfig.key];
    return sortConfig.direction === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
  });

  const getSentimentBadge = (sentiment) => {
    const badges = {
      positive: { class: 'positive', text: 'Positive' },
      negative: { class: 'negative', text: 'Negative' },
      neutral: { class: 'neutral', text: 'Neutral' }
    };
    return badges[sentiment] || badges.neutral;
  };

  if (loading) {
    return (
      <div className="pr-page">
        <div className="pr-header">
          <button onClick={() => navigate(-1)} className="pr-back-btn">
            <ArrowLeft size={18} />
            Back
          </button>
        </div>
        <div style={{ padding: '2rem', textAlign: 'center' }}>Loading rebalancing data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pr-page">
        <div className="pr-header">
          <button onClick={() => navigate(-1)} className="pr-back-btn">
            <ArrowLeft size={18} />
            Back
          </button>
        </div>
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--error)' }}>
          Error: {error}
        </div>
      </div>
    );
  }

  if (!data || !data.rebalancing) return null;

  const reco = data.rebalancing;

  return (
    <div className="pr-page">
      <div className="pr-header">
        <button onClick={() => navigate(-1)} className="pr-back-btn">
          <ArrowLeft size={18} />
          Back
        </button>
        <button onClick={() => navigate('/')} className="pr-home-btn">
          <Home size={16} />
          Home
        </button>
      </div>
      <div className="pr-content">
        {/* Recommended Option Summary */}
        {reco && (
          <div className="pr-reco-banner">
            <div className="pr-reco-banner-top">
              <div>
                <span className="pr-reco-label">Recommended Option</span>
                <h2 className="pr-reco-name">{reco.final_recommendation?.title || 'Rebalancing Recommendation'}</h2>
              </div>
              <div className="pr-reco-kpis-inline">
                <div className="pr-reco-kpi-mini"><span>{reco.rebalance_summary?.length || 0}</span><span>Positions</span></div>
                <div className="pr-reco-kpi-mini"><span>{reco.options?.option_a?.trade_recommendations?.length || 0}</span><span>Trades</span></div>
                <div className="pr-reco-kpi-mini pr-reco-kpi-mini--highlight"><span>{reco.cost_analysis?.current_weighted_er || 'N/A'}</span><span>Expense Ratio</span></div>
              </div>
            </div>
            <div className="pr-reco-desc">
              {reco.final_recommendation?.reasons?.map((reason, i) => <p key={i}>{reason}</p>)}
            </div>
            <div className="pr-reco-tags">
              <span className="pr-reco-tag">IPS Compliant</span>
              <span className="pr-reco-tag">Tax Aware</span>
              <span className="pr-reco-tag pr-reco-tag--warn">Approval Required</span>
            </div>
          </div>
        )}
        {/* Section 1: Current Holdings */}
        <motion.section
          className="pr-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="pr-section-header" onClick={() => toggleSection('section1')}>
            <TrendingUp size={22} />
            <h2>Current Holdings</h2>
            {expandedSections.section1 ? <ChevronUp size={20} className="pr-chevron-icon" /> : <ChevronDown size={20} className="pr-chevron-icon" />}
          </div>

          {expandedSections.section1 && (
            <div className="pr-table-container">
              <table className="pr-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('ticker')}>Ticker {sortConfig.key === 'ticker' && (sortConfig.direction === 'asc' ? '▲' : '▼')}</th>
                    <th onClick={() => handleSort('name')}>Name {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '▲' : '▼')}</th>
                    <th onClick={() => handleSort('current_price')}>Price {sortConfig.key === 'current_price' && (sortConfig.direction === 'asc' ? '▲' : '▼')}</th>
                    <th onClick={() => handleSort('total_return_pct')}>Total Return {sortConfig.key === 'total_return_pct' && (sortConfig.direction === 'asc' ? '▲' : '▼')}</th>
                    <th onClick={() => handleSort('volatility_pct')}>Volatility {sortConfig.key === 'volatility_pct' && (sortConfig.direction === 'asc' ? '▲' : '▼')}</th>
                    <th onClick={() => handleSort('max_drawdown_pct')}>Max Drawdown {sortConfig.key === 'max_drawdown_pct' && (sortConfig.direction === 'asc' ? '▲' : '▼')}</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedHoldings.map((holding) => (
                    <motion.tr
                      key={holding.ticker}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      whileHover={{ backgroundColor: 'var(--color-interactive-hover-bg)' }}
                    >
                      <td className="ticker-cell">{holding.ticker}</td>
                      <td>{holding.name}</td>
                      <td className="price-cell">${holding.current_price.toFixed(2)}</td>
                      <td className={`return-cell ${holding.total_return_pct > 0 ? 'positive' : 'negative'}`}>
                        {holding.total_return_pct > 0 ? '+' : ''}{holding.total_return_pct.toFixed(2)}%
                      </td>
                      <td className="volatility-cell">{holding.volatility_pct}%</td>
                      <td className={`drawdown-cell ${parseFloat(holding.max_drawdown_pct) < 0 ? 'negative' : 'positive'}`}>
                        {holding.max_drawdown_pct}%
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.section>

        {/* Section: Rebalance Summary */}
        {reco && (
        <motion.section
          className="pr-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
        >
          <div className="pr-section-header" onClick={() => toggleSection('sectionRebalSummary')}>
            <BarChart3 size={22} />
            <h2>Rebalance Summary</h2>
            {expandedSections.sectionRebalSummary ? <ChevronUp size={20} className="pr-chevron-icon" /> : <ChevronDown size={20} className="pr-chevron-icon" />}
          </div>

          {expandedSections.sectionRebalSummary && (
            <div className="pr-table-container">
              <table className="pr-table">
                <thead>
                  <tr>
                    <th>Asset Class</th>
                    <th>Ticker</th>
                    <th>Before</th>
                    <th>Target</th>
                    <th>After</th>
                    <th>Change</th>
                    <th>Trade Value</th>
                    <th>Direction</th>
                  </tr>
                </thead>
                <tbody>
                  {(reco.rebalance_summary || []).map((row, i) => (
                    <motion.tr
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={row.direction === 'Sell' ? 'pr-trade-row--sell' : row.direction === 'Buy' ? 'pr-trade-row--buy' : 'pr-trade-row--hold'}
                    >
                      <td>{row.asset_class}</td>
                      <td className="ticker-cell">{row.ticker}</td>
                      <td>{row.before}</td>
                      <td>{row.target}</td>
                      <td>{row.after}</td>
                      <td className={row.change.startsWith('+') ? 'positive' : row.change.startsWith('-') ? 'negative' : ''}>{row.change}</td>
                      <td>{row.trade_value}</td>
                      <td><span className={`pr-action-badge pr-action-badge--${row.direction.toLowerCase()}`}>{row.direction}</span></td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.section>
        )}

        {/* Section 2: Trade Recommendations */}
        {reco && (
        <motion.section
          className="pr-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="pr-section-header" onClick={() => toggleSection('section4')}>
            <ArrowRightLeft size={22} />
            <h2>Trade Recommendations</h2>
            {expandedSections.section4 ? <ChevronUp size={20} className="pr-chevron-icon" /> : <ChevronDown size={20} className="pr-chevron-icon" />}
          </div>

          {expandedSections.section4 && (
            <div className="pr-trade-content">
              {/* Option Tabs */}
              <div className="pr-option-tabs">
                <button 
                  className={`pr-option-tab ${activeOption === 'option_a' ? 'active' : ''}`}
                  onClick={() => setActiveOption('option_a')}
                >
                  Option A: {reco.options?.option_a?.name || 'Rebalance to IPS Targets'}
                </button>
                <button 
                  className={`pr-option-tab ${activeOption === 'option_b' ? 'active' : ''}`}
                  onClick={() => setActiveOption('option_b')}
                >
                  Option B: {reco.options?.option_b?.name || 'Optimized Universe'}
                  {reco.options?.option_b?.recommended && <span className="pr-recommended-badge">Recommended</span>}
                </button>
              </div>

              {/* Option Description */}
              <div className="pr-narrative-block">
                <p>{reco.options?.[activeOption]?.description || 'No description available'}</p>
              </div>

              {/* KPI Cards */}
              <div className="pr-trade-kpis">
                <div className="pr-trade-kpi pr-trade-kpi--sell">
                  <span className="pr-trade-kpi-label">Total Sells</span>
                  <span className="pr-trade-kpi-value">${(reco.options?.[activeOption]?.trade_totals?.total_sells || 0).toLocaleString()}</span>
                </div>
                <div className="pr-trade-kpi pr-trade-kpi--buy">
                  <span className="pr-trade-kpi-label">Total Buys</span>
                  <span className="pr-trade-kpi-value">${(reco.options?.[activeOption]?.trade_totals?.total_buys || 0).toLocaleString()}</span>
                </div>
                <div className="pr-trade-kpi pr-trade-kpi--net">
                  <span className="pr-trade-kpi-label">Net Value</span>
                  <span className="pr-trade-kpi-value">${(reco.options?.[activeOption]?.trade_totals?.net_value || 0).toLocaleString()}</span>
                </div>
              </div>

              {/* Trade Table */}
              <div className="pr-table-container">
                <table className="pr-table">
                  <thead>
                    <tr>
                      <th>Action</th>
                      <th>Ticker</th>
                      <th>Fund</th>
                      <th>Type</th>
                      <th>Units</th>
                      <th>Amount</th>
                      <th>Est. Gain</th>
                      <th>Best Lot</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(reco.options?.[activeOption]?.trade_recommendations || []).map((t, i) => (
                      <tr key={i} className={`pr-trade-row--${t.action.toLowerCase()}`}>
                        <td><span className={`pr-action-badge pr-action-badge--${t.action.toLowerCase()}`}>{t.action}</span></td>
                        <td className="ticker-cell">{t.ticker}</td>
                        <td>{t.fund}</td>
                        <td>{t.type}</td>
                        <td>{t.units}</td>
                        <td className={`pr-amount-cell ${t.amount > 0 ? 'positive' : t.amount < 0 ? 'negative' : ''}`}>
                          {t.amount > 0 ? '+' : ''}{t.amount !== 0 ? `$${Math.abs(t.amount).toLocaleString()}` : '—'}
                        </td>
                        <td className={t.gain > 0 ? 'positive' : ''}>
                          {t.gain > 0 ? `+$${t.gain.toLocaleString()}` : t.gain < 0 ? `-$${Math.abs(t.gain).toLocaleString()}` : '—'}
                        </td>
                        <td>{t.best_lot || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Trade Rationale */}
              <div className="pr-narrative-block">
                <h4>Trade Rationale</h4>
                <p>{reco.trade_rationale || 'No rationale available'}</p>
              </div>

              {/* Tax Efficiency & Cost Analysis side by side */}
              <div className="pr-two-col">
                <div className="pr-narrative-block">
                  <h4>Tax Efficiency</h4>
                  <div className="pr-detail-stats">
                    <div className="pr-detail-row"><span>Realized Gains</span><span className="positive">+${(reco.tax_efficiency?.estimated_realized_gains || 0).toLocaleString()}</span></div>
                    <div className="pr-detail-row"><span>Long-Term Gains</span><span>${(reco.tax_efficiency?.long_term_gains || 0).toLocaleString()}</span></div>
                    <div className="pr-detail-row"><span>Tax Rate</span><span>{reco.tax_efficiency?.tax_rate_applied || '20%'}</span></div>
                    <div className="pr-detail-row"><span>Est. Tax Liability</span><span className="negative">${(reco.tax_efficiency?.estimated_tax_liability || 0).toLocaleString()}</span></div>
                  </div>
                  <p className="pr-detail-note">{reco.tax_efficiency?.note || ''}</p>
                  <div className="pr-tax-callout">
                    <span className="pr-tax-callout-label">Est. Tax Liability</span>
                    <span className="pr-tax-callout-value">${(reco.tax_efficiency?.estimated_tax_liability || 0).toLocaleString()}</span>
                  </div>
                </div>
                <div className="pr-narrative-block">
                  <h4>Cost Analysis</h4>
                  <div className="pr-detail-stats">
                    <div className="pr-detail-row"><span>Current Weighted ER</span><span>{reco.cost_analysis?.current_weighted_er || 'N/A'}</span></div>
                    <div className="pr-detail-row"><span>Post-Rebalance ER</span><span className="positive">{reco.cost_analysis?.post_rebalance_er || 'N/A'}</span></div>
                    <div className="pr-detail-row"><span>Annual Savings</span><span className="positive">{reco.cost_analysis?.annual_savings || '$0'}</span></div>
                  </div>
                  <p className="pr-detail-note">{reco.cost_analysis?.note || ''}</p>
                  <div className="pr-savings-callout">
                    <span className="pr-savings-callout-label">Annual Savings</span>
                    <span className="pr-savings-callout-value">{reco.cost_analysis?.annual_savings || '$0'}</span>
                  </div>
                </div>
              </div>


              {/* Post-Trade Checks */}
              {reco.post_trade_checks && reco.post_trade_checks.length > 0 && (
                <div className="pr-post-trade-checks">
                  <h4>Post-Trade Checks</h4>
                  <table className="pr-table">
                    <thead>
                      <tr><th>Check</th><th>Status</th><th>Result</th></tr>
                    </thead>
                    <tbody>
                      {reco.post_trade_checks.map((c, i) => (
                        <tr key={i}>
                          <td>{c.check}</td>
                          <td><span className={`pr-action-badge pr-action-badge--${c.status === 'PASS' ? 'hold' : 'breach'}`}>{c.status}</span></td>
                          <td>{c.result}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Final Recommendation */}
              {reco.final_recommendation && (
                <div className="pr-final-reco">
                  <h4>✅ Final Recommendation: {reco.final_recommendation.option} — {reco.final_recommendation.title}</h4>
                  <ul>
                    {(reco.final_recommendation.reasons || []).map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </motion.section>
        )}

        {/* Section: Post-Trade Impact */}
        {reco && (
        <motion.section
          className="pr-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <div className="pr-section-header" onClick={() => toggleSection('sectionPostTrade')}>
            <CheckCircle size={22} />
            <h2>Post-Trade Impact</h2>
            {expandedSections.sectionPostTrade ? <ChevronUp size={20} className="pr-chevron-icon" /> : <ChevronDown size={20} className="pr-chevron-icon" />}
          </div>

          {expandedSections.sectionPostTrade && (
            <div className="pr-trade-content">
              {/* Post-Trade Checks from backend */}
              {reco.post_trade_checks && reco.post_trade_checks.length > 0 && (
                <div className="pr-post-trade-checks">
                  <h4>Post-Trade Compliance Checks</h4>
                  <table className="pr-table">
                    <thead>
                      <tr><th>Check</th><th>Status</th><th>Result</th></tr>
                    </thead>
                    <tbody>
                      {reco.post_trade_checks.map((c, i) => (
                        <tr key={i}>
                          <td>{c.check}</td>
                          <td><span className={`pr-action-badge pr-action-badge--${c.status === 'PASS' ? 'hold' : 'breach'}`}>{c.status}</span></td>
                          <td>{c.result}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Allocation shift from rebalance_summary */}
              {reco.rebalance_summary && reco.rebalance_summary.length > 0 && (
                <div className="pr-narrative-block">
                  <h4>Allocation Shift</h4>
                  <div className="pr-post-alloc-grid">
                    {(() => {
                      const byAsset = {};
                      reco.rebalance_summary.forEach(row => {
                        if (!byAsset[row.asset_class]) byAsset[row.asset_class] = { before: 0, after: 0, target: 0 };
                        byAsset[row.asset_class].before += parseFloat(row.before) || 0;
                        byAsset[row.asset_class].after += parseFloat(row.after) || 0;
                        byAsset[row.asset_class].target += parseFloat(row.target) || 0;
                      });
                      return Object.entries(byAsset).map(([cls, vals], i) => (
                        <div key={i} className="pr-post-alloc-row">
                          <span className="pr-post-alloc-label">{cls}</span>
                          <span className="pr-post-alloc-val negative">{vals.before.toFixed(1)}%</span>
                          <span className="pr-post-alloc-arrow">→</span>
                          <span className="pr-post-alloc-val positive">{vals.after.toFixed(1)}%</span>
                          <span className="pr-post-alloc-target">(target {vals.target.toFixed(1)}%)</span>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              )}

              {/* Final recommendation reasons */}
              {reco.final_recommendation?.reasons?.length > 0 && (
                <div className="pr-final-reco">
                  <h4>✅ Key Improvements</h4>
                  <ul>
                    {reco.final_recommendation.reasons.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </motion.section>
        )}

      </div>
    </div>
  );
};

export default PortfolioRebalancingNative;
