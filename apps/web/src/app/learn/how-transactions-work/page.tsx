import { Metadata } from 'next';
import { Navbar } from '@/components/Navbar';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
    title: 'How Crypto Transactions Work | Technical Lifecycle',
    description: 'The complete lifecycle of a blockchain transaction: Signing, Mempool, Inclusion, and Finality. Learn what actually happens when you click send.',
    openGraph: {
        title: 'Transaction Lifecycle Explained | Chain Receipt',
        description: 'From Mempool to Block: The mechanics of value transfer.',
        type: 'article',
    },
};

export default function HowTransactionsWork() {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'TechArticle',
        headline: 'How Blockchain Transactions Work',
        description: 'Technical breakdown of the transaction lifecycle.',
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
                        How Transactions Work
                        <div className="absolute top-0 right-[-20%] hidden md:block w-32 h-32 bg-violet-500/10 rounded-full blur-3xl pointer-events-none"></div>
                    </h1>

                    <div className="text-xl text-zinc-400 leading-relaxed mb-16 font-light">
                        To the end user, a blockchain transaction is a simple "Send" button. To the engineer, it is a signed authorization propagating through a hostile network, competing for scarce block space, and ultimately altering the global state of a distributed machine.
                    </div>

                    <div className="space-y-24">
                        {/* Section 1: The Transaction Object */}
                        <section>
                            <h2 className="text-3xl font-bold text-white mb-8">1. The Digital Envelope</h2>
                            <p className="text-zinc-400 mb-8 leading-relaxed">
                                Before a transaction ever touches the network, it must be constructed. Think of this as filling out a cheque or a command packet. In the EVM architecture, this packet contains specific, non-negotiable fields.
                            </p>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/10 backdrop-blur-sm">
                                    <h4 className="text-violet-300 font-mono text-sm mb-2">NONCE</h4>
                                    <p className="text-zinc-400 text-sm">
                                        An ordered counter (0, 1, 2...) specific to the sender. This prevents replay attacks. You cannot submit transaction #5 before transaction #4 is confirmed.
                                    </p>
                                </div>
                                <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/10 backdrop-blur-sm">
                                    <h4 className="text-violet-300 font-mono text-sm mb-2">GAS LIMIT & PRICE</h4>
                                    <p className="text-zinc-400 text-sm">
                                        The fuel budget. <strong>Limit</strong> is the maximum computational work you allow; <strong>Price</strong> (or Priority Fee) is the bribe you pay per unit of work to be included.
                                    </p>
                                </div>
                                <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/10 backdrop-blur-sm">
                                    <h4 className="text-violet-300 font-mono text-sm mb-2">TO & VALUE</h4>
                                    <p className="text-zinc-400 text-sm">
                                        The destination address and the amount of native currency (ETH/BNB/MATIC) to transfer. For contract interactions, 'Value' is often 0.
                                    </p>
                                </div>
                                <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/10 backdrop-blur-sm">
                                    <h4 className="text-violet-300 font-mono text-sm mb-2">DATA (CALLDATA)</h4>
                                    <p className="text-zinc-400 text-sm">
                                        The instruction payload. If you are swapping tokens, this field contains the method ID for <code>swap()</code> and the encoded parameters.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Section 2: Signing & Propagation */}
                        <section>
                            <h2 className="text-3xl font-bold text-white mb-8">2. Signing and Propagation</h2>
                            <div className="prose prose-invert max-w-none text-zinc-400">
                                <p>
                                    Once the packet is constructed, it must be signed. This uses your <strong>Private Key</strong> to generate a cryptographic signature (v, r, s). This is the "Zero-Trust" element: the network doesn't need to know who you are, only that you hold the keys to this specific address.
                                </p>
                                <p>
                                    <strong>Crucially, signing happens offline.</strong> Your private key never leaves your device.
                                </p>
                                <p>
                                    After signing, your wallet broadcasts this raw hex string to a node (via RPC providers like Infura or Alchemy). This node acts as your gateway to the peer-to-peer network.
                                </p>
                            </div>
                        </section>

                        {/* Section 3: The Mempool */}
                        <section>
                            <div className="relative p-8 rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-b from-zinc-900 to-black">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-violet-500 to-transparent opacity-50"></div>
                                <h2 className="text-2xl font-bold text-white mb-6">3. The Mempool (Dark Forest)</h2>
                                <p className="text-zinc-400 leading-relaxed mb-6">
                                    The "Memory Pool" is the waiting room for unconfirmed transactions. It is not a single central queue but a distributed buffer on every node.
                                </p>
                                <div className="flex gap-4 items-start mb-6">
                                    <div className="shrink-0 w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500 font-bold">!</div>
                                    <p className="text-zinc-400 text-sm">
                                        <strong>The Auction Mechanism:</strong> Block space is finite. Validators (or builders) select transactions from the mempool based on profit. They will almost always pick the transactions paying the highest "Priority Fee."
                                    </p>
                                </div>
                                <p className="text-zinc-500 text-sm italic">
                                    Note: Sophisticated bots also monitor the mempool to "front-run" profitable trades, a phenomenon known as MEV (Maximal Extractable Value).
                                </p>
                            </div>
                        </section>

                        {/* Section 4: Execution & Consensus */}
                        <section>
                            <h2 className="text-3xl font-bold text-white mb-8">4. Execution and Consensus</h2>
                            <p className="text-zinc-400 mb-8 max-w-2xl">
                                A validator selects your transaction, packages it into a block, and executes it. This is where the state change actually occurs.
                            </p>

                            <div className="space-y-6">
                                <div className="flex flex-col md:flex-row gap-6 p-6 rounded-2xl bg-white/5 border border-white/10 items-center">
                                    <div className="w-16 h-16 rounded-xl bg-violet-500/20 flex items-center justify-center shrink-0 text-violet-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                                    </div>
                                    <div>
                                        <h4 className="text-white font-bold text-lg mb-2">State Transition</h4>
                                        <p className="text-zinc-400 text-sm">
                                            The EVM subtracts the gas fee from your balance, increments your nonce, and runs the code in the "Data" field. If the code triggers internal transfers (e.g. sending tokens), those happen sequentially.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-col md:flex-row gap-6 p-6 rounded-2xl bg-white/5 border border-white/10 items-center">
                                    <div className="w-16 h-16 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0 text-emerald-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                    </div>
                                    <div>
                                        <h4 className="text-white font-bold text-lg mb-2">The Receipt</h4>
                                        <p className="text-zinc-400 text-sm">
                                            The outcome is recorded in a "Transaction Receipt." This confirms success (Status 1) or failure (Status 0). Importantly, <strong>even failed transactions pay gas</strong> because the network still did the computational work to determine it would fail.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Section 5: Finality */}
                        <section>
                            <h2 className="text-3xl font-bold text-white mb-8">5. Finality</h2>
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="prose prose-invert text-zinc-400">
                                    <p>
                                        Just because a transaction is in a block does not mean it is permanent immediately. In many chains (like Bitcoin), a block can be "orphaned" if two miners find blocks simultaneously.
                                    </p>
                                    <p>
                                        <strong>Probabilistic Finality:</strong> The deeper the block gets buried (more confirmations), the safer it is. This is why exchanges wait for 6-12 confirmations.
                                    </p>
                                </div>
                                <div className="p-6 bg-blue-900/10 border border-blue-500/20 rounded-2xl">
                                    <h4 className="text-blue-200 font-bold mb-3">Deterministic Finality</h4>
                                    <p className="text-zinc-400 text-sm leading-relaxed">
                                        Modern chains like Ethereum (post-Merge) uses "Gadget-based" finality. After roughly 12-15 minutes (2 epochs), a block is marked "Finalized." Reverting it would require burning at least 33% of the total staked ETH—an economic impossibility for most attackers.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* FAQ */}
                        <section>
                            <h2 className="text-3xl font-bold text-white mb-8">Common Questions</h2>
                            <div className="space-y-4">
                                {[
                                    {
                                        q: "Why is my transaction 'stuck'?",
                                        a: "Likely because your gas price is too low. Validators are ignoring your low bid in favor of more profitable transactions. You can 'unstuck' it by sending a replacement transaction with the same Nonce and higher gas."
                                    },
                                    {
                                        q: "Where do the fees go?",
                                        a: "In Ethereum (EIP-1559), the 'Base Fee' is burned (destroyed forever), reducing supply. The 'Priority Fee' (tip) goes directly to the validator as profit."
                                    },
                                    {
                                        q: "Can I reverse a transaction?",
                                        a: "No. Once confirmed on-chain, the state change is immutable. There is no 'admin' to revert the database."
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
