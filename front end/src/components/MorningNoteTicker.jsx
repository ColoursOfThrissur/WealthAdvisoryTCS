import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, RefreshCw, FileText, ExternalLink } from 'lucide-react';
import useMorningNotes from '../hooks/useMorningNotes';
import './MorningNoteTicker.css';

const CYCLE_INTERVAL_MS = 6000;

// Renders a few lines of section content as a plain-text preview
const SectionPreview = ({ content = [] }) => {
  const lines = content
    .filter((l) => l.trim())
    .slice(0, 4);

  return (
    <div className="mnt-preview__body">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <p key={i} className="mnt-preview__line mnt-preview__line--bullet">
              {trimmed.slice(2)}
            </p>
          );
        }
        return (
          <p key={i} className="mnt-preview__line">
            {trimmed.replace(/\*\*([^*]+)\*\*/g, '$1')}
          </p>
        );
      })}
    </div>
  );
};

const MorningNoteTicker = () => {
  const navigate = useNavigate();
  const { sections, loading, refreshing, error, lastUpdated, refresh } = useMorningNotes();

  const [activeIdx, setActiveIdx] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const intervalRef = useRef(null);
  const dropdownRef = useRef(null);

  // Clamp activeIdx when sections load
  useEffect(() => {
    if (sections.length > 0 && activeIdx >= sections.length) {
      setActiveIdx(0);
    }
  }, [sections.length, activeIdx]);

  const startCycle = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % Math.max(sections.length, 1));
    }, CYCLE_INTERVAL_MS);
  }, [sections.length]);

  // Auto-cycle — pause when dropdown is open
  useEffect(() => {
    if (sections.length <= 1 || isOpen) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    startCycle();
    return () => clearInterval(intervalRef.current);
  }, [sections.length, isOpen, startCycle]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const animateChange = (newIdx) => {
    setIsAnimating(true);
    setTimeout(() => {
      setActiveIdx(newIdx);
      setIsAnimating(false);
    }, 150);
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    const newIdx = (activeIdx - 1 + sections.length) % sections.length;
    animateChange(newIdx);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!isOpen) startCycle();
  };

  const handleNext = (e) => {
    e.stopPropagation();
    const newIdx = (activeIdx + 1) % sections.length;
    animateChange(newIdx);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!isOpen) startCycle();
  };

  const handleDotClick = (idx) => {
    animateChange(idx);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!isOpen) startCycle();
  };

  const handleReadMore = () => {
    setIsOpen(false);
    navigate('/morning-notes');
  };

  const formatTime = (iso) => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="mnt mnt--loading" aria-label="Loading morning notes">
        <div className="mnt__skeleton">
          <div className="mnt__skeleton-label" />
          <div className="mnt__skeleton-text" />
          <div className="mnt__skeleton-dots" />
        </div>
      </div>
    );
  }

  // ── Error / empty state ───────────────────────────────────────────────────
  if (error || sections.length === 0) {
    return (
      <div className="mnt mnt--empty">
        <FileText size={14} className="mnt__empty-icon" />
        <span className="mnt__empty-text">Morning notes unavailable</span>
        <button
          className="mnt__refresh-btn"
          onClick={refresh}
          disabled={refreshing}
          aria-label="Retry loading morning notes"
        >
          <RefreshCw size={13} className={refreshing ? 'mnt__spin' : ''} />
        </button>
      </div>
    );
  }

  const activeSection = sections[activeIdx] || sections[0];

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <div className="mnt" ref={dropdownRef}>
      {/* ── Ticker bar ── */}
      <div
        className={`mnt__bar ${isOpen ? 'mnt__bar--open' : ''}`}
        role="region"
        aria-label="Morning notes ticker"
      >
        {/* Label */}
        <span className="mnt__label">Morning Notes</span>

        {/* Prev arrow */}
        {sections.length > 1 && (
          <button
            className="mnt__nav-btn"
            onClick={handlePrev}
            aria-label="Previous note"
          >
            <ChevronLeft size={14} />
          </button>
        )}

        {/* Section title — clickable to toggle dropdown */}
        <button
          className={`mnt__title-btn ${isAnimating ? 'mnt__title-btn--fade' : ''}`}
          onClick={() => setIsOpen((o) => !o)}
          aria-expanded={isOpen}
          aria-controls="mnt-dropdown"
        >
          <span className="mnt__title-text">{activeSection.title}</span>
        </button>

        {/* Next arrow */}
        {sections.length > 1 && (
          <button
            className="mnt__nav-btn"
            onClick={handleNext}
            aria-label="Next note"
          >
            <ChevronRight size={14} />
          </button>
        )}

        {/* Dot indicators */}
        {sections.length > 1 && (
          <div className="mnt__dots" role="tablist" aria-label="Note sections">
            {sections.map((_, i) => (
              <button
                key={i}
                role="tab"
                aria-selected={i === activeIdx}
                aria-label={`Section ${i + 1}: ${sections[i].title}`}
                className={`mnt__dot ${i === activeIdx ? 'mnt__dot--active' : ''}`}
                onClick={() => handleDotClick(i)}
              />
            ))}
          </div>
        )}

        {/* Refresh */}
        <button
          className="mnt__refresh-btn"
          onClick={(e) => { e.stopPropagation(); refresh(); }}
          disabled={refreshing}
          aria-label="Refresh morning notes"
          title="Refresh morning notes"
        >
          <RefreshCw size={13} className={refreshing ? 'mnt__spin' : ''} />
        </button>

        {/* Expand toggle */}
        <button
          className="mnt__expand-btn"
          onClick={() => setIsOpen((o) => !o)}
          aria-label={isOpen ? 'Collapse preview' : 'Expand preview'}
        >
          {isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
      </div>

      {/* ── Dropdown preview ── */}
      {isOpen && (
        <div
          id="mnt-dropdown"
          className="mnt__dropdown"
          role="region"
          aria-label={`Preview: ${activeSection.title}`}
        >
          <div className="mnt__preview">
            <div className="mnt__preview-header">
              <span className="mnt__preview-title">{activeSection.title}</span>
              {lastUpdated && (
                <span className="mnt__preview-time">
                  Updated {formatTime(lastUpdated)}
                </span>
              )}
            </div>

            <SectionPreview content={activeSection.content} />

            <button
              className="mnt__read-more"
              onClick={handleReadMore}
              aria-label="Read full morning briefing"
            >
              <span>Read full briefing</span>
              <ExternalLink size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MorningNoteTicker;
