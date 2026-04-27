import ThemeToggle from '../components/ThemeToggle';
import MorningNoteBanner from '../components/MorningNoteBanner';
import './MainLayout.css';

const MainLayout = ({ children, activeTab, onTabChange }) => {

  return (
    <div className="main-layout">
      
      {/* Top Navigation Bar */}
      <header className="main-layout__header">

        {/* Left: Brand */}
        <div className="main-layout__left">
          <div className="brand-logo">
            <span className="brand-logo-text">Agentic Wealth Advisor</span>
          </div>
        </div>

        {/* Center: Tab Toggle */}
        <div className="main-layout__tabs">
          <button
            className={`main-layout__tab${activeTab === 'cockpit' ? ' main-layout__tab--active' : ''}`}
            onClick={() => onTabChange('cockpit')}
          >
            Cockpit
          </button>
          <button
            className={`main-layout__tab${activeTab === 'client-engine' ? ' main-layout__tab--active' : ''}`}
            onClick={() => onTabChange('client-engine')}
          >
            Client Engine
          </button>
        </div>

        {/* Right: Metrics + Controls */}
        <div className="main-layout__right">
          <div className="main-layout__metrics">
            <div className="ticker-item">
              <span className="ticker-label">S&P 500</span>
              <span className="ticker-value ticker-value--positive">+0.02%</span>
            </div>
            <div className="ticker-divider" />
            <div className="ticker-item">
              <span className="ticker-label">AUM</span>
              <span className="ticker-value ticker-value--positive">+0.05%</span>
            </div>
            <div className="ticker-divider" />
            <div className="ticker-item">
              <span className="ticker-label">Clients</span>
              <span className="ticker-value">250</span>
            </div>
          </div>
          <ThemeToggle />
          <div className="main-layout__user-profile">
            <div className="user-profile-avatar">
              <img src="/wealthmanager.png" alt="Profile" />
            </div>
            <span className="user-profile-name">John Doe</span>
          </div>
        </div>
      </header>

      <MorningNoteBanner />

      <main className="main-layout__content">
        {children}
      </main>
    </div>
  );
};

export default MainLayout;
