import { useState, useRef } from 'react';
import { FileText, RefreshCw, AlertTriangle, X } from 'lucide-react';
import { activeMarketEvent } from '../data/marketEventData';
import useMorningNotes from '../hooks/useMorningNotes';
import './MorningNoteCard.css';

const MorningNoteCard = ({ onEventClick, eventCompleted, hideCompletedEvent, onResetMailer }) => {
  const { sections, loading, refreshing, refresh } = useMorningNotes();
  const [showPopup, setShowPopup] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);

  // Hold-to-reset-mailer / click-to-refresh logic
  const holdTimer = useRef(null);
  const holdFired = useRef(false);

  const handleMouseDown = () => {
    holdFired.current = false;
    holdTimer.current = setTimeout(() => {
      holdFired.current = true;
      localStorage.removeItem('mailerEventCompleted');
      onResetMailer?.();
    }, 1500);
  };

  const handleMouseUp = () => {
    clearTimeout(holdTimer.current);
    if (!holdFired.current && !refreshing && !loading) {
      refresh();
    }
  };

  const handleMouseLeave = () => clearTimeout(holdTimer.current);

  const formatBoldText = (text) => {
    const parts = [];
    let lastIndex = 0;
    const regex = /\*\*([^*]+)\*\*/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) parts.push(text.substring(lastIndex, match.index));
      parts.push(<strong key={match.index}>{match[1]}</strong>);
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) parts.push(text.substring(lastIndex));
    return parts.length > 0 ? parts : text;
  };

  const renderSectionContent = (section) => {
    if (!section) return null;
    return section.content.map((line, idx) => {
      if (line.startsWith('### ')) return <h3 key={idx}>{line.substring(4)}</h3>;
      if (line.startsWith('#### ')) return <h4 key={idx}>{line.substring(5)}</h4>;
      if (line.startsWith('- ')) return <li key={idx}>{formatBoldText(line.substring(2))}</li>;
      if (line.trim()) return <p key={idx}>{formatBoldText(line)}</p>;
      return null;
    });
  };

  return (
    <>
      <div className="morning-note-card">
        <div className="morning-note-card__header">
          <div className="header-left">
            <FileText size={20} />
            <div className="morning-note-card__titles">
              <h3>Morning Notes</h3>
              <p className="morning-note-card__subtitle">Today's market insights & key updates</p>
            </div>
          </div>
          <button
            className={`refresh-btn ${refreshing ? 'spinning' : ''}`}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleMouseDown}
            onTouchEnd={handleMouseUp}
            disabled={loading}
            title="Click to refresh · Hold to reset mailer"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        {loading && (
          <div className="morning-note-card__loading">
            <div className="spinner"></div>
            <p>Loading today's market insights...</p>
          </div>
        )}

        {!loading && sections.length > 0 && (
          <div className="morning-note-card__summary">
            {sections.slice(0, 1).map((section, idx) => (
              <div key={idx} className="summary-item" onClick={() => { setSelectedSection(section); setShowPopup(true); }}>
                <div className="summary-item__content">
                  <span className="summary-title">{section.title}</span>
                  <p className="summary-desc">
                    {section.content.find(l => l.trim() && !l.startsWith('#'))?.replace(/\*\*/g, '').substring(0, 120) || ''}
                  </p>
                </div>
                <span className="summary-view-more">View More</span>
              </div>
            ))}
          </div>
        )}

        {!loading && sections.length === 0 && (
          <div className="morning-note-card__empty">
            <p>Morning notes not available</p>
          </div>
        )}

        {/* Mass Mailer Event */}
        {!hideCompletedEvent && localStorage.getItem('mailerEventCompleted') !== 'true' && (
          <div className="morning-note-card__events">
            {eventCompleted ? (
              <div className="event-item event-item--resolved">
                <div className="event-item__content">
                  <span className="event-item__title">Event Resolved</span>
                  <p className="event-item__desc">Communications sent successfully to all affected clients.</p>
                </div>
              </div>
            ) : (
              <div className="event-item">
                <div className="event-item__header">
                  <AlertTriangle size={13} className="event-item__icon" />
                  <span className="event-item__label">Market Alert</span>
                </div>
                <div className="event-item__content">
                  <span className="event-item__title">{activeMarketEvent.title}</span>
                  <p className="event-item__desc">{activeMarketEvent.description?.substring(0, 100)}</p>
                </div>
                <button className="event-item__action" onClick={() => onEventClick?.(activeMarketEvent.id)}>
                  ...view more
                </button>
              </div>
            )}
          </div>
        )}

        {!loading && sections.length > 1 && (
          <div className="morning-note-card__summary">
            {sections.slice(1, 3).map((section, idx) => (
              <div key={idx + 1} className="summary-item" onClick={() => { setSelectedSection(section); setShowPopup(true); }}>
                <div className="summary-item__content">
                  <span className="summary-title">{section.title}</span>
                  <p className="summary-desc">
                    {section.content.find(l => l.trim() && !l.startsWith('#'))?.replace(/\*\*/g, '').substring(0, 120) || ''}
                  </p>
                </div>
                <span className="summary-view-more">View More</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {showPopup && selectedSection && (
        <div className="morning-note-popup-overlay" onClick={() => { setShowPopup(false); setSelectedSection(null); }}>
          <div className="morning-note-popup" onClick={e => e.stopPropagation()}>
            <div className="morning-note-popup__header">
              <h3>{selectedSection.title}</h3>
              <button onClick={() => { setShowPopup(false); setSelectedSection(null); }} className="close-btn">
                <X size={20} />
              </button>
            </div>
            <div className="morning-note-popup__content">
              {renderSectionContent(selectedSection)}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MorningNoteCard;
