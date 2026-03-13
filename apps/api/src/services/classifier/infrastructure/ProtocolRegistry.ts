// ═══ FILE: infrastructure/ProtocolRegistry.ts ═══
import { Pool } from 'pg';

export interface ProtocolRecord {
    protocolSlug: string;
    protocolName: string;
    category: string;       // 'dex' | 'lending' | etc.
    addressType: string;    // 'router' | 'pool' | etc.
    label: string;
    chainId: number;
    address: string;        // lowercase
    confidenceBoost: number;
}

export interface EventRecord {
    topic0: string;         // lowercase
    name: string;
    category: string;       // 'dex_swap' | 'lending_deposit' | etc.
    confidenceBoost: number;
    protocolSlug?: string;
}

export interface SelectorRecord {
    selector: string;       // '0x........' lowercase 10 chars
    name: string;
    category: string;
    confidenceBoost: number;
    protocolSlug?: string;
}

export interface ChainRecord {
    chainId: number;
    name: string;
    nativeSymbol: string;
    wNativeAddress: string;
    dustThresholdWei: bigint;
    chainType: 'L1' | 'L2' | 'L3';
}

export interface RegistrySnapshot {
    byAddress: Map<string, ProtocolRecord>;
    byCategory: Map<string, Set<string>>;
    byEvent: Map<string, EventRecord>;
    bySelector: Map<string, SelectorRecord>;
    byChain: Map<number, ChainRecord>;
    loadedAt: Date;
}

export class ProtocolRegistry {
    private static snapshot: RegistrySnapshot | null = null;
    private static loadPromise: Promise<void> | null = null;
    private static readonly TTL_MS = 5 * 60 * 1000; // 5 minutes

    constructor(private readonly db: Pool) { }

    async getSnapshot(): Promise<RegistrySnapshot> {
        if (ProtocolRegistry.snapshot) {
            const age = Date.now() - ProtocolRegistry.snapshot.loadedAt.getTime();
            if (age < ProtocolRegistry.TTL_MS) {
                return ProtocolRegistry.snapshot;
            }
        }

        if (!ProtocolRegistry.loadPromise) {
            ProtocolRegistry.loadPromise = this.load().finally(() => {
                ProtocolRegistry.loadPromise = null;
            });
        }

        await ProtocolRegistry.loadPromise;
        return ProtocolRegistry.snapshot!;
    }

    private async load(): Promise<void> {
        const client = await this.db.connect();
        try {
            const [chains, protocols, addresses, events, selectors] = await Promise.all([
                client.query('SELECT * FROM chain_configs WHERE is_active = true'),
                client.query('SELECT * FROM protocols WHERE is_active = true'),
                client.query('SELECT a.*, p.slug as protocol_slug, p.name as protocol_name, p.category as protocol_category FROM protocol_addresses a JOIN protocols p ON p.id = a.protocol_id WHERE a.is_active = true AND p.is_active = true'),
                client.query('SELECT e.*, p.slug as protocol_slug FROM event_signatures e LEFT JOIN protocols p ON p.id = e.protocol_id'),
                client.query('SELECT s.*, p.slug as protocol_slug FROM function_selectors s LEFT JOIN protocols p ON p.id = s.protocol_id')
            ]);

            const byChain = new Map<number, ChainRecord>();
            for (const row of chains.rows) {
                byChain.set(row.chain_id, {
                    chainId: row.chain_id,
                    name: row.name,
                    nativeSymbol: row.native_symbol,
                    wNativeAddress: row.w_native_address ?? '',
                    dustThresholdWei: BigInt(row.dust_threshold_wei ?? 1000n),
                    chainType: row.chain_type
                });
            }

            const byAddress = new Map<string, ProtocolRecord>();
            const byCategory = new Map<string, Set<string>>();
            for (const row of addresses.rows) {
                const addr = row.address.toLowerCase();
                const key = `${row.chain_id}:${addr}`;

                byAddress.set(key, {
                    protocolSlug: row.protocol_slug,
                    protocolName: row.protocol_name,
                    category: row.protocol_category,
                    addressType: row.address_type,
                    label: row.label,
                    chainId: row.chain_id,
                    address: addr,
                    confidenceBoost: Number(row.confidence_boost)
                });

                const catKey = `${row.chain_id}:${row.protocol_category}`;
                if (!byCategory.has(catKey)) byCategory.set(catKey, new Set());
                byCategory.get(catKey)!.add(addr);

                // Also index by address_type (e.g. 'router', 'pool', 'bridge_gateway')
                const typeKey = `${row.chain_id}:${row.address_type}`;
                if (!byCategory.has(typeKey)) byCategory.set(typeKey, new Set());
                byCategory.get(typeKey)!.add(addr);
            }

            const byEvent = new Map<string, EventRecord>();
            for (const row of events.rows) {
                byEvent.set(row.topic0.toLowerCase(), {
                    topic0: row.topic0.toLowerCase(),
                    name: row.name,
                    category: row.category,
                    confidenceBoost: Number(row.confidence_boost),
                    protocolSlug: row.protocol_slug
                });
            }

            const bySelector = new Map<string, SelectorRecord>();
            for (const row of selectors.rows) {
                bySelector.set(row.selector.toLowerCase(), {
                    selector: row.selector.toLowerCase(),
                    name: row.name,
                    category: row.category,
                    confidenceBoost: Number(row.confidence_boost),
                    protocolSlug: row.protocol_slug
                });
            }

            ProtocolRegistry.snapshot = {
                byAddress, byCategory, byEvent, bySelector, byChain, loadedAt: new Date()
            };
            Object.freeze(ProtocolRegistry.snapshot); // ensure immutability
        } finally {
            client.release();
        }
    }

    static invalidate(): void {
        ProtocolRegistry.snapshot = null;
    }

    async resolveAddress(chainId: number, address: string): Promise<ProtocolRecord | null> {
        const snap = await this.getSnapshot();
        return snap.byAddress.get(`${chainId}:${address.toLowerCase()}`) ?? null;
    }

    async isCategory(chainId: number, address: string, category: string): Promise<boolean> {
        const snap = await this.getSnapshot();
        return snap.byCategory.get(`${chainId}:${category}`)?.has(address.toLowerCase()) ?? false;
    }

    async getChainConfig(chainId: number): Promise<ChainRecord | null> {
        const snap = await this.getSnapshot();
        return snap.byChain.get(chainId) ?? null;
    }
}
