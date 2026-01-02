'use client';

import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { motion } from 'framer-motion';
import { Wallet, Shield, Zap, Globe, Heart, ArrowRight, User } from 'lucide-react';
import { useAccount, useBalance, useWriteContract, useSwitchChain, useChainId } from 'wagmi';
import { parseEther } from 'viem';
import { useAppKit } from '@reown/appkit/react';
import { baseSepolia } from '@reown/appkit/networks';
import { useState, useEffect } from 'react';
import { useToast } from '@/components/toast';



const FEATURES_SUPPORTED = [
    { icon: <Zap size={24} />, title: 'Free Tools', desc: 'Keeping receipt generation free for everyone Forever.' },
    { icon: <Shield size={24} />, title: 'Privacy First', desc: 'No tracking, no data selling, complete anonymity.' },
    { icon: <Globe size={24} />, title: 'Multi-Chain', desc: 'Supporting 10+ networks with high-performance RPCs.' },
    { icon: <Heart size={24} />, title: 'Open Source', desc: 'Community-driven development and transparent code.' },
];

const ROADMAP_ITEMS = [
    { status: 'Live', title: 'PDF Receipt Generation', desc: 'Instant audit-ready receipts for any transaction.' },
    { status: 'In Progress', title: 'Enterprise Dashboard', desc: 'Bulk export and team management features.' },
    { status: 'Planned', title: 'Tax Tool Integrations', desc: 'Direct sync with Quickbooks and Xero.' },
    { status: 'Planned', title: 'DAO Governance', desc: 'Community voting on future features.' },
];

