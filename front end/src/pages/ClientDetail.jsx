import { useParams, useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Shield, TrendingUp, Calendar, DollarSign, Activity, AlertCircle, BarChart3, CheckCircle, ShieldCheck, FileText, ChevronDown, ChevronUp, AlertTriangle, Target, RefreshCw } from 'lucide-react';
import { useWorklist } from '../contexts/WorklistContext';
import AIBadge from '../components/AIBadge';
import RerunModal from '../components/RerunModal';
import ErrorBoundary from '../components/ErrorBoundary';
import clientDataService from '../services/clientDataService';
import './ClientDetail.css';

const ClientDetail = () => {
  const { clientId, type } = useParams();
  const navigate = useNavigate();
  const { setCompletedActions } = useWorklist();
  
  // State for API data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [clientData, setClientData] = useState(null);
  const [riskData, setRiskData] = useState(null);
  const [rebalancingData, setRebalancingData] = useState(null);
  
  // UI state
  const [driftTab, setDriftTab] = useState('allocation');
  const [expandedRisk, setExpandedRisk] = useState({});
  const [allocChartOpen, setAllocChartOpen] = useState(false);
  const [rerunModalOpen, setRerunModalOpen] = useState(false);
  const toggleRisk = (idx) => setExpandedRisk(prev => ({ ...prev, [idx]: !prev[idx] }));
  const fetchingRef = React.useRef(false);

  const fetchClientData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`[ClientDetail] Fetching data for client ${clientId}`);
      
      const fullData = await clientDataService.getFullAnalysis(clientId, {
        include_sentiment: true,
        include_fund_universe: true,
        user_prompt: "",
        refresh: false
      });
      
      // Transform BackendV2 schema to frontend expected format
      const transformedData = {
        client_profile: {
          client_id: fullData.client_detail?.client?.client_id || clientId,
          client_name: fullData.client_detail?.client?.name || '',
          age: fullData.client_detail?.client?.age || 0,
          risk_profile: fullData.client_detail?.client?.risk_tolerance || 'Moderate Growth',
          total_aum_formatted: fullData.client_detail?.client?.fum || '$0',
          action_rationale: fullData.summary?.action_rationale || 'Portfolio rebalancing to align with IPS'
        },
        portfolio_drift: {
          asset_allocation: (fullData.client_detail?.asset_allocation || []).map(ac => ({
            category: ac.category,
            current_percentage: ac.current,
            target_percentage: ac.target
          })),
          fund_level_drift: (fullData.client_detail?.fund_drift || []).map(fd => ({
            ticker: fd.ticker,
            drift_percentage: fd.drift
          }))
        },
        risk_analysis_summary: {
          summary_items: (fullData.client_detail?.risk_summary || []).map(rs => ({
            title: rs.title,
            detail: rs.detail,
            type: rs.type,
            severity: rs.type === 'risk' ? 'high' : rs.type === 'info' ? 'low' : 'medium',
            detail_type: rs.detail_type || 'risk_dashboard_table'
          }))
        },
        summary_recommendations: {
          asset_allocation_comparison: (fullData.client_detail?.asset_allocation || []).map(ac => ({
            category: ac.category,
            current_percentage: ac.current,
            target_percentage: ac.target,
            rebalanced_percentage: ac.rebalanced
          })),
          kpi_metrics: fullData.client_detail?.recommendations?.kpi || {},
          recommended_option: fullData.client_detail?.recommendations?.recommended_option || {}
        },
        risk_detail_tables: {
          fund_drift_table: fullData.client_detail?.fund_drift || [],
          volatility_table: fullData.risk_analysis?.volatility || [],
          beta_table: fullData.risk_analysis?.beta_exposure || [],
          portfolio_beta: fullData.risk_analysis?.portfolio_beta || 0,
          target_beta: fullData.risk_analysis?.target_beta || 0.75,
          sector_concentration_table: fullData.risk_analysis?.sector_concentration || [],
          total_it_concentration: fullData.risk_analysis?.total_it_concentration || 0,
          drawdown_table: fullData.risk_analysis?.drawdown_risk || [],
          risk_dashboard_table: fullData.risk_analysis?.risk_dashboard || [],
          insights: fullData.risk_analysis?.insights || {},
          sentiment_chart: Object.entries(fullData.investment_details?.detailed_news_data || {}).map(([ticker, data]) => ({
            ticker,
            avg_polarity: data.sentiment_summary?.avg_polarity || 0,
            dominant_sentiment: data.sentiment_summary?.dominant_sentiment || 'neutral',
            total_articles: data.total_articles || 0
          }))
        }
      };
      
      setClientData(transformedData);
      setRiskData(fullData.risk_analysis);
      setRebalancingData(fullData.rebalancing_action);
    } catch (err) {
      // If agent is busy, retry after a delay with refresh:false to hit backend file cache
      if (err.message && err.message.includes('already processing')) {
        console.log(`[ClientDetail] Agent busy, retrying in 8s with cache...`);
        await new Promise(resolve => setTimeout(resolve, 8000));
        return fetchClientData();
      }
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    fetchClientData().finally(() => { fetchingRef.current = false; });
    return () => { fetchingRef.current = false; };
  }, [clientId]);

  const handleRerunAnalysis = async (config) => {
    try {
      setRerunModalOpen(false);
      setLoading(true);
      
      console.log(`[ClientDetail] Rerunning analysis for client ${clientId}`, config);
      
      // Force refresh on backend — result is stored in frontend cache
      // fetchClientData will read from that fresh cache, no second agent call
      await clientDataService.getFullAnalysis(clientId, {
        include_sentiment: config.include_sentiment !== false,
        include_fund_universe: config.include_fund_universe !== false,
        user_prompt: config.user_prompt || "",
        refresh: true
      });

      await fetchClientData();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="client-detail-page">
        <div className="client-detail-header">
          <button className="back-button" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} />
            Back
          </button>
          <div className="client-detail-title-group">
            <h1 className="client-detail-title">Client Detail</h1>
          </div>
        </div>
        <div className="client-detail-loading">
          <div className="client-detail-loading-spinner"></div>
          <p className="client-detail-loading-text">Analyzing client portfolio...</p>
          <p className="client-detail-loading-subtext">AI agent is running — this may take 2–4 minutes on first load</p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="client-detail-page">
        <div className="client-detail-header">
          <button className="back-button" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} />
            Back
          </button>
          <div className="client-detail-title-group">
            <h1 className="client-detail-title">Client Detail</h1>
          </div>
        </div>
        <div className="client-detail-error">
          <div className="client-detail-error-icon"><AlertCircle size={48} style={{ opacity: 0.4 }} /></div>
          <p className="client-detail-error-text">Unable to load client details</p>
          <p className="client-detail-error-detail">{error}</p>
          <button className="client-detail-error-retry" onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }
  
  if (!clientData) {
    return null;
  }
  
  // Extract data from API responses
  const client = clientData.client_profile || {};
  const assetAllocation = clientData.portfolio_drift?.asset_allocation || [];
  const fundDrift = clientData.portfolio_drift?.fund_level_drift || [];
  const riskSummary = clientData.risk_analysis_summary?.summary_items || [];
  const recommendations = clientData.summary_recommendations || {};
  const riskDetailTables = clientData.risk_detail_tables || {};
  const riskAnalysisData = {
    fund_drift: riskDetailTables.fund_drift_table || [],
    volatility: riskDetailTables.volatility_table || [],
    beta_exposure: riskDetailTables.beta_table || [],
    portfolio_beta: riskDetailTables.portfolio_beta || 0,
    target_beta: riskDetailTables.target_beta || 0.75,
    sector_concentration: riskDetailTables.sector_concentration_table || [],
    total_it_concentration: riskDetailTables.total_it_concentration || 0,
    underlying_stocks: riskDetailTables.underlying_stocks_table || [],
    drawdown_risk: riskDetailTables.drawdown_table || [],
    risk_dashboard: riskDetailTables.risk_dashboard_table || [],
    insights: riskDetailTables.insights || {}
  };
  
  // Build detailed_news_data from sentiment_chart for sentiment visualization
  const detailedNewsData = {};
  (riskDetailTables.sentiment_chart || []).forEach(item => {
    detailedNewsData[item.ticker] = {
      sentiment_summary: {
        avg_polarity: item.avg_polarity,
        dominant_sentiment: item.dominant_sentiment,
        total_articles: item.total_articles
      }
    };
  });
  
  const summaryRecoData = {
    [clientId]: {
      asset_allocation: recommendations.asset_allocation_comparison || [],
      kpi: {
        portfolio_value: recommendations.kpi_metrics?.portfolio_value || 'N/A',
        positions_to_fix: recommendations.kpi_metrics?.positions_to_fix || 0,
        trade_recos: recommendations.kpi_metrics?.trade_recos || 0,
        expected_benefit: recommendations.kpi_metrics?.expected_benefit || 'N/A'
      },
      recommended_option: {
        name: recommendations.recommended_option?.name || '',
        description: Array.isArray(recommendations.recommended_option?.description)
          ? recommendations.recommended_option.description
          : recommendations.recommended_option?.description
            ? [recommendations.recommended_option.description]
            : [],
        tags: recommendations.recommended_option?.tags || []
      }
    }
  };
  
  // Helper function for relationship bio
  const getRelationshipBio = () => {
    if (client.relationship_bio) {
      return client.relationship_bio;
    }
    if (client.client_name === 'Sam Pai') {
      return 'Tech professional balancing young family with career ambitions. Planning for child\'s education and early retirement while maintaining financial security.';
    } else if (client.client_name === 'Mary Hargrave') {
      return 'Marketing executive navigating mid-career and family priorities. Focused on financial independence, securing children\'s college funds and retirement.';
    } else {
      return `${client.age || 'N/A'}-year-old professional managing portfolio with focus on long-term wealth building.`;
    }
  };

  return (
    <div className="client-detail-page">
      <div className="client-detail-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
          Back
        </button>
        <div className="client-detail-title-group">
          <h1 className="client-detail-title">{client.client_name || 'Client'}</h1>
        </div>
        <button 
          className="action-btn-header action-btn-rerun"
          onClick={() => setRerunModalOpen(true)}
        >
          <RefreshCw size={16} />
          Rerun Analysis
        </button>
        <button 
          className="action-btn-header"
          onClick={() => navigate(`/client/${clientId}/ips`)}
        >
          IPS
        </button>
      </div>

      <RerunModal 
        isOpen={rerunModalOpen}
        onClose={() => setRerunModalOpen(false)}
        onSubmit={handleRerunAnalysis}
        clientId={clientId}
      />

      <div className="client-detail-rationale-bar">
        <Target size={16} />
        <span><span className="rationale-highlight">Portfolio rebalancing</span> {client.action_rationale || 'to align with market risk and IPS'}</span>
      </div>

      <div className="client-detail-content">
        {/* Identity Header */}
        <div className="bento-card identity-card">
          <div className="card-action-link">
            <button 
              className="go-to-action-btn"
              onClick={() => navigate(`/client/${clientId}/profile`)}
            >
              Client Portfolio →
            </button>
          </div>
          <h3 className="card-title">
            <Shield size={20} />
            Client Profile
          </h3>
          <div className="profile-layout">
            <div className="profile-main">
              <p className="client-bio">{getRelationshipBio()}</p>
              <div className="profile-badges">
                <div className="badge-item">
                  <CheckCircle size={14} />
                  <span>KYC Verified</span>
                </div>
                <div className="badge-item">
                  <ShieldCheck size={14} />
                  <span>AML Clear</span>
                </div>
              </div>
            </div>
            <div className="profile-metrics">
              <div className="metric-card">
                <span className="metric-label">Total AUM</span>
                <span className="metric-value">{client.total_aum_formatted || 'N/A'}</span>
              </div>
              <div className="metric-card">
                <span className="metric-label">Risk Profile</span>
                <span className="metric-value">{client.risk_profile || 'Moderate Growth'}</span>
              </div>
              <div className="metric-card">
                <span className="metric-label">Age</span>
                <span className="metric-value">{client.age || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Relationship Timeline */}
        <div className="bento-card timeline-card">
          <h3 className="card-title">
            <Activity size={20} />
            Relationship Timeline
          </h3>
          <div className="timeline-feed">
            {client.client_name === 'Sam Pai' ? (
              <>
                <div className="timeline-item">
                  <div className="timeline-dot"></div>
                  <div className="timeline-content">
                    <span className="timeline-date">3 days ago</span>
                    <p className="timeline-text">Email sent: Investment proposal for diversified portfolio</p>
                  </div>
                </div>
                <div className="timeline-item">
                  <div className="timeline-dot"></div>
                  <div className="timeline-content">
                    <span className="timeline-date">1 week ago</span>
                    <p className="timeline-text">Interaction: Discussed children's education savings goals</p>
                  </div>
                </div>
                <div className="timeline-item">
                  <div className="timeline-dot"></div>
                  <div className="timeline-content">
                    <span className="timeline-date">2 weeks ago</span>
                    <p className="timeline-text">Meeting: Annual portfolio review completed</p>
                  </div>
                </div>
                <div className="timeline-item timeline-start">
                  <div className="timeline-dot timeline-dot-start"></div>
                  <div className="timeline-content">
                    <span className="timeline-date">5 weeks ago</span>
                    <p className="timeline-text">Account opened</p>
                  </div>
                </div>
              </>
            ) : client.client_name === 'Mary Hargrave' ? (
              <>
                <div className="timeline-item">
                  <div className="timeline-dot"></div>
                  <div className="timeline-content">
                    <span className="timeline-date">2 days ago</span>
                    <p className="timeline-text">Interaction: Quarterly relationship review and financial goals update</p>
                  </div>
                </div>
                <div className="timeline-item">
                  <div className="timeline-dot"></div>
                  <div className="timeline-content">
                    <span className="timeline-date">5 days ago</span>
                    <p className="timeline-text">Email sent: Q1 performance report</p>
                  </div>
                </div>
                <div className="timeline-item">
                  <div className="timeline-dot"></div>
                  <div className="timeline-content">
                    <span className="timeline-date">3 weeks ago</span>
                    <p className="timeline-text">Meeting: Discussed college fund options for children</p>
                  </div>
                </div>
                <div className="timeline-item timeline-start">
                  <div className="timeline-dot timeline-dot-start"></div>
                  <div className="timeline-content">
                    <span className="timeline-date">5 weeks ago</span>
                    <p className="timeline-text">Account opened</p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="timeline-item">
                  <div className="timeline-dot"></div>
                  <div className="timeline-content">
                    <span className="timeline-date">2 days ago</span>
                    <p className="timeline-text">Interaction: Quarterly check-in and retirement planning discussion</p>
                  </div>
                </div>
                <div className="timeline-item">
                  <div className="timeline-dot"></div>
                  <div className="timeline-content">
                    <span className="timeline-date">1 week ago</span>
                    <p className="timeline-text">Email sent: Q4 performance report</p>
                  </div>
                </div>
                <div className="timeline-item">
                  <div className="timeline-dot"></div>
                  <div className="timeline-content">
                    <span className="timeline-date">2 weeks ago</span>
                    <p className="timeline-text">Meeting: Annual review completed</p>
                  </div>
                </div>
                <div className="timeline-item timeline-start">
                  <div className="timeline-dot timeline-dot-start"></div>
                  <div className="timeline-content">
                    <span className="timeline-date">5 weeks ago</span>
                    <p className="timeline-text">Account opened</p>
                  </div>
                </div>
              </>
            )}
          </div>
          <button className="timeline-more-btn">View More</button>
        </div>

        {/* Portfolio Drift */}
        <div className="bento-card drift-card">
          <div className="card-ai-badge">
            <AIBadge size="sm" />
          </div>
          <h3 className="card-title">
            <BarChart3 size={20} />
            Portfolio Drift
          </h3>

          {driftTab === 'allocation' && (
            assetAllocation.length > 0 ? (() => {
              const maxVal = Math.max(...assetAllocation.flatMap(r => [r.current_percentage, r.target_percentage]));
              return (
                <div className="allocation-comparison">
                  {assetAllocation.map((row, i) => (
                    <div key={i} className="alloc-row">
                      <span className="alloc-ticker">{row.category}</span>
                      <div className="alloc-bars">
                        <div className="alloc-bar-pair">
                          <div className="alloc-bar alloc-bar--current" style={{ width: `${(row.current_percentage / maxVal) * 75}%` }}>
                            <span className="alloc-bar-label">{row.current_percentage}%</span>
                          </div>
                          <div className="alloc-bar alloc-bar--target" style={{ width: `${(row.target_percentage / maxVal) * 75}%` }}>
                            <span className="alloc-bar-label">{row.target_percentage}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="drift-threshold-legend">
                    <div className="legend-item"><span className="legend-dot" style={{ background: 'var(--info)' }}></span>Current</div>
                    <div className="legend-item"><span className="legend-dot" style={{ background: 'var(--success)' }}></span>Target</div>
                  </div>
                </div>
              );
            })() : <p className="drift-empty">No allocation data available</p>
          )}

          {driftTab === 'drift' && (
            fundDrift.length > 0 ? (
              <>
                <div className="drift-diverging-chart">
                  {fundDrift.map((item, idx) => {
                    const absDrift = Math.abs(item.drift_percentage);
                    const colorClass = absDrift >= 4 ? 'drift-color-red' : absDrift >= 2.5 ? 'drift-color-orange' : 'drift-color-green';
                    const maxDrift = 6;
                    const barWidth = (absDrift / maxDrift) * 50;
                    return (
                      <div key={idx} className="drift-diverging-row">
                        <span className="drift-ticker">{item.ticker}</span>
                        <div className="drift-diverging-bar-area">
                          <div className="drift-diverging-track">
                            {item.drift_percentage < 0 && (
                              <div
                                className={`drift-diverging-bar drift-diverging-bar--left ${colorClass}`}
                                style={{ width: `${barWidth}%` }}
                              >
                                <span className="drift-bar-value">{item.drift_percentage.toFixed(1)}%</span>
                              </div>
                            )}
                            <div className="drift-diverging-center" />
                            {item.drift_percentage > 0 && (
                              <div
                                className={`drift-diverging-bar drift-diverging-bar--right ${colorClass}`}
                                style={{ width: `${barWidth}%` }}
                              >
                                <span className="drift-bar-value">+{item.drift_percentage.toFixed(1)}%</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="drift-threshold-legend">
                  <div className="legend-item"><span className="legend-dot" style={{ background: '#10b981' }}></span>&lt; 2.5% Within range</div>
                  <div className="legend-item"><span className="legend-dot" style={{ background: '#f59e0b' }}></span>2.5–4% Monitor</div>
                  <div className="legend-item"><span className="legend-dot" style={{ background: '#ef4444' }}></span>&gt; 4% Action needed</div>
                </div>
              </>
            ) : <p className="drift-empty">No fund drift data available</p>
          )}

          <div className="drift-toggle">
            <button className={`drift-toggle-btn ${driftTab === 'allocation' ? 'active' : ''}`} onClick={() => setDriftTab('allocation')}>Asset Class</button>
            <button className={`drift-toggle-btn ${driftTab === 'drift' ? 'active' : ''}`} onClick={() => setDriftTab('drift')}>Fund Analysis</button>
          </div>
        </div>

        {/* Risk Analysis Card - Full Width */}
        <div className="bento-card risk-analysis-card">
          <div className="card-action-link">
            <button 
              className="go-to-action-btn"
              onClick={() => navigate(`/client/${clientId}/risk-analysis`)}
            >
              View Details →
            </button>
          </div>
          <div className="card-ai-badge">
            <AIBadge size="sm" />
          </div>
          <h3 className="card-title">
            <AlertTriangle size={20} />
            Drift Analysis Summary
          </h3>
          <div className="risk-summary-list">
            {riskSummary.length === 0 ? (
              <p className="drift-empty">No risk summary available</p>
            ) : (
              riskSummary.map((item, idx) => {
              const isExpanded = expandedRisk[idx];
              const typeClass = item.type === 'ips_breach' ? 'risk-type-ips' : '';
              const severityClass = 
                item.severity === 'high' ? 'risk-severity-high' : 
                item.severity === 'low' ? 'risk-severity-low' : 
                item.type === 'ips_breach' ? 'risk-severity-ips' : 
                'risk-severity-medium';

              // Use detail_type from backend instead of hardcoded index mapping
              const detailType = item.detail_type || 'risk_dashboard_table';

              return (
                <div key={idx} className={`risk-summary-item ${isExpanded ? 'expanded' : ''} ${typeClass}`}>
                  <div className="risk-summary-header" onClick={() => toggleRisk(idx)}>
                    <span className={`risk-severity-dot ${severityClass}`}></span>
                    <div className="risk-summary-text">
                      <span className="risk-summary-title">{item.title}</span>
                      <span className="risk-summary-detail-text">{item.detail}</span>
                    </div>
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                  {isExpanded && (
                    <div className="risk-summary-detail">
                      {detailType === 'fund_drift_table' && (
                        <div className="risk-detail-content">
                          <h4 className="risk-detail-title">Fund-Level Drift</h4>
                          <table className="risk-detail-table">
                            <thead><tr><th>Ticker</th><th>Actual</th><th>Target</th><th>Drift</th></tr></thead>
                            <tbody>
                              {riskAnalysisData.fund_drift.map((f, i) => (
                                <tr key={i}>
                                  <td className="risk-ticker-cell">{f.ticker}</td>
                                  <td>{typeof f.actual === 'number' ? f.actual.toFixed(1) : f.actual}%</td>
                                  <td>{typeof f.target === 'number' ? f.target.toFixed(1) : f.target}%</td>
                                  <td className={f.drift > 0 ? 'positive' : f.drift < 0 ? 'negative' : ''}>
                                    {typeof f.drift === 'number' ? `${f.drift > 0 ? '+' : ''}${f.drift.toFixed(1)}%` : f.drift}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {riskAnalysisData.insights?.drift && (
                            <ul className="risk-insight-bullets">
                              {riskAnalysisData.insights.drift.map((t, i) => <li key={i}>{t}</li>)}
                            </ul>
                          )}
                        </div>
                      )}

                      {detailType === 'volatility_table' && (
                        <div className="risk-detail-content">
                          <h4 className="risk-detail-title">Volatility Breakdown</h4>
                          <table className="risk-detail-table">
                            <thead><tr><th>Tier</th><th>Fund</th><th>Std Dev</th><th>VaR 95%</th><th>Weight</th><th>Risk Contrib</th></tr></thead>
                            <tbody>
                              {riskAnalysisData.volatility.map((v, i) => (
                                <tr key={i}>
                                  <td className={v.tier === 'High' ? 'negative' : v.tier === 'Moderate' ? 'warning' : ''}>{v.tier}</td>
                                  <td className="risk-ticker-cell">{v.fund}</td>
                                  <td>{v.std_dev}</td>
                                  <td>{v.var_95}</td>
                                  <td>{v.weight}</td>
                                  <td>{v.risk_contrib}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {riskAnalysisData.insights?.volatility && (
                            <ul className="risk-insight-bullets">
                              {riskAnalysisData.insights.volatility.map((t, i) => <li key={i}>{t}</li>)}
                            </ul>
                          )}
                        </div>
                      )}

                      {detailType === 'beta_table' && (
                        <div className="risk-detail-content">
                          <h4 className="risk-detail-title">Beta Exposure by Fund</h4>
                          <table className="risk-detail-table">
                            <thead><tr><th>Fund</th><th>Beta</th><th>Weight</th><th>Contribution</th></tr></thead>
                            <tbody>
                              {riskAnalysisData.beta_exposure.map((b, i) => (
                                <tr key={i}>
                                  <td className="risk-ticker-cell">{b.fund}</td>
                                  <td className={b.beta > 1 ? 'negative' : b.beta >= 0.8 ? 'warning' : ''}>{b.beta}</td>
                                  <td>{b.weight}</td>
                                  <td>{b.contribution.toFixed(3)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <div className="risk-detail-note">Portfolio Beta: <strong style={{ color: 'var(--error)' }}>{riskAnalysisData.portfolio_beta}</strong> — Target: <strong>{riskAnalysisData.target_beta}</strong></div>
                          {riskAnalysisData.insights?.beta && (
                            <ul className="risk-insight-bullets">
                              {riskAnalysisData.insights.beta.map((t, i) => <li key={i}>{t}</li>)}
                            </ul>
                          )}
                        </div>
                      )}

                      {(detailType === 'sector_table' || detailType === 'sector_concentration_table') && (
                        <div className="risk-detail-content">
                          <h4 className="risk-detail-title">IT Sector Concentration</h4>
                          <table className="risk-detail-table">
                            <thead><tr><th>Fund</th><th>IT %</th><th>Eq Weight</th><th>IT Contrib</th></tr></thead>
                            <tbody>
                              {riskAnalysisData.sector_concentration.map((s, i) => (
                                <tr key={i}>
                                  <td className="risk-ticker-cell">{s.fund}</td>
                                  <td>{s.it_pct || s.it_percentage}</td>
                                  <td>{s.eq_weight || s.equity_weight}</td>
                                  <td>{s.it_contrib || s.it_contribution}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <div className="risk-detail-note">Total IT: <strong>{riskAnalysisData.total_it_concentration}%</strong> — IPS Limit: ≤30%</div>
                          {riskAnalysisData.insights?.sector && (
                            <ul className="risk-insight-bullets">
                              {riskAnalysisData.insights.sector.map((t, i) => <li key={i}>{t}</li>)}
                            </ul>
                          )}
                        </div>
                      )}


                      {(detailType === 'stocks_table' || detailType === 'underlying_stocks_table') && (
                        <div className="risk-detail-content">
                          <h4 className="risk-detail-title">Underlying Stock Holdings</h4>
                          <table className="risk-detail-table">
                            <thead><tr><th>Stock</th><th>Sector</th><th>Weight</th><th>1Y Return</th><th>Beta</th><th>Risk Tier</th></tr></thead>
                            <tbody>
                              {riskAnalysisData.underlying_stocks.map((s, i) => (
                                <tr key={i}>
                                  <td className="risk-ticker-cell">{s.stock}</td>
                                  <td>{s.sector}</td>
                                  <td>{s.weight_pct}%</td>
                                  <td className={s.return_1y_pct >= 20 ? 'positive' : s.return_1y_pct < 10 ? 'negative' : ''}>{s.return_1y_pct}%</td>
                                  <td className={s.beta > 1.5 ? 'negative' : s.beta > 1 ? 'warning' : ''}>{s.beta}</td>
                                  <td><span className={`risk-action-tag ${s.risk_tier === 'Very High' || s.risk_tier === 'High' ? 'risk-action-red' : 'risk-action-warn'}`}>{s.risk_tier}</span></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {riskAnalysisData.insights?.stocks && (
                            <ul className="risk-insight-bullets">
                              {riskAnalysisData.insights.stocks.map((t, i) => <li key={i}>{t}</li>)}
                            </ul>
                          )}
                        </div>
                      )}

                      {detailType === 'drawdown_table' && (
                        <div className="risk-detail-content">
                          <h4 className="risk-detail-title">Drawdown Risk by Fund</h4>
                          <table className="risk-detail-table">
                            <thead><tr><th>Fund</th><th>Max Drawdown</th><th>VaR 95%</th><th>Note</th></tr></thead>
                            <tbody>
                              {riskAnalysisData.drawdown_risk.map((d, i) => (
                                <tr key={i}>
                                  <td className="risk-ticker-cell">{d.fund}</td>
                                  <td className="negative">{d.max_dd}</td>
                                  <td>{d.var_95}</td>
                                  <td>{d.note}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {riskAnalysisData.insights?.drawdown && (
                            <ul className="risk-insight-bullets">
                              {riskAnalysisData.insights.drawdown.map((t, i) => <li key={i}>{t}</li>)}
                            </ul>
                          )}
                        </div>
                      )}

                      {detailType === 'sentiment_chart' && (
                        <div className="risk-detail-content">
                          <h4 className="risk-detail-title">Market Sentiment</h4>
                          <div className="risk-sentiment-chart">
                            {Object.entries(detailedNewsData).map(([ticker, news]) => {
                              const s = news.sentiment_summary;
                              const polarity = s.avg_polarity;
                              const absPolarity = Math.abs(polarity);
                              const maxPolarity = 0.7;
                              const barWidth = Math.min((absPolarity / maxPolarity) * 45, 45);
                              const sentimentClass = s.dominant_sentiment;
                              return (
                                <div key={ticker} className="risk-sentiment-row">
                                  <span className="risk-sentiment-ticker">{ticker}</span>
                                  <div className="risk-sentiment-bar-area">
                                    <div className="risk-sentiment-track">
                                      {polarity < 0 && (
                                        <div
                                          className={`risk-sentiment-bar risk-sentiment-bar--left ${sentimentClass}`}
                                          style={{ width: `${barWidth}%` }}
                                        >
                                          <span className="risk-sentiment-val">{polarity.toFixed(3)}</span>
                                        </div>
                                      )}
                                      <div className="risk-sentiment-center" />
                                      {polarity >= 0 && (
                                        <div
                                          className={`risk-sentiment-bar risk-sentiment-bar--right ${sentimentClass}`}
                                          style={{ width: `${barWidth}%` }}
                                        >
                                          <span className="risk-sentiment-val">+{polarity.toFixed(3)}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <span className={`risk-sentiment-label-badge ${sentimentClass}`}>{s.dominant_sentiment}</span>
                                </div>
                              );
                            })}
                          </div>
                          <div className="drift-threshold-legend" style={{ marginTop: 'var(--space-md)' }}>
                            <div className="legend-item"><span className="legend-dot" style={{ background: '#10b981' }}></span>Positive</div>
                            <div className="legend-item"><span className="legend-dot" style={{ background: '#f59e0b' }}></span>Neutral</div>
                            <div className="legend-item"><span className="legend-dot" style={{ background: '#ef4444' }}></span>Negative</div>
                          </div>
                          <button
                            className="risk-view-detail-btn"
                            onClick={() => navigate(`/client/${clientId}/investment-details`)}
                          >
                            View Details →
                          </button>
                          {riskAnalysisData.insights?.sentiment && (
                            <ul className="risk-insight-bullets">
                              {riskAnalysisData.insights.sentiment.map((t, i) => <li key={i}>{t}</li>)}
                            </ul>
                          )}
                        </div>
                      )}

                      {detailType === 'risk_dashboard_table' && (
                        <div className="risk-detail-content">
                          <h4 className="risk-detail-title">Risk Dashboard — IPS Comparison</h4>
                          <table className="risk-detail-table">
                            <thead><tr><th>Metric</th><th>Current</th><th>Target</th><th>Variance</th><th>Action</th></tr></thead>
                            <tbody>
                              {riskAnalysisData.risk_dashboard.map((r, i) => (
                                <tr key={i}>
                                  <td>{r.metric}</td>
                                  <td>{r.current}</td>
                                  <td>{r.target}</td>
                                  <td className="negative">{r.variance}</td>
                                  <td><span className={`risk-action-tag ${r.action && (r.action.includes('FAIL') || r.action.includes('BREACH')) ? 'risk-action-red' : 'risk-action-warn'}`}>{r.action}</span></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {riskAnalysisData.insights?.dashboard && (
                            <ul className="risk-insight-bullets">
                              {riskAnalysisData.insights.dashboard.map((t, i) => <li key={i}>{t}</li>)}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
            )}
          </div>
        </div>

        {/* Row 6: Summary & Recommendations */}
        <div className="bento-card actions-card">
          <div className="card-action-link">
            <button 
              className="go-to-action-btn"
              onClick={() => navigate(`/action/rebalancing/${clientId}`)}
            >
              Rebalancing Details →
            </button>
          </div>
          <div className="card-ai-badge">
            <AIBadge size="sm" />
          </div>
          <h3 className="card-title">
            <Calendar size={20} />
            Summary & Recommendations
          </h3>
          <div className="summary-reco-layout">
              <div className="reco-kpi-row">
                <div className="reco-kpi"><span className="reco-kpi-value">{summaryRecoData[clientId].kpi.portfolio_value}</span><span className="reco-kpi-label">Portfolio Value</span></div>
                <div className="reco-kpi"><span className="reco-kpi-value">{summaryRecoData[clientId].kpi.positions_to_fix}</span><span className="reco-kpi-label">Positions to Fix</span></div>
                <div className="reco-kpi"><span className="reco-kpi-value">{summaryRecoData[clientId].kpi.trade_recos}</span><span className="reco-kpi-label">Trade Recos</span></div>
                <div className="reco-kpi highlight"><span className="reco-kpi-value">{summaryRecoData[clientId].kpi.expected_benefit}</span><span className="reco-kpi-label">Expected Benefit</span></div>
              </div>

              <div className="reco-option-card">
                <div className="reco-option-header">
                  <span className="reco-option-label">Recommended Option</span>
                  <span className="reco-option-name">{summaryRecoData[clientId].recommended_option.name}</span>
                </div>
                {Array.isArray(summaryRecoData[clientId].recommended_option.description)
                  ? summaryRecoData[clientId].recommended_option.description.map((p, i) => <p key={i} className="reco-option-desc" dangerouslySetInnerHTML={{ __html: p }} />)
                  : <p className="reco-option-desc">{summaryRecoData[clientId].recommended_option.description}</p>
                }
                <div className="reco-tags">
                  {summaryRecoData[clientId].recommended_option.tags?.map((tag, i) => (
                    <span key={i} className={`reco-tag ${tag === 'Approval Required' ? 'reco-tag--warn' : ''}`}>{tag}</span>
                  ))}
                </div>

                <div className="reco-alloc-toggle" onClick={() => setAllocChartOpen(prev => !prev)}>
                  <span className="reco-alloc-toggle-label">Allocation Overview</span>
                  {allocChartOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
                {allocChartOpen && summaryRecoData[clientId].asset_allocation.length > 0 && (
                  <div className="reco-alloc-chart">
                    {summaryRecoData[clientId].asset_allocation.map((row, i) => {
                      const maxVal = Math.max(...summaryRecoData[clientId].asset_allocation.flatMap(r => [r.current_percentage, r.target_percentage, r.rebalanced_percentage || r.target_percentage]));
                      return (
                        <div key={i} className="reco-alloc-row">
                          <span className="reco-alloc-ticker">{row.category}</span>
                          <div className="reco-alloc-bars">
                            <div className="reco-alloc-bar-triple">
                              <div className="reco-alloc-bar reco-alloc-bar--current" style={{ width: `${(row.current_percentage / maxVal) * 75}%` }}>
                                <span className="reco-alloc-bar-label">{row.current_percentage}%</span>
                              </div>
                              <div className="reco-alloc-bar reco-alloc-bar--target" style={{ width: `${(row.target_percentage / maxVal) * 75}%` }}>
                                <span className="reco-alloc-bar-label">{row.target_percentage}%</span>
                              </div>
                              <div className="reco-alloc-bar reco-alloc-bar--rebalanced" style={{ width: `${((row.rebalanced_percentage || row.target_percentage) / maxVal) * 75}%` }}>
                                <span className="reco-alloc-bar-label">{row.rebalanced_percentage || row.target_percentage}%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div className="drift-threshold-legend" style={{ marginTop: 'var(--space-sm)' }}>
                      <div className="legend-item"><span className="legend-dot" style={{ background: 'var(--info)' }}></span>Current</div>
                      <div className="legend-item"><span className="legend-dot" style={{ background: 'var(--text-tertiary)' }}></span>Target</div>
                      <div className="legend-item"><span className="legend-dot" style={{ background: 'var(--success)' }}></span>Rebalanced</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="reco-action-buttons">
                <button 
                  className="reco-btn reco-btn--approve"
                  onClick={() => { setCompletedActions(prev => ({ ...prev, [clientId]: true })); navigate(-1); }}
                >
                  Approve
                </button>
                <button className="reco-btn reco-btn--hold">Hold</button>
                <button className="reco-btn reco-btn--verify">Verify</button>
                <button className="reco-btn reco-btn--scenario">Run Scenario</button>
              </div>
            </div>
        </div>

        {/* Row 7: Customer Service Toolkit (full width) */}
        <div className="bento-card toolkit-card">
          <h3 className="card-title">
            <FileText size={20} />
            Customer Service Toolkit
          </h3>
          <div className="toolkit-message">
            <p>To proceed with portfolio rebalancing, you may share this pre-filled form with client.</p>
          </div>
          <div className="toolkit-single">
            <div className="toolkit-item">
              <div className="toolkit-icon">
                <FileText size={24} />
              </div>
              <h4>Consent Letter</h4>
              <p>Pre-filled authorization form for portfolio rebalancing with recommended changes</p>
              <a href="#" className="toolkit-link">View Document →</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDetail;
