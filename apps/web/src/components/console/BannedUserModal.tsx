import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertOctagon, Mail, LogOut, X } from 'lucide-react';
import { useDisconnect } from 'wagmi';

interface BannedUserModalProps {
    isOpen: boolean;
    reason: string | null;
    onClose: () => void;
}

export const BannedUserModal = ({ isOpen, reason, onClose }: BannedUserModalProps) => {
    const { disconnect } = useDisconnect();

    console.log('BannedUserModal render:', { isOpen, reason });

    const handleDisconnect = () => {
        disconnect();
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="bg-[#0a0a0a] border border-red-500/20 p-8 rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden"
                    >
                        {/* Background Decoration */}
                        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-red-500/10 blur-3xl rounded-full pointer-events-none" />
                        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-red-500/5 blur-3xl rounded-full pointer-events-none" />

                        <div className="flex flex-col items-center text-center mb-6">
                            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                                <AlertOctagon size={32} className="text-red-500" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Account Suspended</h2>
                            <p className="text-zinc-400 text-sm">
                                Your access to the Developer Console has been restricted.
                            </p>
                        </div>

                        <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4 mb-8">
                            <label className="text-xs font-bold text-red-400 uppercase mb-1 block">Reason for suspension</label>
                            <p className="text-red-200 font-medium font-mono text-sm break-words">
                                {reason || "Violation of Terms of Service"}
                            </p>
                        </div>

                        <div className="space-y-3">
                            <a
                                href={`mailto:support@txproof.xyz?subject=Account Suspension Appeal&body=My account has been suspended. Reason: ${reason}`}
                                className="w-full flex items-center justify-center gap-2 bg-white text-black hover:bg-zinc-200 font-bold py-3.5 rounded-xl transition-all"
                            >
                                <Mail size={18} />
                                Contact Support
                            </a>

                            <button
                                onClick={handleDisconnect}
                                className="w-full flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/5 hover:border-white/10 font-bold py-3.5 rounded-xl transition-all"
                            >
                                <LogOut size={18} />
                                Disconnect Wallet
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
