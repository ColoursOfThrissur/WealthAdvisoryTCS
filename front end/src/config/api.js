/**
 * API Configuration
 * 
 * Priority: VITE env var → localhost fallback (dev) → same-origin (prod)
 * 
 * In dev:  falls back to localhost ports
 * In prod: reads from .env.production or Vercel env vars
 */

const DEV = import.meta.env.DEV;

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (DEV ? 'http://localhost:8001' : '');

export const REBALANCING_API_URL =
  import.meta.env.VITE_REBALANCING_API_URL ||
  (DEV ? 'http://localhost:8003' : '');

/** Full URL for an API path (e.g. /api/health) */
export const getApiUrl = (path) => {
  const base = API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}${path.startsWith('/') ? path : '/' + path}`;
};

/**
 * WebSocket base URL
 * Dev: ws://localhost:8001
 * Prod: wss:// derived from API_BASE_URL or same-origin
 */
export const getWsBaseUrl = () => {
  if (import.meta.env.VITE_WS_BASE_URL) {
    return import.meta.env.VITE_WS_BASE_URL;
  }
  if (DEV) {
    return 'ws://localhost:8001';
  }
  // Production: derive from API_BASE_URL or window origin
  const base = API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '');
  if (base) {
    return base.replace(/^http/, 'ws');
  }
  return 'wss://wealth-advisory.107-21-43-216.sslip.io';
};
