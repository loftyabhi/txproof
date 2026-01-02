import { ClassificationRule, RuleResult } from '../../core/Rule';
import { ClassificationContext } from '../../core/Context';
import { TransactionType } from '../../core/types';

export class ContractCreationRule implements ClassificationRule {
    public id = 'core_contract_creation';
    public name = 'Contract Creation';
    public weight = 100; // Not used, replaced by priority in interface but keeping as metadata if needed or removing
    public priority = 100; // Highest Priority

    public matches(ctx: ClassificationContext): boolean {
        // Contract creation has NO 'to' address (or it's null/undefined)
        // In our normalized context, we might have normalized it or kept it raw.
        // ClassificationContext uses `tx.to` directly (nullable).
        return !ctx.tx.to;
    }

    public classify(ctx: ClassificationContext): RuleResult {
        // Double check just in case
        if (ctx.tx.to) throw new Error("ContractCreationRule matched but tx.to exists");

        const deployedAddress = ctx.receipt.contractAddress;

        return {
            type: TransactionType.CONTRACT_DEPLOYMENT,
            confidence: 1.0,
            breakdown: {
                executionMatch: 1.0,
                tokenFlowMatch: 0,
                methodMatch: 0,
                addressMatch: 0,
                eventMatch: 0
            },
            protocol: 'Native Deployment',
            reasons: [`Transaction 'to' field is empty`, `Deployed Contract: ${deployedAddress || 'Unknown'}`]
        };
    }
}
