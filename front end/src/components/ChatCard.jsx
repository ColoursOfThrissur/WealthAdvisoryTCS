import { useState } from 'react';
import { Sparkles, Send, X, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AIBadge from './AIBadge';
import './ChatCard.css';

const ChatCard = ({ onExpandChange, isExpanded }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      setMessages([...messages, { text: input, sender: 'user' }]);
      setInput('');
    }
  };

  const handleExpand = () => {
    navigate('/');
    onExpandChange?.(true);
  };

  const handleModeClick = (mode) => {
    navigate(`/chat?mode=${mode}`);
    onExpandChange?.(true);
  };

  if (isExpanded) {
    return null;
  }

  return (
    <div className="chat-card">
      <div className="chat-card__ai-badge">
        <AIBadge size="sm" />
      </div>
      <div className="chat-card__header">
        <h3 className="chat-card__title">Client Relationship Assist</h3>
        <Plus size={20} className="chat-card__expand-icon" onClick={handleExpand} />
      </div>
      <form className="chat-card__input-form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="chat-card__input"
          placeholder="How can I assist you today?"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onClick={handleExpand}
        />
        <button type="submit" className="chat-card__send-btn" onClick={handleExpand}>
          <Send size={16} />
        </button>
      </form>
      <div className="chat-card__suggestions">
        <button className="chat-card__suggestion" onClick={() => handleModeClick('email')}>Draft an email</button>
        <button className="chat-card__suggestion" onClick={() => handleModeClick('meeting')}>Meeting prep</button>
        <button className="chat-card__suggestion" onClick={() => handleModeClick('research')}>Research sector</button>
        <button className="chat-card__suggestion" onClick={() => handleModeClick('report')}>Generate client report</button>
      </div>
    </div>
  );
};

export default ChatCard;
