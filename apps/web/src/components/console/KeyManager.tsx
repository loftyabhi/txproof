import React, { useState } from 'react';

interface ApiKey {
    id: string;
    prefix: string;
    name: string;
    created_at: string;
    is_active: boolean;
    plan: {
        name: string;
        monthly_quota: number;
    };
    usage_month: number;
}

interface KeyManagerProps {
    keys: ApiKey[];
    onCreate: (name: string) => Promise<void>;
    onRevoke: (id: string) => Promise<void>;
    isLoading?: boolean;
}

export const KeyManager: React.FC<KeyManagerProps> = ({ keys, onCreate, onRevoke, isLoading }) => {
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [newKeyDisplay, setNewKeyDisplay] = useState<string | null>(null);

    const handleCreate = async () => {
        if (!newName) return;
        try {
            await onCreate(newName);
            setIsCreating(false);
            setNewName('');
            // Parent should handle displaying the NEW key if returned, 
            // but for now we assume parent refreshes list.
            // Actually, we need to show the key ONCE.
            // The onCreate prop should probably return the created key result.
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-white">API Keys</h3>
                <button
                    onClick={() => setIsCreating(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
                >
                    + Create New Key
                </button>
            </div>

            {isCreating && (
                <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                    <h4 className="text-sm font-medium text-blue-200 mb-2">New API Key Name</h4>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            placeholder="e.g. Production App"
                            className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                        />
                        <button
                            onClick={handleCreate}
                            disabled={!newName || isLoading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium"
                        >
                            Create
                        </button>
                        <button
                            onClick={() => setIsCreating(false)}
                            className="px-4 py-2 bg-transparent text-gray-400 hover:text-white text-sm font-medium"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                {keys.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        No API keys found. Create one to get started.
                    </div>
                ) : (
                    keys.map(key => (
                        <div key={key.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 gap-4">
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <span className="font-medium text-white">{key.name}</span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${key.is_active ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                                        {key.is_active ? 'Active' : 'Revoked'}
                                    </span>
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                        {key.plan.name}
                                    </span>
                                </div>
                                <div className="font-mono text-sm text-gray-400 mb-1">
                                    {key.prefix}••••••••••••••••••••••••
                                </div>
                                <div className="text-xs text-gray-500">
                                    Created {new Date(key.created_at).toLocaleDateString()}
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <div className="text-xs text-gray-400 mb-1">Usage Month</div>
                                    <div className="text-sm font-medium text-white">
                                        {key.usage_month.toLocaleString()} / {key.plan.monthly_quota.toLocaleString()}
                                    </div>
                                    <div className="w-32 h-1.5 bg-gray-700 rounded-full mt-1 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${key.usage_month / key.plan.monthly_quota > 0.9 ? 'bg-red-500' : 'bg-blue-500'}`}
                                            style={{ width: `${Math.min(100, (key.usage_month / key.plan.monthly_quota) * 100)}%` }}
                                        />
                                    </div>
                                </div>

                                {key.is_active && (
                                    <button
                                        onClick={() => onRevoke(key.id)}
                                        className="text-gray-500 hover:text-red-400 p-2 transition-colors"
                                        title="Revoke Key"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
