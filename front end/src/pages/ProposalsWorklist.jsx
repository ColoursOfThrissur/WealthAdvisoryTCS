import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import { useWorklist } from '../contexts/WorklistContext';
import AIBadge from '../components/AIBadge';
import './ProposalsWorklist.css';

const ProposalsWorklist = () => {
  const navigate = useNavigate();
  const { proposalClients, proposalStats, hoveredClientId, setHoveredClientId, completedActions, setCompletedActions } = useWorklist();
  const [filterPriority, setFilterPriority] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('priority');
  const [sortOrder, setSortOrder] = useState('asc');

  // Generate engagement score (0-100)
  const getEngagementScore = (client) => {
    const age = client.age;
    const contribution = client.contribution === 'H' ? 80 : client.contribution === 'M' ? 60 : 40;
    return Math.min(100, Math.round((contribution + (100 - age)) / 2));
  };

  const getEngagementColor = (score) => {
    if (score <= 20) return '#ef4444';
    if (score <= 40) return 'linear-gradient(90deg, #ef4444 0%, #f59e0b 100%)';
    if (score <= 60) return 'linear-gradient(90deg, #f59e0b 0%, #eab308 100%)';
    if (score <= 80) return 'linear-gradient(90deg, #eab308 0%, #84cc16 100%)';
    return 'linear-gradient(90deg, #84cc16 0%, #10b981 100%)';
  };

  const getTimeAgo = (client) => {
    if (client.name === 'Sam Pai') return '3d';
    const hash = client.clientId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const days = (hash % 14) + 1;
    const hours = hash % 24;
    const minutes = (hash % 60) + 1;
    
    if (days > 7) return `${days}d`;
    if (days > 1) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    return `${minutes}m`;
  };
  
  const proposalPhrases = ['Balanced Portfolio', 'Thematic Investment', 'Diversified Portfolio', 'Alternative Investment', 'Tax Advantaged Portfolio'];
  
  const getActionPhrase = (client) => {
    if (completedActions && completedActions[client.clientId]) return 'Proposal Reviewed';
    return client.action || 'Review Proposal';
  };

  const filteredClients = proposalClients
    .filter(client => {
      if (filterPriority !== 'all' && client.priority !== parseInt(filterPriority)) return false;
      if (searchTerm && !client.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'name') {
        return sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      }
      if (sortBy === 'aum') {
        const aVal = parseFloat(a.fum.replace(/[$,]/g, ''));
        const bVal = parseFloat(b.fum.replace(/[$,]/g, ''));
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
      if (sortBy === 'priority') {
        return sortOrder === 'asc' ? a.priority - b.priority : b.priority - a.priority;
      }
      return 0;
    });

  const hoveredClient = proposalClients.find(c => c.clientId === hoveredClientId);

  const getPriorityLabel = (priority) => {
    const labels = { 1: 'High', 2: 'Medium', 3: 'Low', 4: 'Low' };
    return labels[priority] || 'Unknown';
  };

  const getPriorityColor = (priority) => {
    const colors = { 1: 'var(--priority-critical)', 2: 'var(--priority-high)', 3: 'var(--priority-medium)', 4: 'var(--priority-low)' };
    return colors[priority] || 'var(--priority-low)';
  };

  const handleTakeAction = (clientId) => {
    navigate(`/action/proposal/${clientId}`);
  };

  return (
    <div className="worklist-page">
      <div className="worklist-header">
        <button className="back-button" onClick={() => navigate('/')}>
          <ArrowLeft size={18} />
          Back
        </button>
        <div className="worklist-title">
          <FileText size={24} />
          <h1>Investment Proposals</h1>
        </div>
      </div>

      <div className="worklist-content">
        <div className="worklist-table-section">
          <div className="table-filters">
            <input
              type="text"
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="sort-select">
              <option value="name">Sort by Name</option>
              <option value="aum">Sort by AUM</option>
              <option value="priority">Sort by Priority</option>
            </select>
            <button onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')} className="sort-order-btn">
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
            <button 
              className={`filter-btn ${filterPriority === 'all' ? 'active' : ''}`}
              onClick={() => setFilterPriority('all')}
            >
              All ({proposalStats.total})
            </button>
            <button 
              className={`filter-btn ${filterPriority === '1' ? 'active' : ''}`}
              onClick={() => setFilterPriority('1')}
            >
              Critical ({proposalStats.breakdown.critical})
            </button>
            <button 
              className={`filter-btn ${filterPriority === '2' ? 'active' : ''}`}
              onClick={() => setFilterPriority('2')}
            >
              Warning ({proposalStats.breakdown.high})
            </button>
            <button 
              className={`filter-btn ${filterPriority === '3' ? 'active' : ''}`}
              onClick={() => setFilterPriority('3')}
            >
              On Track ({proposalStats.breakdown.medium})
            </button>
          </div>

          <div className="worklist-table-container">
            <table className="worklist-table">
              <thead>
                <tr>
                  <th>Client ID</th>
                  <th>Client Name</th>
                  <th>Proposal Type</th>
                  <th>AUM</th>
                  <th>Priority</th>
                  <th className="ai-column-header">
                    <span>Next Best Action</span>
                    <AIBadge size="sm" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((client) => (
                  <tr 
                    key={client.clientId}
                    className={`worklist-row ${hoveredClientId === client.clientId ? 'hovered' : ''}`}
                    onMouseEnter={() => setHoveredClientId(client.clientId)}
                    onMouseLeave={() => setHoveredClientId(null)}
                  >
                    <td>{client.clientId}</td>
                    <td className="client-name">{client.name}</td>
                    <td>{client.proposalType}</td>
                    <td>{client.fum}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                        <span 
                          className="priority-badge"
                          style={{ backgroundColor: getPriorityColor(client.priority) }}
                        >
                          {getPriorityLabel(client.priority)}
                        </span>
                        <span className="time-badge">{getTimeAgo(client)}</span>
                      </div>
                    </td>
                    <td>
                      <button 
                        className={`action-btn ${completedActions && completedActions[client.clientId] ? 'completed' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (setCompletedActions) setCompletedActions(prev => ({ ...prev, [client.clientId]: true }));
                          navigate(`/action/proposal/${client.clientId}`);
                        }}
                      >
                        {getActionPhrase(client)}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProposalsWorklist;
