'use client';

import { useState } from 'react';
import { useWriteContract, useAccount } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import RegistryManagerArtifact from '../abis/RegistryManager.json';

const CONTRACT_ADDRESS = '0xea6d4f5a6d39767722b82a8f1028ae6022ce73f9'; // Example Address

export function RegistrationModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { writeContract, isPending, isSuccess, error } = useWriteContract();
    const { address } = useAccount();

    const handleRegister = () => {
        writeContract({
            address: CONTRACT_ADDRESS,
            abi: RegistryManagerArtifact.abi,
            functionName: 'register',
            args: ['Accepted Terms V1'], // tcHash
            value: 0n, // Registration might be free or have fee
        });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl bg-[#111] border border-white/10 p-6 shadow-2xl"
                    >
                        <h2 className="text-xl font-bold text-white">Create Account</h2>
                        <p className="mt-2 text-sm text-gray-400">
                            Register your wallet to save generated receipts and manage your plans.
                        </p>

                        <div className="my-6 space-y-4 rounded-lg bg-white/5 p-4">
                            <h3 className="text-sm font-semibold text-white">Terms of Service</h3>
                            <div className="h-32 overflow-y-auto text-xs text-gray-400 pr-2">
                                <p>By registering, you agree to:</p>
                                <ul className="list-disc pl-4 mt-2 space-y-1">
                                    <li>Use this tool for lawful purposes only.</li>
                                    <li>Acknowledge that receipts are generated based on on-chain data.</li>
                                    <li>Pay any applicable fees for premium plans.</li>
                                </ul>
                            </div>
                        </div>

                        {error && (
                            <div className="mb-4 text-xs text-red-400 bg-red-500/10 p-2 rounded">
                                {(error as any).shortMessage || error.message}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRegister}
                                disabled={isPending || isSuccess}
                                className="flex-1 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
                            >
                                {isPending ? 'Signing...' : isSuccess ? 'Registered!' : 'Agree & Register'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
