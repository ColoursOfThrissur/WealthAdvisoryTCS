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
export const parseSections = (output = '') => {
  const lines = output.split('\n');
  const sections = [];
  let current = null;

  // Known 2-word section titles that don't have 3 words but are real sections
  const KNOWN_SECTIONS = /^(Trade Ideas|Market Recap|Macro Update|Market Tone|Top Picks|Key Risks|Watch List|Action Items|Client Impact|Risk Factors)$/i;

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip separators and checklist lines
    if (
      trimmed === '---' ||
      trimmed === '***' ||
      trimmed.includes('Completeness Checklist') ||
      /^\[x\]|\[ \]/i.test(trimmed) ||
      (trimmed.startsWith('*Note:') && trimmed.includes('checklist'))
    ) {
      continue;
    }

    // Accept standalone **Bold Lines** as section headers if:
    // - contains ':' or '/' (e.g. "Top Call:", "Overnight/Pre-Market")
    // - OR 3+ words with no digits (e.g. "Key Events Today")
    // - OR matches known 2-word section titles (e.g. "Trade Ideas")
    // Rejects: date lines (**May 20, 2026...**) and short labels (**Global Technology**)
    if (trimmed.startsWith('**') && trimmed.endsWith('**') && trimmed.length > 4) {
      const title = trimmed.slice(2, -2).trim();
      const wordCount = title.split(/\s+/).length;
      const hasDigits = /\d/.test(title);
      const isSection =
        /^[A-Z]/.test(title) &&
        !hasDigits &&
        (title.includes(':') || title.includes('/') || wordCount >= 3 || KNOWN_SECTIONS.test(title));
      if (isSection) {
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

  // Always put Top Call first
  const topCallIdx = sections.findIndex(s => s.title.toLowerCase().includes('top call'));
  if (topCallIdx > 0) {
    const [topCall] = sections.splice(topCallIdx, 1);
    sections.unshift(topCall);
  }

  return sections;
};

/**
 * useMorningNotes â€” fetches, caches (localStorage, daily), and exposes
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
      'MSFT, GOOGL, META earnings after market close â€” expect volatility in tech-heavy portfolios',
      'Q1 GDP first estimate and PCE inflation data release â€” key signals for Fed rate path and bond positioning',
    ],
  },
];

const useMorningNotes = () => {
  const [sections, setSections] = useState([]);
  const [rawOutput, setRawOutput] = useState('');
  const [loading, setLoading] = useState(true);
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
      // corrupted cache â€” ignore
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
      // storage quota â€” ignore
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
    if (fetchingRef.current && !forceRefresh) return;
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
        // No sensitive data in body â€” just a role hint for the prompt
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
        // Fall back to hardcoded sections so UI is never empty
        setSections(HARDCODED_SECTIONS);
        setError(err.message);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      fetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchMorningNote(false);
  }, [fetchMorningNote]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    fetchMorningNote(true);
  }, [fetchMorningNote]);

  return { sections, rawOutput, loading, refreshing, error, lastUpdated, refresh };
};

export default useMorningNotes;