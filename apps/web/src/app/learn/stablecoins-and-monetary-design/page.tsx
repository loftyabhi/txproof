import { Metadata } from 'next';
import { Navbar } from '@/components/Navbar';
import Link from 'next/link';
import { ArrowLeft, Landmark, Cpu, Scale, RefreshCcw, Coins, AlertTriangle, Wallet, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Stablecoins & Monetary Design | Blockchain Economics',
    description: 'Deep dive into stablecoin architectures: Fiat-backed, Crypto-backed, and Algorithmic. Understanding peg mechanics and the stablecoin trilemma.',
    openGraph: {
        title: 'Stablecoins | Chain Receipt Learning',
        description: 'How we engineer stability in a volatile ecosystem. The economics of digital money.',
        type: 'article',
    },
};

export default function StablecoinsAndMonetaryDesign() {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'TechArticle',
        headline: 'Stablecoins & Monetary Design',
        description: 'Technical analysis of stablecoin stability mechanisms and economic trade-offs.',
        author: {
            '@type': 'Organization',
            name: 'Chain Receipt',
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
                            <Coins size={14} />
                            <span>Monetary Engineering</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-8 text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 relative inline-block">
                            Stablecoins & Design
                            <div className="absolute top-0 right-[-20%] hidden md:block w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
                        </h1>
                        <p className="text-xl text-zinc-400 leading-relaxed max-w-2xl">
                            Cryptocurrencies are volatile; money must be stable. Stablecoins are the bridge that allows us to import the stability of fiat currencies into the trustless environment of a blockchain.
                        </p>
                    </header>

                    {/* The Three Models */}
                    <section className="mb-20">
                        <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                            <Scale className="text-emerald-400" size={24} />
                            Stabilization Models
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* FIAT BACKED */}
                            <div className="p-6 bg-zinc-900/50 border border-white/10 rounded-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10"><Landmark size={48} /></div>
                                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                                    <Landmark className="text-blue-400" size={18} />
                                    Fiat-Backed
                                </h3>
                                <div className="text-xs font-mono text-zinc-500 mb-4">Examples: USDC, USDT</div>
                                <p className="text-zinc-400 text-sm mb-4">
                                    <strong>Off-Chain Collateral.</strong> An issuer holds $1 USD in a bank account for every 1 token minted.
                                </p>
                                <ul className="space-y-2 text-xs">
                                    <li className="flex items-center gap-2 text-green-400/80"><span>+</span> 100% Capital Efficient</li>
                                    <li className="flex items-center gap-2 text-red-400/80"><span>-</span> Centralized (Censorship risk)</li>
                                </ul>
                            </div>

                            {/* CRYPTO BACKED */}
                            <div className="p-6 bg-zinc-900/50 border border-white/10 rounded-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10"><Cpu size={48} /></div>
                                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                                    <Cpu className="text-purple-400" size={18} />
                                    Crypto-Backed
                                </h3>
                                <div className="text-xs font-mono text-zinc-500 mb-4">Examples: DAI, LUSD</div>
                                <p className="text-zinc-400 text-sm mb-4">
                                    <strong>On-Chain Collateral.</strong> Users deposit ETH into a smart contract vault to borrow stablecoins against it.
                                </p>
                                <ul className="space-y-2 text-xs">
                                    <li className="flex items-center gap-2 text-green-400/80"><span>+</span> Trustless & Transparent</li>
                                    <li className="flex items-center gap-2 text-red-400/80"><span>-</span> Over-collateralized (Inefficient)</li>
                                </ul>
                            </div>

                            {/* ALGORITHMIC */}
                            <div className="p-6 bg-zinc-900/50 border border-white/10 rounded-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10"><RefreshCcw size={48} /></div>
                                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                                    <RefreshCcw className="text-orange-400" size={18} />
                                    Algorithmic
                                </h3>
                                <div className="text-xs font-mono text-zinc-500 mb-4">Examples: FRAX, UST (Failed)</div>
                                <p className="text-zinc-400 text-sm mb-4">
                                    <strong>Endogenous Collateral.</strong> Relies on market incentives and seigniorage shares to maintain value.
                                </p>
                                <ul className="space-y-2 text-xs">
                                    <li className="flex items-center gap-2 text-green-400/80"><span>+</span> Infinite Scalability</li>
                                    <li className="flex items-center gap-2 text-red-400/80"><span>-</span> Death Spiral Risk</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* How Pegs Work (Arbitrage) */}
                    <section className="mb-20">
                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                            <RefreshCcw className="text-teal-400" size={24} />
                            The Mechanism: Arbitrage
                        </h2>
                        <div className="bg-[#111] border border-white/10 rounded-2xl p-8 mb-8">
                            <p className="text-zinc-300 mb-8">
                                A stablecoin is not stable because of magic; it is stable because profit-seeking actors (Arbitrageurs) force it to be.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div>
                                    <h4 className="font-bold text-red-400 mb-2">Scenario A: Price {'>'} $1.00</h4>
                                    <ol className="space-y-2 text-sm text-zinc-400 list-decimal pl-4 marker:text-zinc-600">
                                        <li>Stablecoin trades at <strong>$1.02</strong> on Uniswap.</li>
                                        <li>Trader mints 1 token for <strong>$1.00</strong> collateral.</li>
                                        <li>Trader sells token on market for <strong>$1.02</strong>.</li>
                                        <li><span className="text-white">Result:</span> Supply increases, price dumps back to $1.</li>
                                    </ol>
                                </div>
                                <div className="relative">
                                    {/* Vertical Divider for Desktop */}
                                    <div className="absolute left-[-24px] top-0 bottom-0 w-px bg-white/10 hidden md:block"></div>
                                    <h4 className="font-bold text-green-400 mb-2">Scenario B: Price {'<'} $1.00</h4>
                                    <ol className="space-y-2 text-sm text-zinc-400 list-decimal pl-4 marker:text-zinc-600">
                                        <li>Stablecoin trades at <strong>$0.98</strong> on Uniswap.</li>
                                        <li>Trader buys token for <strong>$0.98</strong>.</li>
                                        <li>Trader redeems token for <strong>$1.00</strong> collateral.</li>
                                        <li><span className="text-white">Result:</span> Supply decreases, price pumps back to $1.</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* The Trilemma */}
                    <section className="mb-20">
                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                            <AlertTriangle className="text-yellow-400" size={24} />
                            The Stablecoin Trilemma
                        </h2>
                        <div className="p-8 border border-yellow-500/20 bg-yellow-500/5 rounded-2xl">
                            <p className="text-zinc-300 mb-6">
                                Generally, you can only optimize for two of the three following properties:
                            </p>
                            <div className="space-y-4">
                                <div className="flex items-start gap-4">
                                    <div className="mt-1 p-1 bg-white/10 rounded text-white"><ShieldCheck size={16} /></div>
                                    <div>
                                        <div className="font-bold text-white">Peg Stability</div>
                                        <div className="text-sm text-zinc-400">Does it hold $1.00 during a market crash?</div>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="mt-1 p-1 bg-white/10 rounded text-white"><Cpu size={16} /></div>
                                    <div>
                                        <div className="font-bold text-white">Decentralization</div>
                                        <div className="text-sm text-zinc-400">Can the issuer censor transactions or freeze funds?</div>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="mt-1 p-1 bg-white/10 rounded text-white"><Wallet size={16} /></div>
                                    <div>
                                        <div className="font-bold text-white">Capital Efficiency</div>
                                        <div className="text-sm text-zinc-400">Can I scale the supply without locking up excessive capital?</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* FAQ */}
                    <section className="mb-20">
                        <h2 className="text-3xl font-bold text-white mb-8">Frequently Asked Questions</h2>
                        <div className="space-y-4">
                            <details className="group border border-white/10 rounded-2xl bg-white/5 p-6 open:bg-white/10 transition-colors">
                                <summary className="flex cursor-pointer items-center justify-between font-bold text-white group-hover:text-emerald-400 select-none">
                                    Why do stablecoins de-peg?
                                    <span className="text-zinc-500 group-hover:text-emerald-400 transition-transform group-open:rotate-180">▼</span>
                                </summary>
                                <p className="mt-4 text-zinc-400 leading-relaxed">
                                    De-pegging occurs when the redemption mechanism fails or loses credibility. If users believe the collateral is missing (or frozen), they panic sell. If the selling pressure exceeds the available liquidity for redemption, the price crashes below $1.00.
                                </p>
                            </details>
                            <details className="group border border-white/10 rounded-2xl bg-white/5 p-6 open:bg-white/10 transition-colors">
                                <summary className="flex cursor-pointer items-center justify-between font-bold text-white group-hover:text-emerald-400 select-none">
                                    What is the "Death Spiral"?
                                    <span className="text-zinc-500 group-hover:text-emerald-400 transition-transform group-open:rotate-180">▼</span>
                                </summary>
                                <p className="mt-4 text-zinc-400 leading-relaxed">
                                    Specific to Algorithmic Stablecoins (like UST). If the backing asset (LUNA) falls in value, people mint more LUNA to redeem UST, which crashes LUNA further, causing more panic. It is a positive feedback loop that destroys both tokens.
                                </p>
                            </details>
                            <details className="group border border-white/10 rounded-2xl bg-white/5 p-6 open:bg-white/10 transition-colors">
                                <summary className="flex cursor-pointer items-center justify-between font-bold text-white group-hover:text-emerald-400 select-none">
                                    Are USDC/USDT real money?
                                    <span className="text-zinc-500 group-hover:text-emerald-400 transition-transform group-open:rotate-180">▼</span>
                                </summary>
                                <p className="mt-4 text-zinc-400 leading-relaxed">
                                    Legally, they are usually defined as "store of value" assets or IOUs. They represent a claim on a dollar in a bank account, but they are not FDIC insured like a bank deposit. If the issuer goes bankrupt, you could lose your funds.
                                </p>
                            </details>
                        </div>
                    </section>
                </article>
            </div>
        </div>
    );
}
