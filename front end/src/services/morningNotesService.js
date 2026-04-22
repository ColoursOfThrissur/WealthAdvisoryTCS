// Morning Notes Service - Backend Integration
export const getMorningNotes = async () => {
  // Dummy data for testing - replace with actual API call
  return {
    summary: "3 clients need immediate attention • Market volatility in energy sector • 12 portfolios require rebalancing",
    notes: [
      {
        id: 1,
        type: 'critical',
        category: 'client-alert',
        title: '3 clients need immediate attention',
        description: 'Mary Hargrave, Sam Pai, and Robert Anderson require portfolio review due to significant drift.',
        timestamp: new Date().toISOString(),
        actionRequired: true
      },
      {
        id: 2,
        type: 'warning',
        category: 'market-update',
        title: 'Market volatility in energy sector',
        description: 'Energy sector experiencing high volatility. 5 clients have significant exposure.',
        timestamp: new Date().toISOString(),
        actionRequired: false
      },
      {
        id: 3,
        type: 'info',
        category: 'portfolio-action',
        title: '12 portfolios require rebalancing',
        description: 'Portfolio drift detected across 12 client accounts. Review recommended.',
        timestamp: new Date().toISOString(),
        actionRequired: true
      },
      {
        id: 4,
        type: 'success',
        category: 'all',
        title: 'Morning notes updated - 3 new insights',
        description: 'Latest market analysis and recommendations are now available.',
        timestamp: new Date().toISOString(),
        actionRequired: false
      }
    ]
  };
};

export const filterNotesByCategory = (notes, category) => {
  if (category === 'all') return notes;
  return notes.filter(note => note.category === category || note.category === 'all');
};
