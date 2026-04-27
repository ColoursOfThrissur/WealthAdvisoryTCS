// Market Event Data for AI Agent Chat Integration
export const activeMarketEvent = {
  id: "evt_2026_hormuz_oil_crisis",
  type: "OIL_SUPPLY_DISRUPTION",
  severity: "CRITICAL",
  title: "Middle East Volatility",
  subtitle: "Middle East Geopolitical Risks driving Volatility & Inflation",
  description: "Iran blocks Strait of Hormuz following US-Israel strikes, disrupting 20% of global oil supply (20M bpd). Brent crude surges past $110/barrel amid largest supply crisis in history.",
  eventBrief: "The Strait of Hormuz has been largely blockaded for three weeks after Iran retaliated to US-Israel military actions starting February 28, 2026. This chokepoint handles 20% of world oil (20M bpd) and significant LNG/LPG flows. IEA reports unprecedented 8-10M bpd supply plunge, with Brent hitting $119 peaks and stabilizing above $108. Global stocks crashed $3T+ as airlines, manufacturing, and transport sectors plummet. Energy stocks volatile with upstream gains but refining/transport losses.",
  portfolioImpactExplanation: "Portfolios heavy in airlines, transportation, manufacturing, and consumer discretionary face severe drawdowns from surging fuel costs. Low energy/commodity hedges amplify losses. Urgent shift to energy producers, commodities, and inflation-protected assets recommended amid recession fears.",
  timestamp: "2026-03-16T12:00:00Z",

  affectedClients: [
    {
      clientId: "C001",
      clientName: "Alex Morgan",
      severity: "CRITICAL",
      age: 42,
      riskProfile: "Moderate Growth",
      currentValue: 500000,
      projectedLoss: 32000,
      lossPercentage: 6.4,
      energyExposure: 0.06,
      industrialExposure: 0.24,
      bondExposure: 0.30,
      portfolioReturn: 12.3,
      reason: "High industrial exposure with minimal energy hedge amid oil supply shock",
      recommendedAction: "Meeting Prep Ready — schedule immediate portfolio review",
      portfolioDetails: {
        currentAllocation: { bonds: 30, stocks: 64, energy: 6 },
        proposedAllocation: { bonds: 35, stocks: 50, energy: 15 },
        topHoldings: [
          { name: "Industrial Select Sector SPDR", ticker: "XLI", value: 120000, impact: -18000 },
          { name: "Consumer Discretionary Select SPDR", ticker: "XLY", value: 80000, impact: -9600 },
          { name: "Delta Air Lines Inc", ticker: "DAL", value: 60000, impact: -14400 }
        ],
        riskProfile: 0.55,
        timeHorizon: "10 years"
      }
    },
    {
      clientId: "15634602",
      clientName: "Mary Hargrave",
      severity: "HIGH",
      age: 45,
      riskProfile: "Moderate",
      currentValue: 577000,
      projectedLoss: 34620,
      lossPercentage: 6.0,
      energyExposure: 0.05,
      industrialExposure: 0.20,
      bondExposure: 0.295,
      portfolioReturn: 9.9,
      reason: "6% portfolio drift with equity overweight — rebalancing recommended",
      recommendedAction: "Rebalancing recommended for 6% drift",
      portfolioDetails: {
        currentAllocation: { bonds: 30, stocks: 65, energy: 5 },
        proposedAllocation: { bonds: 35, stocks: 50, energy: 15 },
        topHoldings: [
          { name: "Fidelity Large Cap Growth Index", ticker: "FSPGX", value: 150000, impact: -22500 },
          { name: "American Funds EuroPacific Growth", ticker: "AEPGX", value: 90000, impact: -13500 },
          { name: "American Funds Bond Fund", ticker: "ABNDX", value: 70000, impact: -4200 }
        ],
        riskProfile: 0.50,
        timeHorizon: "15 years"
      }
    },
    {
      clientId: "C003",
      clientName: "Sam Pai",
      severity: "MEDIUM",
      age: 35,
      riskProfile: "Moderate",
      currentValue: 390000,
      projectedLoss: 19500,
      lossPercentage: 5.0,
      energyExposure: 0.07,
      industrialExposure: 0.18,
      bondExposure: 0.35,
      portfolioReturn: 8.7,
      reason: "Moderate exposure to energy-sensitive sectors",
      recommendedAction: "Investment Proposal Ready",
      portfolioDetails: {
        currentAllocation: { bonds: 35, stocks: 58, energy: 7 },
        proposedAllocation: { bonds: 40, stocks: 45, energy: 15 },
        topHoldings: [
          { name: "Vanguard Total Stock Market ETF", ticker: "VTI", value: 120000, impact: -9600 },
          { name: "iShares MSCI Emerging Markets", ticker: "EEM", value: 80000, impact: -8000 },
          { name: "Vanguard Industrials ETF", ticker: "VIS", value: 60000, impact: -6000 }
        ],
        riskProfile: 0.45,
        timeHorizon: "20 years"
      }
    }
  ],

  impactSummary: {
    totalAffected: 8,
    criticalCount: 2,
    highCount: 3,
    mediumCount: 3,
    totalExposure: 1467000,
    totalProjectedLoss: 86120,
    averageLossPercentage: 5.9
  }
};

