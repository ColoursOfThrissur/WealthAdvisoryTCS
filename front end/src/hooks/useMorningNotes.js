import { useState, useEffect, useRef, useCallback } from 'react';
import { getApiUrl } from '../config/api';
import { MORNING_NOTE_DEFAULTS } from '../config/morningNotesDefaults';

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

export const parseSections = (output = '') => {
  const lines = output.split('\n');
  const sections = [];
  let current = null;
  let inChecklist = false;

  const KNOWN_SECTIONS = /^(Trade Ideas|Market Recap|Macro Update|Market Tone|Top Picks|Key Risks|Watch List|Action Items|Client Impact|Risk Factors)$/i;

  const cleanLine = (line) =>
    line.replace(/\*\*([^*]+)\*\*:/g, '$1:').replace(/^\*+\s+/, '').replace(/^-\s+/, '').trim();

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Stop at checklist markers
    if (
      trimmed === '---' ||
      trimmed === '***' ||
      /^\*{3,}$/.test(trimmed) ||
      /^\[x\]/i.test(trimmed) ||
      /^\[\s\]/i.test(trimmed) ||
      trimmed.toLowerCase().includes('completeness checklist') ||
      (trimmed.startsWith('**') && trimmed.endsWith('**') && /checklist|skipped:/i.test(trimmed))
    ) {
      inChecklist = true;
      continue;
    }
    if (inChecklist) continue;

    // Detect section headers — **bold** lines
    if (trimmed.startsWith('**') && trimmed.endsWith('**') && trimmed.length > 4) {
      const title = trimmed.slice(2, -2).trim();
      const hasDigits = /\d/.test(title);

      // Skip date/metadata lines (contain year digits)
      if (hasDigits) continue;

      // Skip coverage/metadata header lines
      if (/^(Coverage|Sector Coverage|Analyst Name|Coverage Universe):/i.test(title)) continue;

      // Must start with capital and be meaningful
      const wordCount = title.split(/\s+/).length;
      const isSection =
        /^[A-Z]/.test(title) &&
        (title.includes(':') || title.includes('/') || wordCount >= 3 || KNOWN_SECTIONS.test(title));

      if (isSection) {
        if (current) sections.push(current);
        current = { title: title.replace(/:$/, '').trim(), impact: '', detail: [] };
        continue;
      }
    }

    if (current) {
      const cleaned = cleanLine(trimmed);
      if (!cleaned) continue;
      if (!current.impact) {
        current.impact = cleaned;
      } else {
        current.detail.push(cleaned);
      }
    }
  }

  if (current) sections.push(current);

  // Always put Top Call first
  const topCallIdx = sections.findIndex(s => s.title.toLowerCase().includes('top call'));
  if (topCallIdx > 0) {
    const [topCall] = sections.splice(topCallIdx, 1);
    sections.unshift(topCall);
  }

  return sections.map(s => ({
    ...s,
    content: [s.impact, ...s.detail].filter(Boolean),
  }));
};

const useMorningNotes = () => {
  const [sections, setSections] = useState([]);
  const [rawOutput, setRawOutput] = useState('');
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [isStale, setIsStale] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date().toISOString());
  const fetchingRef = useRef(false);

  const getConfig = () => {
    try {
      const stored = localStorage.getItem('mn_config');
      if (stored) return { ...MORNING_NOTE_DEFAULTS, ...JSON.parse(stored) };
    } catch { /* ignore */ }
    return MORNING_NOTE_DEFAULTS;
  };

  const applyData = (data, stale = false) => {
    const output = data?.output || '';
    setRawOutput(output);
    setSections(parseSections(output));
    setTopics(data?.topics_covered || []);
    setLastUpdated(data?.timestamp || new Date().toISOString());
    setIsStale(stale);
    setError(null);
  };

  const fetchMorningNote = useCallback(async (forceRefresh = false) => {
    if (fetchingRef.current && !forceRefresh) return;
    fetchingRef.current = true;

    try {
      // 1. Check today's note from DynamoDB + S3
      if (!forceRefresh) {
        try {
          const todayRes = await fetch(getApiUrl('/api/morning-notes/today'), {
            signal: AbortSignal.timeout(5_000),
          });
          if (todayRes.ok) {
            const todayData = await todayRes.json();
            if (todayData.success && todayData.status === 'completed' && todayData.data?.output) {
              applyData({ output: todayData.data.output, timestamp: todayData.timestamp, topics_covered: todayData.topics_covered || [] }, false);
              setLoading(false);
              return;
            }
            // Today's note is generating or failed — try yesterday
            if (todayData.status === 'generating' || todayData.status === 'failed' || todayData.status === 'not_found') {
              const yesterday = new Date();
              yesterday.setDate(yesterday.getDate() - 1);
              const yDate = yesterday.toISOString().split('T')[0];
              try {
                const yRes = await fetch(getApiUrl(`/api/morning-notes/date/${yDate}`), {
                  signal: AbortSignal.timeout(5_000),
                });
                if (yRes.ok) {
                  const yData = await yRes.json();
                  if (yData.success && yData.data?.output) {
                    applyData({ output: yData.data.output, timestamp: yData.timestamp, topics_covered: yData.topics_covered || [] }, true);
                    setLoading(false);
                    return;
                  }
                }
              } catch { /* no yesterday note — fall through to generate */ }
            }
          }
        } catch { /* backend not running — fall through to generate */ }
      }

      // 2. Generate fresh note with current config
      const config = getConfig();
      const response = await fetch(getApiUrl('/api/morning-notes'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_name: 'advisor', config }),
        signal: AbortSignal.timeout(120_000),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const result = await response.json();
      if (!result?.success || !result?.data) throw new Error('Invalid response format');

      const data = result.data;
      if (isBackendError(data.output)) throw new Error('Backend returned an error response');

      data.timestamp = result.timestamp || new Date().toISOString();
      data.topics_covered = result.topics_covered || [];
      applyData(data, false);

    } catch (err) {
      console.error('[useMorningNotes]', err.message);
      setError(err.message);
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

  return { sections, rawOutput, topics, loading, refreshing, error, isStale, lastUpdated, refresh };
};

export default useMorningNotes;
