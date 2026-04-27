import { useState, useEffect, useRef } from 'react';
import { FileText, ChevronRight, X, RefreshCw, AlertTriangle } from 'lucide-react';
import { getApiUrl } from '../config/api';
import { activeMarketEvent } from '../data/marketEventData';
import './MorningNoteCard.css';

const MorningNoteCard = ({ onEventClick, eventCompleted, hideCompletedEvent }) => {
  const [noteData, setNoteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const hasFetched = useRef(false);

  // Check cache and fetch if needed
  const fetchMorningNote = async (forceRefresh = false) => {
    try {
      const today = new Date().toDateString();
      const cacheKey = 'morningNote_cache';
      const cacheDateKey = 'morningNote_date';
      
      // Check cache if not forcing refresh
      if (!forceRefresh) {
        const cachedDate = localStorage.getItem(cacheDateKey);
        const cachedData = localStorage.getItem(cacheKey);
        
        if (cachedDate === today && cachedData) {
          console.log('[MORNING NOTE] Using cached data from today');
          setNoteData(JSON.parse(cachedData));
          setLoading(false);
          return;
        }
      }
      
      console.log('[MORNING NOTE] Fetching from backend...');
      const endpoint = getApiUrl('/api/morning-notes');
      console.log('[MORNING NOTE] Endpoint:', endpoint);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_name: 'advisor' })
      });

      console.log('[MORNING NOTE] Response status:', response.status);
      
      if (!response.ok) {
        throw new Error('Failed to fetch morning note');
      }

      const result = await response.json();
      console.log('[MORNING NOTE] Response:', result);
      
      if (result.success && result.data) {
        const data = result.data;
        
        // Check if it's an error message from backend
        const isErrorMessage = data.output && (
          data.output.includes('experiencing issues') ||
          data.output.includes('cannot access') ||
          data.output.includes('try again later') ||
          data.output.includes('apologize for the inconvenience') ||
          data.output.includes('technical issue') ||
          data.output.includes('tool failure') ||
          data.output.includes('unable to complete')
        );

        if (isErrorMessage) {
          console.warn('[MORNING NOTE] Backend error detected');
          setNoteData(null);
        } else {
          console.log('[MORNING NOTE] Using backend response');
          setNoteData(data);
          // Cache the successful response
          localStorage.setItem(cacheKey, JSON.stringify(data));
          localStorage.setItem(cacheDateKey, today);
        }
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('[MORNING NOTE] Error fetching morning note:', err);
      setNoteData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
      console.log('[MORNING NOTE] Fetch complete');
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    hasFetched.current = false;
    fetchMorningNote(true);
  };

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchMorningNote();
    }
  }, []);

  const extractSections = () => {
    if (!noteData?.output) return [];
    
    const lines = noteData.output.split('\n');
    const sections = [];
    let currentSection = null;

    lines.forEach(line => {
      const trimmed = line.trim();
      
      // Check for bold headers: **Section Name**
      if (trimmed.startsWith('**') && trimmed.endsWith('**') && trimmed.length > 4) {
        // Extract title without the ** markers
        const title = trimmed.slice(2, -2);
        
        // Only treat as section if it's a key section (not inline bold text)
        if (title.includes('Top Call') || 
            title.includes('Overnight') || 
            title.includes('Pre-Market') || 
            title.includes('Key Events') || 
            title.includes('Trade Ideas') || 
            title.includes('Market Recap') ||
            title.includes('Macro')) {
          if (currentSection) sections.push(currentSection);
          currentSection = { title: title, content: [] };
        } else if (currentSection) {
          currentSection.content.push(line);
        }
      } else if (currentSection && trimmed) {
        currentSection.content.push(line);
      }
    });
    
    if (currentSection) sections.push(currentSection);
    return sections;
  };

  const renderSectionContent = (section) => {
    if (!section) return null;
    
    // Helper function to convert **text** to <strong>text</strong>
    const formatBoldText = (text) => {
      const parts = [];
      let lastIndex = 0;
      const regex = /\*\*([^*]+)\*\*/g;
      let match;
      
      while ((match = regex.exec(text)) !== null) {
        // Add text before the match
        if (match.index > lastIndex) {
          parts.push(text.substring(lastIndex, match.index));
        }
        // Add the bold text
        parts.push(<strong key={match.index}>{match[1]}</strong>);
        lastIndex = match.index + match[0].length;
      }
      
      // Add remaining text
      if (lastIndex < text.length) {
        parts.push(text.substring(lastIndex));
      }
      
      return parts.length > 0 ? parts : text;
    };
    
    return section.content.map((line, idx) => {
      if (line.startsWith('### ')) {
        return <h3 key={idx}>{line.substring(4)}</h3>;
      } else if (line.startsWith('#### ')) {
        return <h4 key={idx}>{line.substring(5)}</h4>;
      } else if (line.startsWith('- ')) {
        return <li key={idx}>{formatBoldText(line.substring(2))}</li>;
      } else if (line.trim()) {
        return <p key={idx}>{formatBoldText(line)}</p>;
      }
      return null;
    });
  };

  const renderFullContent = () => {
    if (!noteData?.output) return null;
    
    // Helper function to convert **text** to <strong>text</strong>
    const formatBoldText = (text) => {
      const parts = [];
      let lastIndex = 0;
      const regex = /\*\*([^*]+)\*\*/g;
      let match;
      
      while ((match = regex.exec(text)) !== null) {
        // Add text before the match
        if (match.index > lastIndex) {
          parts.push(text.substring(lastIndex, match.index));
        }
        // Add the bold text
        parts.push(<strong key={match.index}>{match[1]}</strong>);
        lastIndex = match.index + match[0].length;
      }
      
      // Add remaining text
      if (lastIndex < text.length) {
        parts.push(text.substring(lastIndex));
      }
      
      return parts.length > 0 ? parts : text;
    };
    
    // Filter out internal checklist and metadata
    const lines = noteData.output.split('\n').filter(line => {
      const trimmed = line.trim();
      // Skip separator lines
      if (trimmed === '---' || trimmed === '***') return false;
      // Skip checklist section
      if (trimmed.includes('Completeness Checklist') || 
          trimmed.includes('***Completeness Checklist***')) return false;
      // Skip checklist items
      if (trimmed.match(/^\[x\]|^\[ \]/i)) return false;
      // Skip note about checklist
      if (trimmed.startsWith('*Note:') && trimmed.includes('checklist')) return false;
      return true;
    });
    
    return lines.map((line, idx) => {
      if (line.startsWith('### ')) {
        return <h3 key={idx}>{line.substring(4)}</h3>;
      } else if (line.startsWith('#### ')) {
        return <h4 key={idx}>{line.substring(5)}</h4>;
      } else if (line.startsWith('- ')) {
        return <li key={idx}>{formatBoldText(line.substring(2))}</li>;
      } else if (line.trim()) {
        return <p key={idx}>{formatBoldText(line)}</p>;
      }
      return null;
    });
  };

  const sections = extractSections();

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
            onClick={handleRefresh}
            disabled={refreshing || loading}
            title="Refresh morning notes"
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
        {!loading && noteData && sections.length > 0 && (
          <div className="morning-note-card__summary">
            {sections.slice(0, 3).map((section, idx) => (
              <div
                key={idx}
                className="summary-item"
                onClick={() => { setSelectedSection(section); setShowPopup(true); }}
              >
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
        {!loading && (!noteData || sections.length === 0) && (
          <div className="morning-note-card__empty">
            <p>Morning notes not available</p>
          </div>
        )}

        {/* Mass Mailer Event */}
        {!hideCompletedEvent && (
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
                <button
                  className="event-item__action"
                  onClick={() => onEventClick?.(activeMarketEvent.id)}
                >
                  ...view more
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {showPopup && selectedSection && (
        <div className="morning-note-popup-overlay" onClick={() => {
          setShowPopup(false);
          setSelectedSection(null);
        }}>
          <div className="morning-note-popup" onClick={(e) => e.stopPropagation()}>
            <div className="morning-note-popup__header">
              <h3>{selectedSection.title}</h3>
              <button onClick={() => {
                setShowPopup(false);
                setSelectedSection(null);
              }} className="close-btn">
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
