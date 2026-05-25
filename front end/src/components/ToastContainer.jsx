import { useContext } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { ToastContext } from '../contexts/ToastContext';
import './ToastContainer.css';

const ICONS = {
  success: <CheckCircle size={16} />,
  error:   <AlertCircle size={16} />,
  warning: <AlertTriangle size={16} />,
  info:    <Info size={16} />,
};

const ToastContainer = () => {
  const { toasts, dismiss } = useContext(ToastContext);

  if (!toasts.length) return null;

  return createPortal(
    <div className="toast-container">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`toast toast--${t.type}${t.leaving ? ' toast--leaving' : ''}`}
        >
          <span className="toast__icon">{ICONS[t.type]}</span>
          <div className="toast__body">
            <span className="toast__message">{t.message}</span>
          </div>
          <button className="toast__close" onClick={() => dismiss(t.id)}>
            <X size={14} />
          </button>
          <div
            className="toast__progress"
            style={{ animationDuration: `${t.duration || 3000}ms` }}
          />
        </div>
      ))}
    </div>,
    document.body
  );
};

export default ToastContainer;
