import { z } from 'zod';

/**
 * Regex for standard Ethereum Transaction Hash (0x + 64 hex chars)
 */
export const ETH_TX_HASH_REGEX = /^0x[a-fA-F0-9]{64}$/;

/**
 * Regex for Farcaster Cast Hash (0x + 40 hex chars)
 */
export const FARCASTER_CAST_HASH_REGEX = /^0x[a-fA-F0-9]{40}$/;

/**
 * Zod schema for Ethereum Transaction Hash
 */
export const ethTxHashSchema = z.string().regex(ETH_TX_HASH_REGEX, "Invalid Transaction Hash format");

/**
 * Zod schema for Farcaster Cast Hash
 */
export const farcasterCastHashSchema = z.string().regex(FARCASTER_CAST_HASH_REGEX, "Invalid Farcaster Cast Hash format");

/**
 * Flexible schema that accepts either an Ethereum Transaction Hash or a Farcaster Cast Hash
 */
export const flexibleHashSchema = z.string().refine(
    (val) => ETH_TX_HASH_REGEX.test(val) || FARCASTER_CAST_HASH_REGEX.test(val),
    {
        message: "Invalid hash format. Must be a Transaction Hash (64 hex) or Farcaster Cast Hash (40 hex)."
    }
);
