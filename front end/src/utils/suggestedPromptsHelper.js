import { BarChart2, Mail, TrendingUp, Scale, FileText, PieChart, Users, Calendar, MessageSquare, AlertCircle, Newspaper, RefreshCw, Apple, Globe, Leaf, Flame, DollarSign } from 'lucide-react';

const icon = (I) => I;

export const getEmailPrompts = (activeClient) => {
  const base = [
    { text: "Draft quarterly review email", query: "Draft a quarterly portfolio review email for clients with AUM > $500K", icon: icon(BarChart2), mode: "email" },
    { text: "Write meeting follow-up", query: "Draft a follow-up email summarizing our meeting discussion about portfolio strategy", icon: icon(Mail), mode: "email" },
    { text: "Market volatility update", query: "Draft an email about recent market volatility and recommended actions for affected clients", icon: icon(TrendingUp), mode: "email" },
    { text: "Rebalancing recommendation", query: "Draft an email recommending portfolio rebalancing for clients with drift > 5%", icon: icon(Scale), mode: "email" },
  ];
  if (activeClient) return [{ text: `Draft email for ${activeClient.name}`, query: `Draft a personalized portfolio update email for ${activeClient.name}`, icon: icon(Mail), mode: "email", highlight: true }, ...base.slice(0, 3)];
  return base;
};

export const getMeetingPrompts = (priorityClients = []) => {
  const base = [
    { text: "Prepare meeting for Mary Hargrave", query: "Mary Hargrave", icon: icon(FileText), mode: "meeting" },
    { text: "Prepare meeting for Sam Pai", query: "Sam Pai", icon: icon(FileText), mode: "meeting" },
    { text: "Talking points for priority clients", query: "Generate meeting talking points for all critical priority clients", icon: icon(MessageSquare), mode: "meeting" },
    { text: "Create annual review agenda", query: "Create annual review meeting agenda for top clients", icon: icon(Calendar), mode: "meeting" },
  ];
  if (priorityClients.length > 0) {
    const dynamic = priorityClients.slice(0, 2).map(c => ({ text: `Prepare meeting for ${c.name}`, query: c.name, icon: icon(FileText), mode: "meeting", priority: c.priority === 1 ? 'critical' : 'high' }));
    return [...dynamic, ...base.slice(2)];
  }
  return base;
};

export const getResearchPrompts = (morningNotes) => {
  const base = [
    { text: "Research AAPL fundamentals", query: "AAPL", icon: icon(Apple), mode: "research" },
    { text: "Analyze large cap tech sector", query: "Large cap tech sector", icon: icon(Globe), mode: "research" },
    { text: "Evaluate renewable energy stocks", query: "Renewable energy stocks", icon: icon(Leaf), mode: "research" },
    { text: "Research emerging markets ETFs", query: "Emerging markets ETF performance and outlook", icon: icon(Globe), mode: "research" },
  ];
  if (morningNotes?.trendingTopics?.length > 0) {
    const trending = morningNotes.trendingTopics.slice(0, 2).map(t => ({ text: `Research ${t}`, query: t, icon: icon(Flame), mode: "research", trending: true }));
    return [...trending, ...base.slice(0, 2)];
  }
  return base;
};

export const getReportPrompts = (activeClient) => {
  const base = [
    { text: "Performance report for Sarah Mitchell", query: "Generate performance report for Sarah Mitchell", icon: icon(BarChart2), mode: "report" },
    { text: "David Chen's asset allocation", query: "Show David Chen's asset allocation", icon: icon(PieChart), mode: "report" },
    { text: "Full report for Robert Anderson", query: "Create full report for Robert Anderson", icon: icon(FileText), mode: "report" },
    { text: "Tax-loss harvesting report", query: "Generate tax-loss harvesting opportunities report for all clients", icon: icon(DollarSign), mode: "report" },
  ];
  if (activeClient) return [{ text: `Generate report for ${activeClient.name}`, query: `Generate performance report for ${activeClient.name}`, icon: icon(BarChart2), mode: "report", highlight: true }, ...base.slice(0, 3)];
  return base;
};

export const getNormalPrompts = () => [
  { text: "Clients needing immediate attention", query: "Show me clients needing immediate attention", icon: icon(AlertCircle), mode: "normal" },
  { text: "Today's top action items", query: "What are today's top action items?", icon: icon(RefreshCw), mode: "normal" },
  { text: "Morning market insights", query: "Summarize morning market insights", icon: icon(Newspaper), mode: "normal" },
  { text: "Portfolios needing rebalancing", query: "Which portfolios need rebalancing?", icon: icon(Scale), mode: "normal" },
];

export const getSuggestedPromptsForMode = (mode, context = {}) => {
  const { activeClient, priorityClients, morningNotes } = context;
  switch (mode) {
    case 'email':    return getEmailPrompts(activeClient);
    case 'meeting':  return getMeetingPrompts(priorityClients);
    case 'research': return getResearchPrompts(morningNotes);
    case 'report':   return getReportPrompts(activeClient);
    default:         return getNormalPrompts();
  }
};
