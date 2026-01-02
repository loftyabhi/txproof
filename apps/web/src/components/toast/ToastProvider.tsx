'use client';

import React, { useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ToastContext, Toast, ToastType } from './ToastContext';
import { ToastItem } from './ToastItem';

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
        const id = Math.random().toString(36).substring(7);
        const newToast = { ...toast, id };

        setToasts((prev) => [...prev, newToast]);
        return id;
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const success = useCallback((message: string, title?: string, duration?: number) => {
        addToast({ type: 'success', message, title, duration });
    }, [addToast]);

    const error = useCallback((message: string, title?: string, duration?: number) => {
        addToast({ type: 'error', message, title, duration });
    }, [addToast]);

    const info = useCallback((message: string, title?: string, duration?: number) => {
        addToast({ type: 'info', message, title, duration });
    }, [addToast]);

    const warning = useCallback((message: string, title?: string, duration?: number) => {
        addToast({ type: 'warning', message, title, duration });
    }, [addToast]);

    const loading = useCallback((message: string, title?: string) => {
        return addToast({ type: 'loading', message, title, duration: Infinity });
    }, [addToast]);

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, info, warning, loading }}>
            {children}

            {/* Toast Container */}
            <div className="fixed bottom-0 right-0 z-[100] p-6 flex flex-col gap-3 w-full max-w-sm pointer-events-none">
                <style jsx global>{`
                    /* Allow clicks on toasts but let click-through happen on the container's empty space */
                    .toast-viewport > * {
                        pointer-events: auto;
                    }
                `}</style>
                <div className="toast-viewport flex flex-col gap-3 items-end w-full">
                    <AnimatePresence mode="popLayout">
                        {toasts.map((toast) => (
                            <ToastItem key={toast.id} toast={toast} />
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </ToastContext.Provider>
    );
}
