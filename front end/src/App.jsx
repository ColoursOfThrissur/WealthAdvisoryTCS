import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import CanvasLayout from './layouts/CanvasLayout';
import Overview from './pages/Overview';
import Dashboard from './pages/Dashboard';
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
  const [activeTab, setActiveTab] = useState('Assets View');

  return (
    <BrowserRouter>
      <AuthProvider>
      <WorklistProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={
            <ProtectedRoute>
            <MainLayout activeTab={activeTab} onTabChange={setActiveTab}>
              <CanvasLayout>
                {activeTab === 'Assets View' ? <Overview /> : <Dashboard />}
              </CanvasLayout>
            </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/chat" element={
            <ProtectedRoute>
            <MainLayout activeTab={activeTab} onTabChange={setActiveTab}>
              <CanvasLayout>
                <Overview />
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
