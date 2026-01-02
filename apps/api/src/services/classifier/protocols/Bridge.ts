import { Transaction, Receipt, Log, TransactionType, IProtocolDetector, ProtocolMatch } from '../types';

const BRIDGE_EVENTS = {
    // Standard Bridge Events
    BRIDGE_TRANSFER_SENT: '0x73d170910aba9e6d50b102db522b1dbcd796216f5128b445aa2135272886497e', // WithdrawalInitiated
    BRIDGE_TRANSFER_RECEIVED: '0x1b2a7ff080b8cb6ff436ce0372e399692bbfb6d4ae5766fd8d58a7b8cc6142e6',

    // L2 Messaging
    MESSAGE_PASSED: '0x02a52367d10742d8032712c1bb8e0144ff1ec5ffda1ed7d70bb05a2744955054',
    RELAYED_MESSAGE: '0x4641df4a962071e12719d8c8c8e5ac7fc4d97b927346a3d7a335b1f7517e133c',
};

const KNOWN_BRIDGES: Record<string, string> = {
    '0x99c9fc46f92e8a1c0dec1b1747d010903e884be1': 'Optimism Bridge',
    '0x8315177ab297ba92a06054ce80a67ed4dbd7ed3a': 'Arbitrum Bridge',
    '0x49048044d57e1c92a77f79988d21fa8faf74e97e': 'Base Bridge',
    '0xa0c68c638235ee32657e8f720a23cec1bfc77c77': 'Polygon Bridge',
};

export class BridgeDetector implements IProtocolDetector {
    id = 'bridge';

    async detect(tx: Transaction, receipt: Receipt): Promise<ProtocolMatch | null> {
        const logs = receipt.logs;
        const to = tx.to?.toLowerCase();

        // 1. Check Known Bridge Addresses
        if (to && KNOWN_BRIDGES[to]) {
            const sent = logs.some(l => l.topics[0] === BRIDGE_EVENTS.BRIDGE_TRANSFER_SENT);
            if (sent) return { name: KNOWN_BRIDGES[to], confidence: 0.95, type: TransactionType.BRIDGE_WITHDRAW };

            return { name: KNOWN_BRIDGES[to], confidence: 0.95, type: TransactionType.BRIDGE_DEPOSIT };
        }

        // 2. Check Events
        if (logs.some(l => l.topics[0] === BRIDGE_EVENTS.MESSAGE_PASSED)) {
            return { name: 'L2 Bridge', confidence: 0.9, type: TransactionType.L2_DEPOSIT };
        }

        if (logs.some(l => l.topics[0] === BRIDGE_EVENTS.RELAYED_MESSAGE)) {
            return { name: 'L2 Bridge', confidence: 0.9, type: TransactionType.L2_WITHDRAWAL };
        }

        return null;
    }
}
