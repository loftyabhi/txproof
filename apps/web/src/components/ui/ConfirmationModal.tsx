'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Info, X } from 'lucide-react';
import { useEffect } from 'react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    type?: 'danger' | 'info' | 'warning';
    confirmText?: string;
    cancelText?: string;
    isLoading?: boolean;
}

export function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    type = 'danger',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isLoading = false
}: ConfirmationModalProps) {
    // Close on Escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            window.addEventListener('keydown', handleEscape);
        }

        return () => window.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const overlayVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 }
    };

    const modalVariants = {
        hidden: { opacity: 0, scale: 0.95, y: 10 },
        visible: { opacity: 1, scale: 1, y: 0 }
    };

    const getIcon = () => {
        switch (type) {
            case 'danger':
                return <AlertTriangle className="text-red-500" size={24} />;
            case 'warning':
                return <AlertTriangle className="text-amber-500" size={24} />;
            case 'info':
            default:
                return <Info className="text-blue-500" size={24} />;
        }
    };

    const getConfirmButtonStyle = () => {
        switch (type) {
            case 'danger':
                return 'bg-red-600 hover:bg-red-700 focus:ring-red-500';
            case 'warning':
                return 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500';
            case 'info':
            default:
                return 'bg-violet-600 hover:bg-violet-700 focus:ring-violet-500';
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 text-center">
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        variants={overlayVariants}
                        onClick={onClose}
                        aria-hidden="true"
                    />

                    {/* Modal Panel */}
                    <motion.div
                        className="relative z-10 w-full max-w-md transform overflow-hidden rounded-2xl bg-[#111] border border-white/10 text-left align-middle shadow-2xl transition-all"
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        variants={modalVariants}
                        transition={{ duration: 0.2 }}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="modal-headline"
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="p-6">
                            <div className="flex items-start gap-4">
                                <div className={`flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-full bg-white/5 border border-white/5`}>
                                    {getIcon()}
                                </div>
                                <div className="mt-1">
                                    <h3 className="text-lg font-bold text-white leading-6" id="modal-headline">
                                        {title}
                                    </h3>
                                    <div className="mt-2">
                                        <p className="text-sm text-zinc-400 leading-relaxed">
                                            {message}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/5 px-6 py-4 sm:flex sm:flex-row-reverse sm:gap-3">
                            <button
                                type="button"
                                className={`inline-flex w-full justify-center rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow-sm ring-1 ring-inset ring-white/10 transition-all sm:ml-3 sm:w-auto ${getConfirmButtonStyle()} disabled:opacity-50 disabled:cursor-not-allowed`}
                                onClick={onConfirm}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Processing...
                                    </span>
                                ) : (
                                    confirmText
                                )}
                            </button>
                            <button
                                type="button"
                                className="mt-3 inline-flex w-full justify-center rounded-lg bg-white/5 px-5 py-2.5 text-sm font-semibold text-gray-300 shadow-sm ring-1 ring-inset ring-white/10 hover:bg-white/10 transition-all sm:mt-0 sm:w-auto"
                                onClick={onClose}
                                disabled={isLoading}
                            >
                                {cancelText}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
