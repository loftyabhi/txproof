// ═══ FILE: rules/lending/LendingRule.ts ═══
import { BaseRule } from '../../core/BaseRule';
import { ClassificationContext } from '../../core/Context';
import { RuleResult, TransactionType } from '../../core/types';
import { ConfidenceBuilder } from '../../core/ConfidenceBuilder';

export class LendingRule extends BaseRule {
    readonly id = 'lending';
    readonly priority = 90;

    matches(ctx: ClassificationContext): boolean {
        return ctx.targetIsCategory('lending_pool') ||
            ctx.targetIsCategory('lending_market') ||
            ctx.hasInternalCallTo('lending_pool') ||
            this.getEventsByCategory(ctx, 'lending_deposit').length > 0 ||
            this.getEventsByCategory(ctx, 'lending_withdraw').length > 0 ||
            this.getEventsByCategory(ctx, 'lending_borrow').length > 0 ||
            this.getEventsByCategory(ctx, 'lending_repay').length > 0 ||
            this.getEventsByCategory(ctx, 'lending_liquidation').length > 0;
    }

    classify(ctx: ClassificationContext): RuleResult | null {
        if (!this.matches(ctx)) return this.noMatch();

        const builder = new ConfidenceBuilder();
        const flow = this.getMeaningfulFlow(ctx);
        const hasOut = flow && flow.netOut.length > 0;
        const hasIn = flow && flow.netIn.length > 0;
        const isBidirectional = hasOut && hasIn;
        const isUnidirectionalOut = hasOut && !hasIn;
        const isUnidirectionalIn = hasIn && !hasOut;

        let action: TransactionType | undefined;

        const deposits = this.getEventsByCategory(ctx, 'lending_deposit');
        const withdraws = this.getEventsByCategory(ctx, 'lending_withdraw');
        const borrows = this.getEventsByCategory(ctx, 'lending_borrow');
        const repays = this.getEventsByCategory(ctx, 'lending_repay');
        const liquidations = this.getEventsByCategory(ctx, 'lending_liquidation');

        if (liquidations.length > 0) {
            action = TransactionType.LENDING_LIQUIDATION;
            builder.add(0.40, 'Liquidation act identified');
        } else if (deposits.length > 0 && (isUnidirectionalOut || isBidirectional)) {
            action = TransactionType.LENDING_DEPOSIT;
            builder.add(0.40, 'Deposit act confirmed by flow direction matching event');
        } else if (withdraws.length > 0 && (isUnidirectionalIn || isBidirectional)) {
            action = TransactionType.LENDING_WITHDRAW;
            builder.add(0.40, 'Withdraw act confirmed by flow direction matching event');
        } else if (borrows.length > 0 && isUnidirectionalIn) {
            action = TransactionType.LENDING_BORROW;
            builder.add(0.40, 'Borrow act confirmed by flow direction matching event');
        } else if (repays.length > 0 && isUnidirectionalOut) {
            action = TransactionType.LENDING_REPAY;
            builder.add(0.40, 'Repay act confirmed by flow direction matching event');
        }

        const targetRecord = ctx.resolveTarget();
        if (targetRecord && (targetRecord.category === 'lending_pool' || targetRecord.category === 'lending_market')) {
            builder.add(targetRecord.confidenceBoost, 'Target is a known lending pool/market');
        }

        let bestEventBoost = 0;
        [...deposits, ...withdraws, ...borrows, ...repays, ...liquidations].forEach(ev => {
            const evRecord = ctx.resolveEvent(ev.topics[0]);
            if (evRecord && evRecord.confidenceBoost > bestEventBoost) {
                bestEventBoost = evRecord.confidenceBoost;
            }
        });

        if (bestEventBoost > 0) {
            builder.add(bestEventBoost, 'Matched primary lending event');
        }

        if (ctx.hasInternalCallTo('lending_pool')) {
            builder.add(0.20, 'Has internal call to known lending pool');
        }

        if (isBidirectional && bestEventBoost === 0) {
            builder.add(-0.30, 'Bidirectional flow without lending event (likely swap)');
        }
        if (!flow || !flow.hasAnyFlow) {
            builder.add(-0.25, 'No flow observed for sender');
        }

        const confidence = builder.getScore();
        if (confidence < 0.70 || !action) return this.noMatch();

        return {
            functionalType: action,
            confidence,
            reasons: builder.getReasons(),
            details: {}
        };
    }
}
