import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, AlertTriangle, TrendingDown, RefreshCw, FileText, Users, DollarSign } from 'lucide-react';
import './DashboardHeader.css';

const DashboardHeader = ({ 
  metrics, 
  morningNotes, 
  priorityAlerts,
  onExpand 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  // Cycling messages from priority alerts
  const messages = priorityAlerts || [
    { text: "3 clients need immediate attention", icon: AlertTriangle, color: "critical" },
    { text: "Market volatility in energy sector", icon: TrendingDown, color: "warning" },
    { text: "12 portfolios require rebalancing", icon: RefreshCw, color: "info" },
    { text: "Morning notes updated - 3 new insights", icon: FileText, color: "success" }
  ];

  // Auto-cycle messages every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [messages.length]);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
    if (onExpand) onExpand(!isExpanded);
  };

  const currentMessage = messages[currentMessageIndex];
  const MessageIcon = currentMessage.icon;

  return (
    <div className={`dashboard-header ${isExpanded ? 'dashboard-header--expanded' : ''}`}>
      {/* Collapsed State */}
      <div className="dashboard-header__collapsed">
        <div className="dashboard-header__stats">
          <div className="header-stat">
            <Users size={16} />
            <span className="header-stat__label">Clients</span>
            <span className="header-stat__value">{metrics?.totalClients || 253}</span>
          </div>
          <div className="header-stat-divider" />
          <div className="header-stat">
            <DollarSign size={16} />
            <span className="header-stat__label">AUM</span>
            <span className="header-stat__value">${(metrics?.totalAUM / 1000000).toFixed(1)}M</span>
          </div>
          <div className="header-stat-divider" />
          <div className="header-stat">
            <AlertTriangle size={16} />
            <span className="header-stat__label">Critical</span>
            <span className="header-stat__value header-stat__value--critical">{metrics?.criticalPriority || 3}</span>
          </div>
        </div>

        <div className="dashboard-header__cycling-message">
          <div 
            className={`cycling-message cycling-message--${currentMessage.color}`}
            key={currentMessageIndex}
          >
            <MessageIcon size={16} />
            <span>{currentMessage.text}</span>
          </div>
        </div>

        <button 
          className="dashboard-header__toggle"
          onClick={handleToggle}
          aria-label={isExpanded ? "Collapse header" : "Expand header"}
        >
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>

      {/* Expanded State - Overlay Dropdown */}
      {isExpanded && (
        <div className="dashboard-header__expanded-overlay">
          <div className="dashboard-header__expanded-content">
            <div className="expanded-section">
              <h3 className="expanded-section__title">
                <FileText size={18} />
                Morning Notes
              </h3>
              <div className="expanded-section__content">
                {morningNotes ? (
                  <div className="morning-notes-preview">
                    <p>{morningNotes.summary || "Market insights loading..."}</p>
                  </div>
                ) : (
                  <p className="expanded-section__empty">Morning notes not available</p>
                )}
              </div>
            </div>

            <div className="expanded-section">
              <h3 className="expanded-section__title">
                <AlertTriangle size={18} />
                Priority Alerts
              </h3>
              <div className="expanded-section__content">
                <div className="priority-alerts-list">
                  {messages.map((msg, idx) => {
                    const Icon = msg.icon;
                    return (
                      <div key={idx} className={`priority-alert priority-alert--${msg.color}`}>
                        <Icon size={14} />
                        <span>{msg.text}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="expanded-section">
              <h3 className="expanded-section__title">Quick Actions</h3>
              <div className="expanded-section__content">
                <div className="quick-actions-grid">
                  <button className="quick-action-btn">View Critical Clients</button>
                  <button className="quick-action-btn">Review Rebalancing</button>
                  <button className="quick-action-btn">Check Morning Notes</button>
                  <button className="quick-action-btn">View All Alerts</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardHeader;
