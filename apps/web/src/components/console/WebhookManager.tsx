'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface Webhook {
    id: string;
    url: string;
    events: string[];
    is_active: boolean;
    created_at: string;
}

interface WebhookManagerProps {
    token: string;
}

export const WebhookManager: React.FC<WebhookManagerProps> = ({ token }) => {
    const [webhooks, setWebhooks] = useState<Webhook[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    // Form State
    const [url, setUrl] = useState('');
    const [events, setEvents] = useState<string[]>(['bill.completed', 'bill.failed']);

    // New Webhook Secret Display
    const [newSecret, setNewSecret] = useState<string | null>(null);

    const fetchWebhooks = React.useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/webhooks`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setWebhooks(await res.json());
            }
        } catch (error) {
            console.error('Failed to fetch webhooks', error);
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (token) fetchWebhooks();
    }, [token, fetchWebhooks]);

    const handleCreate = async () => {
        if (!url) {
            toast.error('Please enter a valid URL');
            return;
        }

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/webhooks`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url, events })
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed to create webhook');

            // Show secret
            setNewSecret(data.secret);
            toast.success('Webhook created successfully');

            // Reset form
            setUrl('');
            setIsCreating(false);
            fetchWebhooks();

        } catch (e: any) {
            toast.error(e.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure? This action cannot be undone.')) return;

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/webhooks/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                toast.success('Webhook deleted');
                fetchWebhooks();
            } else {
                toast.error('Failed to delete webhook');
            }
        } catch (e) {
            toast.error('Error deleting webhook');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-white">Webhooks</h2>
                <button
                    onClick={() => setIsCreating(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
                >
                    + Add Endpoint
                </button>
            </div>

            {/* Secret Display Modal */}
            {newSecret && (
                <div className="bg-green-900/10 border border-green-500/30 rounded-xl p-6 mb-6">
                    <h3 className="text-lg font-bold text-green-400 mb-2">Webhook Created!</h3>
                    <p className="text-gray-400 text-sm mb-4">
                        Please save this signing secret. It will verify that events originated from TxProof.
                        <br />It will <strong>not</strong> be shown again.
                    </p>
                    <div className="bg-black border border-white/10 rounded p-3 flex justify-between items-center group">
                        <code className="text-green-300 font-mono text-sm break-all">{newSecret}</code>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(newSecret);
                                toast.success('Copied to clipboard');
                            }}
                            className="bg-white/10 hover:bg-white/20 text-xs px-2 py-1 rounded text-white ml-2"
                        >
                            Copy
                        </button>
                    </div>
                    <button
                        onClick={() => setNewSecret(null)}
                        className="mt-4 text-sm text-gray-400 hover:text-white underline"
                    >
                        I have saved it
                    </button>
                </div>
            )}

            {/* Create Form */}
            {isCreating && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
                    <h3 className="text-lg font-medium text-white mb-4">New Webhook Endpoint</h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Endpoint URL</label>
                            <input
                                type="url"
                                value={url}
                                onChange={e => setUrl(e.target.value)}
                                placeholder="https://api.yourapp.com/webhooks/txproof"
                                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-blue-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-2">Events to Subscribe</label>
                            <div className="flex gap-2">
                                <label className="flex items-center gap-2 px-3 py-2 bg-black/30 rounded border border-blue-500/50 text-blue-200 text-sm cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={events.includes('bill.completed')}
                                        onChange={() => {
                                            if (events.includes('bill.completed')) {
                                                setEvents(events.filter(e => e !== 'bill.completed'));
                                            } else {
                                                setEvents([...events, 'bill.completed']);
                                            }
                                        }}
                                    />
                                    bill.completed
                                </label>
                                <label className="flex items-center gap-2 px-3 py-2 bg-black/30 rounded border border-red-500/50 text-red-200 text-sm cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={events.includes('bill.failed')}
                                        onChange={() => {
                                            if (events.includes('bill.failed')) {
                                                setEvents(events.filter(e => e !== 'bill.failed'));
                                            } else {
                                                setEvents([...events, 'bill.failed']);
                                            }
                                        }}
                                    />
                                    bill.failed
                                </label>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                onClick={() => setIsCreating(false)}
                                className="px-4 py-2 text-gray-400 hover:text-white text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreate}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm"
                            >
                                Create Webhook
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* List */}
            <div className="grid gap-4">
                {isLoading && webhooks.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">Loading webhooks...</div>
                ) : webhooks.length === 0 ? (
                    <div className="text-center py-12 bg-white/5 rounded-xl border border-white/5">
                        <p className="text-gray-400 mb-2">No webhooks configured</p>
                        <p className="text-sm text-gray-600">Add an endpoint to receive real-time updates.</p>
                    </div>
                ) : (
                    webhooks.map(wh => (
                        <div key={wh.id} className="bg-white/5 border border-white/10 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="overflow-hidden">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-mono text-sm text-blue-300 truncate max-w-md" title={wh.url}>{wh.url}</span>
                                    <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs">Active</span>
                                </div>
                                <div className="flex gap-2 text-xs text-gray-500">
                                    <span>Events: {wh.events.join(', ')}</span>
                                    <span>•</span>
                                    <span>Created {new Date(wh.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button className="text-xs text-gray-400 hover:text-white border border-transparent hover:border-white/10 px-3 py-1.5 rounded transition">
                                    Test
                                </button>
                                <button
                                    onClick={() => handleDelete(wh.id)}
                                    className="text-xs text-red-400 hover:text-red-300 border border-transparent hover:border-red-500/20 hover:bg-red-500/10 px-3 py-1.5 rounded transition"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
