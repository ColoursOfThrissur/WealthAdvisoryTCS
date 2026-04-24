import { useState, useRef, useEffect } from 'react';
import { TrendingUp, RefreshCw, ChevronDown } from 'lucide-react';
import useMorningNotes from '../hooks/useMorningNotes';
import './MorningNoteBanner.css';

const MorningNoteBanner = () => {
  const { sections, loading, refreshing, refresh } = useMorningNotes();
  const [activeIdx, setActiveIdx] = useState(null);
  const [dropdownPos, setDropdownPos] = useState({ left: 0, top: 0 });
  const [popupSection, setPopupSection] = useState(null);
  const timeoutRef = useRef(null);
  const pillRefs = useRef([]);

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

  // Close on scroll
  useEffect(() => {
    const close = () => setActiveIdx(null);
    window.addEventListener('scroll', close, true);
    return () => window.removeEventListener('scroll', close, true);
  }, []);

  const getPreview = (section) =>
    section.content
      .filter(l => l.trim())
      .slice(0, 3)
      .join(' ')
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

        <div className="mnb-pills">
          {sections.map((section, idx) => (
            <div
              key={idx}
              ref={el => pillRefs.current[idx] = el}
              className={`mnb-pill${activeIdx === idx ? ' mnb-pill--active' : ''}`}
              onMouseEnter={() => handleMouseEnter(idx)}
              onMouseLeave={handleMouseLeave}
            >
              <span className="mnb-pill__title">{section.title}</span>
              <ChevronDown size={11} className="mnb-pill__chevron" />
            </div>
          ))}
        </div>

        <button
          className={`mnb-refresh${refreshing ? ' mnb-refresh--spinning' : ''}`}
          onClick={refresh}
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
          <p className="mnb-dropdown__title">{activeSection.title}</p>
          <p className="mnb-dropdown__preview">{getPreview(activeSection)}</p>
          <button
            className="mnb-dropdown__more"
            onClick={() => { setPopupSection(activeSection); setActiveIdx(null); }}
          >
            View full note →
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
