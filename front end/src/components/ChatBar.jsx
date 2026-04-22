import { useState } from 'react';
import { Send, Sparkles } from 'lucide-react';
import './ChatBar.css';

const ChatBar = ({ onSend }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      onSend(input);
      setInput('');
    }
  };

  return (
    <form className="chat-bar" onSubmit={handleSubmit}>
      <div className="chat-bar__icon">
        <Sparkles size={20} />
      </div>
      <input
        type="text"
        className="chat-bar__input"
        placeholder="Ask AI to modify dashboard, analyze data, or get insights..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <button type="submit" className="chat-bar__button" disabled={!input.trim()}>
        <Send size={20} />
      </button>
    </form>
  );
};

export default ChatBar;
