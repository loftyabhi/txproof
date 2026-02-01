import { Metadata } from 'next';
import { Navbar } from '@/components/Navbar';
import Link from 'next/link';
import { ArrowLeft, Landmark, Layers, Unlock, ShieldCheck, Code2, Banknote, RefreshCcw, TrendingUp } from 'lucide-react';

export const metadata: Metadata = {
    title: 'DeFi Explained | The Future of Finance',
    description: 'Expert guide to Decentralized Finance. Understand the shift from centralized intermediaries to permissionless code, liquidity pools, and programmable money.',
    openGraph: {
        title: 'DeFi Explained | TxProof Learning',
        description: 'Financial infrastructure running on common software. A technical deep dive.',
        type: 'article',
    },
};

export default function DeFiExplained() {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'TechArticle',
        headline: 'Decentralized Finance (DeFi) Explained',
        description: 'A technical overview of the paradigm shift from centralized finance to permissionless, programmable protocols.',
        author: {
            '@type': 'Organization',
            name: 'TxProof',
        },
        educationalLevel: 'Advanced',
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
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-blue-900/20 to-transparent opacity-50" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-violet-600/5 blur-[120px]" />
                <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/5 blur-[120px]" />
            </div>

            <div className="max-w-4xl mx-auto pt-32 pb-20 px-6 relative z-10">
                <Link href="/learn" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-8 transition-colors text-sm font-medium group">
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Knowledge Base
                </Link>

                <article className="prose prose-invert prose-lg max-w-none">
                    <header className="mb-16">
                        <div className="flex w-fit items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6">
                            <Landmark size={14} />
                            <span>Financial Infrastructure</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 relative inline-block leading-tight">
                            DeFi Explained
                            <div className="absolute top-0 right-[-20%] hidden md:block w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
                        </h1>
                        <p className="text-xl md:text-2xl text-zinc-400 leading-relaxed max-w-2xl">
                            We are witnessing the transition from a financial system run by <span className="text-white font-semibold">institutions</span> to one run by <span className="text-white font-semibold">code</span>.
                        </p>
                    </header>

                    {/* The Paradigm Shift */}
                    <div className="mb-16">
                        <h2 className="text-3xl font-bold text-white mb-8">The Paradigm Shift</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="p-8 rounded-3xl bg-zinc-900/30 border border-white/5 relative overflow-hidden">
                                <h3 className="text-xl font-semibold text-zinc-400 mb-4">Traditional Finance (CeFi)</h3>
                                <ul className="space-y-4">
                                    <li className="flex items-start gap-3 text-zinc-400">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500/50 mt-2.5" />
                                        <span>Rely on intermediaries (Banks, Brokers).</span>
                                    </li>
                                    <li className="flex items-start gap-3 text-zinc-400">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500/50 mt-2.5" />
                                        <span>Opaque ledgers ("Black Box").</span>
                                    </li>
                                    <li className="flex items-start gap-3 text-zinc-400">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500/50 mt-2.5" />
                                        <span>Restricted access (KYC, Borders).</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="p-8 rounded-3xl bg-blue-900/10 border border-blue-500/20 relative overflow-hidden backdrop-blur-sm">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                                <h3 className="text-xl font-semibold text-white mb-4">Decentralized Finance (DeFi)</h3>
                                <ul className="space-y-4">
                                    <li className="flex items-start gap-3 text-zinc-300">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2.5" />
                                        <span>Rely on <span className="text-blue-400 font-medium">Smart Contracts</span>.</span>
                                    </li>
                                    <li className="flex items-start gap-3 text-zinc-300">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2.5" />
                                        <span>Transparent, visible ledgers.</span>
                                    </li>
                                    <li className="flex items-start gap-3 text-zinc-300">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2.5" />
                                        <span>Open to anyone with an internet connection.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Architecture of Trust */}
                    <div className="mb-16">
                        <h2 className="text-3xl font-bold text-white mb-8">Architecture of Trust</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                {
                                    icon: Code2,
                                    title: "Programmability",
                                    desc: "Smart contracts automate business logic, enabling the creation of complex financial instruments that execute deterministically without manual intervention."
                                },
                                {
                                    icon: Layers,
                                    title: "Composability (\"Money Legos\")",
                                    desc: "DeFi protocols are like open APIs. A lending app can plug into a decentralized exchange, which can plug into a yield aggregator. Innovation compounds."
                                },
                                {
                                    icon: Unlock,
                                    title: "Permissionless",
                                    desc: "There are no gatekeepers. No credit scores, no discrimination, and no lengthy application forms. You interact directly with the blockchain."
                                },
                                {
                                    icon: ShieldCheck,
                                    title: "Self-Custody",
                                    desc: "You maintain control of your private keys and assets at all times. You are not depositing funds into a bank account; you are interacting with code."
                                }
                            ].map((item, i) => (
                                <div key={i} className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5 hover:border-blue-500/30 transition-colors backdrop-blur-sm group">
                                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 text-blue-400">
                                        <item.icon size={20} />
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                                    <p className="text-sm text-zinc-400 leading-relaxed">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Ecosystem Components */}
                    <div className="mb-16">
                        <h2 className="text-3xl font-bold text-white mb-8">Ecosystem Components</h2>
                        <div className="space-y-6">
                            {[
                                {
                                    title: "Decentralized Exchanges (DEXs)",
                                    icon: RefreshCcw,
                                    content: "DEXs like Uniswap allow peer-to-peer trading without an order book. Instead, they use Automated Market Makers (AMMs) where users trade against a liquidity pool of tokens governed by a constant formula (x * y = k)."
                                },
                                {
                                    title: "Lending & Borrowing",
                                    icon: Banknote,
                                    content: "Protocols like Aave and Compound allow users to lend assets to earn interest or borrow against their crypto holdings. Loans are typically over-collateralized to ensure solvency without identity verification."
                                },
                                {
                                    title: "Stablecoins",
                                    icon: TrendingUp,
                                    content: "Tokens pegged to stable assets like the US Dollar (e.g., USDC, DAI). They bridge the gap between fiat stability and blockchain programmability, essential for trading and payments."
                                }
                            ].map((item, i) => (
                                <div key={i} className="flex gap-6 p-6 rounded-2xl bg-zinc-800/20 border border-white/5 items-start">
                                    <div className="hidden md:flex flex-shrink-0 w-12 h-12 rounded-full bg-blue-500/10 items-center justify-center text-blue-400">
                                        <item.icon size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                                        <p className="text-zinc-400 leading-relaxed">{item.content}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Risks */}
                    <div className="mb-16 p-8 rounded-3xl bg-red-900/10 border border-red-500/20">
                        <h2 className="text-2xl font-bold text-red-200 mb-4">Critical Risks</h2>
                        <p className="text-zinc-300 mb-6 leading-relaxed">
                            With great power comes great responsibility. The removal of intermediaries means the removal of safety nets.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-bold text-white mb-2">Smart Contract Risk</h4>
                                <p className="text-sm text-zinc-400">Code bugs or vulnerabilities can be exploited by hackers to drain funds. Unlike a bank hack, these transactions are irreversible.</p>
                            </div>
                            <div>
                                <h4 className="font-bold text-white mb-2">Impermanent Loss</h4>
                                <p className="text-sm text-zinc-400">Liquidity providers may lose value compared to simply holding tokens if the price ratio between assets in a pool changes significantly.</p>
                            </div>
                        </div>
                    </div>

                    {/* FAQ */}
                    <div className="mb-12">
                        <h2 className="text-3xl font-bold text-white mb-8">Common Questions</h2>
                        <div className="space-y-4">
                            {[
                                {
                                    q: "What is Yield Farming?",
                                    a: "Yield farming is the strategy of moving assets between various DeFi protocols to maximize return on investment, often earning governance tokens as additional rewards for providing liquidity."
                                },
                                {
                                    q: "Is DeFi legal?",
                                    a: "DeFi protocols are software tools. While the technology is neutral, regulations vary by jurisdiction. Many countries are currently developing frameworks to address decentralized finance."
                                },
                                {
                                    q: "What happens if I lose my private key?",
                                    a: "In DeFi, you are your own bank. If you lose your private key or seed phrase, your funds are lost forever. There is no 'Forgot Password' button."
                                }
                            ].map((faq, i) => (
                                <details key={i} className="group border border-white/10 rounded-2xl bg-white/5 p-6 open:bg-white/10 transition-all">
                                    <summary className="flex cursor-pointer items-center justify-between font-bold text-white group-hover:text-blue-400 select-none">
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
