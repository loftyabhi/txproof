// ═══ FILE: core/types.ts ═══
export type Address = string;
export type HexString = string;
export type BigIntString = string;

export interface Log {
    address: Address;
    topics: HexString[];
    data: HexString;
    blockNumber: number;
    transactionHash: string;
    transactionIndex: number;
    logIndex: number;
    removed?: boolean;
}

export interface Transaction {
    hash: string;
    from: Address;
    to: Address | null;
    value: BigIntString;
    data: HexString;
    chainId: number;
    nonce: number;
    gasLimit: BigIntString;
    type?: number | null;
    maxFeePerGas?: BigIntString | null;
    maxPriorityFeePerGas?: BigIntString | null;
    gasPrice?: BigIntString | null;
    blockNumber?: number | null;
    blockHash?: string | null;
    transactionIndex?: number | null;
}

export interface Receipt {
    status: number | null;       // 1=success, 0=failed
    logs: Log[];
    from: Address;
    to: Address | null;
    contractAddress: Address | null;
    gasUsed: BigIntString;
    effectiveGasPrice?: BigIntString;
    transactionHash?: string;
    blockNumber?: number;
}

export enum TransactionType {
    // Tokens
    TOKEN_TRANSFER          = 'token_transfer',
    TOKEN_APPROVAL          = 'token_approval',
    TOKEN_MINT              = 'token_mint',
    TOKEN_BURN              = 'token_burn',
    BULK_TRANSFER           = 'bulk_transfer',
    // DEX
    SWAP                    = 'swap',
    ADD_LIQUIDITY           = 'add_liquidity',
    REMOVE_LIQUIDITY        = 'remove_liquidity',
    // NFT
    NFT_MINT                = 'nft_mint',
    NFT_TRANSFER            = 'nft_transfer',
    NFT_SALE                = 'nft_sale',
    NFT_LISTING             = 'nft_listing',
    NFT_CANCEL_LISTING      = 'nft_cancel_listing',
    NFT_BID                 = 'nft_bid',
    // Lending
    LENDING_DEPOSIT         = 'lending_deposit',
    LENDING_WITHDRAW        = 'lending_withdraw',
    LENDING_BORROW          = 'lending_borrow',
    LENDING_REPAY           = 'lending_repay',
    LENDING_LIQUIDATION     = 'lending_liquidation',
    FLASH_LOAN              = 'flash_loan',
    // Staking
    STAKING_DEPOSIT         = 'staking_deposit',
    STAKING_WITHDRAW        = 'staking_withdraw',
    STAKING_CLAIM_REWARDS   = 'staking_claim_rewards',
    // Bridge / L2
    BRIDGE_DEPOSIT          = 'bridge_deposit',
    BRIDGE_WITHDRAW         = 'bridge_withdraw',
    L2_DEPOSIT              = 'l2_deposit',
    L2_WITHDRAWAL           = 'l2_withdrawal',
    L2_PROVE_WITHDRAWAL     = 'l2_prove_withdrawal',
    L2_FINALIZE_WITHDRAWAL  = 'l2_finalize_withdrawal',
    // Governance
    GOVERNANCE_VOTE         = 'governance_vote',
    GOVERNANCE_PROPOSAL     = 'governance_proposal',
    GOVERNANCE_DELEGATION   = 'governance_delegation',
    GOVERNANCE_EXECUTION    = 'governance_execution',
    // Social
    SOCIAL_CAST             = 'social_cast',
    // System / Fallback
    CONTRACT_DEPLOYMENT     = 'contract_deployment',
    CONTRACT_INTERACTION    = 'contract_interaction',
    NATIVE_TRANSFER         = 'native_transfer',
    UNCLASSIFIED_COMPLEX    = 'unclassified_complex',
    UNKNOWN                 = 'unknown',
}

export enum ExecutionType {
    DIRECT                  = 'direct',
    MULTISIG                = 'multisig',
    ACCOUNT_ABSTRACTION     = 'account_abstraction',
    META_TRANSACTION        = 'meta_transaction',
    RELAYED                 = 'relayed',
    UNKNOWN                 = 'unknown',
}

export enum TransactionEnvelopeType {
    LEGACY  = 0,
    EIP2930 = 1,
    EIP1559 = 2,
    EIP4844 = 3,
}

export type FlowRole =
    | 'USER_IN' | 'USER_OUT'
    | 'PROTOCOL_IN' | 'PROTOCOL_OUT'
    | 'FEE' | 'REWARD' | 'UNKNOWN';

export interface TokenMovement {
    asset: Address;
    amount: string;
    type: 'ERC20' | 'ERC721' | 'ERC1155' | 'NATIVE';
    tokenId?: string;
    from: Address;
    to: Address;
    role: FlowRole;
}

export interface TokenFlow {
    [address: string]: {
        incoming: TokenMovement[];
        outgoing: TokenMovement[];
    };
}

export interface ConfidenceBreakdown {
    eventMatch: number;
    methodMatch: number;
    addressMatch: number;
    tokenFlowMatch: number;
    executionMatch: number;
}

export interface ConfidenceScore {
    score: number;
    breakdown?: ConfidenceBreakdown;
    reasons: string[];
}

export interface ClassificationDetails {
    method?: string;
    decodedMethod?: string;
    contractAddress?: Address;
    isProxy?: boolean;
    proxyImplementation?: Address;
    failed?: boolean;
    routeTokens?: Address[];
    tokenIdsTransferred?: string[];
    spender?: Address;
    isForAll?: boolean;
    stakingProtocol?: string;
    debugTrace?: any;
    [key: string]: any;
}

export interface ClassificationResult {
    functionalType: TransactionType;
    executionType: ExecutionType;
    confidence: ConfidenceScore;
    details: ClassificationDetails;
    protocol?: string;
    secondary?: ClassificationResult[];
}

export interface ExecutionDetails {
    effectiveTo: Address | null;
    isProxy: boolean;
    implementation: Address | null;
    executionType: ExecutionType;
}

export interface RuleResult {
    functionalType: TransactionType;
    confidence: number;
    reasons: string[];
    details: ClassificationDetails;
}

export interface DebugTraceEntry {
    rule: string;
    priority: number;
    matched: boolean;
    classified: boolean;
    confidence?: number;
    error?: string;
}
