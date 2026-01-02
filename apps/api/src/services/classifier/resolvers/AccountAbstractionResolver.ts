import { Transaction, Receipt, Log, ExecutionType, IExecutionResolver } from '../types';

const AA_SIGNATURES = {
    // handleOps(tuple[],address)
    HANDLE_OPS: '0x1fad948c',
    // handleAggregatedOps(tuple[],address)
    HANDLE_AGGREGATED_OPS: '0x4b1d7cf5',
    // Event: UserOperationEvent(...)
    USER_OPERATION_EVENT: '0x49628fd147100edb3ef1d7634f6e33006d4e28293976af321d22cb2b05c751a3'
};

const ENTRY_POINTS = [
    '0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789', // v0.6
    '0x0000000071727De22E5E9d8BAf0edAc6f37da032', // v0.7
].map(a => a.toLowerCase());

export class AccountAbstractionResolver implements IExecutionResolver {
    async resolve(tx: Transaction, receipt: Receipt, logs: Log[]): Promise<ExecutionType> {
        const to = tx.to?.toLowerCase();
        const input = tx.data.toLowerCase();

        // 1. Check EntryPoint Interactions
        if (to && ENTRY_POINTS.includes(to)) {
            if (input.startsWith(AA_SIGNATURES.HANDLE_OPS) ||
                input.startsWith(AA_SIGNATURES.HANDLE_AGGREGATED_OPS)) {
                return ExecutionType.ACCOUNT_ABSTRACTION;
            }
        }

        // 2. Check Events (UserOperationEvent)
        // This event is emitted by the EntryPoint
        const aaEvent = logs.find(l =>
            l.topics[0] === AA_SIGNATURES.USER_OPERATION_EVENT
        );

        if (aaEvent) {
            return ExecutionType.ACCOUNT_ABSTRACTION;
        }

        return ExecutionType.UNKNOWN;
    }
}
