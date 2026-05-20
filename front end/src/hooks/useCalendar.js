import { useState, useRef, useEffect } from 'react';
import { getCalendarEvents, getUpcomingEvents } from '../services/meetingPrepService';

export function useCalendar({ userId, googleConnected, setGoogleConnected, setSessionExpiredBanner }) {
  const [calendarEvents, setCalendarEvents] = useState(null);
  const [calendarLoading, setCalendarLoading] = useState(
    () => localStorage.getItem('googleCalConnected') === 'true'
  );
  const [calendarError, setCalendarError] = useState('');

  const [upcomingEvents, setUpcomingEvents] = useState(null);
  const [upcomingLoading, setUpcomingLoading] = useState(false);
  const [upcomingError, setUpcomingError] = useState('');

  const calendarFetchedRef = useRef(false);
  const upcomingFetchedRef = useRef(false);

  useEffect(() => {
    if (googleConnected && calendarEvents === null && !calendarFetchedRef.current) {
      calendarFetchedRef.current = true;
      fetchCalendarEvents();
    }
    if (!googleConnected) {
      calendarFetchedRef.current = false;
    }
  }, [googleConnected, calendarEvents]);

  async function fetchCalendarEvents() {
    const cached = sessionStorage.getItem('calendarEvents_today');
    const cachedDate = sessionStorage.getItem('calendarEvents_date');
    const today = new Date().toDateString();
    if (cached && cachedDate === today) {
      setCalendarEvents(JSON.parse(cached));
      setCalendarLoading(false);
      return;
    }
    setCalendarLoading(true);
    setCalendarError('');
    const res = await getCalendarEvents(userId);
    setCalendarLoading(false);
    if (!res.ok) {
      if (res.authRequired || res.status === 401 || res.data?.status === 'unauthenticated') {
        setGoogleConnected(false);
        if (googleConnected) setSessionExpiredBanner(true);
      } else {
        setCalendarError(res.error);
      }
      return;
    }
    if (res.data?.status === 'unauthenticated') {
      setGoogleConnected(false);
      if (googleConnected) setSessionExpiredBanner(true);
      return;
    }
    const events = res.data?.events || [];
    setCalendarEvents(events);
    sessionStorage.setItem('calendarEvents_today', JSON.stringify(events));
    sessionStorage.setItem('calendarEvents_date', today);
  }

  async function fetchUpcomingEvents() {
    const cacheKey = 'upcomingEvents_cache';
    const cacheDateKey = 'upcomingEvents_date';
    const today = new Date().toDateString();
    const cached = sessionStorage.getItem(cacheKey);
    const cachedDate = sessionStorage.getItem(cacheDateKey);
    if (cached && cachedDate === today) {
      setUpcomingEvents(JSON.parse(cached));
      setUpcomingLoading(false);
      return;
    }
    setUpcomingLoading(true);
    setUpcomingError('');
    const res = await getUpcomingEvents(userId, 1, 3);
    setUpcomingLoading(false);
    if (!res.ok) {
      if (res.authRequired) { setGoogleConnected(false); setSessionExpiredBanner(true); }
      else { setUpcomingError(res.error); }
      return;
    }
    const events = res.data?.events || [];
    setUpcomingEvents(events);
    sessionStorage.setItem(cacheKey, JSON.stringify(events));
    sessionStorage.setItem(cacheDateKey, today);
  }

  function clearCalendarCache() {
    calendarFetchedRef.current = false;
    upcomingFetchedRef.current = false;
    setCalendarEvents(null);
    setCalendarError('');
    setUpcomingEvents(null);
    setUpcomingError('');
    sessionStorage.removeItem('calendarEvents_today');
    sessionStorage.removeItem('calendarEvents_date');
    sessionStorage.removeItem('upcomingEvents_cache');
    sessionStorage.removeItem('upcomingEvents_date');
  }

  // Clears cache and re-fetches both lists in parallel — used by Refresh button and post-auth
  async function refreshBoth() {
    sessionStorage.removeItem('calendarEvents_today');
    sessionStorage.removeItem('calendarEvents_date');
    sessionStorage.removeItem('upcomingEvents_cache');
    sessionStorage.removeItem('upcomingEvents_date');
    // Mark as fetched so the useEffect auto-fetch doesn't double-fire
    calendarFetchedRef.current = true;
    upcomingFetchedRef.current = true;
    await Promise.all([fetchCalendarEvents(), fetchUpcomingEvents()]);
  }

  return {
    calendarEvents, setCalendarEvents,
    calendarLoading, calendarError,
    upcomingEvents, upcomingLoading, upcomingError,
    calendarFetchedRef, upcomingFetchedRef,
    fetchCalendarEvents, fetchUpcomingEvents,
    clearCalendarCache,
    refreshBoth,
  };
}
