import { Sparkles } from 'lucide-react';
import './AIBadge.css';

const AIBadge = ({ size = 'sm' }) => {
  return (
    <div className={`ai-badge ai-badge--${size}`}>
      <Sparkles size={size === 'sm' ? 12 : 16} />
      <span>AI</span>
    </div>
  );
};

export default AIBadge;