// AI Chat Response Flow
export const chatFlowResponses = {
  eventOverview: {
    type: "event-card",
    data: activeMarketEvent
  },
  
  mailGenerationResponse: {
    type: "mail-generation",
    loadingDuration: 3000,
    message: "I've analyzed the Hormuz crisis impact and prepared personalized communications for all 3 affected clients. Here's the summary:",
    followUpQuestion: "Would you like me to send these personalized emails to all affected clients?"
  },

  mailSentConfirmation: {
    type: "confirmation",
    loadingDuration: 4000,
    message: "✓ Action completed successfully",
    summary: {
      emailsSent: 3,
      criticalClients: 1,
      highPriorityClients: 1,
      timestamp: new Date().toISOString(),
      details: [
        "3 personalized emails sent",
        "1 critical priority client notified",
        "1 high priority client notified",
        "1 medium priority client notified",
        "Follow-up tasks created in CRM",
        "Event alert cleared from dashboard"
      ]
    }
  }
};

// Generate mail preview for each client
export const generateMailPreview = (client) => ({
  subject: client.severity === "CRITICAL" 
    ? `CRITICAL ALERT: Portfolio Protection Required - Hormuz Oil Crisis`
    : `URGENT: Portfolio Impact Notice - ${activeMarketEvent.title}`,
  greeting: `Dear ${client.clientName},`,
  body: `I am reaching out urgently regarding the Strait of Hormuz blockade that is severely impacting global energy markets and your portfolio.

${activeMarketEvent.description}

Your Portfolio Impact:
• Current energy exposure: ${(client.energyExposure * 100).toFixed(0)}%
• Industrial/transport exposure: ${(client.industrialExposure * 100).toFixed(0)}%
• Portfolio value: $${client.currentValue.toLocaleString()}
• Projected loss: -$${client.projectedLoss.toLocaleString()} (${client.lossPercentage}%)

Key Affected Holdings:
${client.portfolioDetails.topHoldings.map(h => `• ${h.name} (${h.ticker}): ${h.impact < 0 ? '-$' + Math.abs(h.impact).toLocaleString() : '$' + h.impact.toLocaleString()}`).join('\n')}

Recommended Actions:
${client.recommendedAction}

Proposed Reallocation:
Current: ${client.portfolioDetails.currentAllocation.bonds}% Bonds | ${client.portfolioDetails.currentAllocation.stocks}% Stocks | ${client.portfolioDetails.currentAllocation.energy}% Energy
Proposed: ${client.portfolioDetails.proposedAllocation.bonds}% Bonds | ${client.portfolioDetails.proposedAllocation.stocks}% Stocks | ${client.portfolioDetails.proposedAllocation.energy}% Energy

Let's schedule an immediate call to implement protective measures and safeguard your long-term goals.

Best regards,
Your Wealth Advisor`,
  priority: client.severity
});

export const getClientMailData = (clientId) => {
  const client = activeMarketEvent.affectedClients.find(c => c.clientId === clientId);
  return client ? { ...client, mailPreview: generateMailPreview(client), mailStatus: "ready" } : null;
};

export const hasActiveEvent = () => true;
