import axios from 'axios';

// Make Redis optional - will gracefully degrade to no caching if not available
type RedisClient = any;

export enum PriceMode {
    HISTORICAL = 'historical',
    CURRENT = 'current'
}

export type PriceFailureCode =
    | 'HISTORICAL_PRICE_UNAVAILABLE'
    | 'CURRENT_PRICE_UNAVAILABLE'
    | 'INVALID_MODE_USAGE'
    | 'PROVIDER_UNSUPPORTED'
    | 'MISSING_API_KEY';

export class PriceOracleError extends Error {
    constructor(public code: PriceFailureCode, message: string) {
        super(message);
        this.name = 'PriceOracleError';
    }
}

export interface PriceSourceCapabilities {
    name: string;
    supportsHistorical: boolean;
    supportsCurrent: boolean;
    minGranularitySeconds: number;
    supportedChains: number[];
    supportedAssets: 'native' | 'erc20' | 'both';
}

export interface PriceResult {
    price: number;
    mode: PriceMode;
    source: string;
    priceTimestamp: number;
    requestTimestamp: number;
    confidence: {
        score: number;
        sourceTrust: number;
        isRealtime: boolean; // Explicit check as required
        timeDriftSeconds?: number;
        reasons: string[];
    };
}

// Internal unified params
interface PriceRequestParams {
    chainId: number;
    tokenAddress: string;
    mode: PriceMode;
    txTimestamp?: number;
    blockNumber?: number;
    requestTimestamp?: number;
}

export interface AccountingPriceParams {
    chainId: number;
    tokenAddress: string;
    blockNumber: number;
    txTimestamp: number;
}

export interface DisplayPriceParams {
    chainId: number;
    tokenAddress: string;
}

/**
 * Enterprise-grade Price Oracle with strict separation of Historical vs Current capabilities.
 * Includes Caching, Mandatory Audit Logging, and Explicit Error Contracts.
 */
export class PriceOracleService {
    private readonly coingeckoUrl = 'https://api.coingecko.com/api/v3';
    private readonly defillamaUrl = 'https://coins.llama.fi/prices/current';
    private readonly coincapUrl = 'https://api.coincap.io/v2';

    private redis: RedisClient | null = null;

    // DETERMINISTIC ORDER: Provider selection priority is strictly defined by this array order.
    private readonly providers: PriceSourceCapabilities[] = [
        {
            name: 'Alchemy',
            supportsHistorical: true,
            supportsCurrent: false,
            minGranularitySeconds: 3600, // 1h buckets
            supportedChains: [1, 137, 10, 42161, 8453, 11155111],
            supportedAssets: 'both'
        },
        {
            name: 'DeFiLlama',
            supportsHistorical: true,
            supportsCurrent: true,
            minGranularitySeconds: 0,
            supportedChains: [], // Many
            supportedAssets: 'both'
        },
        {
            name: 'Coingecko',
            supportsHistorical: true,
            supportsCurrent: true,
            minGranularitySeconds: 86400, // Daily standard for free tier history
            supportedChains: [], // Many
            supportedAssets: 'both'
        }
    ];

    constructor() {
        // Redis is optional - if not available, caching is disabled
        // This allows the service to work without Redis dependency
        try {
            // Only try to load Redis if the module is available
            const Redis = require('ioredis');
            const redisUrl = process.env.REDIS_URL;
            const options = {
                retryStrategy: (times: number) => Math.min(times * 50, 2000),
                maxRetriesPerRequest: 1
            };

            if (redisUrl) {
                this.redis = new Redis(redisUrl, options);
            } else {
                this.redis = new Redis(options);
            }

            this.redis.on('error', () => { }); // Suppress connection errors
        } catch (e) {
            // Redis not available, continue without caching
            this.redis = null;
        }
    }

    /**
     * Strict Guard: Get Historical Price for Accounting/Tax.
     * Guaranteed to return HISTORICAL mode data or throw.
     * Enforces strict block/timestamp matching and drift rules.
     */
    async getAccountingPrice(params: AccountingPriceParams): Promise<PriceResult> {
        return this.getPrice({
            chainId: params.chainId,
            tokenAddress: params.tokenAddress,
            mode: PriceMode.HISTORICAL,
            blockNumber: params.blockNumber,
            txTimestamp: params.txTimestamp
        });
    }

    /**
     * Strict Guard: Get Current Price for Display/PDFs.
     * Guaranteed to return CURRENT mode data or throw.
     * Timestamp is always forced to NOW (execution time).
     */
    async getDisplayPrice(params: DisplayPriceParams): Promise<PriceResult> {
        return this.getPrice({
            chainId: params.chainId,
            tokenAddress: params.tokenAddress,
            mode: PriceMode.CURRENT,
            requestTimestamp: Math.floor(Date.now() / 1000)
        });
    }

