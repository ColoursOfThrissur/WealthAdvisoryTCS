import React, { useState, useEffect } from 'react';
import { X, RefreshCw, AlertCircle } from 'lucide-react';
import './RerunModal.css';

const RerunModal = ({ isOpen, onClose, onSubmit, clientId }) => {
  const [includeSentiment, setIncludeSentiment] = useState(true);
  const [fundList, setFundList] = useState([]);
  const [excludedFunds, setExcludedFunds] = useState([]);
  const [advisorPrompt, setAdvisorPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingFunds, setLoadingFunds] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchFundUniverse();
    }
  }, [isOpen]);

  const fetchFundUniverse = async () => {
    setLoadingFunds(true);
    try {
      // Derive fund universe from option_b trade recommendations in full-analysis cache
      const response = await fetch(`http://localhost:8000/api/action/rebalancing/${clientId}`);
      const data = await response.json();
      if (data.success) {
        const optionBTrades = data.data?.options?.option_b?.trade_recommendations || [];
        const buyTrades = optionBTrades.filter(t => t.action === 'Buy' || t.action === 'buy');
        const funds = buyTrades.map(t => ({
          fund_id: t.ticker,
          name: t.fund,
          category: t.type || 'ETF',
          expense_ratio: t.expense_ratio || null,
        }));
        setFundList(funds);
      }
    } catch (error) {
      console.error('Error fetching fund universe:', error);
      setFundList([]);
    } finally {
      setLoadingFunds(false);
    }
  };

  const handleFundToggle = (fundId) => {
    setExcludedFunds(prev => 
      prev.includes(fundId) 
        ? prev.filter(id => id !== fundId)
        : [...prev, fundId]
    );
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onSubmit({
        include_sentiment: includeSentiment,
        excluded_funds: excludedFunds,
        advisor_prompt: advisorPrompt.trim()
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setIncludeSentiment(true);
    setExcludedFunds([]);
    setAdvisorPrompt('');
  };

  if (!isOpen) return null;

  return (
    <div className="rerun-modal-overlay" onClick={onClose}>
      <div className="rerun-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="rerun-modal-header">
          <div className="rerun-modal-title-group">
            <RefreshCw size={24} className="rerun-modal-icon" />
            <h2 className="rerun-modal-title">Configure Analysis Rerun</h2>
          </div>
          <button className="rerun-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="rerun-modal-body">
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
              <span className="rerun-toggle-label">
                {includeSentiment ? 'Enabled' : 'Disabled'}
              </span>
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

          {/* Section 3: Advisor Prompt */}
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

        <div className="rerun-modal-footer">
          <button 
            className="rerun-btn rerun-btn-reset" 
            onClick={handleReset}
            disabled={loading}
          >
            Reset
          </button>
          <div className="rerun-footer-actions">
            <button 
              className="rerun-btn rerun-btn-cancel" 
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              className="rerun-btn rerun-btn-submit" 
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="rerun-btn-spinner"></div>
                  Running Analysis...
                </>
              ) : (
                <>
                  <RefreshCw size={16} />
                  Run Analysis
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RerunModal;
