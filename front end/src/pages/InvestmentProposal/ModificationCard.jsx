import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Sliders, TrendingUp, AlertCircle } from 'lucide-react';
import './DynamicCards.css';

const ModificationCard = ({ data, onClose, onApply }) => {
  const [allocation, setAllocation] = useState(data.proposed);

  const handleSliderChange = (key, value) => {
    const newAllocation = { ...allocation, [key]: parseInt(value) };
    const total = Object.values(newAllocation).reduce((a, b) => a + b, 0);
    
    if (total <= 100) {
      setAllocation(newAllocation);
    }
  };

  const total = Object.values(allocation).reduce((a, b) => a + b, 0);
  const isValid = total === 100;

  return (
    <motion.div
      className="dynamic-card modification-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="card-header">
        <div className="card-title">
          <Sliders size={22} />
          <h3>Portfolio Modification</h3>
        </div>
        <button className="card-close" onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      <div className="card-body">
        <div className="modification-reason">
          <AlertCircle size={18} />
          <p>{data.reason}</p>
        </div>

        <div className="allocation-comparison">
          <div className="allocation-column">
            <h4>Current Allocation</h4>
            <div className="allocation-bars">
              <div className="alloc-item">
                <label>Equity</label>
                <div className="alloc-bar">
                  <div className="alloc-fill" style={{ width: `${data.current.equity}%` }}></div>
                  <span>{data.current.equity}%</span>
                </div>
              </div>
              <div className="alloc-item">
                <label>Bonds</label>
                <div className="alloc-bar">
                  <div className="alloc-fill bonds" style={{ width: `${data.current.bonds}%` }}></div>
                  <span>{data.current.bonds}%</span>
                </div>
              </div>
              <div className="alloc-item">
                <label>Cash</label>
                <div className="alloc-bar">
                  <div className="alloc-fill cash" style={{ width: `${data.current.cash}%` }}></div>
                  <span>{data.current.cash}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="allocation-column">
            <h4>Proposed Allocation</h4>
            <div className="allocation-sliders">
              <div className="slider-item">
                <label>Equity: {allocation.equity}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={allocation.equity}
                  onChange={(e) => handleSliderChange('equity', e.target.value)}
                  className="slider equity-slider"
                />
              </div>
              <div className="slider-item">
                <label>Bonds: {allocation.bonds}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={allocation.bonds}
                  onChange={(e) => handleSliderChange('bonds', e.target.value)}
                  className="slider bonds-slider"
                />
              </div>
              <div className="slider-item">
                <label>Cash: {allocation.cash}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={allocation.cash}
                  onChange={(e) => handleSliderChange('cash', e.target.value)}
                  className="slider cash-slider"
                />
              </div>
            </div>
            <div className={`total-indicator ${isValid ? 'valid' : 'invalid'}`}>
              Total: {total}% {!isValid && '(Must equal 100%)'}
            </div>
          </div>
        </div>

        <div className="impact-preview">
          <h4><TrendingUp size={18} /> Expected Impact</h4>
          <div className="impact-grid">
            <div className="impact-item">
              <label>Expected Return</label>
              <span className="impact-value positive">{data.impact.expectedReturn}</span>
            </div>
            <div className="impact-item">
              <label>Risk Change</label>
              <span className="impact-value">{data.impact.riskChange}</span>
            </div>
            <div className="impact-item">
              <label>Volatility Change</label>
              <span className="impact-value">{data.impact.volatilityChange}</span>
            </div>
          </div>
        </div>

        <div className="changes-list">
          <h4>Changes to Apply:</h4>
          <ul>
            {data.changes.map((change, idx) => (
              <li key={idx}>{change}</li>
            ))}
          </ul>
        </div>

        <div className="card-actions">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={() => onApply(allocation)}
            disabled={!isValid}
          >
            Apply Changes
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ModificationCard;
