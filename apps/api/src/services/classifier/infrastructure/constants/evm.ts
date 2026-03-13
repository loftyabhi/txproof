// ═══ FILE: infrastructure/constants/evm.ts ═══

/**
 * Immutable EVM and ERC standard constants.
 * These are keccak256 hashes of ABI signatures — they can NEVER change
 * without breaking the entire standard. Safe to hardcode.
 *
 * ALL protocol-specific addresses and event hashes go in PostgreSQL.
 * NOTHING else belongs in this file.
 */
export const EVM = {
    ZERO_ADDRESS: '0x0000000000000000000000000000000000000000',
    DEAD_ADDRESS: '0x000000000000000000000000000000000000dead',

    /** ERC-20 standard event: Transfer(address,address,uint256) */
    ERC20_TRANSFER_TOPIC:
        '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',

    /** ERC-20 standard event: Approval(address,address,uint256) */
    ERC20_APPROVAL_TOPIC:
        '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925',

    /** ERC-721 Transfer has identical topic to ERC-20 but 4 topics (tokenId indexed) */
    ERC721_TRANSFER_TOPIC:
        '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',

    /** ERC-721 ApprovalForAll(address,address,bool) */
    ERC721_APPROVAL_FOR_ALL_TOPIC:
        '0x17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31',

    /** ERC-1155 TransferSingle(address,address,address,uint256,uint256) */
    ERC1155_TRANSFER_SINGLE_TOPIC:
        '0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62',

    /** ERC-1155 TransferBatch(address,address,address,uint256[],uint256[]) */
    ERC1155_TRANSFER_BATCH_TOPIC:
        '0x4a39dc06d4c0dbc64b70af90fd698a233a518aa5d07e595d983b8c0526c8f7fb',

    /** EIP-1967: Upgraded(address) — proxy implementation changed */
    PROXY_UPGRADED_TOPIC:
        '0xbc7cd75a20ee27fd9adebab32041f755214dbc6bffa90cc0225b39da2e5c2d3b',

    /** EIP-1967: BeaconUpgraded(address) */
    PROXY_BEACON_UPGRADED_TOPIC:
        '0x1cf3b03a6cf19fa2baba4df148e9dcabedea7f8a5c07840e207e5c089be95d3e',

    /** ERC-4337: handleOps selector */
    AA_HANDLE_OPS_SELECTOR: '0x1fad948c',
    AA_HANDLE_AGGREGATED_OPS_SELECTOR: '0x4b1d7cf5',

    /** Gnosis Safe: execTransaction selector */
    SAFE_EXEC_TRANSACTION_SELECTOR: '0x6a761202',

    /** ERC-4337 EntryPoint: UserOperationEvent */
    AA_USER_OPERATION_EVENT_TOPIC:
        '0x49628fd147100edb3ef1d7634f6e33006d4e28293976af321d22cb2b05c751a3',

    /** Gnosis Safe: ExecutionSuccess / ExecutionFailure */
    SAFE_EXECUTION_SUCCESS_TOPIC:
        '0x442e715f626346e8c54381002da614f62bee8cf2088c564363b46925e01e4756',
    SAFE_EXECUTION_FAILURE_TOPIC:
        '0x23428b18acfb3ea64b08dc0c1d476c9b20e41946905b9dde7984e005723701f0',
} as const;

/** Distinguish ERC-20 from ERC-721 Transfer using topic count */
export function isERC721Transfer(log: { topics: string[] }): boolean {
    return log.topics[0] === EVM.ERC721_TRANSFER_TOPIC && log.topics.length === 4;
}

export function isERC20Transfer(log: { topics: string[] }): boolean {
    return log.topics[0] === EVM.ERC20_TRANSFER_TOPIC && log.topics.length === 3;
}

export function isMintTransfer(log: { topics: string[] }): boolean {
    return (
        log.topics[0] === EVM.ERC20_TRANSFER_TOPIC &&
        log.topics[1] === '0x0000000000000000000000000000000000000000000000000000000000000000'
    );
}

export function isBurnTransfer(log: { topics: string[] }): boolean {
    return (
        log.topics[0] === EVM.ERC20_TRANSFER_TOPIC &&
        log.topics[2] === '0x0000000000000000000000000000000000000000000000000000000000000000'
    );
}
