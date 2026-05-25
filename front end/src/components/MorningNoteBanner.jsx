import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, RefreshCw, ChevronDown, AlertTriangle, CheckCircle, Settings } from 'lucide-react';
import useMorningNotes from '../hooks/useMorningNotes';
import { activeMarketEvent } from '../data/marketEventData';
import MorningNotesSettingsModal from './MorningNotesSettingsModal';
import './MorningNoteBanner.css';

const MorningNoteBanner = () => {
  const { sections, loading, refreshing, refresh, isStale, topics } = useMorningNotes();
  const configSectors = (() => {
    try {
      const stored = localStorage.getItem('mn_config');
      if (stored) return JSON.parse(stored).sectors || [];
    } catch { /* ignore */ }
    return ['Macro', 'Equities', 'Fixed Income'];
  })();
  const [activeIdx, setActiveIdx] = useState(null);
  const [dropdownPos, setDropdownPos] = useState({ left: 0, top: 0 });
  const [popupSection, setPopupSection] = useState(null);
  const timeoutRef = useRef(null);
  const pillRefs = useRef([]);
  const pillsRef = useRef(null);
  const navigate = useNavigate();
  const [mailerCompleted, setMailerCompleted] = useState(() => localStorage.getItem('mailerEventCompleted') === 'true');
  const [showSettings, setShowSettings] = useState(false);
  const longPressRef = useRef(null);

  const handleRefreshMouseDown = () => {
    longPressRef.current = setTimeout(() => {
      longPressRef.current = 'fired';
      localStorage.removeItem('mailerEventCompleted');
      setMailerCompleted(false);
    }, 1500);
  };

  const handleRefreshMouseUp = () => {
    const didFire = longPressRef.current === 'fired';
    clearTimeout(longPressRef.current);
    longPressRef.current = null;
    if (!didFire && !refreshing) refresh();
  };

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

  const renderPill = (section, idx, refIdx) => (
    <div
      key={idx}
      ref={el => pillRefs.current[refIdx] = el}
      className={`mnb-pill${activeIdx === refIdx ? ' mnb-pill--active' : ''}`}
      onMouseEnter={() => handleMouseEnter(refIdx)}
      onMouseLeave={handleMouseLeave}
    >
      <div className="mnb-pill__text">
        <span className="mnb-pill__title">{section.title}</span>
        <span className="mnb-pill__subtitle">{section.impact || ''}</span>
      </div>
      <ChevronDown size={11} className="mnb-pill__chevron" />
    </div>
  );

  if (loading) {
    return (
      <div className="mnb-root mnb-root--loading">
        <div className="mnb-spinner" />
        <span>Loading morning notes...</span>
      </div>
    );
  }

  if (!sections.length) {
    return (
      <div className="mnb-root mnb-root--loading">
        <TrendingUp size={13} />
        <span style={{ marginLeft: 6, fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>No morning notes available</span>
        <button
          className="mnb-ctrl-btn"
          style={{ marginLeft: 'auto' }}
          onMouseDown={handleRefreshMouseDown}
          onMouseUp={handleRefreshMouseUp}
          onMouseLeave={() => { clearTimeout(longPressRef.current); longPressRef.current = null; }}
          disabled={refreshing}
        >
          <RefreshCw size={11} />
          <span>{refreshing ? 'Refreshing...' : 'Generate'}</span>
        </button>
      </div>
    );
  }

  const activeSection = activeIdx !== null ? sections[activeIdx] : null;

  return (
    <>
      <div className="mnb-root">

        <div className="mnb-label">
          <span className="mnb-label__title">
            <TrendingUp size={13} />
            Morning Notes
            {isStale && <span className="mnb-stale-badge">Yesterday</span>}
          </span>
          {configSectors.length > 0 && (
            <div className="mnb-topics">
              {configSectors.slice(0, 2).map(t => (
                <span key={t} className="mnb-topic-tag">{t}</span>
              ))}
              {configSectors.length > 2 && (
                <span className="mnb-topic-tag mnb-topic-tag--more">+{configSectors.length - 2}</span>
              )}
            </div>
          )}
        </div>

        <div className="mnb-divider" />

        <div className="mnb-pills" ref={pillsRef}>
          {/* First section pill */}
          {sections.slice(0, 1).map((section, idx) => renderPill(section, idx, idx))}

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

          {/* Remaining section pills */}
          {sections.slice(1).map((section, idx) => renderPill(section, idx + 1, idx + 1))}
        </div>

        <div className="mnb-divider" />

        <div className="mnb-ctrl-stack">
          <button className="mnb-ctrl-btn" onClick={() => setShowSettings(true)}>
            <Settings size={12} />
            <span>Configure</span>
          </button>
          <button
            className={`mnb-ctrl-btn${refreshing ? ' mnb-ctrl-btn--spinning' : ''}`}
            onMouseDown={handleRefreshMouseDown}
            onMouseUp={handleRefreshMouseUp}
            onMouseLeave={() => { clearTimeout(longPressRef.current); longPressRef.current = null; }}
            onTouchStart={handleRefreshMouseDown}
            onTouchEnd={handleRefreshMouseUp}
            disabled={refreshing}
          >
            <RefreshCw size={12} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>

      </div>

      {showSettings && (
        <MorningNotesSettingsModal
          onClose={() => setShowSettings(false)}
          onSaveAndRefresh={() => { setShowSettings(false); refresh(); }}
        />
      )}

      {/* Dropdown — fixed position, outside overflow:hidden */}
      {activeSection && (
        <div
          className="mnb-dropdown"
          style={{ left: dropdownPos.left, top: dropdownPos.top }}
          onMouseEnter={() => { clearTimeout(timeoutRef.current); }}
          onMouseLeave={handleMouseLeave}
        >
          <p className="mnb-dropdown__impact">{activeSection.impact}</p>
          {activeSection.detail?.length > 0 && (
            <ul className="mnb-dropdown__detail">
              {activeSection.detail.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          )}
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
              <p className="mnb-popup__impact">{popupSection.impact}</p>
              {popupSection.detail?.map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MorningNoteBanner;
