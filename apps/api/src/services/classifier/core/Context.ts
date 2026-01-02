// src/services/classifier/core/Context.ts
import { Transaction, Receipt, Address, TokenFlow } from './types';
import { ChainConfig, CHAIN_CONFIGS, DEFAULT_CHAIN_CONFIG } from '../infrastructure/ChainConfig';

export class ClassificationContext {
    public readonly chain: ChainConfig;
    public readonly effectiveTo: Address; // Resolved address (Implementation or direct)
    public readonly isProxy: boolean;
    public readonly proxyImplementation?: Address;

    // Cache for heavy operations
    private _decodedLogs?: any[];
    public readonly internalTransactions: any[]; // Use specific type if available, using any[] for now

    constructor(
        public readonly tx: Transaction,
        public readonly receipt: Receipt,
        public readonly flow: TokenFlow,
        chainId: number,
        executionDetails: { effectiveTo: Address, isProxy: boolean, implementation?: Address },
        internalTransactions: any[] = [] // Default to empty if not provided yet
    ) {
        this.chain = CHAIN_CONFIGS[chainId] || { ...DEFAULT_CHAIN_CONFIG, chainId };
        this.effectiveTo = executionDetails.effectiveTo.toLowerCase();
        this.isProxy = executionDetails.isProxy;
        this.proxyImplementation = executionDetails.implementation?.toLowerCase();
        this.internalTransactions = internalTransactions;
    }

    /**
     * Helper to check if the effective target matches a protocol contract.
     */
    isContract(protocolName: string): boolean {
        // TODO: Implement config lookup
        return false;
    }
}
