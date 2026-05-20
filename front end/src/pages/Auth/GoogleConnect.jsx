import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, CheckCircle, AlertCircle, Loader, Sun, Moon, Sparkles, Clock } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../contexts/AuthContext';
import { checkAuth } from '../../services/meetingPrepService';
import './Auth.css';

const POLL_INTERVAL_MS = 3000;

export default function GoogleConnect() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { userId, setGoogleConnected } = useAuth();

  // status: 'checking' | 'idle' | 'waiting' | 'success' | 'cancelled' | 'error'
  const [status, setStatus] = useState('checking');
  const [errorMsg, setErrorMsg] = useState('');
  const [authUrl, setAuthUrl] = useState(null); // pre-fetched auth URL
  const popupRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    silentCheck();
    return () => stopPolling();
  }, []);

  async function silentCheck() {
    setStatus('checking');
    const res = await checkAuth(userId);

    // Backend unreachable
    if (!res.ok && !res.authRequired) {
      setStatus('error');
      setErrorMsg(res.error);
      return;
    }

    // Already authenticated — skip gate
    if (res.ok && res.data?.status === 'authenticated') {
      setGoogleConnected(true);
      navigate('/', { replace: true });
      return;
    }

    // Unauthenticated (either 401 with authUrl, or 200 with status=unauthenticated)
    const url = res.authUrl || res.data?.authorization_url || null;
    setAuthUrl(url);
    setStatus('idle');
  }

  function stopPolling() {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }

  // Called directly from button click — opens popup synchronously to avoid blocker
  function handleConnect() {
    if (!authUrl) {
      // URL not ready yet — re-fetch
      silentCheck();
      return;
    }

    const w = 500, h = 650;
    const left = Math.round(window.screenX + (window.outerWidth - w) / 2);
    const top = Math.round(window.screenY + (window.outerHeight - h) / 2);

    // Open directly to auth URL — no blank page
    const popup = window.open(authUrl, 'googleAuth',
      `width=${w},height=${h},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes`);

    if (!popup) {
      setStatus('error');
      setErrorMsg('Popup was blocked by your browser. Please allow popups for this site and try again.');
      return;
    }

    popupRef.current = popup;
    setStatus('waiting');
    startPolling();
  }

  function startPolling() {
    stopPolling();
    pollRef.current = setInterval(async () => {
      // Detect Lambda callback URL in popup
      try {
        const href = popupRef.current?.location?.href || '';
        if (href.includes('lambda-url') || href.includes('auth=success')) {
          stopPolling();
          if (popupRef.current && !popupRef.current.closed) popupRef.current.close();
          handleSuccess();
          return;
        }
      } catch { /* cross-origin — ignore */ }

      if (popupRef.current?.closed) {
        stopPolling();
        // Final check — user may have completed auth before closing
        const res = await checkAuth(userId);
        if (res.ok && res.data?.status === 'authenticated') {
          handleSuccess();
        } else {
          setStatus('cancelled');
        }
        return;
      }

      // Regular poll
      const res = await checkAuth(userId);
      if (res.ok && res.data?.status === 'authenticated') {
        stopPolling();
        if (popupRef.current && !popupRef.current.closed) popupRef.current.close();
        handleSuccess();
      }
    }, POLL_INTERVAL_MS);
  }

  function handleSuccess() {
    setGoogleConnected(true);
    setStatus('success');
    setTimeout(() => navigate('/', { replace: true }), 1500);
  }

  function handleCancel() {
    stopPolling();
    if (popupRef.current && !popupRef.current.closed) popupRef.current.close();
    setStatus('idle');
  }

  function handleSkip() { navigate('/', { replace: true }); }

  return (
    <div className="auth-container gc-wide" data-theme={theme}>
      <div className="auth-background" />

      <button onClick={toggleTheme} className="theme-toggle" title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
      </button>

      <div className="auth-card">
        <h1 className="auth-title">Wealth Management Platform</h1>

        {/* CHECKING */}
        {status === 'checking' && (
          <div className="gc-center" style={{ padding: '2rem 0' }}>
            <Loader size={28} className="gc-spin" style={{ color: '#10b981' }} />
            <p className="gc-title" style={{ marginTop: '1rem' }}>Checking calendar connection...</p>
            <p className="gc-label">Just a moment</p>
          </div>
        )}

        {/* IDLE */}
        {status === 'idle' && (
          <>
            <div className="gc-icon-wrap" style={{ marginBottom: '0.75rem' }}>
              <Calendar size={24} style={{ color: '#10b981' }} />
            </div>
            <h2 className="auth-welcome" style={{ textAlign: 'center', marginBottom: '0.375rem' }}>
              Connect Google Calendar
            </h2>
            <p className="auth-subtitle" style={{ textAlign: 'center', marginBottom: '1rem' }}>
              Allow one-time access so Meeting Intelligence can read your schedule and prepare AI-powered briefs before each client call.
            </p>
            <div className="gc-features-grid">
              <div className="gc-feature-item">
                <Sparkles size={14} style={{ color: '#10b981', flexShrink: 0 }} />
                <span>AI-powered meeting briefs</span>
              </div>
              <div className="gc-feature-item">
                <Calendar size={14} style={{ color: '#10b981', flexShrink: 0 }} />
                <span>Sync today's meetings</span>
              </div>
              <div className="gc-feature-item">
                <Clock size={14} style={{ color: '#10b981', flexShrink: 0 }} />
                <span>Quick re-auth when needed</span>
              </div>
              <div className="gc-feature-item">
                <CheckCircle size={14} style={{ color: '#10b981', flexShrink: 0 }} />
                <span>Read-only calendar access</span>
              </div>
            </div>
            <button className="submit-button" style={{ marginTop: '1rem' }} onClick={handleConnect}>
              Connect with Google
            </button>
            <button className="link-button" style={{ marginTop: '0.625rem', display: 'block', textAlign: 'center', width: '100%' }} onClick={handleSkip}>
              Skip for now — I'll connect later
            </button>
          </>
        )}

        {/* WAITING */}
        {status === 'waiting' && (
          <div className="gc-center" style={{ padding: '1.5rem 0' }}>
            <Loader size={28} className="gc-spin" style={{ color: '#10b981' }} />
            <p className="gc-title" style={{ marginTop: '1rem' }}>Waiting for Google authorization</p>
            <p className="gc-label" style={{ marginTop: '0.375rem' }}>
              Complete the sign-in in the popup window.
            </p>
            <div className="gc-waiting-hint">
              <CheckCircle size={13} style={{ color: '#10b981', flexShrink: 0 }} />
              After signing in, this page will update automatically.
            </div>
            <button className="link-button" style={{ marginTop: '1.5rem' }} onClick={handleCancel}>
              Cancel
            </button>
          </div>
        )}

        {/* SUCCESS */}
        {status === 'success' && (
          <div className="gc-center" style={{ padding: '2rem 0' }}>
            <CheckCircle size={40} style={{ color: '#10b981' }} />
            <p className="gc-title" style={{ color: '#10b981', marginTop: '1rem' }}>Google Calendar connected</p>
            <p className="gc-label" style={{ marginTop: '0.375rem' }}>Taking you to your dashboard...</p>
          </div>
        )}

        {/* CANCELLED */}
        {status === 'cancelled' && (
          <div className="gc-center" style={{ padding: '1.5rem 0' }}>
            <AlertCircle size={28} style={{ color: '#f59e0b' }} />
            <p className="gc-title" style={{ marginTop: '1rem' }}>Authorization not completed</p>
            <p className="gc-label" style={{ marginTop: '0.375rem' }}>
              The sign-in window was closed before finishing.
            </p>
            <button className="submit-button" style={{ marginTop: '1.5rem' }} onClick={handleConnect}>
              Try Again
            </button>
            <button className="link-button" style={{ marginTop: '0.875rem', display: 'block', textAlign: 'center', width: '100%' }} onClick={handleSkip}>
              Skip for now
            </button>
          </div>
        )}

        {/* ERROR */}
        {status === 'error' && (
          <div className="gc-center" style={{ padding: '1.5rem 0' }}>
            <AlertCircle size={28} style={{ color: '#ef4444' }} />
            <p className="gc-title" style={{ color: '#ef4444', marginTop: '1rem' }}>Could not reach the service</p>
            <p className="gc-label" style={{ marginTop: '0.375rem' }}>{errorMsg}</p>
            <button className="submit-button" style={{ marginTop: '1.5rem' }} onClick={silentCheck}>
              Retry
            </button>
            <button className="link-button" style={{ marginTop: '0.875rem', display: 'block', textAlign: 'center', width: '100%' }} onClick={handleSkip}>
              Skip for now
            </button>
          </div>
        )}

        <footer className="auth-footer">
          <span>Read-only calendar access · Session expires after ~60 min</span>
          <span>|</span>
          <span>© 2026 Wealth Management</span>
        </footer>
      </div>
    </div>
  );
}
