// src/services/classifier/infrastructure/TokenFlow.ts
import { Log, Address, TokenFlow, TokenMovement } from '../core/types';
import { Decoder } from '../utils';

export class TokenFlowAnalyzer {
    // Phase 4: Unified Token Flow including Internal Transactions
    static analyze(
        logs: Log[],
        nativeValue: string,
        from: Address,
        to: Address | null,
        internalTransactions: any[] = []
    ): TokenFlow {
        const flow: TokenFlow = {};

        const ensureRecord = (addr: Address) => {
            const normalized = addr.toLowerCase();
            if (!flow[normalized]) {
                flow[normalized] = { incoming: [], outgoing: [] };
            }
            return normalized;
        };

        // 1. Top-Level Native Transfer
        try {
            const val = BigInt(nativeValue);
            if (val > BigInt(0) && to) {
                const sender = ensureRecord(from);
                const receiver = ensureRecord(to);

                const movement: TokenMovement = {
                    asset: 'native',
                    amount: val.toString(),
                    type: 'NATIVE'
                };

                flow[sender].outgoing.push(movement);
                flow[receiver].incoming.push(movement);
            }
        } catch (e) { /* ignore */ }

        // 2. Internal Transactions (Native transfers in traces)
        // Expected format: { from: string, to: string, value: string, type: string }
        for (const internalTx of internalTransactions) {
            try {
                // Only care about value transfers
                const val = BigInt(internalTx.value || '0');
                if (val > BigInt(0) && internalTx.to) {
                    const sender = ensureRecord(internalTx.from);
                    const receiver = ensureRecord(internalTx.to);

                    const movement: TokenMovement = {
                        asset: 'native',
                        amount: val.toString(),
                        type: 'NATIVE'
                    };

                    flow[sender].outgoing.push(movement);
                    flow[receiver].incoming.push(movement);
                }
            } catch (e) {
                // Skip malformed internal txs
            }
        }

        // 3. Parse Logs (ERC20/721)
        for (const log of logs) {
            const logAddr = log.address.toLowerCase();

            // ERC20
            const erc20 = Decoder.decodeERC20Transfer(log);
            if (erc20) {
                const fromAddr = ensureRecord(erc20.args[0]);
                const toAddr = ensureRecord(erc20.args[1]);
                const movement: TokenMovement = {
                    asset: logAddr,
                    amount: erc20.args[2].toString(),
                    type: 'ERC20'
                };
                flow[fromAddr].outgoing.push(movement);
                flow[toAddr].incoming.push(movement);
                continue;
            }

            // ERC721
            const erc721 = Decoder.decodeERC721Transfer(log);
            if (erc721) {
                const fromAddr = ensureRecord(erc721.args[0]);
                const toAddr = ensureRecord(erc721.args[1]);
                const movement: TokenMovement = {
                    asset: logAddr,
                    amount: '1',
                    tokenId: erc721.args[2].toString(),
                    type: 'ERC721'
                };
                flow[fromAddr].outgoing.push(movement);
                flow[toAddr].incoming.push(movement);
                continue;
            }

            // TODO: ERC1155
        }

        return flow;
    }
}
