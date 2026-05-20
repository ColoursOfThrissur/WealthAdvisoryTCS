import { createContext, useContext, useState } from 'react';

const MeetingPrepContext = createContext();

const STORAGE_KEY = 'meetingPrepResults';

function loadResultsFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveResultsToStorage(results) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
  } catch {
    // storage full or unavailable — fail silently
  }
}

/**
 * results:    { [meetingId]: meetingJsonObject }  — persisted in localStorage
 * generating: { [meetingId]: boolean }            — in-memory only (transient)
 * progress:   { [meetingId]: number }  0-100      — in-memory only (transient)
 *
 * meetingId = Google Calendar event ID (ev.id) — stable across re-fetches
 */
export function MeetingPrepProvider({ children }) {
  const [results, setResultsState] = useState(() => loadResultsFromStorage());
  const [generating, setGenerating] = useState({});
  const [progress, setProgress] = useState({});

  const setResult = (meetingId, data) => {
    setResultsState(prev => {
      const next = { ...prev, [meetingId]: data };
      saveResultsToStorage(next);
      return next;
    });
  };

  const setGeneratingFor = (meetingId, val) => {
    setGenerating(prev => ({ ...prev, [meetingId]: val }));
  };

  const setProgressFor = (meetingId, val) => {
    setProgress(prev => ({ ...prev, [meetingId]: val }));
  };

  // Clears everything including localStorage — called by Reset button in Settings
  const clearAll = () => {
    setResultsState({});
    setGenerating({});
    setProgress({});
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <MeetingPrepContext.Provider value={{
      results, generating, progress,
      setResult, setGeneratingFor, setProgressFor, clearAll,
    }}>
      {children}
    </MeetingPrepContext.Provider>
  );
}

export const useMeetingPrep = () => useContext(MeetingPrepContext);
