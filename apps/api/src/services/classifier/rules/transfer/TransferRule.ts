// src/services/classifier/rules/transfer/TransferRule.ts
import { ClassificationContext } from '../../core/Context';
import { ClassificationRule, RuleResult } from '../../core/Rule';
import { TransactionType } from '../../core/types';
import { Decoder } from '../../utils';

export class TransferRule implements ClassificationRule {
    public id = 'core_transfer';
    public name = 'Token/Native Transfer';
    public priority = 40;

    public matches(ctx: ClassificationContext): boolean {
        // Fast Check: Logs OR Value.
        if (BigInt(ctx.tx.value) > BigInt(0)) return true;
        if (ctx.receipt.logs.length > 0) return true;
        return false;
    }

    public classify(ctx: ClassificationContext): RuleResult {
        // 1. Native Transfer (Phase 4 Requirement: First class citizen)
        // If Data is Empty (or '0x') AND Value > 0 -> Native Transfer
        // BUT Phase 2 says "Contract Creation" is handled by priority 100.
        // We assume ctx.tx.to is valid (not creation).
        if (ctx.tx.data === '0x' && BigInt(ctx.tx.value) > BigInt(0)) {
            // Strictly Native, No Logs usually.
            // If there ARE logs but data is empty? (Fallback function emiting events?)
            // If logs exist, it might be Complex Transfer.
            if (ctx.receipt.logs.length === 0) {
                return {
                    type: TransactionType.NATIVE_TRANSFER,
                    confidence: 1.0,
                    breakdown: { executionMatch: 1.0, tokenFlowMatch: 1.0, methodMatch: 1.0, eventMatch: 0, addressMatch: 0 },
                    reasons: ['Native ETH transfer (0x data, value > 0)']
                };
            }
        }

        // 2. Token Flow Analysis (Sender Centric)
        // We use effectiveTo to check if it's a direct call to the token contract.
        const sender = ctx.tx.from.toLowerCase();
        const flow = ctx.flow[sender];
        if (!flow) throw new Error("No flow found for sender");

        const outCount = flow.outgoing.length;
        const inCount = flow.incoming.length;

        // Simple Transfer: 1 OUT, 0 IN
        if (outCount === 1 && inCount === 0) {
            const movement = flow.outgoing[0];

            // Validate Type
            let type = TransactionType.TOKEN_TRANSFER;
            if (movement.type === 'ERC721') type = TransactionType.NFT_TRANSFER; // ERC721
            if (movement.type === 'ERC1155') type = TransactionType.NFT_TRANSFER; // Simplify
            if (movement.type === 'NATIVE') type = TransactionType.NATIVE_TRANSFER;

            // Direct Call Check: Did we call the token contract directly?
            // movement.asset is string address or 'native'.
            const isDirectCall = movement.asset !== 'native' &&
                ctx.effectiveTo === movement.asset.toLowerCase();

            // If it's a Native Transfer (asset='native'), EffectiveTo should be the Recipient.
            // If asset 'native' and we are sending to a Contract (that doesn't emit logs), it's NATIVE_TRANSFER? 
            // Or Contract Interaction?
            // If logs.length == 0, we already caught it above. 
            // If logs.length > 0, it's likely an interaction that spent ETH.

            if (movement.type === 'NATIVE' && ctx.receipt.logs.length > 0) {
                // Sent ETH, got logs. Interaction.
                // Sent ETH, got logs. Interaction.
                throw new Error("Native Transfer with Logs -> Fallback");
            }

            return {
                type: type,
                confidence: isDirectCall ? 0.95 : 0.85, // High confidence for simple flow
                breakdown: { tokenFlowMatch: 1.0, addressMatch: isDirectCall ? 1 : 0, methodMatch: 0, eventMatch: 1, executionMatch: 0 },
                reasons: [`Single ${movement.type} outgoing movement`]
            };
        }

        // 3. WETH Wrapping (Deposit)
        // Native OUT + WETH IN.
        if (BigInt(ctx.tx.value) > BigInt(0) && inCount === 1) {
            const inMove = flow.incoming[0];
            // If incoming is ERC20
            if (inMove.type === 'ERC20') {
                // Check if it's WETH-like? (Optional config check)
                // Start with Swap/Interaction classification
                return {
                    type: TransactionType.SWAP,
                    confidence: 0.8,
                    breakdown: { tokenFlowMatch: 1.0, eventMatch: 0, methodMatch: 0, addressMatch: 0, executionMatch: 0 },
                    reasons: ['Native Sent, Token Received (Wrap)']
                };
            }
        }

        // If no logic matched, return specific failure or throw if we expect validation in matches()
        // TransferRule is broad, so matches() is loose. classify() might return null concept but interface requires RuleResult.
        // We throw if we really don't match, caught by engine.
        throw new Error("TransferRule matches() but failed semantic check");
    }
}
