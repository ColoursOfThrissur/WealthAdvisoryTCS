import { useState, useEffect, useRef, useCallback } from 'react';
import { getWsBaseUrl } from '../config/api';

export const useWebSocket = (sessionId) => {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const connect = useCallback(() => {
    if (!sessionId) {
      console.log('[WS] No session ID yet, skipping connection');
      return;
    }

    const ws = new WebSocket(`${getWsBaseUrl()}/ws/chat/${sessionId}`);

    ws.onopen = () => {
      console.log('[WS] Connected with session:', sessionId);
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('WebSocket message:', data);
      
      if (data.type !== 'connected') {
        setMessages((prev) => [...prev, data]);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      // Auto-reconnect after 3 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log('Attempting to reconnect...');
        connect();
      }, 3000);
    };

    wsRef.current = ws;
  }, [sessionId]);

  const sendMessage = useCallback((content, filePath = null, benchmark = null) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const message = {
        type: 'message',
        content,
        file_path: filePath,
        benchmark: benchmark
      };
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
    }
  }, []);

  useEffect(() => {
    if (!sessionId) {
      console.log('[WS] Waiting for session ID...');
      return;
    }
    console.log('[WS] Session ID available, connecting:', sessionId);
    connect();
    return () => disconnect();
  }, [sessionId, connect, disconnect]);

  return {
    isConnected,
    messages,
    sendMessage,
    disconnect
  };
};
