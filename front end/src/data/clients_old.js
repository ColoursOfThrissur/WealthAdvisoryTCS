const clientData = [
  {
    clientId: '15678284',
    name: 'Pai',
    gender: 'Male',
    age: 35,
    Cash_in_Hand: '$8,331.75',
    fum: '$99,981',
    contribution: 'H',
    disposableIncome: '$129,451',
    agents: [
      // { agentType: 'fna', name: 'MeetWiz', isAgentCompleted: false, completedSubProcesses: [] },
      // { agentType: 'doc', name: 'DocWiz', isAgentCompleted: false, completedSubProcesses: [] },
      { 
        agentType: 'doc', // Corrected: Pai starts with FNA agent
        name: 'DocWiz', 
        isAgentCompleted: false, 
        completedSubProcesses: [] 
      }
    ],
    priority: 1, // Critical
    priorityComment: "Immediate Action Required"
  },
  {
    clientId: '15579706',
    name: 'Curtis',
    gender: 'Female',
    age: 46,
    Cash_in_Hand: '$2,766.00',
    fum: '$33,192',
    contribution: 'H',
    disposableIncome: '$77,677',
    agents: [
      { // Example: Curtis starts with DocWiz (though name is fna, type is doc)
        agentType: 'fna', // Corrected: 'DocWiz' should be type 'doc'
        name: 'MeetWiz', // Name matches type
        isAgentCompleted: false, // This whole agent is complete
        completedSubProcesses: [] // All sub-steps are complete
      }
    ],
    priority: 3, // Medium
    priorityComment: "Review When Possible"
  },
  {
    clientId: '15634602',
    name: 'Hargrave',
    gender: 'Female',
    age: 42,
    Cash_in_Hand: '$6,301.25',
    fum: '$75,615',
    contribution: 'M',
    disposableIncome: '$101,349',
    agents: [
      { 
        agentType: 'pwiz', // Consistent agentType for PortfolioWiz
        name: 'Risk Rebalancing', 
        isAgentCompleted: false,
        completedSubProcesses: [] // No sub-steps completed yet
      }
    ],
    priority: 2, // High
    priorityComment: "Action Needed Soon"
  },
  {
    clientId: '15647311',
    name: 'Hill',
    gender: 'Female',
    age: 41,
    Cash_in_Hand: '$1,760.92',
    fum: '$21,131',
    contribution: 'L',
    disposableIncome: '$112,543',
    agents: [
      { 
        agentType: 'pwiz', // Consistent agentType for PortfolioWiz
        name: 'Risk Rebalancing', 
        isAgentCompleted: false,
        completedSubProcesses: [] // No sub-steps completed yet
      }
    ],
    priority: 4, // Low
    priorityComment: "Monitor / Optional"
  },
  {
    clientId: '15619304',
    name: 'Onio',
    gender: 'Female',
    age: 42,
    Cash_in_Hand: '$7,217.333',
    fum: '$86,608',
    contribution: 'M', // Assuming Medium as it's not specified, adjust if needed
    disposableIncome: '$113,932', // Placeholder, adjust if needed
    agents: [
      { 
        agentType: 'srb', // Replaced MeetingScribe with Sentiment Outlook
        name: 'Sentiment Outlook', 
        isAgentCompleted: false, 
        completedSubProcesses: [] 
      }
    ],
    priority: 1, // Critical
    priorityComment: "Immediate Action Required"
  },
  {
    clientId: '15574012',
    name: 'Chu',
    gender: 'Male',
    age: 44,
    Cash_in_Hand: '$4,563.917',
    fum: '$92,294',
    contribution: 'H', // Assuming High, adjust if needed
    disposableIncome: '$0', // Placeholder, adjust if needed
    agents: [
      { 
        agentType: 'crb', // Replaced Proposal Generator with Reallocation Request
        name: 'Reallocation Request', 
        isAgentCompleted: false, 
        completedSubProcesses: [] 
      }
    ],
    priority: 3, // Medium
    priorityComment: "Review When Possible"
  },
  {
    clientId: '15592531',
    name: 'Bartlett',
    gender: 'Male',
    age: 50,
    Cash_in_Hand: '$6,256',
    fum: '$75,072',
    contribution: 'M', // Assuming Medium, adjust if needed
    disposableIncome: '$0', // Placeholder, adjust if needed
    agents: [
      { 
        agentType: 'efa', // Replaced Plan Architect with FundAllocator
        name: 'FundAllocator', 
        isAgentCompleted: false, 
        completedSubProcesses: [] 
      }
    ],
    priority: 2, // High
    priorityComment: "Action Needed Soon"
  },
  {
    clientId: '15656148',
    name: 'Obinna',
    gender: 'Female',
    age: 29,
    Cash_in_Hand: '$6,752.58',
    fum: '$81,031',
    contribution: 'L', // Assuming Low, adjust if needed
    disposableIncome: '$0', // Placeholder, adjust if needed
    agents: [
      { 
        agentType: 'pwiz', // Consistent agentType for PortfolioWiz
        name: 'Risk Rebalancing', 
        isAgentCompleted: false, 
        completedSubProcesses: [] 
      }
    ],
    priority: 4, // Low
    priorityComment: "Monitor / Optional"
  },
  {
    clientId: '15792365',
    name: 'Hu',
    gender: 'Male',
    age: 44,
    Cash_in_Hand: '$7,126.42',
    fum: '$85,517',
    contribution: 'H', // Assuming High, adjust if needed
    disposableIncome: '$0', // Placeholder, adjust if needed
    agents: [
      { 
        agentType: 'srb', // Replaced MeetingScribe with Sentiment Outlook
        name: 'Sentiment Outlook', 
        isAgentCompleted: false, 
        completedSubProcesses: [] 
      }
    ],
    priority: 1, // Critical
    priorityComment: "Immediate Action Required"
  }
];

export default clientData;