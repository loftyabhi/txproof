'use client';

import { Navbar } from '@/components/Navbar';
import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatEther, parseEther } from 'viem';
import { Shield, AlertTriangle, Lock, Unlock, ArrowDownCircle, Settings, Coins } from 'lucide-react';
import { useToast } from '@/components/toast';

// Minimal ABI for SupportVault
const VAULT_ABI = [
    { inputs: [], name: 'paused', outputs: [{ internalType: 'bool', name: '', type: 'bool' }], stateMutability: 'view', type: 'function' },
    { inputs: [], name: 'owner', outputs: [{ internalType: 'address', name: '', type: 'address' }], stateMutability: 'view', type: 'function' },
    { inputs: [], name: 'pause', outputs: [], stateMutability: 'nonpayable', type: 'function' },
    { inputs: [], name: 'unpause', outputs: [], stateMutability: 'nonpayable', type: 'function' },
    { inputs: [{ internalType: 'address payable', name: 'to', type: 'address' }, { internalType: 'uint256', name: 'amount', type: 'uint256' }], name: 'withdrawNative', outputs: [], stateMutability: 'nonpayable', type: 'function' },
    { inputs: [], name: 'minContributionNative', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
    { inputs: [{ internalType: 'uint256', name: '_min', type: 'uint256' }], name: 'setMinContributionNative', outputs: [], stateMutability: 'nonpayable', type: 'function' },
    { inputs: [{ internalType: 'address', name: 'token', type: 'address' }], name: 'isTokenAllowed', outputs: [{ internalType: 'bool', name: '', type: 'bool' }], stateMutability: 'view', type: 'function' },
    { inputs: [{ internalType: 'address', name: 'token', type: 'address' }, { internalType: 'bool', name: 'status', type: 'bool' }], name: 'setTokenStatus', outputs: [], stateMutability: 'nonpayable', type: 'function' }
] as const;

const VAULT_ADDRESS = process.env.NEXT_PUBLIC_SUPPORT_VAULT_ADDRESS as `0x${string}`;
const ADMIN_ADDRESS = process.env.NEXT_PUBLIC_ADMIN_ADDRESS;

export default function AdminDashboard() {
    const { address, isConnected } = useAccount();
    const { success, error: toastError, loading, removeToast } = useToast();
    const [isAdmin, setIsAdmin] = useState(false);

    // Form States
    const [withdrawAddress, setWithdrawAddress] = useState('');
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [newMinContribution, setNewMinContribution] = useState('');
    const [tokenAddress, setTokenAddress] = useState('');
    const [tokenStatus, setTokenStatus] = useState(true);

    const [hasHydrated, setHasHydrated] = useState(false);

    useEffect(() => {
        setHasHydrated(true);
        if (address && ADMIN_ADDRESS && address.toLowerCase() === ADMIN_ADDRESS.toLowerCase()) {
            setIsAdmin(true);
        } else {
            setIsAdmin(false);
        }
    }, [address]);

    // Read Contract State
    const { data: isPaused, refetch: refetchPaused } = useReadContract({
        address: VAULT_ADDRESS,
        abi: VAULT_ABI,
        functionName: 'paused',
    });

    const { data: owner } = useReadContract({
        address: VAULT_ADDRESS,
        abi: VAULT_ABI,
        functionName: 'owner',
    });

    const { data: minContribution, refetch: refetchMin } = useReadContract({
        address: VAULT_ADDRESS,
        abi: VAULT_ABI,
        functionName: 'minContributionNative',
    });

    // Write Contract
    const { writeContractAsync } = useWriteContract();

    const wrapTx = async (promise: Promise<`0x${string}`>, title: string) => {
        const toastId = loading("Waiting for confirmation...", title);
        try {
            await promise;
            removeToast(toastId);
            success("Transaction submitted!", title);
        } catch (err: any) {
            removeToast(toastId);
            console.error(err);
            toastError(err.message?.slice(0, 100) || "Failed", title);
        }
    };

    const handlePauseToggle = () => {
        wrapTx(writeContractAsync({
            address: VAULT_ADDRESS,
            abi: VAULT_ABI,
            functionName: isPaused ? 'unpause' : 'pause',
        }), isPaused ? 'Unpausing' : 'Pausing');
    };

    const handleWithdraw = () => {
        if (!withdrawAddress || !withdrawAmount) return;
        wrapTx(writeContractAsync({
            address: VAULT_ADDRESS,
            abi: VAULT_ABI,
            functionName: 'withdrawNative',
            args: [withdrawAddress as `0x${string}`, parseEther(withdrawAmount)],
        }), 'Withdrawal');
    };

    const handleSetMin = () => {
        if (!newMinContribution) return;
        wrapTx(writeContractAsync({
            address: VAULT_ADDRESS,
            abi: VAULT_ABI,
            functionName: 'setMinContributionNative',
            args: [parseEther(newMinContribution)],
        }), 'Update Min Contribution');
    };

    const handleSetToken = () => {
        if (!tokenAddress) return;
        wrapTx(writeContractAsync({
            address: VAULT_ADDRESS,
            abi: VAULT_ABI,
            functionName: 'setTokenStatus',
            args: [tokenAddress as `0x${string}`, tokenStatus],
        }), 'Update Token Status');
    };

    if (!hasHydrated) return null;

    if (!isConnected || !isAdmin) {
        return (
            <div className="min-h-screen bg-[#0B0F19] text-white flex items-center justify-center">
                <div className="text-center p-8 bg-white/5 rounded-2xl border border-red-500/20">
                    <AlertTriangle className="mx-auto text-red-500 mb-4" size={48} />
                    <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
                    <p className="text-slate-400">You must be connected as an Admin to view this page.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0B0F19] text-white font-sans selection:bg-purple-500/30 overflow-x-hidden">
            <Navbar />

            <main className="pt-32 pb-20 px-6 max-w-5xl mx-auto">
                <div className="flex items-center justify-between mb-10">
                    <h1 className="text-4xl font-bold flex items-center gap-3">
                        <Shield className="text-purple-500" />
                        Admin Dashboard
                    </h1>
                    <div className="px-3 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full text-sm font-mono">
                        {VAULT_ADDRESS ? `Vault: ${VAULT_ADDRESS.slice(0, 6)}...${VAULT_ADDRESS.slice(-4)}` : 'Vault Not Configured'}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Status Card */}
                    <div className="bg-[#131B2C] rounded-2xl border border-white/5 p-6">
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">Contract Status</h2>

                        <div className="flex items-center justify-between mb-8 p-4 bg-white/5 rounded-xl">
                            <span className="text-slate-400">Current State:</span>
                            <div className={`flex items-center gap-2 font-bold ${isPaused ? 'text-red-400' : 'text-green-400'}`}>
                                {isPaused ? <Lock size={18} /> : <Unlock size={18} />}
                                {isPaused ? 'PAUSED' : 'ACTIVE'}
                            </div>
                        </div>

                        <div className="flex items-center justify-between mb-8 p-4 bg-white/5 rounded-xl">
                            <span className="text-slate-400">On-Chain Owner:</span>
                            <span className="font-mono text-xs text-slate-300">
                                {owner ? owner : 'Loading...'}
                            </span>
                        </div>

                        <button
                            onClick={handlePauseToggle}
                            className={`w-full py-3 rounded-xl font-bold transition-all ${isPaused
                                ? 'bg-green-600 hover:bg-green-500 text-white'
                                : 'bg-red-600 hover:bg-red-500 text-white'
                                }`}
                        >
                            {isPaused ? 'Resume Contributions (Unpause)' : 'Emergency Stop (Pause)'}
                        </button>
                    </div>

                    {/* Withdraw Card */}
                    <div className="bg-[#131B2C] rounded-2xl border border-white/5 p-6">
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <ArrowDownCircle className="text-blue-400" />
                            Withdraw Funds
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Recipient Address</label>
                                <input
                                    type="text"
                                    placeholder="0x..."
                                    value={withdrawAddress}
                                    onChange={(e) => setWithdrawAddress(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-purple-500 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Amount (Native ETH)</label>
                                <input
                                    type="number"
                                    placeholder="0.0"
                                    value={withdrawAmount}
                                    onChange={(e) => setWithdrawAmount(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-purple-500 transition-colors"
                                />
                            </div>

                            <div className="pt-4">
                                <button
                                    onClick={handleWithdraw}
                                    disabled={!withdrawAddress || !withdrawAmount}
                                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Withdraw Funds
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                    {/* Min Contribution Card */}
                    <div className="bg-[#131B2C] rounded-2xl border border-white/5 p-6">
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <Settings className="text-orange-400" />
                            Configuration
                        </h2>

                        <div className="mb-6 p-4 bg-white/5 rounded-xl">
                            <div className="text-sm text-slate-400 mb-1">Current Min Contribution</div>
                            <div className="font-mono text-xl font-bold text-white">
                                {minContribution ? formatEther(minContribution) : '...'} ETH
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">New Minimum (ETH)</label>
                                <input
                                    type="number"
                                    placeholder="0.0001"
                                    value={newMinContribution}
                                    onChange={(e) => setNewMinContribution(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-purple-500 transition-colors"
                                />
                            </div>
                            <button
                                onClick={handleSetMin}
                                disabled={!newMinContribution}
                                className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold transition-all disabled:opacity-50"
                            >
                                Update Minimum
                            </button>
                        </div>
                    </div>

                    {/* Token Allowlist Card */}
                    <div className="bg-[#131B2C] rounded-2xl border border-white/5 p-6">
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <Coins className="text-teal-400" />
                            ERC20 Allowlist
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Token Address</label>
                                <input
                                    type="text"
                                    placeholder="0x..."
                                    value={tokenAddress}
                                    onChange={(e) => setTokenAddress(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-purple-500 transition-colors"
                                />
                            </div>

                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        checked={tokenStatus === true}
                                        onChange={() => setTokenStatus(true)}
                                        className="accent-teal-500 h-4 w-4"
                                    />
                                    <span className="text-white">Allow</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        checked={tokenStatus === false}
                                        onChange={() => setTokenStatus(false)}
                                        className="accent-red-500 h-4 w-4"
                                    />
                                    <span className="text-white">Ban</span>
                                </label>
                            </div>

                            <button
                                onClick={handleSetToken}
                                disabled={!tokenAddress}
                                className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold transition-all disabled:opacity-50"
                            >
                                Update Token Status
                            </button>
                        </div>

                        <div className="mt-6 p-4 bg-teal-900/10 border border-teal-500/20 rounded-xl">
                            <h4 className="text-sm font-bold text-teal-400 mb-2">Note</h4>
                            <p className="text-xs text-slate-400">
                                Tokens must be explicitly allowed. Common stablecoins (USDC, USDT) are kept on a strict allowlist to prevent spam.
                            </p>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
}
