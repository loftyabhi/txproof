import { Metadata } from 'next';
import { Navbar } from '@/components/Navbar';
import Link from 'next/link';
import { ArrowLeft, Code, Database, Lock, Globe, Server, Cpu, ShieldCheck, Zap } from 'lucide-react';

export const metadata: Metadata = {
    title: 'What is a Smart Contract? | Technical Deep Dive',
    description: 'Understand smart contracts as unstoppable applications. Explore the vending machine analogy, their immutable nature, and how they run on the EVM.',
    openGraph: {
        title: 'Smart Contracts Explained | TxProof Learning',
        description: 'Code is Law. A technical deep dive into deterministic, decentralized applications.',
        type: 'article',
    },
};

export default function WhatIsSmartContract() {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'TechArticle',
        headline: 'What is a Smart Contract?',
        description: 'A technical overview of smart contracts, their properties, and execution model.',
        author: {
            '@type': 'Organization',
            name: 'TxProof',
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
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-fuchsia-900/20 to-transparent opacity-50" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/5 blur-[120px]" />
                <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-violet-600/5 blur-[120px]" />
            </div>

            <div className="max-w-4xl mx-auto pt-32 pb-20 px-6 relative z-10">
                <Link href="/learn" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-8 transition-colors text-sm font-medium group">
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Knowledge Base
                </Link>

                <article className="prose prose-invert prose-lg max-w-none">
                    <header className="mb-16">
                        <div className="flex w-fit items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm font-medium mb-6">
                            <Code size={14} />
                            <span>Core Concept</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 relative inline-block leading-tight">
                            What is a Smart Contract?
                            <div className="absolute top-0 right-[-20%] hidden md:block w-32 h-32 bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none"></div>
                        </h1>
                        <p className="text-xl md:text-2xl text-zinc-400 leading-relaxed max-w-2xl">
                            It’s not smart, and it’s not a contract. It is an <span className="text-white font-semibold">unstoppable application</span> that lives on the blockchain.
                        </p>
                    </header>

                    {/* The Nick Szabo Analogy */}
                    <div className="mb-16">
                        <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
                            The Vending Machine Analogy
                        </h2>
                        <div className="p-8 rounded-3xl bg-zinc-900/50 border border-white/10 backdrop-blur-md relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-[80px] pointer-events-none" />

                            <p className="text-zinc-300 mb-8 max-w-3xl">
                                Coined by computer scientist <strong>Nick Szabo</strong> in the 1990s, the best way to understand a smart contract is to compare it to a vending machine. It removes the middleman (the store clerk) and replaces them with hard-coded logic.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-white">Traditional Deal</h3>
                                    <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
                                        <div className="flex items-start gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2.5" />
                                            <p className="text-sm text-zinc-400">Requires a lawyer or notary (Intermediary).</p>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2.5" />
                                            <p className="text-sm text-zinc-400">Can be breached or ignored.</p>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2.5" />
                                            <p className="text-sm text-zinc-400">Settlement takes days or weeks.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-violet-400">Smart Contract (Vending Machine)</h3>
                                    <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20 space-y-2">
                                        <div className="flex items-start gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-2.5" />
                                            <p className="text-sm text-zinc-300">Logic is baked into the machine.</p>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-2.5" />
                                            <p className="text-sm text-zinc-300">Auto-secures funds until criteria are met.</p>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-2.5" />
                                            <p className="text-sm text-zinc-300">Settlement is instant and atomic.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Core Properties */}
                    <div className="mb-16">
                        <h2 className="text-3xl font-bold text-white mb-8">Core Properties</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                {
                                    icon: Lock,
                                    title: "Immutable",
                                    desc: "Once deployed, the code cannot be changed. This guarantees that the rules of the game effectively cannot be rewritten by the creator later."
                                },
                                {
                                    icon: Server,
                                    title: "Distributed",
                                    desc: "The contract is replicated on thousands of nodes worldwide. There is no single server to hack or shut down."
                                },
                                {
                                    icon: ShieldCheck,
                                    title: "Trustless",
                                    desc: "You don't need to trust the other party or a third-party intermediary. You only need to trust the open-source code."
                                },
                                {
                                    icon: Zap,
                                    title: "Deterministic",
                                    desc: "Specific inputs will always produce the exact same output. The result is verifiable by anyone, anywhere."
                                }
                            ].map((item, i) => (
                                <div key={i} className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5 hover:border-violet-500/30 transition-colors backdrop-blur-sm group">
                                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 text-violet-400">
                                        <item.icon size={20} />
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                                    <p className="text-sm text-zinc-400 leading-relaxed">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Technical Deep Dive */}
                    <div className="mb-16">
                        <h2 className="text-3xl font-bold text-white mb-8">How it Actually Works</h2>
                        <div className="space-y-6">
                            <div className="flex gap-4 md:gap-8 relative">
                                <div className="hidden md:block w-px bg-gradient-to-b from-violet-500/50 to-transparent absolute left-6 top-8 bottom-0" />

                                <div className="space-y-8 w-full">
                                    {/* Step 1 */}
                                    <div className="relative pl-0 md:pl-0">
                                        <div className="p-6 rounded-2xl bg-zinc-800/30 border border-white/10">
                                            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-3">
                                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-violet-500/20 text-violet-400 text-sm font-bold border border-violet-500/30">1</span>
                                                Write
                                            </h3>
                                            <p className="text-zinc-400 mb-4">
                                                Developers write contracts in high-level languages like <strong>Solidity</strong> or <strong>Vyper</strong>. The code defines the state variables (database) and functions (logic).
                                            </p>
                                            <div className="p-4 bg-black/50 rounded-lg border border-white/5 font-mono text-sm overflow-x-auto">
                                                <div className="text-zinc-500">// Simple Storage Contract</div>
                                                <div><span className="text-fuchsia-400">contract</span> <span className="text-yellow-200">Box</span> {'{'}</div>
                                                <div className="pl-4"><span className="text-blue-400">uint256</span> <span className="text-blue-400">private</span> value;</div>
                                                <div className="pl-4 text-zinc-500">// Stores a new value</div>
                                                <div className="pl-4"><span className="text-fuchsia-400">function</span> <span className="text-yellow-200">store</span>(<span className="text-blue-400">uint256</span> newValue) <span className="text-blue-400">public</span> {'{'}</div>
                                                <div className="pl-8">value = newValue;</div>
                                                <div className="pl-4">{'}'}</div>
                                                <div>{'}'}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Step 2 */}
                                    <div className="relative">
                                        <div className="p-6 rounded-2xl bg-zinc-800/30 border border-white/10">
                                            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-3">
                                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-violet-500/20 text-violet-400 text-sm font-bold border border-violet-500/30">2</span>
                                                Compile
                                            </h3>
                                            <p className="text-zinc-400 mb-3">
                                                The code is compiled into <strong>Bytecode</strong> (machine instructions for the EVM) and an <strong>ABI</strong> (Application Binary Interface), which tells applications how to talk to the contract.
                                            </p>
                                            <div className="flex gap-2 flex-wrap">
                                                <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-xs font-mono text-zinc-400">0x608060405234801561001057600080fd5b50d3801561001d57600080fd5b50d2801561002a576000...</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Step 3 */}
                                    <div className="relative">
                                        <div className="p-6 rounded-2xl bg-zinc-800/30 border border-white/10">
                                            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-3">
                                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-violet-500/20 text-violet-400 text-sm font-bold border border-violet-500/30">3</span>
                                                Deploy
                                            </h3>
                                            <p className="text-zinc-400">
                                                A transaction is sent to the network containing the bytecode. The network allocates an address (e.g., <code>0x4e6...</code>), stores the code, and initializes the state.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* FAQ */}
                    <div className="mb-12">
                        <h2 className="text-3xl font-bold text-white mb-8">Common Questions</h2>
                        <div className="space-y-4">
                            {[
                                {
                                    q: "Can a smart contract be deleted?",
                                    a: "Generally, no. It can be 'self-destructed' if that function was written into the code originally, but this practice is now discouraged. Most contracts are permanent."
                                },
                                {
                                    q: "Are smart contracts legal contracts?",
                                    a: "In most jurisdictions, no. They are simply software. However, they can be used to enforce legal agreements if structured correctly, but 'Code is Law' is a technical maxim, not a legal one."
                                },
                                {
                                    q: "How do contracts talk to the real world?",
                                    a: "They can't directly. They live in a silo. To get data like stock prices or weather, they use 'Oracles' (like Chainlink), which are trusted bridges that push off-chain data onto the blockchain."
                                }
                            ].map((faq, i) => (
                                <details key={i} className="group border border-white/10 rounded-2xl bg-white/5 p-6 open:bg-white/10 transition-all">
                                    <summary className="flex cursor-pointer items-center justify-between font-bold text-white group-hover:text-violet-400 select-none">
                                        {faq.q}
                                    </summary>
                                    <p className="mt-4 text-zinc-400 leading-relaxed">
                                        {faq.a}
                                    </p>
                                </details>
                            ))}
                        </div>
                    </div>
                </article>
            </div>
        </div>
    );
}
