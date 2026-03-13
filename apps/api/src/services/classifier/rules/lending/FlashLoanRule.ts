// ═══ FILE: rules/lending/FlashLoanRule.ts ═══
import { BaseRule } from '../../core/BaseRule';
import { ClassificationContext } from '../../core/Context';
import { RuleResult, TransactionType } from '../../core/types';
import { ConfidenceBuilder } from '../../core/ConfidenceBuilder';

export class FlashLoanRule extends BaseRule {
    readonly id = 'flash_loan';
    readonly priority = 75;

    matches(ctx: ClassificationContext): boolean {
        return this.getEventsByCategory(ctx, 'flash_loan').length > 0;
    }

    classify(ctx: ClassificationContext): RuleResult | null {
        if (!this.matches(ctx)) return this.noMatch();

        const builder = new ConfidenceBuilder();
        const flashEvents = this.getEventsByCategory(ctx, 'flash_loan');

        let bestEventBoost = 0;
        flashEvents.forEach(ev => {
            const evRecord = ctx.resolveEvent(ev.topics[0]);
            if (evRecord && evRecord.confidenceBoost > bestEventBoost) {
                bestEventBoost = evRecord.confidenceBoost;
            }
        });

        if (bestEventBoost > 0) {
            builder.add(bestEventBoost, 'Matched flash loan event');
        }

        const targetRecord = ctx.resolveTarget();
        if (targetRecord && (targetRecord.category === 'lending_pool' || targetRecord.category === 'lending_market')) {
            builder.add(targetRecord.confidenceBoost, 'Target is a known lending pool/market');
        }

        const flow = this.getMeaningfulFlow(ctx);
        if (flow) {
            // Check for same-asset bidirectional flow (borrow+repay pattern)
            const outAssets = flow.netOut.map(m => m.asset);
            const inAssets = flow.netIn.map(m => m.asset);
            const hasSameAsset = outAssets.some(outT => inAssets.includes(outT));

            if (hasSameAsset) {
                builder.add(0.10, 'Bidirectional flow involving same asset (flash loan pattern)');
            }
        }

        const confidence = builder.getScore();
        if (confidence < 0.70) return this.noMatch();

        return {
            functionalType: TransactionType.FLASH_LOAN,
            confidence,
            reasons: builder.getReasons(),
            details: {}
        };
    }
}
