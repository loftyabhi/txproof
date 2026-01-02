// src/services/classifier/rules/dex/SwapRule.ts
import { ClassificationRule, RuleResult } from '../../core/Rule';
import { ClassificationContext } from '../../core/Context';
import { TransactionType } from '../../core/types';

const SWAP_EVENTS = [
    '0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822', // Uniswap V2: Swap(sender, ...)
    '0xc42079f94a6350d7e6235f29174924f928cc2ac818eb64fed8004e115fbcca67', // Uniswap V3: Swap(...)
    '0xc4d252f84c8a7b193efff4263a3e6b7d2f31f9d45d3153e70d4d8c6d1e44f8e7', // Balancer? Curve?
];

export class SwapRule implements ClassificationRule {
    id = 'dex_swap';
    name = 'DEX Swap';
    priority = 90; // High priority for Protocol Semantic

    matches(ctx: ClassificationContext): boolean {
        // Fast Check: Logs exist and match known Swap signatures
        return ctx.receipt.logs.some(l => SWAP_EVENTS.includes(l.topics[0]));
    }

    classify(ctx: ClassificationContext): RuleResult {
        const swapLogs = ctx.receipt.logs.filter(l => SWAP_EVENTS.includes(l.topics[0]));

        // 1. Event Match
        // We know we have at least one swap log from applies()
        const eventMatch = 1.0;

        // 2. Token Flow Match
        const sender = ctx.tx.from.toLowerCase();
        const flow = ctx.flow[sender];

        let tokenFlowMatch = 0.0;
        let reasons: string[] = [`Matched ${swapLogs.length} Swap events`];

        if (flow) {
            const hasIncoming = flow.incoming.length > 0;
            const hasOutgoing = flow.outgoing.length > 0;

            if (hasIncoming && hasOutgoing) {
                tokenFlowMatch = 1.0;
                reasons.push('Bidirectional token flow detected (Assets Sourced & Received)');
            } else if (hasOutgoing && !hasIncoming) {
                // Sent tokens, got nothing? Failed swap? Or tokens sent to another address?
                // Context could check netValue change.
                tokenFlowMatch = 0.4;
                reasons.push('Unidirectional flow (Sent only). Possible route-through or failure.');
            } else if (!hasOutgoing && hasIncoming) {
                // Received only? Flash loan? Or strictly "buy" w/o payment tracking?
                tokenFlowMatch = 0.4;
                reasons.push('Unidirectional flow (Received only).');
            }
        }

        // 3. Address Match (EffectiveTo)
        // If effectiveTo is a known Router or Pair, boost score.
        // For now, we don't have the dictionary, but we can verify effectiveTo WAS the contract executed.
        let addressMatch = 0.5; // Neutral
        // If effectiveTo == log.address for one of the swaps? Then we called the pair directly.
        if (swapLogs.some(l => l.address.toLowerCase() === ctx.effectiveTo)) {
            addressMatch = 0.8;
            reasons.push('Direct interaction with Swap Pair');
        }

        // 4. Execution Match
        // Swaps are mostly Direct. If Relayer/Bundler used, that's fine too.
        let executionMatch = 1.0;

        // Calculate Confidence
        // Weighted: Events are strongest signal for Swap.
        const confidence = (eventMatch * 0.5) + (tokenFlowMatch * 0.3) + (addressMatch * 0.2);

        return {
            type: TransactionType.SWAP,
            confidence: Math.min(confidence, 1.0),
            breakdown: {
                eventMatch,
                methodMatch: 0,
                addressMatch,
                tokenFlowMatch,
                executionMatch
            },
            protocol: 'DEX', // TODO: Differentiate V2/V3 based on log topic
            reasons
        };
    }
}
