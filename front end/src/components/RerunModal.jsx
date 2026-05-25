import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, RefreshCw, AlertCircle, TrendingUp, Activity, BarChart2, TrendingDown } from 'lucide-react';
import clientDataService from '../services/clientDataService';
import './RerunModal.css';

const RerunModal = ({ isOpen, onClose, onSubmit, clientId }) => {
  const [includeSentiment, setIncludeSentiment] = useState(true);
  const [fundList, setFundList] = useState([]); // null = load error, [] = empty/loading, [...] = loaded
  const [excludedFunds, setExcludedFunds] = useState([]);
  const [advisorPrompt, setAdvisorPrompt] = useState('');
  const [stressTestEnabled, setStressTestEnabled] = useState(false);
  const [stressScenario, setStressScenario] = useState('Moderate Uptrend');

  const STRESS_SCENARIOS = [
    { id: 'Moderate Uptrend',    icon: <TrendingUp size={16} />,   desc: 'Steady growth, low volatility' },
    { id: 'Volatile Mixed',      icon: <Activity size={16} />,     desc: 'High swings, mixed signals' },
    { id: 'Stabilizing Market',  icon: <BarChart2 size={16} />,    desc: 'Recovery phase, cautious' },
    { id: 'Downtrending Market', icon: <TrendingDown size={16} />, desc: 'Bearish conditions, defensive' },
  ];
  const [loading, setLoading] = useState(false);
  const [loadingFunds, setLoadingFunds] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoadingFunds(true);
      fetchFundUniverse();
    }
  }, [isOpen]);

  const fetchFundUniverse = async () => {
    try {
      // First try the in-memory cache slice (instant if ClientDetail already loaded)
      let rebalSlice = clientDataService._sliceFromFull(clientId, 'rebalancing_action');

      // If not cached yet, wait for the in-flight full-analysis (ClientDetail may still be loading)
      if (!rebalSlice.success) {
        const waited = await clientDataService._waitForFullThenSlice(clientId, 'rebalancing_action');
        if (waited) rebalSlice = { success: true, data: waited };
      }

      if (rebalSlice.success) {
        const optionBTrades = rebalSlice.data?.data?.options?.option_b?.trade_recommendations || [];
        const buyTrades = optionBTrades.filter(t => t.action === 'Buy' || t.action === 'buy');
        if (buyTrades.length > 0) {
          setFundList(buyTrades.map(t => ({
            fund_id: t.ticker,
            name: t.fund || t.ticker,
            category: t.type || 'ETF',
            expense_ratio: t.expense_ratio || null,
          })));
          return;
        }
      }

      // Fallback: fetch from DynamoDB FundMaster via backend
      const universeData = await clientDataService.getFundUniverse();
      if (universeData?.data?.length > 0) {
        setFundList(universeData.data.map(f => ({
          fund_id: f.fund_id,
          name: f.name || f.fund_id,
          category: f.asset_class || f.category || 'N/A',
          expense_ratio: f.expense_ratio || null,
        })));
      } else {
        setFundList([]);
      }
    } catch (error) {
      console.error('[RerunModal] Error fetching fund universe:', error);
      setFundList(null); // null = error state, distinct from [] = genuinely empty
    } finally {
      setLoadingFunds(false);
    }
  };

  const handleFundToggle = (fundId) => {
    setExcludedFunds(prev =>
      prev.includes(fundId) ? prev.filter(id => id !== fundId) : [...prev, fundId]
    );
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onSubmit({
        include_sentiment: includeSentiment,
        include_fund_universe: true,
        user_prompt: advisorPrompt.trim(),
        excluded_funds: excludedFunds,
        stress_test_scenario: stressTestEnabled ? stressScenario : null,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setIncludeSentiment(true);
    setExcludedFunds([]);
    setAdvisorPrompt('');
    setStressTestEnabled(false);
    setStressScenario('Moderate Uptrend');
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-shell modal-shell--wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header__left">
            <div className="modal-header__icon"><RefreshCw size={15} /></div>
            <div className="modal-header__titles">
              <span className="modal-header__title">Configure Analysis Rerun</span>
              <span className="modal-header__subtitle">Customise what the AI agent analyses</span>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="modal-body">
          {/* Section 1: Sentiment Analysis Toggle */}
          <div className="rerun-section">
            <div className="rerun-section-header">
              <h3 className="rerun-section-title">Sentiment Analysis</h3>
              <p className="rerun-section-desc">Include market sentiment data from recent news</p>
            </div>
            <div className="rerun-toggle-container">
              <label className="rerun-toggle">
                <input
                  type="checkbox"
                  checked={includeSentiment}
                  onChange={(e) => setIncludeSentiment(e.target.checked)}
                />
                <span className="rerun-toggle-slider"></span>
              </label>
              <span className="rerun-toggle-label">{includeSentiment ? 'Enabled' : 'Disabled'}</span>
            </div>
          </div>

          {/* Section 2: Fund Universe Table */}
          <div className="rerun-section">
            <div className="rerun-section-header">
              <h3 className="rerun-section-title">Fund Universe Selection</h3>
              <p className="rerun-section-desc">
                Select funds to exclude from analysis recommendations
              </p>
            </div>
            
            {loadingFunds ? (
              <div className="rerun-funds-loading">
                <div className="rerun-spinner"></div>
                <span>Loading fund universe...</span>
              </div>
            ) : fundList === null ? (
              <div className="rerun-funds-empty">
                <AlertCircle size={24} />
                <p>Could not load fund universe — backend may be unavailable</p>
              </div>
            ) : fundList.length > 0 ? (
              <div className="rerun-funds-table-container">
                <table className="rerun-funds-table">
                  <thead>
                    <tr>
                      <th>Include</th>
                      <th>Fund ID</th>
                      <th>Fund Name</th>
                      <th>Category</th>
                      <th>Expense Ratio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fundList.map((fund) => (
                      <tr key={fund.fund_id} className={excludedFunds.includes(fund.fund_id) ? 'excluded' : ''}>
                        <td>
                          <input
                            type="checkbox"
                            checked={!excludedFunds.includes(fund.fund_id)}
                            onChange={() => handleFundToggle(fund.fund_id)}
                            className="rerun-checkbox"
                          />
                        </td>
                        <td className="fund-id-cell">{fund.fund_id}</td>
                        <td className="fund-name-cell">{fund.name}</td>
                        <td>{fund.category || 'N/A'}</td>
                        <td>{fund.expense_ratio ? `${fund.expense_ratio}%` : 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rerun-funds-empty">
                <AlertCircle size={24} />
                <p>No alternative funds available in universe</p>
              </div>
            )}
          </div>

          {/* Section 3: Stress Testing */}
          <div className="rerun-section">
            <div className="rerun-section-header" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 className="rerun-section-title">Stress Testing</h3>
                <p className="rerun-section-desc">Simulate portfolio performance under different market conditions</p>
              </div>
              <div className="rerun-toggle-container" style={{ padding: 0 }}>
                <label className="rerun-toggle">
                  <input
                    type="checkbox"
                    checked={stressTestEnabled}
                    onChange={(e) => setStressTestEnabled(e.target.checked)}
                  />
                  <span className="rerun-toggle-slider"></span>
                </label>
                <span className="rerun-toggle-label">{stressTestEnabled ? 'Enabled' : 'Disabled'}</span>
              </div>
            </div>
            {stressTestEnabled && (
              <div className="rerun-stress-grid">
                {STRESS_SCENARIOS.map((s) => (
                  <div
                    key={s.id}
                    className={`rerun-stress-card${stressScenario === s.id ? ' rerun-stress-card--active' : ''}`}
                    onClick={() => setStressScenario(s.id)}
                  >
                    <div className="rerun-stress-card__icon">{s.icon}</div>
                    <span className="rerun-stress-card__title">{s.id}</span>
                    <span className="rerun-stress-card__desc">{s.desc}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 4: Advisor Prompt */}
          <div className="rerun-section">
            <div className="rerun-section-header">
              <h3 className="rerun-section-title">Advisor Instructions</h3>
              <p className="rerun-section-desc">
                Provide specific guidance or constraints for the analysis
              </p>
            </div>
            <textarea
              className="rerun-prompt-textarea"
              placeholder="Example: Focus on tax-efficient strategies, prioritize low-volatility funds, consider client's upcoming retirement in 3 years..."
              value={advisorPrompt}
              onChange={(e) => setAdvisorPrompt(e.target.value)}
              rows={4}
            />
            <div className="rerun-prompt-hint">
              Optional: Add context about client goals, risk tolerance changes, or specific requirements
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="modal-btn modal-btn--danger" onClick={handleReset} disabled={loading}>Reset</button>
          <div className="modal-footer__right">
            <button className="modal-btn modal-btn--ghost" onClick={onClose} disabled={loading}>Cancel</button>
            <button className="modal-btn modal-btn--primary" onClick={handleSubmit} disabled={loading}>
              {loading ? (<><div className="rerun-btn-spinner"></div>Running...</>) : (<><RefreshCw size={14} />Run Analysis</>)}
            </button>
          </div>
        </div>

      </div>
    </div>
  , document.body);
};

export default RerunModal;
