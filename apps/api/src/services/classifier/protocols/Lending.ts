import { Transaction, Receipt, Log, TransactionType, IProtocolDetector, ProtocolMatch } from '../types';

const LENDING_EVENTS = {
    // Aave
    DEPOSIT: '0xde6857219544bb5b7746f48ed30be6386fefc61b2f864cacf559893bf50fd951',
    WITHDRAW: '0x3115d1449a7b732c986cba18244e897a450f61e1bb8d589cd2e69e6c8924f9f7',
    BORROW: '0xc6a898309e823ee50bac64e45ca8adba6690e99e7841c45d754e2a38e9019d9b',
    REPAY: '0x4cdde6e09bb755c9a5589ebaec640bbfedff1362d4b255ebf8339782b9942faa',
    LIQUIDATION: '0xe413a321e8681d831f4dbccbca790d2952b56f977908e45be37335533e005286',

    // Compound
    MINT: '0x4c209b5fc8ad50758f13e2e1088ba56a560dff690a1c6fef26394f4c03821c4f', // Similar to generic Mint, context needed
    REDEEM: '0xe5b754fb1abb7f01b499791d0b820ae3b6af3424ac1c59768edb53f4ec31a929',
};

const KNOWN_LENDING_POOLS: Record<string, string> = {
    '0x7d2768de32b0b80b7a3454c06bdac94a69ddc7a9': 'Aave V2',
    '0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2': 'Aave V3',
    '0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b': 'Compound Comptroller',
};

export class LendingDetector implements IProtocolDetector {
    id = 'lending';

    async detect(tx: Transaction, receipt: Receipt): Promise<ProtocolMatch | null> {
        const logs = receipt.logs;
        const to = tx.to?.toLowerCase();

        // 1. Check Aave Events
        if (logs.some(l => l.topics[0] === LENDING_EVENTS.DEPOSIT)) return { name: 'Aave', confidence: 0.95, type: TransactionType.LENDING_DEPOSIT };
        if (logs.some(l => l.topics[0] === LENDING_EVENTS.WITHDRAW)) return { name: 'Aave', confidence: 0.95, type: TransactionType.LENDING_WITHDRAW };
        if (logs.some(l => l.topics[0] === LENDING_EVENTS.BORROW)) return { name: 'Aave', confidence: 0.95, type: TransactionType.LENDING_BORROW };
        if (logs.some(l => l.topics[0] === LENDING_EVENTS.REPAY)) return { name: 'Aave', confidence: 0.95, type: TransactionType.LENDING_REPAY };
        if (logs.some(l => l.topics[0] === LENDING_EVENTS.LIQUIDATION)) return { name: 'Aave', confidence: 0.95, type: TransactionType.LENDING_LIQUIDATION };

        // 2. Check Compound Events (with Address Check)
        if (to && (KNOWN_LENDING_POOLS[to] || logs.some(l => l.topics[0] === LENDING_EVENTS.REDEEM))) {
            const isMint = logs.some(l => l.topics[0] === LENDING_EVENTS.MINT);
            if (isMint) return { name: 'Compound', confidence: 0.9, type: TransactionType.LENDING_DEPOSIT };

            const isRedeem = logs.some(l => l.topics[0] === LENDING_EVENTS.REDEEM);
            if (isRedeem) return { name: 'Compound', confidence: 0.9, type: TransactionType.LENDING_WITHDRAW };
        }

        return null;
    }
}
