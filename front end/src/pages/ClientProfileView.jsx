import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Shield, TrendingUp, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import clientDataService from '../services/clientDataService';
import './ClientProfileView.css';

const ClientProfileView = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const response = await clientDataService.getClientDetail(clientId);
        const d = response.data;

        const client = d.client || {};
        const fundDrift = d.fund_drift || [];
        const fumStr = client.fum || "$0";
        const totalAum = parseFloat(fumStr.replace(/[$,]/g, '')) || 0;

        // Pull risk metrics from full-analysis cache to enrich holdings
        const fullSlice = clientDataService._sliceFromFull(clientId, 'risk_analysis');
        const riskData = fullSlice.success ? (fullSlice.data?.data || {}) : {};
        const volatilityMap = {};
        const betaMap = {};
        (riskData.volatility || []).forEach(v => { volatilityMap[v.fund] = v; });
        (riskData.beta_exposure || []).forEach(b => { betaMap[b.fund] = b; });

        const holdings = fundDrift.filter(f => f.ticker !== 'CASH').map(f => ({
          ticker: f.ticker,
          name: f.ticker,
          asset_class: '',
          weight: f.actual,
          target: f.target,
          drift: f.drift,
          std_dev: volatilityMap[f.ticker]?.std_dev || '-',
          var_95: volatilityMap[f.ticker]?.var_95 || '-',
          beta: betaMap[f.ticker]?.beta ?? '-',
          risk_contribution: volatilityMap[f.ticker]?.risk_contrib || '-',
        }));

        // Also enrich fund names from investment_details
        const invSlice = clientDataService._sliceFromFull(clientId, 'investment_details');
        if (invSlice.success) {
          const nameMap = {};
          (invSlice.data?.data?.current_holdings || []).forEach(h => { nameMap[h.ticker] = h.name; });
          holdings.forEach(h => { if (nameMap[h.ticker]) h.name = nameMap[h.ticker]; });
        }

        setData({
          client_name: client.name || 'Unknown Client',
          total_aum: totalAum,
          risk_profile: client.risk_tolerance || 'Unknown',
          action_rationale: d.recommendations?.recommended_option?.description?.[0] || 'No action required',
          holdings,
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [clientId]);

  if (loading) {
    return (
      <div className="cpv-page">
        <div className="cpv-header">
          <h1 className="cpv-title">Client Portfolio</h1>
        </div>
        <div className="cpv-loading">
          <div className="cpv-loading-spinner"></div>
          <p className="cpv-loading-text">Loading client portfolio...</p>
          <p className="cpv-loading-subtext">Fetching holdings and risk metrics</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="cpv-page">
        <div className="cpv-header">
          <h1 className="cpv-title">Client Portfolio</h1>
        </div>
        <div className="cpv-error">
          <div className="cpv-error-icon"><AlertTriangle size={40} style={{ opacity: 0.4 }} /></div>
          <p className="cpv-error-text">Unable to load portfolio</p>
          <p className="cpv-error-detail">{error}</p>
          <button className="cpv-error-retry" onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }
  if (!data) return null;

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const sortedHoldings = [...data.holdings].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const aVal = a[sortConfig.key];
    const bVal = b[sortConfig.key];
    if (typeof aVal === 'string') return sortConfig.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    return sortConfig.direction === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
  });

  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) return null;
    return sortConfig.direction === 'asc' ? ' ▲' : ' ▼';
  };

  return (
    <div className="cpv-page">
      <div className="cpv-header">
        <h1 className="cpv-title">Client Portfolio — {data.client_name}</h1>
      </div>

      <div className="cpv-content">
        {/* KPI Cards */}
        <div className="cpv-kpi-row">
          <div className="cpv-kpi">
            <span className="cpv-kpi-label">Total AUM</span>
            <span className="cpv-kpi-value">${data.total_aum.toLocaleString()}</span>
          </div>
          <div className="cpv-kpi">
            <span className="cpv-kpi-label">Risk Profile</span>
            <span className="cpv-kpi-value">{data.risk_profile}</span>
          </div>
          <div className="cpv-kpi">
            <span className="cpv-kpi-label">Action Rationale</span>
            <span className="cpv-kpi-value" style={{ fontSize: '0.9rem' }}>{data.action_rationale}</span>
          </div>
        </div>

        {/* Holdings Table */}
        <motion.section
          className="cpv-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="cpv-section-header">
            <TrendingUp size={20} />
            <h2>Live Portfolio Snapshot</h2>
          </div>
          <div className="cpv-table-container">
            <table className="cpv-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('ticker')}>Ticker<SortIcon column="ticker" /></th>
                  <th onClick={() => handleSort('name')}>Fund<SortIcon column="name" /></th>
                  <th onClick={() => handleSort('weight')}>Weight<SortIcon column="weight" /></th>
                  <th onClick={() => handleSort('target')}>Target<SortIcon column="target" /></th>
                  <th onClick={() => handleSort('drift')}>Drift<SortIcon column="drift" /></th>
                  <th onClick={() => handleSort('std_dev')}>Std Dev<SortIcon column="std_dev" /></th>
                  <th onClick={() => handleSort('var_95')}>VaR 95%<SortIcon column="var_95" /></th>
                  <th onClick={() => handleSort('beta')}>Beta<SortIcon column="beta" /></th>
                  <th onClick={() => handleSort('risk_contribution')}>Risk Contrib<SortIcon column="risk_contribution" /></th>
                </tr>
              </thead>
              <tbody>
                {sortedHoldings.map((h) => (
                  <motion.tr
                    key={h.ticker}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    whileHover={{ backgroundColor: 'var(--color-interactive-hover-bg)' }}
                  >
                    <td className="cpv-ticker">{h.ticker}</td>
                    <td>{h.name}</td>
                    <td>{h.weight.toFixed(1)}%</td>
                    <td>{h.target.toFixed(1)}%</td>
                    <td className={h.drift >= 0 ? 'positive' : 'negative'}>
                      {h.drift >= 0 ? '+' : ''}{h.drift.toFixed(2)}%
                    </td>
                    <td>{h.std_dev}</td>
                    <td>{h.var_95}</td>
                    <td>{h.beta}</td>
                    <td>{h.risk_contribution}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default ClientProfileView;
