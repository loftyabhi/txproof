import { Transaction, Receipt, Log, TransactionType, IProtocolDetector, ProtocolMatch } from '../types';

const NFT_EVENTS = {
    // OpenSea Seaport 1.1 - 1.5
    ORDER_FULFILLED: '0x9d9af8e38d66c62e2c12f0225249fd9d721c54b83f48d9352c97c6cacdcb6f31',
    // LooksRare
    TAKER_ASK: '0x68cd251d4d267c6e2034ff0088b990352b97b2002c0476587d0c4da889c11330',
    TAKER_BID: '0x95fb6205e23ff6bda16a2d1dba56b9ad7c783f67c96fa149785052f47696f2be',
    // Blur
    ORDER_MATCHED: '0x61cbb2a3dee0b6064c2e681aadd61677fb4ef319f0b547508d495626f5a62f64',
    // X2Y2
    EVICT: '0x61cbb2a3dee0b6064c2e681aadd61677fb4ef319f0b547508d495626f5a62f64', // Note: X2Y2 signature varies, keeping simplified for now

    // Standard Transfers
    TRANSFER_721: '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
    TRANSFER_SINGLE: '0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62',
    TRANSFER_BATCH: '0x4a39dc06d4c0dbc64b70af90fd698a233a518aa5d07e595d983b8c0526c8f7fb',
};

const KNOWN_MARKETPLACES: Record<string, string> = {
    '0x00000000000000adc04c56bf30ac9d3c0aaf14dc': 'OpenSea (Seaport)',
    '0x59728544b08ab483533076417fbbb2fd0b17ce3a': 'LooksRare',
    '0x000000000000ad05ccc4f10045630fb830b95127': 'Blur',
    '0x74312363e45dcaba76c59ec49a7aa8a65a67eed3': 'X2Y2',
};

export class NFTDetector implements IProtocolDetector {
    id = 'nft';

    async detect(tx: Transaction, receipt: Receipt): Promise<ProtocolMatch | null> {
        const logs = receipt.logs;
        const to = tx.to?.toLowerCase();

        // 1. Check Marketplace Events
        const seaport = logs.find(l => l.topics[0] === NFT_EVENTS.ORDER_FULFILLED);
        if (seaport) return { name: 'OpenSea (Seaport)', confidence: 0.95, type: TransactionType.NFT_SALE };

        const looksRare = logs.find(l => l.topics[0] === NFT_EVENTS.TAKER_ASK || l.topics[0] === NFT_EVENTS.TAKER_BID);
        if (looksRare) return { name: 'LooksRare', confidence: 0.95, type: TransactionType.NFT_SALE };

        const blur = logs.find(l => l.topics[0] === NFT_EVENTS.ORDER_MATCHED);
        if (blur) return { name: 'Blur', confidence: 0.95, type: TransactionType.NFT_SALE };

        // 2. Check To Address (Fallback)
        if (to && KNOWN_MARKETPLACES[to]) {
            return { name: KNOWN_MARKETPLACES[to], confidence: 0.9, type: TransactionType.NFT_SALE };
        }

        // 3. Fallback: Check Basic NFT Transfers
        // A sale usually has >0 value or WETH transfer + NFT transfer.
        // Plain NFT transfer with 0 value is likely just a Transfer.
        // Minting comes from 0x0.

        const nftTransfers = logs.filter(l =>
            (l.topics[0] === NFT_EVENTS.TRANSFER_721 && l.topics.length === 4) ||
            l.topics[0] === NFT_EVENTS.TRANSFER_SINGLE ||
            l.topics[0] === NFT_EVENTS.TRANSFER_BATCH
        );

        if (nftTransfers.length > 0) {
            // Check for Mint
            const isMint = nftTransfers.some(l =>
                l.topics[1] === '0x0000000000000000000000000000000000000000000000000000000000000000' || // 721
                (l.topics[0] === NFT_EVENTS.TRANSFER_SINGLE && l.topics[2] === '0x0000000000000000000000000000000000000000000000000000000000000000') // 1155
            );

            if (isMint) {
                return { name: 'NFT Project', confidence: 0.9, type: TransactionType.NFT_MINT };
            }

            // Just Transfer
            return { name: 'Direct Transfer', confidence: 0.8, type: TransactionType.NFT_TRANSFER };
        }

        return null;
    }
}
