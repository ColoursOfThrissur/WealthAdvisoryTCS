import GlassPanel from './GlassPanel';
import './Card.css';

const Card = ({ children, title, icon, actions, className = '', ...props }) => {
  return (
    <GlassPanel className={`card ${className}`} {...props}>
      {(title || icon || actions) && (
        <div className="card__header">
          <div className="card__title-wrapper">
            {icon && <span className="card__icon">{icon}</span>}
            {title && <h3 className="card__title">{title}</h3>}
          </div>
          {actions && <div className="card__actions">{actions}</div>}
        </div>
      )}
      <div className="card__content">{children}</div>
    </GlassPanel>
  );
};

export default Card;
