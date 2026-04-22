// Utility to trigger agent tooltip messages in chat
export const showAgentTooltip = (text) => {
  const event = new CustomEvent('agentTooltip', {
    detail: { text }
  });
  window.dispatchEvent(event);
};

export const clearAgentTooltip = () => {
  const event = new CustomEvent('agentTooltipClear');
  window.dispatchEvent(event);
};

// Predefined tooltips for common UI elements
export const TOOLTIPS = {
  PROFILE: {
    NAME: "This is the client's full name as registered in our system.",
    NET_WORTH: "Total assets minus liabilities, updated quarterly.",
    INCOME: "Annual gross income from all sources.",
    RISK_TOLERANCE: "Client's comfort level with investment volatility, assessed through our risk questionnaire."
  },
  PORTFOLIO: {
    CONSERVATIVE: "Lower risk portfolio with 70% bonds, 25% stocks, 5% cash. Suitable for capital preservation.",
    MODERATE: "Balanced portfolio with 60% stocks, 35% bonds, 5% cash. Good for steady growth with moderate risk.",
    AGGRESSIVE: "Higher risk portfolio with 85% stocks, 10% bonds, 5% cash. Targets maximum growth potential.",
    INCOME_FOCUSED: "Dividend-focused portfolio with 50% stocks, 40% bonds, 10% cash. Optimized for regular income."
  },
  DOCUMENTS: {
    PROPOSAL: "Detailed investment proposal document outlining recommended strategy and allocations.",
    RISK_ASSESSMENT: "Comprehensive risk profile analysis based on client questionnaire responses.",
    TERMS: "Legal terms and conditions governing the investment advisory relationship.",
    DISCLOSURES: "Required regulatory disclosures and fee schedules."
  }
};
