import React, { useEffect } from 'react';

interface ToastProps {
    message: string;
    type?: 'success' | 'error' | 'info';
    onClose: () => void;
    duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, type = 'success', onClose, duration = 3000 }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
    const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';

    return (
        <div 
            className={`fixed bottom-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-up z-50 max-w-md`}
        >
            <span className="text-xl font-bold">{icon}</span>
            <span className="text-sm font-medium">{message}</span>
            <button 
                onClick={onClose}
                className="ml-2 hover:bg-white/20 rounded-full w-5 h-5 flex items-center justify-center text-xs transition-colors"
            >
                ✕
            </button>
        </div>
    );
};

export default Toast;
