// ═══ FILE: infrastructure/TokenFlow.ts ═══
import { EVM, isERC20Transfer, isERC721Transfer, isMintTransfer, isBurnTransfer } from './constants/evm';
import { Log, TokenFlow, TokenMovement } from '../core/types';

export class TokenFlowAnalyzer {
    /**
     * Analyze tx value and logs to produce a unified map of token movements per address.
     */
    static analyze(
        logs: Log[],
        value: string,
        from: string,
        to: string | null,
        internalTxs: any[], // ignored for standard receipts
        dustThreshold: bigint
    ): TokenFlow {
        const flow: TokenFlow = {};

        const addMovement = (address: string, movement: TokenMovement) => {
            const normalized = address.toLowerCase();
            if (!flow[normalized]) {
                flow[normalized] = { incoming: [], outgoing: [] };
            }
            if (movement.from.toLowerCase() === normalized) {
                flow[normalized].outgoing.push(movement);
            }
            if (movement.to.toLowerCase() === normalized) {
                flow[normalized].incoming.push(movement);
            }
        };

        // 1. Process NATIVE value
        if (value && BigInt(value) > 0n && to) {
            const m: TokenMovement = {
                asset: '0x0000000000000000000000000000000000000000',
                amount: value,
                type: 'NATIVE',
                from: from.toLowerCase(),
                to: to.toLowerCase(),
                role: 'UNKNOWN'
            };
            addMovement(m.from, m);
            addMovement(m.to, m);
        }

        // 2. Process ERC20 / ERC721 Logs
        for (const log of logs) {
            if (log.topics.length === 3 && log.topics[0] === EVM.ERC20_TRANSFER_TOPIC) {
                // ERC20 Transfer
                const mFrom = '0x' + log.topics[1].slice(-40);
                const mTo = '0x' + log.topics[2].slice(-40);
                const mAmount = BigInt(log.data === '0x' ? '0' : log.data).toString();

                const m: TokenMovement = {
                    asset: log.address.toLowerCase(),
                    amount: mAmount,
                    type: 'ERC20',
                    from: mFrom.toLowerCase(),
                    to: mTo.toLowerCase(),
                    role: 'UNKNOWN'
                };
                addMovement(m.from, m);
                addMovement(m.to, m);
            }
            else if (log.topics.length === 4 && log.topics[0] === EVM.ERC721_TRANSFER_TOPIC) {
                // ERC721 Transfer
                const mFrom = '0x' + log.topics[1].slice(-40);
                const mTo = '0x' + log.topics[2].slice(-40);
                const id = BigInt(log.topics[3]).toString();

                const m: TokenMovement = {
                    asset: log.address.toLowerCase(),
                    amount: '1',
                    type: 'ERC721',
                    tokenId: id,
                    from: mFrom.toLowerCase(),
                    to: mTo.toLowerCase(),
                    role: 'UNKNOWN'
                };
                addMovement(m.from, m);
                addMovement(m.to, m);
            }
            else if (log.topics[0] === EVM.ERC1155_TRANSFER_SINGLE_TOPIC && log.topics.length === 4) {
                // ERC1155 TransferSingle
                const mFrom = '0x' + log.topics[2].slice(-40); // operator is 1, from is 2, to is 3
                const mTo = '0x' + log.topics[3].slice(-40);

                // Data contains id and value (both uint256)
                const data = log.data.replace('0x', '');
                if (data.length >= 128) {
                    const id = BigInt('0x' + data.slice(0, 64)).toString();
                    const val = BigInt('0x' + data.slice(64, 128)).toString();

                    const m: TokenMovement = {
                        asset: log.address.toLowerCase(),
                        amount: val,
                        type: 'ERC1155',
                        tokenId: id,
                        from: mFrom.toLowerCase(),
                        to: mTo.toLowerCase(),
                        role: 'UNKNOWN'
                    };
                    addMovement(m.from, m);
                    addMovement(m.to, m);
                }
            }
        }

        // Clean up movements below dust threshold for fungible tokens
        for (const addr of Object.keys(flow)) {
            const f = flow[addr];
            f.incoming = f.incoming.filter(m =>
                (m.type === 'ERC721' || m.type === 'ERC1155') || BigInt(m.amount) >= dustThreshold
            );
            f.outgoing = f.outgoing.filter(m =>
                (m.type === 'ERC721' || m.type === 'ERC1155') || BigInt(m.amount) >= dustThreshold
            );
        }

        return flow;
    }
}
