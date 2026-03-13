import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';

export interface ChainConfigJson {
    rpcUrl: string;
    iconUrl?: string;
    coingeckoPlatform?: string;
    alchemyNetwork?: string;
    explorerUrl?: string;
    nativeSymbol?: string;
}

export interface UnifiedChainConfig {
    id: number;
    name: string;
    chainId: number;
    explorerUrl: string;
    currencySymbol: string;
    config: ChainConfigJson;
    // From Classifier source (chain_configs)
    nativeSymbol: string;
    dustThresholdWei: string;
    chainType: 'L1' | 'L2' | 'L3';
    isActive: boolean;
}

export class ChainRegistryService {
    private static instance: ChainRegistryService;
    private cache: UnifiedChainConfig[] | null = null;
    private lastFetch: number = 0;
    private readonly TTL = 5 * 60 * 1000; // 5 minutes
    private loadPromise: Promise<UnifiedChainConfig[]> | null = null;

    private constructor() {}

    public static getInstance(): ChainRegistryService {
        if (!ChainRegistryService.instance) {
            ChainRegistryService.instance = new ChainRegistryService();
        }
        return ChainRegistryService.instance;
    }

    /**
     * Get all active chains with unified configuration
     */
    public async getChains(): Promise<UnifiedChainConfig[]> {
        const now = Date.now();
        if (this.cache && (now - this.lastFetch < this.TTL)) {
            return this.cache;
        }

        if (this.loadPromise) {
            return this.loadPromise;
        }

        this.loadPromise = this.fetchChains();
        try {
            this.cache = await this.loadPromise;
            this.lastFetch = Date.now();
            return this.cache;
        } finally {
            this.loadPromise = null;
        }
    }

    /**
     * Get a specific chain by its ID
     */
    public async getChain(chainId: number): Promise<UnifiedChainConfig | undefined> {
        const chains = await this.getChains();
        return chains.find(c => c.chainId === chainId);
    }

    private async fetchChains(): Promise<UnifiedChainConfig[]> {
        logger.info('[ChainRegistry] Refreshing chain registry from database...');

        // Join SaaS 'chains' with Classifier 'chain_configs'
        const { data, error } = await supabase
            .from('chains')
            .select(`
                id, name, chain_id, explorer_url, currency_symbol, config_json,
                chain_configs!inner (
                    native_symbol, dust_threshold_wei, chain_type, is_active
                )
            `)
            .eq('chain_configs.is_active', true);

        if (error) {
            logger.error('[ChainRegistry] Failed to fetch chains', error);
            throw new Error('Could not load chain registry');
        }

        const unifiedChains: UnifiedChainConfig[] = (data as any[]).map(row => {
            const config = row.config_json as ChainConfigJson;
            
            // Validation
            if (!config.rpcUrl) {
                logger.warn(`[ChainRegistry] Chain ${row.chain_id} is missing rpcUrl in config_json. Skipping.`);
            }

            return {
                id: row.id,
                name: row.name,
                chainId: row.chain_id,
                explorerUrl: row.explorer_url || config.explorerUrl || '',
                currencySymbol: row.currency_symbol || 'ETH',
                config: config,
                nativeSymbol: row.chain_configs.native_symbol,
                dustThresholdWei: row.chain_configs.dust_threshold_wei,
                chainType: row.chain_configs.chain_type,
                isActive: row.chain_configs.is_active
            };
        }).filter(c => c.config.rpcUrl);

        logger.info(`[ChainRegistry] Loaded ${unifiedChains.length} chains successfully.`);
        return unifiedChains;
    }

    public invalidate(): void {
        this.cache = null;
        this.lastFetch = 0;
    }
}

export const chainRegistry = ChainRegistryService.getInstance();
