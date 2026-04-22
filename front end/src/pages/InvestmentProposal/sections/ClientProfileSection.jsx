import React from 'react';
import { User, ChevronDown, ChevronUp } from 'lucide-react';

const ClientProfileSection = ({ data, isExpanded, onToggle }) => {
  return (
    <section className="ip-section">
      <div className="section-header" onClick={onToggle}>
        <User size={20} />
        <h2>Client Profile</h2>
        {isExpanded ? <ChevronUp size={20} className="ip-chevron-icon" /> : <ChevronDown size={20} className="ip-chevron-icon" />}
      </div>
      {isExpanded && (
        <div className="profile-grid">
          <div className="profile-item">
            <label>Name</label>
            <p>{data.name}</p>
          </div>
          <div className="profile-item">
            <label>Net Worth</label>
            <p>${data.net_worth.toLocaleString()}</p>
          </div>
          <div className="profile-item">
            <label>Annual Income</label>
            <p>${data.annual_income.toLocaleString()}</p>
          </div>
          <div className="profile-item">
            <label>Risk Tolerance</label>
            <p>{data.risk_tolerance}</p>
          </div>
        </div>
      )}
    </section>
  );
};

export default ClientProfileSection;
