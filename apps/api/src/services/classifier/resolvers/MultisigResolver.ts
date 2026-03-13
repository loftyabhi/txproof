// ═══ FILE: resolvers/MultisigResolver.ts ═══
import { Transaction, Receipt, ExecutionType, ExecutionDetails } from '../core/types';
import { EVM } from '../infrastructure/constants/evm';

export class MultisigResolver {
    static async resolve(tx: Transaction, receipt: Receipt): Promise<ExecutionDetails | null> {
        // Check for Gnosis Safe execTransaction selector
        if (tx.data.startsWith(EVM.SAFE_EXEC_TRANSACTION_SELECTOR)) {
            // It's a Gnosis safe transaction
            // The safe is the `to` address. The internal target require decoding the calldata, 
            // but for classification purposes we treat the safe as a multisig router.
            return {
                effectiveTo: tx.to,
                isProxy: false,
                implementation: null,
                executionType: ExecutionType.MULTISIG
            };
        }

        const safeSuccess = receipt.logs.find(l => l.topics[0] === EVM.SAFE_EXECUTION_SUCCESS_TOPIC);
        const safeFail = receipt.logs.find(l => l.topics[0] === EVM.SAFE_EXECUTION_FAILURE_TOPIC);

        if (safeSuccess || safeFail) {
            return {
                effectiveTo: tx.to,
                isProxy: false,
                implementation: null,
                executionType: ExecutionType.MULTISIG
            }
        }

        return null;
    }
}
