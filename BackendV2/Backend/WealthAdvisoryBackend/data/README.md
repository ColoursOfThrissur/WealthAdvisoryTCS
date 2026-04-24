# Client Data Registry

## Overview
This directory contains client portfolio data for the AI-powered wealth management system.

## Structure

```
data/
├── clients_registry.json          # Master client list
├── holdings/                      # Client holdings (current positions)
│   ├── robert_anderson.json
│   ├── sarah_mitchell.json
│   ├── david_chen.json
│   ├── emily_rodriguez.json
│   ├── james_patterson.json
│   └── lisa_thompson.json
└── transactions/                  # Client transactions (Q4 2025)
    ├── robert_anderson.json
    ├── sarah_mitchell.json
    ├── david_chen.json
    ├── emily_rodriguez.json
    ├── james_patterson.json
    └── lisa_thompson.json
```

## Client Profiles

### 1. Robert Anderson (CLT-001)
- **AUM**: $1,250,000
- **Risk Profile**: Moderate-Aggressive (0.31)
- **Status**: Churn risk recovered
- **Holdings**: 12 positions (Tech-heavy, diversified)
- **Accounts**: Individual Brokerage + IRA

### 2. Sarah Mitchell (CLT-002)
- **AUM**: $850,000
- **Risk Profile**: Conservative (0.25)
- **Status**: Churn risk critical
- **Holdings**: 10 positions (Bond-heavy, defensive)
- **Accounts**: Joint Brokerage

### 3. David Chen (CLT-003)
- **AUM**: $1,450,000
- **Risk Profile**: Moderate (0.28)
- **Status**: Churn risk critical
- **Holdings**: 10 positions (Tech-heavy, aggressive)
- **Accounts**: Individual Brokerage + 401k

### 4. Emily Rodriguez (CLT-004)
- **AUM**: $980,000
- **Risk Profile**: Moderate (0.28)
- **Status**: Churn risk medium
- **Holdings**: 9 positions (Balanced, diversified)
- **Accounts**: Individual Brokerage + Roth IRA

### 5. James Patterson (CLT-005)
- **AUM**: $2,100,000
- **Risk Profile**: Conservative (0.12)
- **Status**: Churn risk low
- **Holdings**: 12 positions (Bond-heavy, blue-chip stocks)
- **Accounts**: Joint Brokerage + Traditional IRA + Trust

### 6. Lisa Thompson (CLT-006)
- **AUM**: $750,000
- **Risk Profile**: Moderate (0.20)
- **Status**: Churn risk low
- **Holdings**: 10 positions (Balanced, sector diversified)
- **Accounts**: Individual Brokerage + SEP IRA

## Total Portfolio
- **Total Clients**: 6
- **Total AUM**: $7,380,000
- **Average AUM**: $1,230,000

## Usage

### Natural Language Queries
```
"Generate full report for Robert Anderson Q4 2025"
"Show me Sarah Mitchell's performance"
"Create allocation analysis for David Chen"
"Generate reports for all high-risk clients"
```

### Client Name Variations
The system supports fuzzy matching:
- "Robert Anderson" → "robert", "anderson", "bob anderson"
- "Sarah Mitchell" → "sarah", "mitchell", "s mitchell"
- "David Chen" → "david", "chen", "d chen"

## Data Sources
Client profiles match data from:
- `WealthAdvisoryV2UI/Data/worklist_customers.json`
- `WealthAdvisoryV2UI/Data/churnAnalysisData.json`

## Next Steps
1. Implement ClientRepository service
2. Integrate with PlannerAgent
3. Test natural language queries
4. Add more clients as needed
