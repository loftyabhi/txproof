import { Transaction, Receipt, Log, ExecutionType, IExecutionResolver } from '../types';

export class DirectResolver implements IExecutionResolver {
    async resolve(tx: Transaction, receipt: Receipt, logs: Log[]): Promise<ExecutionType> {
        // Direct if from EOA and no special wrapper detected.
        // This is the default fallthrough, but explicitly:
        // If it's a standard transfer or simple contract call without internal delegation layers we treat it as direct.
        // However, "Direct" is often the fallback if others return unknown.

        // We will return UNKNOWN here so the chain of command can continue, 
        // or we can implement a logic that if nothing else matches, it is direct.
        // Usually, the engine will try specific resolvers (AA, Multisig) then fall back to Direct.
        return ExecutionType.UNKNOWN;
    }
}
