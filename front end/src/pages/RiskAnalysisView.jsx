import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BarChart3, Shield, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { motion } from 'framer-motion';
import clientDataService from '../services/clientDataService';
import './RiskAnalysisView.css';

const RiskAnalysisView = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [riskSummary, setRiskSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState({
    drift: true,
    volatility: true,
    beta: false,
    drawdown: false,
    sector: false,
    dashboard: true,
    summary: true
  });

  useEffect(() => {
    const fetchRiskData = async () => {
      try {
        setLoading(true);
        
        console.log(`[RiskAnalysisView] Fetching data for client ${clientId}`);
        
        // Use production-ready service
        const response = await clientDataService.getRiskAnalysis(clientId);
        setData(response.data);

        // Risk summary lives in client_detail, slice it from full cache
        const fullSlice = clientDataService._sliceFromFull(clientId, 'client_detail');
        if (fullSlice.success) {
          setRiskSummary(fullSlice.data?.data?.risk_summary || []);
        }
      } catch (err) {
        console.error(`[RiskAnalysisView] Error:`, err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRiskData();
  }, [clientId]);

  const toggle = (key) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  const getTierClass = (tier) => {
    if (tier === 'High') return 'rav-tier-high';
    if (tier === 'Moderate') return 'rav-tier-moderate';
    return 'rav-tier-low';
  };

  const getDriftColor = (val) => {
    const abs = Math.abs(val);
    if (abs >= 5) return 'rav-drift-red';
    if (abs >= 3) return 'rav-drift-orange';
    return 'rav-drift-green';
  };

  const getActionClass = (action) => {
    if (action.includes('FAIL') || action.includes('BREACH')) return 'rav-action-red';
    return 'rav-action-orange';
  };

  if (loading) {
    return (
      <div className="rav-page">
        <div className="rav-header">
          <button onClick={() => navigate(-1)} className="rav-back-btn">
            <ArrowLeft size={18} />
            Back
          </button>
          <h1 className="rav-title">Drift Analysis</h1>
        </div>
        <div style={{ padding: '2rem', textAlign: 'center' }}>Loading risk analysis...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rav-page">
        <div className="rav-header">
          <button onClick={() => navigate(-1)} className="rav-back-btn">
            <ArrowLeft size={18} />
            Back
          </button>
          <h1 className="rav-title">Drift Analysis</h1>
        </div>
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--error)' }}>
          Error: {error}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="rav-page">
      <div className="rav-header">
        <button onClick={() => navigate(-1)} className="rav-back-btn">
          <ArrowLeft size={18} />
          Back
        </button>
        <h1 className="rav-title">Drift Analysis</h1>
      </div>

      <div className="rav-content">
        {/* Asset & Fund Level Drift */}
        <motion.section className="rav-section" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="rav-section-header" onClick={() => toggle('drift')}>
            <div className="rav-section-title">
              <BarChart3 size={20} />
              <h2>Allocation & Drift</h2>
            </div>
            {expanded.drift ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
          {expanded.drift && (
            <div className="rav-grid-2">
              <div>
                <h3 className="rav-sub-title">Asset Class vs Target</h3>
                <table className="rav-table">
                  <thead><tr><th>Class</th><th>Actual</th><th>Target</th><th>Diff</th><th>Band</th><th>Status</th></tr></thead>
                  <tbody>
                    {(data?.asset_drift || []).map((r, i) => (
                      <tr key={i}>
                        <td>{r.class}</td>
                        <td>{r.actual}%</td>
                        <td>{r.target}%</td>
                        <td className={r.diff > 0 ? 'positive' : r.diff < 0 ? 'negative' : ''}>{r.diff > 0 ? '+' : ''}{r.diff.toFixed(2)}%</td>
                        <td>{r.band}</td>
                        <td><span className={`rav-badge ${r.status === 'BREACH' ? 'rav-badge-red' : 'rav-badge-green'}`}>{r.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div>
                <h3 className="rav-sub-title">Fund-Level Drift</h3>
                <div className="rav-drift-chart">
                  {(data?.fund_drift || []).map((item, idx) => {
                    const absDrift = Math.abs(item.drift);
                    const maxDrift = 6;
                    const barWidth = (absDrift / maxDrift) * 45;
                    const colorClass = getDriftColor(item.drift);
                    return (
                      <div key={idx} className="rav-drift-row">
                        <span className="rav-drift-ticker">{item.ticker}</span>
                        <div className="rav-drift-bar-area">
                          <div className="rav-drift-track">
                            {item.drift < 0 && (
                              <div className={`rav-drift-bar rav-drift-bar--left ${colorClass}`} style={{ width: `${barWidth}%` }}>
                                <span className="rav-drift-val">{item.drift.toFixed(1)}%</span>
                              </div>
                            )}
                            <div className="rav-drift-center" />
                            {item.drift > 0 && (
                              <div className={`rav-drift-bar rav-drift-bar--right ${colorClass}`} style={{ width: `${barWidth}%` }}>
                                <span className="rav-drift-val">+{item.drift.toFixed(1)}%</span>
                              </div>
                            )}
                            {item.drift === 0 && (
                              <span className="rav-drift-zero">0.0%</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </motion.section>

        {/* Volatility */}
        <motion.section className="rav-section" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }}>
          <div className="rav-section-header" onClick={() => toggle('volatility')}>
            <div className="rav-section-title">
              <AlertTriangle size={20} />
              <h2>Volatility</h2>
            </div>
            {expanded.volatility ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
          {expanded.volatility && (
            <table className="rav-table">
              <thead><tr><th>Tier</th><th>Fund</th><th>Std Dev</th><th>VaR 95%</th><th>Weight</th><th>Risk Contrib</th></tr></thead>
              <tbody>
                {(data?.volatility || []).map((r, i) => (
                  <tr key={i}>
                    <td><span className={getTierClass(r.tier)}>{r.tier}</span></td>
                    <td className="rav-ticker">{r.fund}</td>
                    <td>{r.std_dev}</td>
                    <td>{r.var_95}</td>
                    <td>{r.weight}</td>
                    <td>{r.risk_contrib}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </motion.section>

        {/* Beta Exposure */}
        <motion.section className="rav-section" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
          <div className="rav-section-header" onClick={() => toggle('beta')}>
            <div className="rav-section-title">
              <BarChart3 size={20} />
              <h2>Beta Exposure</h2>
            </div>
            {expanded.beta ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
          {expanded.beta && (
            <>
              <table className="rav-table">
                <thead><tr><th>Fund</th><th>Beta</th><th>Weight</th><th>Contribution</th></tr></thead>
                <tbody>
                  {(data?.beta_exposure || []).map((r, i) => (
                    <tr key={i}>
                      <td className="rav-ticker">{r.fund}</td>
                      <td>{r.beta.toFixed(2)}</td>
                      <td>{r.weight}</td>
                      <td>{r.contribution.toFixed(3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="rav-narrative">
                Portfolio Beta: <strong>{data?.portfolio_beta || 'N/A'}</strong> &nbsp;|&nbsp; Target: <strong>{data?.target_beta || 'N/A'}</strong>
              </div>
            </>
          )}
        </motion.section>

        {/* Drawdown Risk */}
        <motion.section className="rav-section" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}>
          <div className="rav-section-header" onClick={() => toggle('drawdown')}>
            <div className="rav-section-title">
              <AlertTriangle size={20} />
              <h2>Drawdown Risk</h2>
            </div>
            {expanded.drawdown ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
          {expanded.drawdown && (
            <table className="rav-table">
              <thead><tr><th>Fund</th><th>Max DD</th><th>VaR 95%</th><th>Note</th></tr></thead>
              <tbody>
                {(data?.drawdown_risk || []).map((r, i) => (
                  <tr key={i}>
                    <td className="rav-ticker">{r.fund}</td>
                    <td className="negative">{r.max_dd}</td>
                    <td>{r.var_95}</td>
                    <td className="rav-note">{r.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </motion.section>

        {/* Sector Concentration */}
        <motion.section className="rav-section" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
          <div className="rav-section-header" onClick={() => toggle('sector')}>
            <div className="rav-section-title">
              <Shield size={20} />
              <h2>IT Sector Concentration</h2>
            </div>
            {expanded.sector ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
          {expanded.sector && (
            <>
              <table className="rav-table">
                <thead><tr><th>Fund</th><th>IT %</th><th>Eq Weight</th><th>IT Contrib</th></tr></thead>
                <tbody>
                  {(data?.sector_concentration || []).map((r, i) => (
                    <tr key={i}>
                      <td className="rav-ticker">{r.fund}</td>
                      <td>{r.it_pct || r.it_percentage}</td>
                      <td>{r.eq_weight || r.equity_weight}</td>
                      <td>{r.it_contrib || r.it_contribution}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="rav-narrative">
                Total IT Concentration (Equity): <strong className="negative">{data?.total_it_concentration || 'N/A'}%</strong> &nbsp;|&nbsp; IPS Limit: <strong>≤30%</strong>
              </div>
            </>
          )}
        </motion.section>

        {/* Risk Dashboard */}
        <motion.section className="rav-section" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.25 }}>
          <div className="rav-section-header" onClick={() => toggle('dashboard')}>
            <div className="rav-section-title">
              <BarChart3 size={20} />
              <h2>Risk Dashboard — IPS Comparison</h2>
            </div>
            {expanded.dashboard ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
          {expanded.dashboard && (
            <table className="rav-table">
              <thead><tr><th>Metric</th><th>Current</th><th>Target</th><th>Variance</th><th>Action</th></tr></thead>
              <tbody>
                {(data?.risk_dashboard || []).map((r, i) => (
                  <tr key={i}>
                    <td>{r.metric}</td>
                    <td>{r.current}</td>
                    <td>{r.target}</td>
                    <td>{r.variance}</td>
                    <td><span className={`rav-action-badge ${getActionClass(r.action)}`}>{r.action}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </motion.section>

        {/* Risk Summary */}
        <motion.section className="rav-section" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}>
          <div className="rav-section-header" onClick={() => toggle('summary')}>
            <div className="rav-section-title">
              <Shield size={20} />
              <h2>Risk Summary</h2>
            </div>
            {expanded.summary ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
          {expanded.summary && (
            <div className="rav-summary-box">
              {riskSummary.length === 0 ? (
                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>No risk summary available</p>
              ) : (
                <ul>
                  {riskSummary.map((item, i) => (
                    <li key={i}><strong>{item.title}</strong> — {item.detail}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </motion.section>
      </div>
    </div>
  );
};

export default RiskAnalysisView;
