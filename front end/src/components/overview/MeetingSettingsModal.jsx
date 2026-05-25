import { useState, useEffect } from 'react';
import { SlidersHorizontal, X, RotateCcw } from 'lucide-react';
import Spinner from '../Spinner';
import './MeetingSettingsModal.css';

const SELECTABLE_DOMAINS = ['gmail.com', 'outlook.com', 'yahoo.com', 'icloud.com'];
const FIXED_DOMAINS = ['abccapital.com', 'globalinvestments.com', 'xyzholdings.net', 'finservegroup.com', 'primewealth.co'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TABS = ['Meeting', 'Schedule', 'Connections'];

const DEFAULT_PROMPT = `Meeting Prep — Portfolio Review

Focus areas:
- Review portfolio performance and drift vs targets
- Identify rebalancing opportunities
- Discuss upcoming market events relevant to client holdings
- Prepare talking points on risk exposure and asset allocation`;

const DEFAULTS = {
  meetingPrompt: DEFAULT_PROMPT,
  scheduleFrequency: 'daily',
  scheduleMorningTime: '07:30',
  scheduleAfternoonTime: '13:00',
  scheduleDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  selectedDomains: ['gmail.com', 'outlook.com'],
};

const MeetingSettingsModal = ({
  onClose,
  googleConnected, googleConnecting,
  onGoogleConnect, onGoogleDisconnect,
  onReset,
  onApply,
}) => {
  const [activeTab, setActiveTab] = useState('Meeting');
  const [meetingPrompt, setMeetingPrompt] = useState(DEFAULTS.meetingPrompt);
  const [scheduleFrequency, setScheduleFrequency] = useState(DEFAULTS.scheduleFrequency);
  const [scheduleMorningTime, setScheduleMorningTime] = useState(DEFAULTS.scheduleMorningTime);
  const [scheduleAfternoonTime, setScheduleAfternoonTime] = useState(DEFAULTS.scheduleAfternoonTime);
  const [scheduleDays, setScheduleDays] = useState(DEFAULTS.scheduleDays);
  const [selectedDomains, setSelectedDomains] = useState(DEFAULTS.selectedDomains);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('meeting_prep_config');
      if (stored) {
        const c = JSON.parse(stored);
        if (c.meetingPrompt) setMeetingPrompt(c.meetingPrompt);
        if (c.scheduleFrequency) setScheduleFrequency(c.scheduleFrequency);
        if (c.scheduleMorningTime) setScheduleMorningTime(c.scheduleMorningTime);
        if (c.scheduleAfternoonTime) setScheduleAfternoonTime(c.scheduleAfternoonTime);
        if (c.scheduleDays) setScheduleDays(c.scheduleDays);
        if (c.selectedDomains) setSelectedDomains(c.selectedDomains);
      }
    } catch { /* ignore */ }
  }, []);

  const toggleDay = (day) =>
    setScheduleDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);

  const toggleDomain = (domain) =>
    setSelectedDomains(prev => prev.includes(domain) ? prev.filter(d => d !== domain) : [...prev, domain]);

  const handleReset = () => {
    setMeetingPrompt(DEFAULTS.meetingPrompt);
    setScheduleFrequency(DEFAULTS.scheduleFrequency);
    setScheduleMorningTime(DEFAULTS.scheduleMorningTime);
    setScheduleAfternoonTime(DEFAULTS.scheduleAfternoonTime);
    setScheduleDays(DEFAULTS.scheduleDays);
    setSelectedDomains(DEFAULTS.selectedDomains);
    onReset?.();
  };

  const handleApply = () => {
    const config = {
      meetingPrompt,
      scheduleFrequency, scheduleMorningTime, scheduleAfternoonTime,
      scheduleDays, selectedDomains,
    };
    localStorage.setItem('meeting_prep_config', JSON.stringify(config));
    onApply?.(config);
    onClose();
  };

  return (
    <div className="ov-modal-overlay" onClick={onClose}>
      <div className="ov-settings-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="ov-settings-modal__head">
          <div className="ov-settings-modal__title-group">
            <div className="ov-settings-modal__icon"><SlidersHorizontal size={15} /></div>
            <div>
              <span className="ov-settings-modal__title">Meeting Prep Settings</span>
              <span className="ov-settings-modal__subtitle">Configure how Meeting Intelligence runs</span>
            </div>
          </div>
          <button className="ov-settings-modal__close" onClick={onClose}><X size={14} /></button>
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

        {/* Body — fixed height, tabs swap content */}
        <div className="ov-settings-modal__body">

          {/* ── MEETING TAB ── */}
          <div className={`ov-tab-content${activeTab === 'Meeting' ? ' ov-tab-content--active' : ''}`}>

            <div className="ov-field-group">
              <span className="ov-field-label">Meeting Prompt</span>
              <span className="ov-field-desc">This prompt is used to tailor the meeting prep brief. Edit to focus on specific topics or client needs.</span>
              <textarea
                className="ov-prompt-textarea"
                value={meetingPrompt}
                onChange={e => setMeetingPrompt(e.target.value)}
                placeholder={DEFAULT_PROMPT}
                rows={8}
              />
              <button
                className="ov-prompt-reset-btn"
                onClick={() => setMeetingPrompt(DEFAULT_PROMPT)}
              >
                Reset to default prompt
              </button>
            </div>

            <div className="ov-field-divider" />

            <div className="ov-field-group">
              <span className="ov-field-label">Domain Selection</span>
              <span className="ov-field-desc">Choose which email domains to include when matching calendar attendees</span>
              <div className="ov-domain-grid">
                <div className="ov-domain-col">
                  <span className="ov-domain-col__label">Personal — select to include</span>
                  {SELECTABLE_DOMAINS.map(d => (
                    <button
                      key={d}
                      className={`ov-domain-item${selectedDomains.includes(d) ? ' ov-domain-item--selected' : ''}`}
                      onClick={() => toggleDomain(d)}
                    >
                      <span className="ov-domain-check">{selectedDomains.includes(d) ? '✓' : ''}</span>
                      {d}
                    </button>
                  ))}
                </div>
                <div className="ov-domain-col">
                  <span className="ov-domain-col__label">Company — always included</span>
                  {FIXED_DOMAINS.map(d => (
                    <button key={d} className="ov-domain-item ov-domain-item--fixed" disabled>
                      <span className="ov-domain-check">✓</span>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* ── SCHEDULE TAB ── */}
          <div className={`ov-tab-content${activeTab === 'Schedule' ? ' ov-tab-content--active' : ''}`}>

            <div className="ov-field-group">
              <span className="ov-field-label">Frequency</span>
              <span className="ov-field-desc">How often to regenerate Meeting Intelligence</span>
              <div className="ov-freq-row">
                {[{ id: 'daily', label: 'Once daily' }, { id: 'twice', label: 'Twice daily' }].map(f => (
                  <label key={f.id} className={`ov-scheduler-radio${scheduleFrequency === f.id ? ' ov-scheduler-radio--active' : ''}`}>
                    <input type="radio" name="freq" value={f.id} checked={scheduleFrequency === f.id} onChange={() => setScheduleFrequency(f.id)} />
                    {f.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="ov-field-divider" />

            <div className="ov-field-group">
              <span className="ov-field-label">Timing</span>
              <div className="ov-time-rows">
                <div className="ov-time-row">
                  <span className="ov-time-label">Morning</span>
                  <input type="time" className="ov-scheduler-time-input" value={scheduleMorningTime} onChange={e => setScheduleMorningTime(e.target.value)} />
                </div>
                {scheduleFrequency === 'twice' && (
                  <div className="ov-time-row">
                    <span className="ov-time-label">Afternoon</span>
                    <input type="time" className="ov-scheduler-time-input" value={scheduleAfternoonTime} onChange={e => setScheduleAfternoonTime(e.target.value)} />
                  </div>
                )}
              </div>
            </div>

            <div className="ov-field-divider" />

            <div className="ov-field-group">
              <span className="ov-field-label">Active Days</span>
              <div className="ov-scheduler-days">
                {DAYS.map(d => (
                  <button
                    key={d}
                    className={`ov-scheduler-day${scheduleDays.includes(d) ? ' ov-scheduler-day--active' : ''}`}
                    onClick={() => toggleDay(d)}
                  >{d}</button>
                ))}
              </div>
            </div>

          </div>

          {/* ── CONNECTIONS TAB ── */}
          <div className={`ov-tab-content${activeTab === 'Connections' ? ' ov-tab-content--active' : ''}`}>

            <div className="ov-field-group">
              <span className="ov-field-label">Calendar Connectors</span>
              <span className="ov-field-desc">Connect your calendar to load meetings automatically</span>

              <div className="ov-connector-row ov-connector-row--disabled">
                <div className="ov-connector-row__left">
                  <div className="ov-connector-logo ov-connector-logo--outlook ov-connector-logo--disabled">O</div>
                  <div className="ov-connector-row__info">
                    <span className="ov-connector-row__name">Outlook Calendar</span>
                    <span className="ov-connector-row__status ov-connector-row__status--disabled">
                      <span className="ov-connector-row__status-dot" />Not available
                    </span>
                  </div>
                </div>
                <span className="ov-connector-badge--coming-soon">Coming soon</span>
              </div>

              <div className="ov-connector-row">
                <div className="ov-connector-row__left">
                  <div className="ov-connector-logo ov-connector-logo--google">G</div>
                  <div className="ov-connector-row__info">
                    <span className="ov-connector-row__name">Google Calendar</span>
                    <span className={`ov-connector-row__status${googleConnected ? ' ov-connector-row__status--connected' : ' ov-connector-row__status--disabled'}`}>
                      <span className="ov-connector-row__status-dot" />
                      {googleConnecting ? 'Connecting...' : googleConnected ? 'Connected' : 'Not connected'}
                    </span>
                  </div>
                </div>
                {!googleConnected && !googleConnecting && (
                  <button className="ov-connector-btn ov-connector-btn--connect" onClick={onGoogleConnect}>Connect</button>
                )}
                {googleConnecting && (
                  <button className="ov-connector-btn ov-connector-btn--loading" disabled>
                    <Spinner size={12} /> Connecting...
                  </button>
                )}
                {googleConnected && !googleConnecting && (
                  <button className="ov-connector-btn ov-connector-btn--disconnect" onClick={onGoogleDisconnect}>Disconnect</button>
                )}
              </div>
            </div>

          </div>

        </div>

        {/* Footer */}
        <div className="ov-settings-modal__footer">
          <button className="ov-settings-footer-btn ov-settings-footer-btn--reset" onClick={handleReset}>
            <RotateCcw size={13} /> Reset
          </button>
          <div className="ov-settings-footer-right">
            <button className="ov-settings-footer-btn ov-settings-footer-btn--cancel" onClick={onClose}>Cancel</button>
            <button className="ov-settings-footer-btn ov-settings-footer-btn--apply" onClick={handleApply}>Apply</button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default MeetingSettingsModal;
