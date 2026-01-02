// src/services/classifier/infrastructure/ExecutionResolver.ts
import { Transaction, Receipt, Address, Log } from '../core/types';

export interface ExecutionDetails {
    effectiveTo: Address;
    isProxy: boolean;
    isMultisig: boolean;
    isDelegateCall: boolean;
    implementation?: Address;
    resolutionMethod: string;
}

/**
 * ExecutionResolver: Resolves the true execution target before rule evaluation.
 * MANDATORY: This must run BEFORE any rule accesses transaction data.
 */
export class ExecutionResolver {
    /**
     * Resolves the effective execution target using event-based heuristics.
     * Does NOT require external RPC calls - uses transaction receipt data only.
     */
    static resolve(tx: Transaction, receipt: Receipt): ExecutionDetails {
        const to = tx.to ? tx.to.toLowerCase() : '0x0000000000000000000000000000000000000000';

        // 1. Contract Creation - No resolution needed
        if (!tx.to) {
            return {
                effectiveTo: receipt.contractAddress ? receipt.contractAddress.toLowerCase() : to,
                isProxy: false,
                isMultisig: false,
                isDelegateCall: false,
                resolutionMethod: 'CONTRACT_CREATION'
            };
        }

        // 2. Proxy Detection (EIP-1967 Upgraded Event)
        // Topic0: 0xbc7cd75a20ee27fd9adebab32041f755214dbc6bffa90cc0225b39da2e5c2d3b
        const UPGRADED_TOPIC = '0xbc7cd75a20ee27fd9adebab32041f755214dbc6bffa90cc0225b39da2e5c2d3b';

        const upgradeLog = receipt.logs.find(l =>
            l.address.toLowerCase() === to &&
            l.topics[0] === UPGRADED_TOPIC
        );

        if (upgradeLog && upgradeLog.topics.length > 1) {
            const implementation = this.normalizeAddress(upgradeLog.topics[1]);
            return {
                effectiveTo: implementation,
                isProxy: true,
                isMultisig: false,
                isDelegateCall: true,
                implementation,
                resolutionMethod: 'EIP1967_UPGRADED_EVENT'
            };
        }

        // 3. Gnosis Safe / Multisig Detection
        // ExecutionSuccess: 0x442e715f626346e8c54381002da614f62bee8cf20d562551b48bcc039601db86
        // ExecutionFailure: 0x23428b18acfb3ea64b08dc0c1d296ea9c09702c09083ca5272e64d115b687d23
        const SAFE_EXEC_SUCCESS = '0x442e715f626346e8c54381002da614f62bee8cf20d562551b48bcc039601db86';
        const SAFE_EXEC_FAILURE = '0x23428b18acfb3ea64b08dc0c1d296ea9c09702c09083ca5272e64d115b687d23';

        const safeExecLog = receipt.logs.find(l =>
            l.address.toLowerCase() === to &&
            (l.topics[0] === SAFE_EXEC_SUCCESS || l.topics[0] === SAFE_EXEC_FAILURE)
        );

        if (safeExecLog) {
            // For multisig, we cannot easily extract the target from events
            // without decoding the execTransaction call data.
            // We mark it as multisig and use tx.to as effectiveTo
            return {
                effectiveTo: to,
                isProxy: true, // Multisig acts as a proxy
                isMultisig: true,
                isDelegateCall: false,
                resolutionMethod: 'GNOSIS_SAFE_MULTISIG'
            };
        }

        // 4. Generic DelegateCall Detection (via internal transactions)
        // Note: This requires trace data which may not be available in basic receipts
        // For now, we skip this and rely on event-based detection

        // 5. No proxy detected - use direct target
        return {
            effectiveTo: to,
            isProxy: false,
            isMultisig: false,
            isDelegateCall: false,
            resolutionMethod: 'DIRECT_CALL'
        };
    }

    private static normalizeAddress(topic: string): Address {
        // Topics are 32 bytes, address is last 20 bytes
        return '0x' + topic.slice(-40).toLowerCase();
    }
}
