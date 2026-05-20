import { useReportChat } from '../hooks/useReportChat';
import AgentTrace from '../components/AgentTrace';
import SectionResult from '../components/SectionResult';
import SuggestedPrompts from './SuggestedPrompts';
import { Send, Sparkles, CheckCircle2, XCircle, FileText, TrendingUp, Mail, Users, ArrowUp, ArrowDown, Loader, Calendar } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { getApiUrl, MEETING_PREP_API_URL } from '../config/api';
import { checkAuth } from '../services/meetingPrepService';
import { getSuggestedPromptsForMode } from '../utils/suggestedPromptsHelper';
import { useAuth } from '../contexts/AuthContext';

const BackendChatInterface = ({ onClose }) => {
  const { userId } = useAuth();
  const effectiveUserId = userId;
  const [chatMode, setChatMode] = useState('normal'); // 'normal', 'research', 'report', 'email', 'meeting'
  const [researchLoading, setResearchLoading] = useState(false);
  const [localMessages, setLocalMessages] = useState([]); // For research mode messages
  const [suggestedPrompts, setSuggestedPrompts] = useState([]);

  // Google auth overlay state
  const [authOverlay, setAuthOverlay] = useState(null); // null | { url, status: 'idle'|'waiting' }
  const pendingQueryRef = useRef(null);
  const authPopupRef = useRef(null);
  const authPollRef = useRef(null);

  function stopAuthPolling() {
    if (authPollRef.current) { clearInterval(authPollRef.current); authPollRef.current = null; }
  }

  function openAuthPopup(url) {
    const w = 500, h = 650;
    const left = Math.round(window.screenX + (window.outerWidth - w) / 2);
    const top  = Math.round(window.screenY + (window.outerHeight - h) / 2);
    const popup = window.open(url, 'googleAuthMeeting',
      `width=${w},height=${h},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes`);
    if (!popup) { window.open(url, '_blank'); return; }
    authPopupRef.current = popup;
    setAuthOverlay(prev => ({ ...prev, status: 'waiting' }));
    startAuthPolling();
  }

  function startAuthPolling() {
    stopAuthPolling();
    authPollRef.current = setInterval(async () => {
      try {
        const href = authPopupRef.current?.location?.href || '';
        if (href.includes('lambda-url') || href.includes('auth=success')) {
          stopAuthPolling();
          if (!authPopupRef.current?.closed) authPopupRef.current.close();
          onAuthSuccess();
          return;
        }
      } catch { /* cross-origin */ }

      if (authPopupRef.current?.closed) {
        stopAuthPolling();
        const r = await checkAuth(effectiveUserId);
        if (r.ok && r.data?.status === 'authenticated') onAuthSuccess();
        else setAuthOverlay(prev => ({ ...prev, status: 'idle' }));
        return;
      }

      const r = await checkAuth(effectiveUserId);
      if (r.ok && r.data?.status === 'authenticated') {
        stopAuthPolling();
        if (!authPopupRef.current?.closed) authPopupRef.current.close();
        onAuthSuccess();
      }
    }, 3000);
  }

  function onAuthSuccess() {
    setAuthOverlay(null);
    if (pendingQueryRef.current) {
      const q = pendingQueryRef.current;
      pendingQueryRef.current = null;
      sendMeetingPrepDirectly(q);
    }
  }

  // Cleanup on unmount
  useEffect(() => () => stopAuthPolling(), []);
  
  const {
    isConnected,
    chatMessages,
    statusHistory,
    isProcessing,
    sendChatMessage,
    sessionId
  } = useReportChat();

  // Update suggested prompts when mode changes
  useEffect(() => {
    const context = {
      activeClient: null, // TODO: Get from context/props if available
      priorityClients: [], // TODO: Fetch from API or pass as prop
      morningNotes: null // TODO: Get from context/props if available
    };
    
    const prompts = getSuggestedPromptsForMode(chatMode, context);
    setSuggestedPrompts(prompts);
  }, [chatMode]);

  const handleModeChange = (newMode) => {
    setChatMode(chatMode === newMode ? 'normal' : newMode);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const input = e.target.elements.chatInput.value.trim();
    if (input) {
      if (chatMode === 'research') {
        sendResearchDirectly(input);
      } else if (chatMode === 'meeting') {
        sendMeetingPrepDirectly(input);
      } else {
        sendChatMessage(input);
      }
      e.target.reset();
    }
  };

  const sendMeetingPrepDirectly = async (query) => {
    const userMsg = { id: Date.now(), sender: 'user', text: query, timestamp: Date.now() };
    setLocalMessages(prev => [...prev, userMsg]);
    setResearchLoading(true);

    try {
      const response = await fetch(`${MEETING_PREP_API_URL}/client-prep`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: effectiveUserId, client_name: query })
      });

      if (response.status === 401) {
        const detail = await response.json().catch(() => ({}));
        const url = detail?.detail?.authorization_url;
        pendingQueryRef.current = query;
        setAuthOverlay({ url, status: 'idle' });
        return;
      }

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        console.error('[MEETING] Server error detail:', errBody);
        throw new Error(`Server error ${response.status}: ${errBody?.detail || JSON.stringify(errBody)}`);
      }

      const data = await response.json();
      console.log('[MEETING] Response:', data);

      const meeting = data.meetings?.[0];
      const resultText = meeting ? formatMeetingData(meeting) : (data.result || 'Meeting prep complete.');
      setLocalMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'assistant',
        text: resultText,
        isMeeting: true,
        timestamp: Date.now()
      }]);
    } catch (error) {
      console.error('[MEETING] Call failed:', error);
      setLocalMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'assistant',
        text: 'Failed to connect to the Meeting Prep service. Check that it is running.',
        timestamp: Date.now()
      }]);
    } finally {
      setResearchLoading(false);
    }
  };

  const formatMeetingData = (m) => {
    const lines = [];
    const c = m.client || {};
    const h = m.holdings || {};

    // Header
    const name = c.name || 'Client';
    const meta = [c.tier, c.aum ? `AUM ${c.aum}` : null, c.riskProfile, c.sentiment]
      .filter(Boolean).join(' · ');
    lines.push(`## ${name} — Meeting Brief`);
    if (meta) lines.push(`*${meta}*`);
    if (c.profileIntro) lines.push('', c.profileIntro);

    // Client profile
    const profileFields = [
      c.meetingTime    && `**Meeting** ${c.meetingTime}`,
      c.meetingGoal    && `**Goal** ${c.meetingGoal}`,
      c.lifecycleStage && `**Lifecycle** ${c.lifecycleStage}`,
      c.advicePosture  && `**Advice posture** ${c.advicePosture}`,
      c.lastInteraction && `**Last interaction** ${c.lastInteraction}`,
    ].filter(Boolean);
    if (profileFields.length) {
      lines.push('', '---', '', '### Client Profile');
      profileFields.forEach(f => lines.push(`- ${f}`));
    }

    // Holdings
    const hasHoldings = h.totalValue || (h.returns?.length) || (h.allocation?.length);
    if (hasHoldings) {
      lines.push('', '---', '', '### Holdings');
      if (h.totalValue) lines.push(`- **Total Value** ${h.totalValue}`);
      if (h.costBasis)  lines.push(`- **Cost Basis** ${h.costBasis}`);
      if (h.unrealizedGL) lines.push(`- **Unrealized G/L** ${h.unrealizedGL}`);
      if (h.keyInsight?.length) {
        lines.push('', ...h.keyInsight.map(k => `- ${k}`));
      }
      if (h.returns?.length) {
        lines.push('', '| Period | Return |', '| --- | --- |');
        h.returns.forEach(r => lines.push(`| ${r.label} | ${r.value} |`));
      }
      if (h.allocation?.length) {
        lines.push('', '| Asset | % | Target | Diff | Status |', '| --- | --- | --- | --- | --- |');
        h.allocation.forEach(a => lines.push(`| ${a.asset} | ${a.pct} | ${a.target} | ${a.diff} | ${a.status} |`));
      }
    }

    // Risks
    if (m.risk?.risks?.length) {
      lines.push('', '---', '', '### Risks');
      m.risk.risks.forEach(r => lines.push(`- **${r.label}** (${r.severity}): ${r.detail}`));
    }

    // Opportunities
    if (m.risk?.opportunities?.length) {
      lines.push('', '### Opportunities');
      m.risk.opportunities.forEach(o => lines.push(`- **${o.label}**: ${o.detail}`));
    }

    // Activity
    if (m.activity?.length) {
      lines.push('', '---', '', '### Recent Activity');
      m.activity.forEach(a => lines.push(`- **${a.date}** ${a.summary}${a.sentiment ? ` — ${a.sentiment}` : ''}${a.decision ? ` · ${a.decision}` : ''}`));
    }

    // Fund news
    if (m.fundNews?.length) {
      lines.push('', '---', '', '### Fund News');
      m.fundNews.forEach(n => lines.push(`- ${n}`));
    }

    // Next best actions
    if (m.nextBestActions?.length) {
      lines.push('', '---', '', '### Next Best Actions');
      m.nextBestActions.forEach(a => {
        lines.push(`- **${a.label}**: ${a.desc}`);
        if (a.agentReasoning) lines.push(`  ${a.agentReasoning}`);
      });
    }

    // Discussion angles
    if (m.discussionAngles?.length) {
      lines.push('', '---', '', '### Discussion Angles');
      m.discussionAngles.forEach(a => lines.push(`- **${a.title}**: ${a.desc}`));
    }

    // Opening script
    if (c.nbcScript) {
      lines.push('', '---', '', '### Opening Script', '', c.nbcScript);
    }

    return lines.join('\n');
  };

  const sendResearchDirectly = async (query) => {
    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: query,
      timestamp: Date.now()
    };
    setLocalMessages(prev => [...prev, userMsg]);
    setResearchLoading(true);
    
    try {
      const response = await fetch(getApiUrl(`/api/research/${sessionId}`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('[RESEARCH] Response:', data);
        
        const aiMsg = {
          id: Date.now() + 1,
          sender: 'assistant',
          text: data.answer || 'Research completed',
          timestamp: Date.now()
        };
        setLocalMessages(prev => [...prev, aiMsg]);
      } else {
        const errorMsg = {
          id: Date.now() + 1,
          sender: 'assistant',
          text: 'Research service unavailable.',
          timestamp: Date.now()
        };
        setLocalMessages(prev => [...prev, errorMsg]);
      }
    } catch (error) {
      console.error('[RESEARCH] Call failed:', error);
      const errorMsg = {
        id: Date.now() + 1,
        sender: 'assistant',
        text: 'Failed to connect to research service.',
        timestamp: Date.now()
      };
      setLocalMessages(prev => [...prev, errorMsg]);
    } finally {
      setResearchLoading(false);
    }
  };

  const getQuickActionsForMode = () => {
    switch(chatMode) {
      case 'research':
        return ["AAPL", "Large cap tech sector", "Renewable energy stocks"];
      case 'report':
        return [
          "Generate performance report for Sarah Mitchell",
          "Show David Chen's asset allocation",
          "Create full report for Robert Anderson"
        ];
      case 'email':
        return ["Draft client update email", "Write meeting follow-up", "Compose quarterly review"];
      case 'meeting':
        return ["Mary Hargrave", "Sam Pai", "Prepare meeting notes"];
      default:
        return [
          "Generate performance report for Sarah Mitchell",
          "Show David Chen's asset allocation",
          "Create full report for Robert Anderson"
        ];
    }
  };

  const handleQuickAction = (action) => {
    if (chatMode === 'research') {
      sendChatMessage(`/research-equity ${action}`);
    } else {
      sendChatMessage(action);
    }
  };

  // Handle suggested prompt click
  const handleSuggestedPromptClick = (prompt) => {
    console.log('[SUGGESTED PROMPT] Clicked:', prompt);
    
    // Switch to the appropriate mode if needed
    if (prompt.mode && chatMode !== prompt.mode) {
      handleModeChange(prompt.mode);
    }
    
    // Execute the query based on mode
    if (prompt.mode === 'research' || chatMode === 'research') {
      sendResearchDirectly(prompt.query);
    } else if (prompt.mode === 'meeting' || chatMode === 'meeting') {
      sendMeetingPrepDirectly(prompt.query);
    } else {
      sendChatMessage(prompt.query);
    }
  };

  const getPlaceholderText = () => {
    switch(chatMode) {
      case 'research':
        return "Research companies, sectors, or market trends...";
      case 'report':
        return "Ask me to generate reports for your clients...";
      case 'email':
        return "What email would you like me to draft?";
      case 'meeting':
        return "What meeting prep do you need?";
      default:
        return "How can I assist you today?";
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const parseMarkdownTable = (lines, startIdx) => {
    const tableLines = [];
    let i = startIdx;
    while (i < lines.length && (lines[i].includes('|') || lines[i].trim() === '')) {
      if (lines[i].includes('|')) tableLines.push(lines[i]);
      i++;
    }
    
    if (tableLines.length < 2) return null;
    
    const headers = tableLines[0].split('|').map(h => h.trim()).filter(h => h);
    const rows = tableLines.slice(2).map(row => 
      row.split('|').map(cell => cell.trim()).filter(cell => cell !== '')
    );
    
    return { headers, rows, endIdx: i };
  };

  const formatMessageWithIcons = (text) => {
    const hasCompletionItems = /[✅❌]/.test(text);
    
    if (hasCompletionItems) {
      const lines = text.split('\n');
      let headerText = '';
      const completionItems = [];

      lines.forEach((line, idx) => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return;

        if (trimmedLine.startsWith('✅')) {
          const itemText = trimmedLine.replace('✅', '').trim();
          completionItems.push(
            <div key={`complete-${idx}`} className="completion-item success">
              <CheckCircle2 size={18} strokeWidth={2} />
              <span>{itemText}</span>
            </div>
          );
        } else if (trimmedLine.startsWith('❌')) {
          const itemText = trimmedLine.replace('❌', '').trim();
          completionItems.push(
            <div key={`error-${idx}`} className="completion-item error">
              <XCircle size={18} strokeWidth={2} />
              <span>{itemText}</span>
            </div>
          );
        } else {
          if (completionItems.length === 0) {
            headerText += (headerText ? ' ' : '') + trimmedLine;
          }
        }
      });

      return (
        <>
          {headerText && <p className="completion-header">{headerText}</p>}
          {completionItems.length > 0 && (
            <div className="completion-list">
              {completionItems}
            </div>
          )}
        </>
      );
    }

    const lines = text.split('\n');
    const elements = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      if (!trimmed) {
        i++;
        continue;
      }

      if (trimmed.includes('|') && i + 1 < lines.length && lines[i + 1].includes('|')) {
        const tableData = parseMarkdownTable(lines, i);
        if (tableData) {
          elements.push(
            <div key={`table-${i}`} className="research-table-wrapper">
              <table className="research-table">
                <thead>
                  <tr>
                    {tableData.headers.map((header, idx) => (
                      <th key={idx} dangerouslySetInnerHTML={{ __html: header.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') }} />
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableData.rows.map((row, rowIdx) => (
                    <tr key={rowIdx}>
                      {row.map((cell, cellIdx) => (
                        <td key={cellIdx} dangerouslySetInnerHTML={{ 
                          __html: cell
                            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                            .replace(/\*(.+?)\*/g, '<em>$1</em>')
                            .replace(/WARNING:/g, '<span class="warning-text">WARNING:</span>')
                        }} />
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
          i = tableData.endIdx;
          continue;
        }
      }

      if (trimmed === '---') {
        elements.push(<hr key={`hr-${i}`} className="research-divider" />);
      } else if (trimmed.startsWith('# ')) {
        elements.push(<h1 key={i} className="research-h1">{trimmed.substring(2)}</h1>);
      } else if (trimmed.startsWith('## ')) {
        elements.push(<h2 key={i} className="research-h2">{trimmed.substring(3)}</h2>);
      } else if (trimmed.startsWith('### ')) {
        elements.push(<h3 key={i} className="research-h3">{trimmed.substring(4)}</h3>);
      } else if (trimmed.startsWith('#### ')) {
        elements.push(<h4 key={i} className="research-h4">{trimmed.substring(5)}</h4>);
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        elements.push(
          <li key={i} className="research-li" dangerouslySetInnerHTML={{ 
            __html: trimmed.substring(2).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') 
          }} />
        );
      } else {
        const formatted = trimmed
          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.+?)\*/g, '<em>$1</em>')
          .replace(/&#39;/g, "'")
          .replace(/&amp;/g, '&');
        elements.push(<p key={i} className="research-p" dangerouslySetInnerHTML={{ __html: formatted }} />);
      }

      i++;
    }

    return <div className="research-content">{elements}</div>;
  };

  const modes = [
    { id: 'email', label: 'Draft email', icon: Mail },
    { id: 'meeting', label: 'Meeting prep', icon: Users },
    { id: 'research', label: 'Research sector', icon: TrendingUp },
    { id: 'report', label: 'Generate client report', icon: FileText }
  ];

  // Combine messages based on mode
  const displayMessages = (chatMode === 'research' || chatMode === 'meeting') ? localMessages : chatMessages;

  const messagesRef = useRef(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const handleMessagesScroll = useCallback(() => {
    const el = messagesRef.current;
    if (!el) return;
    setShowScrollTop(el.scrollTop > 100);
    setShowScrollBottom(el.scrollHeight - el.scrollTop - el.clientHeight > 100);
  }, []);

  const scrollToTop = () => messagesRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  const scrollToBottom = () => messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: 'smooth' });

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (displayMessages.length > 0) scrollToBottom();
  }, [displayMessages.length]);

  return (
    <div className={`bci-root ${chatMode}-mode`}>

      {/* Google auth overlay */}
      {authOverlay && (
        <div className="ov-auth-overlay" onClick={() => {
          if (authOverlay.status === 'idle') {
            stopAuthPolling();
            setAuthOverlay(null);
            pendingQueryRef.current = null;
          }
        }}>
          <div className="ov-auth-card" onClick={e => e.stopPropagation()}>

            {authOverlay.status === 'idle' && (
              <>
                <div className="gc-icon-wrap">
                  <Calendar size={22} style={{ color: '#8b5cf6' }} />
                </div>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'center', marginBottom: '0.375rem', marginTop: 0 }}>
                  Connect Google Calendar
                </h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', textAlign: 'center', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                  Meeting prep needs access to your Google Calendar to find today's meetings.
                </p>
                <button className="submit-button" onClick={() => authOverlay.url && openAuthPopup(authOverlay.url)}>
                  Connect with Google
                </button>
                <button className="link-button" style={{ marginTop: '0.875rem', display: 'block', textAlign: 'center', width: '100%' }}
                  onClick={() => { stopAuthPolling(); setAuthOverlay(null); pendingQueryRef.current = null; }}>
                  Cancel
                </button>
              </>
            )}

            {authOverlay.status === 'waiting' && (
              <div className="gc-center" style={{ padding: '1.5rem 0' }}>
                <Loader size={26} className="gc-spin" style={{ color: '#8b5cf6' }} />
                <p className="gc-title" style={{ marginTop: '1rem' }}>Waiting for Google authorization</p>
                <p className="gc-label" style={{ marginTop: '0.375rem' }}>
                  Complete the sign-in in the popup window.
                </p>
                <div className="gc-waiting-hint">
                  <CheckCircle2 size={13} style={{ color: '#8b5cf6', flexShrink: 0 }} />
                  After signing in, meeting prep will resume automatically.
                </div>
                <button className="link-button" style={{ marginTop: '1.5rem' }} onClick={() => {
                  stopAuthPolling();
                  if (authPopupRef.current && !authPopupRef.current.closed) authPopupRef.current.close();
                  setAuthOverlay(prev => ({ ...prev, status: 'idle' }));
                }}>
                  Cancel
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Messages — scrollable, fills available space */}
      <div className="bci-messages" ref={messagesRef} onScroll={handleMessagesScroll}>
        <div className="bci-messages-inner">
        {displayMessages.length === 0 ? (
          <div className="bci-welcome">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={32} className="welcome-icon" />
              <h3>Client Relationship Assist</h3>
            </div>
            <p>Your intelligent assistant for client management, portfolio analysis, and relationship insights.</p>
            <div className="bci-welcome-input">
              <form className="bci-input-row" onSubmit={handleSubmit}>
                <input
                  type="text"
                  name="chatInput"
                  placeholder={getPlaceholderText()}
                  disabled={!isConnected}
                  className="bci-input"
                />
                <button type="submit" className="bci-send" disabled={!isConnected}><Send size={18} /></button>
              </form>
              <div className="bci-modes">
                {modes.map((mode) => {
                  const Icon = mode.icon;
                  return (
                    <button
                      key={mode.id}
                      data-mode={mode.id}
                      className={`bci-mode-chip${chatMode === mode.id ? ' bci-mode-chip--active' : ''}`}
                      onClick={() => handleModeChange(mode.id)}
                      disabled={!isConnected}
                    >
                      <Icon size={14} />
                      <span>{mode.label}</span>
                    </button>
                  );
                })}
              </div>
              <SuggestedPrompts
                prompts={suggestedPrompts}
                onPromptClick={handleSuggestedPromptClick}
                isLoading={isProcessing || researchLoading}
                mode={chatMode}
              />
            </div>
          </div>
        ) : (
          <>
            {displayMessages.map((message) => (
              <div key={message.id} className={`chat-message chat-message--${message.sender}`}>
                <div className="message-bubble">
                  {!message.data && !message.sections ? (
                    message.isMeeting && message.sender === 'assistant'
                      ? <div className="meeting-response">{formatMessageWithIcons(message.text)}</div>
                      : chatMode === 'research' && message.sender === 'assistant'
                        ? <div className="research-response">{formatMessageWithIcons(message.text)}</div>
                        : formatMessageWithIcons(message.text)
                  ) : null}
                  {message.data && <SectionResult section={message.section} data={message.data} />}
                  {message.sections?.length > 0 && (
                    <div className="sections-list">
                      {message.clientName && <div className="report-preview-header">Report Preview for {message.clientName}</div>}
                      {message.sections.map((sec, idx) => (
                        <div key={idx} className="section-item"><SectionResult section={sec.section} data={sec.data} /></div>
                      ))}
                    </div>
                  )}
                </div>
                <span className="message-timestamp">{formatTime(message.timestamp)}</span>
              </div>
            ))}
            <AgentTrace
              statusHistory={statusHistory}
              isProcessing={isProcessing || researchLoading}
              researchMode={researchLoading ? (chatMode === 'meeting' ? 'Preparing meeting brief...' : 'Researching') : false}
            />
          </>
        )}
        </div>
      </div>

      {/* Scroll buttons */}
      {displayMessages.length > 0 && (showScrollTop || showScrollBottom) && (
        <div className="bci-scroll-btns">
          {showScrollTop && <button className="bci-scroll-btn" onClick={scrollToTop}><ArrowUp size={14} /></button>}
          {showScrollBottom && <button className="bci-scroll-btn" onClick={scrollToBottom}><ArrowDown size={14} /></button>}
        </div>
      )}

      {/* Bottom bar — only shown when chat has messages */}
      {displayMessages.length > 0 && (
        <div className="bci-bottom">
          <form className="bci-input-row" onSubmit={handleSubmit}>
            <input
              type="text"
              name="chatInput"
              placeholder={getPlaceholderText()}
              disabled={!isConnected}
              className="bci-input"
            />
            <button type="submit" className="bci-send" disabled={!isConnected}><Send size={18} /></button>
          </form>
          <div className="bci-modes">
            {modes.map((mode) => {
              const Icon = mode.icon;
              return (
                <button
                  key={mode.id}
                  data-mode={mode.id}
                  className={`bci-mode-chip${chatMode === mode.id ? ' bci-mode-chip--active' : ''}`}
                  onClick={() => handleModeChange(mode.id)}
                  disabled={!isConnected}
                >
                  <Icon size={14} />
                  <span>{mode.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};

export default BackendChatInterface;
