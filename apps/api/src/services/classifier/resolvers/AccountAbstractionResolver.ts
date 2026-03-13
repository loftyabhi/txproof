// ═══ FILE: resolvers/AccountAbstractionResolver.ts ═══
import { Transaction, Receipt, ExecutionType, ExecutionDetails } from '../core/types';
import { EVM } from '../infrastructure/constants/evm';

export class AccountAbstractionResolver {
    static async resolve(tx: Transaction, receipt: Receipt): Promise<ExecutionDetails | null> {
        // Check for ERC-4337 UserOperationEvent
        const userOpLog = receipt.logs.find(
            l => l.topics[0] === EVM.AA_USER_OPERATION_EVENT_TOPIC
        );

        if (userOpLog && userOpLog.topics.length >= 3) {
            // topic[2] is the sender of the UserOperation (the smart account)
            const senderPadded = userOpLog.topics[2];
            const sender = '0x' + senderPadded.slice(-40);

            return {
                effectiveTo: sender.toLowerCase(),
                isProxy: false,
                implementation: null,
                executionType: ExecutionType.ACCOUNT_ABSTRACTION
            };
        }

        // Check for handleOps selector
        if (tx.data.startsWith(EVM.AA_HANDLE_OPS_SELECTOR) || tx.data.startsWith(EVM.AA_HANDLE_AGGREGATED_OPS_SELECTOR)) {
            return {
                effectiveTo: null, // the entry point router is `to`, inner target unknown without deep decode
                isProxy: false,
                implementation: null,
                executionType: ExecutionType.ACCOUNT_ABSTRACTION
            };
        }

        return null;
    }
}
