import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      removeToast(id);
    }, 3000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[60] flex flex-col space-y-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center justify-between p-4 mb-2 w-80 max-w-sm rounded-lg shadow-lg border transition-all duration-300 transform translate-x-0 opacity-100 ${
              t.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/40 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800'
                : t.type === 'error'
                ? 'bg-red-50 dark:bg-red-900/40 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800'
                : 'bg-blue-50 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800'
            }`}
          >
            <div className="flex items-center space-x-3">
              {t.type === 'success' && <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400" />}
              {t.type === 'error' && <XCircle className="h-5 w-5 text-red-500 dark:text-red-400" />}
              {t.type === 'info' && <Info className="h-5 w-5 text-blue-500 dark:text-blue-400" />}
              <p className="text-sm font-medium">{t.message}</p>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none ml-4 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
