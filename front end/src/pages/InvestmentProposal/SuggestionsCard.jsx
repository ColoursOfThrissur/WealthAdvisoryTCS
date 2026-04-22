import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lightbulb, ChevronDown, ChevronUp, Check } from 'lucide-react';
import './DynamicCards.css';

const SuggestionsCard = ({ data, onClose, onApply }) => {
  const [expandedSuggestion, setExpandedSuggestion] = useState(null);
  const [appliedSuggestions, setAppliedSuggestions] = useState([]);

  const toggleSuggestion = (id) => {
    setExpandedSuggestion(expandedSuggestion === id ? null : id);
  };

  const handleApply = (suggestion) => {
    setAppliedSuggestions([...appliedSuggestions, suggestion.id]);
    onApply(suggestion);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'priority-high';
      case 'Medium': return 'priority-medium';
      case 'Low': return 'priority-low';
      default: return '';
    }
  };

  return (
    <motion.div
      className="dynamic-card suggestions-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="card-header">
        <div className="card-title">
          <Lightbulb size={22} />
          <h3>Optimization Suggestions</h3>
        </div>
        <button className="card-close" onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      <div className="card-body">
        <p className="suggestions-intro">
          Based on client profile analysis, here are {data.suggestions.length} recommendations to optimize the portfolio:
        </p>

        <div className="suggestions-list">
          {data.suggestions.map((suggestion) => (
            <motion.div
              key={suggestion.id}
              className={`suggestion-item ${appliedSuggestions.includes(suggestion.id) ? 'applied' : ''}`}
              layout
            >
              <div className="suggestion-header" onClick={() => toggleSuggestion(suggestion.id)}>
                <div className="suggestion-title-row">
                  <span className={`priority-badge ${getPriorityColor(suggestion.priority)}`}>
                    {suggestion.priority}
                  </span>
                  <h4>{suggestion.title}</h4>
                  {appliedSuggestions.includes(suggestion.id) && (
                    <span className="applied-badge">
                      <Check size={14} /> Applied
                    </span>
                  )}
                </div>
                <button className="expand-btn">
                  {expandedSuggestion === suggestion.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
              </div>

              <AnimatePresence>
                {expandedSuggestion === suggestion.id && (
                  <motion.div
                    className="suggestion-details"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    <div className="suggestion-section">
                      <label>Rationale:</label>
                      <p>{suggestion.reason}</p>
                    </div>

                    <div className="suggestion-section">
                      <label>Proposed Changes:</label>
                      <ul>
                        {suggestion.changes.map((change, idx) => (
                          <li key={idx}>{change}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="suggestion-section">
                      <label>Expected Impact:</label>
                      <div className="impact-details">
                        {Object.entries(suggestion.expectedImpact).map(([key, value]) => (
                          <div key={key} className="impact-row">
                            <span className="impact-label">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                            <span className="impact-value">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="suggestion-section">
                      <label>Based On:</label>
                      <div className="based-on-tags">
                        {suggestion.basedOn.map((factor, idx) => (
                          <span key={idx} className="factor-tag">{factor}</span>
                        ))}
                      </div>
                    </div>

                    {!appliedSuggestions.includes(suggestion.id) && (
                      <button
                        className="btn-apply-suggestion"
                        onClick={() => handleApply(suggestion)}
                      >
                        Apply This Suggestion
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default SuggestionsCard;
