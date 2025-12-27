import axios from 'axios';

interface PriceData {
    price: number;
    source: string;
    timestamp: number;
}

export class PriceOracleService {
    private readonly coingeckoUrl = 'https://api.coingecko.com/api/v3';
    private readonly defillamaUrl = 'https://coins.llama.fi/prices/current';
    private readonly coincapUrl = 'https://api.coincap.io/v2';

    /**
     * Get historical price for a token at a specific timestamp.
     * @param chainId The chain ID (e.g., 1 for ETH, 8453 for Base).
     * @param tokenAddress The token address (or 'native' for ETH).
     * @param timestamp Unix timestamp in seconds.
     */
    async getPrice(chainId: number, tokenAddress: string, timestamp: number): Promise<PriceData> {
        // Try Coingecko first (Best for historical)
        try {
            return await this.getCoingeckoPrice(chainId, tokenAddress, timestamp);
        } catch (error) {
            console.warn('Coingecko failed, trying DeFiLlama...');
        }

        // Try DeFiLlama (Good for current/recent)
        try {
            return await this.getDefiLlamaPrice(chainId, tokenAddress, timestamp);
        } catch (error) {
            console.warn('DeFiLlama failed, trying CoinCap...');
        }

        // Try CoinCap (Backup)
        try {
            return await this.getCoinCapPrice(tokenAddress);
        } catch (error) {
            console.error('All price sources failed');
            throw new Error('Failed to fetch price from all sources');
        }
    }

    private async getCoingeckoPrice(chainId: number, tokenAddress: string, timestamp: number): Promise<PriceData> {
        // Map ChainID to Coingecko Platform ID
        const platform = this.getCoingeckoPlatform(chainId);
        const date = new Date(timestamp * 1000);
        const dateStr = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`; // DD-MM-YYYY

        let url;
        if (tokenAddress === 'native') {
            url = `${this.coingeckoUrl}/coins/ethereum/history?date=${dateStr}`; // Simplifying native to ETH for now, mostly accurate for L2s
        } else {
            url = `${this.coingeckoUrl}/coins/${platform}/contract/${tokenAddress}/history?date=${dateStr}`;
        }

        const response = await axios.get(url);
        const price = response.data.market_data?.current_price?.usd;

        if (!price) throw new Error('Price not found in Coingecko response');

        return {
            price,
            source: 'Coingecko',
            timestamp
        };
    }

    private async getDefiLlamaPrice(chainId: number, tokenAddress: string, timestamp: number): Promise<PriceData> {
        // DefiLlama historical: https://coins.llama.fi/prices/historical/{timestamp}/{chain}:{address}
        const chainPrefix = this.getDefiLlamaChain(chainId);
        // Special case for native
        const address = tokenAddress === 'native' ? '0x0000000000000000000000000000000000000000' : tokenAddress;

        const url = `https://coins.llama.fi/prices/historical/${timestamp}/${chainPrefix}:${address}`;
        const response = await axios.get(url);

        const key = `${chainPrefix}:${address}`;
        const price = response.data.coins[key]?.price;

        if (!price) throw new Error('Price not found in DeFiLlama response');

        return {
            price,
            source: 'DeFiLlama',
            timestamp
        };
    }

    private async getCoinCapPrice(tokenAddress: string): Promise<PriceData> {
        // CoinCap is limited for historical/tokens, using as rough fallback for current ETH
        const url = `${this.coincapUrl}/assets/ethereum`;
        const response = await axios.get(url);
        const price = parseFloat(response.data.data.priceUsd);

        return {
            price,
            source: 'CoinCap (Fallback)',
            timestamp: Math.floor(Date.now() / 1000)
        };
    }

    private getCoingeckoPlatform(chainId: number): string {
        switch (chainId) {
            case 1: return 'ethereum';
            case 8453: return 'base';
            case 137: return 'polygon-pos';
            default: return 'ethereum';
        }
    }

    private getDefiLlamaChain(chainId: number): string {
        switch (chainId) {
            case 1: return 'ethereum';
            case 8453: return 'base';
            case 137: return 'polygon';
            default: return 'ethereum';
        }
    }
}
