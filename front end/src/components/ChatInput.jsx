import { useState } from 'react';
import { Send } from 'lucide-react';
import './ChatInput.css';

const ChatInput = ({ onSend }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      onSend(input);
      setInput('');
    }
  };

  return (
    <form className="chat-input" onSubmit={handleSubmit}>
      <input
        type="text"
        className="chat-input__field"
        placeholder="Ask about your portfolio..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <button type="submit" className="chat-input__button" disabled={!input.trim()}>
        <Send size={20} />
      </button>
    </form>
  );
};

export default ChatInput;
