import { Calendar, DollarSign, AlertTriangle, TrendingUp, User, CheckCircle } from 'lucide-react';
import './MeetingPrepSection.css';

const MeetingPrepSection = ({ data }) => {
  if (!data) return null;

  return (
    <div className="meeting-prep-container">
      {/* Client Header */}
      <div className="meeting-prep-header">
        <div className="client-info-card">
          <User size={24} className="header-icon" />
          <div className="client-details">
            <h2>{data.client_name}</h2>
            <div className="client-meta">
              <span>{data.account_profile?.account_number}</span>
              <span className="separator">•</span>
              <span>{data.account_profile?.segment}</span>
              <span className="separator">•</span>
              <span>{data.account_profile?.location}</span>
            </div>
          </div>
          <div className="aum-badge">
            <DollarSign size={20} />
            <div>
              <div className="aum-label">Total AUM</div>
              <div className="aum-value">${(data.account_profile?.total_aum || 0).toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      {data.key_metrics && (
        <div className="metrics-row">
          {Object.entries(data.key_metrics).map(([key, value]) => (
            <div key={key} className="metric-card-small">
              <div className="metric-label-small">{key.replace(/_/g, ' ')}</div>
              <div className="metric-value-small">{value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Upcoming Meetings */}
      {data.upcoming_meetings && data.upcoming_meetings.length > 0 && (
        <div className="meeting-section-card">
          <div className="card-header">
            <Calendar size={20} />
            <h3>Upcoming Meetings</h3>
          </div>
          <div className="card-content">
            {data.upcoming_meetings.map((meeting, idx) => (
              <div key={idx} className="meeting-item">
                <div className="meeting-date-time">
                  <div className="meeting-date">{meeting.date}</div>
                  <div className="meeting-time">{meeting.time}</div>
                </div>
                <div className="meeting-details">
                  <div className="meeting-purpose">{meeting.purpose}</div>
                  <div className="meeting-participants">
                    <strong>Participants:</strong> {meeting.participants}
                  </div>
                  <div className="meeting-objectives">
                    <strong>Objectives:</strong> {meeting.objectives}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Items */}
      {data.action_items && data.action_items.length > 0 && (
        <div className="meeting-section-card">
          <div className="card-header">
            <CheckCircle size={20} />
            <h3>Action Items</h3>
          </div>
          <div className="card-content">
            <div className="action-items-list">
              {data.action_items.map((item, idx) => (
                <div key={idx} className={`action-item priority-${item.priority.toLowerCase()}`}>
                  <div className="action-priority-badge">{item.priority}</div>
                  <div className="action-content">
                    <div className="action-item-text">{item.item}</div>
                    <div className="action-due-date">Due: {item.due_date}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Risks & Opportunities */}
      {data.risks_opportunities && data.risks_opportunities.length > 0 && (
        <div className="meeting-section-card">
          <div className="card-header">
            <TrendingUp size={20} />
            <h3>Risks & Opportunities</h3>
          </div>
          <div className="card-content">
            <div className="risks-opportunities-grid">
              {data.risks_opportunities.map((item, idx) => (
                <div key={idx} className={`risk-opp-item ${item.type.toLowerCase()}`}>
                  <div className="risk-opp-icon">
                    {item.type === 'Risk' ? <AlertTriangle size={18} /> : <TrendingUp size={18} />}
                  </div>
                  <div className="risk-opp-content">
                    <div className="risk-opp-type">{item.type}</div>
                    <div className="risk-opp-description">{item.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Client News */}
      {data.client_news && data.client_news.length > 0 && (
        <div className="meeting-section-card">
          <div className="card-header">
            <User size={20} />
            <h3>Client News & Updates</h3>
          </div>
          <div className="card-content">
            <ul className="client-news-list">
              {data.client_news.map((news, idx) => (
                <li key={idx}>{news}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingPrepSection;
