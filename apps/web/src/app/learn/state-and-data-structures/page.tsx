import { Metadata } from 'next';
import { Navbar } from '@/components/Navbar';
import Link from 'next/link';
import { ArrowLeft, Network, Database, FileDigit, Hash, Activity, Search, ShieldCheck, Cpu, HardDrive, Lock } from 'lucide-react';

export const metadata: Metadata = {
    title: 'State & Data Structures | Blockchain Internals',
    description: 'Deep dive into Merkle Patricia Tries, the World State, and why blockchains prioritize verification over raw performance.',
    openGraph: {
        title: 'State & Data Structures | Chain Receipt Learning',
        description: 'How Ethereum stores data: The Merkle Patricia Trie, State Roots, and the cost of verifiability.',
        type: 'article',
    },
};

export default function StateAndDataStructures() {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'TechArticle',
        headline: 'Blockchain State and Data Structures',
        description: 'Technical explanation of Merkle Trees, Patricia Tries, and the State Verification Trilemma.',
        author: {
            '@type': 'Organization',
            name: 'Chain Receipt',
        },
        educationalLevel: 'Expert',
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-cyan-500/30 overflow-x-hidden">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <Navbar />

            {/* Background Gradients */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-cyan-900/20 to-transparent opacity-50" />
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
                        <div className="flex w-fit items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium mb-6">
                            <Database size={14} />
                            <span>Protocol Internals</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-8 text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 relative inline-block">
                            State & Data Structures
                            <div className="absolute top-0 right-[-20%] hidden md:block w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
                        </h1>
                        <p className="text-xl text-zinc-400 leading-relaxed max-w-2xl">
                            Blockchains are not just distributed databases; they are <strong>verifiable state machines</strong>. To achieve this without requiring every user to store petabytes of data, we rely on the <strong>Merkle Patricia Trie</strong>.
                        </p>
                    </header>

                    {/* The Verification Problem */}
                    <section className="mb-20">
                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                            <Search className="text-cyan-400" size={24} />
                            The Root of Trust
                        </h2>
                        <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
                            <p className="text-zinc-300 mb-6">
                                In a traditional database, you query a server and <strong>trust</strong> the response. In a blockchain, you must be able to mathematically <strong>verify</strong> the response without trusting the node provider.
                            </p>
                            <p className="text-zinc-300">
                                This is solved by the <strong>State Root</strong>—a single 32-byte hash included in every block header. This hash acts as a cryptographic fingerprint of the entire global state (every account, balance, and smart contract) at that specific block height. If a single byte of data changes anywhere in the world state, the State Root changes completely.
                            </p>
                        </div>
                    </section>

                    {/* Merkle Trees */}
                    <section className="mb-20">
                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                            <Network className="text-green-400" size={24} />
                            The Merkle Tree
                        </h2>
                        <p className="text-zinc-300 mb-8">
                            A Merkle Tree is a binary tree where every leaf node is the hash of a data block, and every non-leaf node is the hash of its children. This structure provides two critical properties for blockchains:
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                            <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
                                <h3 className="font-bold text-white mb-4">The Avalanche Effect</h3>
                                <p className="text-zinc-400 text-sm">
                                    A mutation in leaf `A` changes `Hash(A)`, which changes its parent `Hash(A+B)`, propagating upwards to change the Root Hash. This makes the state <strong>tamper-evident</strong>.
                                </p>
                            </div>
                            <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
                                <h3 className="font-bold text-white mb-4">O(log n) Verification</h3>
                                <p className="text-zinc-400 text-sm">
                                    To prove a specific transaction exists, you do not need the entire tree. You only need the <strong>Merkle Branch</strong>—the path of hashes from the leaf to the root.
                                </p>
                                <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-200 text-xs font-mono">
                                    Proof size is logarithmic: ~1KB proof for TBs of data.
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* The Patricia Trie */}
                    <section className="mb-20">
                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                            <Activity className="text-purple-400" size={24} />
                            The Merkle Patricia Trie
                        </h2>
                        <p className="text-zinc-300 mb-6">
                            Standard Merkle trees are inefficient for state storage because they require re-hashing the entire path for every update. Furthermore, they are essentially lists, but a Key-Value store (Address &gt; Account) requires a Map.
                        </p>
                        <p className="text-zinc-300 mb-8">
                            Ethereum uses a <strong>Modified Merkle Patricia Trie</strong>. It combines:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-zinc-400 mb-8">
                            <li><strong>Radix Trie:</strong> Optimization for spatial efficiency. Keys sharing a prefix share the same path (e.g., `0xa1b...` and `0xa1c...` share `0xa1`).</li>
                            <li><strong>Merkle Tree:</strong> Cryptographic integrity. Each node is referenced by its hash.</li>
                        </ul>
                        <p className="text-zinc-300">
                            The "Path" you traverse down the tree is the <strong>Key</strong> itself (the hashed address). This gives us deterministic, fast lookups with cryptographic proofs.
                        </p>
                    </section>

                    {/* Anatomy of World State */}
                    <section className="mb-20">
                        <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden p-8">
                            <h3 className="text-lg font-bold text-white mb-6">Anatomy of an Account</h3>
                            <p className="text-zinc-400 mb-8">
                                The "World State" is a mapping of `Address &gt; Account`. An Ethereum Account is not a single number; it is a data structure with four fields:
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 bg-zinc-900 border border-white/5 rounded-lg flex items-start gap-3">
                                    <div className="mt-1 p-1 bg-blue-500/20 rounded text-blue-400"><Hash size={16} /></div>
                                    <div>
                                        <div className="text-white font-mono text-sm">Nonce</div>
                                        <div className="text-zinc-500 text-xs mt-1">Transaction counter. Critical for preventing replay attacks and ordering transactions.</div>
                                    </div>
                                </div>
                                <div className="p-4 bg-zinc-900 border border-white/5 rounded-lg flex items-start gap-3">
                                    <div className="mt-1 p-1 bg-green-500/20 rounded text-green-400"><FileDigit size={16} /></div>
                                    <div>
                                        <div className="text-white font-mono text-sm">Balance</div>
                                        <div className="text-zinc-500 text-xs mt-1">The account's holding in Wei (1 ETH = 10^18 Wei).</div>
                                    </div>
                                </div>
                                <div className="p-4 bg-zinc-900 border border-white/5 rounded-lg flex items-start gap-3">
                                    <div className="mt-1 p-1 bg-purple-500/20 rounded text-purple-400"><Database size={16} /></div>
                                    <div>
                                        <div className="text-white font-mono text-sm">StorageRoot</div>
                                        <div className="text-zinc-500 text-xs mt-1">The root hash of <em>another</em> Merkle Patricia Trie that holds this contract's persistent data.</div>
                                    </div>
                                </div>
                                <div className="p-4 bg-zinc-900 border border-white/5 rounded-lg flex items-start gap-3">
                                    <div className="mt-1 p-1 bg-yellow-500/20 rounded text-yellow-400"><ShieldCheck size={16} /></div>
                                    <div>
                                        <div className="text-white font-mono text-sm">CodeHash</div>
                                        <div className="text-zinc-500 text-xs mt-1">The hash of the compiled EVM bytecode. This makes contracts immutable.</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* The Trilemma */}
                    <section className="mb-20">
                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                            <Lock className="text-orange-400" size={24} />
                            The Data Structure Trilemma
                        </h2>
                        <p className="text-zinc-300 mb-8">
                            Why use such a complex structure instead of a fast SQL database? It comes down to a fundamental trade-off. Blockchains sacrifice raw performance for properties that centralized databases don't need:
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="p-6 bg-white/5 border border-white/10 rounded-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-3 opacity-10"><Cpu size={48} /></div>
                                <h4 className="font-bold text-white mb-2">Performance</h4>
                                <p className="text-zinc-400 text-sm">
                                    <strong>Low.</strong> Every read/write requires traversing multiple nodes (hashes), often resulting in many random disk I/O operations. This is why syncing a node is slow.
                                </p>
                            </div>
                            <div className="p-6 bg-white/5 border border-white/10 rounded-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-3 opacity-10"><HardDrive size={48} /></div>
                                <h4 className="font-bold text-white mb-2">Storage Overhead</h4>
                                <p className="text-zinc-400 text-sm">
                                    <strong>High.</strong> We store not just the data, but the hashes of the data, the hashes of the branches, and the historical versions of the state (to handle reorgs).
                                </p>
                            </div>
                            <div className="p-6 bg-gradient-to-br from-green-900/20 to-green-800/20 border border-green-500/30 rounded-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-3 opacity-10"><ShieldCheck size={48} /></div>
                                <h4 className="font-bold text-green-200 mb-2">Verifiability</h4>
                                <p className="text-green-100/70 text-sm">
                                    <strong>Perfect.</strong> This is the winning trait. It allows a Light Client (like a mobile wallet) to verify a balance with 100% cryptographic certainty without running a full node.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* FAQ */}
                    <section className="mb-20">
                        <h2 className="text-3xl font-bold text-white mb-8">Frequently Asked Questions</h2>
                        <div className="space-y-4">
                            <details className="group border border-white/10 rounded-2xl bg-white/5 p-6 open:bg-white/10 transition-colors">
                                <summary className="flex cursor-pointer items-center justify-between font-bold text-white group-hover:text-cyan-400 select-none">
                                    Why not just use a standard database like SQL?
                                    <span className="text-zinc-500 group-hover:text-cyan-400 transition-transform group-open:rotate-180">▼</span>
                                </summary>
                                <p className="mt-4 text-zinc-400 leading-relaxed">
                                    SQL databases are optimized for speed and flexible queries, but they are centralized. You must trust the administrator not to alter data. Blockchains use Merkle Tries to prioritize <strong>verifiability</strong>. We sacrifice speed to ensure that any user can mathematically prove the state is correct without trusting a central authority.
                                </p>
                            </details>
                            <details className="group border border-white/10 rounded-2xl bg-white/5 p-6 open:bg-white/10 transition-colors">
                                <summary className="flex cursor-pointer items-center justify-between font-bold text-white group-hover:text-cyan-400 select-none">
                                    What happens if the State Root is invalid?
                                    <span className="text-zinc-500 group-hover:text-cyan-400 transition-transform group-open:rotate-180">▼</span>
                                </summary>
                                <p className="mt-4 text-zinc-400 leading-relaxed">
                                    If a block contains a transaction that results in a State Root that doesn't match what the validator proposed, the entire network rejects the block. This is how consensus works—nodes verify the math, and if the "fingerprint" is wrong, the block is discarded immediately.
                                </p>
                            </details>
                            <details className="group border border-white/10 rounded-2xl bg-white/5 p-6 open:bg-white/10 transition-colors">
                                <summary className="flex cursor-pointer items-center justify-between font-bold text-white group-hover:text-cyan-400 select-none">
                                    Can't I just download the whole blockchain?
                                    <span className="text-zinc-500 group-hover:text-cyan-400 transition-transform group-open:rotate-180">▼</span>
                                </summary>
                                <p className="mt-4 text-zinc-400 leading-relaxed">
                                    You can (it's called an Archive Node), but it is over 1TB of data. Most users don't have the disk space or bandwidth. State Roots allow us to run "Light Clients" that only download the headers (kilobytes) while still verifying the data they care about.
                                </p>
                            </details>
                        </div>
                    </section>
                </article>
            </div>
        </div>
    );
}
