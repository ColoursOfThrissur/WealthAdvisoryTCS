import { createContext, useContext, useState, useCallback, useRef } from 'react';

const ToastContext = createContext(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx.toast;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, leaving: true } : t));
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 300);
  }, []);

  const toast = useCallback((message, type = 'info', duration = 3000) => {
    const id = ++idRef.current;
    setToasts(prev => [...prev, { id, message, type, duration, leaving: false }]);
    if (duration > 0) setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ toast, toasts, dismiss }}>
      {children}
    </ToastContext.Provider>
  );
};

export { ToastContext };
