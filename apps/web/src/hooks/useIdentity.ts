import { useState, useEffect } from 'react';
import { createPublicClient, http } from 'viem';
import { mainnet, base } from 'viem/chains';
import { normalize } from 'viem/ens';

type Identity = {
    name: string | null;
    avatar: string | null;
    source: 'ens' | 'base' | null;
};

const CACHE_KEY_PREFIX = 'identity_v1_';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 Days

// Static Clients (Outside component to avoid recreation)
// We rely on public RPCs or env vars if available to avoid rate limits if possible.
const ethClient = createPublicClient({
    chain: mainnet,
    transport: http(process.env.NEXT_PUBLIC_ALCHEMY_API_KEY ? `https://eth-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}` : undefined)
});

const baseClient = createPublicClient({
    chain: base,
    transport: http(process.env.NEXT_PUBLIC_ALCHEMY_API_KEY ? `https://base-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}` : undefined)
});

export function useIdentity(address: string | undefined, chainId?: number) {
    const [identity, setIdentity] = useState<Identity | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!address) {
            setIdentity(null);
            return;
        }

        const cacheKey = `${CACHE_KEY_PREFIX}${address.toLowerCase()}`;

        const resolveIdentity = (cachedData: any) => {
            const { ens, base: baseId } = cachedData;

            // Priority Logic:
            // 1. If on Base Chain, prefer Basename
            // 2. Otherwise, prefer ENS
            // 3. Fallback to whichever exists

            if (chainId === 8453 && baseId?.name) { // Base Mainnet
                setIdentity({ ...baseId, source: 'base' });
            } else if (ens?.name) {
                setIdentity({ ...ens, source: 'ens' });
            } else if (baseId?.name) {
                setIdentity({ ...baseId, source: 'base' });
            } else {
                setIdentity(null);
            }
        };

        // 1. Check Cache
        const cached = localStorage.getItem(cacheKey);
        let shoudFetch = true;

        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                const age = Date.now() - parsed.timestamp;
                if (age < CACHE_DURATION) {
                    resolveIdentity(parsed.data);
                    shoudFetch = false;
                    // If we have cached data, we don't return early strictly; 
                    // we could technically background-refresh, but for now specific "CACHE_DURATION" implies validness.
                    // However, if the priority source is MISSING in cache (e.g. newly registered), we might want to re-check?
                    // For simplicity and perf: Trust cache.
                }
            } catch (e) {
                localStorage.removeItem(cacheKey);
            }
        }

        if (!shoudFetch) return;

        // 2. Fetch if miss
        const fetchIdentity = async () => {
            setLoading(true);
            try {
                const [ensName, baseName] = await Promise.all([
                    ethClient.getEnsName({ address: address as `0x${string}` }).catch(() => null),
                    baseClient.getEnsName({ address: address as `0x${string}` }).catch(() => null)
                ]);

                const [ensAvatar, baseAvatar] = await Promise.all([
                    ensName ? ethClient.getEnsAvatar({ name: normalize(ensName) }).catch(() => null) : null,
                    baseName ? baseClient.getEnsAvatar({ name: normalize(baseName) }).catch(() => null) : null
                ]);

                const fullData = {
                    ens: { name: ensName, avatar: ensAvatar },
                    base: { name: baseName, avatar: baseAvatar }
                };

                // Save raw dual-source data
                localStorage.setItem(cacheKey, JSON.stringify({
                    timestamp: Date.now(),
                    data: fullData
                }));

                resolveIdentity(fullData);

            } catch (error) {
                console.error("Identity fetch failed", error);
            } finally {
                setLoading(false);
            }
        };

        fetchIdentity();

    }, [address, chainId]); // Re-run when chain changes to switch display preference

    return { ...identity, loading };
}
