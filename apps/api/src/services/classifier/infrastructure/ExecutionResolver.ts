// ═══ FILE: infrastructure/ExecutionResolver.ts ═══
import { Transaction, Receipt, ExecutionDetails } from '../core/types';
import { RegistrySnapshot } from './ProtocolRegistry';
import { AccountAbstractionResolver } from '../resolvers/AccountAbstractionResolver';
import { MultisigResolver } from '../resolvers/MultisigResolver';
import { DirectResolver } from '../resolvers/DirectResolver';
import { ProxyResolver } from './ProxyResolver';

export class ExecutionResolver {
    /**
     * Determines the primary execution wrapper of the transaction (AA, Multisig, Direct, Proxy).
     * Returns the 'effective' destination of the call (e.g. inner address instead of EntryPoint).
     */
    static async resolve(
        tx: Transaction,
        receipt: Receipt,
        snapshot: RegistrySnapshot,
        chainId: number
    ): Promise<ExecutionDetails> {
        let details = await AccountAbstractionResolver.resolve(tx, receipt);

        if (!details) {
            details = await MultisigResolver.resolve(tx, receipt);
        }

        if (!details) {
            details = await DirectResolver.resolve(tx, receipt);
        }

        // Wrap with proxy detection
        return ProxyResolver.resolve(details, receipt);
    }
}
