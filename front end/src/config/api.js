/**
 * API base URL - empty means same-origin (production behind nginx proxy)
 * Set VITE_API_BASE_URL in .env for custom backend URL
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.DEV ? 'http://localhost:8000' : '');

/** Full URL for an API path (e.g. /api/health -> http://localhost:8000/api/health or /api/health) */
export const getApiUrl = (path) => {
  const base = API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}${path.startsWith('/') ? path : '/' + path}`;
};

/**
 * WebSocket base URL - same-origin in production, localhost in dev
 */
export const getWsBaseUrl = () => {
  if (import.meta.env.VITE_WS_BASE_URL) {
    return import.meta.env.VITE_WS_BASE_URL;
  }
  if (import.meta.env.DEV) {
    return 'ws://localhost:8000';
  }
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}`;
  }
  return 'ws://localhost:8000';
};
