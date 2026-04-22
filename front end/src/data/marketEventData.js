// Market Event Data for AI Agent Chat Integration
export const activeMarketEvent = {
  id: "evt_2026_hormuz_oil_crisis",
  type: "OIL_SUPPLY_DISRUPTION",
  severity: "CRITICAL",
  title: "Strait of Hormuz Blockade - March 2026",
  description: "Iran blocks Strait of Hormuz following US-Israel strikes, disrupting 20% of global oil supply (20M bpd). Brent crude surges past $110/barrel amid largest supply crisis in history.",
  eventBrief: "The Strait of Hormuz has been largely blockaded for three weeks after Iran retaliated to US-Israel military actions starting February 28, 2026. This chokepoint handles 20% of world oil (20M bpd) and significant LNG/LPG flows. IEA reports unprecedented 8-10M bpd supply plunge, with Brent hitting $119 peaks and stabilizing above $108. Global stocks crashed $3T+ as airlines, manufacturing, and transport sectors plummet. Energy stocks volatile with upstream gains but refining/transport losses.",
  portfolioImpactExplanation: "Portfolios heavy in airlines, transportation, manufacturing, and consumer discretionary face severe drawdowns from surging fuel costs. Low energy/commodity hedges amplify losses. Urgent shift to energy producers, commodities, and inflation-protected assets recommended amid recession fears.",
  timestamp: "2026-03-16T12:00:00Z",
  
  affectedClients: [
    {
      clientId: "C002",
      clientName: "Jennifer Thompson",
      severity: "CRITICAL",
      bondExposure: 0.35,
      currentValue: 1200000,
      projectedLoss: 96000,
      lossPercentage: 8.0,
      energyExposure: 0.05,
      industrialExposure: 0.28,
      reason: "Minimal energy hedge (5%) vs high transport/industrial exposure (28%) amid fuel cost surge",
      recommendedAction: "Increase energy/commodities to 15%, cut transport holdings 15%, add inflation bonds/TIPS",
      portfolioDetails: {
        currentAllocation: { bonds: 35, stocks: 60, energy: 5 },
        proposedAllocation: { bonds: 40, stocks: 45, energy: 15 },
        topHoldings: [
          { name: "iShares Transportation Average ETF", ticker: "IYT", value: 180000, impact: -72000 },
          { name: "Industrial Select Sector SPDR", ticker: "XLI", value: 156000, impact: -23400 },
          { name: "Delta Air Lines Inc", ticker: "DAL", value: 96000, impact: -38400 }
        ],
        riskProfile: 0.65,
        timeHorizon: "8 years"
      }
    },
    {
      clientId: "C004",
      clientName: "Michael Williams",
      severity: "HIGH",
      bondExposure: 0.40,
      currentValue: 3200000,
      projectedLoss: 160000,
      lossPercentage: 5.0,
      energyExposure: 0.08,
      industrialExposure: 0.22,
      reason: "Insufficient energy protection (8%) against elevated industrial/transport bets (22%)",
      recommendedAction: "Raise energy to 18%, reduce industrials 12%, boost bonds for inflation defense",
      portfolioDetails: {
        currentAllocation: { bonds: 40, stocks: 52, energy: 8 },
        proposedAllocation: { bonds: 45, stocks: 37, energy: 18 },
        topHoldings: [
          { name: "Vanguard Industrials ETF", ticker: "VIS", value: 448000, impact: -67200 },
          { name: "United Airlines Holdings", ticker: "UAL", value: 192000, impact: -57600 },
          { name: "Consumer Discretionary Select SPDR", ticker: "XLY", value: 320000, impact: -32000 }
        ],
        riskProfile: 0.55,
        timeHorizon: "12 years"
      }
    }
  ],
  
  impactSummary: {
    totalAffected: 2,
    criticalCount: 1,
    highCount: 1,
    mediumCount: 0,
    totalExposure: 4400000,
    totalProjectedLoss: 256000,
    averageLossPercentage: 6.5
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
    message: "I've analyzed the Hormuz crisis impact and prepared personalized communications for all 2 affected clients. Here's the summary:",
    followUpQuestion: "Would you like me to send these personalized emails to all affected clients?"
  },
  
  mailSentConfirmation: {
    type: "confirmation",
    loadingDuration: 4000,
    message: "✓ Action completed successfully",
    summary: {
      emailsSent: 2,
      criticalClients: 1,
      highPriorityClients: 1,
      timestamp: new Date().toISOString(),
      details: [
        "2 personalized emails sent",
        "1 critical priority client notified",
        "1 high priority client notified",
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
