import './GlassPanel.css';

const GlassPanel = ({ children, className = '', blur = 'md', glow = false, ...props }) => {
  return (
    <div 
      className={`glass-panel glass-panel--blur-${blur} ${glow ? 'glass-panel--glow' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default GlassPanel;
