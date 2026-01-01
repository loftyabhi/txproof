import Link from 'next/link';
import { Github, Twitter, MessageCircle } from 'lucide-react';

export function Footer() {
    return (
        <footer className="border-t border-white/10 bg-black/20 backdrop-blur-xl mt-auto">
            <div className="mx-auto max-w-7xl px-6 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-white">Chain Receipt</h3>
                        <p className="text-sm text-gray-400">
                            Professional blockchain transaction receipts for modern needs.
                        </p>
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Product</h4>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors">
                                    Home
                                </Link>
                            </li>
                            <li>
                                <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors">
                                    Dashboard
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Legal</h4>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/privacy-policy" className="text-sm text-gray-400 hover:text-white transition-colors">
                                    Privacy Policy
                                </Link>
                            </li>
                            <li>
                                <Link href="/terms-of-service" className="text-sm text-gray-400 hover:text-white transition-colors">
                                    Terms of Service
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Support</h4>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/contact-us" className="text-sm text-gray-400 hover:text-white transition-colors">
                                    Contact Us
                                </Link>
                            </li>
                            <li>
                                <Link href="/about-us" className="text-sm text-gray-400 hover:text-white transition-colors">
                                    About Us
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-gray-500">
                        &copy; {new Date().getFullYear()} Chain Receipt. All rights reserved.
                    </p>
                    <div className="flex items-center gap-4">
                        <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                            <Github size={20} />
                        </Link>
                        <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                            <Twitter size={20} />
                        </Link>
                        <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                            <MessageCircle size={20} />
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
