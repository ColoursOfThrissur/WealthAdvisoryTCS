import { useState, useEffect, useRef } from 'react';
import { useWebSocket } from './useWebSocket';
import apiService from '../services/apiService';
import { getApiUrl } from '../config/api';

export const useReportChat = () => {
  const [sessionId, setSessionId] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusHistory, setStatusHistory] = useState([]);

  const processedRef = useRef(0);
  const clearTimerRef = useRef(null);

  const { isConnected, messages, sendMessage } = useWebSocket(sessionId);

  // Init session
  useEffect(() => {
    const initSession = async () => {
      try {
        let stored = localStorage.getItem('report_session_id');
        console.log('[SESSION] Stored session:', stored);
        
        if (!stored || stored === 'undefined' || stored === 'null') {
          console.log('[SESSION] Creating new session...');
          const res = await apiService.createSession();
          console.log('[SESSION] API Response:', res);
          
          if (res && res.session_id) {
            stored = res.session_id;
            localStorage.setItem('report_session_id', stored);
            console.log('[SESSION] Saved session:', stored);
          } else {
            console.error('[SESSION] Invalid response:', res);
            return;
          }
        }
        
        console.log('[SESSION] Setting session ID:', stored);
        setSessionId(stored);
      } catch (error) {
        console.error('[SESSION] Error creating session:', error);
      }
    };
    initSession();
  }, []);

  // Process new messages — runs every time messages array grows
  useEffect(() => {
    let hasNew = false;
    const newStatuses = [];
    const newChatMsgs = [];
    let gotTerminal = false;

    for (let i = processedRef.current; i < messages.length; i++) {
      const msg = messages[i];
      hasNew = true;
      console.log(`[CHAT] msg[${i}] type=${msg.type}`, msg.type === 'status' ? msg.message : '');

      if (msg.type === 'status') {
        newStatuses.push(msg.message);
      } else if (['response', 'result', 'error', 'complete', 'research_result'].includes(msg.type)) {
        gotTerminal = true;

        let clientName = null;
        if (msg.sections?.length > 0) {
          clientName = msg.sections[0].data?.client_name || null;
        }
        newChatMsgs.push({
          id: Date.now() + Math.random(),
          sender: 'agent',
          text: msg.message,
          data: msg.data,
          section: msg.section,
          sections: msg.sections,
          clientName,
          type: msg.type,
          timestamp: new Date().toISOString()
        });

        // Debug save (fire and forget)
        if (['response', 'result', 'research_result'].includes(msg.type)) {
          fetch(getApiUrl('/api/debug/save-response'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: msg.message, type: msg.type, data: msg.data })
          }).catch(() => {});
        }
      }
    }

    if (!hasNew) return;
    processedRef.current = messages.length;

    // Accumulate statuses
    if (newStatuses.length > 0) {
      console.log('[CHAT] Adding statuses:', newStatuses);
      if (clearTimerRef.current) {
        clearTimeout(clearTimerRef.current);
        clearTimerRef.current = null;
      }
      setStatusHistory(prev => [...prev, ...newStatuses]);
    }

    // Add chat messages
    if (newChatMsgs.length > 0) {
      console.log('[CHAT] Adding chat messages:', newChatMsgs.length);
      setChatMessages(prev => [...prev, ...newChatMsgs]);
    }

    // Terminal message means done processing
    if (gotTerminal) {
      console.log('[CHAT] Got terminal, setting isProcessing=false. Had statuses:', newStatuses.length);
      setIsProcessing(false);
      // Clear status history after a delay so AgentTrace can show completed state
      clearTimerRef.current = setTimeout(() => {
        setStatusHistory([]);
        clearTimerRef.current = null;
      }, 2500);
    }
  }, [messages]);

  const handleFileUpload = async (file) => {
    setIsUploading(true);
    try {
      const response = await apiService.uploadFile(file);
      setUploadedFile({ name: file.name, path: response.file_path });
      return response.file_path;
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const sendChatMessage = (text, displayText = null) => {
    if (isProcessing) return;

    let cleanDisplayText = displayText || text;
    if (cleanDisplayText.startsWith('/research ')) {
      cleanDisplayText = cleanDisplayText.replace('/research ', '');
    }

    setChatMessages(prev => [...prev, {
      id: Date.now(),
      sender: 'user',
      text: cleanDisplayText,
      timestamp: new Date().toISOString()
    }]);

    setIsProcessing(true);
    if (clearTimerRef.current) {
      clearTimeout(clearTimerRef.current);
      clearTimerRef.current = null;
    }
    setStatusHistory([]);
    sendMessage(text, uploadedFile?.path);
  };

  const clearSession = () => {
    localStorage.removeItem('report_session_id');
    setChatMessages([]);
    setUploadedFile(null);
    setIsProcessing(false);
    processedRef.current = 0;
    setStatusHistory([]);
    window.location.reload();
  };

  return {
    sessionId,
    isConnected,
    chatMessages,
    statusHistory,
    isProcessing,
    uploadedFile,
    isUploading,
    handleFileUpload,
    sendChatMessage,
    clearSession
  };
};
