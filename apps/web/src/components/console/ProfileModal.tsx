import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    token: string;
    initialData: any;
    onUpdate: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, token, initialData, onUpdate }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [socials, setSocials] = useState<any>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);

    // Tab State: 'general' | 'social'
    const [activeTab, setActiveTab] = useState<'general' | 'social'>('general');

    useEffect(() => {
        if (isOpen && initialData) {
            setName(initialData.name || '');
            setEmail(initialData.email || '');
            setSocials(initialData.social_config || {});
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleRequestVerification = async () => {
        setIsVerifying(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/user/verify/request`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to request verification');

            toast.success('Verification email sent! Link valid for 24h.');
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setIsVerifying(false);
        }
    };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/user/me`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name,
                    email,
                    social_config: socials
                })
            });

            if (!res.ok) throw new Error('Failed to update profile');

            toast.success('Profile updated successfully');
            onUpdate();
            onClose();
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSocialChange = (platform: string, value: string) => {
        setSocials((prev: any) => ({ ...prev, [platform]: value }));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                    <h2 className="text-xl font-bold">Profile Settings</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/10">
                    <button
                        onClick={() => setActiveTab('general')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'general' ? 'bg-white/5 text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-gray-200'}`}
                    >
                        General Info
                    </button>
                    <button
                        onClick={() => setActiveTab('social')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'social' ? 'bg-white/5 text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-gray-200'}`}
                    >
                        Social Links
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                    {activeTab === 'general' && (
                        <>
                            <div className="space-y-2">
                                <label className="text-sm text-gray-400">Display Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Satoshi Nakamoto"
                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 focus:border-blue-500 outline-none text-white transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-gray-400">Contact Email</label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={initialData?.is_email_verified && email === initialData.email}
                                        placeholder="user@example.com"
                                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 focus:border-blue-500 outline-none text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    />
                                    {initialData?.is_email_verified && email === initialData.email && (
                                        <div className="absolute right-3 top-3 text-emerald-500 text-xs flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded">
                                            <span>✓</span> Verified
                                        </div>
                                    )}
                                    {(!initialData?.is_email_verified || email !== initialData.email) && email && (
                                        <div className="absolute right-3 top-3 flex items-center gap-2">
                                            <div className="text-yellow-500 text-xs flex items-center gap-1 bg-yellow-500/10 px-2 py-0.5 rounded">
                                                <span>!</span> Unverified
                                            </div>
                                            {email === initialData?.email && (
                                                <button
                                                    onClick={handleRequestVerification}
                                                    disabled={isVerifying}
                                                    className="text-[10px] bg-blue-600 hover:bg-blue-500 text-white px-2 py-0.5 rounded transition-colors disabled:opacity-50"
                                                >
                                                    {isVerifying ? 'Sending...' : 'Verify Now'}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500">We'll send important updates here. Verification required.</p>
                            </div>
                        </>
                    )}

                    {activeTab === 'social' && (
                        <div className="space-y-4">
                            {['Twitter', 'GitHub', 'Telegram', 'LinkedIn'].map((platform) => (
                                <div key={platform} className="space-y-1">
                                    <label className="text-sm text-gray-400">{platform} URL</label>
                                    <input
                                        type="url"
                                        value={socials[platform.toLowerCase()] || ''}
                                        onChange={(e) => handleSocialChange(platform.toLowerCase(), e.target.value)}
                                        placeholder={`https://${platform.toLowerCase()}.com/username`}
                                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 focus:border-blue-500 outline-none text-white transition-all"
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/10 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-gray-300 hover:bg-white/5 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                        {isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};
