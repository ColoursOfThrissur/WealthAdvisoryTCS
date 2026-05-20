import { Loader, CheckCircle } from 'lucide-react';
import './RefreshCalendarDialog.css';

// This dialog only renders when the user needs to re-authenticate.
// The normal refresh (token still valid) fires silently with loading shown in the list.
const RefreshCalendarDialog = ({ googleConnecting, onClose, onCancelConnect }) => {
  return (
    <div className="ov-auth-overlay" onClick={() => { if (!googleConnecting) onClose(); }}>
      <div className="ov-auth-card" onClick={e => e.stopPropagation()}>

        {googleConnecting ? (
          <div className="gc-center" style={{ padding: '1.5rem 0' }}>
            <Loader size={26} className="gc-spin" style={{ color: 'var(--success)' }} />
            <p className="gc-title" style={{ marginTop: '1rem' }}>Waiting for Google authorization</p>
            <p className="gc-label" style={{ marginTop: '0.375rem' }}>
              A sign-in window has opened. Complete the Google sign-in there.
            </p>
            <div className="gc-waiting-hint">
              <CheckCircle size={13} style={{ color: 'var(--success)', flexShrink: 0 }} />
              If you see <strong>"Authorization complete"</strong> in the popup — you're done. This will update automatically.
            </div>
            <button className="link-button" style={{ marginTop: '1.5rem' }} onClick={onCancelConnect}>
              Cancel
            </button>
          </div>
        ) : (
          // Popup was blocked or URL fetch failed — give user a manual fallback
          <div className="gc-center" style={{ padding: '1.5rem 0' }}>
            <Loader size={26} className="gc-spin" style={{ color: 'var(--success)' }} />
            <p className="gc-title" style={{ marginTop: '1rem' }}>Session expired</p>
            <p className="gc-label" style={{ marginTop: '0.375rem' }}>
              Your Google Calendar session has expired. Opening sign-in window...
            </p>
            <button className="link-button" style={{ marginTop: '1.5rem' }} onClick={onClose}>
              Cancel
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default RefreshCalendarDialog;
