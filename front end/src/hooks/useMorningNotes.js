import { useState, useEffect, useRef, useCallback } from 'react';
import { getApiUrl } from '../config/api';

const CACHE_KEY = 'mn_cache';
const CACHE_DATE_KEY = 'mn_date';
const CACHE_HASH_KEY = 'mn_hash';

// Simple hash to detect if cached content changed
const hashString = (str) => {
  let h = 0;
  for (let i = 0; i < Math.min(str.length, 500); i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return h.toString(36);
};

const ERROR_PHRASES = [
  'experiencing issues',
  'cannot access',
  'try again later',
  'apologize for the inconvenience',
  'technical issue',
  'tool failure',
  'unable to complete',
];

const isBackendError = (output = '') =>
  ERROR_PHRASES.some((p) => output.toLowerCase().includes(p));

/**
 * Parses the raw markdown output from the morning-note skill into
 * an array of { title, content[] } section objects.
 */
const SECTION_KEYWORDS = [
  'Top Call',
  'Overnight',
  'Pre-Market',
  'Key Events',
  'Trade Ideas',
  'Market Recap',
  'Macro',
];

export const parseSections = (output = '') => {
  const lines = output.split('\n');
  const sections = [];
  let current = null;

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip completeness checklist and separators
    if (
      trimmed === '---' ||
      trimmed === '***' ||
      trimmed.includes('Completeness Checklist') ||
      /^\[x\]|\[ \]/i.test(trimmed) ||
      (trimmed.startsWith('*Note:') && trimmed.includes('checklist'))
    ) {
      continue;
    }

    // Detect **Section Header** lines
    if (trimmed.startsWith('**') && trimmed.endsWith('**') && trimmed.length > 4) {
      const title = trimmed.slice(2, -2).trim();
      if (SECTION_KEYWORDS.some((kw) => title.includes(kw))) {
        if (current) sections.push(current);
        current = { title, content: [] };
        continue;
      }
    }

    if (current && trimmed) {
      current.content.push(line);
    }
  }

  if (current) sections.push(current);
  return sections;
};

/**
 * useMorningNotes — fetches, caches (localStorage, daily), and exposes
 * parsed morning note sections. Safe for concurrent renders (ref guard).
 */
const HARDCODED_SECTIONS = [
  {
    title: 'Fed Rate Cuts Delayed',
    content: [
      'Elevated inflation and geopolitical climate will push cuts to 2026 end',
      'Impact on 45 bond heavy portfolios and 12 clients seen as sensitive to income stability, as bond yields become more attractive and intermediate duration bonds regain relevance as stabilizers',
    ],
  },
  {
    title: 'Dispersed Q1 Tech Results',
    content: [
      'Semiconductor & AI companies earn high, Software & services weak',
      '34 portfolios heavily exposed to big tech and software services will face sharp drawdowns on earnings data; 8 clients are particularly sensitive to headlines based volatility',
    ],
  },
  {
    title: 'Key Events Today',
    content: [
      'MSFT, GOOGL, META earnings after market close — expect volatility in tech-heavy portfolios',
      'Q1 GDP first estimate and PCE inflation data release — key signals for Fed rate path and bond positioning',
    ],
  },
];

const useMorningNotes = () => {
  const [sections, setSections] = useState(HARDCODED_SECTIONS);
  const [rawOutput, setRawOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date().toISOString());
  const fetchingRef = useRef(false);

  const loadFromCache = () => {
    try {
      const today = new Date().toDateString();
      const cachedDate = localStorage.getItem(CACHE_DATE_KEY);
      const cachedData = localStorage.getItem(CACHE_KEY);
      if (cachedDate === today && cachedData) {
        const parsed = JSON.parse(cachedData);
        return parsed;
      }
    } catch {
      // corrupted cache — ignore
    }
    return null;
  };

  const saveToCache = (data) => {
    try {
      const today = new Date().toDateString();
      const hash = hashString(data.output || '');
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      localStorage.setItem(CACHE_DATE_KEY, today);
      localStorage.setItem(CACHE_HASH_KEY, hash);
    } catch {
      // storage quota — ignore
    }
  };

  const applyData = (data) => {
    const output = data?.output || '';
    setRawOutput(output);
    setSections(parseSections(output));
    setLastUpdated(data?.timestamp || new Date().toISOString());
    setError(null);
  };

  const fetchMorningNote = useCallback(async (forceRefresh = false) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    try {
      if (!forceRefresh) {
        const cached = loadFromCache();
        if (cached) {
          applyData(cached);
          setLoading(false);
          return;
        }
      }

      const response = await fetch(getApiUrl('/api/morning-notes'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // No sensitive data in body — just a role hint for the prompt
        body: JSON.stringify({ user_name: 'advisor' }),
        signal: AbortSignal.timeout(120_000),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();

      if (!result?.success || !result?.data) {
        throw new Error('Invalid response format');
      }

      const data = result.data;

      if (isBackendError(data.output)) {
        throw new Error('Backend returned an error response');
      }

      // Attach timestamp from envelope if present
      data.timestamp = result.timestamp || new Date().toISOString();

      applyData(data);
      saveToCache(data);
    } catch (err) {
      console.error('[useMorningNotes]', err.message);
      // Try to fall back to stale cache on error
      const stale = loadFromCache();
      if (stale) {
        applyData(stale);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      fetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    // endpoint preserved — skipped while hardcoded sections are active
    // fetchMorningNote(false);
  }, [fetchMorningNote]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    fetchMorningNote(true);
  }, [fetchMorningNote]);

  return { sections, rawOutput, loading, refreshing, error, lastUpdated, refresh };
};

export default useMorningNotes;