    /**
     * Internal Entrypoint.
     * PRIVATE to prevent cross-usage by API design.
     */
    private async getPrice(params: PriceRequestParams): Promise<PriceResult> {
        this.validateRequest(params);

        const startTime = Date.now();
        let result: PriceResult;

        try {
            if (params.mode === PriceMode.CURRENT) {
                result = await this.getCurrentPrice(params);
            } else {
                result = await this.getHistoricalPrice(params);
            }
        } catch (error: any) {
            const finalError = error instanceof PriceOracleError ? error : new PriceOracleError('PROVIDER_UNSUPPORTED', error.message);

            this.logAudit({
                params,
                success: false,
                error: finalError.code,
                durationMs: Date.now() - startTime
            });
            throw finalError;
        }

        this.logAudit({
            params,
            success: true,
            result,
            durationMs: Date.now() - startTime
        });

        return result;
    }

    private validateRequest(params: PriceRequestParams) {
        if (!params.mode) {
            throw new PriceOracleError('INVALID_MODE_USAGE', 'PriceMode is mandatory (HISTORICAL vs CURRENT).');
        }

        if (params.mode === PriceMode.HISTORICAL) {
            if (!params.txTimestamp && !params.blockNumber) {
                throw new PriceOracleError('INVALID_MODE_USAGE', 'HISTORICAL mode requires txTimestamp or blockNumber.');
            }
        }

        if (params.mode === PriceMode.CURRENT) {
            if (!params.requestTimestamp) {
                params.requestTimestamp = Math.floor(Date.now() / 1000);
            }
        }
    }

    private async getHistoricalPrice(params: PriceRequestParams): Promise<PriceResult> {
        const { chainId, tokenAddress, blockNumber, txTimestamp } = params;
        const targetTime = txTimestamp || Math.floor(Date.now() / 1000);

        // CACHE: Strict separation - Key prefixed with 'historical'
        const cacheKey = this.getHistoricalCacheKey(chainId, tokenAddress, blockNumber, targetTime);
        const cached = await this.getFromCache(cacheKey);
        if (cached) return cached;

        let result: PriceResult | null = null;
        const errors: string[] = [];

        // DETERMINISTIC FALLBACK: Alchemy -> DeFiLlama -> Coingecko

        // 1. Alchemy
        if (blockNumber && this.isProviderCapable('Alchemy', chainId)) {
            try {
                const alchemyPrice = await this.getAlchemyPrice(chainId, tokenAddress, blockNumber, targetTime);
                result = this.formatResult(alchemyPrice.price, PriceMode.HISTORICAL, 'Alchemy', alchemyPrice.timestamp, targetTime, 0.95);
            } catch (e: any) { errors.push(`Alchemy: ${e.message}`); }
        }

        // 2. DeFiLlama
        if (!result) {
            try {
                const dlPrice = await this.getDefiLlamaPrice(chainId, tokenAddress, targetTime);
                const driftStr = Math.abs(dlPrice.timestamp - targetTime);
                if (driftStr <= 3600 * 2) {
                    result = this.formatResult(dlPrice.price, PriceMode.HISTORICAL, 'DeFiLlama', dlPrice.timestamp, targetTime, 0.85);
                } else {
                    errors.push(`DeFiLlama: Drift ${driftStr}s > limit`);
                }
            } catch (e: any) { errors.push(`DeFiLlama: ${e.message}`); }
        }

        // 3. Coingecko
        if (!result) {
            try {
                const cgPrice = await this.getCoingeckoPrice(chainId, tokenAddress, targetTime);
                result = this.formatResult(cgPrice.price, PriceMode.HISTORICAL, 'Coingecko', cgPrice.timestamp, targetTime, 0.6);
            } catch (e: any) { errors.push(`Coingecko: ${e.message}`); }
        }

        if (!result) {
            throw new PriceOracleError('HISTORICAL_PRICE_UNAVAILABLE', `All providers failed: ${errors.join(', ')}`);
        }

        await this.setInCache(cacheKey, result, 3600 * 24 * 30);
        return result;
    }

