// ═══ FILE: rules/staking/StakingRule.ts ═══
import { BaseRule } from '../../core/BaseRule';
import { ClassificationContext } from '../../core/Context';
import { RuleResult, TransactionType } from '../../core/types';
import { ConfidenceBuilder } from '../../core/ConfidenceBuilder';

export class StakingRule extends BaseRule {
    readonly id = 'staking';
    readonly priority = 85;

    matches(ctx: ClassificationContext): boolean {
        return ctx.targetIsCategory('staking_contract') ||
            this.getEventsByCategory(ctx, 'staking_deposit').length > 0 ||
            this.getEventsByCategory(ctx, 'staking_withdraw').length > 0 ||
            this.getEventsByCategory(ctx, 'staking_reward').length > 0 ||
            this.selectorMatchesCategory(ctx, 'staking_deposit') ||
            this.selectorMatchesCategory(ctx, 'staking_withdraw') ||
            this.selectorMatchesCategory(ctx, 'staking_reward');
    }

    classify(ctx: ClassificationContext): RuleResult | null {
        if (!this.matches(ctx)) return this.noMatch();

        const flow = this.getMeaningfulFlow(ctx);
        const hasOut = flow && flow.netOut.length > 0;
        const hasIn = flow && flow.netIn.length > 0;
        const isUnidirectionalOut = hasOut && !hasIn;
        const isUnidirectionalIn = hasIn && !hasOut;
        const isBidirectional = hasOut && hasIn;

        let action: TransactionType | undefined;

        const depositEvents = this.getEventsByCategory(ctx, 'staking_deposit');
        const withdrawEvents = this.getEventsByCategory(ctx, 'staking_withdraw');
        const rewardEvents = this.getEventsByCategory(ctx, 'staking_reward');

        if (depositEvents.length > 0 && isUnidirectionalOut) {
            action = TransactionType.STAKING_DEPOSIT;
        } else if (withdrawEvents.length > 0 && isUnidirectionalIn) {
            action = TransactionType.STAKING_WITHDRAW;
        } else if (rewardEvents.length > 0) {
            action = TransactionType.STAKING_CLAIM_REWARDS;
        } else if (ctx.resolveSelector()?.category === 'staking_deposit' && isUnidirectionalOut) {
            action = TransactionType.STAKING_DEPOSIT;
        } else if (ctx.resolveSelector()?.category === 'staking_withdraw' && isUnidirectionalIn) {
            action = TransactionType.STAKING_WITHDRAW;
        } else if (ctx.resolveSelector()?.category === 'staking_reward') {
            action = TransactionType.STAKING_CLAIM_REWARDS;
        } else if (ctx.targetIsCategory('staking_contract')) {
            // Fallback heuristics
            if (isUnidirectionalOut) action = TransactionType.STAKING_DEPOSIT;
            else if (isUnidirectionalIn) action = TransactionType.STAKING_WITHDRAW;
        }

        if (!action) return this.noMatch();

        const builder = new ConfidenceBuilder();
        const targetRecord = ctx.resolveTarget();
        if (targetRecord && targetRecord.category === 'staking_contract') {
            builder.add(targetRecord.confidenceBoost, 'Target is a known staking contract');
        }

        let bestEventBoost = 0;
        [...depositEvents, ...withdrawEvents, ...rewardEvents].forEach(ev => {
            const evRecord = ctx.resolveEvent(ev.topics[0]);
            if (evRecord && evRecord.confidenceBoost > bestEventBoost) {
                bestEventBoost = evRecord.confidenceBoost;
            }
        });
        if (bestEventBoost > 0) builder.add(bestEventBoost, 'Matched staking event');

        const sel = ctx.resolveSelector();
        if (sel?.category.startsWith('staking_')) {
            builder.add(sel.confidenceBoost, `Matched selector ${sel.category}`);
        }

        // Flow bonuses
        if ((action === TransactionType.STAKING_DEPOSIT && isUnidirectionalOut) ||
            (action === TransactionType.STAKING_WITHDRAW && isUnidirectionalIn)) {
            builder.add(0.10, 'Flow direction matches action');
        }

        if (isBidirectional && rewardEvents.length === 0) {
            builder.add(-0.15, 'Bidirectional flow without reward event (unusual for staking)');
        }

        const bridgeEvents = [...this.getEventsByCategory(ctx, 'bridge_send'), ...this.getEventsByCategory(ctx, 'bridge_receive')];
        if (bridgeEvents.length > 0) {
            builder.add(-0.30, 'Bridge events present (bridge rule should probably win)');
        }

        const confidence = builder.getScore();
        if (confidence < 0.60) return this.noMatch();

        return {
            functionalType: action,
            confidence,
            reasons: builder.getReasons(),
            details: {
                stakingProtocol: targetRecord?.protocolName
            }
        };
    }
}
