import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Home, LogOut, User, ChevronDown, Settings, Sun, Moon } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import MorningNoteBanner from '../components/MorningNoteBanner';
import { useAuth } from '../contexts/AuthContext';
import './MainLayout.css';

const TOP_LEVEL_PREFIXES = ['/worklist', '/prioritize', '/meeting-prep', '/report-chat', '/action'];

const isTopLevelRoute = (pathname) =>
  TOP_LEVEL_PREFIXES.some(prefix => pathname.startsWith(prefix));

const MainLayout = ({ children, activeTab, onTabChange, isChatExpanded, onChatClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const handleLogout = () => {
    setProfileOpen(false);
    logout();
    navigate('/login');
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  const isHome = location.pathname === '/';

  const renderNavBar = () => {
    // Sub-routes (not home)
    if (!isHome) {
      const isTopLevel = isTopLevelRoute(location.pathname);
      return (
        <div className="mnb-root mnb-nav">
          <button className="mnb-nav-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={14} /> Back
          </button>
          {!isTopLevel && (
            <button className="mnb-nav-btn" onClick={() => navigate('/')}>
              <Home size={14} /> Home
            </button>
          )}
        </div>
      );
    }

    // Home — Cockpit tab with chat open (mass mailer overlay)
    if (activeTab === 'cockpit' && isChatExpanded) {
      return (
        <div className="mnb-root mnb-nav">
          <button className="mnb-nav-btn" onClick={() => { if (onChatClose) onChatClose(); }}>
            <ArrowLeft size={14} /> Back
          </button>
          <button className="mnb-nav-btn" onClick={() => { if (onChatClose) onChatClose(); onTabChange('advisor-assist'); }}>
            <Home size={14} /> Home
          </button>
        </div>
      );
    }

    // Home — Cockpit tab, no chat: show morning notes banner only
    if (activeTab === 'cockpit') {
      return <MorningNoteBanner />;
    }

    // Home — Assist or Live Meeting: no nav needed, Assist IS home
    return null;
  };

  // Derive the visually active tab from the URL so the highlight is always correct
  const resolvedActiveTab = isHome ? activeTab : null;

  return (
    <div className="main-layout">
      
      {/* Top Navigation Bar */}
      <header className="main-layout__header">

        {/* Left: Brand — clicking goes home */}
        <div className="main-layout__left">
          <div className="brand-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <div className="brand-logo-icon">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="0" y="8" width="3" height="6" rx="0.75" fill="white" opacity="0.7"/>
                <rect x="4" y="5" width="3" height="9" rx="0.75" fill="white" opacity="0.85"/>
                <rect x="8" y="2" width="3" height="12" rx="0.75" fill="white"/>
                <rect x="12" y="0" width="2" height="14" rx="0.75" fill="white" opacity="0.5"/>
              </svg>
            </div>
            <div className="brand-logo-text">
              <span>Agentic</span>
              <span>Wealth Advisor</span>
              <span className="brand-powered-by">powered by TCS</span>
            </div>
          </div>
        </div>

        {/* Center: Tab Toggle */}
        <div className="main-layout__tabs">
          <button
            className={`main-layout__tab${resolvedActiveTab === 'advisor-assist' ? ' main-layout__tab--active' : ''}`}
            onClick={() => { if (onChatClose) onChatClose(); if (!isHome) navigate('/'); onTabChange('advisor-assist'); }}
          >
            Assist
          </button>
          <button
            className={`main-layout__tab${resolvedActiveTab === 'cockpit' ? ' main-layout__tab--active' : ''}`}
            onClick={() => { if (onChatClose) onChatClose(); if (!isHome) navigate('/'); onTabChange('cockpit'); }}
          >
            Cockpit
          </button>
          <button
            className={`main-layout__tab${resolvedActiveTab === 'meeting-assist' ? ' main-layout__tab--active' : ''}`}
            onClick={() => { if (onChatClose) onChatClose(); if (!isHome) navigate('/'); onTabChange('meeting-assist'); }}
          >
            Live Meeting
          </button>
        </div>

        {/* Right: Metrics + Controls */}
        <div className="main-layout__right">
          <div className="main-layout__metrics">
            <div className="ticker-item">
              <span className="ticker-label">S&P 500</span>
              <span className="ticker-value ticker-value--positive">5,308 <span className="ticker-change">+0.02%</span></span>
            </div>
            <div className="ticker-divider" />
            <div className="ticker-item">
              <span className="ticker-label">AUM</span>
              <span className="ticker-value ticker-value--positive">$6.2M <span className="ticker-change">+0.05%</span></span>
            </div>
            <div className="ticker-divider" />
            <div className="ticker-item">
              <span className="ticker-label">Clients</span>
              <span className="ticker-value">250</span>
            </div>
          </div>
          <div className="main-layout__user-profile" ref={profileRef}>
            <button
              className="user-profile-trigger"
              onClick={() => setProfileOpen(p => !p)}
            >
              <div className="user-profile-avatar">
                <img src="/wealthmanager.png" alt="Profile" />
              </div>
              <span className="user-profile-name">Derik Shaju</span>
              <ChevronDown size={13} className={`user-profile-chevron${profileOpen ? ' user-profile-chevron--open' : ''}`} />
            </button>

            {profileOpen && (
              <div className="user-profile-dropdown">
                <div className="user-profile-dropdown__header">
                  <div className="user-profile-dropdown__avatar">
                    <img src="/wealthmanager.png" alt="Profile" />
                  </div>
                  <div>
                    <span className="user-profile-dropdown__name">Derik Shaju</span>
                    <span className="user-profile-dropdown__role">Wealth Advisor</span>
                  </div>
                </div>
                <div className="user-profile-dropdown__divider" />
                <button className="user-profile-dropdown__item" onClick={() => { setProfileOpen(false); }}>
                  <User size={14} /> My Profile
                </button>
                <button className="user-profile-dropdown__item" onClick={() => { setProfileOpen(false); }}>
                  <Settings size={14} /> Settings
                </button>
                <div className="user-profile-dropdown__divider" />
                <div className="user-profile-dropdown__theme">
                  <span className="user-profile-dropdown__theme-label">
                    {theme === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
                    {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                  </span>
                  <button className="user-profile-dropdown__theme-toggle" onClick={toggleTheme}>
                    <span className={`theme-pill${theme === 'dark' ? ' theme-pill--on' : ''}`}>
                      <span className="theme-pill__knob" />
                    </span>
                  </button>
                </div>
                <div className="user-profile-dropdown__divider" />
                <button className="user-profile-dropdown__item user-profile-dropdown__item--danger" onClick={handleLogout}>
                  <LogOut size={14} /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {renderNavBar()}

      <main className="main-layout__content">
        {children}
      </main>
    </div>
  );
};

export default MainLayout;
