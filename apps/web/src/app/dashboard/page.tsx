'use client';

import { useState, useEffect } from 'react';
import { AdminLogin } from '../../components/AdminLogin';
import axios from 'axios';
import { Trash2, Plus, ExternalLink, Activity } from 'lucide-react';

export default function DashboardPage() {
    const [token, setToken] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'plans' | 'ads'>('plans');

    // Data State
    const [plans, setPlans] = useState<any[]>([]);
    const [ads, setAds] = useState<any[]>([]);

    // Form State
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formData, setFormData] = useState<any>({});

    useEffect(() => {
        const storedToken = localStorage.getItem('admin_token');
        if (storedToken) setToken(storedToken);
    }, []);

    useEffect(() => {
        if (token) {
            fetchData();
        }
    }, [token, activeTab]);

    const fetchData = async () => {
        try {
            const endpoint = activeTab === 'plans' ? 'http://localhost:3001/api/v1/admin/plans' : 'http://localhost:3001/api/v1/admin/ads';
            const res = await axios.get(endpoint, { headers: { Authorization: `Bearer ${token}` } });
            if (activeTab === 'plans') setPlans(res.data);
            else setAds(res.data);
        } catch (err) {
            console.error(err);
            if ((err as any).response?.status === 401) {
                setToken(null);
                localStorage.removeItem('admin_token');
            }
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure?')) return;
        try {
            await axios.delete(`http://localhost:3001/api/v1/admin/${activeTab}/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchData();
        } catch (err) {
            alert('Delete failed');
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Basic ID generation for MVP if not present
            const payload = { ...formData, id: formData.id || Date.now().toString() };

            await axios.post(`http://localhost:3001/api/v1/admin/${activeTab}`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setIsFormOpen(false);
            setFormData({});
            fetchData();
        } catch (err) {
            alert('Save failed');
        }
    };

    if (!token) {
        return <AdminLogin onLogin={setToken} />;
    }

    return (
        <div className="min-h-screen pt-24 pb-12 px-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">Dashboard</h1>
                    <p className="text-gray-400">Manage your receipt system configuration</p>
                </div>
                <button
                    onClick={() => { setToken(null); localStorage.removeItem('admin_token'); }}
                    className="text-sm text-red-400 hover:text-red-300"
                >
                    Logout
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-8 border-b border-white/10">
                <button
                    onClick={() => setActiveTab('plans')}
                    className={`pb-4 px-2 text-sm font-medium transition-colors ${activeTab === 'plans' ? 'text-violet-400 border-b-2 border-violet-500' : 'text-gray-400 hover:text-white'}`}
                >
                    Subscription Plans
                </button>
                <button
                    onClick={() => setActiveTab('ads')}
                    className={`pb-4 px-2 text-sm font-medium transition-colors ${activeTab === 'ads' ? 'text-violet-400 border-b-2 border-violet-500' : 'text-gray-400 hover:text-white'}`}
                >
                    Ad Profiles
                </button>
            </div>

            {/* Actions */}
            <div className="flex justify-end mb-6">
                <button
                    onClick={() => { setFormData({}); setIsFormOpen(true); }}
                    className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                    <Plus size={16} />
                    Add {activeTab === 'plans' ? 'Plan' : 'Ad'}
                </button>
            </div>

            {/* List */}
            <div className="grid gap-4">
                {(activeTab === 'plans' ? plans : ads).map((item) => (
                    <div key={item.id} className="bg-white/5 border border-white/10 p-4 rounded-xl flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-white">{item.title || item.id}</h3>
                            <div className="text-xs text-gray-500 font-mono mt-1">
                                {activeTab === 'plans'
                                    ? `${item.priceWei} WEI • ${item.validitySeconds}s`
                                    : (
                                        <span className="flex gap-2">
                                            <span className={item.isActive ? 'text-green-400' : 'text-red-400'}>{item.isActive ? 'Active' : 'Inactive'}</span>
                                            <span className="text-blue-400">[{item.placement || 'both'}]</span>
                                        </span>
                                    )
                                }
                            </div>
                            {item.contentHtml && (
                                <div className="mt-2 text-xs text-gray-400 bg-black/20 p-2 rounded truncate max-w-md">
                                    {item.contentHtml}
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => handleDelete(item.id)}
                                className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
                {(activeTab === 'plans' ? plans : ads).length === 0 && (
                    <div className="text-center py-12 text-gray-500 bg-white/[0.02] rounded-xl border border-dashed border-white/10">
                        No {activeTab} found. Create one to get started.
                    </div>
                )}
            </div>

            {/* Form Modal */}
            {isFormOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#111] border border-white/10 p-6 rounded-2xl w-full max-w-md">
                        <h2 className="text-xl font-bold text-white mb-4">
                            {formData.id ? 'Edit' : 'New'} {activeTab === 'plans' ? 'Plan' : 'Ad'}
                        </h2>

                        <form onSubmit={handleSave} className="space-y-4">
                            {activeTab === 'plans' ? (
                                <>
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Plan ID (e.g., plan_pro)</label>
                                        <input
                                            value={formData.id || ''}
                                            onChange={e => setFormData({ ...formData, id: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded p-2 text-white text-sm"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Title</label>
                                        <input
                                            value={formData.title || ''}
                                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded p-2 text-white text-sm"
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs text-gray-400 mb-1">Price (Wei)</label>
                                            <input
                                                type="number"
                                                value={formData.priceWei || ''}
                                                onChange={e => setFormData({ ...formData, priceWei: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded p-2 text-white text-sm"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-400 mb-1">Validity (Sec)</label>
                                            <input
                                                type="number"
                                                value={formData.validitySeconds || ''}
                                                onChange={e => setFormData({ ...formData, validitySeconds: Number(e.target.value) })}
                                                className="w-full bg-white/5 border border-white/10 rounded p-2 text-white text-sm"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={formData.hasAds || false}
                                            onChange={e => setFormData({ ...formData, hasAds: e.target.checked })}
                                        />
                                        <span className="text-sm text-gray-300">Show Ads on this Plan</span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Ad ID</label>
                                        <input
                                            value={formData.id || ''}
                                            onChange={e => setFormData({ ...formData, id: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded p-2 text-white text-sm"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">HTML Content</label>
                                        <textarea
                                            value={formData.contentHtml || ''}
                                            onChange={e => setFormData({ ...formData, contentHtml: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded p-2 text-white text-sm h-32 font-mono"
                                            required
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={formData.isActive || false}
                                            onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                        />
                                        <span className="text-sm text-gray-300">Active</span>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Placement</label>
                                        <select
                                            value={formData.placement || 'both'}
                                            onChange={e => setFormData({ ...formData, placement: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded p-2 text-white text-sm"
                                        >
                                            <option value="both">Both (Web & PDF)</option>
                                            <option value="web">Web Only</option>
                                            <option value="pdf">PDF Only</option>
                                        </select>
                                    </div>
                                </>
                            )}

                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsFormOpen(false)}
                                    className="flex-1 rounded bg-white/10 py-2 text-sm font-medium text-white hover:bg-white/20"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 rounded bg-violet-600 py-2 text-sm font-medium text-white hover:bg-violet-700"
                                >
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
