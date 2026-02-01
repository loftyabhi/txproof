import { Metadata } from 'next';
import { Navbar } from '@/components/Navbar';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
    title: 'What is the EVM? | Ethereum Virtual Machine Explained',
    description: 'Technical explanation of the Ethereum Virtual Machine (EVM), gas mechanics, and how smart contracts are executed.',
    openGraph: {
        title: 'EVM Architecture | TxProof Learning',
        description: 'Understand the world computer: Stack, Memory, and Storage.',
        type: 'article',
    },
};

export default function EthereumAndEVM() {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'TechArticle',
        headline: 'Ethereum and the EVM Explained',
        description: 'Deep dive into the Ethereum Virtual Machine architecture.',
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
                        Ethereum & The EVM
                        <div className="absolute top-0 right-[-20%] hidden md:block w-32 h-32 bg-violet-500/10 rounded-full blur-3xl pointer-events-none"></div>
                    </h1>

                    <div className="text-xl text-zinc-400 leading-relaxed mb-16 font-light">
                        Bitcoin proved that value could be decentralized. Ethereum extended this to <strong>computation</strong>. The Ethereum Virtual Machine (EVM) is the distributed computing environment where all smart contracts live and execute.
                    </div>

                    <div className="space-y-24">
                        {/* Section 1: The World Computer */}
                        <section>
                            <h2 className="text-3xl font-bold text-white mb-8">1. The World Computer</h2>
                            <p className="text-zinc-400 mb-8 leading-relaxed">
                                The EVM is often described as a "World Computer." It is a quasi-Turing-complete state machine that exists on thousands of nodes simultaneously. "Quasi" is a critical distinction: unlike your laptop, EVM execution is bounded by <strong>Gas</strong> to prevent infinite loops (The Halting Problem).
                            </p>
                            <div className="p-8 rounded-3xl bg-zinc-900/50 border border-white/10 backdrop-blur-sm relative overflow-hidden">
                                <h3 className="text-2xl font-bold text-white mb-4">The State Transition Function</h3>
                                <p className="text-zinc-400 mb-6 font-mono text-sm leading-relaxed">
                                    Y(S, T) = S'
                                </p>
                                <p className="text-zinc-300">
                                    Given an existing State (S) and a new Transaction (T), the Ethereum State Transition Function (Y) produces a new State (S'). This transition is deterministic; every node in the world must agree on the exact result S'.
                                </p>
                            </div>
                        </section>

                        {/* Section 2: Architecture */}
                        <section>
                            <h2 className="text-3xl font-bold text-white mb-8">2. EVM Architecture: Data Locations</h2>
                            <p className="text-zinc-400 mb-8 max-w-2xl">
                                When a smart contract executes, it has access to three distinct types of data storage. Understanding the cost difference between them is vital for optimization.
                            </p>

                            <div className="grid md:grid-cols-3 gap-6">
                                <div className="p-6 bg-zinc-900/50 border border-white/10 rounded-2xl backdrop-blur-sm flex flex-col">
                                    <h4 className="text-violet-300 font-bold mb-2">Stack</h4>
                                    <div className="text-xs font-mono text-zinc-500 mb-4 px-2 py-1 bg-zinc-950 rounded w-fit">Volatile (Cheap)</div>
                                    <p className="text-zinc-400 text-sm flex-1">
                                        Last-in, First-out (LIFO) container for up to 1024 256-bit values. Most opcodes (ADD, SUB) work directly here. It is wiped after execution.
                                    </p>
                                </div>
                                <div className="p-6 bg-zinc-900/50 border border-white/10 rounded-2xl backdrop-blur-sm flex flex-col">
                                    <h4 className="text-violet-300 font-bold mb-2">Memory</h4>
                                    <div className="text-xs font-mono text-zinc-500 mb-4 px-2 py-1 bg-zinc-950 rounded w-fit">Volatile (Expensive)</div>
                                    <p className="text-zinc-400 text-sm flex-1">
                                        Linear, expandable byte array. Used for complex structures like strings or arrays during execution. It scales quadratically in cost and is wiped after execution.
                                    </p>
                                </div>
                                <div className="p-6 bg-zinc-900/50 border border-white/10 rounded-2xl backdrop-blur-sm flex flex-col">
                                    <h4 className="text-violet-300 font-bold mb-2">Storage</h4>
                                    <div className="text-xs font-mono text-zinc-500 mb-4 px-2 py-1 bg-zinc-950 rounded w-fit">Permanent (Very Expensive)</div>
                                    <p className="text-zinc-400 text-sm flex-1">
                                        A massive Merkle-Patricia Trie that persists on the blockchain. Writing here (SSTORE) is the most expensive operation (20k+ gas) because every node must store it forever.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Section 3: Bytecode & Opcodes */}
                        <section>
                            <h2 className="text-3xl font-bold text-white mb-8">3. From Code to Machine</h2>
                            <div className="flex flex-col md:flex-row gap-8 items-center">
                                <div className="flex-1 space-y-4">
                                    <p className="text-zinc-400">
                                        The EVM does not understand Solidity. It understands <strong>Bytecode</strong>.
                                    </p>
                                    <p className="text-zinc-400">
                                        When you compile a contract, it turns into a string of hex bytes (e.g., <code>0x60806040...</code>). During execution, the EVM reads these bytes one by one as <strong>Opcodes</strong>.
                                    </p>
                                    <ul className="space-y-2 text-sm text-zinc-500 font-mono">
                                        <li className="flex gap-4"><span className="text-white w-12">0x60</span> PUSH1 (Place value on stack)</li>
                                        <li className="flex gap-4"><span className="text-white w-12">0x01</span> ADD (Add top two stack items)</li>
                                        <li className="flex gap-4"><span className="text-white w-12">0x55</span> SSTORE (Save to permanent storage)</li>
                                    </ul>
                                </div>
                                <div className="flex-1 p-6 bg-black rounded-xl border border-white/10 font-mono text-xs text-green-400 overflow-x-auto whitespace-pre">
                                    {`// Solidity
uint a = 1;
uint b = 2;
uint c = a + b;

// EVM Assembly (Conceptual)
PUSH1 0x01
PUSH1 0x02
ADD
// Result (0x03) is now on Application Stack`}
                                </div>
                            </div>
                        </section>

                        {/* Section 4: Gas Mechanics */}
                        <section>
                            <h2 className="text-3xl font-bold text-white mb-8">4. Why Gas Exists</h2>
                            <p className="text-zinc-400 mb-8">
                                Gas is not just a fee; it is a unit of computational effort. It decouples the market price of ETH from the cost of computing.
                            </p>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="p-6 border border-red-500/20 bg-red-900/5 rounded-2xl">
                                    <h4 className="text-red-200 font-bold mb-2">The Infinite Loop Risk</h4>
                                    <p className="text-zinc-400 text-sm">
                                        Without gas, a malicious user could deploy a contract that loops forever <code>while(true) {'{}'}</code>. If validators ran this, the entire network would freeze.
                                    </p>
                                </div>
                                <div className="p-6 border border-green-500/20 bg-green-900/5 rounded-2xl">
                                    <h4 className="text-green-200 font-bold mb-2">The Solution</h4>
                                    <p className="text-zinc-400 text-sm">
                                        Every instruction implies a cost. The sender prepays a "Gas Limit." The EVM deducts gas as it runs opcodes. If the counter hits zero, <strong className="text-white">Out of Gas</strong> triggers, and the transaction reverts immediately.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Section 5: Ecosystem */}
                        <section>
                            <h2 className="text-3xl font-bold text-white mb-8">5. EVM Compatibility</h2>
                            <p className="text-zinc-400 mb-6 font-light">
                                The EVM standard has become the de-facto operating system of Web3. "EVM Equivalence" means a chain can run Ethereum smart contracts without modification.
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {['Ethereum', 'Optimism', 'Arbitrum', 'Polygon', 'Base', 'BSC', 'Avalanche C-Chain', 'Gnosis'].map((chain) => (
                                    <div key={chain} className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-center text-zinc-300 text-sm font-medium">
                                        {chain}
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* FAQ */}
                        <section>
                            <h2 className="text-3xl font-bold text-white mb-8">Common Questions</h2>
                            <div className="space-y-4">
                                {[
                                    {
                                        q: "Do I compile to machine code?",
                                        a: "No. You compile to Bytecode. The EVM interprets this bytecode. It acts as a virtualization layer between your smart contract and the actual server hardware."
                                    },
                                    {
                                        q: "Can smart contracts call each other?",
                                        a: "Yes. This is called a 'Message Call'. Contract A can call Contract B. However, Contract A must pay the gas for Contract B's execution."
                                    },
                                    {
                                        q: "Where is the state stored?",
                                        a: "The 'World State' is stored in a Merkle-Patricia Trie structure. The root hash of this trie is included in every block header, ensuring cryptographic proof of the entire network's data integrity."
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
