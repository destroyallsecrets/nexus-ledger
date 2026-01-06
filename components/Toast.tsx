import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { ToastMessage } from '../types';

interface ToastProps {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto min-w-[320px] max-w-sm bg-nexus-800 border border-nexus-700 shadow-2xl rounded-lg p-4 flex items-start gap-3 animate-in slide-in-from-right-full duration-300"
        >
          <div className="mt-0.5">
            {toast.type === 'success' && <CheckCircle className="text-nexus-success" size={20} />}
            {toast.type === 'error' && <AlertCircle className="text-nexus-danger" size={20} />}
            {toast.type === 'info' && <Info className="text-nexus-accent" size={20} />}
          </div>
          <div className="flex-1">
            <h4 className="text-white font-semibold text-sm">{toast.title}</h4>
            <p className="text-gray-400 text-xs mt-1">{toast.message}</p>
          </div>
          <button 
            onClick={() => removeToast(toast.id)}
            className="text-gray-500 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};

export const useToast = () => {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return { toasts, addToast, removeToast };
};