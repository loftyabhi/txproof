// ═══ FILE: resolvers/DirectResolver.ts ═══
import { Transaction, Receipt, ExecutionType, ExecutionDetails } from '../core/types';

export class DirectResolver {
    static async resolve(tx: Transaction, receipt: Receipt): Promise<ExecutionDetails> {
        return {
            effectiveTo: tx.to,
            isProxy: false,
            implementation: null,
            executionType: ExecutionType.DIRECT
        };
    }
}
