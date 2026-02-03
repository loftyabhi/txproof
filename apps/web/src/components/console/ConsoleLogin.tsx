import React from 'react';
import { useConnect, useAccount, useChainId, useSwitchChain } from 'wagmi';
import { useConsoleAuth } from '@/hooks/useConsoleAuth';
import { toast } from 'sonner';

const BASE_CHAIN_ID = 8453;

export const ConsoleLogin = () => {
    const { connect, connectors, isPending: isConnectLoading } = useConnect();
    const { isConnected, chainId } = useAccount();
    const { switchChain, isPending: isSwitchLoading } = useSwitchChain();

    // Auth Hook
    const { login, isLoading: isAuthLoading } = useConsoleAuth();

    const isWrongNetwork = isConnected && chainId !== BASE_CHAIN_ID;

    const handleAction = async () => {
        try {
            if (!isConnected) {
                // 1. Connect
                const connector = connectors.find(c => c.name === 'Injected') || connectors[0];
                if (!connector) throw new Error('No wallet connector found');
                await connect({ connector });
            } else if (isWrongNetwork) {
                // 2. Switch Network
                await switchChain({ chainId: BASE_CHAIN_ID });
            } else {
                // 3. Login
                await login();
                toast.success('Successfully signed in');
            }
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || 'Action failed');
        }
    };

    const isLoading = isConnectLoading || isAuthLoading || isSwitchLoading;

    let buttonText = 'Connect Wallet';
    if (isLoading) {
        if (isConnectLoading) buttonText = 'Connecting...';
        else if (isSwitchLoading) buttonText = 'Switching Network...';
        else buttonText = 'Signing In...';
    } else if (isConnected) {
        if (isWrongNetwork) buttonText = 'Switch to Base Mainnet';
        else buttonText = 'Sign In with Wallet';
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center p-6">
            <div className="mb-8">
                <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-violet-500 mb-4">
                    Developer Console
                </h1>
                <p className="text-gray-400 max-w-md mx-auto">
                    Manage your API, view analytics, and control your enterprise settings.
                </p>
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 w-full max-w-sm shadow-xl">
                <div className="space-y-4">
                    <button
                        onClick={handleAction}
                        disabled={isLoading}
                        className={`w-full py-3 px-4 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${isConnected && !isWrongNetwork
                                ? 'bg-blue-600 hover:bg-blue-500 text-white'
                                : isWrongNetwork
                                    ? 'bg-amber-600 hover:bg-amber-500 text-white'
                                    : 'bg-white text-black hover:bg-gray-200'
                            }`}
                    >
                        {isLoading ? (
                            <>
                                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                {buttonText}
                            </>
                        ) : (
                            buttonText
                        )}
                    </button>

                    <p className="text-xs text-gray-500 mt-4">
                        {isConnected
                            ? (isWrongNetwork
                                ? 'Please switch to Base Mainnet to continue.'
                                : 'Wallet connected. Please sign to verify ownership.')
                            : 'Connect your wallet to access the dashboard.'}
                    </p>
                </div>
            </div>
        </div>
    );
};
