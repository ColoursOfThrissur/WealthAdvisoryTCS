import './Spinner.css';

const COLOR_MAP = {
  success: 'var(--success)',
  warning: 'var(--warning)',
  error:   'var(--error)',
  muted:   'var(--text-tertiary)',
};

const Spinner = ({ size = 16, color = 'success', thickness, className = '' }) => {
  const borderWidth = thickness ?? Math.max(2, Math.round(size / 7));
  const accentColor = COLOR_MAP[color] || COLOR_MAP.success;

  return (
    <span
      className={`spinner ${className}`}
      style={{
        width:          size,
        height:         size,
        minWidth:       size,
        minHeight:      size,
        borderWidth:    borderWidth,
        borderStyle:    'solid',
        borderColor:    'var(--glass-border)',
        borderTopColor: accentColor,
        borderRadius:   '50%',
        display:        'inline-block',
        animation:      'spinner-spin 0.75s linear infinite',
        flexShrink:     0,
      }}
    />
  );
};

export default Spinner;
