/**
 * Suggested Prompts Utility
 * Manages mode-specific prompts and context-aware suggestions
 */

// Email Mode Prompts
export const getEmailPrompts = (activeClient, priorityClients = []) => {
  const basePrompts = [
    {
      text: "Draft quarterly review email for high-value clients",
      query: "Draft a quarterly portfolio review email for clients with AUM > $500K",
      icon: "📊",
      mode: "email"
    },
    {
      text: "Write meeting follow-up email",
      query: "Draft a follow-up email summarizing our meeting discussion about portfolio strategy",
      icon: "✉️",
      mode: "email"
    },
    {
      text: "Compose market volatility update",
      query: "Draft an email about recent market volatility and recommended actions for affected clients",
      icon: "📉",
      mode: "email"
    },
    {
      text: "Write rebalancing recommendation",
      query: "Draft an email recommending portfolio rebalancing for clients with drift > 5%",
      icon: "⚖️",
      mode: "email"
    }
  ];
  
  // Add client-specific prompt if client is active
  if (activeClient) {
    return [
      {
        text: `Draft personalized email for ${activeClient.name}`,
        query: `Draft a personalized portfolio update email for ${activeClient.name}`,
        icon: "✉️",
        mode: "email",
        highlight: true
      },
      ...basePrompts.slice(0, 3)
    ];
  }
  
  return basePrompts;
};

// Meeting Mode Prompts
export const getMeetingPrompts = (priorityClients = []) => {
  const basePrompts = [
    {
      text: "Prepare meeting for Mary Hargrave",
      query: "Mary Hargrave",
      icon: "📋",
      mode: "meeting",
      clientId: "C002"
    },
    {
      text: "Prepare meeting for Sam Pai",
      query: "Sam Pai",
      icon: "📋",
      mode: "meeting",
      clientId: "C001"
    },
    {
      text: "Generate talking points for high-priority clients",
      query: "Generate meeting talking points for all critical priority clients",
      icon: "💬",
      mode: "meeting"
    },
    {
      text: "Create annual review agenda",
      query: "Create annual review meeting agenda for top clients",
      icon: "📅",
      mode: "meeting"
    }
  ];
  
  // Add dynamic prompts from priority clients
  if (priorityClients.length > 0) {
    const dynamicPrompts = priorityClients.slice(0, 2).map(client => ({
      text: `Prepare meeting for ${client.name}`,
      query: client.name,
      icon: "📋",
      mode: "meeting",
      clientId: client.clientId,
      priority: client.priority === 1 ? 'critical' : 'high'
    }));
    
    return [...dynamicPrompts, ...basePrompts.slice(2)];
  }
  
  return basePrompts;
};

// Research Mode Prompts
export const getResearchPrompts = (morningNotes) => {
  const basePrompts = [
    {
      text: "Research AAPL fundamentals",
      query: "AAPL",
      icon: "🍎",
      mode: "research"
    },
    {
      text: "Analyze large cap tech sector",
      query: "Large cap tech sector",
      icon: "💻",
      mode: "research"
    },
    {
      text: "Evaluate renewable energy stocks",
      query: "Renewable energy stocks",
      icon: "🌱",
      mode: "research"
    },
    {
      text: "Research emerging markets ETFs",
      query: "Emerging markets ETF performance and outlook",
      icon: "🌍",
      mode: "research"
    }
  ];
  
  // Add trending topics from morning notes if available
  if (morningNotes?.trendingTopics && morningNotes.trendingTopics.length > 0) {
    const trendingPrompts = morningNotes.trendingTopics.slice(0, 2).map(topic => ({
      text: `Research ${topic}`,
      query: topic,
      icon: "🔥",
      mode: "research",
      trending: true
    }));
    
    return [...trendingPrompts, ...basePrompts.slice(0, 2)];
  }
  
  return basePrompts;
};

// Report Mode Prompts
export const getReportPrompts = (activeClient) => {
  const basePrompts = [
    {
      text: "Generate performance report for Sarah Mitchell",
      query: "Generate performance report for Sarah Mitchell",
      icon: "📊",
      mode: "report"
    },
    {
      text: "Show David Chen's asset allocation",
      query: "Show David Chen's asset allocation",
      icon: "🥧",
      mode: "report"
    },
    {
      text: "Create full report for Robert Anderson",
      query: "Create full report for Robert Anderson",
      icon: "📑",
      mode: "report"
    },
    {
      text: "Generate tax-loss harvesting report",
      query: "Generate tax-loss harvesting opportunities report for all clients",
      icon: "💰",
      mode: "report"
    }
  ];
  
  if (activeClient) {
    return [
      {
        text: `Generate report for ${activeClient.name}`,
        query: `Generate performance report for ${activeClient.name}`,
        icon: "📊",
        mode: "report",
        highlight: true
      },
      ...basePrompts.slice(0, 3)
    ];
  }
  
  return basePrompts;
};

// Normal Mode Prompts (Default)
export const getNormalPrompts = () => {
  return [
    {
      text: "Show clients needing immediate attention",
      query: "Show me clients needing immediate attention",
      icon: "🚨",
      mode: "normal"
    },
    {
      text: "What are today's top action items?",
      query: "What are today's top action items?",
      icon: "✅",
      mode: "normal"
    },
    {
      text: "Summarize morning market insights",
      query: "Summarize morning market insights",
      icon: "📰",
      mode: "normal"
    },
    {
      text: "Which portfolios need rebalancing?",
      query: "Which portfolios need rebalancing?",
      icon: "⚖️",
      mode: "normal"
    }
  ];
};

// Main function to get prompts based on mode
export const getSuggestedPromptsForMode = (mode, context = {}) => {
  const { activeClient, priorityClients, morningNotes } = context;
  
  switch(mode) {
    case 'email':
      return getEmailPrompts(activeClient, priorityClients);
    case 'meeting':
      return getMeetingPrompts(priorityClients);
    case 'research':
      return getResearchPrompts(morningNotes);
    case 'report':
      return getReportPrompts(activeClient);
    case 'normal':
    default:
      return getNormalPrompts();
  }
};
