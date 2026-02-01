import { Metadata } from 'next';
import { Navbar } from '@/components/Navbar';
import Link from 'next/link';
import { ArrowLeft, Box, Cloud, Activity, Radio, Database, Lock, Globe, Server, Link as LinkIcon } from 'lucide-react';

export const metadata: Metadata = {
    title: 'On-Chain vs Off-Chain | Hybrid Architectures',
    description: 'Understanding the boundary of trust, the Oracle Problem, and why most dApps are actually hybrid systems.',
    openGraph: {
        title: 'On-Chain vs Off-Chain | TxProof Learning',
        description: 'Where does your NFT actually live? The trade-offs between blockchain security and real-world efficiency.',
        type: 'article',
    },
};

export default function OnChainVsOffChain() {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'TechArticle',
        headline: 'On-Chain vs Off-Chain Architectures',
        description: 'Technical comparison of on-chain consensus and off-chain computation/storage.',
        author: {
            '@type': 'Organization',
            name: 'TxProof',
        },
        educationalLevel: 'Expert',
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-indigo-500/30 overflow-x-hidden">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <Navbar />

            {/* Background Gradients */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-indigo-900/20 to-transparent opacity-50" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-violet-600/5 blur-[120px]" />
                <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/5 blur-[120px]" />
            </div>

            <div className="max-w-4xl mx-auto pt-32 pb-20 px-6 relative z-10">
                <Link href="/learn" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-8 transition-colors text-sm font-medium">
                    <ArrowLeft size={16} />
                    Back to Knowledge Base
                </Link>

                <article className="prose prose-invert prose-lg max-w-none">
                    <header className="mb-16">
                        <div className="flex w-fit items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium mb-6">
                            <Box size={14} />
                            <span>System Architecture</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-8 text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 relative inline-block">
                            On-Chain vs Off-Chain
                            <div className="absolute top-0 right-[-20%] hidden md:block w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
                        </h1>
                        <p className="text-xl text-zinc-400 leading-relaxed max-w-2xl">
                            A blockchain is a <strong>Walled Garden</strong>. It is deterministic, isolated, and knows nothing of the outside world. To build useful applications, we must bridge the gap between secure on-chain code and rich off-chain data.
                        </p>
                    </header>

                    {/* The Divide */}
                    <section className="mb-20">
                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                            <Activity className="text-indigo-400" size={24} />
                            The Boundary of Trust
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="p-8 bg-zinc-900/50 border border-white/10 rounded-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10"><Lock size={64} /></div>
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></span>
                                    On-Chain
                                </h3>
                                <p className="text-zinc-400 text-sm mb-6 min-h-[60px]">
                                    Data and logic taking place directly on the blockchain's state machine (e.g., EVM). Verified by thousands of nodes.
                                </p>
                                <ul className="space-y-3 text-sm">
                                    <li className="flex items-center gap-3 text-zinc-300">
                                        <div className="p-1.5 bg-green-500/10 rounded text-green-400"><Lock size={14} /></div>
                                        <span><strong>Security:</strong> Maximum (Consensus)</span>
                                    </li>
                                    <li className="flex items-center gap-3 text-zinc-300">
                                        <div className="p-1.5 bg-red-500/10 rounded text-red-400"><Activity size={14} /></div>
                                        <span><strong>Cost:</strong> Extremely High</span>
                                    </li>
                                    <li className="flex items-center gap-3 text-zinc-300">
                                        <div className="p-1.5 bg-blue-500/10 rounded text-blue-400"><Globe size={14} /></div>
                                        <span><strong>Visibility:</strong> 100% Public</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="p-8 bg-white/5 border border-white/10 rounded-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10"><Cloud size={64} /></div>
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-zinc-500"></span>
                                    Off-Chain
                                </h3>
                                <p className="text-zinc-400 text-sm mb-6 min-h-[60px]">
                                    Anything outside the consensus network: API servers, IPFS storage, or local computation.
                                </p>
                                <ul className="space-y-3 text-sm">
                                    <li className="flex items-center gap-3 text-zinc-300">
                                        <div className="p-1.5 bg-orange-500/10 rounded text-orange-400"><Server size={14} /></div>
                                        <span><strong>Security:</strong> Trusted (Centralized)</span>
                                    </li>
                                    <li className="flex items-center gap-3 text-zinc-300">
                                        <div className="p-1.5 bg-green-500/10 rounded text-green-400"><Activity size={14} /></div>
                                        <span><strong>Cost:</strong> Near Zero</span>
                                    </li>
                                    <li className="flex items-center gap-3 text-zinc-300">
                                        <div className="p-1.5 bg-purple-500/10 rounded text-purple-400"><Lock size={14} /></div>
                                        <span><strong>Privacy:</strong> Can be Encrypted</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* The Oracle Problem */}
                    <section className="mb-20">
                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                            <Radio className="text-blue-400" size={24} />
                            The Oracle Problem
                        </h2>
                        <div className="bg-[#111] border border-white/10 rounded-2xl p-8 mb-8">
                            <p className="text-zinc-300 mb-6">
                                Smart contracts cannot call <code className="text-indigo-400">fetch('api.google.com')</code>. Why? Because if 1,000 nodes execute code and get different results (e.g., the price of ETH changed in that millisecond), the entire blockchain <strong>forks</strong>.
                            </p>
                            <p className="text-zinc-300">
                                <strong>Oracles</strong> (like Chainlink) solve this. They are networks of off-chain nodes that fetch data, reach consensus on the value, and then push that single value <strong>on-chain</strong> for smart contracts to consume safely.
                            </p>
                        </div>
                    </section>

                    {/* Hybrid Architectures */}
                    <section className="mb-20">
                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                            <LinkIcon className="text-purple-400" size={24} />
                            Hybrid Architectures
                        </h2>
                        <div className="space-y-6">
                            <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
                                <h4 className="font-bold text-white mb-2">1. Storage (IPFS & Arweave)</h4>
                                <p className="text-zinc-400 text-sm">
                                    Storing a 1MB image on Ethereum would cost thousands of dollars. Instead, an NFT stores only a <strong>Pointer</strong> (URI) on-chain. The actual image lives <strong>off-chain</strong> on IPFS (InterPlanetary File System), a decentralized storage network.
                                    <br /><span className="text-zinc-500 text-xs mt-2 block italic">Risk: If the off-chain file is deleted, the NFT becomes a blank pointer.</span>
                                </p>
                            </div>
                            <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
                                <h4 className="font-bold text-white mb-2">2. Computation (Rollups)</h4>
                                <p className="text-zinc-400 text-sm">
                                    Ethereum L1 is slow. <strong>Rollups</strong> (L2s) execute transactions <strong>off-chain</strong> at high speed. They then compress the data and post a cryptographic proof <strong>on-chain</strong>. This gives the best of both worlds: Off-chain speed with On-chain security guarantees.
                                </p>
                            </div>
                            <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
                                <h4 className="font-bold text-white mb-2">3. Identity (Zero Knowledge)</h4>
                                <p className="text-zinc-400 text-sm">
                                    You can verify your age or credit score <strong>off-chain</strong> using a Zero-Knowledge Proof. You then submit only the <em>Proof</em> on-chain. The smart contract knows you are valid without ever seeing your private data.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* FAQ */}
                    <section className="mb-20">
                        <h2 className="text-3xl font-bold text-white mb-8">Frequently Asked Questions</h2>
                        <div className="space-y-4">
                            <details className="group border border-white/10 rounded-2xl bg-white/5 p-6 open:bg-white/10 transition-colors">
                                <summary className="flex cursor-pointer items-center justify-between font-bold text-white group-hover:text-indigo-400 select-none">
                                    Is my NFT image strictly "forever"?
                                    <span className="text-zinc-500 group-hover:text-indigo-400 transition-transform group-open:rotate-180">▼</span>
                                </summary>
                                <p className="mt-4 text-zinc-400 leading-relaxed">
                                    If it's on IPFS, it persists as long as <em>someone</em> pins it. If the project stops paying for pinning and no community members host it, the image can disappear, leaving you with a blank token. "On-chain" metadata is forever; off-chain storage relies on social persistence.
                                </p>
                            </details>
                            <details className="group border border-white/10 rounded-2xl bg-white/5 p-6 open:bg-white/10 transition-colors">
                                <summary className="flex cursor-pointer items-center justify-between font-bold text-white group-hover:text-indigo-400 select-none">
                                    Are Rollups (L2s) less secure than Ethereum?
                                    <span className="text-zinc-500 group-hover:text-indigo-400 transition-transform group-open:rotate-180">▼</span>
                                </summary>
                                <p className="mt-4 text-zinc-400 leading-relaxed">
                                    They derive their integrity from Ethereum. As long as the L2 posts its proof to L1, you can cryptographically prove your ownership. However, you often trust the L2 "Sequencer" for liveness (not freezing your funds), though escape hatches usually exist.
                                </p>
                            </details>
                            <details className="group border border-white/10 rounded-2xl bg-white/5 p-6 open:bg-white/10 transition-colors">
                                <summary className="flex cursor-pointer items-center justify-between font-bold text-white group-hover:text-indigo-400 select-none">
                                    Why isn't everything put On-Chain?
                                    <span className="text-zinc-500 group-hover:text-indigo-400 transition-transform group-open:rotate-180">▼</span>
                                </summary>
                                <p className="mt-4 text-zinc-400 leading-relaxed">
                                    It's too expensive. Storing a 1GB movie on Ethereum would cost millions of dollars. We use the blockchain for <strong>coordination</strong> and <strong>pointers</strong>, not for heavy data storage.
                                </p>
                            </details>
                        </div>
                    </section>
                </article>
            </div>
        </div>
    );
}
