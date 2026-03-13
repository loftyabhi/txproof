// ═══ FILE: core/Context.ts ═══
import {
    Address, Log, Transaction, Receipt, TokenFlow, ExecutionType, ExecutionDetails, TokenMovement
} from './types';
import { ProtocolRecord, EventRecord, SelectorRecord, ChainRecord, RegistrySnapshot } from '../infrastructure/ProtocolRegistry';
import { EVM } from '../infrastructure/constants/evm';

const DEFAULT_CHAIN_RECORD: ChainRecord = {
    chainId: 1,
    name: 'Unknown',
    nativeSymbol: 'ETH',
    wNativeAddress: '',
    dustThresholdWei: 1000n,
    chainType: 'L1'
};

export class ClassificationContext {
    public readonly chainConfig: ChainRecord;
    public readonly effectiveTo: Address;
    public readonly isProxy: boolean;
    public readonly proxyImplementation?: Address;
    public readonly executionType: ExecutionType;

    constructor(
        public readonly tx: Transaction,
        public readonly receipt: Receipt,
        public readonly flow: TokenFlow,
        public readonly chainId: number,
        private readonly snapshot: RegistrySnapshot,
        executionDetails: ExecutionDetails,
    ) {
        this.chainConfig = snapshot.byChain.get(chainId) ?? DEFAULT_CHAIN_RECORD;
        this.effectiveTo = (executionDetails.effectiveTo ?? tx.to ?? EVM.ZERO_ADDRESS).toLowerCase();
        this.isProxy = executionDetails.isProxy;
        this.proxyImplementation = executionDetails.implementation?.toLowerCase();
        this.executionType = executionDetails.executionType;
        Object.freeze(this);
    }

    // ── REGISTRY LOOKUPS (all O(1)) ───────────────────────────────────────

    /** Resolve the effective-to address to a protocol record */
    resolveTarget(): ProtocolRecord | null {
        return this.snapshot.byAddress.get(`${this.chainId}:${this.effectiveTo}`) ?? null;
    }

    /** Resolve ANY address to a protocol record */
    resolveAddress(address: string): ProtocolRecord | null {
        return this.snapshot.byAddress.get(`${this.chainId}:${address.toLowerCase()}`) ?? null;
    }

    /** Is effectiveTo a known address of the given category? */
    targetIsCategory(category: string): boolean {
        return this.snapshot.byCategory
            .get(`${this.chainId}:${category}`)
            ?.has(this.effectiveTo) ?? false;
    }

    /** Is any address in a given category? */
    addressIsCategory(address: string, category: string): boolean {
        return this.snapshot.byCategory
            .get(`${this.chainId}:${category}`)
            ?.has(address.toLowerCase()) ?? false;
    }

    /** Resolve event topic0 to its registry record */
    resolveEvent(topic0: string): EventRecord | null {
        return this.snapshot.byEvent.get(topic0.toLowerCase()) ?? null;
    }

    /** Resolve function selector (first 4 bytes of data) to its registry record */
    resolveSelector(): SelectorRecord | null {
        if (!this.tx.data || this.tx.data.length < 10) return null;
        return this.snapshot.bySelector.get(this.tx.data.slice(0, 10).toLowerCase()) ?? null;
    }

    /** 
     * Find all logs whose topic0 matches the given event category.
     * Returns [] if none found.
     */
    getLogsByCategory(category: string): Log[] {
        return this.receipt.logs.filter(l => {
            const rec = this.snapshot.byEvent.get(l.topics[0]?.toLowerCase());
            return rec?.category === category;
        });
    }

    /**
     * Check if ANY log was emitted by a known protocol address in this category.
     * Useful for detecting internal calls to lending pools, DEXes, etc.
     */
    hasInternalCallTo(category: string): boolean {
        const catSet = this.snapshot.byCategory.get(`${this.chainId}:${category}`);
        if (!catSet) return false;
        return this.receipt.logs.some(l => catSet.has(l.address.toLowerCase()));
    }

    // ── TOKEN FLOW HELPERS ──────────────────────────────────────────────────

    getUserFlow(address: Address): { incoming: TokenMovement[]; outgoing: TokenMovement[] } | null {
        const normalized = address.toLowerCase();
        const f = this.flow[normalized];
        if (!f) return null;
        return { incoming: [...f.incoming], outgoing: [...f.outgoing] };
    }

    getSenderFlow() {
        return this.getUserFlow(this.tx.from);
    }
}
