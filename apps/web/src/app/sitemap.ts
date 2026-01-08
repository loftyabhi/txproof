import { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://chainreceipt.vercel.app';

    return [
        { url: baseUrl, priority: 1 },
        { url: `${baseUrl}/how-to-read-blockchain-transaction` },
        { url: `${baseUrl}/transaction-intelligence` },
        { url: `${baseUrl}/features` },
        { url: `${baseUrl}/about-us` },
        { url: `${baseUrl}/contact-us` },
        { url: `${baseUrl}/support` },
        { url: `${baseUrl}/privacy-policy` },
        { url: `${baseUrl}/terms-of-service` },
        { url: `${baseUrl}/disclaimer` },
        // Learn Section
        { url: `${baseUrl}/learn` },
        { url: `${baseUrl}/learn/what-is-blockchain` },
        { url: `${baseUrl}/learn/ethereum-and-evm` },
        { url: `${baseUrl}/learn/how-transactions-work` },
        { url: `${baseUrl}/learn/what-is-a-smart-contract` },
        { url: `${baseUrl}/learn/defi-explained` },
        { url: `${baseUrl}/learn/nfts-explained` },
        { url: `${baseUrl}/learn/bridges-rollups-l2` },
        { url: `${baseUrl}/learn/state-and-data-structures` },
        { url: `${baseUrl}/learn/dao-and-governance` },
        { url: `${baseUrl}/learn/onchain-vs-offchain` },
        { url: `${baseUrl}/learn/consensus-mechanisms` },
        { url: `${baseUrl}/learn/stablecoins-and-monetary-design` },
        { url: `${baseUrl}/learn/blockspace-and-scalability-economics` },
        { url: `${baseUrl}/learn/mev-and-transaction-ordering` },
        { url: `${baseUrl}/learn/common-crypto-terms` },
    ].map((route) => ({
        ...route,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: route.priority ?? 0.8,
    }));
}
