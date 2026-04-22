import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, TrendingUp, Shield, DollarSign, BarChart3 } from 'lucide-react';
import './DynamicCards.css';

const PortfolioComparisonCard = ({ data, onClose, onSelect }) => {
  const portfolios = Array.isArray(data) ? data : (data?.portfolios || []);
  const [selectedPortfolios, setSelectedPortfolios] = useState(
    portfolios.slice(0, 2).map(p => p.id)
  );

  const togglePortfolio = (id) => {
    if (selectedPortfolios.includes(id)) {
      if (selectedPortfolios.length > 1) {
        setSelectedPortfolios(selectedPortfolios.filter(p => p !== id));
      }
    } else {
      if (selectedPortfolios.length < 3) {
        setSelectedPortfolios([...selectedPortfolios, id]);
      }
    }
  };

  const comparePortfolios = portfolios.filter(p => selectedPortfolios.includes(p.id));

  return (
    <motion.div
      className="dynamic-card comparison-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="card-header">
        <div className="card-title">
          <BarChart3 size={22} />
          <h3>Portfolio Comparison</h3>
        </div>
        <button className="card-close" onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      <div className="card-body">
        <div className="portfolio-selector">
          <label>Select portfolios to compare (max 3):</label>
          <div className="portfolio-chips">
            {portfolios.map(portfolio => (
              <button
                key={portfolio.id}
                className={`portfolio-chip ${selectedPortfolios.includes(portfolio.id) ? 'active' : ''}`}
                onClick={() => togglePortfolio(portfolio.id)}
              >
                {portfolio.name}
              </button>
            ))}
          </div>
        </div>

        <div className="comparison-table">
          <table>
            <thead>
              <tr>
                <th>Metric</th>
                {comparePortfolios.map(p => (
                  <th key={p.id}>{p.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><Shield size={16} /> Risk Level</td>
                {comparePortfolios.map(p => (
                  <td key={p.id} className="risk-cell">{p.risk}</td>
                ))}
              </tr>
              <tr>
                <td><TrendingUp size={16} /> 1-Year Return</td>
                {comparePortfolios.map(p => (
                  <td key={p.id} className="return-cell">{p.returns.oneYear}%</td>
                ))}
              </tr>
              <tr>
                <td><TrendingUp size={16} /> 3-Year Return</td>
                {comparePortfolios.map(p => (
                  <td key={p.id} className="return-cell">{p.returns.threeYear}%</td>
                ))}
              </tr>
              <tr>
                <td><DollarSign size={16} /> Expense Ratio</td>
                {comparePortfolios.map(p => (
                  <td key={p.id}>{p.fees}%</td>
                ))}
              </tr>
              <tr>
                <td>Volatility</td>
                {comparePortfolios.map(p => (
                  <td key={p.id}>{p.volatility}%</td>
                ))}
              </tr>
              <tr>
                <td>Allocation</td>
                {comparePortfolios.map(p => (
                  <td key={p.id}>
                    <div className="mini-allocation">
                      <span>{p.allocation.equity}% Equity</span>
                      <span>{p.allocation.bonds}% Bonds</span>
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        <div className="card-actions">
          {comparePortfolios.map(p => (
            <button
              key={p.id}
              className="btn-select-portfolio"
              onClick={() => onSelect(p)}
            >
              Select {p.name}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default PortfolioComparisonCard;
