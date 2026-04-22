// DATA STRUCTURES FROM OLD WEALTH ADVISOR UI
// Reference for future implementation

/*
CLIENT DATA STRUCTURE:
- clientId: string (e.g., '15678284')
- name: string
- gender: 'Male' | 'Female'
- age: number
- Cash_in_Hand: string (formatted currency)
- fum: string (Funds Under Management - formatted currency)
- contribution: 'H' | 'M' | 'L' (High/Medium/Low)
- disposableIncome: string (formatted currency)
- agents: array of agent objects
  - agentType: 'doc' | 'fna' | 'pwiz' | 'srb' | 'crb' | 'efa'
  - name: string (agent name)
  - isAgentCompleted: boolean
  - completedSubProcesses: array
- priority: 1-4 (1=Critical, 2=High, 3=Medium, 4=Low)
- priorityComment: string

AGENT TYPES:
- doc: DocWiz (Document Intake)
- fna: MeetWiz (Meeting/FNA)
- pwiz: PortfolioWiz (Risk Rebalancing)
- srb: Sentiment Rebalancer (Sentiment Outlook)
- crb: Client Request Rebalancer (Reallocation Request)
- efa: FundAllocator (Efficient Frontier Analysis)

PORTFOLIO DATA STRUCTURE:
- Pages_Extracted: array
  - ExtractedData:
    - tables: array of table data
    - Paragraph: array of text content
- Categories:
  - Cash
  - Fixed Income
  - Equity
  - Commodities
  - Non-Traditional
  - Other
- Each category has:
  - marketValue: string
  - percentage: string

DASHBOARD METRICS:
- Total FUM (Funds Under Management)
- Cash in Hand
- Disposable Income
- Client Priority Distribution
- Agent Status/Completion
- Recent Activity/Transactions
*/

export const sampleClientData = [
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
      { 
        agentType: 'doc',
        name: 'DocWiz', 
        isAgentCompleted: false, 
        completedSubProcesses: [] 
      }
    ],
    priority: 1,
    priorityComment: "Immediate Action Required"
  }
];

export const portfolioCategories = [
  'Cash',
  'Fixed Income',
  'Equity',
  'Commodities',
  'Non-Traditional',
  'Other'
];

export const agentTypes = {
  doc: 'DocWiz',
  fna: 'MeetWiz',
  pwiz: 'PortfolioWiz',
  srb: 'Sentiment Rebalancer',
  crb: 'Reallocation Request',
  efa: 'FundAllocator'
};
