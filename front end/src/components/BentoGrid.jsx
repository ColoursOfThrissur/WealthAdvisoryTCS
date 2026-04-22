import './BentoGrid.css';

const BentoGrid = ({ children, className = '' }) => {
  return (
    <div className={`bento-grid ${className}`}>
      {children}
    </div>
  );
};

export const BentoItem = ({ children, span = 1, className = '' }) => {
  return (
    <div className={`bento-item bento-item--span-${span} ${className}`}>
      {children}
    </div>
  );
};

export default BentoGrid;
