import { useReportChat } from '../hooks/useReportChat';
import AgentTrace from '../components/AgentTrace';
import SectionResult from '../components/SectionResult';
import MeetingPrepSection from '../components/sections/MeetingPrepSection';
import SuggestedPrompts from './SuggestedPrompts';
import { Send, Sparkles, CheckCircle2, XCircle, FileText, TrendingUp, Mail, Users, ArrowUp, ArrowDown } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getApiUrl } from '../config/api';
import { getSuggestedPromptsForMode } from '../utils/suggestedPromptsHelper';

const BackendChatInterface = ({ onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [chatMode, setChatMode] = useState('normal'); // 'normal', 'research', 'report', 'email', 'meeting'
  const [researchLoading, setResearchLoading] = useState(false);
  const [localMessages, setLocalMessages] = useState([]); // For research mode messages
  const [suggestedPrompts, setSuggestedPrompts] = useState([]);
  
  const {
    isConnected,
    chatMessages,
    statusHistory,
    isProcessing,
    sendChatMessage,
    sessionId
  } = useReportChat();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const mode = params.get('mode');
    if (mode && ['research', 'report', 'email', 'meeting'].includes(mode)) {
      setChatMode(mode);
    } else if (!mode) {
      // If no mode in URL, default to normal
      setChatMode('normal');
    }
  }, [location.search]);

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
    // Toggle off if clicking the same mode
    const targetMode = chatMode === newMode ? 'normal' : newMode;
    setChatMode(targetMode);
    
    const params = new URLSearchParams(location.search);
    if (targetMode !== 'normal') {
      params.set('mode', targetMode);
    } else {
      params.delete('mode');
    }
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
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
      // Step 1: resolve client name → ID via /api/clients (fuzzy match on backend)
      const clientsRes = await fetch(getApiUrl('/api/clients'));
      if (!clientsRes.ok) throw new Error('Could not load client list');
      const clientsData = await clientsRes.json();

      const lowerQuery = query.toLowerCase();
      const matched = (clientsData.clients || []).find(c =>
        lowerQuery.includes(c.name.toLowerCase()) ||
        c.name.toLowerCase().split(' ').some(part => lowerQuery.includes(part))
      );

      if (!matched) {
        setLocalMessages(prev => [...prev, {
          id: Date.now() + 1,
          sender: 'assistant',
          text: 'Please specify a client name from your book (e.g. "Robert Anderson" or "Sarah Mitchell").',
          timestamp: Date.now()
        }]);
        return;
      }

      // Step 2: fetch meeting prep for resolved client ID
      const response = await fetch(getApiUrl(`/api/client/${matched.client_id}/meeting-prep`));

      if (response.ok) {
        const result = await response.json();
        setLocalMessages(prev => [...prev, {
          id: Date.now() + 1,
          sender: 'assistant',
          meetingPrepData: result.data,
          timestamp: Date.now()
        }]);
      } else {
        setLocalMessages(prev => [...prev, {
          id: Date.now() + 1,
          sender: 'assistant',
          text: `Meeting prep not available for ${matched.name}.`,
          timestamp: Date.now()
        }]);
      }
    } catch (error) {
      console.error('[MEETING] Call failed:', error);
      setLocalMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'assistant',
        text: 'Failed to load meeting prep data.',
        timestamp: Date.now()
      }]);
    } finally {
      setResearchLoading(false);
    }
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
                  {message.meetingPrepData ? (
                    <MeetingPrepSection data={message.meetingPrepData} />
                  ) : !message.data && !message.sections ? (
                    chatMode === 'research' && message.sender === 'assistant'
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
            <AgentTrace statusHistory={statusHistory} isProcessing={isProcessing || researchLoading} researchMode={researchLoading} />
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
