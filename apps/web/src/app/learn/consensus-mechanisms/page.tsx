import { Metadata } from 'next';
import { Navbar } from '@/components/Navbar';
import Link from 'next/link';
import { ArrowLeft, Hammer, Coins, GitFork, ShieldAlert, Cpu, Scale, Anchor } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Consensus Mechanisms | PoW vs PoS',
    description: 'Deep dive into how blockchains agree on truth. Proof of Work, Proof of Stake, Fork Choice Rules, and Slashing.',
    openGraph: {
        title: 'Consensus Mechanisms | TxProof Learning',
        description: 'The engine of blockchain truth. Why we switched from mining to staking.',
        type: 'article',
    },
};

export default function ConsensusMechanisms() {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'TechArticle',
        headline: 'Blockchain Consensus Mechanisms',
        description: 'Technical comparison of Proof of Work and Proof of Stake, focusing on Sybil resistance and Fork Choice rules.',
        author: {
            '@type': 'Organization',
            name: 'TxProof',
        },
        educationalLevel: 'Expert',
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-emerald-500/30 overflow-x-hidden">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <Navbar />

            {/* Background Gradients */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-emerald-900/20 to-transparent opacity-50" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-green-600/5 blur-[120px]" />
                <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-teal-600/5 blur-[120px]" />
            </div>

            <div className="max-w-4xl mx-auto pt-32 pb-20 px-6 relative z-10">
                <Link href="/learn" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-8 transition-colors text-sm font-medium">
                    <ArrowLeft size={16} />
                    Back to Knowledge Base
                </Link>

                <article className="prose prose-invert prose-lg max-w-none">
                    <header className="mb-16">
                        <div className="flex w-fit items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-6">
                            <Scale size={14} />
                            <span>Protocol Security</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-8 text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 relative inline-block">
                            Consensus Mechanisms
                            <div className="absolute top-0 right-[-20%] hidden md:block w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
                        </h1>
                        <p className="text-xl text-zinc-400 leading-relaxed max-w-2xl">
                            Consensus is the process of getting distributed nodes to agree on a single history. It solves two problems: <strong>Sybil Resistance</strong> (Who can vote?) and <strong>Chain Selection</strong> (Which history is true?).
                        </p>
                    </header>

                    {/* Sybil Resistance */}
                    <section className="mb-20">
                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                            <ShieldAlert className="text-emerald-400" size={24} />
                            Problem 1: Sybil Resistance
                        </h2>
                        <p className="text-zinc-300 mb-8">
                            If voting was "one IP address = one vote", an attacker could spin up 1,000 servers to control the network. We need to make voting expensive.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="p-8 bg-zinc-900/50 border border-white/10 rounded-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10"><Hammer size={64} /></div>
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                    <Hammer className="text-orange-400" size={20} />
                                    Proof of Work (PoW)
                                </h3>
                                <p className="text-zinc-400 text-sm mb-6 min-h-[60px]">
                                    <strong>"One CPU = One Vote"</strong>. You prove you are not a Sybil attacker by burning real-world energy.
                                </p>
                                <ul className="space-y-3 text-sm">
                                    <li className="flex items-center gap-3 text-zinc-300">
                                        <div className="p-1.5 bg-orange-500/10 rounded text-orange-400"><Cpu size={14} /></div>
                                        <span><strong>Scarcity:</strong> Hardware & Energy</span>
                                    </li>
                                    <li className="flex items-center gap-3 text-zinc-300">
                                        <div className="p-1.5 bg-red-500/10 rounded text-red-400"><Hammer size={14} /></div>
                                        <span><strong>Penalty:</strong> Wasted electricity cost</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="p-8 bg-white/5 border border-white/10 rounded-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10"><Coins size={64} /></div>
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                    <Coins className="text-blue-400" size={20} />
                                    Proof of Stake (PoS)
                                </h3>
                                <p className="text-zinc-400 text-sm mb-6 min-h-[60px]">
                                    <strong>"One Dollar = One Vote"</strong>. You prove you are not a Sybil attacker by locking up capital (ETH).
                                </p>
                                <ul className="space-y-3 text-sm">
                                    <li className="flex items-center gap-3 text-zinc-300">
                                        <div className="p-1.5 bg-blue-500/10 rounded text-blue-400"><Coins size={14} /></div>
                                        <span><strong>Scarcity:</strong> Capital (Tokens)</span>
                                    </li>
                                    <li className="flex items-center gap-3 text-zinc-300">
                                        <div className="p-1.5 bg-red-500/10 rounded text-red-400"><ShieldAlert size={14} /></div>
                                        <span><strong>Penalty:</strong> Slashing (Burning 32 ETH)</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* Chain Selection */}
                    <section className="mb-20">
                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                            <GitFork className="text-pink-400" size={24} />
                            Problem 2: Fork Choice Rules
                        </h2>
                        <div className="bg-[#111] border border-white/10 rounded-2xl p-8 mb-8">
                            <p className="text-zinc-300 mb-6">
                                If two valid blocks are produced at the same time, the network splits (forks). Nodes need a mathematical rule to decide which path to follow.
                            </p>
                            <div className="space-y-6">
                                <div>
                                    <h4 className="font-bold text-white mb-2">Longest Chain (Nakamoto Consensus)</h4>
                                    <p className="text-zinc-400 text-sm">
                                        Used by Bitcoin. The chain with the most cumulative difficulty (Proof of Work) is the truth. Security is probabilistic: after 6 blocks, it is <em>statistically</em> impossible for an attacker to rewrite history without 51% of global energy.
                                    </p>
                                </div>
                                <div className="h-px bg-white/10" />
                                <div>
                                    <h4 className="font-bold text-white mb-2">GHOST (Heaviest Subtree)</h4>
                                    <p className="text-zinc-400 text-sm">
                                        Used by Ethereum. Instead of just length, it counts "votes" (attestations) from validators on various branches. This is faster and more secure against certain attacks. Modern PoS adds a "Finality Gadget" (Gasper), making blocks <strong>Final</strong> (irreversible) after ~15 minutes.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* The Security Asymmetry */}
                    <section className="mb-20">
                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                            <Anchor className="text-yellow-400" size={24} />
                            The Security Asymmetry
                        </h2>
                        <div className="p-8 border border-yellow-500/20 bg-yellow-500/5 rounded-2xl">
                            <h3 className="font-bold text-yellow-200 mb-4">Why PoS is more secure (The "Spawn Camp" Defense)</h3>
                            <p className="text-zinc-300 mb-4">
                                In Proof of Work, if an attacker buys 51% of mining hardware, they can attack the chain forever. The only defense is to change the hashing algorithm (bricking all hardware, including honest miners).
                            </p>
                            <p className="text-zinc-300">
                                In Proof of Stake, the protocol fights back automatically.
                                <br />
                                If an attacker tries to revert <strong>Finalized</strong> blocks, the protocol detects the contradictory votes and <strong>Slashes</strong> (burns) their entire stake. The attacker loses billions of dollars instantly. To attack again, they must buy new coins (pumping the price) and burn them again. The defender (the chain) creates immense financial asymmetry.
                            </p>
                        </div>
                    </section>

                    {/* FAQ */}
                    <section className="mb-20">
                        <h2 className="text-3xl font-bold text-white mb-8">Frequently Asked Questions</h2>
                        <div className="space-y-4">
                            <details className="group border border-white/10 rounded-2xl bg-white/5 p-6 open:bg-white/10 transition-colors">
                                <summary className="flex cursor-pointer items-center justify-between font-bold text-white group-hover:text-emerald-400 select-none">
                                    Why can't we just vote on the state?
                                    <span className="text-zinc-500 group-hover:text-emerald-400 transition-transform group-open:rotate-180">▼</span>
                                </summary>
                                <p className="mt-4 text-zinc-400 leading-relaxed">
                                    Because on the internet, nobody knows if you are one person or one million scripts. Without a scarce resource (Energy or Capital) to weigh the votes, Sybil attackers would trivially control 99% of the voices.
                                </p>
                            </details>
                            <details className="group border border-white/10 rounded-2xl bg-white/5 p-6 open:bg-white/10 transition-colors">
                                <summary className="flex cursor-pointer items-center justify-between font-bold text-white group-hover:text-emerald-400 select-none">
                                    What happens to my coins during a Fork?
                                    <span className="text-zinc-500 group-hover:text-emerald-400 transition-transform group-open:rotate-180">▼</span>
                                </summary>
                                <p className="mt-4 text-zinc-400 leading-relaxed">
                                    They exist on <em>both</em> chains. If Ethereum splits into ETH-A and ETH-B, you technically own coins on both networks. However, usually only one chain retains economic value (the one stablecoins and exchanges support), rendering the other worthless.
                                </p>
                            </details>
                            <details className="group border border-white/10 rounded-2xl bg-white/5 p-6 open:bg-white/10 transition-colors">
                                <summary className="flex cursor-pointer items-center justify-between font-bold text-white group-hover:text-emerald-400 select-none">
                                    Is a 51% attack realistic?
                                    <span className="text-zinc-500 group-hover:text-emerald-400 transition-transform group-open:rotate-180">▼</span>
                                </summary>
                                <p className="mt-4 text-zinc-400 leading-relaxed">
                                    On major networks like Bitcoin or Ethereum? No, the cost would be hundreds of billions of dollars. On small, low-hashrate chains? Yes, it happens frequently (e.g., Ethereum Classic has been attacked multiple times).
                                </p>
                            </details>
                        </div>
                    </section>

                </article>
            </div>
        </div>
    );
}
