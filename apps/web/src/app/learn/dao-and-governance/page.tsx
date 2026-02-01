import { Metadata } from 'next';
import { Navbar } from '@/components/Navbar';
import Link from 'next/link';
import { ArrowLeft, Scale, Vote, Users, ShieldAlert, Gavel, Handshake, MessageSquare, Zap, Lock, Siren, GitMerge } from 'lucide-react';

export const metadata: Metadata = {
    title: 'DAO & Governance | On-Chain Coordination',
    description: 'Understanding Decentralized Autonomous Organizations (DAOs), voting systems, and the risks of on-chain governance.',
    openGraph: {
        title: 'DAO & Governance | TxProof Learning',
        description: 'How code replaces corporate charters. Token voting, delegation, and attacks.',
        type: 'article',
    },
};

export default function DaoAndGovernance() {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'TechArticle',
        headline: 'Decentralized Autonomous Organizations (DAOs)',
        description: 'Technical deep dive into DAO governance mechanisms and vectors of attack.',
        author: {
            '@type': 'Organization',
            name: 'TxProof',
        },
        educationalLevel: 'Expert',
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-rose-500/30 overflow-x-hidden">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <Navbar />

            {/* Background Gradients */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-rose-900/20 to-transparent opacity-50" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-orange-600/5 blur-[120px]" />
                <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-pink-600/5 blur-[120px]" />
            </div>

            <div className="max-w-4xl mx-auto pt-32 pb-20 px-6 relative z-10">
                <Link href="/learn" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-8 transition-colors text-sm font-medium">
                    <ArrowLeft size={16} />
                    Back to Knowledge Base
                </Link>

                <article className="prose prose-invert prose-lg max-w-none">
                    <header className="mb-16">
                        <div className="flex w-fit items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-medium mb-6">
                            <Scale size={14} />
                            <span>Coordination Layer</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-8 text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 relative inline-block">
                            DAO & Governance
                            <div className="absolute top-0 right-[-20%] hidden md:block w-32 h-32 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>
                        </h1>
                        <p className="text-xl text-zinc-400 leading-relaxed max-w-2xl">
                            A DAO is an internet-native organization where the <strong>CEO is Code</strong>. No human can unilaterally spend the treasury; specific on-chain conditions (votes) must be met for the smart contract to release funds.
                        </p>
                    </header>

                    {/* How It Works: The Spectrum */}
                    <section className="mb-20">
                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                            <GitMerge className="text-rose-400" size={24} />
                            The Governance Spectrum
                        </h2>
                        <p className="text-zinc-300 mb-8">
                            Governance is not binary; it exists on a spectrum from informal social consensus to binding code execution. Most DAOs use a pipeline that moves from "Soft" to "Hard" governance.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            <div className="p-6 bg-zinc-900/50 border border-white/10 rounded-xl">
                                <div className="flex items-center gap-3 mb-4">
                                    <MessageSquare className="text-blue-400" size={20} />
                                    <h3 className="font-bold text-white">Off-Chain (Soft)</h3>
                                </div>
                                <p className="text-zinc-400 text-sm mb-4">
                                    Discussions happen on forums (Discourse) or chat groups. Voting happens on signaling platforms (Snapshot).
                                </p>
                                <ul className="space-y-2 text-xs text-zinc-500 font-mono">
                                    <li className="flex gap-2 text-green-400/80">
                                        <span>+</span> Check: Efficient, Free (Gasless signatures)
                                    </li>
                                    <li className="flex gap-2 text-red-400/80">
                                        <span>-</span> Check: Non-binding (Admins must manually enact results)
                                    </li>
                                </ul>
                            </div>
                            <div className="p-6 bg-zinc-900/50 border border-white/10 rounded-xl">
                                <div className="flex items-center gap-3 mb-4">
                                    <Zap className="text-amber-400" size={20} />
                                    <h3 className="font-bold text-white">On-Chain (Hard)</h3>
                                </div>
                                <p className="text-zinc-400 text-sm mb-4">
                                    The proposal is executable code. If the vote passes, the smart contract <em>automatically</em> executes the transaction.
                                </p>
                                <ul className="space-y-2 text-xs text-zinc-500 font-mono">
                                    <li className="flex gap-2 text-green-400/80">
                                        <span>+</span> Check: Trustless, Censorship Resistant
                                    </li>
                                    <li className="flex gap-2 text-red-400/80">
                                        <span>-</span> Check: Expensive (Gas), Rigid, High Risk
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* Voting Mechanisms */}
                    <section className="mb-20">
                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                            <Vote className="text-blue-400" size={24} />
                            Voting Mechanisms
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
                                <h4 className="font-bold text-white mb-3">Token Weighted</h4>
                                <div className="text-xs text-blue-300 bg-blue-500/10 px-2 py-1 rounded inline-block mb-3">1 Token = 1 Vote</div>
                                <p className="text-zinc-400 text-sm">
                                    The standard model. Simple and Sybil-resistant, but leads to plutocracy (rule by the rich).
                                </p>
                            </div>
                            <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
                                <h4 className="font-bold text-white mb-3">Delegation</h4>
                                <div className="text-xs text-purple-300 bg-purple-500/10 px-2 py-1 rounded inline-block mb-3">Representative</div>
                                <p className="text-zinc-400 text-sm">
                                    Token holders assign their voting power to "Delegates" (experts). Solves voter apathy while keeping ultimate control with holders.
                                </p>
                            </div>
                            <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
                                <h4 className="font-bold text-white mb-3">Quadratic</h4>
                                <div className="text-xs text-green-300 bg-green-500/10 px-2 py-1 rounded inline-block mb-3">Minority Voice</div>
                                <p className="text-zinc-400 text-sm">
                                    Cost of voting is exponential (1 vote = 1 cost, 10 votes = 100 cost). Prevents whales from dominating every issue.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* The Dark Side */}
                    <section className="mb-20">
                        <h2 className="text-2xl font-bold text-red-500 mb-6 flex items-center gap-3">
                            <Siren className="text-red-500" size={24} />
                            Capture & Attacks
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-6 border border-red-500/20 bg-red-500/5 rounded-2xl">
                                <h3 className="font-bold text-red-200 mb-2">The Flash Loan Attack</h3>
                                <p className="text-sm text-red-200/70 mb-4">
                                    An attacker borrows millions in governance tokens for a single block, passes a proposal to drain the treasury, and repays the loan.
                                </p>
                                <div className="text-xs text-red-300/50">Defense: Snapshot Checkpoints (Votes count from block N-1).</div>
                            </div>
                            <div className="p-6 border border-red-500/20 bg-red-500/5 rounded-2xl">
                                <h3 className="font-bold text-red-200 mb-2">The Automation Trap</h3>
                                <p className="text-sm text-red-200/70">
                                    If code is law, <strong>bugs are law</strong>. If a governance contract has a vulnerability, it can be exploited "legally" according to the protocol rules.
                                </p>
                                <div className="text-xs text-red-300/50">Defense: The concept of "Social Slashing" (Forking).</div>
                            </div>
                        </div>
                    </section>

                    {/* The Trilemma */}
                    <section className="mb-20">
                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                            <Scale className="text-orange-400" size={24} />
                            The Governance Trade-off
                        </h2>
                        <p className="text-zinc-300 mb-8">
                            Designing a DAO is balancing three competing forces. You cannot maximize all of them simultaneously.
                        </p>

                        <div className="space-y-4">
                            <details className="group bg-zinc-900/50 border border-white/10 rounded-xl overflow-hidden" open>
                                <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors">
                                    <span className="font-medium text-white flex items-center gap-2"><Users size={16} className="text-cyan-400" />Decentralization vs Efficiency</span>
                                </summary>
                                <div className="p-4 pt-0 text-zinc-400 text-sm leading-relaxed border-t border-white/5 mt-2">
                                    Direct democracy involves everyone and is therefore <strong>slow</strong>. Delegation improves speed (fewer voters) but re-introduces centralization (political elites).
                                </div>
                            </details>
                            <details className="group bg-zinc-900/50 border border-white/10 rounded-xl overflow-hidden">
                                <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors">
                                    <span className="font-medium text-white flex items-center gap-2"><Lock size={16} className="text-green-400" />Security vs Agility</span>
                                </summary>
                                <div className="p-4 pt-0 text-zinc-400 text-sm leading-relaxed border-t border-white/5 mt-2">
                                    To prevent Flash Loan attacks, we add <strong>Timelocks</strong> (24-48h delays). However, this makes the DAO unable to react instantly to a hack or market crash.
                                </div>
                            </details>
                        </div>
                    </section>

                    {/* FAQ */}
                    <section className="mb-20">
                        <h2 className="text-3xl font-bold text-white mb-8">Frequently Asked Questions</h2>
                        <div className="space-y-4">
                            <details className="group border border-white/10 rounded-2xl bg-white/5 p-6 open:bg-white/10 transition-colors">
                                <summary className="flex cursor-pointer items-center justify-between font-bold text-white group-hover:text-rose-400 select-none">
                                    "Code is Law" sounds scary. What if there's a typo?
                                    <span className="text-zinc-500 group-hover:text-rose-400 transition-transform group-open:rotate-180">▼</span>
                                </summary>
                                <p className="mt-4 text-zinc-400 leading-relaxed">
                                    That is the big risk. If the code says "allow withdrawing all funds," then that is the law of the protocol, even if it was a mistake. This is why <strong>Timelocks</strong> and <strong>Security Councils</strong> (emergency multisigs) are often used as safety brakes.
                                </p>
                            </details>
                            <details className="group border border-white/10 rounded-2xl bg-white/5 p-6 open:bg-white/10 transition-colors">
                                <summary className="flex cursor-pointer items-center justify-between font-bold text-white group-hover:text-rose-400 select-none">
                                    Do I need to be a lawyer to start a DAO?
                                    <span className="text-zinc-500 group-hover:text-rose-400 transition-transform group-open:rotate-180">▼</span>
                                </summary>
                                <p className="mt-4 text-zinc-400 leading-relaxed">
                                    No, but DAOs often interface with the physical world. "Legal Wrappers" (like LLCs) are becoming common to protect members from individual liability. Ideally, the code handles the treasury, and the legal entity handles taxes and contracts.
                                </p>
                            </details>
                            <details className="group border border-white/10 rounded-2xl bg-white/5 p-6 open:bg-white/10 transition-colors">
                                <summary className="flex cursor-pointer items-center justify-between font-bold text-white group-hover:text-rose-400 select-none">
                                    Why don't more people vote? (Voter Apathy)
                                    <span className="text-zinc-500 group-hover:text-rose-400 transition-transform group-open:rotate-180">▼</span>
                                </summary>
                                <p className="mt-4 text-zinc-400 leading-relaxed">
                                    Voting costs gas and takes time. Most token holders are passive investors. This is why <strong>Delegation</strong> is critical—it allows passive holders to empower active experts without giving up ownership of their tokens.
                                </p>
                            </details>
                        </div>
                    </section>

                </article>
            </div>
        </div>
    );
}
