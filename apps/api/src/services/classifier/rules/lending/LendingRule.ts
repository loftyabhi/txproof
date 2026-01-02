// src/services/classifier/rules/lending/LendingRule.ts
import { ClassificationRule, RuleResult } from '../../core/Rule';
import { ClassificationContext } from '../../core/Context';
import { TransactionType } from '../../core/types';

const LENDING_EVENTS = {
    DEPOSIT: '0xde6857219544bb5b7746f48ed30be6386fefc61b2f864cacf559893bf50fd951', // Aave Deposit
    BORROW: '0xc6a898309e823ee50bac64e45ca8adba6690e99e7841c45d754e2a38e9019d9b', // Aave Borrow
};

export class LendingRule implements ClassificationRule {
    id = 'lending_aave';
    name = 'Lending Protocol';
    priority = 90;

    matches(ctx: ClassificationContext): boolean {
        return ctx.receipt.logs.some(l =>
            l.topics[0] === LENDING_EVENTS.DEPOSIT ||
            l.topics[0] === LENDING_EVENTS.BORROW
        );
    }

    classify(ctx: ClassificationContext): RuleResult {
        const logs = ctx.receipt.logs;

        // Verify Flow for extra confidence
        const sender = ctx.tx.from.toLowerCase();
        const flow = ctx.flow[sender];
        let tokenFlowMatch = 0.5;

        if (flow) {
            // Deposit usually means outgoing asset (supplied).
            // Borrow usually means incoming asset.
            if (flow.outgoing.length > 0) tokenFlowMatch += 0.2;
            if (flow.incoming.length > 0) tokenFlowMatch += 0.2;
        }

        if (logs.some(l => l.topics[0] === LENDING_EVENTS.DEPOSIT)) {
            return {
                type: TransactionType.LENDING_DEPOSIT,
                confidence: 0.95,
                breakdown: { eventMatch: 1.0, methodMatch: 0, addressMatch: 0, tokenFlowMatch, executionMatch: 0 },
                protocol: 'Aave',
                reasons: ['Aave Deposit event matched']
            };
        }

        if (logs.some(l => l.topics[0] === LENDING_EVENTS.BORROW)) {
            return {
                type: TransactionType.LENDING_BORROW,
                confidence: 0.95,
                breakdown: { eventMatch: 1.0, methodMatch: 0, addressMatch: 0, tokenFlowMatch, executionMatch: 0 },
                protocol: 'Aave',
                reasons: ['Aave Borrow event matched']
            };
        }

        // Should be unreachable if matches() returns true, but safety
        throw new Error("LendingRule matches() true but classify() failed");
    }
}
