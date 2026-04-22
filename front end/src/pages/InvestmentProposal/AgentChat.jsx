import React, { useState, useEffect, useRef } from 'react';
import { chatResponseEngine } from '../../../data/chatResponseEngine';
import './AgentChat.css';

const AgentChat = ({ onCardGenerated }) => {
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      text: "Hello! I'm your Investment Proposal assistant. I can help you compare portfolios, modify allocations, and suggest optimizations. Try asking me to 'compare portfolios' or 'suggest optimizations'.", 
      sender: 'agent',
      timestamp: new Date().toISOString()
    }
  ]);
  const [tooltipMessage, setTooltipMessage] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    const handleTooltipRequest = (event) => {
      const { text } = event.detail;
      setTooltipMessage({
        text: text,
        timestamp: new Date().toISOString()
      });
    };

    const handleTooltipClear = () => {
      setTooltipMessage(null);
    };

    window.addEventListener('agentTooltip', handleTooltipRequest);
    window.addEventListener('agentTooltipClear', handleTooltipClear);
    return () => {
      window.removeEventListener('agentTooltip', handleTooltipRequest);
      window.removeEventListener('agentTooltipClear', handleTooltipClear);
    };
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    const userMessage = {
      id: messages.length + 1,
      text: newMessage,
      sender: 'user',
      timestamp: new Date().toISOString()
    };
    
    setMessages([...messages, userMessage]);
    const messageText = newMessage;
    setNewMessage('');
    setIsTyping(true);
    
    setTimeout(() => {
      const response = chatResponseEngine.processMessage(messageText);
      
      const agentResponse = {
        id: messages.length + 2,
        text: response.agentResponse,
        sender: 'agent',
        timestamp: new Date().toISOString()
      };
      
      setIsTyping(false);
      setMessages(prev => [...prev, agentResponse]);
      
      if (response.cardType && onCardGenerated) {
        onCardGenerated({
          id: Date.now(),
          type: response.cardType,
          data: response.data
        });
      }
    }, 800);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="agent-chat-container">
      <div className="agent-chat-header">
        <div className="agent-info">
          <div className="agent-avatar">
            <i className="material-icons">psychology</i>
          </div>
          <div>
            <h3>Investment Proposal Agent</h3>
            <span className="agent-status">Online</span>
          </div>
        </div>
      </div>
      
      <div className="agent-messages-container">
        {tooltipMessage && (
          <div className="agent-message agent-message-item tooltip-message">
            <div className="message-content">
              <p>{tooltipMessage.text}</p>
            </div>
          </div>
        )}
        
        {messages.map(message => (
          <div 
            key={message.id} 
            className={`agent-message ${message.sender === 'user' ? 'user-message' : 'agent-message-item'}`}
          >
            <div className="message-content">
              <p>{message.text}</p>
              <span className="message-time">{formatTime(message.timestamp)}</span>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form className="agent-input-container" onSubmit={handleSendMessage}>
        <input
          type="text"
          placeholder="Ask me about portfolios, modifications, or optimizations..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="agent-input"
        />
        <button 
          type="submit" 
          className="agent-send-button" 
          disabled={!newMessage.trim() || isTyping}
        >
          <i className="material-icons">send</i>
        </button>
      </form>
    </div>
  );
};

export default AgentChat;
