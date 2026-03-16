import React from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface NotificationProps {
  message: string;
  type: 'success' | 'error';
}

export const Notification: React.FC<NotificationProps> = ({ message, type }) => {
  return (
    <div className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border ${
      type === 'success' 
        ? 'bg-green-500/20 border-green-500/50 text-green-100' 
        : 'bg-red-500/20 border-red-500/50 text-red-100'
    } animate-[slide-in_0.3s_ease-out]`}>
      <div className="flex items-center gap-3">
        {type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
        <span className="font-medium">{message}</span>
      </div>
    </div>
  );
};