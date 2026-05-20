/**
 * API Configuration
 *
 * Priority: VITE env var → hardcoded fallback per environment
 *
 * In dev:  falls back to localhost ports for most services
 * In prod: falls back to deployed backend URLs
 *
 * MEETING_PREP_API_URL is an exception — it always uses the deployed backend
 * since the local backend requires heavy AWS/Snowflake setup.
 * To override to local during development, set VITE_MEETING_PREP_API_URL=/meeting-prep-api
 * in your .env.local file (Vite proxy will forward to localhost:8000).
 */

const DEV = import.meta.env.DEV;

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (DEV ? 'http://localhost:8001' : 'https://wealth-advisory.107-21-43-216.sslip.io');

export const REBALANCING_API_URL =
  import.meta.env.VITE_REBALANCING_API_URL ||
  (DEV ? 'http://localhost:8003' : 'https://rebalance-api.107-21-43-216.sslip.io');

// Always uses the deployed backend — local is too heavy to run without full AWS/Snowflake setup.
// Override with VITE_MEETING_PREP_API_URL=/meeting-prep-api in .env.local to use local proxy.
export const MEETING_PREP_API_URL =
  import.meta.env.VITE_MEETING_PREP_API_URL ||
  'https://meetingprep.107-21-43-216.sslip.io';

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
