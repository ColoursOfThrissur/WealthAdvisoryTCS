import { useNavigate } from 'react-router-dom';
import { Sparkles, TrendingUp, FileText, DollarSign, User, BarChart3 } from 'lucide-react';
import UniversalCard from '../UniversalCard';
import './OverviewShared.css';
import './PortfolioMonitor.css';

const PortfolioMonitor = () => {
  const navigate = useNavigate();

  const actionItems = [
    { name: 'Portfolio Rebalancing', count: 12, critical: 3, icon: <TrendingUp size={16} />, onClick: () => navigate('/worklist/rebalancing') },
    { name: 'Investment Proposals',  count: 8,  critical: 2, icon: <FileText size={16} />,   onClick: () => navigate('/worklist/proposals') },
    { name: 'Tax Analysis',          count: 3,  critical: 0, icon: <TrendingUp size={16} />, onClick: () => navigate('/worklist/rebalancing') },
    { name: 'Invest Idle Cash',      count: 5,  critical: 1, icon: <DollarSign size={16} />,  onClick: () => {} },
    { name: 'KYC Expiring',          count: 1,  critical: 1, icon: <User size={16} />,        onClick: () => {} },
    { name: 'Portfolio Review',      count: 12, critical: 0, icon: <BarChart3 size={16} />,   onClick: () => navigate('/worklist/rebalancing') },
  ];

  return (
    <div className="ov-card overview__actions">
      <div className="ov-card__head">
        <span className="ov-card__title">Portfolio Monitor</span>
        <span className="ov-ai-badge"><Sparkles size={10} /> AI</span>
      </div>
      <div className="ov-actions-list">
        {actionItems.map(item => (
          <UniversalCard
            key={item.name}
            type="action-list"
            data={{ name: item.name, clients: `${item.count} clients`, critical: item.critical, icon: item.icon, onClick: item.onClick }}
          />
        ))}
      </div>
    </div>
  );
};

export default PortfolioMonitor;
