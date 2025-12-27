'use client';

import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { FileText } from 'lucide-react';
import Link from 'next/link';
import { RegistrationModal } from './RegistrationModal';

export function Navbar() {
    const [isRegisterOpen, setIsRegisterOpen] = useState(false);

    return (
        <>
            <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/20 backdrop-blur-xl">
                <div className="mx-auto max-w-7xl px-6 py-4">
                    <div className="flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-2 group">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-white shadow-lg shadow-violet-500/20 transition-transform group-hover:scale-110">
                                <FileText size={20} className="font-bold" />
                            </div>
                            <span className="text-xl font-bold tracking-tight text-white">GChain Receipt</span>
                        </Link>

                        <div className="flex items-center gap-6">
                            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-300">
                                <button onClick={() => setIsRegisterOpen(true)} className="hover:text-white transition-colors">Register</button>
                                <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
                                <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
                                <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
                            </div>
                            <ConnectButton showBalance={false} />
                        </div>
                    </div>
                </div>
            </nav>
            <RegistrationModal isOpen={isRegisterOpen} onClose={() => setIsRegisterOpen(false)} />
        </>
    );
}
