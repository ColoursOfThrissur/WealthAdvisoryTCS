import { createContext, useContext, useState, useMemo, useCallback } from 'react';
import worklistData from '../data/worklistCustomers.json';

const WorklistContext = createContext();

export const useWorklist = () => {
  const context = useContext(WorklistContext);
  if (!context) {
    throw new Error('useWorklist must be used within WorklistProvider');
  }
  return context;
};

export const WorklistProvider = ({ children }) => {
  const [hoveredClientId, setHoveredClientId] = useState(null);
  const [completedActions, setCompletedActions] = useState({});

  // Map JSON data to match existing structure
  const rebalancingClients = useMemo(() => {
    return worklistData.rebalancing.map(client => ({
      clientId: client.CustomerID.toString(),
      name: `${client.FirstName} ${client.Surname}`,
      gender: client.Gender,
      age: client.Age,
      Cash_in_Hand: `$${client.CashInHand.toFixed(2)}`,
      fum: `$${client.NetAssets.toLocaleString()}`,
      contribution: client.RiskProfile > 0.3 ? 'H' : client.RiskProfile > 0.15 ? 'M' : 'L',
      disposableIncome: `$${client.EstimatedSalary.toLocaleString()}`,
      priority: client.Priority === 'Critical' ? 1 : client.Age > 60 ? 1 : client.RiskProfile > 0.35 ? 2 : client.Diversification < 0.25 ? 2 : 3,
      priorityComment: client.RebalanceReason,
      trigger: client.Trigger,
      recommendations: client.RecommendedActions,
      lastActivity: '2 days ago'
    }));
  }, []);

  const proposalClients = useMemo(() => {
    return worklistData.investment_proposals.map(client => ({
      clientId: client.CustomerID.toString(),
      name: `${client.FirstName} ${client.Surname}`,
      gender: client.Gender,
      age: client.Age,
      Cash_in_Hand: `$${client.CashInHand.toFixed(2)}`,
      fum: `$${client.NetAssets.toLocaleString()}`,
      contribution: client.RiskProfile > 0.3 ? 'H' : client.RiskProfile > 0.15 ? 'M' : 'L',
      disposableIncome: `$${client.EstimatedSalary.toLocaleString()}`,
      priority: client.NetAssets > 80000 ? 1 : client.NetAssets > 50000 ? 2 : 3,
      priorityComment: client.ProposalType,
      action: client.Action,
      proposalType: client.ProposalType,
      proposedAmount: client.ProposedAmount,
      expectedReturn: client.ExpectedReturn,
      riskLevel: client.RiskLevel,
      lastActivity: '1 day ago'
    }));
  }, []);

  // Priority breakdown for rebalancing
  const rebalancingStats = useMemo(() => {
    const breakdown = { critical: 0, high: 0, medium: 0, low: 0 };
    let totalAUM = 0;

    rebalancingClients.forEach(client => {
      if (client.priority === 1) breakdown.critical++;
      else if (client.priority === 2) breakdown.high++;
      else if (client.priority === 3) breakdown.medium++;
      else if (client.priority === 4) breakdown.low++;
      
      totalAUM += parseFloat(client.fum.replace(/[^0-9.-]+/g, '')) || 0;
    });

    return {
      total: rebalancingClients.length,
      breakdown,
      totalAUM: `$${totalAUM.toLocaleString()}`
    };
  }, [rebalancingClients]);

  // Priority breakdown for proposals
  const proposalStats = useMemo(() => {
    const breakdown = { critical: 0, high: 0, medium: 0, low: 0 };
    let totalAUM = 0;

    proposalClients.forEach(client => {
      if (client.priority === 1) breakdown.critical++;
      else if (client.priority === 2) breakdown.high++;
      else if (client.priority === 3) breakdown.medium++;
      else if (client.priority === 4) breakdown.low++;
      
      totalAUM += parseFloat(client.fum.replace(/[^0-9.-]+/g, '')) || 0;
    });

    return {
      total: proposalClients.length,
      breakdown,
      totalAUM: `$${totalAUM.toLocaleString()}`
    };
  }, [proposalClients]);

  const value = {
    rebalancingClients,
    proposalClients,
    rebalancingStats,
    proposalStats,
    hoveredClientId,
    setHoveredClientId,
    completedActions,
    setCompletedActions
  };

  return (
    <WorklistContext.Provider value={value}>
      {children}
    </WorklistContext.Provider>
  );
};
