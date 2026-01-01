import { Navbar } from '@/components/Navbar';
import Link from 'next/link';
import { FileText, Receipt, ShieldCheck, Zap, Github, Twitter, Linkedin } from 'lucide-react';

export default function AboutUs() {
    return (
        <main className="min-h-screen bg-neutral-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]">
            <Navbar />

            {/* Main Content Area */}
            <div className="mx-auto max-w-7xl px-6 py-24">

                {/* Header Section */}
                <div className="text-center mb-16 max-w-3xl mx-auto">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">About Chain Receipt</h1>
                    <p className="text-gray-400 text-lg leading-relaxed">
                        Bridging the gap between on-chain transactions and real-world accounting. We generate professional, verifiable receipts for your crypto activity.
                    </p>
                </div>

                {/* Mission & Vision */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
                        <h2 className="text-2xl font-bold text-white mb-4">Our Mission</h2>
                        <p className="text-gray-400 leading-relaxed">
                            To bring clarity and transparency to blockchain finance. We aim to provide a standard for Web3 record-keeping, making it easy for users to justify expenses, track payments, and manage their taxes.
                        </p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
                        <h2 className="text-2xl font-bold text-white mb-4">Our Vision</h2>
                        <p className="text-gray-400 leading-relaxed">
                            We envision a future where every blockchain transaction comes with a verifiable proof of payment, seamlessly integrating decentralized finance with traditional accounting systems.
                        </p>
                    </div>
                </div>

                {/* What We Offer Section */}
                <div className="mb-20 text-center">
                    <h2 className="text-3xl font-bold text-white mb-10">What We Offer</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors flex flex-col items-center">
                            <Receipt className="w-10 h-10 text-violet-500 mb-4" />
                            <h3 className="text-white font-semibold text-lg mb-2">Instant Receipts</h3>
                            <p className="text-gray-400 text-sm">Generate PDF receipts for any transaction hash instantly.</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors flex flex-col items-center">
                            <FileText className="w-10 h-10 text-violet-500 mb-4" />
                            <h3 className="text-white font-semibold text-lg mb-2">Detailed History</h3>
                            <p className="text-gray-400 text-sm">Track your entire transaction history with ease.</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors flex flex-col items-center">
                            <ShieldCheck className="w-10 h-10 text-violet-500 mb-4" />
                            <h3 className="text-white font-semibold text-lg mb-2">Verifiable Data</h3>
                            <p className="text-gray-400 text-sm">All data is fetched directly from the blockchain for 100% accuracy.</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors flex flex-col items-center">
                            <Zap className="w-10 h-10 text-violet-500 mb-4" />
                            <h3 className="text-white font-semibold text-lg mb-2">Multi-Chain Support</h3>
                            <p className="text-gray-400 text-sm">Support for Ethereum, Polygon, BSC, and more.</p>
                        </div>
                    </div>
                </div>

                {/* Meet the Developer Section */}
                <div className="max-w-3xl mx-auto w-full text-center border-t border-white/10 pt-12">
                    <h2 className="text-3xl font-bold text-white mb-6">Meet the Developer</h2>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
                        <p className="text-gray-400 text-lg mb-4">
                            Chain Receipt is built and maintained by <span className="text-white font-semibold">loftyabhi</span>.
                        </p>
                        <p className="text-gray-500 mb-8 max-w-xl mx-auto">
                            A solo developer dedicated to building essential Web3 tools that empower users to take control of their financial data.
                        </p>

                        {/* Social Links */}
                        <div className="flex justify-center gap-6">
                            <Link
                                href="https://github.com/loftyabhi"
                                target="_blank"
                                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
                            >
                                <div className="p-2 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
                                    <Github size={20} />
                                </div>
                                <span className="text-sm font-medium">Github</span>
                            </Link>

                            <Link
                                href="https://twitter.com/loftyabhi"
                                target="_blank"
                                className="flex items-center gap-2 text-gray-400 hover:text-blue-400 transition-colors group"
                            >
                                <div className="p-2 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
                                    <Twitter size={20} />
                                </div>
                                <span className="text-sm font-medium">X (Twitter)</span>
                            </Link>

                            <Link
                                href="https://linkedin.com/in/loftyabhi"
                                target="_blank"
                                className="flex items-center gap-2 text-gray-400 hover:text-blue-600 transition-colors group"
                            >
                                <div className="p-2 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
                                    <Linkedin size={20} />
                                </div>
                                <span className="text-sm font-medium">LinkedIn</span>
                            </Link>
                        </div>
                    </div>
                </div>

            </div>
        </main>
    );
}