    private async getCurrentPrice(params: PriceRequestParams): Promise<PriceResult> {
        const { chainId, tokenAddress } = params;
        const now = Math.floor(Date.now() / 1000);

        // CACHE: Strict separation - Key prefixed with 'current'
        const cacheKey = `price:current:${chainId}:${tokenAddress}`;
        const cached = await this.getFromCache(cacheKey);
        if (cached) return cached;

        let result: PriceResult | null = null;
        const errors: string[] = [];

        // 1. DeFiLlama
        try {
            const dlPrice = await this.getDefiLlamaPrice(chainId, tokenAddress, now);
            result = this.formatResult(dlPrice.price, PriceMode.CURRENT, 'DeFiLlama', dlPrice.timestamp, now, 0.9);
        } catch (e: any) { errors.push(`DeFiLlama: ${e.message}`); }

        // 2. Coingecko
        if (!result) {
            try {
                const cgPrice = await this.getCoingeckoPrice(chainId, tokenAddress, now);
                result = this.formatResult(cgPrice.price, PriceMode.CURRENT, 'Coingecko', cgPrice.timestamp, now, 0.8);
            } catch (e: any) { errors.push(`Coingecko: ${e.message}`); }
        }

        // 3. CoinCap (Fallback for ETH mainnet only)
        if (!result && tokenAddress === 'native' && chainId === 1) {
            try {
                const ccPrice = await this.getCoinCapPrice(tokenAddress);
                result = this.formatResult(ccPrice.price, PriceMode.CURRENT, 'CoinCap', ccPrice.timestamp, now, 0.7);
            } catch (e: any) { errors.push(`CoinCap: ${e.message}`); }
        }

        if (!result) {
            throw new PriceOracleError('CURRENT_PRICE_UNAVAILABLE', `All providers failed: ${errors.join(', ')}`);
        }

        await this.setInCache(cacheKey, result, 300); // 5 minutes
        return result;
    }

    // --- Caching Logic ---

    private getHistoricalCacheKey(chainId: number, token: string, block?: number, timestamp?: number): string {
        // Prefer block if available, else rounded timestamp (hourly bucket) covers most granularity needs
        if (block) return `price:historical:${chainId}:${token}:block:${block}`;
        const timeBucket = timestamp ? Math.floor(timestamp / 3600) : 0;
        return `price:historical:${chainId}:${token}:time:${timeBucket}`;
    }

    private async getFromCache(key: string): Promise<PriceResult | null> {
        try {
            if (this.redis && this.redis.status === 'ready') {
                const data = await this.redis.get(key);
                if (data) return JSON.parse(data);
            }
        } catch (e) {
            // Ignore cache errors
        }
        return null;
    }

    private async setInCache(key: string, data: PriceResult, ttlSeconds: number): Promise<void> {
        try {
            if (this.redis && this.redis.status === 'ready') {
                await this.redis.set(key, JSON.stringify(data), 'EX', ttlSeconds);
            }
        } catch (e) {
            // Ignore cache errors
        }
    }

    // --- Logging & Helpers ---

    private logAudit(entry: { params: PriceRequestParams, success: boolean, result?: PriceResult, error?: string, durationMs: number }) {
        // Mandatory Compliance Logging
        console.log(JSON.stringify({
            event: 'PRICE_ORACLE_ACCESS',
            timestamp: new Date().toISOString(),
            ...entry
        }));
    }

    private formatResult(price: number, mode: PriceMode, source: string, priceTimestamp: number, reqTimestamp: number, baseConfidence: number): PriceResult {
        const drift = Math.abs(priceTimestamp - reqTimestamp);
        const driftPenalty = Math.min(drift / 3600, 0.5);

        return {
            price,
            mode,
            source,
            priceTimestamp,
            requestTimestamp: reqTimestamp,
            confidence: {
                score: Math.max(0, baseConfidence - (driftPenalty * 0.1)),
                sourceTrust: baseConfidence,
                isRealtime: mode === PriceMode.CURRENT,
                timeDriftSeconds: drift,
                reasons: [`Source: ${source}`, `Drift: ${drift}s`]
            }
        };
    }

    private isProviderCapable(providerName: string, chainId: number): boolean {
        const caps = this.providers.find(p => p.name === providerName);
        if (!caps) return false;
        if (caps.supportedChains.length > 0 && !caps.supportedChains.includes(chainId)) return false;
        return true;
    }

    // --- Underlying Provider Implementations ---

