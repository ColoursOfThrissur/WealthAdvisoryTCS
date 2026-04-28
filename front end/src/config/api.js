/**
 * API Configuration
 * 
 * Priority: VITE env var → hardcoded fallback per environment
 * 
 * In dev:  falls back to localhost ports
 * In prod: falls back to deployed backend URLs
 */

const DEV = import.meta.env.DEV;

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (DEV ? 'http://localhost:8001' : 'https://wealth-advisory.107-21-43-216.sslip.io');

export const REBALANCING_API_URL =
  import.meta.env.VITE_REBALANCING_API_URL ||
  (DEV ? 'http://localhost:8003' : 'https://rebalance-api.107-21-43-216.sslip.io');

/** Full URL for an API path (e.g. /api/health) */
export const getApiUrl = (path) => {
  const base = API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}${path.startsWith('/') ? path : '/' + path}`;
};

/**
 * WebSocket base URL
 * Dev: ws://localhost:8001
 * Prod: wss:// deployed backend
 */
export const getWsBaseUrl = () => {
  if (import.meta.env.VITE_WS_BASE_URL) {
    return import.meta.env.VITE_WS_BASE_URL;
  }
  if (DEV) {
    return 'ws://localhost:8001';
  }
  return 'wss://wealth-advisory.107-21-43-216.sslip.io';
};
