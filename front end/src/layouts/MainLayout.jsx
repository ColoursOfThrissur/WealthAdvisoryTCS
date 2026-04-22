import { useState, useEffect } from 'react';
import { Settings, ChevronDown, ChevronUp, AlertCircle, TrendingUp, FileText, CheckCircle } from 'lucide-react';
import { getGreeting } from '../utils/helpers';
import { getMorningNotes, filterNotesByCategory } from '../services/morningNotesService';
import ThemeToggle from '../components/ThemeToggle';
import './MainLayout.css';

const MainLayout = ({ children }) => {
  const [morningNotesExpanded, setMorningNotesExpanded] = useState(false);
  const [morningNotesData, setMorningNotesData] = useState({ summary: '', notes: [] });
  const [activeCategory, setActiveCategory] = useState('all');
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0);

  useEffect(() => {
    const fetchMorningNotes = async () => {
      const data = await getMorningNotes();
      setMorningNotesData(data);
      setFilteredNotes(data.notes);
    };
    fetchMorningNotes();
  }, []);

  useEffect(() => {
    if (morningNotesData.notes.length === 0) return;
    const interval = setInterval(() => {
      setCurrentNoteIndex((prev) => (prev + 1) % morningNotesData.notes.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [morningNotesData.notes.length]);

  const handleCategoryChange = (category) => {
    setActiveCategory(category);
    const categoryMap = {
      'all': 'all',
      'market': 'market-update',
      'client': 'client-alert',
      'portfolio': 'portfolio-action'
    };
    setFilteredNotes(filterNotesByCategory(morningNotesData.notes, categoryMap[category]));
  };

  const getNoteIcon = (type) => {
    switch(type) {
      case 'critical': return <AlertCircle size={16} />;
      case 'warning': return <TrendingUp size={16} />;
      case 'info': return <FileText size={16} />;
      case 'success': return <CheckCircle size={16} />;
      default: return <AlertCircle size={16} />;
    }
  };

  const currentNote = morningNotesData.notes[currentNoteIndex] || null;

  return (
    <div className="main-layout">
      <div className="main-layout__bg-gradient"></div>
      
      {/* Top Navigation Bar */}
      <header className="main-layout__header">
        {/* Left: Brand Logo */}
        <div className="main-layout__left">
          <div className="main-layout__brand">
            <div className="brand-logo">
              <span className="brand-logo-text">Wealth Advisor</span>
            </div>
          </div>
        </div>

        {/* Center: Ticker/Stats Bar */}
        <div className="main-layout__center-ticker">
          <div className="ticker-item">
            <span className="ticker-label">S&P 500</span>
            <span className="ticker-value ticker-value--positive">+0.02%</span>
          </div>
          <div className="ticker-divider" />
          <div className="ticker-item">
            <span className="ticker-label">Market Regime</span>
            <span className="ticker-value ticker-value--warning">Volatile</span>
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
          <div className="ticker-divider" />
          <div className="ticker-item">
            <span className="ticker-label">Active Agents</span>
            <span className="ticker-value">4</span>
          </div>
        </div>

        {/* Right: User Profile */}
        <div className="main-layout__right">
          <button className="main-layout__icon-btn">
            <Settings size={20} />
          </button>
          <ThemeToggle />
          <div className="main-layout__user-profile">
            <div className="user-profile-avatar">
              <img src="/wealthmanager.png" alt="Profile" />
            </div>
            <div className="user-profile-info">
              <span className="user-profile-greeting">{getGreeting()}</span>
              <span className="user-profile-name">John Doe</span>
            </div>
          </div>
        </div>
      </header>

      {/* Secondary Banner - Morning Notes */}
      <div className="main-layout__secondary-banner">
        <div className="morning-notes-banner">
          <div className="morning-notes-header" onClick={() => setMorningNotesExpanded(!morningNotesExpanded)}>
            <span className="morning-notes-label">Morning Notes</span>
            {currentNote && (
              <div className="cycling-note" key={currentNoteIndex}>
                <div className={`cycling-note-icon cycling-note-icon--${currentNote.type}`}>
                  {getNoteIcon(currentNote.type)}
                </div>
                <span className="cycling-note-text">{currentNote.title}</span>
              </div>
            )}
            <div className="morning-notes-actions">
              <div className="note-indicators">
                {morningNotesData.notes.map((_, idx) => (
                  <div 
                    key={idx} 
                    className={`note-indicator ${idx === currentNoteIndex ? 'note-indicator--active' : ''}`}
                  />
                ))}
              </div>
              <button className="morning-notes-expand-btn">
                {morningNotesExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
            </div>
          </div>
          
          {/* Overlay Dropdown */}
          {morningNotesExpanded && (
            <div className="morning-notes-dropdown">
              <div className="morning-notes-nav">
                <button 
                  className={`notes-nav-btn ${activeCategory === 'all' ? 'notes-nav-btn--active' : ''}`}
                  onClick={() => handleCategoryChange('all')}
                >
                  All Notes
                </button>
                <button 
                  className={`notes-nav-btn ${activeCategory === 'market' ? 'notes-nav-btn--active' : ''}`}
                  onClick={() => handleCategoryChange('market')}
                >
                  Market Updates
                </button>
                <button 
                  className={`notes-nav-btn ${activeCategory === 'client' ? 'notes-nav-btn--active' : ''}`}
                  onClick={() => handleCategoryChange('client')}
                >
                  Client Alerts
                </button>
                <button 
                  className={`notes-nav-btn ${activeCategory === 'portfolio' ? 'notes-nav-btn--active' : ''}`}
                  onClick={() => handleCategoryChange('portfolio')}
                >
                  Portfolio Actions
                </button>
              </div>
              <div className="morning-notes-content">
                {filteredNotes.map(note => (
                  <div key={note.id} className={`note-item note-item--${note.type}`}>
                    <div className={`note-icon-wrapper note-icon-wrapper--${note.type}`}>
                      {getNoteIcon(note.type)}
                    </div>
                    <div className="note-details">
                      <div className="note-header">
                        <h4>{note.title}</h4>
                        {note.actionRequired && <span className="note-badge">Action Required</span>}
                      </div>
                      <p>{note.description}</p>
                      <span className="note-timestamp">{new Date(note.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <main className="main-layout__content">
        {children}
      </main>
    </div>
  );
};

export default MainLayout;