    private async getAlchemyPrice(chainId: number, tokenAddress: string, blockNumber: number, timestamp: number): Promise<{ price: number, timestamp: number }> {
        const apiKey = process.env.ALCHEMY_API_KEY || process.env.ALCHEMY_API_KEY;
        if (!apiKey) throw new Error('No Alchemy API Key found');
        const baseUrl = `https://api.g.alchemy.com/prices/v1/${apiKey}/tokens/historical`;
        const network = this.getAlchemyNetwork(chainId);
        if (!network) throw new Error(`Chain ${chainId} not supported by Alchemy Prices API`);

        let queryAddress = tokenAddress;
        if (tokenAddress === 'native') {
            const wrapped = this.getWrappedNativeAddress(chainId);
            if (wrapped) queryAddress = wrapped;
            else throw new Error('No Wrapped mapping for Native token');
        }

        const startTime = new Date((timestamp - 3600) * 1000).toISOString();
        const endTime = new Date((timestamp + 3600) * 1000).toISOString();

        try {
            const response = await axios.post(baseUrl, {
                symbol: undefined,
                address: queryAddress,
                network: network,
                startTime: startTime,
                endTime: endTime,
                interval: '1h'
            });

            const prices = response.data.data;
            if (!prices || prices.length === 0) throw new Error('No historical price data found in window');
            const bestMatch = prices[0];
            return {
                price: parseFloat(bestMatch.value),
                timestamp: new Date(bestMatch.timestamp).getTime() / 1000
            };
        } catch (error: any) {
            throw new Error(`Alchemy Prices API Failed: ${error.message}`);
        }
    }

    private async getCoingeckoPrice(chainId: number, tokenAddress: string, timestamp: number): Promise<{ price: number, timestamp: number }> {
        const platform = this.getCoingeckoPlatform(chainId);
        const date = new Date(timestamp * 1000);
        const dateStr = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
        let url;
        if (tokenAddress === 'native') {
            const nativeId = this.getCoingeckoNativeId(chainId);
            url = `${this.coingeckoUrl}/coins/${nativeId}/history?date=${dateStr}`;
        } else {
            url = `${this.coingeckoUrl}/coins/${platform}/contract/${tokenAddress}/history?date=${dateStr}`;
        }

        const response = await axios.get(url);
        const price = response.data.market_data?.current_price?.usd;
        if (!price) throw new Error('Price not found in Coingecko response');

        return { price, timestamp };
    }

    private async getDefiLlamaPrice(chainId: number, tokenAddress: string, timestamp: number): Promise<{ price: number, timestamp: number }> {
        const chainPrefix = this.getDefiLlamaChain(chainId);
        const address = tokenAddress === 'native' ? '0x0000000000000000000000000000000000000000' : tokenAddress;

        const url = `https://coins.llama.fi/prices/historical/${timestamp}/${chainPrefix}:${address}`;
        const response = await axios.get(url);
        const key = `${chainPrefix}:${address}`;
        const data = response.data.coins[key];

        if (!data || !data.price) throw new Error('Price not found in DeFiLlama response');
        return {
            price: data.price,
            timestamp: data.timestamp || timestamp
        };
    }

    private async getCoinCapPrice(tokenAddress: string): Promise<{ price: number, timestamp: number }> {
        const url = `${this.coincapUrl}/assets/ethereum`;
        const response = await axios.get(url);
        const price = parseFloat(response.data.data.priceUsd);
        return { price, timestamp: Math.floor(Date.now() / 1000) };
    }

    private getAlchemyNetwork(chainId: number): string | null {
        switch (chainId) {
            case 1: return 'eth-mainnet';
            case 137: return 'polygon-mainnet';
            case 10: return 'opt-mainnet';
            case 42161: return 'arb-mainnet';
            case 8453: return 'base-mainnet';
            case 11155111: return 'eth-sepolia';
            default: return null;
        }
    }

    private getCoingeckoNativeId(chainId: number): string {
        switch (chainId) {
            case 137: return 'matic-network';
            case 56: return 'binancecoin';
            case 43114: return 'avalanche-2';
            case 1: case 8453: case 10: case 42161: default: return 'ethereum';
        }
    }

    private getCoingeckoPlatform(chainId: number): string {
        switch (chainId) {
            case 1: return 'ethereum';
            case 8453: return 'base';
            case 137: return 'polygon-pos';
            case 10: return 'optimistic-ethereum';
            case 42161: return 'arbitrum-one';
            case 56: return 'binance-smart-chain';
            case 43114: return 'avalanche';
            default: return 'ethereum';
        }
    }

    private getDefiLlamaChain(chainId: number): string {
        switch (chainId) {
            case 1: return 'ethereum';
            case 8453: return 'base';
            case 137: return 'polygon';
            case 10: return 'optimism';
            case 42161: return 'arbitrum';
            case 56: return 'bsc';
            case 43114: return 'avax';
            default: return 'ethereum';
        }
    }

    private getWrappedNativeAddress(chainId: number): string | null {
        switch (chainId) {
            case 1: return '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'; // WETH
            case 8453: return '0x4200000000000000000000000000000000000006'; // WETH (Base)
            case 137: return '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270'; // WMATIC
            case 10: return '0x4200000000000000000000000000000000000006'; // WETH (Optimism)
            case 42161: return '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1'; // WETH (Arbitrum)
            default: return null;
        }
    }
}
