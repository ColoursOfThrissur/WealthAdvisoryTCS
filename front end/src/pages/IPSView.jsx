import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { motion } from 'framer-motion';
import clientDataService from '../services/clientDataService';
import './IPSView.css';

const IPSView = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [ipsData, setIpsData] = useState(null);
  const [ipsExpanded, setIpsExpanded] = useState({
    objectives: true,
    strategy: true,
    mandates: true,
    constraints: true
  });

  useEffect(() => {
    // Build IPS from full-analysis cache — risk_dashboard has targets, asset_drift has bands
    const riskSlice = clientDataService._sliceFromFull(clientId, 'risk_analysis');
    const detailSlice = clientDataService._sliceFromFull(clientId, 'client_detail');
    if (!riskSlice.success) return;

    const risk = riskSlice.data?.data || {};
    const detail = detailSlice.success ? (detailSlice.data?.data || {}) : {};

    // Extract targets from asset_drift
    const assetDrift = risk.asset_drift || [];
    const eqRow = assetDrift.find(r => r.class === 'Equity') || {};
    const fiRow = assetDrift.find(r => r.class === 'Fixed Income') || {};
    const cashRow = assetDrift.find(r => r.class === 'Cash') || {};
    const band = eqRow.band || '\u00b15%';
    const thresh = parseFloat(band.replace(/[^0-9.]/g, '')) || 5;

    const eqTarget = eqRow.target || 60;
    const fiTarget = fiRow.target || 35;
    const cashTarget = cashRow.target || 5;
    const maxBeta = risk.target_beta || 0.75;

    setIpsData({
      objectives: [
        `Maintain ${eqTarget}% equity / ${fiTarget}% fixed income / ${cashTarget}% cash allocation`,
        `Rebalance when drift exceeds \u00b1${thresh}% of target`,
        'Minimize tax impact on rebalancing trades',
        `Keep portfolio beta at or below ${maxBeta}`,
        'Preserve capital while achieving moderate growth',
      ],
      strategy: [
        { asset_class: 'Equity', target: eqTarget, range: `${eqTarget - thresh}\u2013${eqTarget + thresh}%`, benchmarks: ['S&P 500', 'MSCI World'] },
        { asset_class: 'Fixed Income', target: fiTarget, range: `${fiTarget - thresh}\u2013${fiTarget + thresh}%`, benchmarks: ['Bloomberg US Agg'] },
        { asset_class: 'Cash', target: cashTarget, range: `${Math.max(0, cashTarget - 2)}\u2013${cashTarget + 2}%`, benchmarks: ['T-Bill 3M'] },
      ],
      mandates: [
        'No single fund to exceed 20% of portfolio',
        'Weighted expense ratio must stay below 1.0%',
        `Portfolio beta target: \u2264${maxBeta}`,
        'IT sector concentration must not exceed 30% of equity',
        'ESG screening applied to equity holdings',
      ],
      constraints: [
        'No leverage or derivatives',
        'No single sector to exceed 30% of equity allocation',
        'Minimum trade size: $1,000',
        'Tax-loss harvesting preferred on sells',
        'All trades require advisor approval',
      ],
    });
  }, [clientId]);

  const toggleIps = (section) => {
    setIpsExpanded(prev => ({ ...prev, [section]: !prev[section] }));
  };

  if (!ipsData) {
    return (
      <div className="ips-page">
        <div className="ips-header">
          <h1 className="ips-title">IPS</h1>
        </div>
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>Loading IPS data...</div>
      </div>
    );
  }

  return (
    <div className="ips-page">
      <div className="ips-header">
        <h1 className="ips-title">IPS</h1>
      </div>

      <div className="ips-content">
        <motion.section
          className="ips-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="ips-section-header">
            <FileText size={20} />
            <h2>Investment Policy Statement (IPS)</h2>
          </div>

          <div className="ips-grid">
            <div className="ips-card">
              <div className="ips-card-header" onClick={() => toggleIps('objectives')}>
                <h3>Objectives</h3>
                {ipsExpanded.objectives ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
              {ipsExpanded.objectives && (
                <ul className="ips-list">
                  {ipsData.objectives.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              )}
            </div>

            <div className="ips-card">
              <div className="ips-card-header" onClick={() => toggleIps('strategy')}>
                <h3>Allocation Strategy</h3>
                {ipsExpanded.strategy ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
              {ipsExpanded.strategy && (
                <table className="ips-table">
                  <thead>
                    <tr>
                      <th>Asset Class</th>
                      <th>Target %</th>
                      <th>Rebalance Band</th>
                      <th>Benchmark Index</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ipsData.strategy.map((row, i) => (
                      <tr key={i}>
                        <td className="ips-asset-class">{row.asset_class}</td>
                        <td>{row.target}%</td>
                        <td>{row.range}</td>
                        <td className="ips-benchmarks">
                          {row.benchmarks.map((b, j) => <div key={j}>{b}</div>)}
                        </td>
                      </tr>
                    ))}
                    <tr className="ips-total-row">
                      <td className="ips-asset-class">TOTAL</td>
                      <td>100%</td>
                      <td></td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>

            <div className="ips-card">
              <div className="ips-card-header" onClick={() => toggleIps('mandates')}>
                <h3>Mandates</h3>
                {ipsExpanded.mandates ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
              {ipsExpanded.mandates && (
                <ul className="ips-list">
                  {ipsData.mandates.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              )}
            </div>

            <div className="ips-card">
              <div className="ips-card-header" onClick={() => toggleIps('constraints')}>
                <h3>Constraints</h3>
                {ipsExpanded.constraints ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
              {ipsExpanded.constraints && (
                <ul className="ips-list">
                  {ipsData.constraints.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              )}
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default IPSView;
