import { Metadata } from 'next';
import { Navbar } from '@/components/Navbar';
import Link from 'next/link';
import { ArrowLeft, Fingerprint, Database, Store, Wallet, ShieldAlert, FileCode, Layers, Image as ImageIcon, Gamepad2 } from 'lucide-react';

export const metadata: Metadata = {
    title: 'NFTs Explained | ERC-721 & Digital Ownership',
    description: 'A technical guide to Non-Fungible Tokens. Understand ERC-721 standards, metadata storage, and the real utility of digital ownership beyond art.',
    openGraph: {
        title: 'NFTs Explained | Chain Receipt Learning',
        description: 'Unique digital identifiers on the blockchain. A comprehensive technical overview.',
        type: 'article',
    },
};

export default function NFTsExplained() {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'TechArticle',
        headline: 'Non-Fungible Tokens (NFTs) Explained',
        description: 'Technical analysis of unique digital assets, standards, and ecosystem mechanics.',
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
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-fuchsia-900/20 to-transparent opacity-50" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-violet-600/5 blur-[120px]" />
                <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-fuchsia-600/5 blur-[120px]" />
            </div>

            <div className="max-w-4xl mx-auto pt-32 pb-20 px-6 relative z-10">
                <Link href="/learn" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-8 transition-colors text-sm font-medium group">
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Knowledge Base
                </Link>

                <article className="prose prose-invert prose-lg max-w-none">
                    <header className="mb-16">
                        <div className="flex w-fit items-center gap-2 px-3 py-1 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-400 text-sm font-medium mb-6">
                            <Fingerprint size={14} />
                            <span>Digital Scarcity</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 relative inline-block leading-tight">
                            NFTs Explained
                            <div className="absolute top-0 right-[-20%] hidden md:block w-32 h-32 bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none"></div>
                        </h1>
                        <p className="text-xl md:text-2xl text-zinc-400 leading-relaxed max-w-2xl">
                            Move beyond the hype of digital art. Technologically, an NFT is a <span className="text-white font-semibold">unique digital identifier</span> that cannot be copied, substituted, or subdivided.
                        </p>
                    </header>

                    {/* The Core Concept */}
                    <div className="mb-16">
                        <h2 className="text-3xl font-bold text-white mb-8">Fungible vs. Non-Fungible</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="p-8 rounded-3xl bg-zinc-900/30 border border-white/5 relative overflow-hidden">
                                <h3 className="text-xl font-semibold text-zinc-400 mb-4">Fungible Assets</h3>
                                <p className="text-zinc-500 mb-6 text-sm uppercase tracking-wider font-bold">Interchangeable</p>
                                <ul className="space-y-4">
                                    <li className="flex items-start gap-3 text-zinc-400">
                                        <div className="w-1.5 h-1.5 rounded-full bg-zinc-600 mt-2.5" />
                                        <span>One $10 bill is exactly the same as another $10 bill.</span>
                                    </li>
                                    <li className="flex items-start gap-3 text-zinc-400">
                                        <div className="w-1.5 h-1.5 rounded-full bg-zinc-600 mt-2.5" />
                                        <span>1 BTC = 1 BTC.</span>
                                    </li>
                                    <li className="flex items-start gap-3 text-zinc-400">
                                        <div className="w-1.5 h-1.5 rounded-full bg-zinc-600 mt-2.5" />
                                        <span>Value is defined by quantity, not uniqueness.</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="p-8 rounded-3xl bg-fuchsia-900/10 border border-fuchsia-500/20 relative overflow-hidden backdrop-blur-sm">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none" />
                                <h3 className="text-xl font-semibold text-white mb-4">Non-Fungible Tokens</h3>
                                <p className="text-fuchsia-400 mb-6 text-sm uppercase tracking-wider font-bold">Unique</p>
                                <ul className="space-y-4">
                                    <li className="flex items-start gap-3 text-zinc-300">
                                        <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 mt-2.5" />
                                        <span>Like a house deed or a specific trading card.</span>
                                    </li>
                                    <li className="flex items-start gap-3 text-zinc-300">
                                        <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 mt-2.5" />
                                        <span>Token ID #1 is NOT the same as Token ID #2.</span>
                                    </li>
                                    <li className="flex items-start gap-3 text-zinc-300">
                                        <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 mt-2.5" />
                                        <span>Value is subjective and based on specific traits.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Technical Standards */}
                    <div className="mb-16">
                        <h2 className="text-3xl font-bold text-white mb-8">Technical Standards</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                {
                                    icon: FileCode,
                                    title: "ERC-721",
                                    subtitle: "The Gold Standard",
                                    desc: "The original NFT standard. It defines a system where each token is distinct. Perfect for 1/1 art, profile pictures, and real estate deeds."
                                },
                                {
                                    icon: Layers,
                                    title: "ERC-1155",
                                    subtitle: "The Multi-Token Standard",
                                    desc: "Designed for efficiency (especially gaming). A single contract can manage mixed types (both fungible gold coins and non-fungible swords). Allows batch transfers to save gas."
                                }
                            ].map((item, i) => (
                                <div key={i} className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5 hover:border-fuchsia-500/30 transition-colors backdrop-blur-sm group">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 text-fuchsia-400">
                                            <item.icon size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white leading-none">{item.title}</h3>
                                            <span className="text-xs text-fuchsia-400 font-mono uppercase tracking-wide">{item.subtitle}</span>
                                        </div>
                                    </div>
                                    <p className="text-sm text-zinc-400 leading-relaxed">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* The Ecosystem */}
                    <div className="mb-16">
                        <h2 className="text-3xl font-bold text-white mb-8">The Lifecycle</h2>
                        <div className="space-y-6">
                            {[
                                {
                                    title: "1. Minting",
                                    icon: Database,
                                    content: "The creation process. A file (image/metadata) is uploaded to decentralized storage (IPFS), and a new record is written to the blockchain linking that data to a Token ID."
                                },
                                {
                                    title: "2. The Wallet (Custody)",
                                    icon: Wallet,
                                    content: "The NFT lives in your wallet address. You don't 'download' it; your wallet simply holds the private key that proves you own the slot on the blockchain ledger."
                                },
                                {
                                    title: "3. Marketplaces",
                                    icon: Store,
                                    content: "Platforms like OpenSea or Blur act as front-ends. They read the blockchain data to display your items. 'Open' marketplaces allow anyone to list; 'Curated' ones gatekeep creators."
                                }
                            ].map((item, i) => (
                                <div key={i} className="flex gap-6 p-6 rounded-2xl bg-zinc-800/20 border border-white/5 items-start">
                                    <div className="hidden md:flex flex-shrink-0 w-12 h-12 rounded-full bg-fuchsia-500/10 items-center justify-center text-fuchsia-400">
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

                    {/* Use Cases */}
                    <div className="mb-16">
                        <h2 className="text-3xl font-bold text-white mb-8">Beyond Digital Art</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                                { icon: Gamepad2, label: "Gaming Assets" },
                                { icon: Fingerprint, label: "Digital Identity" },
                                { icon: ImageIcon, label: "Real World Assets" },
                            ].map((useCase, i) => (
                                <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col items-center justify-center text-center gap-3">
                                    <useCase.icon className="text-fuchsia-400" size={28} />
                                    <span className="font-semibold text-zinc-200">{useCase.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Risks */}
                    <div className="mb-16 p-8 rounded-3xl bg-red-900/10 border border-red-500/20">
                        <div className="flex items-center gap-3 mb-4">
                            <ShieldAlert className="text-red-400" size={24} />
                            <h2 className="text-2xl font-bold text-red-200">Critical Risks</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                            <div>
                                <h4 className="font-bold text-white mb-2">Storage Risk</h4>
                                <p className="text-sm text-zinc-400">Where does the image live? If it's on a centralized server (AWS) and the company goes bankrupt, your NFT might point to a "404 Not Found" error.</p>
                            </div>
                            <div>
                                <h4 className="font-bold text-white mb-2">Scams & Phishing</h4>
                                <p className="text-sm text-zinc-400">"Fake Mints" and phishing links are rampant. Malicious contracts can drain your wallet the moment you approve a transaction.</p>
                            </div>
                        </div>
                    </div>

                    {/* FAQ */}
                    <div className="mb-12">
                        <h2 className="text-3xl font-bold text-white mb-8">Common Questions</h2>
                        <div className="space-y-4">
                            {[
                                {
                                    q: "Can I just copy-paste the image?",
                                    a: "Yes, you can copy the file. But you cannot copy the ownership record on the blockchain. It's the difference between taking a photo of the Mona Lisa and actually owning it."
                                },
                                {
                                    q: "What are 'Gas Fees'?",
                                    a: "Minting or transferring an NFT requires computation on the network. You must pay a fee (in ETH) to the validators to process this transaction."
                                },
                                {
                                    q: "Are NFTs bad for the environment?",
                                    a: "Historically, Proof-of-Work chains consumed immense energy. However, Ethereum's switch to Proof-of-Stake reduced its energy consumption by ~99.95%, making NFTs on Ethereum environmentally negligible."
                                }
                            ].map((faq, i) => (
                                <details key={i} className="group border border-white/10 rounded-2xl bg-white/5 p-6 open:bg-white/10 transition-all">
                                    <summary className="flex cursor-pointer items-center justify-between font-bold text-white group-hover:text-fuchsia-400 select-none">
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
