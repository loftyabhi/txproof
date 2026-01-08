import { Metadata } from 'next';
import { Navbar } from '@/components/Navbar';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Hash, Key, Box, Zap, Layers, ShieldCheck, Globe, Activity, FileCode } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Common Crypto Terms | Technical Glossary',
    description: 'A strictly technical glossary for blockchain terms. Definitions for ABI, Finality, MEV, Nonce, ZK-Rollups, and more.',
    openGraph: {
        title: 'Common Crypto Terms',
        description: 'Precise definitions for the web3 stack.',
        type: 'article',
    },
};

export default function CommonCryptoTerms() {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'TechArticle',
        headline: 'Common Crypto Terms',
        description: 'Technical glossary of blockchain terminology.',
        author: {
            '@type': 'Organization',
            name: 'Chain Receipt',
        },
        educationalLevel: 'Expert',
    };

    const glossary = [
        {
            term: "51% Attack",
            def: "A consensus attack where a single entity controls more than 50% of the network's hash rate (PoW) or stake (PoS). This allows them to censor transactions and double-spend coins by reorganizing the chain, but NOT to steal other people's funds or change protocol rules.",
            category: "Security"
        },
        {
            term: "ABI",
            def: "Application Binary Interface. The standard JSON format that describes how to encode and decode data to call a smart contract's functions.",
            category: "Dev"
        },
        {
            term: "Address (EOA)",
            def: "A hexadecimal identifier (e.g., `0xabc...`) derived from the public key. An Externally Owned Account (EOA) is controlled by a private key, whereas a Contract Account is code.",
            category: "Identity"
        },
        {
            term: "Blockspace",
            def: "The finite capacity of a blockchain to record data. Because blocks are produced on a fixed schedule with a gas limit, blockspace is a scarce resource that users bid for via gas fees.",
            category: "Economics"
        },
        {
            term: "Bridge",
            def: "A protocol that connects independent blockchains. Most work via 'Lock and Mint': you lock assets on Chain A, and the bridge mints a wrapped representation on Chain B.",
            category: "Scaling"
        },
        {
            term: "Bytecode",
            def: "Low-level machine code executed by the EVM. Smart contracts are written in high-level languages (Solidity) but compiled into bytecode for the network to execute.",
            category: "Dev"
        },
        {
            term: "Call vs. Transaction",
            def: "A 'Transaction' writes data to the blockchain, costs gas, and requires a signature. A 'Call' reads data from a local node, costs zero gas, and does not broadcast anything.",
            category: "Dev"
        },
        {
            term: "Calldata",
            def: "A read-only, non-persistent area where function arguments are stored during a transaction execution. Cheaper than using storage memory.",
            category: "Dev"
        },
        {
            term: "Finality",
            def: "The assurance that a block cannot be altered or reversed without burning a significant amount of economic value. In Bitcoin, finality is probabilistic. In Ethereum PoS, it is deterministic.",
            category: "Consensus"
        },
        {
            term: "Fork",
            def: "A divergence in the blockchain's protocol rules. 'Soft Forks' are backward-compatible upgrades. 'Hard Forks' are incompatible and require all nodes to upgrade.",
            category: "Consensus"
        },
        {
            term: "Gas",
            def: "The unit of computational work. 'Gas Limit' is how much work you allow. 'Gas Price' is how much you pay per unit. Total Fee = Gas Used × Gas Price.",
            category: "Economics"
        },
        {
            term: "Hash Function",
            def: "A cryptographic algorithm (like Keccak-256) that maps data of arbitrary size to a fixed-size bit string. It is deterministic and collision-resistant.",
            category: "Cryptography"
        },
        {
            term: "Mempool",
            def: "The waiting area for transactions that have been broadcast but not yet included in a block. Validators select transactions from here to build the next block.",
            category: "Network"
        },
        {
            term: "MEV",
            def: "Maximal Extractable Value. The profit a validator can make by including, excluding, or reordering transactions within a block (e.g., arbitrage, sandwich attacks).",
            category: "Economics"
        },
        {
            term: "Nonce",
            def: "A counter associated with an address. It increments with every transaction to enforce ordering and prevent replay attacks.",
            category: "Network"
        },
        {
            term: "Opcode",
            def: "Operational Code. The lowest-level instruction the EVM understands (e.g., `PUSH`, `POP`, `SSTORE`). Each opcode has a specific gas cost.",
            category: "Dev"
        },
        {
            term: "Optimistic Rollup",
            def: "A Layer 2 scaling solution that assumes transactions are valid by default. It allows a challenge period (usually 7 days) where anyone can submit a Fraud Proof to dispute invalid state.",
            category: "Scaling"
        },
        {
            term: "Oracle",
            def: "A bridge between the blockchain and the outside world. Oracles fetch off-chain data (prices, weather) and post it on-chain for smart contracts to use.",
            category: "Infra"
        },
        {
            term: "Private Key",
            def: "A 256-bit number generated from entropy. It allows you to sign transactions, mathematically proving ownership of an address without revealing the key itself.",
            category: "Cryptography"
        },
        {
            term: "Reentrancy",
            def: "A vulnerability where a malicious contract calls back into the calling contract before the first execution is finished, often draining funds if state isn't updated first.",
            category: "Security"
        },
        {
            term: "Reorg",
            def: "Chain Reorganization. When a node switches its canonical chain to a longer/heavier version received from the network. Discarded blocks become 'uncle' blocks.",
            category: "Consensus"
        },
        {
            term: "Rollup",
            def: "A scaling technology that executes transactions outside the main chain (L2) but posts transaction data to the main chain (L1), inheriting its security.",
            category: "Scaling"
        },
        {
            term: "Seed Phrase",
            def: "A human-readable representation (12-24 words) of the master entropy that generates your wallet's private keys (BIP-39 standard).",
            category: "Cryptography"
        },
        {
            term: "Signature",
            def: "A cryptographic proof produced by signing a transaction hash with a private key. It proves authorization without revealing the key.",
            category: "Cryptography"
        },
        {
            term: "Slashing",
            def: "The mechanism in Proof-of-Stake where a validator loses a portion of their staked ETH for malicious behavior, such as double-signing blocks.",
            category: "Economics"
        },
        {
            term: "Smart Contract",
            def: "Immutable code deployed to a blockchain address. It runs deterministically on the EVM according to its logic.",
            category: "Dev"
        },
        {
            term: "State Root",
            def: "The Merkle Root of the entire state (balances, storage, etc.) at a specific block height. Light clients verify this instead of downloading the full state.",
            category: "Consensus"
        },
        {
            term: "Sybil Attack",
            def: "An attack where a single adversary controls many fake identities to gain disproportionate influence. PoW (Energy) and PoS (Capital) are defenses.",
            category: "Security"
        },
        {
            term: "Zero-Knowledge Proof",
            def: "A method to prove a statement is true without revealing valid information beyond the statement itself (e.g., proving you are an adult without showing your DOB).",
            category: "Cryptography"
        },
        {
            term: "ZK Rollup",
            def: "A Layer 2 scaling solution that uses Zero-Knowledge Validity Proofs to instantly prove the correctness of off-chain computation.",
            category: "Scaling"
        }
    ];

    const sortedTerms = glossary.sort((a, b) => a.term.localeCompare(b.term));

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-sky-500/30 overflow-x-hidden">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <Navbar />

            {/* Background Gradients */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-sky-900/20 to-transparent opacity-50" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/5 blur-[120px]" />
                <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-600/5 blur-[120px]" />
            </div>

            <div className="max-w-4xl mx-auto pt-32 pb-20 px-6 relative z-10">
                <Link href="/learn" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-8 transition-colors text-sm font-medium">
                    <ArrowLeft size={16} />
                    Back to Knowledge Base
                </Link>

                <article className="prose prose-invert prose-lg max-w-none">
                    <header className="mb-16">
                        <div className="flex w-fit items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-sm font-medium mb-6">
                            <BookOpen size={14} />
                            <span>Blockchain Definitions</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-8 text-transparent bg-clip-text bg-gradient-to-b from-white to-sky-200 relative inline-block">
                            Common Crypto Terms
                            <div className="absolute top-0 right-[-20%] hidden md:block w-32 h-32 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>
                        </h1>
                        <p className="text-xl text-zinc-400 leading-relaxed max-w-2xl">
                            A strictly technical dictionary for blockchain primitives, mechanics, and economic concepts. No slang, no hype—just the engineering definitions.
                        </p>
                    </header>

                    {/* Glossary Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose mb-20">
                        {sortedTerms.map((item, i) => (
                            <div key={i} className="p-6 bg-zinc-900/50 border border-white/10 rounded-2xl hover:bg-white/5 transition-all duration-300 group hover:border-sky-500/30">
                                <div className="flex items-start justify-between mb-3">
                                    <h3 className="text-lg font-bold text-white group-hover:text-sky-300 transition-colors">
                                        {item.term}
                                    </h3>
                                    <span className="text-[10px] uppercase tracking-wider font-bold text-sky-400/80 bg-sky-500/10 px-2 py-1 rounded border border-sky-500/10 group-hover:border-sky-500/30 transition-colors">
                                        {item.category}
                                    </span>
                                </div>
                                <p className="text-zinc-400 text-sm leading-relaxed border-t border-white/5 pt-3 mt-2">
                                    {item.def}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* FAQ */}
                    <section className="mb-20">
                        <h2 className="text-3xl font-bold text-white mb-8">Frequently Asked Questions</h2>
                        <div className="space-y-4">
                            <details className="group border border-white/10 rounded-2xl bg-white/5 p-6 open:bg-white/10 transition-colors">
                                <summary className="flex cursor-pointer items-center justify-between font-bold text-white group-hover:text-sky-400 select-none">
                                    Why is "Crypto" different from "Blockchain"?
                                    <span className="text-zinc-500 group-hover:text-sky-400 transition-transform group-open:rotate-180">▼</span>
                                </summary>
                                <p className="mt-4 text-zinc-400 leading-relaxed">
                                    Technically, they are not. "Blockchain" describes the data structure. "Crypto" refers to the cryptographic primitives (signatures, hashes) and the economic assets. The industry uses them interchangeably, but "Distributed Ledger Technology" (DLT) is the most academic term for the database layer.
                                </p>
                            </details>
                            <details className="group border border-white/10 rounded-2xl bg-white/5 p-6 open:bg-white/10 transition-colors">
                                <summary className="flex cursor-pointer items-center justify-between font-bold text-white group-hover:text-sky-400 select-none">
                                    Coin vs. Token: What is the difference?
                                    <span className="text-zinc-500 group-hover:text-sky-400 transition-transform group-open:rotate-180">▼</span>
                                </summary>
                                <p className="mt-4 text-zinc-400 leading-relaxed">
                                    A <strong>Coin</strong> (BTC, ETH, SOL) is native to its own blockchain and is used to pay for gas fees. A <strong>Token</strong> (USDC, UNI, SHIB) is created on top of an existing blockchain (like Ethereum) using a smart contract standard (like ERC-20). You pay ETH to transfer USDC.
                                </p>
                            </details>
                            <details className="group border border-white/10 rounded-2xl bg-white/5 p-6 open:bg-white/10 transition-colors">
                                <summary className="flex cursor-pointer items-center justify-between font-bold text-white group-hover:text-sky-400 select-none">
                                    Where can I find the official specs?
                                    <span className="text-zinc-500 group-hover:text-sky-400 transition-transform group-open:rotate-180">▼</span>
                                </summary>
                                <p className="mt-4 text-zinc-400 leading-relaxed">
                                    The ultimate source of truth for Ethereum is the "Yellow Paper" (Specification) and the EIPs (Ethereum Improvement Proposals) repository on GitHub. For specific functions, consult the Solidity documentation or the specific project's Whitepaper.
                                </p>
                            </details>
                        </div>
                    </section>
                </article>
            </div>
        </div>
    );
}
