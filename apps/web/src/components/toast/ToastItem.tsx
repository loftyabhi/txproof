'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle, Loader2, Terminal } from 'lucide-react';
import { Toast, useToast } from './ToastContext';

const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-green-500" />,
    error: <Terminal className="w-5 h-5 text-red-500" />, // Use Terminal icon for the console-like error
    info: <Info className="w-5 h-5 text-blue-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
    loading: <Loader2 className="w-5 h-5 text-purple-500 animate-spin" />,
};

const styles = {
    success: 'border-green-500/20 bg-green-500/5 shadow-[0_0_30px_-5px_theme(colors.green.500/0.3)]',
    error: 'border-red-500/20 bg-red-500/5 shadow-[0_0_30px_-5px_theme(colors.red.500/0.3)] font-mono', // Console like font for error
    info: 'border-blue-500/20 bg-blue-500/5 shadow-[0_0_30px_-5px_theme(colors.blue.500/0.3)]',
    warning: 'border-yellow-500/20 bg-yellow-500/5 shadow-[0_0_30px_-5px_theme(colors.yellow.500/0.3)]',
    loading: 'border-purple-500/20 bg-purple-500/5 shadow-[0_0_30px_-5px_theme(colors.purple.500/0.3)]',
};

interface ToastItemProps {
    toast: Toast;
}

export const ToastItem: React.FC<ToastItemProps> = ({ toast }) => {
    const { removeToast } = useToast();

    useEffect(() => {
        if (toast.duration !== Infinity && toast.type !== 'loading') {
            const timer = setTimeout(() => {
                removeToast(toast.id);
            }, toast.duration || 5000);
            return () => clearTimeout(timer);
        }
    }, [toast, removeToast]);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            whileHover={{ scale: 1.02 }}
            className={`
                relative w-full max-w-sm rounded-[1rem] border p-4 backdrop-blur-xl
                flex items-start gap-3 overflow-hidden cursor-default
                ${styles[toast.type]}
            `}
        >
            {/* Background Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50 pointer-events-none" />

            {/* Icon */}
            <div className="relative shrink-0 mt-0.5">
                {icons[toast.type]}
            </div>

            {/* Content */}
            <div className="flex-1 relative min-w-0">
                {toast.title && (
                    <h3 className={`font-semibold text-sm mb-1 truncate ${toast.type === 'error' ? 'text-red-400 font-mono tracking-tight' : 'text-gray-200'}`}>
                        {toast.type === 'error' && <span className="mr-2 opacity-50">ERROR:</span>}
                        {toast.title}
                    </h3>
                )}
                <p className={`text-sm break-words leading-relaxed ${toast.type === 'error' ? 'text-red-300/80 font-mono text-xs' : 'text-gray-400'}`}>
                    {toast.message}
                </p>

                {toast.action && (
                    <button
                        onClick={toast.action.onClick}
                        className="mt-3 text-xs font-medium text-white/90 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-md transition-colors"
                    >
                        {toast.action.label}
                    </button>
                )}
            </div>

            {/* Close Button */}
            <button
                onClick={() => removeToast(toast.id)}
                className="relative shrink-0 text-gray-500 hover:text-gray-300 transition-colors -mr-1 -mt-1 p-1"
            >
                <X className="w-4 h-4" />
            </button>

            {/* Progress Bar (Optional, simpler to just animate usage) */}
        </motion.div>
    );
};
