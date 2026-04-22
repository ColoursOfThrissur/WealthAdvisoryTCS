export const portfolioData = [
    { name: 'Conservative', risk: 'Low', stocks: 20, bonds: 70, cash: 10, return: '4-5%', volatility: 'Low', recommended: false, sharpeRatio: 0.65, maxDrawdown: '-8%', yearlyReturn: '4.2%', expenseRatio: '0.15%' },
    { name: 'Moderately Conservative', risk: 'Low-Medium', stocks: 35, bonds: 55, cash: 10, return: '5-6%', volatility: 'Low-Medium', recommended: false, sharpeRatio: 0.72, maxDrawdown: '-12%', yearlyReturn: '5.4%', expenseRatio: '0.18%' },
    { name: 'Moderate', risk: 'Medium', stocks: 50, bonds: 40, cash: 10, return: '6-7%', volatility: 'Medium', recommended: true, sharpeRatio: 0.85, maxDrawdown: '-18%', yearlyReturn: '6.5%', expenseRatio: '0.22%' },
    { name: 'Moderately Aggressive', risk: 'Medium-High', stocks: 65, bonds: 30, cash: 5, return: '7-8%', volatility: 'Medium-High', recommended: false, sharpeRatio: 0.91, maxDrawdown: '-24%', yearlyReturn: '7.6%', expenseRatio: '0.25%' },
    { name: 'Aggressive', risk: 'High', stocks: 80, bonds: 15, cash: 5, return: '8-10%', volatility: 'High', recommended: false, sharpeRatio: 0.98, maxDrawdown: '-32%', yearlyReturn: '9.1%', expenseRatio: '0.28%' },
    { name: 'Income Focus', risk: 'Low', stocks: 25, bonds: 65, cash: 10, return: '4-6%', volatility: 'Low', recommended: false, sharpeRatio: 0.68, maxDrawdown: '-10%', yearlyReturn: '4.8%', expenseRatio: '0.16%' },
    { name: 'Growth Focus', risk: 'High', stocks: 85, bonds: 10, cash: 5, return: '9-11%', volatility: 'High', recommended: false, sharpeRatio: 1.05, maxDrawdown: '-35%', yearlyReturn: '10.2%', expenseRatio: '0.30%' },
    { name: 'Balanced Income', risk: 'Medium', stocks: 40, bonds: 50, cash: 10, return: '5-7%', volatility: 'Medium', recommended: false, sharpeRatio: 0.78, maxDrawdown: '-15%', yearlyReturn: '5.9%', expenseRatio: '0.20%' },
    { name: 'Capital Preservation', risk: 'Very Low', stocks: 10, bonds: 75, cash: 15, return: '3-4%', volatility: 'Very Low', recommended: false, sharpeRatio: 0.58, maxDrawdown: '-5%', yearlyReturn: '3.5%', expenseRatio: '0.12%' },
    { name: 'Dynamic Growth', risk: 'Very High', stocks: 90, bonds: 5, cash: 5, return: '10-12%', volatility: 'Very High', recommended: false, sharpeRatio: 1.12, maxDrawdown: '-40%', yearlyReturn: '11.3%', expenseRatio: '0.32%' }
];

export const generatePerformanceData = (portfolio, months = 12) => {
    const baseReturn = parseFloat(portfolio.return.split('-')[0]);
    return Array.from({length: months}, (_, i) => {
        const variance = (Math.sin(i * 0.5) * 0.3 + Math.random() * 0.2 - 0.1);
        return baseReturn + variance;
    });
};
