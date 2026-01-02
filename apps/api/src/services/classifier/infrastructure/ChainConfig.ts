// src/services/classifier/infrastructure/ChainConfig.ts
import { Address } from '../core/types';

export enum ChainType {
    L1 = 'L1',
    L2 = 'L2',
}

export interface ChainConfig {
    chainId: number;
    type: ChainType;
    canonicalBridges: Set<Address>; // Addresses of official bridges
    nativeTokenSymbol: string;
    // Map of Protocol Name -> Loopup Map
    knownContracts: Map<string, Record<Address, string>>;
}

// Basic Registry (Expandable)
export const CHAIN_CONFIGS: Record<number, ChainConfig> = {
    1: {
        chainId: 1,
        type: ChainType.L1,
        canonicalBridges: new Set([
            '0x99c9fc46f92e8a1c0dec1b1747d010903e884be1', // Optimism
            '0x8315177ab297ba92a06054ce80a67ed4dbd7ed3a', // Arbitrum
        ]),
        nativeTokenSymbol: 'ETH',
        knownContracts: new Map(),
    },
    8453: { // Base
        chainId: 8453,
        type: ChainType.L2,
        canonicalBridges: new Set([
            '0x4200000000000000000000000000000000000010', // Standard Bridge
        ]),
        nativeTokenSymbol: 'ETH',
        knownContracts: new Map(),
    }
};

export const DEFAULT_CHAIN_CONFIG: ChainConfig = {
    chainId: 0,
    type: ChainType.L1,
    canonicalBridges: new Set(),
    nativeTokenSymbol: 'ETH',
    knownContracts: new Map(),
};
