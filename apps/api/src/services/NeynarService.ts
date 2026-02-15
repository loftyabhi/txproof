import axios from 'axios';
import { logger } from '../lib/logger';

export interface NeynarCastAuthor {
    fid: number;
    username: string;
    display_name: string;
    pfp_url: string;
}

export interface NeynarCast {
    hash: string;
    author: NeynarCastAuthor;
    text: string;
    timestamp: string;
    parent_url?: string;
    parent_hash?: string;
    embeds: any[];
}

export class NeynarService {
    private readonly baseUrl = 'https://api.neynar.com/v2/farcaster';

    private getApiKey(): string {
        const key = process.env.NEYNAR_API_KEY || '';
        if (!key) {
            logger.warn('[NeynarService] NEYNAR_API_KEY is missing.');
        }
        return key;
    }

    /**
     * Fetch a cast by its hash
     */
    async getCast(hash: string): Promise<NeynarCast> {
        const apiKey = this.getApiKey();
        if (!apiKey) {
            throw new Error('Neynar API key is required');
        }

        try {
            const response = await axios.get(`${this.baseUrl}/cast`, {
                params: {
                    identifier: hash,
                    type: 'hash'
                },
                headers: {
                    accept: 'application/json',
                    api_key: apiKey
                }
            });

            if (!response.data.cast) {
                throw new Error('Cast not found');
            }

            return response.data.cast;
        } catch (error: any) {
            logger.error('[NeynarService] Failed to fetch cast', { hash, error: error.message });
            throw new Error(`Farcaster resolution failed: ${error.response?.data?.message || error.message}`);
        }
    }
}

export const neynarService = new NeynarService();
