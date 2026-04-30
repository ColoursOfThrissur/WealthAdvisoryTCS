import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import CanvasLayout from './layouts/CanvasLayout';
import Overview from './pages/Overview';
import BackendChatInterface from './components/BackendChatInterface';
import RebalancingWorklist from './pages/RebalancingWorklist';
import ProposalsWorklist from './pages/ProposalsWorklist';
import ClientDetail from './pages/ClientDetail';
import ClientProfileView from './pages/ClientProfileView';
import RiskAnalysisView from './pages/RiskAnalysisView';
import InvestmentDetailsView from './pages/InvestmentDetailsView';
import IPSView from './pages/IPSView';
import InvestmentProposalSimple from './pages/InvestmentProposal/InvestmentProposalSimple';
import PortfolioRebalancingNative from './pages/PortfolioRebalancing/PortfolioRebalancingNative';
import ReportChat from './pages/ReportChat/ReportChat';
import PrioritizeMyDay from './pages/PrioritizeMyDay';
import MeetingPrep from './pages/MeetingPrep';
import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';
import { WorklistProvider } from './contexts/WorklistContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './styles/variables.css';
import './styles/themes.css';
import './styles/global.css';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function App() {
  const [activeTab, setActiveTab] = useState('cockpit');
  const [isChatExpanded, setIsChatExpanded] = useState(false);

  return (
    <BrowserRouter>
      <AuthProvider>
      <WorklistProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={
            <ProtectedRoute>
            <MainLayout activeTab={activeTab} onTabChange={setActiveTab} isChatExpanded={isChatExpanded} onChatClose={() => setIsChatExpanded(false)}>
              <CanvasLayout>
                <div style={{ display: activeTab === 'cockpit' ? 'contents' : 'none' }}>
                  <Overview isChatExpanded={isChatExpanded} setIsChatExpanded={setIsChatExpanded} />
                </div>
                <div style={{ display: activeTab === 'advisor-assist' ? 'contents' : 'none' }}>
                  <BackendChatInterface onClose={() => setActiveTab('cockpit')} />
                </div>
                <div style={{ display: activeTab === 'meeting-assist' ? 'contents' : 'none' }}>
                  <div className="meeting-assist-placeholder">
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '16px', color: 'var(--text-tertiary)' }}>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      <span style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Meeting Assist</span>
                      <span style={{ fontSize: '0.8125rem' }}>Coming soon — AI-powered meeting prep, notes & follow-ups</span>
                    </div>
                  </div>
                </div>
              </CanvasLayout>
            </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/worklist/rebalancing" element={
            <ProtectedRoute>
            <MainLayout activeTab={activeTab} onTabChange={setActiveTab}>
              <CanvasLayout>
                <RebalancingWorklist />
              </CanvasLayout>
            </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/worklist/proposals" element={
            <ProtectedRoute>
            <MainLayout activeTab={activeTab} onTabChange={setActiveTab}>
              <CanvasLayout>
                <ProposalsWorklist />
              </CanvasLayout>
            </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/client/:clientId/:type" element={
            <ProtectedRoute>
            <MainLayout activeTab={activeTab} onTabChange={setActiveTab}>
              <CanvasLayout>
                <ClientDetail />
              </CanvasLayout>
            </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/action/proposal/:clientId" element={
            <ProtectedRoute>
            <MainLayout activeTab={activeTab} onTabChange={setActiveTab}>
              <CanvasLayout>
                <InvestmentProposalSimple />
              </CanvasLayout>
            </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/action/rebalancing/:clientId" element={
            <ProtectedRoute>
            <MainLayout activeTab={activeTab} onTabChange={setActiveTab}>
              <CanvasLayout>
                <PortfolioRebalancingNative />
              </CanvasLayout>
            </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/client/:clientId/profile" element={
            <ProtectedRoute>
            <MainLayout activeTab={activeTab} onTabChange={setActiveTab}>
              <CanvasLayout>
                <ClientProfileView />
              </CanvasLayout>
            </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/client/:clientId/risk-analysis" element={
            <ProtectedRoute>
            <MainLayout activeTab={activeTab} onTabChange={setActiveTab}>
              <CanvasLayout>
                <RiskAnalysisView />
              </CanvasLayout>
            </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/client/:clientId/investment-details" element={
            <ProtectedRoute>
            <MainLayout activeTab={activeTab} onTabChange={setActiveTab}>
              <CanvasLayout>
                <InvestmentDetailsView />
              </CanvasLayout>
            </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/client/:clientId/ips" element={
            <ProtectedRoute>
            <MainLayout activeTab={activeTab} onTabChange={setActiveTab}>
              <CanvasLayout>
                <IPSView />
              </CanvasLayout>
            </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/prioritize" element={
            <ProtectedRoute>
            <MainLayout activeTab={activeTab} onTabChange={setActiveTab}>
              <CanvasLayout>
                <PrioritizeMyDay />
              </CanvasLayout>
            </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/meeting-prep/:clientId" element={
            <ProtectedRoute>
            <MainLayout activeTab={activeTab} onTabChange={setActiveTab}>
              <CanvasLayout>
                <MeetingPrep />
              </CanvasLayout>
            </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/report-chat" element={
            <ProtectedRoute>
            <MainLayout activeTab={activeTab} onTabChange={setActiveTab}>
              <CanvasLayout>
                <ReportChat />
              </CanvasLayout>
            </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </WorklistProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
