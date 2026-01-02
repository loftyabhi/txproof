'use client';

import { useState, useEffect } from 'react';

import Link from 'next/link';
import { formatEther } from 'viem';
import { useAccount, useBalance, useEnsName } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';

const ADMIN_ADDRESS = process.env.ADMIN_ADDRESS;

export function Navbar() {
    const { address, isConnected } = useAccount();
    const { data: balance } = useBalance({ address });
    const { data: ensName } = useEnsName({ address });
    const { open } = useAppKit();
    const [isAdmin, setIsAdmin] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (address && ADMIN_ADDRESS && address.toLowerCase() === ADMIN_ADDRESS.toLowerCase()) {
            setIsAdmin(true);
        } else {
            setIsAdmin(false);
        }
    }, [address]);

    if (!mounted) return null;

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/20 backdrop-blur-xl">
            <div className="mx-auto max-w-7xl px-6 py-4">
                <div className="flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-white text-2xl shadow-lg shadow-violet-500/20 transition-transform group-hover:scale-110">
                            ⚡
                        </div>
                        <span className="text-xl font-bold tracking-tight text-white">Chain Receipt</span>
                    </Link>

                    <div className="flex items-center gap-6">
                        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-300">
                            {isConnected && (
                                <Link href="/support" className="hover:text-white transition-colors">Show Your Support</Link>
                            )}
                            {isAdmin && (
                                <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            <appkit-network-button />

                            {!isConnected ? (
                                <button
                                    onClick={() => open()}
                                    className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 hover:bg-violet-500 transition-all hover:scale-105 active:scale-95"
                                >
                                    Connect Wallet
                                </button>
                            ) : (
                                <button
                                    onClick={() => open()}
                                    className="flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 px-4 py-2 hover:bg-white/10 transition-all hover:scale-[1.02] active:scale-[0.98] group"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">
                                            {balance?.value ? parseFloat(formatEther(balance.value)).toFixed(3) : '0.000'} {balance?.symbol}
                                        </span>
                                        <div className="h-4 w-[1px] bg-white/10"></div>
                                        <div className="flex items-center gap-2">
                                            <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-violet-500 to-fuchsia-500 p-[1px]">
                                                <div className="h-full w-full rounded-full bg-black flex items-center justify-center">
                                                    <span className="text-[10px] text-white font-mono">
                                                        {ensName ? ensName.slice(0, 2).toUpperCase() : address?.slice(2, 4)}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className="text-sm font-medium text-gray-400 group-hover:text-gray-300 transition-colors">
                                                {ensName ? ensName : `${address?.slice(0, 6)}...${address?.slice(-4)}`}
                                            </span>
                                        </div>
                                    </div>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
