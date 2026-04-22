import React from 'react';
import { PieChart, ChevronDown, ChevronUp } from 'lucide-react';
import { motion } from 'framer-motion';

const PortfolioSection = ({ data, selectedRisk, onRiskChange, isExpanded, onToggle }) => {
  const portfolios = [
    { risk_level: 'Conservative', allocation: { stocks: 25, bonds: 65, cash: 10 }, expected_return: '4-6', risk_score: 3 },
    { risk_level: 'Moderate', allocation: { stocks: 50, bonds: 25, cash: 5 }, expected_return: '6-8', risk_score: 5 }
  ];

  return (
    <section className="ip-section">
      <div className="section-header" onClick={onToggle}>
        <PieChart size={20} />
        <h2>Portfolio Selection</h2>
        {isExpanded ? <ChevronUp size={20} className="ip-chevron-icon" /> : <ChevronDown size={20} className="ip-chevron-icon" />}
      </div>
      
      {isExpanded && (
        <div className="portfolio-grid">
          {portfolios.map((portfolio) => (
            <motion.div
              key={portfolio.risk_level}
              className={`portfolio-card ${selectedRisk === portfolio.risk_level ? 'selected' : ''}`}
              onClick={() => onRiskChange(portfolio.risk_level)}
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
            >
              <h4>{portfolio.risk_level}</h4>
              <div className="allocation-breakdown">
                <div className="allocation-item">
                  <span>Stocks</span>
                  <span>{portfolio.allocation.stocks}%</span>
                </div>
                <div className="allocation-item">
                  <span>Bonds</span>
                  <span>{portfolio.allocation.bonds}%</span>
                </div>
                <div className="allocation-item">
                  <span>Cash</span>
                  <span>{portfolio.allocation.cash}%</span>
                </div>
              </div>
              <div className="portfolio-metrics">
                <div className="metric">
                  <span className="metric-label">Expected Return</span>
                  <span className="metric-value">{portfolio.expected_return}%</span>
                </div>
                <div className="metric">
                  <span className="metric-label">Risk Level</span>
                  <span className="metric-value">{portfolio.risk_score}/10</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
};

export default PortfolioSection;
