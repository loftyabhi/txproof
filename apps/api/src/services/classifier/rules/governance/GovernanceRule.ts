// ═══ FILE: rules/governance/GovernanceRule.ts ═══
import { BaseRule } from '../../core/BaseRule';
import { ClassificationContext } from '../../core/Context';
import { RuleResult, TransactionType } from '../../core/types';
import { ConfidenceBuilder } from '../../core/ConfidenceBuilder';

export class GovernanceRule extends BaseRule {
    readonly id = 'governance';
    readonly priority = 90;

    matches(ctx: ClassificationContext): boolean {
        return this.selectorMatchesCategory(ctx, 'governance_vote') ||
            this.selectorMatchesCategory(ctx, 'governance_propose') ||
            this.selectorMatchesCategory(ctx, 'governance_delegate') ||
            this.selectorMatchesCategory(ctx, 'governance_execute') ||
            this.getEventsByCategory(ctx, 'governance_vote').length > 0 ||
            this.getEventsByCategory(ctx, 'governance_propose').length > 0 ||
            this.getEventsByCategory(ctx, 'governance_delegate').length > 0 ||
            this.getEventsByCategory(ctx, 'governance_execute').length > 0;
    }

    classify(ctx: ClassificationContext): RuleResult | null {
        if (!this.matches(ctx)) return this.noMatch();

        let action: TransactionType | undefined;
        let actionCategory: string | undefined;

        const sel = ctx.resolveSelector();
        if (sel?.category.startsWith('governance_')) {
            actionCategory = sel.category;
        } else {
            const govEvents = [
                ...this.getEventsByCategory(ctx, 'governance_vote'),
                ...this.getEventsByCategory(ctx, 'governance_propose'),
                ...this.getEventsByCategory(ctx, 'governance_delegate'),
                ...this.getEventsByCategory(ctx, 'governance_execute')
            ];
            if (govEvents.length > 0) {
                const evRecord = ctx.resolveEvent(govEvents[0].topics[0]);
                if (evRecord) actionCategory = evRecord.category;
            }
        }

        switch (actionCategory) {
            case 'governance_vote': action = TransactionType.GOVERNANCE_VOTE; break;
            case 'governance_propose': action = TransactionType.GOVERNANCE_PROPOSAL; break;
            case 'governance_delegate': action = TransactionType.GOVERNANCE_DELEGATION; break;
            case 'governance_execute': action = TransactionType.GOVERNANCE_EXECUTION; break;
        }

        if (!action || !actionCategory) return this.noMatch();

        const builder = new ConfidenceBuilder();
        builder.add(0.30, 'Action is identified as Governance');

        if (sel && sel.category === actionCategory) {
            builder.add(sel.confidenceBoost, `Selector matched ${sel.category}`);
        }

        const events = this.getEventsByCategory(ctx, actionCategory);
        if (events.length > 0) {
            const evRecord = ctx.resolveEvent(events[0].topics[0]);
            if (evRecord) builder.add(evRecord.confidenceBoost, `Event matched ${evRecord.category}`);
        }

        const targetRecord = ctx.resolveTarget();
        if (targetRecord && targetRecord.category === 'governance_contract') {
            builder.add(targetRecord.confidenceBoost, 'Target is a known governance contract');
        }

        const confidence = builder.getScore();
        if (confidence < 0.70) return this.noMatch();

        return {
            functionalType: action,
            confidence,
            reasons: builder.getReasons(),
            details: {}
        };
    }
}
