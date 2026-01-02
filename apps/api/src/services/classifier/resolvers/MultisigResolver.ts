import { Transaction, Receipt, Log, ExecutionType, IExecutionResolver } from '../types';

const SAFE_SIGNATURES = {
    // execTransaction(address,uint256,bytes,uint8,uint256,uint256,uint256,address,address,bytes)
    EXEC_TRANSACTION: '0x6a761202',
    // Event: ExecutionSuccess(bytes32 txHash, uint256 payment)
    EXECUTION_SUCCESS: '0x442e715f626346e8c54381002da614f62bee8cf2088c564363b46925e01e4756',
    // Event: ExecutionFailure(bytes32 txHash, uint256 payment)
    EXECUTION_FAILURE: '0x23428b18acfb3ea64b08dc0c1d476c9b20e41946905b9dde7984e005723701f0'
};

export class MultisigResolver implements IExecutionResolver {
    async resolve(tx: Transaction, receipt: Receipt, logs: Log[]): Promise<ExecutionType> {
        const input = tx.data.toLowerCase();

        // 1. Check Function Signature
        if (input.startsWith(SAFE_SIGNATURES.EXEC_TRANSACTION)) {
            return ExecutionType.MULTISIG;
        }

        // 2. Check Events
        // If the transaction emitted ExecutionSuccess from a Gnosis Safe, it's a multisig execution.
        // The address emitting the event is the Safe.
        const safeEvent = logs.find(l =>
            l.topics[0] === SAFE_SIGNATURES.EXECUTION_SUCCESS ||
            l.topics[0] === SAFE_SIGNATURES.EXECUTION_FAILURE
        );

        if (safeEvent) {
            return ExecutionType.MULTISIG;
        }

        return ExecutionType.UNKNOWN;
    }
}
