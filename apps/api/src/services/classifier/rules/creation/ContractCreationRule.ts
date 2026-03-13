// ═══ FILE: rules/creation/ContractCreationRule.ts ═══
import { BaseRule } from '../../core/BaseRule';
import { ClassificationContext } from '../../core/Context';
import { RuleResult, TransactionType } from '../../core/types';

export class ContractCreationRule extends BaseRule {
    readonly id = 'core_contract_creation';
    readonly priority = 100;

    matches(ctx: ClassificationContext): boolean {
        return ctx.tx.to === null && ctx.receipt.contractAddress !== null;
    }

    classify(ctx: ClassificationContext): RuleResult | null {
        if (!this.matches(ctx)) return this.noMatch();
        return {
            functionalType: TransactionType.CONTRACT_DEPLOYMENT,
            confidence: 1.0,
            reasons: ['Transaction has null `to` address and created a contract'],
            details: {
                contractAddress: ctx.receipt.contractAddress!
            }
        };
    }
}
