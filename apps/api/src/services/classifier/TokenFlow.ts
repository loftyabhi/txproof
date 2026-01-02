import { Log, Address } from './types';
import { Decoder } from './utils';

export interface TokenMovement {
    asset: Address;
    amount: bigint;
    type: 'ERC20' | 'ERC721' | 'ERC1155' | 'NATIVE';
    tokenId?: string; // For NFT
}

export interface NetFlow {
    [address: string]: {
        incoming: TokenMovement[];
        outgoing: TokenMovement[];
    };
}

export class TokenFlowAnalyzer {
    static analyze(logs: Log[], nativeValue: string, from: Address, to: Address | null): NetFlow {
        const flow: NetFlow = {};

        const ensureRecord = (addr: Address) => {
            const normalized = Decoder.normalizeAddress(addr);
            if (!flow[normalized]) {
                flow[normalized] = { incoming: [], outgoing: [] };
            }
            return normalized;
        };

        // 1. Native Transfer (ETH/MATIC/BNB)
        const val = BigInt(nativeValue);
        if (val > BigInt(0) && to) {
            const sender = ensureRecord(from);
            const receiver = ensureRecord(to);

            const movement: TokenMovement = {
                asset: 'NATIVE',
                amount: val,
                type: 'NATIVE',
            };

            flow[sender].outgoing.push(movement);
            flow[receiver].incoming.push(movement);
        }

        // 2. Parse Logs
        for (const log of logs) {
            const logAddr = Decoder.normalizeAddress(log.address);

            // ERC20
            const erc20 = Decoder.decodeERC20Transfer(log);
            if (erc20 && erc20.name === 'Transfer') {
                const fromAddr = ensureRecord(erc20.args[0]);
                const toAddr = ensureRecord(erc20.args[1]);
                const amount = BigInt(erc20.args[2]);

                const movement: TokenMovement = {
                    asset: logAddr,
                    amount,
                    type: 'ERC20',
                };

                flow[fromAddr].outgoing.push(movement);
                flow[toAddr].incoming.push(movement);
                continue;
            }

            // ERC721
            const erc721 = Decoder.decodeERC721Transfer(log);
            if (erc721 && erc721.name === 'Transfer') {
                const fromAddr = ensureRecord(erc721.args[0]);
                const toAddr = ensureRecord(erc721.args[1]);
                const tokenId = erc721.args[2].toString();

                const movement: TokenMovement = {
                    asset: logAddr,
                    amount: BigInt(1),
                    tokenId,
                    type: 'ERC721',
                };

                flow[fromAddr].outgoing.push(movement);
                flow[toAddr].incoming.push(movement);
                continue;
            }

            // ERC1155
            const erc1155 = Decoder.decodeERC1155Transfer(log);
            if (erc1155) {
                if (erc1155.name === 'TransferSingle') {
                    const fromAddr = ensureRecord(erc1155.args.from);
                    const toAddr = ensureRecord(erc1155.args.to);
                    const id = erc1155.args.id.toString();
                    const amount = BigInt(erc1155.args.value);

                    const movement: TokenMovement = {
                        asset: logAddr,
                        amount,
                        tokenId: id,
                        type: 'ERC1155',
                    };

                    flow[fromAddr].outgoing.push(movement);
                    flow[toAddr].incoming.push(movement);

                } else if (erc1155.name === 'TransferBatch') {
                    const fromAddr = ensureRecord(erc1155.args.from);
                    const toAddr = ensureRecord(erc1155.args.to);
                    const ids = erc1155.args.ids;
                    const amounts = erc1155.args.values;

                    for (let i = 0; i < ids.length; i++) {
                        const movement: TokenMovement = {
                            asset: logAddr,
                            amount: BigInt((amounts as any)[i]),
                            tokenId: ids[i].toString(),
                            type: 'ERC1155',
                        };
                        flow[fromAddr].outgoing.push(movement);
                        flow[toAddr].incoming.push(movement);
                    }
                }
            }
        }

        return flow;
    }
}
