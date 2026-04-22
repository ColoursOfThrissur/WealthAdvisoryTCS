import { useState, useEffect } from 'react';
import ChatController from '../controllers/ChatController';

export const useChat = () => {
  const [messages, setMessages] = useState(ChatController.getMessages());

  useEffect(() => {
    const unsubscribe = ChatController.subscribe(setMessages);
    return unsubscribe;
  }, []);

  const sendMessage = (content, role = 'user', uiAction = null) => {
    ChatController.addMessage({ content, role, uiAction });
  };

  const subscribeToUIInfluence = (callback) => {
    return ChatController.subscribeToUIInfluence(callback);
  };

  return {
    messages,
    sendMessage,
    subscribeToUIInfluence,
    clearMessages: () => ChatController.clearMessages()
  };
};
