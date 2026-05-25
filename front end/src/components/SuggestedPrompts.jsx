import { TrendingUp, AlertCircle } from 'lucide-react';
import Tooltip from './Tooltip';
import './SuggestedPrompts.css';

const SuggestedPrompts = ({ prompts, onPromptClick, isLoading, mode }) => {
  if (!prompts || prompts.length === 0) return null;

  return (
    <div className={`suggested-prompts suggested-prompts--${mode}`}>
      <div className="suggested-prompts__grid">
        {prompts.map((prompt, index) => {
          const Icon = prompt.icon;
          return (
          <Tooltip key={index} content={prompt.text} placement="top">
            <button
              className={`suggested-prompt ${prompt.highlight ? 'suggested-prompt--highlight' : ''} ${prompt.trending ? 'suggested-prompt--trending' : ''} ${prompt.priority === 'critical' ? 'suggested-prompt--critical' : ''}`}
              onClick={() => onPromptClick(prompt)}
              disabled={isLoading}
            >
              {Icon && (
                <span className="suggested-prompt__icon">
                  <Icon size={14} />
                </span>
              )}
              <span className="suggested-prompt__text">{prompt.text}</span>
              {prompt.trending && (
                <span className="suggested-prompt__badge trending">
                  <TrendingUp size={10} />
                </span>
              )}
              {prompt.priority === 'critical' && (
                <span className="suggested-prompt__badge critical">
                  <AlertCircle size={10} />
                </span>
              )}
            </button>
          </Tooltip>
          );
        })}
      </div>
    </div>
  );
};

export default SuggestedPrompts;
