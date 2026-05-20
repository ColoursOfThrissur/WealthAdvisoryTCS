import { MEETING_PREP_API_URL } from '../config/api';

const BASE = MEETING_PREP_API_URL;
const TIMEOUT_MS = 300_000; // 5 min — matches backend AgentCore read_timeout

async function post(path, body) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (res.status === 401) {
      const detail = await res.json().catch(() => ({}));
      return {
        ok: false,
        status: 401,
        authRequired: true,
        authUrl: detail?.detail?.authorization_url || null,
        error: 'Google authorization required.',
      };
    }
    if (!res.ok) {
      const detail = await res.json().catch(() => ({}));
      return { ok: false, error: detail?.detail?.message || `Server error ${res.status}`, status: res.status };
    }
    const data = await res.json();
    return { ok: true, data };
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') return { ok: false, error: 'Request timed out. The agent is taking too long.' };
    return { ok: false, error: 'Cannot reach the Meeting Prep service. Check that it is running.' };
  }
}

/** Check whether the advisor has completed Google OAuth2 consent. */
export async function checkAuth(userId) {
  return post('/check-auth', { user_id: userId });
}

/** Fetch today's Google Calendar events for the advisor. */
export async function getCalendarEvents(userId) {
  return post('/get-calendar-events', { user_id: userId });
}

/**
 * Fetch upcoming calendar events.
 * @param {string} userId
 * @param {number} dayOffset - days from today to start (1 = tomorrow)
 * @param {number} numDays - number of days to fetch
 */
export async function getUpcomingEvents(userId, dayOffset = 1, numDays = 3) {
  return post('/upcoming-events', { user_id: userId, day_offset: dayOffset, num_days: numDays });
}

/**
 * Run full meeting prep for a specific calendar event by its Google event ID.
 * @param {string} userId
 * @param {string} meetingId - Google Calendar event ID
 */
export async function runMeetingPrepById(userId, meetingId, forceRefresh = true) {
  return post('/meeting-prep-by-id', { user_id: userId, meeting_id: meetingId, force_refresh: forceRefresh });
}

/**
 * Run full meeting prep for a specific calendar event by index (legacy).
 * @param {string} userId
 * @param {number} eventIndex - 0-based index into today's calendar events
 */
export async function runMeetingPrep(userId, eventIndex = 0) {
  return post('/meeting-prep', { user_id: userId, event_index: eventIndex });
}

/** Returns the direct download URL for a generated PPTX. */
export function getPptxDownloadUrl(pptxId) {
  return `${BASE}/download-pptx/${pptxId}`;
}
