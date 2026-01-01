'use client';

import { useState } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import axios from 'axios';
import { motion } from 'framer-motion';

interface AdminLoginProps {
    onLogin: (token: string) => void;
}

export function AdminLogin({ onLogin }: AdminLoginProps) {
    const { address, isConnected } = useAccount();
    const { signMessageAsync } = useSignMessage();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async () => {
        if (!address) return;
        setIsLoading(true);
        setError('');

        try {
            // 1. Get Nonce (Simulated for this MVP, normally fetch from backend)
            const nonce = `Sign this message to login to Chain Receipt Manager.\nNonce: ${Date.now()}`;

            // 2. Sign Message
            const signature = await signMessageAsync({ message: nonce });

            // 3. Verify on Backend
            const res = await axios.post('http://localhost:3002/api/v1/auth/login', {
                address,
                signature,
                nonce
            });

            // 4. Save Token
            localStorage.setItem('admin_token', res.data.token);
            onLogin(res.data.token);

        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.error || 'Login failed. Are you the admin?');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isConnected) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center">
                <div className="mb-4 text-4xl">🔐</div>
                <h2 className="mb-2 text-2xl font-bold text-white">Admin Access</h2>
                <p className="text-gray-400">Please connect your wallet to continue.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center p-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl"
            >
                <div className="mb-6 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-violet-500/20 text-2xl">
                        🛡️
                    </div>
                    <h2 className="text-xl font-bold text-white">Admin Dashboard</h2>
                    <p className="mt-2 text-sm text-gray-400">
                        {address?.slice(0, 6)}...{address?.slice(-4)}
                    </p>
                </div>

                {error && (
                    <div className="mb-4 rounded bg-red-500/10 p-3 text-sm text-red-400">
                        {error}
                    </div>
                )}

                <button
                    onClick={handleLogin}
                    disabled={isLoading}
                    className="w-full rounded-lg bg-violet-600 py-3 font-medium text-white transition-colors hover:bg-violet-700 disabled:opacity-50"
                >
                    {isLoading ? 'Verifying...' : 'Sign In with Wallet'}
                </button>
            </motion.div>
        </div>
    );
}
