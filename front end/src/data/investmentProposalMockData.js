export const investmentProposalData = {
  investment_proposal: {
    client_profile: { 
      name: 'Sam Pai',
      age: 35,
      gender: 'Male',
      marital_status: 'Married',
      dependents: 2,
      occupation: 'Marketing Director',
      net_worth: 390000,
      annual_income: 120000,
      monthly_expenses: 5000,
      current_savings: 80000,
      retirement_savings: 150000,
      investment_accounts: 60000,
      real_estate_equity: 100000,
      investment_experience: '5-10 years',
      risk_tolerance: 'Moderate'
    },
    meeting_notes: [
      'Open to more aggressive growth strategies in the short term',
      'Interested in ESG-aligned investments',
      'Wants to understand tax implications of portfolio changes',
      'Client expressed interest in retirement planning with target age of 60',
      'Two children aged 12 and 14, college savings is a priority'
    ],
    moderate_model_tickers: [
      { ticker: 'VTI', name: 'Vanguard Total Stock Market ETF', current_price: 341.85, ytd_change_percent: 16.82, ytd_change_display: '+16.82%', ytd_change_color: 'positive', volume: 6416000 },
      { ticker: 'GOOGL', name: 'Alphabet Inc.', current_price: 330, ytd_change_percent: 69.03, ytd_change_display: '+69.03%', ytd_change_color: 'positive', volume: 40250800 },
      { ticker: 'VXUS', name: 'Vanguard Total International St', current_price: 78.64, ytd_change_percent: 36.64, ytd_change_display: '+36.64%', ytd_change_color: 'positive', volume: 8127600 },
      { ticker: 'BND', name: 'Vanguard Total Bond Market ETF', current_price: 74.20, ytd_change_percent: 7.21, ytd_change_display: '+7.21%', ytd_change_color: 'positive', volume: 16104500 },
      { ticker: 'TIP', name: 'iShares TIPS Bond ETF', current_price: 110.02, ytd_change_percent: 6.24, ytd_change_display: '+6.24%', ytd_change_color: 'positive', volume: 2318600 },
      { ticker: 'VNQ', name: 'Vanguard Real Estate ETF', current_price: 92.62, ytd_change_percent: 7.38, ytd_change_display: '+7.38%', ytd_change_color: 'positive', volume: 4819500 },
      { ticker: 'SCHD', name: 'Schwab US Dividend Equity ETF', current_price: 28.90, ytd_change_percent: 7.30, ytd_change_display: '+7.30%', ytd_change_color: 'positive', volume: 19760200 },
      { ticker: 'SHV', name: 'iShares 0-1 Year Treasury Bond', current_price: 110.31, ytd_change_percent: 4.14, ytd_change_display: '+4.14%', ytd_change_color: 'positive', volume: 2615000 },
      { ticker: 'ESGV', name: 'Vanguard ESG U.S. Stock ETF', current_price: 122.02, ytd_change_percent: 15.51, ytd_change_display: '+15.51%', ytd_change_color: 'positive', volume: 108500 },
      { ticker: 'ESGD', name: 'iShares ESG Aware MSCI EAFE ETF', current_price: 98.56, ytd_change_percent: 32.57, ytd_change_display: '+32.57%', ytd_change_color: 'positive', volume: 228400 }
    ],
    risk_model_portfolios: {
      'Moderate': { objective: 'Long-term growth with stability' },
      'Moderately Aggressive': { objective: 'Growth-focused with some volatility' }
    },
    moderate_portfolio_allocation: {
      'Bonds': { percentage: 25 },
      'Cash_Equivalents': { percentage: 5 },
      'ESG_Options': { percentage: 5 },
      'REITs_Alternatives': { percentage: 15 },
      'US_and_International_Equities': { percentage: 50 }
    },
    onboarding_documents: [
      {
        title: 'KYC',
        description: 'Know Your Customer documentation to verify client identity and assess suitability.',
        link: '#/documents/kyc'
      },
      {
        title: 'Engagement Letter',
        description: 'Formal agreement outlining the scope of advisory services and fee structure.',
        link: '#/documents/engagement-letter'
      },
      {
        title: 'Beneficiary Designation',
        description: 'Form to designate beneficiaries for investment accounts and retirement plans.',
        link: '#/documents/beneficiary-designation'
      },
      {
        title: 'ACH Authorization',
        description: 'Authorization for electronic fund transfers between bank and investment accounts.',
        link: '#/documents/ach-authorization'
      }
    ]
  }
};
