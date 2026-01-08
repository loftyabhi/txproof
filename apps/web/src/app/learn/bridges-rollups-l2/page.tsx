import { Metadata } from 'next';
import { Navbar } from '@/components/Navbar';
import Link from 'next/link';
import { ArrowLeft, Layers, ArrowLeftRight, Lock, Cpu, Globe, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Bridges & L2s Explained | Scaling Ethereum',
    description: 'Understanding Layer 2 scaling solutions (Rollups) and Cross-Chain Bridges. How we scale blockchains without sacrificing security.',
    openGraph: {
        title: 'Bridges & Layer 2s | Chain Receipt Learning',
        description: 'Optimism, Base, Arbitrum, and the future of scaling.',
        type: 'article',
    },
};

export default function BridgesAndL2s() {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'TechArticle',
        headline: 'Scaling Blockchains: Bridges and Layer 2s',
        description: 'Technical overview of L2 rollups and bridging mechanisms.',
        author: {
            '@type': 'Organization',
            name: 'Chain Receipt',
        },
        educationalLevel: 'Intermediate',
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-violet-500/30 overflow-x-hidden">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <Navbar />

            {/* Background Gradients */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-indigo-900/20 to-transparent opacity-50" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/5 blur-[120px]" />
                <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-violet-600/5 blur-[120px]" />
            </div>

            <div className="max-w-4xl mx-auto pt-32 pb-20 px-6 relative z-10">
                <Link href="/learn" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-8 transition-colors text-sm font-medium">
                    <ArrowLeft size={16} />
                    Back to Knowledge Base
                </Link>

                <article className="prose prose-invert prose-lg max-w-none">
                    <header className="mb-16">
                        <div className="flex w-fit items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium mb-6">
                            <Layers size={14} />
                            <span>Scaling & Interoperability</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-8 text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 relative inline-block">
                            Bridges & Layer 2s
                            <div className="absolute top-0 right-[-20%] hidden md:block w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
                        </h1>
                        <p className="text-xl text-zinc-400 leading-relaxed max-w-2xl">
                            Blockchains are notoriously slow and isolated. To scale purely digital economies to billions of users, we need <strong>Layer 2s</strong> for speed and <strong>Bridges</strong> for connectivity.
                        </p>
                    </header>

                    {/* The Trilemma */}
                    <section className="mb-20">
                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                            <Cpu className="text-indigo-400" size={24} />
                            The Scalability Problem
                        </h2>
                        <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
                            <p className="text-zinc-300 mb-6">
                                The <strong>Blockchain Trilemma</strong> states that a chain can only optimize for two of three properties: Decentralization, Security, and Scalability.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                    <div className="font-semibold text-white mb-2">Decentralization</div>
                                    <p className="text-sm text-zinc-400">Anyone can run a node. No single point of control.</p>
                                </div>
                                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                    <div className="font-semibold text-white mb-2">Security</div>
                                    <p className="text-sm text-zinc-400">The cost to attack the network is prohibitively high.</p>
                                </div>
                                <div className="p-4 border border-red-500/30 bg-red-500/5 rounded-xl">
                                    <div className="font-semibold text-red-200 mb-2">Scalability</div>
                                    <p className="text-sm text-red-200/70">The ability to process thousands of transactions per second (TPS). This is where L1s fail.</p>
                                </div>
                            </div>
                            <p className="mt-6 text-zinc-400 text-sm">
                                Ethereum L1 prioritizes Decentralization and Security. It charges high fees because block space is scarce. To solve this, we move execution <strong>off-chain</strong>.
                            </p>
                        </div>
                    </section>

                    {/* Layer 2: Rollups */}
                    <section className="mb-20">
                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                            <Zap className="text-yellow-400" size={24} />
                            Layer 2: Rollups
                        </h2>
                        <p className="text-zinc-300 mb-8">
                            A <strong>Rollup</strong> is a separate blockchain that executes transactions outside of Ethereum but posts the transaction data (or proof) back to the L1. This inherits the security of Ethereum while splitting the gas costs among thousands of users.
                        </p>

                        <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden mb-12">
                            <div className="p-6 border-b border-white/10 bg-white/5">
                                <h3 className="text-lg font-bold text-white">The "Court" Analogy</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/10">
                                <div className="p-6">
                                    <div className="text-indigo-400 font-bold mb-2">Layer 1 (Ethereum)</div>
                                    <div className="text-white text-sm font-medium mb-2">The Supreme Court</div>
                                    <p className="text-zinc-500 text-sm">
                                        Slow, expensive, and final. It doesn't want to hear every speeding ticket case. It only settles disputes and finalizes history.
                                    </p>
                                </div>
                                <div className="p-6">
                                    <div className="text-blue-400 font-bold mb-2">Layer 2 (Rollup)</div>
                                    <div className="text-white text-sm font-medium mb-2">The District Court</div>
                                    <p className="text-zinc-500 text-sm">
                                        Fast and cheap. Handles 99% of the day-to-day transactions. Only goes to the Supreme Court (L1) if absolutely necessary.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <h3 className="text-xl font-bold text-white mb-6">Two Types of Rollups</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-6 bg-zinc-900/50 border border-white/10 rounded-2xl backdrop-blur-sm">
                                <div className="flex items-center gap-2 mb-4">
                                    <ShieldCheck className="text-green-400" size={20} />
                                    <h4 className="font-bold text-white">Optimistic Rollups</h4>
                                </div>
                                <p className="text-zinc-400 text-sm mb-4">
                                    <span className="text-white font-medium">Philosophy:</span> "Innocent until proven guilty."
                                </p>
                                <p className="text-zinc-400 text-sm mb-4">
                                    They assume all transactions are valid. Transactions are posted to L1 immediately, but there is a <strong>7-day challenge period</strong> where anyone can submit a "Fraud Proof" if they spot cheating.
                                </p>
                                <div className="text-xs text-zinc-500 font-mono">Examples: Arbitrum, Optimism, Base</div>
                            </div>

                            <div className="p-6 bg-zinc-900/50 border border-white/10 rounded-2xl backdrop-blur-sm">
                                <div className="flex items-center gap-2 mb-4">
                                    <Lock className="text-indigo-400" size={20} />
                                    <h4 className="font-bold text-white">ZK-Rollups</h4>
                                </div>
                                <p className="text-zinc-400 text-sm mb-4">
                                    <span className="text-white font-medium">Philosophy:</span> "Don't trust, verify."
                                </p>
                                <p className="text-zinc-400 text-sm mb-4">
                                    They generate a complex <strong>Zero-Knowledge Proof</strong> for every batch. The L1 contract verifies the math instantly. No waiting period, but computing the proof is computationally expensive.
                                </p>
                                <div className="text-xs text-zinc-500 font-mono">Examples: zkSync, Starknet, Scroll</div>
                            </div>
                        </div>
                    </section>

                    {/* Bridges: Interoperability */}
                    <section className="mb-20">
                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                            <ArrowLeftRight className="text-blue-400" size={24} />
                            Bridges: Breaking the Silos
                        </h2>
                        <p className="text-zinc-300 mb-8">
                            Blockchains are disjointed databases. Bitcoin does not know Ethereum status; Ethereum does not know Solana status. <strong>Bridges</strong> are the infrastructure that connect these isolated networks.
                        </p>

                        <div className="space-y-6">
                            <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
                                <h4 className="font-bold text-white mb-2">Mechanism 1: Lock-and-Mint</h4>
                                <p className="text-zinc-400 text-sm mb-4">
                                    This is the most common method for moving assets (e.g., getting BTC onto Ethereum as WBTC).
                                </p>
                                <ol className="list-decimal list-inside space-y-2 text-zinc-400 text-sm marker:text-indigo-400">
                                    <li>You lock <strong>Asset A</strong> in a smart contract on the source chain.</li>
                                    <li>The bridge observers verify this event.</li>
                                    <li>The bridge mints an equivalent amount of <strong>Wrapped Asset A</strong> on the destination chain.</li>
                                    <li>To return, you burn the wrapped asset, and the smart contract unlocks the original.</li>
                                </ol>
                            </div>

                            <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
                                <h4 className="font-bold text-white mb-2">Mechanism 2: Liquidity Pools</h4>
                                <p className="text-zinc-400 text-sm">
                                    Instead of wrapping, the bridge keeps pools of assets on both chains. You deposit USDC on Chain A, and the bridge releases USDC to you from its pool on Chain B. This requires the bridge to have deep liquidity on both sides.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Risks */}
                    <section className="mb-20">
                        <h2 className="text-2xl font-bold text-red-400 mb-6 flex items-center gap-3">
                            <AlertTriangle className="text-red-400" size={24} />
                            Critical Risks
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-6 border border-red-500/20 bg-red-500/5 rounded-2xl">
                                <h3 className="font-bold text-red-200 mb-2">The Honey Pot Problem</h3>
                                <p className="text-sm text-red-200/70 mb-4">
                                    Bridges secure billions of dollars in "locked" assets. This makes them the #1 target for hackers. If the locking contract on the source chain is exploited and drained, the "wrapped" tokens on the destination chain become worthless immediately.
                                </p>
                                <div className="text-xs text-red-300/50">History: Ronin ($600M), Wormhole ($320M)</div>
                            </div>
                            <div className="p-6 border border-orange-500/20 bg-orange-500/5 rounded-2xl">
                                <h3 className="font-bold text-orange-200 mb-2">Sequencer Centralization</h3>
                                <p className="text-sm text-orange-200/70">
                                    Most Flight L2s rely on a single server (the Sequencer) to order transactions. If it goes down, the chain halts. While they cannot steal funds (due to L1 settlement), they can censor transactions or cause downtime.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* The Future */}
                    <section className="mb-20 p-8 border border-white/10 rounded-3xl bg-gradient-to-br from-indigo-900/20 to-purple-900/20 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-[80px] pointer-events-none"></div>
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                            <Globe className="text-indigo-300" size={24} />
                            The Multi-Chain Future
                        </h2>
                        <p className="text-zinc-300 leading-relaxed max-w-2xl">
                            The end goal is <strong>Chain Abstraction</strong>. Users shouldn't need to know whether they are on Base, Arbitrum, or Ethereum. Wallets and apps will handle the bridging and switching automatically in the background, creating a seamless "Superchain" experience.
                        </p>
                    </section>

                    {/* FAQ */}
                    <section className="mb-20">
                        <h2 className="text-3xl font-bold text-white mb-8">Frequently Asked Questions</h2>
                        <div className="space-y-4">
                            <details className="group border border-white/10 rounded-2xl bg-white/5 p-6 open:bg-white/10 transition-colors">
                                <summary className="flex cursor-pointer items-center justify-between font-bold text-white group-hover:text-indigo-400 select-none">
                                    If an L2 goes down, are my funds lost?
                                    <span className="text-zinc-500 group-hover:text-indigo-400 transition-transform group-open:rotate-180">▼</span>
                                </summary>
                                <p className="mt-4 text-zinc-400 leading-relaxed">
                                    No. If it is a true Rollup (and not a sidechain), usage of the "Escape Hatch" allows you to prove ownership via Ethereum L1 and withdraw your funds directly from the smart contract, even if the L2 sequencer is completely offline.
                                </p>
                            </details>
                            <details className="group border border-white/10 rounded-2xl bg-white/5 p-6 open:bg-white/10 transition-colors">
                                <summary className="flex cursor-pointer items-center justify-between font-bold text-white group-hover:text-indigo-400 select-none">
                                    Why do Optimistic Rollups wait 7 days?
                                    <span className="text-zinc-500 group-hover:text-indigo-400 transition-transform group-open:rotate-180">▼</span>
                                </summary>
                                <p className="mt-4 text-zinc-400 leading-relaxed">
                                    This window is necessary to allow verifiers to detect fraud and submit a proof. If withdrawals were instant, a malicious sequencer could steal all funds before anyone noticed. "Fast Exit" bridges exist by lending you liquidity upfront for a small fee.
                                </p>
                            </details>
                            <details className="group border border-white/10 rounded-2xl bg-white/5 p-6 open:bg-white/10 transition-colors">
                                <summary className="flex cursor-pointer items-center justify-between font-bold text-white group-hover:text-indigo-400 select-none">
                                    Are Bridges safe?
                                    <span className="text-zinc-500 group-hover:text-indigo-400 transition-transform group-open:rotate-180">▼</span>
                                </summary>
                                <p className="mt-4 text-zinc-400 leading-relaxed">
                                    They are historically the weakest link. Most "hacks" in crypto are bridge exploits (e.g., Ronin, Wormhole). Trustless bridges (Rollups) are safer than multisig bridges, but any code moving billions of dollars is a high-value target.
                                </p>
                            </details>
                        </div>
                    </section>
                </article>
            </div>
        </div>
    );
}
