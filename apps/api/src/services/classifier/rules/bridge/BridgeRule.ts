// src/services/classifier/rules/bridge/BridgeRule.ts
import { ClassificationRule, RuleResult } from '../../core/Rule';
import { ClassificationContext } from '../../core/Context';
import { TransactionType } from '../../core/types';

export class BridgeRule implements ClassificationRule {
    id = 'bridge_canonical';
    name = 'Canonical Bridge Operation';
    priority = 90; // High Priority

    matches(ctx: ClassificationContext): boolean {
        // Use effectiveTo (resolved proxy/implementation)
        const to = ctx.effectiveTo;
        if (!to) return false;

        // Check if To address is a known bridge for this chain
        // Note: ctx.resolveAddress was removed/changed in Context V2. 
        // We track 'effectiveTo' directly now.
        return ctx.chain.canonicalBridges.has(to);
    }

    classify(ctx: ClassificationContext): RuleResult {
        // Determine Direction based on Flow
        const sender = ctx.tx.from.toLowerCase();
        const flow = ctx.flow[sender];

        let type = TransactionType.BRIDGE_DEPOSIT;
        let reasons = ['Interaction with Canonical Bridge Contract'];
        let tokenFlowMatch = 0.5;

        // If we sent Tokens/ETH -> Likely Deposit
        // If we received Tokens/ETH -> Likely Withdraw (or Claim)
        if (flow) {
            const hasOutgoing = flow.outgoing.length > 0;
            const hasIncoming = flow.incoming.length > 0;

            if (hasIncoming && !hasOutgoing) {
                type = TransactionType.BRIDGE_WITHDRAW;
                reasons.push('Incoming assets detected (Withdrawal)');
                tokenFlowMatch = 0.9;
            } else if (hasOutgoing) {
                type = TransactionType.BRIDGE_DEPOSIT;
                reasons.push('Outgoing assets detected (Deposit)');
                tokenFlowMatch = 0.9;
            }
        }

        return {
            type,
            confidence: 0.9,
            breakdown: {
                eventMatch: 0,
                methodMatch: 0,
                addressMatch: 1.0, // Strong address match
                tokenFlowMatch,
                executionMatch: 0
            },
            protocol: 'Native Bridge',
            reasons
        };
    }
}
