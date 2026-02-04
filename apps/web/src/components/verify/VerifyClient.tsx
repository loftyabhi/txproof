'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export function VerifyClient() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Verifying your email address...');

    useEffect(() => {
        const token = searchParams.get('token');
        if (!token) {
            setStatus('error');
            setMessage('Invalid verification link: No token provided.');
            return;
        }

        const verifyEmail = async () => {
            try {
                // Call Backend API
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.txproof.xyz';
                const res = await fetch(`${apiUrl}/api/v1/user/verify/${token}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.error || 'Verification failed');
                }

                // Analytics Tracking
                if (typeof window !== 'undefined' && (window as any).gtag) {
                    (window as any).gtag('event', 'email_verification', {
                        'event_category': 'onboarding',
                        'event_label': 'success',
                        'value': 1
                    });
                }

                setStatus('success');
                setMessage(data.message || 'Your email has been successfully verified!');
            } catch (err: any) {
                // Analytics Tracking
                if (typeof window !== 'undefined' && (window as any).gtag) {
                    (window as any).gtag('event', 'email_verification', {
                        'event_category': 'onboarding',
                        'event_label': 'failure',
                        'error_message': err.message
                    });
                }

                setStatus('error');
                setMessage(err.message || 'An error occurred during verification.');
            }
        };

        verifyEmail();
    }, [searchParams]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md w-full bg-white/5 border border-white/10 p-10 rounded-3xl backdrop-blur-xl shadow-2xl text-center relative z-10"
        >
            {status === 'loading' && (
                <div className="flex flex-col items-center">
                    <Loader2 className="animate-spin text-blue-500 mb-6" size={48} />
                    <h1 className="text-2xl font-bold mb-2">Processing...</h1>
                    <p className="text-gray-400">{message}</p>
                </div>
            )}

            {status === 'success' && (
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-6">
                        <CheckCircle size={32} />
                    </div>
                    <h1 className="text-2xl font-bold mb-3 text-white">Verified!</h1>
                    <p className="text-gray-400 mb-8">{message}</p>
                    <button
                        onClick={() => router.push('/developers')}
                        className="w-full bg-white text-black hover:bg-zinc-200 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                    >
                        Go to Console <ArrowRight size={18} />
                    </button>
                </div>
            )}

            {status === 'error' && (
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mb-6">
                        <XCircle size={32} />
                    </div>
                    <h1 className="text-2xl font-bold mb-3 text-white">Oops!</h1>
                    <p className="text-gray-400 mb-8">{message}</p>
                    <button
                        onClick={() => router.push('/developers')}
                        className="w-full bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-bold transition-all"
                    >
                        Back to Profile
                    </button>
                </div>
            )}
        </motion.div>
    );
}
