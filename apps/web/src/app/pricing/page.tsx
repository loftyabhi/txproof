'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Check, X } from 'lucide-react';
import { Navbar } from '../../components/Navbar';

interface Plan {
    id: string;
    title: string;
    priceWei: string;
    validitySeconds: number;
    hasAds: boolean;
    canDownloadPdf: boolean;
}

export default function PricingPage() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get('http://localhost:3001/api/v1/plans')
            .then(res => {
                setPlans(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100">
            <Navbar />

            <main className="max-w-7xl mx-auto px-6 py-20">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
                        Simple, Transparent Pricing
                    </h1>
                    <p className="text-xl text-slate-500 max-w-2xl mx-auto">
                        Choose the plan that fits your needs. No hidden fees.
                    </p>
                </div>

                {loading ? (
                    <div className="text-center py-20">Loading plans...</div>
                ) : (
                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {plans.length === 0 && (
                            <div className="col-span-3 text-center text-gray-500">
                                No plans active at the moment. Check back later!
                            </div>
                        )}

                        {plans.map((plan) => (
                            <div key={plan.id} className="relative bg-white rounded-2xl shadow-xl border border-slate-200 p-8 hover:-translate-y-1 transition-transform duration-300 flex flex-col">
                                <div className="mb-4">
                                    <h3 className="text-xl font-bold text-slate-900 mb-2">{plan.title}</h3>
                                    <div className="text-4xl font-extrabold text-blue-600">
                                        {plan.priceWei === '0' ? 'Free' : `${(Number(plan.priceWei) / 1e18).toFixed(4)} ETH`}
                                    </div>
                                    <div className="text-sm text-slate-400 mt-1">
                                        per {plan.validitySeconds / 86400} days
                                    </div>
                                </div>
                                <hr className="border-slate-100 my-6" />
                                <ul className="space-y-4 mb-8 flex-grow">
                                    <li className="flex items-center gap-3">
                                        {plan.canDownloadPdf ? <Check className="text-green-500" size={20} /> : <X className="text-red-400" size={20} />}
                                        <span className="text-slate-600">PDF Downloads</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        {!plan.hasAds ? <Check className="text-green-500" size={20} /> : <X className="text-red-400" size={20} />}
                                        <span className="text-slate-600">Ad-Free Experience</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <Check className="text-green-500" size={20} />
                                        <span className="text-slate-600">24/7 Support</span>
                                    </li>
                                </ul>
                                <button className="w-full py-3 px-6 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors shadow-lg shadow-blue-200">
                                    Choose {plan.title}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
