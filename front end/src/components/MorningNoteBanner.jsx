import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, RefreshCw, ChevronDown, AlertTriangle, CheckCircle } from 'lucide-react';
import useMorningNotes from '../hooks/useMorningNotes';
import { activeMarketEvent } from '../data/marketEventData';
import './MorningNoteBanner.css';

const MorningNoteBanner = () => {
  const { sections, loading, refreshing, refresh } = useMorningNotes();
  const [activeIdx, setActiveIdx] = useState(null);
  const [dropdownPos, setDropdownPos] = useState({ left: 0, top: 0 });
  const [popupSection, setPopupSection] = useState(null);
  const timeoutRef = useRef(null);
  const pillRefs = useRef([]);
  const pillsRef = useRef(null);
  const navigate = useNavigate();
  const [mailerCompleted, setMailerCompleted] = useState(() => localStorage.getItem('mailerEventCompleted') === 'true');
  const longPressRef = useRef(null);

  const handleRefreshMouseDown = () => {
    longPressRef.current = setTimeout(() => {
      localStorage.removeItem('mailerEventCompleted');
      setMailerCompleted(false);
      window.location.reload();
    }, 1000);
  };

  const handleRefreshMouseUp = () => clearTimeout(longPressRef.current);

  const handleMouseEnter = (idx) => {
    clearTimeout(timeoutRef.current);
    const pill = pillRefs.current[idx];
    if (pill) {
      const rect = pill.getBoundingClientRect();
      setDropdownPos({ left: rect.left, top: rect.bottom + 6 });
    }
    setActiveIdx(idx);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setActiveIdx(null), 150);
  };

  // Convert vertical mouse wheel to horizontal scroll on pills
  useEffect(() => {
    const el = pillsRef.current;
    if (!el) return;
    const onWheel = (e) => {
      if (Math.abs(e.deltaY) > 0) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [sections]);

  useEffect(() => {
    const close = () => setActiveIdx(null);
    window.addEventListener('scroll', close, true);
    return () => window.removeEventListener('scroll', close, true);
  }, []);

  const getPreview = (section) =>
    (section.content.filter(l => l.trim())[1] || section.content.filter(l => l.trim())[0] || '')
      .replace(/\*\*/g, '')
      .slice(0, 200);

  if (loading) {
    return (
      <div className="mnb-root mnb-root--loading">
        <div className="mnb-spinner" />
        <span>Loading morning notes...</span>
      </div>
    );
  }

  if (!sections.length) return null;

  const activeSection = activeIdx !== null ? sections[activeIdx] : null;

  return (
    <>
      <div className="mnb-root">
        <div className="mnb-label">
          <TrendingUp size={13} />
          <span>Morning Notes</span>
        </div>

        <div className="mnb-divider" />

        <div className="mnb-pills" ref={pillsRef}>
          {sections.map((section, idx) => (
            <div
              key={idx}
              ref={el => pillRefs.current[idx] = el}
              className={`mnb-pill${activeIdx === idx ? ' mnb-pill--active' : ''}`}
              onMouseEnter={() => handleMouseEnter(idx)}
              onMouseLeave={handleMouseLeave}
            >
              <div className="mnb-pill__text">
                <span className="mnb-pill__title">{section.title}</span>
                <span className="mnb-pill__subtitle">
                  {section.content.find(l => l.trim() && !l.startsWith('#'))?.replace(/\*\*/g, '').substring(0, 120) || ''}
                </span>
              </div>
              <ChevronDown size={11} className="mnb-pill__chevron" />
            </div>
          ))}

          {/* Market event pill */}
          <div
            className={`mnb-pill${!mailerCompleted ? ' mnb-pill--event' : ''}`}
            onClick={() => navigate('/?event=mailer')}
          >
            {mailerCompleted
              ? <CheckCircle size={11} className="mnb-pill__event-icon" />
              : <AlertTriangle size={11} className="mnb-pill__event-icon" />}
            <div className="mnb-pill__text">
              <span className="mnb-pill__title">{activeMarketEvent.title} — Mass Mailer</span>
              <span className="mnb-pill__subtitle">{mailerCompleted ? 'Completed' : activeMarketEvent.subtitle}</span>
            </div>
          </div>
        </div>

        <button
          className={`mnb-refresh${refreshing ? ' mnb-refresh--spinning' : ''}`}
          onClick={refresh}
          onMouseDown={handleRefreshMouseDown}
          onMouseUp={handleRefreshMouseUp}
          onMouseLeave={handleRefreshMouseUp}
          title="Refresh morning notes"
        >
          <RefreshCw size={13} />
        </button>
      </div>

      {/* Dropdown — fixed position, outside overflow:hidden */}
      {activeSection && (
        <div
          className="mnb-dropdown"
          style={{ left: dropdownPos.left, top: dropdownPos.top }}
          onMouseEnter={() => { clearTimeout(timeoutRef.current); }}
          onMouseLeave={handleMouseLeave}
        >
          <p className="mnb-dropdown__preview">{getPreview(activeSection)}</p>
          <button
            className="mnb-dropdown__more"
            onClick={() => { setPopupSection(activeSection); setActiveIdx(null); }}
          >
            View More
          </button>
        </div>
      )}

      {/* Full note popup */}
      {popupSection && (
        <div className="mnb-popup-overlay" onClick={() => setPopupSection(null)}>
          <div className="mnb-popup" onClick={e => e.stopPropagation()}>
            <div className="mnb-popup__head">
              <span>{popupSection.title}</span>
              <button onClick={() => setPopupSection(null)}>✕</button>
            </div>
            <div className="mnb-popup__body">
              {popupSection.content.filter(l => l.trim()).map((line, i) => (
                <p key={i}>{line.replace(/\*\*/g, '')}</p>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MorningNoteBanner;
