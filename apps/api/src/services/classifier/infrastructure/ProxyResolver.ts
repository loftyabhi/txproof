// ═══ FILE: infrastructure/ProxyResolver.ts ═══
import { Receipt, ExecutionDetails } from '../core/types';
import { EVM } from './constants/evm';

export class ProxyResolver {
    /**
     * Determines if the resolved address is a proxy.
     * Note: Full on-chain proxy detection requires 'eth_getStorageAt' or 'eth_getCode', 
     * which is out of scope for a pure receipt-based classifier unless an Upgrade event 
     * is emitted in the exact same transaction, or if we have off-chain data.
     * 
     * For now, this is a stub that checks for upgrade events in the receipt.
     */
    static resolve(baseDetails: ExecutionDetails, receipt: Receipt): ExecutionDetails {
        let isProxy = baseDetails.isProxy;
        let implementation = baseDetails.implementation;

        // Check for EIP-1967 proxy upgrade event
        const upgradeLog = receipt.logs.find(l =>
            l.topics[0] === EVM.PROXY_UPGRADED_TOPIC &&
            l.address.toLowerCase() === baseDetails.effectiveTo?.toLowerCase()
        );

        if (upgradeLog && upgradeLog.topics.length >= 2) {
            isProxy = true;
            const implPadded = upgradeLog.topics[1];
            implementation = '0x' + implPadded.slice(-40);
        }

        return {
            ...baseDetails,
            isProxy,
            implementation
        };
    }
}
