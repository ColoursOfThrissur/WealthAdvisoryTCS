import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock } from 'lucide-react';
import AIBadge from '../components/AIBadge';
import './RebalancingWorklist.css';
import './PrioritizeMyDay.css';

const scheduleData = [
  { clientId: '15634602', name: 'Mary Hargrave', aum: '$577,000', nextBestAction: 'Portfolio Rebalancing', schedule: '10:00 AM', priority: 1 },
  { clientId: '15678284', name: 'Sam Pai', aum: '$99,981', nextBestAction: 'Review Proposal', schedule: '12:00 PM', priority: 2 },
  { clientId: '15784042', name: 'Erik Lund', aum: '$45,185', nextBestAction: 'Allocation Adjustment', schedule: '2:00 PM', priority: 2 },
  { clientId: '15581526', name: 'Michael Ander', aum: '$23,979', nextBestAction: 'Referral Consultation', schedule: '4:00 PM', priority: 3 },
];

const PrioritizeMyDay = () => {
  const navigate = useNavigate();
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="worklist-page">
      <div className="worklist-header">
        <div className="worklist-title">
          <Calendar size={24} />
          <h1>Prioritize My Day</h1>
        </div>
        <span className="pmd-date">{today}</span>
      </div>

      <div className="worklist-content">
        <div className="worklist-table-section">
          <div className="worklist-table-container">
            <table className="worklist-table">
              <thead>
                <tr>
                  <th>Schedule</th>
                  <th>Client Name</th>
                  <th>AUM</th>
                  <th className="ai-column-header">
                    <span>Next Best Action</span>
                    <AIBadge size="sm" />
                  </th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {scheduleData.map((client) => (
                  <tr
                    key={client.clientId}
                    className={`worklist-row worklist-row--p${client.priority}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/client/${client.clientId}/rebalancing`)}
                  >
                    <td>
                      <div className="pmd-time">
                        <Clock size={14} />
                        <span>{client.schedule}</span>
                      </div>
                    </td>
                    <td className="client-name">{client.name}</td>
                    <td>{client.aum}</td>
                    <td>
                      <button
                        className="action-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/client/${client.clientId}/rebalancing`);
                        }}
                      >
                        {client.nextBestAction}
                      </button>
                    </td>
                    <td></td>
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

export default PrioritizeMyDay;
