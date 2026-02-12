export const SUPPORTED_CHAINS = [
    1,          // Ethereum
    8453,       // Base
    137,        // Polygon
    11155111,   // Sepolia
    42161,      // Arbitrum
    10,         // Optimism
    56,         // BSC
    43114       // Avalanche
] as const;

export type SupportedChainId = typeof SUPPORTED_CHAINS[number];

export const RPC_URLS: Record<SupportedChainId, string> = {
    1: 'https://eth.llamarpc.com',
    8453: 'https://mainnet.base.org',
    137: 'https://polygon-rpc.com',
    11155111: 'https://rpc.sepolia.org',
    42161: 'https://arb1.arbitrum.io/rpc',
    10: 'https://mainnet.optimism.io',
    56: 'https://bsc-dataseed.binance.org',
    43114: 'https://api.avax.network/ext/bc/C/rpc'
};

export const isSupportedChain = (chainId: number): chainId is SupportedChainId => {
    return SUPPORTED_CHAINS.includes(chainId as SupportedChainId);
};