export default function SupportPage() {
    const { address, isConnected } = useAccount();
    const { open } = useAppKit();
    const { success, error, loading, removeToast } = useToast();
    const [contributionAmount, setContributionAmount] = useState('');
    const [topContributors, setTopContributors] = useState<any[]>([]);

    useEffect(() => {
        fetch('/api/contributors?type=top')
            .then(res => res.json())
            .then(data => {
                if (data.contributors) {
                    setTopContributors(data.contributors);
                }
            })
            .catch(err => console.error('Failed to fetch contributors:', err));
    }, []);

    const [isPending, setIsPending] = useState(false);
    const { writeContractAsync } = useWriteContract();
    const { switchChainAsync } = useSwitchChain();
    const chainId = useChainId();

    // Minimal ABI for contribution
    const VAULT_ABI = [
        { inputs: [{ internalType: 'bool', name: 'isAnonymous', type: 'bool' }], name: 'contributeNative', outputs: [], stateMutability: 'payable', type: 'function' }
    ] as const;

    const VAULT_ADDRESS = process.env.NEXT_PUBLIC_SUPPORT_VAULT_ADDRESS as `0x${string}`;
    // Temporary hardcode for testing on Base Sepolia as requested
    const TARGET_CHAIN_ID = baseSepolia.id;

    const handleContribute = async () => {
        if (!isConnected) {
            open();
            return;
        }

        if (!contributionAmount || isNaN(Number(contributionAmount))) {
            error("Please enter a valid ETH amount", "Invalid Amount");
            return;
        }

        if (!VAULT_ADDRESS) {
            error("Contract address missing in config", "Configuration Error");
            return;
        }

        // Auto-switch Network
        if (chainId !== TARGET_CHAIN_ID) {
            const loadingId = loading("Switching network to Base Sepolia...", "Network Mismatch");
            try {
                await switchChainAsync({ chainId: TARGET_CHAIN_ID });
                removeToast(loadingId);
                // Success toast is optional here as we immediately proceed to contribution
            } catch (switchError: any) {
                removeToast(loadingId);
                if (switchError.message.includes("User rejected")) {
                    error("Network switch rejected", "Switch Cancelled");
                } else {
                    error("Failed to switch network", "Network Error");
                }
                return; // Stop if switch failed
            }
        }

        const toastId = loading("Please confirm the transaction in your wallet...", "Processing Contribution");

        try {
            setIsPending(true);
            const hash = await writeContractAsync({
                address: VAULT_ADDRESS,
                abi: VAULT_ABI,
                functionName: 'contributeNative',
                args: [false], // Anonymous flag - could be a state toggle in explicit UI
                value: parseEther(contributionAmount),
            });

            removeToast(toastId);
            success(`Transaction submitted! Hash: ${hash.slice(0, 10)}...`, "Contribution Successful");
            setContributionAmount('');
        } catch (err: any) {
            removeToast(toastId);
            console.error('Contribution failed:', err);

            // Extract meaningful error message
            let errorMsg = err.message || "Transaction failed";
            if (errorMsg.includes("User rejected")) {
                error("User rejected the request", "ContractFunctionExecutionError");
            } else {
                // Truncate really long internal errors
                error(errorMsg.length > 100 ? errorMsg.slice(0, 100) + "..." : errorMsg, "Transaction Failed");
            }
        } finally {
            setIsPending(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0B0F19] text-white font-sans selection:bg-purple-500/30 overflow-x-hidden flex flex-col">
            <Navbar />

            <main className="flex-grow relative pt-32 pb-20 px-6">
                {/* Background Elements (copied from page.tsx for consistency) */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                    <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-3xl opacity-50 mix-blend-screen filter" />
                    <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-3xl opacity-50 mix-blend-screen filter" />
                </div>

                <div className="max-w-6xl mx-auto relative z-10">

                    {/* A. Hero / Intro */}
                    <div className="text-center mb-20">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-purple-300 text-xs font-bold tracking-wide uppercase mb-6 shadow-sm backdrop-blur-sm"
                        >
                            <Heart size={14} className="text-purple-400" />
                            Community Powered
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 leading-[1.1] mb-6 tracking-tight"
                        >
                            Show Your Support
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="max-w-2xl mx-auto text-lg text-slate-400 leading-relaxed"
                        >
                            This platform is free and ad-supported. If you find it useful, you can support its continued development directly via blockchain.
                        </motion.p>
                    </div>

                    {/* B. Support Options */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="max-w-xl mx-auto bg-[#131B2C] rounded-2xl shadow-2xl border border-white/5 p-8 mb-20 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                            <Wallet className="text-purple-400" />
                            Make a Contribution
                        </h2>

                        <div className="space-y-6">
                            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                                <label className="block text-sm text-slate-400 mb-2">Select Amount</label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="number"
                                        placeholder="0.0"
                                        value={contributionAmount}
                                        onChange={(e) => setContributionAmount(e.target.value)}
                                        className="bg-transparent text-3xl font-bold text-white outline-none w-full placeholder:text-slate-600"
                                    />
                                    <span className="text-sm font-bold bg-white/10 px-3 py-1 rounded-lg text-slate-300">ETH</span>
                                </div>
                            </div>

                            <button
                                onClick={handleContribute}
                                className="w-full flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-6 py-4 font-bold text-white transition-all hover:bg-purple-500 hover:shadow-lg hover:shadow-purple-600/20 active:translate-y-0.5"
                            >
                                {isConnected ? 'Confirm Contribution' : 'Connect Wallet to Support'}
                                <ArrowRight size={18} />
                            </button>
                            <p className="text-center text-xs text-slate-500">
                                Supports Native ETH and select ERC20 tokens.
                            </p>
                        </div>
                    </motion.div>

                    {/* C. Top Contributors */}
                    <div className="mb-20">
                        <h2 className="text-3xl font-bold text-white mb-10 text-center">Top Contributors</h2>

                        {topContributors.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {topContributors.map((c, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, y: 10 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        className="p-6 rounded-2xl bg-white/5 border border-white/5 relative overflow-hidden group hover:border-purple-500/30 transition-all"
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 p-[1px]">
                                                <div className="h-full w-full rounded-full bg-[#0B0F19] flex items-center justify-center">
                                                    <span className="text-xs font-bold text-white">
                                                        #{idx + 1}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className="text-xs font-mono text-slate-500">
                                                {new Date(c.lastDate * 1000).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-bold text-white mb-1 truncate">
                                            {c.displayName === 'Anonymous Supporter' ? (
                                                <span className="text-slate-400 italic">Anonymous</span>
                                            ) : (
                                                `${c.address.slice(0, 6)}...${c.address.slice(-4)}`
                                            )}
                                        </h3>
                                        <p className="text-2xl font-bold text-purple-400">
                                            {c.total} ETH
                                        </p>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center py-12 rounded-2xl border border-white/5 bg-white/5 border-dashed"
                            >
                                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/5 text-purple-400 mb-4">
                                    <User size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Be the first supporter</h3>
                                <p className="text-slate-400">Your contribution will be permanently recognized here.</p>
                            </motion.div>
                        )}
                    </div>

                    {/* D. Features You Support */}
                    <div className="mb-20">
                        <h2 className="text-3xl font-bold text-white mb-10 text-center">Fueling Development</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {FEATURES_SUPPORTED.map((feature, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-colors"
                                >
                                    <div className="mb-4 text-purple-400">{feature.icon}</div>
                                    <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                                    <p className="text-sm text-slate-400 leading-relaxed">{feature.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* E. Future Plans */}
                    <div className="mb-20 max-w-3xl mx-auto">
                        <h2 className="text-3xl font-bold text-white mb-10 text-center">Roadmap</h2>
                        <div className="space-y-4">
                            {ROADMAP_ITEMS.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-6 p-4 rounded-xl bg-white/5 border border-white/5">
                                    <div className="min-w-[100px]">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${item.status === 'Live' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                            item.status === 'In Progress' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                                'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                                            }`}>
                                            {item.status}
                                        </span>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white">{item.title}</h4>
                                        <p className="text-sm text-slate-400">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Legal Disclaimer (Phase 9.4) */}
                    <div className="max-w-2xl mx-auto text-center pt-10 border-t border-white/5">
                        <p className="text-xs text-slate-600 leading-relaxed">
                            <strong>Disclaimer:</strong> Support is voluntary and non-refundable.
                            Contributions are a way to show appreciation for the free tools provided.
                            No ownership, equity, voting rights, or service entitlement is implied by your contribution.
                            The project remains free and open-source.
                        </p>
                    </div>

                </div>
            </main>

        </div>
    );
}
