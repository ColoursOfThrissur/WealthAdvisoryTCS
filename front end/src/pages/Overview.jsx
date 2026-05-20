import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useOverviewContext } from '../contexts/OverviewContext';
import { useAuth } from '../contexts/AuthContext';
import { useMeetingPrep } from '../contexts/MeetingPrepContext';

import PriorityQueue from '../components/overview/PriorityQueue';
import MeetingIntelligence from '../components/overview/MeetingIntelligence';
import PortfolioMonitor from '../components/overview/PortfolioMonitor';
import MassMailerChat from '../components/overview/MassMailerChat';
import MeetingSettingsModal from '../components/overview/MeetingSettingsModal';

import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { useCalendar } from '../hooks/useCalendar';

import './Overview.css';

const Overview = ({ isChatExpanded, setIsChatExpanded }) => {
  const [eventData, setEventData] = useState(null);
  const { handleEventAlertClick } = useOverviewContext(setIsChatExpanded, setEventData);
  const navigate = useNavigate();
  const location = useLocation();

  const { userId, googleConnected, setGoogleConnected } = useAuth();
  const { clearAll } = useMeetingPrep();

  const [sessionExpiredBanner, setSessionExpiredBanner] = useState(false);
  const [showMeetingSettings, setShowMeetingSettings] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [scheduleFrequency] = useState('daily');
  const [scheduleMorningTime] = useState('07:30');
  const [scheduleAfternoonTime] = useState('13:00');

  // useCalendar before useGoogleAuth so refreshBoth is available as onRefreshBoth
  const {
    calendarEvents, setCalendarEvents,
    calendarLoading, calendarError,
    upcomingEvents, upcomingLoading, upcomingError,
    calendarFetchedRef, upcomingFetchedRef,
    fetchCalendarEvents, fetchUpcomingEvents,
    clearCalendarCache, refreshBoth,
  } = useCalendar({ userId, googleConnected, setGoogleConnected, setSessionExpiredBanner });

  const {
    googleConnecting,
    authUrl,
    prefetchAuthUrl,
    handleGoogleConnect,
  } = useGoogleAuth({
    userId,
    setGoogleConnected,
    setSessionExpiredBanner,
    onRefreshBoth: refreshBoth,
  });

  // Pre-fetch the auth URL as soon as we know we're not connected
  // so the Connect button can open the popup synchronously
  useEffect(() => {
    if (!googleConnected) {
      prefetchAuthUrl();
    }
  }, [googleConnected]);

  // Close settings modal automatically when Google connects successfully
  useEffect(() => {
    if (googleConnected && showMeetingSettings) {
      setShowMeetingSettings(false);
    }
  }, [googleConnected]);

  // URL param handlers
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (location.pathname === '/chat' || searchParams.get('mode')) setIsChatExpanded(true);
  }, []);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('event') === 'mailer') {
      handleEventAlertClick('market-event');
      navigate('/', { replace: true });
    }
  }, [location.search]);

  useEffect(() => {
    if (!isChatExpanded) setEventData(null);
  }, [isChatExpanded]);

  // Refresh fires immediately — no popup, no pre-flight checkAuth.
  // If token expired, fetchCalendarEvents detects 401, sets sessionExpiredBanner,
  // and the inline Reconnect button calls handleGoogleConnect with the pre-fetched URL.
  async function handleRefresh() {
    if (!googleConnected) {
      // Not connected — treat Refresh as Connect
      handleGoogleConnect();
      return;
    }
    setRefreshing(true);
    await refreshBoth();
    setRefreshing(false);
  }

  function handleResetSettings() {
    setGoogleConnected(false);
    clearCalendarCache();
    clearAll();
    setSessionExpiredBanner(false);
  }

  return (
    <div className={`overview${isChatExpanded ? ' overview--chat-open' : ''}`}>

      {isChatExpanded && (
        <MassMailerChat
          eventData={eventData}
          isChatExpanded={isChatExpanded}
          setIsChatExpanded={setIsChatExpanded}
          setEventData={setEventData}
        />
      )}

      <div className={`overview__content${isChatExpanded ? ' overview__content--hidden' : ''}`}>

        <div className="overview__left">
          <PriorityQueue />
        </div>

        <div className="overview__right">
          <MeetingIntelligence
            googleConnected={googleConnected}
            setGoogleConnected={setGoogleConnected}
            calendarEvents={calendarEvents}
            calendarLoading={calendarLoading}
            calendarError={calendarError}
            upcomingEvents={upcomingEvents}
            upcomingLoading={upcomingLoading}
            upcomingError={upcomingError}
            sessionExpiredBanner={sessionExpiredBanner}
            setSessionExpiredBanner={setSessionExpiredBanner}
            fetchCalendarEvents={fetchCalendarEvents}
            fetchUpcomingEvents={fetchUpcomingEvents}
            googleConnecting={googleConnecting}
            scheduleFrequency={scheduleFrequency}
            scheduleMorningTime={scheduleMorningTime}
            scheduleAfternoonTime={scheduleAfternoonTime}
            onOpenSettings={() => setShowMeetingSettings(true)}
            onRefreshClick={handleRefresh}
            refreshing={refreshing}
            upcomingFetchedRef={upcomingFetchedRef}
            onConnect={handleGoogleConnect}
            authUrlReady={!!authUrl}
          />
          <PortfolioMonitor />
        </div>
      </div>

      {showMeetingSettings && (
        <MeetingSettingsModal
          onClose={() => setShowMeetingSettings(false)}
          googleConnected={googleConnected}
          googleConnecting={googleConnecting}
          onGoogleConnect={handleGoogleConnect}
          onGoogleDisconnect={() => { setGoogleConnected(false); setCalendarEvents(null); }}
          onReset={handleResetSettings}
        />
      )}

    </div>
  );
};

export default Overview;
