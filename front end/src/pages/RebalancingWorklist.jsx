import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, AlertCircle } from 'lucide-react';
import { useWorklist } from '../contexts/WorklistContext';
import { REBALANCING_API_URL } from '../config/api';
import AIBadge from '../components/AIBadge';
import worklistData from '../data/worklistCustomers.json';
import './RebalancingWorklist.css';

const MOCK_CLIENTS = worklistData.rebalancing.map(c => ({
  clientId: c.CustomerID,
  name: `${c.FirstName} ${c.Surname}`,
  fum: `$${(c.NetAssets / 1000).toFixed(0)}K`,
  aum: c.NetAssets,
  riskProfile: c.RiskProfile,
  priority: c.Priority === 'Critical' ? 1 : 3,
  priorityComment: c.RebalanceReason,
  trigger: c.Trigger,
  driftScore: 0,
  contribution: c.RiskProfile > 0.35 ? 'H' : c.RiskProfile > 0.2 ? 'M' : 'L',
  age: c.Age,
}));

const RebalancingWorklist = () => {
  const navigate = useNavigate();
  const { hoveredClientId, setHoveredClientId, completedActions, setCompletedActions } = useWorklist();
  const [filterPriority, setFilterPriority] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('priority');
  const [sortOrder, setSortOrder] = useState('asc');
  const [clients, setClients] = useState([]);
  const [stats, setStats] = useState({ total_clients: 0, critical: 0, high: 0, medium: 0, low: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWorklist = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${REBALANCING_API_URL}/api/worklist/rebalancing?priority=all`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.detail || 'Failed to fetch worklist');
        setClients(json.data.clients.map(c => ({
          clientId: c.client_id,
          name: c.client_name,
          fum: c.aum_formatted,
          aum: c.aum,
          riskProfile: c.risk_profile,
          priority: c.priority.level,
          priorityComment: c.next_best_action.action_label,
          trigger: c.trigger.reason,
          driftScore: c.trigger.drift_score,
          contribution: c.metrics.equity_weight > 60 ? 'H' : c.metrics.equity_weight > 40 ? 'M' : 'L',
          age: 0,
        })));
        setStats(json.data.summary_stats);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchWorklist();
  }, []);

  // Generate engagement score (0-100)
  const getEngagementScore = (client) => {
    const age = client.age;
    const contribution = client.contribution === 'H' ? 80 : client.contribution === 'M' ? 60 : 40;
    return Math.min(100, Math.round((contribution + (100 - age)) / 2));
  };

  const getEngagementColor = (score) => {
    if (score <= 20) return '#ef4444'; // red
    if (score <= 40) return 'linear-gradient(90deg, #ef4444 0%, #f59e0b 100%)';
    if (score <= 60) return 'linear-gradient(90deg, #f59e0b 0%, #eab308 100%)';
    if (score <= 80) return 'linear-gradient(90deg, #eab308 0%, #84cc16 100%)';
    return 'linear-gradient(90deg, #84cc16 0%, #10b981 100%)';
  };

  const getActionPhrase = (client) => {
    if (completedActions && completedActions[client.clientId]) return 'Portfolio Reviewed';
    return client.priorityComment || 'Review Portfolio';
  };

  const filteredClients = clients
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
        return sortOrder === 'asc' ? a.aum - b.aum : b.aum - a.aum;
      }
      if (sortBy === 'priority') {
        return sortOrder === 'asc' ? a.priority - b.priority : b.priority - a.priority;
      }
      return 0;
    });

  const hoveredClient = clients.find(c => c.clientId === hoveredClientId);

  if (loading) {
    return (
      <div className="worklist-page">
        <div className="worklist-header">
          <div className="worklist-title">
            <TrendingUp size={24} />
            <h1>Rebalancing Portfolio List</h1>
          </div>
        </div>
        <div className="worklist-loading">
          <div className="worklist-loading-spinner"></div>
          <p className="worklist-loading-text">Loading client portfolios...</p>
          <p className="worklist-loading-subtext">Analyzing rebalancing opportunities</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="worklist-page">
        <div className="worklist-header">
          <div className="worklist-title">
            <TrendingUp size={24} />
            <h1>Rebalancing Portfolio List</h1>
          </div>
        </div>
        <div className="worklist-error">
          <div className="worklist-error-icon"><AlertCircle size={40} style={{ opacity: 0.4 }} /></div>
          <p className="worklist-error-text">Unable to load worklist</p>
          <p className="worklist-error-detail">{error}</p>
          <button className="worklist-error-retry" onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  const getPriorityLabel = (priority) => {
    const labels = { 1: 'Critical', 2: 'Warning', 3: 'On Track', 4: 'Low' };
    return labels[priority] || 'Unknown';
  };

  const getPriorityColor = (priority) => {
    const colors = { 1: 'var(--priority-critical)', 2: 'var(--priority-high)', 3: 'var(--priority-medium)', 4: 'var(--priority-low)' };
    return colors[priority] || 'var(--priority-low)';
  };

  const handleTakeAction = (clientId) => {
    navigate(`/client/${clientId}/rebalancing`);
  };

  const renderRow = (client) => (
    <tr
      key={`api-${client.clientId}`}
      className={`worklist-row worklist-row--p${client.priority} ${hoveredClientId === client.clientId ? 'hovered' : ''}`}
      onMouseEnter={() => setHoveredClientId(client.clientId)}
      onMouseLeave={() => setHoveredClientId(null)}
      onClick={() => handleTakeAction(client.clientId)}
      style={{ cursor: 'pointer' }}
    >
      <td>{client.clientId}</td>
      <td className="client-name">{client.name}</td>
      <td>{client.fum}</td>
      <td>
        <div className="engagement-bar" title={`Engagement: ${getEngagementScore(client)}%`}>
          <div className="engagement-fill" style={{ width: `${getEngagementScore(client)}%`, background: getEngagementColor(getEngagementScore(client)) }} />
          <span className="engagement-score-label">{getEngagementScore(client)}</span>
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: '60%', width: '1px', background: 'var(--glass-border)', zIndex: 3 }} />
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: '80%', width: '1px', background: 'var(--glass-border)', zIndex: 3 }} />
        </div>
      </td>
      <td>
        <span className="priority-badge" style={{ backgroundColor: getPriorityColor(client.priority) }}>
          {getPriorityLabel(client.priority)}
        </span>
      </td>
      <td>
        <button
          className={`action-btn ${completedActions && completedActions[client.clientId] ? 'completed' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            if (setCompletedActions) setCompletedActions(prev => ({ ...prev, [client.clientId]: true }));
            navigate(`/action/rebalancing/${client.clientId}`);
          }}
        >
          {getActionPhrase(client)}
        </button>
      </td>
      <td className="trigger-cell">{client.trigger}</td>
    </tr>
  );

  return (
    <div className="worklist-page">
      <div className="worklist-header">
        <div className="worklist-title">
          <TrendingUp size={24} />
          <h1>Rebalancing Portfolio List</h1>
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
              All ({stats.total_clients})
            </button>
            <button 
              className={`filter-btn ${filterPriority === '1' ? 'active' : ''}`}
              onClick={() => setFilterPriority('1')}
            >
              Critical ({stats.critical})
            </button>
            <button 
              className={`filter-btn ${filterPriority === '2' ? 'active' : ''}`}
              onClick={() => setFilterPriority('2')}
            >
              High ({stats.high})
            </button>
            <button 
              className={`filter-btn ${filterPriority === '3' ? 'active' : ''}`}
              onClick={() => setFilterPriority('3')}
            >
              Medium ({stats.medium})
            </button>
            <button 
              className={`filter-btn ${filterPriority === '4' ? 'active' : ''}`}
              onClick={() => setFilterPriority('4')}
            >
              Low ({stats.low})
            </button>
          </div>

          <div className="worklist-table-container">
            <table className="worklist-table">
              <thead>
                <tr>
                  <th>Client ID</th>
                  <th>Client Name</th>
                  <th>AUM</th>
                  <th>Engagement</th>
                  <th>Priority</th>
                  <th className="ai-column-header">
                    <span>Next Best Action</span>
                    <AIBadge size="sm" />
                  </th>
                  <th>Trigger</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((client) => renderRow(client))}
                {MOCK_CLIENTS
                  .filter(c => !searchTerm || c.name.toLowerCase().includes(searchTerm.toLowerCase()))
                  .filter(c => !clients.some(api => api.name === c.name))
                  .map((client) => renderRow(client))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RebalancingWorklist;
