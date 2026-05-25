import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { SlidersHorizontal, X, RotateCcw } from 'lucide-react';
import { getApiUrl } from '../config/api';
import './MorningNotesSettingsModal.css';

import { MORNING_NOTE_DEFAULTS } from '../config/morningNotesDefaults';
export { MORNING_NOTE_DEFAULTS };

const ALL_SECTORS = ['Macro', 'Equities', 'Fixed Income', 'Tech', 'Healthcare', 'Energy', 'Crypto', 'Real Estate'];
const ALL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TIMEZONES = ['US/Eastern', 'US/Central', 'US/Mountain', 'US/Pacific', 'Europe/London', 'Asia/Singapore', 'Asia/Tokyo'];

const TABS = ['Content', 'Format', 'Schedule'];

const MorningNotesSettingsModal = ({ onClose, onSaveAndRefresh }) => {
  const [activeTab, setActiveTab] = useState('Content');
  const [config, setConfig] = useState(MORNING_NOTE_DEFAULTS);
  const [tickerInput, setTickerInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [lastRun, setLastRun] = useState(null);

  // Load config on open
  useEffect(() => {
    const local = localStorage.getItem('mn_config');
    if (local) {
      try { setConfig(JSON.parse(local)); return; } catch { /* fall through */ }
    }
    // Try backend
    fetch(getApiUrl('/api/morning-notes/config'))
      .then(r => r.json())
      .then(d => { if (d.success) setConfig(d.config); })
      .catch(() => {});
  }, []);

  // Load last run info
  useEffect(() => {
    fetch(getApiUrl('/api/morning-notes/history?limit=1'))
      .then(r => r.json())
      .then(d => { if (d.success && d.history?.length) setLastRun(d.history[0]); })
      .catch(() => {});
  }, []);

  const update = (path, value) => {
    setConfig(prev => {
      const next = { ...prev };
      const keys = path.split('.');
      let obj = next;
      for (let i = 0; i < keys.length - 1; i++) {
        obj[keys[i]] = { ...obj[keys[i]] };
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const toggleSector = s => {
    const cur = config.sectors || [];
    update('sectors', cur.includes(s) ? cur.filter(x => x !== s) : [...cur, s]);
  };

  const toggleDay = d => {
    const cur = config.schedule?.days || [];
    update('schedule.days', cur.includes(d) ? cur.filter(x => x !== d) : [...cur, d]);
  };

  const addTicker = () => {
    const t = tickerInput.trim().toUpperCase();
    if (!t || (config.tickers || []).includes(t) || (config.tickers || []).length >= 10) return;
    update('tickers', [...(config.tickers || []), t]);
    setTickerInput('');
  };

  const removeTicker = t => update('tickers', (config.tickers || []).filter(x => x !== t));

  const handleReset = () => {
    setConfig(MORNING_NOTE_DEFAULTS);
    setTickerInput('');
  };

  const handleSave = async (andRefresh = false) => {
    setSaving(true);
    try {
      localStorage.setItem('mn_config', JSON.stringify(config));
      // Clear today's cache so refresh generates a fresh note with new config
      if (andRefresh) {
        localStorage.removeItem('mn_cache');
        localStorage.removeItem('mn_date');
        localStorage.removeItem('mn_hash');
      }
      await fetch(getApiUrl('/api/morning-notes/config'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (andRefresh) {
        onSaveAndRefresh?.(config);
      }
      onClose();
    } catch {
      // Config saved to localStorage even if backend fails
      if (andRefresh) onSaveAndRefresh?.(config);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const nextRunLabel = () => {
    const job = config.schedule;
    if (job?.paused) return 'Paused';
    if (!job?.morning_time) return '—';
    return `${job.morning_time} ${job.timezone || 'EST'} on ${(job.days || []).join(', ')}`;
  };

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-shell modal-shell--wide" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="modal-header">
          <div className="modal-header__left">
            <div className="modal-header__icon"><SlidersHorizontal size={15} /></div>
            <div className="modal-header__titles">
              <span className="modal-header__title">Morning Notes Settings</span>
              <span className="modal-header__subtitle">Configure what your morning note covers</span>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}><X size={14} /></button>
        </div>

        {/* Tabs */}
        <div className="ov-settings-tabs">
          {TABS.map(t => (
            <button
              key={t}
              className={`ov-settings-tab${activeTab === t ? ' ov-settings-tab--active' : ''}`}
              onClick={() => setActiveTab(t)}
            >{t}</button>
          ))}
        </div>

        {/* Body */}
        <div className="modal-body" style={{ padding: 0 }}>

          {/* ── CONTENT TAB ── */}
          {activeTab === 'Content' && (
            <div className="mn-section-stack">

              <div className="mn-section">
                <span className="mn-label">Sectors to Watch</span>
                <span className="mn-desc">Select which sectors the AI should prioritise</span>
                <div className="mn-chips">
                  {ALL_SECTORS.map(s => (
                    <button
                      key={s}
                      className={`mn-chip${(config.sectors || []).includes(s) ? ' mn-chip--on' : ''}`}
                      onClick={() => toggleSector(s)}
                    >{s}</button>
                  ))}
                </div>
              </div>

              <div className="mn-divider" />

              <div className="mn-section">
                <span className="mn-label">Ticker Watchlist</span>
                <span className="mn-desc">Flag specific stocks — max 10</span>
                <div className="mn-ticker-row">
                  <input
                    className="mn-ticker-input"
                    placeholder="e.g. NVDA"
                    value={tickerInput}
                    onChange={e => setTickerInput(e.target.value.toUpperCase())}
                    onKeyDown={e => e.key === 'Enter' && addTicker()}
                    maxLength={6}
                  />
                  <button className="mn-ticker-add" onClick={addTicker}>Add</button>
                </div>
                <div className="mn-chips">
                  {(config.tickers || []).map(t => (
                    <button key={t} className="mn-chip mn-chip--ticker mn-chip--on" onClick={() => removeTicker(t)}>
                      {t} <span className="mn-chip__x">×</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mn-divider" />

              <div className="mn-section">
                <span className="mn-label">Market Geography</span>
                <div className="mn-radio-row">
                  {['US', 'Global', 'Asia-Pacific', 'Europe'].map(g => (
                    <label key={g} className={`mn-radio${config.geography === g ? ' mn-radio--active' : ''}`}>
                      <input type="radio" name="geo" value={g} checked={config.geography === g} onChange={() => update('geography', g)} />
                      {g}
                    </label>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* ── FORMAT TAB ── */}
          {activeTab === 'Format' && (
            <div className="mn-section-stack">

              <div className="mn-section">
                <span className="mn-label">Tone</span>
                <span className="mn-desc">How the AI writes the note</span>
                <div className="mn-tone-cards">
                  {[
                    { id: 'brief', title: 'Brief', desc: 'Bullet points only · 2-min read · under 400 words' },
                    { id: 'balanced', title: 'Balanced', desc: 'Mix of bullets and short paragraphs · under 700 words' },
                    { id: 'detailed', title: 'Detailed', desc: 'Full paragraphs with reasoning · up to 1200 words' },
                  ].map(t => (
                    <div
                      key={t.id}
                      className={`mn-tone-card${config.tone === t.id ? ' mn-tone-card--active' : ''}`}
                      onClick={() => update('tone', t.id)}
                    >
                      <span className="mn-tone-card__title">{t.title}</span>
                      <span className="mn-tone-card__desc">{t.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mn-divider" />

              <div className="mn-section">
                <span className="mn-label">Sections to Include</span>
                <span className="mn-desc">Toggle which sections appear in your note</span>
                <div className="mn-section-list">
                  {[
                    { key: 'top_call', label: 'Top Call', locked: true },
                    { key: 'overnight', label: 'Overnight / Pre-Market Developments' },
                    { key: 'key_events', label: 'Key Events Today' },
                    { key: 'macro_rates', label: 'Macro & Rates' },
                    { key: 'trade_ideas', label: 'Trade Ideas' },
                    { key: 'earnings_table', label: 'Earnings Table' },
                  ].map(({ key, label, locked }) => (
                    <div key={key} className={`mn-section-row${locked ? ' mn-section-row--locked' : ''}`}>
                      <label className="mn-toggle">
                        <input
                          type="checkbox"
                          checked={locked ? true : (config.sections?.[key] ?? false)}
                          disabled={locked}
                          onChange={e => !locked && update(`sections.${key}`, e.target.checked)}
                        />
                        <span className="mn-toggle-slider" />
                      </label>
                      <span className="mn-section-row__label">{label}</span>
                      {locked && <span className="mn-locked-badge">Always on</span>}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mn-divider" />

              <div className="mn-section">
                <span className="mn-label">Opinion Level</span>
                <div className="mn-radio-row">
                  {[
                    { id: 'factual', label: 'Factual' },
                    { id: 'balanced', label: 'Balanced' },
                    { id: 'opinionated', label: 'Opinionated' },
                  ].map(o => (
                    <label key={o.id} className={`mn-radio${config.opinion === o.id ? ' mn-radio--active' : ''}`}>
                      <input type="radio" name="opinion" value={o.id} checked={config.opinion === o.id} onChange={() => update('opinion', o.id)} />
                      {o.label}
                    </label>
                  ))}
                </div>
                {config.opinion === 'opinionated' && (
                  <div className="mn-compliance-note">
                    ⚠ Opinionated mode is for internal use only. Ensure compliance review before client distribution.
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ── SCHEDULE TAB ── */}
          {activeTab === 'Schedule' && (
            <div className="mn-section-stack">

              <div className="mn-section">
                <span className="mn-label">Frequency</span>
                <div className="mn-radio-row">
                  {[{ id: 'once', label: 'Once daily' }, { id: 'twice', label: 'Twice daily' }].map(f => (
                    <label key={f.id} className={`mn-radio${config.schedule?.frequency === f.id ? ' mn-radio--active' : ''}`}>
                      <input type="radio" name="freq" value={f.id} checked={config.schedule?.frequency === f.id} onChange={() => update('schedule.frequency', f.id)} />
                      {f.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="mn-divider" />

              <div className="mn-section">
                <span className="mn-label">Timing</span>
                <div className="mn-time-rows">
                  <div className="mn-time-row">
                    <span className="mn-time-label">Morning</span>
                    <input type="time" className="mn-time-input" value={config.schedule?.morning_time || '06:30'} onChange={e => update('schedule.morning_time', e.target.value)} />
                  </div>
                  {config.schedule?.frequency === 'twice' && (
                    <div className="mn-time-row">
                      <span className="mn-time-label">Afternoon</span>
                      <input type="time" className="mn-time-input" value={config.schedule?.afternoon_time || '13:00'} onChange={e => update('schedule.afternoon_time', e.target.value)} />
                    </div>
                  )}
                  <div className="mn-time-row">
                    <span className="mn-time-label">Timezone</span>
                    <select className="mn-time-input" value={config.schedule?.timezone || 'US/Eastern'} onChange={e => update('schedule.timezone', e.target.value)}>
                      {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="mn-divider" />

              <div className="mn-section">
                <span className="mn-label">Active Days</span>
                <div className="mn-days">
                  {ALL_DAYS.map(d => (
                    <button
                      key={d}
                      className={`mn-day${(config.schedule?.days || []).includes(d) ? ' mn-day--active' : ''}`}
                      onClick={() => toggleDay(d)}
                    >{d}</button>
                  ))}
                </div>
              </div>

              <div className="mn-divider" />

              <div className="mn-section">
                <span className="mn-label">Status</span>
                <div className="mn-status-block">
                  <div className="mn-status-row">
                    <span className="mn-status-key">Next scheduled run</span>
                    <span className="mn-status-val">{nextRunLabel()}</span>
                  </div>
                  {lastRun && (
                    <div className="mn-status-row">
                      <span className="mn-status-key">Last run</span>
                      <span className={`mn-status-val mn-status-val--${lastRun.status}`}>
                        {lastRun.status === 'completed' ? '✓' : '✗'} {lastRun.date} · {lastRun.word_count || 0} words
                      </span>
                    </div>
                  )}
                </div>
                <label className={`mn-radio mn-pause-toggle${config.schedule?.paused ? ' mn-radio--active' : ''}`}>
                  <input type="checkbox" checked={!!config.schedule?.paused} onChange={e => update('schedule.paused', e.target.checked)} />
                  {config.schedule?.paused ? 'Scheduler paused — click to resume' : 'Pause scheduler'}
                </label>
              </div>

            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="modal-btn modal-btn--danger" onClick={handleReset} disabled={saving}>
            <RotateCcw size={13} /> Reset
          </button>
          <div className="modal-footer__right">
            <button className="modal-btn modal-btn--ghost" onClick={onClose} disabled={saving}>Cancel</button>
            <button className="modal-btn modal-btn--ghost" onClick={() => handleSave(true)} disabled={saving}>
              {saving ? 'Saving...' : 'Save & Refresh'}
            </button>
            <button className="modal-btn modal-btn--primary" onClick={() => handleSave(false)} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

      </div>
    </div>
  , document.body);
};

export default MorningNotesSettingsModal;
