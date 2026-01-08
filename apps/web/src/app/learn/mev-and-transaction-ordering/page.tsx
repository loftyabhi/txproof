import { Metadata } from 'next';
import { Navbar } from '@/components/Navbar';
import Link from 'next/link';
import { ArrowLeft, Zap, Eye, Server, Shield, Layers, AlertTriangle, TrendingUp } from 'lucide-react';

export const metadata: Metadata = {
    title: 'MEV & Transaction Ordering | The Invisible Tax',
    description: 'Understanding Maximal Extractable Value (MEV), sandwich attacks, and how bots fight for position in the Dark Forest.',
    openGraph: {
        title: 'MEV & Transaction Ordering | Chain Receipt Learning',
        description: 'Front-running, Back-running, and the hidden economy of block production.',
        type: 'article',
    },
};

export default function MevAndTransactionOrdering() {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'TechArticle',
        headline: 'Maximal Extractable Value (MEV)',
        description: 'Technical explanation of MEV, mempools, and transaction supply chains.',
        author: {
            '@type': 'Organization',
            name: 'Chain Receipt',
        },
        educationalLevel: 'Advanced',
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-amber-500/30 overflow-x-hidden">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <Navbar />

            {/* Background Gradients */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-amber-900/20 to-transparent opacity-50" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-yellow-600/5 blur-[120px]" />
                <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-orange-600/5 blur-[120px]" />
            </div>

            <div className="max-w-4xl mx-auto pt-32 pb-20 px-6 relative z-10">
                <Link href="/learn" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-8 transition-colors text-sm font-medium">
                    <ArrowLeft size={16} />
                    Back to Knowledge Base
                </Link>

                <article className="prose prose-invert prose-lg max-w-none">
                    <header className="mb-16">
                        <div className="flex w-fit items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium mb-6">
                            <Zap size={14} />
                            <span>Protocol Economics</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-8 text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 relative inline-block">
                            MEV & Transaction Ordering
                            <div className="absolute top-0 right-[-20%] hidden md:block w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
                        </h1>
                        <p className="text-xl text-zinc-400 leading-relaxed max-w-2xl">
                            The "Invisible Tax" of the blockchain. Miners and validators don't just include transactions; they decide the <strong>order</strong>. And in finance, order is profit.
                        </p>
                    </header>

                    {/* The Dark Forest */}
                    <section className="mb-20">
                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                            <Eye className="text-amber-400" size={24} />
                            The Dark Forest (Mempool)
                        </h2>
                        <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
                            <p className="text-zinc-300 mb-6">
                                When you sign a transaction, it enters the <strong>Mempool</strong>—a public waiting room. Before it's even confirmed, thousands of sophisticated bots analyze it.
                            </p>
                            <p className="text-zinc-300">
                                If your transaction creates a profit opportunity (like a large trade on Uniswap), these bots will pay higher gas fees to jump in front of you (Front-running) or sandwich you (Sandwich Attack).
                            </p>
                            <div className="mt-6 p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg flex items-start gap-3">
                                <AlertTriangle className="text-orange-400 shrink-0 mt-1" size={18} />
                                <div className="text-sm text-orange-200">
                                    <strong>Maximal Extractable Value (MEV):</strong> The total value that can be extracted from block production in excess of the standard block reward and gas fees.
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Tactics Grid */}
                    <section className="mb-20">
                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                            <Layers className="text-blue-400" size={24} />
                            Extraction Tactics
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
                                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                                    <TrendingUp size={18} className="text-green-400" /> Front-running
                                </h3>
                                <p className="text-zinc-400 text-sm">
                                    A bot sees your profitable trade (e.g., an arbitrage opportunity you found) and submits the <strong>exact same transaction</strong> with a slightly higher gas price (Priority Gas Auction). They get the profit; your transaction fails.
                                </p>
                            </div>
                            <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
                                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                                    <Layers size={18} className="text-red-400" /> Sandwich Attack
                                </h3>
                                <p className="text-zinc-400 text-sm">
                                    You buy 1000 ETH. A bot buys heavily <strong>before</strong> you (pumping the price), lets your buy execute (pumping it further), and sells <strong>immediately after</strong>. You get a worse price; they pocket the difference.
                                </p>
                            </div>
                            <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
                                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                                    <Zap size={18} className="text-purple-400" /> Atomic Arbitrage
                                </h3>
                                <p className="text-zinc-400 text-sm">
                                    If ETH is $2000 on Uniswap and $2010 on Sushiswap, a bot buys on Uni and sells on Sushi in one <strong>atomic transaction</strong>. This is generally considered "healthy" MEV as it aligns prices.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* The Supply Chain */}
                    <section className="mb-20">
                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                            <Server className="text-purple-400" size={24} />
                            The MEV Supply Chain
                        </h2>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 p-4 border border-white/5 rounded-lg bg-zinc-900/50">
                                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-zinc-500">1</div>
                                <div>
                                    <div className="font-bold text-white">Searchers</div>
                                    <div className="text-sm text-zinc-400">Run complex algorithms to find MEV opportunities. They build "bundles" of transactions.</div>
                                </div>
                            </div>
                            <div className="flex justify-center"><div className="w-0.5 h-6 bg-gradient-to-b from-zinc-800 to-purple-500/50"></div></div>
                            <div className="flex items-center gap-4 p-4 border border-purple-500/20 rounded-lg bg-purple-500/5">
                                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center font-bold text-purple-400">2</div>
                                <div>
                                    <div className="font-bold text-white">Builders</div>
                                    <div className="text-sm text-zinc-400">Aggregate bundles from searchers to construct the most profitable <strong>full block</strong>.</div>
                                </div>
                            </div>
                            <div className="flex justify-center"><div className="w-0.5 h-6 bg-gradient-to-b from-purple-500/50 to-blue-500/50"></div></div>
                            <div className="flex items-center gap-4 p-4 border border-white/5 rounded-lg bg-zinc-900/50">
                                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-zinc-500">3</div>
                                <div>
                                    <div className="font-bold text-white">Validators (Proposers)</div>
                                    <div className="text-sm text-zinc-400">Simply propose the block built by the highest-bidding Builder. They collect the bid.</div>
                                </div>
                            </div>
                        </div>
                        <p className="text-zinc-500 text-sm mt-4 text-center">
                            This architecture is known as <strong>Proposer-Builder Separation (PBS)</strong>. It prevents validators from needing to run sophisticated trading bots themselves.
                        </p>
                    </section>

                    {/* Mitigation */}
                    <section className="mb-20 p-8 border border-white/10 rounded-3xl bg-gradient-to-br from-amber-900/10 to-yellow-900/10 relative overflow-hidden">
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                            <Shield size={24} className="text-amber-400" /> Managing MEV
                        </h2>
                        <p className="text-zinc-300 leading-relaxed mb-6">
                            MEV cannot be eliminated (someone always decides order), but it can be democratized.
                        </p>
                        <ul className="space-y-4 text-zinc-400">
                            <li className="flex gap-3">
                                <span className="text-amber-500 font-bold">•</span>
                                <div>
                                    <strong>Flashbots (Private RPCs):</strong> Services that allow users to send transactions directly to builders, bypassing the public mempool. This makes you invisible to sandwich bots.
                                </div>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-amber-500 font-bold">•</span>
                                <div>
                                    <strong>Slippage Tolerance:</strong> Setting a low slippage (e.g., 0.5%) means your transaction will fail if a bot tries to sandwich you too hard. It's your primary defense.
                                </div>
                            </li>
                        </ul>
                    </section>

                    {/* FAQ */}
                    <section className="mb-20">
                        <h2 className="text-3xl font-bold text-white mb-8">Frequently Asked Questions</h2>
                        <div className="space-y-4">
                            <details className="group border border-white/10 rounded-2xl bg-white/5 p-6 open:bg-white/10 transition-colors">
                                <summary className="flex cursor-pointer items-center justify-between font-bold text-white group-hover:text-amber-400 select-none">
                                    Is MEV illegal?
                                    <span className="text-zinc-500 group-hover:text-amber-400 transition-transform group-open:rotate-180">▼</span>
                                </summary>
                                <p className="mt-4 text-zinc-400 leading-relaxed">
                                    In traditional finance, "front-running" is illegal. In crypto, "ordering transactions for profit" is currently the standard operating procedure of the network. It is a gray area, but generally considered a feature of permissionless systems rather than a crime (for now).
                                </p>
                            </details>
                            <details className="group border border-white/10 rounded-2xl bg-white/5 p-6 open:bg-white/10 transition-colors">
                                <summary className="flex cursor-pointer items-center justify-between font-bold text-white group-hover:text-amber-400 select-none">
                                    Does using a Layer 2 (like Arbitrum) fix MEV?
                                    <span className="text-zinc-500 group-hover:text-amber-400 transition-transform group-open:rotate-180">▼</span>
                                </summary>
                                <p className="mt-4 text-zinc-400 leading-relaxed">
                                    No. The "Sequencer" on an L2 determines the order, so it can extract MEV. Currently, most L2 sequencers are centralized and promise not to front-run you, but decentralized L2 sequencers will face the same MEV dynamics as Ethereum Mainnet.
                                </p>
                            </details>
                            <details className="group border border-white/10 rounded-2xl bg-white/5 p-6 open:bg-white/10 transition-colors">
                                <summary className="flex cursor-pointer items-center justify-between font-bold text-white group-hover:text-amber-400 select-none">
                                    How can I protect myself?
                                    <span className="text-zinc-500 group-hover:text-amber-400 transition-transform group-open:rotate-180">▼</span>
                                </summary>
                                <p className="mt-4 text-zinc-400 leading-relaxed">
                                    Use an RPC that protects you (like <a href="https://docs.flashbots.net/flashbots-protect/overview" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline">Flashbots Protect</a>) or set a low "Slippage Tolerance" (e.g., 0.1%) on your swaps. If you allow 10% slippage, you are practically inviting a bot to steal that 10%.
                                </p>
                            </details>
                        </div>
                    </section>
                </article>
            </div>
        </div>
    );
}
