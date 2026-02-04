import { Metadata } from 'next';
import { Navbar } from '@/components/Navbar';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { constructCanonical, generateBreadcrumbSchema } from '@/lib/seo';

export const metadata: Metadata = {
    title: 'What is a Blockchain? | Authoritative Definition',
    description: 'An expert explanation of blockchain mechanics, state machines, and consensus. Beyond the hype: understanding distributed coordination.',
    alternates: {
        canonical: constructCanonical('/learn/what-is-blockchain'),
    },
    openGraph: {
        title: 'What is a Blockchain? | TxProof Learning',
        description: 'Trust, coordination, and the deterministic state machine.',
        type: 'article',
    },
};

const breadcrumbs = [
    { name: 'Home', item: '/' },
    { name: 'Learn', item: '/learn' },
    { name: 'What is Blockchain?', item: '/learn/what-is-blockchain' },
];

export default function WhatIsBlockchain() {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'TechArticle',
        headline: 'What is a Blockchain?',
        description: 'Comprehensive technical explanation of distributed ledger technology.',
        author: {
            '@type': 'Organization',
            name: 'TxProof',
        },
        educationalLevel: 'Beginner',
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-violet-500/30 overflow-x-hidden">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(generateBreadcrumbSchema(breadcrumbs)) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <Navbar />

            {/* Background Gradients */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-violet-900/20 to-transparent opacity-50" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/5 blur-[120px]" />
                <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-violet-600/5 blur-[120px]" />
            </div>

            <div className="max-w-4xl mx-auto pt-32 pb-20 px-6 relative z-10">
                <Link href="/learn" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-8 transition-colors text-sm font-medium">
                    <ArrowLeft size={16} />
                    Back to Knowledge Base
                </Link>

                <div className="max-w-4xl mx-auto">
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-8 text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 relative inline-block">
                        What is a Blockchain?
                        <div className="absolute top-0 right-[-20%] hidden md:block w-32 h-32 bg-violet-500/10 rounded-full blur-3xl pointer-events-none"></div>
                    </h1>

                    <div className="text-xl text-zinc-400 leading-relaxed mb-16 font-light">
                        Blockchains did not emerge simply to create cryptocurrencies. They emerged to solve a fundamental problem in computer science and human organization: how do independent actors coordinate and agree on a "truth" without relying on a central authority?
                    </div>

                    <div className="space-y-24">
                        {/* Section 1: The Concept */}
                        <section>
                            <p className="text-lg text-zinc-300 leading-relaxed mb-8">
                                Before blockchain, establishing trust required an intermediary—a bank to confirm funds were sent, or a notary to verify a signature. The innovation of the blockchain is that it replaces this human intermediary with a verifiable, mathematical structure.
                            </p>

                            <div className="p-8 rounded-3xl bg-zinc-900/50 border border-white/10 backdrop-blur-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
                                <h2 className="text-2xl font-bold text-white mb-4">The Deterministic State Machine</h2>
                                <p className="text-zinc-400 mb-6 leading-relaxed">
                                    It is common to hear blockchain described as a "distributed ledger," but that analogy is incomplete. It is more accurate to view a blockchain as a <strong>deterministic state machine</strong>.
                                </p>
                                <div className="grid md:grid-cols-3 gap-4 ">
                                    <div className="p-4 rounded-xl bg-black/40 border border-white/5 text-center">
                                        <div className="text-violet-400 font-mono text-sm mb-2">INPUT</div>
                                        <div className="text-white font-medium">Transactions</div>
                                    </div>
                                    <div className="hidden md:flex items-center justify-center text-zinc-600">→</div>
                                    <div className="p-4 rounded-xl bg-black/40 border border-white/5 text-center">
                                        <div className="text-violet-400 font-mono text-sm mb-2">PROCESS</div>
                                        <div className="text-white font-medium">EVM Execution</div>
                                    </div>
                                    <div className="hidden md:flex items-center justify-center text-zinc-600">→</div>
                                    <div className="p-4 rounded-xl bg-black/40 border border-white/5 text-center">
                                        <div className="text-violet-400 font-mono text-sm mb-2">OUTPUT</div>
                                        <div className="text-white font-medium">Updated State</div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Section 2: Core Properties */}
                        <section>
                            <h2 className="text-3xl font-bold text-white mb-8">Core Properties of Trustless Systems</h2>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                                    <h3 className="text-xl font-bold text-violet-200 mb-3">Immutability</h3>
                                    <p className="text-zinc-400 text-sm leading-relaxed">
                                        Once data is buried under subsequent blocks, it becomes practically impossible to change. The economic cost of rewriting history (PoW/PoS) makes it an excellent medium for historical record-keeping.
                                    </p>
                                </div>
                                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                                    <h3 className="text-xl font-bold text-violet-200 mb-3">Decentralization</h3>
                                    <p className="text-zinc-400 text-sm leading-relaxed">
                                        There is no central server to hack or subpoena. The network survives as long as a single node exists, ensuring "truth" is available 24/7/365 regardless of politics.
                                    </p>
                                </div>
                                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                                    <h3 className="text-xl font-bold text-violet-200 mb-3">Transparency</h3>
                                    <p className="text-zinc-400 text-sm leading-relaxed">
                                        Every transaction is visible to anyone running a node. It shows *what* happened (bytes allowed to move), but not necessarily *why* or *who* is behind it.
                                    </p>
                                </div>
                                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                                    <h3 className="text-xl font-bold text-violet-200 mb-3">Finality</h3>
                                    <p className="text-zinc-400 text-sm leading-relaxed">
                                        Unlike legacy systems (T+2 days), blockchains offer finality within minutes. Once settled, ownership transfer is mathematical fact, not a promise to pay.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Section 3: Anatomy */}
                        <section>
                            <h2 className="text-3xl font-bold text-white mb-8">Blocks, Transactions, and State</h2>
                            <p className="text-zinc-400 mb-8 max-w-2xl">
                                To understand how this machine actually moves legally, we need to separate the container from the content.
                            </p>
                            <div className="space-y-4">
                                <div className="flex flex-col md:flex-row gap-6 p-6 rounded-2xl bg-zinc-900/40 border border-white/5 items-start">
                                    <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0 text-blue-400 font-bold">1</div>
                                    <div>
                                        <h4 className="text-white font-bold text-lg mb-2">Blocks</h4>
                                        <p className="text-zinc-400 text-sm">Batches of transactions. The "heartbeat" of the network (e.g., every 12 seconds on Ethereum).</p>
                                    </div>
                                </div>
                                <div className="flex flex-col md:flex-row gap-6 p-6 rounded-2xl bg-zinc-900/40 border border-white/5 items-start">
                                    <div className="w-12 h-12 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0 text-violet-400 font-bold">2</div>
                                    <div>
                                        <h4 className="text-white font-bold text-lg mb-2">Transactions</h4>
                                        <p className="text-zinc-400 text-sm">The inputs. Signed messages saying "I authorize this interaction."</p>
                                    </div>
                                </div>
                                <div className="flex flex-col md:flex-row gap-6 p-6 rounded-2xl bg-zinc-900/40 border border-white/5 items-start">
                                    <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0 text-emerald-400 font-bold">3</div>
                                    <div>
                                        <h4 className="text-white font-bold text-lg mb-2">State</h4>
                                        <p className="text-zinc-400 text-sm">The result. The current balances of all accounts and the memory of all smart contracts.</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Section 4: Misconceptions */}
                        <section>
                            <h2 className="text-3xl font-bold text-white mb-8">Common Misconceptions</h2>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="p-8 rounded-3xl bg-zinc-900/50 border border-white/10 backdrop-blur-sm">
                                    <h4 className="text-white font-bold mb-4 text-xl">"Blockchain = Cryptocurrency"</h4>
                                    <p className="text-zinc-400 leading-relaxed">
                                        <span className="text-red-400 font-bold">False.</span> Cryptocurrency (tokens) is just one <i>application</i>. The underlying secure database can track logistics, identity, or voting rights without money changing hands.
                                    </p>
                                </div>
                                <div className="p-8 rounded-3xl bg-zinc-900/50 border border-white/10 backdrop-blur-sm">
                                    <h4 className="text-white font-bold mb-4 text-xl">"It is anonymous"</h4>
                                    <p className="text-zinc-400 leading-relaxed">
                                        <span className="text-amber-400 font-bold">Pseudonymous.</span> If your wallet address is ever linked to your real identity, your entire financial history becomes public record.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Section 5: Why It Matters */}
                        <section className="bg-gradient-to-br from-violet-900/20 to-blue-900/20 p-8 rounded-3xl border border-white/10">
                            <h2 className="text-2xl font-bold text-white mb-6">Why This Matters</h2>
                            <div className="prose prose-invert max-w-none text-zinc-300">
                                <p className="mb-4">
                                    Understanding these mechanics is not just academic; it is a requirement for operational competence in the modern digital economy. For auditors, compliance officers, and investors, treating the blockchain as a black box is a risk.
                                </p>
                                <p>
                                    Only by understanding the deterministic nature of these systems can we accurately account for assets, verify liabilities, and build systems that integrate safely with this new financial stack.
                                </p>
                            </div>
                        </section>

                        {/* FAQ */}
                        <section>
                            <h2 id="faq" className="text-3xl font-bold text-white mb-8">Frequently Asked Questions</h2>
                            <div className="space-y-4">
                                {[
                                    {
                                        q: "What problem does blockchain actually solve?",
                                        a: "It solves the 'coordination problem' in adversarial environments. It allows parties who do not trust each other to agree on the state of a system (like who owns what) without needing a referee."
                                    },
                                    {
                                        q: "Is a blockchain just a slow database?",
                                        a: "In terms of throughput? Yes. But standard databases rely on a single administrator (root user) who can edit or delete data. A blockchain is a database with no administrator, optimized for censorship resistance rather than speed."
                                    },
                                    {
                                        q: "Why are transactions hard to interpret?",
                                        a: "Because the chain stores data efficiently (in hex/binary), not legibly. Converting that raw machine code back into human-readable actions ('Swapped USDC for ETH') requires indexers and decoders."
                                    }
                                ].map((faq, i) => (
                                    <details key={i} className="group border border-white/10 rounded-2xl bg-white/5 p-6 open:bg-white/10 transition-colors">
                                        <summary className="flex cursor-pointer items-center justify-between font-bold text-white group-hover:text-violet-400 select-none">
                                            {faq.q}
                                            <span className="text-zinc-500 group-hover:text-violet-400 transition-transform group-open:rotate-180">▼</span>
                                        </summary>
                                        <p className="mt-4 text-zinc-400 leading-relaxed">
                                            {faq.a}
                                        </p>
                                    </details>
                                ))}
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
