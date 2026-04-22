import { useState } from 'react';
import { Send, Sparkles, ArrowLeft } from 'lucide-react';
import UniversalCard from '../components/UniversalCard';
import { useOverviewContext } from '../contexts/OverviewContext';
import './OverviewBarMode.css';

const OverviewBarMode = () => {
  const { cards } = useOverviewContext();
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isChatActive, setIsChatActive] = useState(false);

  const actionCards = [
    {
      type: 'agent',
      data: {
        name: 'Rebalancing Portfolio',
        label: 'Worklist',
        clientsNeedingAction: 12,
        totalClients: 45,
        description: 'Review and complete portfolio rebalancing actions',
        priority: 'high',
        onClick: () => console.log('Navigate to worklist')
      }
    },
    {
      type: 'agent',
      data: {
        name: 'Investment Proposal',
        label: 'Action Items',
        clientsNeedingAction: 8,
        totalClients: 45,
        description: 'Create and review investment proposals for clients',
        priority: 'medium',
        onClick: () => console.log('Navigate to reviews')
      }
    }
  ];

  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (chatInput.trim()) {
      setMessages([...messages, { text: chatInput, sender: 'user' }]);
      setChatInput('');
      setIsChatActive(true);
      
      // Add AI response after a short delay
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          text: 'Based on your portfolio analysis, here are the key insights:', 
          sender: 'ai',
          hasChart: true 
        }]);
      }, 1000);
    }
  };

  return (
    <div className="overview-bar">
      <div className={`overview-bar__content ${isChatActive ? 'overview-bar__content--hidden' : ''}`}>
        <div className="overview-bar__main">
          <div className="overview-bar__graph">
            <UniversalCard {...cards.chart} />
          </div>
          <div className="overview-bar__actions">
            {actionCards.map((card, index) => (
              <UniversalCard key={index} {...card} />
            ))}
          </div>
        </div>
      </div>

      {isChatActive && (
        <div className="overview-bar__chat-view">
          <div className="overview-bar__chat-header">
            <button className="overview-bar__back-btn" onClick={() => setIsChatActive(false)}>
              <ArrowLeft size={20} />
              Back to Cockpit View
            </button>
          </div>
          <div className="overview-bar__messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`overview-bar__message overview-bar__message--${msg.sender}`}>
                {msg.text}
                {msg.hasChart && (
                  <div className="overview-bar__chart-response">
                    <div className="overview-bar__chart-header">
                      <span className="overview-bar__chart-label">Portfolio Performance</span>
                      <span className="overview-bar__chart-value">+12.5%</span>
                    </div>
                    <div className="overview-bar__chart-bar">
                      <div className="overview-bar__chart-fill" style={{ width: '75%' }}></div>
                    </div>
                    <p className="overview-bar__chart-text">Your portfolio has outperformed the market by 5.2% this quarter. Top performing assets include tech stocks and renewable energy funds.</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="overview-bar__chat-bar">
        <form className="chat-bar-form" onSubmit={handleChatSubmit}>
          <div className="chat-bar-form__icon">
            <Sparkles size={20} />
          </div>
          <input
            type="text"
            className="chat-bar-form__input"
            placeholder="Ask AI to modify dashboard, analyze data, or get insights..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
          />
          <button type="submit" className="chat-bar-form__button" disabled={!chatInput.trim()}>
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default OverviewBarMode;
