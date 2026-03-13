// ═══ FILE: rules/fallback/ContractInteractionRule.ts ═══
import { BaseRule } from '../../core/BaseRule';
import { ClassificationContext } from '../../core/Context';
import { RuleResult, TransactionType } from '../../core/types';
import { ConfidenceBuilder } from '../../core/ConfidenceBuilder';

export class ContractInteractionRule extends BaseRule {
    readonly id = 'fallback_contract_interaction';
    readonly priority = 20;

    matches(ctx: ClassificationContext): boolean {
        return ctx.tx.data !== '0x' && ctx.tx.to !== null;
    }

    classify(ctx: ClassificationContext): RuleResult | null {
        if (!this.matches(ctx)) return this.noMatch();

        const builder = new ConfidenceBuilder();
        builder.setBase(0.30, 'Generic contract call — no rule matched');

        return {
            functionalType: TransactionType.CONTRACT_INTERACTION,
            confidence: builder.getScore(),
            reasons: builder.getReasons(),
            details: {}
        };
    }
}
