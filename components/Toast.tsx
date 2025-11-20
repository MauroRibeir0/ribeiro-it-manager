import React, { useEffect } from 'react';
import { NotificationToast } from '../types';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

interface ToastContainerProps {
  toasts: NotificationToast[];
  removeToast: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed top-4 right-4 z-[2000] flex flex-col gap-2 w-full max-w-sm px-4 sm:px-0">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: NotificationToast; onRemove: () => void }> = ({ toast, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove();
    }, 5000); // Auto dismiss after 5s
    return () => clearTimeout(timer);
  }, [onRemove]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success': return <CheckCircle size={20} className="text-green-500" />;
      case 'error': return <AlertCircle size={20} className="text-red-500" />;
      case 'warning': return <AlertTriangle size={20} className="text-yellow-500" />;
      default: return <Info size={20} className="text-blue-500" />;
    }
  };

  const getBorderColor = () => {
    switch (toast.type) {
      case 'success': return 'border-green-500';
      case 'error': return 'border-red-500';
      case 'warning': return 'border-yellow-500';
      default: return 'border-blue-500';
    }
  };

  return (
    <div className={`bg-white p-4 rounded-lg shadow-xl border-l-4 ${getBorderColor()} flex items-start gap-3 animate-slide-left`}>
      <div className="shrink-0 mt-0.5">{getIcon()}</div>
      <div className="flex-grow text-sm font-medium text-gray-800">{toast.message}</div>
      <button onClick={onRemove} className="text-gray-400 hover:text-gray-600">
        <X size={16} />
      </button>
    </div>
  );
};

export default ToastContainer;