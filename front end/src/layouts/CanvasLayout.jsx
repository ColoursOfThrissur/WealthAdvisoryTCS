import './CanvasLayout.css';

const CanvasLayout = ({ children }) => {
  return (
    <div className="canvas-layout">
      <div className="canvas-layout__main">
        {children}
      </div>
    </div>
  );
};

export default CanvasLayout;
