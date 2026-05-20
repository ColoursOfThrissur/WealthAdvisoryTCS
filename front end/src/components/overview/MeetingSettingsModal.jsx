import { useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import Spinner from '../Spinner';
import './MeetingSettingsModal.css';

const SELECTABLE_DOMAINS = ['gmail.com', 'outlook.com', 'yahoo.com', 'icloud.com'];
const FIXED_DOMAINS = ['abccapital.com', 'globalinvestments.com', 'xyzholdings.net', 'finservegroup.com', 'primewealth.co'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const MeetingSettingsModal = ({
  onClose,
  googleConnected, googleConnecting,
  onGoogleConnect, onGoogleDisconnect,
  onReset,
}) => {
  const [scheduleFrequency, setScheduleFrequency] = useState('daily');
  const [scheduleMorningTime, setScheduleMorningTime] = useState('07:30');
  const [scheduleAfternoonTime, setScheduleAfternoonTime] = useState('13:00');
  const [scheduleDays, setScheduleDays] = useState(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const [selectedDomains, setSelectedDomains] = useState(['gmail.com', 'outlook.com']);

  const toggleDay = (day) => setScheduleDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  const toggleDomain = (domain) => setSelectedDomains(prev => prev.includes(domain) ? prev.filter(d => d !== domain) : [...prev, domain]);

  function handleReset() {
    setScheduleFrequency('daily');
    setScheduleMorningTime('07:30');
    setScheduleAfternoonTime('13:00');
    setScheduleDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
    setSelectedDomains(['gmail.com', 'outlook.com']);
    onReset?.();
  }

  return (
    <div className="ov-modal-overlay" onClick={onClose}>
      <div className="ov-settings-modal" onClick={e => e.stopPropagation()}>

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

        <div className="ov-settings-modal__body">
          <div className="ov-settings-two-col">

            {/* LEFT: Scheduler */}
            <div className="ov-settings-col">
              <span className="ov-settings-section__label">Scheduler</span>
              <span className="ov-settings-col__desc">When to regenerate Meeting Intelligence</span>
              <div className="ov-scheduler-block">
                <div className="ov-scheduler-freq">
                  <label className={`ov-scheduler-radio${scheduleFrequency === 'daily' ? ' ov-scheduler-radio--active' : ''}`}>
                    <input type="radio" name="freq" value="daily" checked={scheduleFrequency === 'daily'} onChange={() => setScheduleFrequency('daily')} />
                    Once daily
                  </label>
                  <label className={`ov-scheduler-radio${scheduleFrequency === 'twice' ? ' ov-scheduler-radio--active' : ''}`}>
                    <input type="radio" name="freq" value="twice" checked={scheduleFrequency === 'twice'} onChange={() => setScheduleFrequency('twice')} />
                    Twice daily
                  </label>
                </div>
                <div className="ov-scheduler-divider" />
                <div className="ov-scheduler-times">
                  <div className="ov-scheduler-time-row">
                    <span className="ov-scheduler-time-label">Morning</span>
                    <input type="time" className="ov-scheduler-time-input" value={scheduleMorningTime} onChange={e => setScheduleMorningTime(e.target.value)} />
                  </div>
                  {scheduleFrequency === 'twice' && (
                    <div className="ov-scheduler-time-row">
                      <span className="ov-scheduler-time-label">Afternoon</span>
                      <input type="time" className="ov-scheduler-time-input" value={scheduleAfternoonTime} onChange={e => setScheduleAfternoonTime(e.target.value)} />
                    </div>
                  )}
                </div>
                <div className="ov-scheduler-divider" />
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

            {/* RIGHT: Client Domains */}
            <div className="ov-settings-col">
              <span className="ov-settings-section__label">Client Domains</span>
              <span className="ov-settings-col__desc">Personal domains to include</span>
              <div className="ov-domain-list">
                <span className="ov-domain-group-label">Personal — select to include</span>
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
                <span className="ov-domain-group-label ov-domain-group-label--fixed">Company — always included</span>
                {FIXED_DOMAINS.map(d => (
                  <button key={d} className="ov-domain-item ov-domain-item--fixed" disabled>
                    <span className="ov-domain-check">✓</span>
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Connectors */}
          <div className="ov-settings-section ov-settings-section--tinted">
            <span className="ov-settings-section__label">Connectors</span>
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

        <div className="ov-settings-modal__footer">
          <button className="ov-settings-footer-btn ov-settings-footer-btn--reset" onClick={handleReset}>Reset</button>
          <div className="ov-settings-footer-right">
            <button className="ov-settings-footer-btn ov-settings-footer-btn--cancel" onClick={onClose}>Cancel</button>
            <button className="ov-settings-footer-btn ov-settings-footer-btn--apply" onClick={onClose}>Apply</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingSettingsModal;
