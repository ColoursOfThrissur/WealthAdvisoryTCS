import { useChat } from '../hooks/useChat';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import './AIChat.css';

const AIChat = () => {
  const { messages, sendMessage } = useChat();

  const handleSend = (content) => {
    sendMessage(content, 'user');
    setTimeout(() => {
      sendMessage('I can help you with that. What would you like to see?', 'assistant');
    }, 1000);
  };

  return (
    <div className="ai-chat">
      <div className="ai-chat__header">
        <h2>AI Assistant</h2>
      </div>
      <div className="ai-chat__messages">
        {messages.length === 0 ? (
          <div className="ai-chat__empty">
            <p>Ask me anything about your portfolio</p>
          </div>
        ) : (
          messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))
        )}
      </div>
      <ChatInput onSend={handleSend} />
    </div>
  );
};

export default AIChat;
