import { useState, useRef, useEffect } from 'react';
import { checkAuth } from '../services/meetingPrepService';

export function useGoogleAuth({ userId, setGoogleConnected, setSessionExpiredBanner, onRefreshBoth }) {
  const [googleConnecting, setGoogleConnecting] = useState(false);
  const [authUrl, setAuthUrl] = useState(null);

  const popupRef = useRef(null);
  const pollRef = useRef(null);

  // Pre-fetch the auth URL as soon as we know we're not connected
  // so the Connect button can open the popup synchronously (no await before window.open)
  async function prefetchAuthUrl() {
    const res = await checkAuth(userId);
    if (!res.ok && !res.authRequired) return; // backend unreachable — ignore
    if (res.ok && res.data?.status === 'authenticated') {
      // Already authenticated — mark connected and fetch calendar
      setGoogleConnected(true);
      if (onRefreshBoth) onRefreshBoth();
      return;
    }
    // Store the URL — works for both 401 (res.authUrl) and 200 unauthenticated (res.data.authorization_url)
    const url = res.authUrl || res.data?.authorization_url || null;
    if (url) setAuthUrl(url);
  }

  function stopPolling() {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }

  function onAuthSuccess() {
    setGoogleConnected(true);
    setGoogleConnecting(false);
    setAuthUrl(null); // clear so it gets re-fetched next time needed
    if (onRefreshBoth) onRefreshBoth();
  }

  // Opens popup synchronously to the pre-fetched URL — no await, no popup blocker
  function handleGoogleConnect() {
    if (!authUrl) {
      // URL not ready yet — fetch it, which will update state and user can retry
      prefetchAuthUrl();
      return;
    }

    const w = 500, h = 650;
    const left = Math.round(window.screenX + (window.outerWidth - w) / 2);
    const top = Math.round(window.screenY + (window.outerHeight - h) / 2);

    const popup = window.open(authUrl, 'googleAuth',
      `width=${w},height=${h},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes`);

    if (!popup) {
      // Popup blocked — open in new tab as fallback
      window.open(authUrl, '_blank');
      return;
    }

    popupRef.current = popup;
    setGoogleConnecting(true);
    startPolling();
  }

  function startPolling() {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const href = popupRef.current?.location?.href || '';
        if (href.includes('lambda-url') || href.includes('auth=success')) {
          stopPolling();
          if (!popupRef.current?.closed) popupRef.current.close();
          onAuthSuccess(); return;
        }
      } catch { /* cross-origin — expected while on Google's domain */ }

      if (popupRef.current?.closed) {
        stopPolling();
        const r = await checkAuth(userId);
        if (r.ok && r.data?.status === 'authenticated') {
          onAuthSuccess();
        } else {
          setGoogleConnecting(false);
          // Re-fetch auth URL for next attempt
          prefetchAuthUrl();
        }
        return;
      }

      const r = await checkAuth(userId);
      if (r.ok && r.data?.status === 'authenticated') {
        stopPolling();
        if (!popupRef.current?.closed) popupRef.current.close();
        onAuthSuccess();
      }
    }, 3000);
  }

  return {
    googleConnecting,
    authUrl,
    prefetchAuthUrl,
    stopPolling,
    handleGoogleConnect,
  };
}
