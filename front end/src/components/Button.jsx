import './Button.css';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  glow = false,
  icon = null,
  className = '',
  ...props 
}) => {
  return (
    <button 
      className={`btn btn--${variant} btn--${size} ${glow ? 'btn--glow' : ''} ${className}`}
      {...props}
    >
      {icon && <span className="btn__icon">{icon}</span>}
      {children}
    </button>
  );
};

export default Button;
