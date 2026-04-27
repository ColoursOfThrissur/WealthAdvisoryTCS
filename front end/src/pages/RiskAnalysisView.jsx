import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BarChart3, Shield, AlertTriangle, ChevronDown, ChevronUp, Activity, TrendingDown, Layers, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import clientDataService from '../services/clientDataService';
import AIBadge from '../components/AIBadge';
import './RiskAnalysisView.css';

const Section = ({ id, icon, title, badge, expanded, onToggle, delay, children }) => (
  <motion.section
    className="rav-section"
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, delay }}
  >
    <div className="rav-section-header" onClick={onToggle}>
      <div className="rav-section-title">
        {icon}
        <h2>{title}</h2>
        {badge && <span className={`rav-section-badge ${badge.cls}`}>{badge.label}</span>}
      </div>
      {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
    </div>
    {expanded && <div className="rav-section-body">{children}</div>}
  </motion.section>
);

const InsightList = ({ items }) => {
  if (!items || items.length === 0) return null;
  return (
    <ul className="rav-insights">
      {items.map((t, i) => <li key={i}>{t}</li>)}
    </ul>
  );
};

const RiskAnalysisView = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [riskSummary, setRiskSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState({
    drift: true, volatility: true, beta: false,
    drawdown: false, sector: false, dashboard: true, summary: false
  });

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const response = await clientDataService.getRiskAnalysis(clientId);
        setData(response.data);
        const fullSlice = clientDataService._sliceFromFull(clientId, 'client_detail');
        if (fullSlice.success) setRiskSummary(fullSlice.data?.data?.risk_summary || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetch();
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

  const getActionClass = (action) =>
    action && (action.includes('FAIL') || action.includes('BREACH')) ? 'rav-action-red' : 'rav-action-green';

  if (loading) return (
    <div className="rav-page">
      <div className="rav-header">
        <h1 className="rav-title">Drift Analysis</h1>
      </div>
      <div className="rav-loading">
        <div className="rav-loading-spinner" />
        <p>Loading risk analysis...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="rav-page">
      <div className="rav-header">
        <h1 className="rav-title">Drift Analysis</h1>
      </div>
      <div className="rav-error"><AlertTriangle size={20} style={{ display: 'inline', marginRight: '8px' }} />{error}</div>
    </div>
  );

  if (!data) return null;

  const breachCount = (data.asset_drift || []).filter(r => r.status === 'BREACH').length;
  const violations = riskSummary.filter(r => r.type === 'risk').length;

  return (
    <div className="rav-page">
      <div className="rav-header">
        <h1 className="rav-title">Drift Analysis</h1>
        <div className="rav-header-badge"><AIBadge size="sm" /></div>
      </div>

      {/* KPI Summary Bar */}
      <div className="rav-kpi-bar">
        <div className="rav-kpi">
          <span className="rav-kpi-label">Portfolio Beta</span>
          <span className={`rav-kpi-value ${data.portfolio_beta > data.target_beta ? 'negative' : 'positive'}`}>
            {data.portfolio_beta ?? 'N/A'}
          </span>
          <span className="rav-kpi-sub">Target ≤{data.target_beta}</span>
        </div>
        <div className="rav-kpi">
          <span className="rav-kpi-label">Volatility 1Y</span>
          <span className={`rav-kpi-value ${data.volatility_1y_pct > 15 ? 'negative' : 'positive'}`}>
            {data.volatility_1y_pct ?? 'N/A'}%
          </span>
          <span className="rav-kpi-sub">Annualized</span>
        </div>
        <div className="rav-kpi">
          <span className="rav-kpi-label">Sharpe Ratio</span>
          <span className={`rav-kpi-value ${data.sharpe_1y > 1 ? 'positive' : 'negative'}`}>
            {data.sharpe_1y ?? 'N/A'}
          </span>
          <span className="rav-kpi-sub">1Y</span>
        </div>
        <div className="rav-kpi">
          <span className="rav-kpi-label">IT Concentration</span>
          <span className={`rav-kpi-value ${data.total_it_concentration > 30 ? 'negative' : 'positive'}`}>
            {data.total_it_concentration ?? 0}%
          </span>
          <span className="rav-kpi-sub">IPS Limit ≤30%</span>
        </div>
        <div className="rav-kpi">
          <span className="rav-kpi-label">Asset Breaches</span>
          <span className={`rav-kpi-value ${breachCount > 0 ? 'negative' : 'positive'}`}>{breachCount}</span>
          <span className="rav-kpi-sub">of {(data.asset_drift || []).length} classes</span>
        </div>
        <div className="rav-kpi">
          <span className="rav-kpi-label">Risk Flags</span>
          <span className={`rav-kpi-value ${violations > 0 ? 'negative' : 'positive'}`}>{violations}</span>
          <span className="rav-kpi-sub">Active alerts</span>
        </div>
      </div>

      <div className="rav-content">

        {/* Allocation & Drift */}
        <Section id="drift" icon={<BarChart3 size={18} />} title="Allocation & Drift"
          badge={breachCount > 0 ? { label: `${breachCount} BREACH`, cls: 'badge-red' } : { label: 'OK', cls: 'badge-green' }}
          expanded={expanded.drift} onToggle={() => toggle('drift')} delay={0}>
          <div className="rav-grid-2">
            <div>
              <p className="rav-sub-title">Asset Class vs Target</p>
              <div className="rav-table-wrapper">
                <table className="rav-table">
                  <thead><tr><th>Class</th><th>Actual</th><th>Target</th><th>Diff</th><th>Band</th><th>Status</th></tr></thead>
                  <tbody>
                    {(data.asset_drift || []).map((r, i) => (
                      <tr key={i}>
                        <td className="rav-ticker">{r.class}</td>
                        <td>{r.actual}%</td>
                        <td>{r.target}%</td>
                        <td className={r.diff > 0 ? 'positive' : r.diff < 0 ? 'negative' : ''}>
                          {r.diff > 0 ? '+' : ''}{typeof r.diff === 'number' ? r.diff.toFixed(2) : r.diff}%
                        </td>
                        <td>{r.band}</td>
                        <td><span className={`rav-badge ${r.status === 'BREACH' ? 'rav-badge-red' : 'rav-badge-green'}`}>{r.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <p className="rav-sub-title">Fund-Level Drift</p>
              <div className="rav-drift-chart">
                {(data.fund_drift || []).map((item, idx) => {
                  const abs = Math.abs(item.drift);
                  const barWidth = (abs / 6) * 45;
                  const cls = getDriftColor(item.drift);
                  return (
                    <div key={idx} className="rav-drift-row">
                      <span className="rav-drift-ticker">{item.ticker}</span>
                      <div className="rav-drift-bar-area">
                        <div className="rav-drift-track">
                          {item.drift < 0 && (
                            <div className={`rav-drift-bar rav-drift-bar--left ${cls}`} style={{ width: `${barWidth}%` }}>
                              <span className="rav-drift-val">{item.drift.toFixed(1)}%</span>
                            </div>
                          )}
                          <div className="rav-drift-center" />
                          {item.drift > 0 && (
                            <div className={`rav-drift-bar rav-drift-bar--right ${cls}`} style={{ width: `${barWidth}%` }}>
                              <span className="rav-drift-val">+{item.drift.toFixed(1)}%</span>
                            </div>
                          )}
                          {item.drift === 0 && <span className="rav-drift-zero">0.0%</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="rav-legend">
                <span className="rav-legend-item"><span className="rav-dot" style={{ background: 'var(--success)' }} />{'<3% OK'}</span>
                <span className="rav-legend-item"><span className="rav-dot" style={{ background: 'var(--warning)' }} />3–5% Monitor</span>
                <span className="rav-legend-item"><span className="rav-dot" style={{ background: 'var(--error)' }} />{'>5% Breach'}</span>
              </div>
            </div>
          </div>
        </Section>

        {/* Volatility */}
        <Section id="volatility" icon={<Activity size={18} />} title="Volatility Breakdown"
          expanded={expanded.volatility} onToggle={() => toggle('volatility')} delay={0.05}>
          <div className="rav-table-wrapper">
            <table className="rav-table">
              <thead><tr><th>Tier</th><th>Fund</th><th>Std Dev</th><th>VaR 95%</th><th>Weight</th><th>Risk Contrib</th></tr></thead>
              <tbody>
                {(data.volatility || []).map((r, i) => (
                  <tr key={i}>
                    <td><span className={getTierClass(r.tier)}>{r.tier}</span></td>
                    <td className="rav-ticker">{r.fund}</td>
                    <td>{r.std_dev}</td>
                    <td className="negative">{r.var_95}</td>
                    <td>{r.weight}</td>
                    <td>{r.risk_contrib}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <InsightList items={data.insights?.volatility} />
        </Section>

        {/* Beta Exposure */}
        <Section id="beta" icon={<Target size={18} />} title="Beta Exposure"
          badge={data.portfolio_beta > data.target_beta ? { label: 'EXCEEDS TARGET', cls: 'badge-red' } : { label: 'WITHIN TARGET', cls: 'badge-green' }}
          expanded={expanded.beta} onToggle={() => toggle('beta')} delay={0.1}>
          <div className="rav-beta-layout">
            <div className="rav-table-wrapper">
              <table className="rav-table">
                <thead><tr><th>Fund</th><th>Beta</th><th>Weight</th><th>Contribution</th></tr></thead>
                <tbody>
                  {(data.beta_exposure || []).map((r, i) => (
                    <tr key={i}>
                      <td className="rav-ticker">{r.fund}</td>
                      <td className={r.beta > 1 ? 'negative' : r.beta >= 0.8 ? 'warning' : ''}>{r.beta.toFixed(2)}</td>
                      <td>{r.weight}</td>
                      <td>{r.contribution.toFixed(3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="rav-beta-summary">
              <div className="rav-beta-gauge">
                <span className="rav-beta-label">Portfolio Beta</span>
                <span className={`rav-beta-value ${data.portfolio_beta > data.target_beta ? 'negative' : 'positive'}`}>
                  {data.portfolio_beta}
                </span>
                <span className="rav-beta-target">Target ≤{data.target_beta}</span>
              </div>
              <InsightList items={data.insights?.beta} />
            </div>
          </div>
        </Section>

        {/* Drawdown Risk */}
        <Section id="drawdown" icon={<TrendingDown size={18} />} title="Drawdown Risk"
          expanded={expanded.drawdown} onToggle={() => toggle('drawdown')} delay={0.15}>
          <div className="rav-table-wrapper">
            <table className="rav-table">
              <thead><tr><th>Fund</th><th>Max Drawdown</th><th>VaR 95%</th><th>Assessment</th></tr></thead>
              <tbody>
                {(data.drawdown_risk || []).map((r, i) => (
                  <tr key={i}>
                    <td className="rav-ticker">{r.fund}</td>
                    <td className="negative">{r.max_dd}</td>
                    <td>{r.var_95}</td>
                    <td className="rav-note">{r.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <InsightList items={data.insights?.drawdown} />
        </Section>

        {/* Sector Concentration */}
        <Section id="sector" icon={<Layers size={18} />} title="IT Sector Concentration"
          badge={data.total_it_concentration > 30 ? { label: 'IPS BREACH', cls: 'badge-red' } : { label: 'WITHIN LIMIT', cls: 'badge-green' }}
          expanded={expanded.sector} onToggle={() => toggle('sector')} delay={0.2}>
          <div className="rav-sector-kpis">
            <div className="rav-sector-kpi">
              <span className="rav-sector-kpi-label">Total IT Exposure</span>
              <span className={`rav-sector-kpi-value ${data.total_it_concentration > 30 ? 'negative' : 'positive'}`}>
                {typeof data.total_it_concentration === 'number' ? data.total_it_concentration.toFixed(1) : data.total_it_concentration ?? 0}%
              </span>
              <span className="rav-sector-kpi-sub">IPS Limit ≤30%</span>
            </div>
            <div className="rav-sector-kpi">
              <span className="rav-sector-kpi-label">Funds Analyzed</span>
              <span className="rav-sector-kpi-value">{(data.sector_concentration || []).length}</span>
              <span className="rav-sector-kpi-sub">Equity holdings</span>
            </div>
            <div className="rav-sector-kpi">
              <span className="rav-sector-kpi-label">Highest Exposure</span>
              <span className="rav-sector-kpi-value negative">
                {(data.sector_concentration || [])[0]?.it_pct || 'N/A'}
              </span>
              <span className="rav-sector-kpi-sub">{(data.sector_concentration || [])[0]?.fund || '—'}</span>
            </div>
          </div>
          {(data.sector_concentration || []).length > 0 ? (
            <div className="rav-table-wrapper" style={{ marginTop: 'var(--space-lg)' }}>
              <table className="rav-table">
                <thead><tr><th>Fund</th><th>IT %</th><th>Equity Weight</th><th>IT Contribution</th></tr></thead>
                <tbody>
                  {(data.sector_concentration || []).map((r, i) => (
                    <tr key={i}>
                      <td className="rav-ticker">{r.fund}</td>
                      <td className={parseFloat(r.it_pct) > 40 ? 'negative' : parseFloat(r.it_pct) > 25 ? 'warning' : ''}>
                        {r.it_pct || r.it_percentage}
                      </td>
                      <td>{r.eq_weight || r.equity_weight}</td>
                      <td>{r.it_contrib || r.it_contribution}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="rav-empty" style={{ marginTop: 'var(--space-md)' }}>Sector data not available</p>
          )}
          <InsightList items={data.insights?.sector} />
        </Section>

        {/* IPS Dashboard */}
        <Section id="dashboard" icon={<Shield size={18} />} title="IPS Compliance Dashboard"
          badge={breachCount > 0 ? { label: `${breachCount} BREACH`, cls: 'badge-red' } : { label: 'COMPLIANT', cls: 'badge-green' }}
          expanded={expanded.dashboard} onToggle={() => toggle('dashboard')} delay={0.25}>
          <div className="rav-table-wrapper">
            <table className="rav-table">
              <thead><tr><th>Metric</th><th>Current</th><th>Target</th><th>Variance</th><th>Status</th></tr></thead>
              <tbody>
                {(data.risk_dashboard || []).map((r, i) => (
                  <tr key={i}>
                    <td>{r.metric}</td>
                    <td>{r.current}</td>
                    <td>{r.target}</td>
                    <td className={r.variance && r.variance.startsWith('+') ? 'negative' : ''}>{r.variance}</td>
                    <td><span className={`rav-action-badge ${getActionClass(r.action)}`}>{r.action}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <InsightList items={data.insights?.dashboard} />
        </Section>

        {/* Risk Summary */}
        <Section id="summary" icon={<AlertTriangle size={18} />} title="Risk Summary"
          expanded={expanded.summary} onToggle={() => toggle('summary')} delay={0.3}>
          {riskSummary.length === 0 ? (
            <p className="rav-empty">No risk summary available</p>
          ) : (
            <div className="rav-summary-list">
              {riskSummary.map((item, i) => (
                <div key={i} className={`rav-summary-item rav-summary-${item.type}`}>
                  <span className={`rav-summary-dot ${item.type === 'risk' ? 'dot-red' : 'dot-blue'}`} />
                  <div>
                    <span className="rav-summary-title">{item.title}</span>
                    <span className="rav-summary-detail">{item.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

      </div>
    </div>
  );
};

export default RiskAnalysisView;
