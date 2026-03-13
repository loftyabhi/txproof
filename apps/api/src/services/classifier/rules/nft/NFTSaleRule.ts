// ═══ FILE: rules/nft/NFTSaleRule.ts ═══
import { BaseRule } from '../../core/BaseRule';
import { ClassificationContext } from '../../core/Context';
import { RuleResult, TransactionType } from '../../core/types';
import { ConfidenceBuilder } from '../../core/ConfidenceBuilder';

export class NFTSaleRule extends BaseRule {
    readonly id = 'nft_sale';
    readonly priority = 70;

    matches(ctx: ClassificationContext): boolean {
        const flow = this.getMeaningfulFlow(ctx);
        const hasNFTFlow = flow && (flow.nftIn.length > 0 || flow.nftOut.length > 0);
        return this.getEventsByCategory(ctx, 'nft_sale').length > 0 ||
            ctx.targetIsCategory('nft_marketplace') ||
            !!hasNFTFlow;
    }

    classify(ctx: ClassificationContext): RuleResult | null {
        if (!this.matches(ctx)) return this.noMatch();

        const builder = new ConfidenceBuilder();
        const flow = this.getMeaningfulFlow(ctx);

        if (!flow || (flow.nftIn.length === 0 && flow.nftOut.length === 0)) {
            return this.noMatch();
        }

        const hasPaymentOut = flow.netOut.some(m => m.type === 'NATIVE' || m.type === 'ERC20');
        const hasPaymentIn = flow.netIn.some(m => m.type === 'NATIVE' || m.type === 'ERC20');
        const hasNftIn = flow.nftIn.length > 0;
        const hasNftOut = flow.nftOut.length > 0;

        const saleScenarioA = hasPaymentOut && hasNftIn; // Bought
        const saleScenarioB = hasNftOut && hasPaymentIn; // Sold
        const isSale = saleScenarioA || saleScenarioB;

        const saleEvents = this.getEventsByCategory(ctx, 'nft_sale');

        if (isSale || saleEvents.length > 0 || ctx.targetIsCategory('nft_marketplace')) {
            // Proceed as sale
            builder.add(0.50, 'Base sale condition met');

            let bestEventBoost = 0;
            saleEvents.forEach(ev => {
                const evRecord = ctx.resolveEvent(ev.topics[0]);
                if (evRecord && evRecord.confidenceBoost > bestEventBoost) {
                    bestEventBoost = evRecord.confidenceBoost;
                }
            });
            if (bestEventBoost > 0) builder.add(bestEventBoost, 'Marketplace sale event confirmed');

            if (isSale) {
                builder.add(0.40, 'Sale scenario confirmed (bidirectional with NFT + payment)');
            }

            const collections = new Set([...flow.nftIn.map(m => m.asset), ...flow.nftOut.map(m => m.asset)]);
            if (collections.size === 1) {
                builder.add(0.15, 'Single NFT collection involved');
            } else if (collections.size > 1) {
                builder.add(-0.15, 'Multiple collections involved');
            }

            const paymentAssets = new Set([
                ...flow.netOut.filter(m => m.type === 'ERC20' || m.type === 'NATIVE').map(m => m.asset),
                ...flow.netIn.filter(m => m.type === 'ERC20' || m.type === 'NATIVE').map(m => m.asset)
            ]);
            if (paymentAssets.size > 1) {
                builder.add(-0.10, 'Multiple payment assets involved');
            }

            const confidence = builder.getScore();
            if (confidence >= 0.70) {
                return {
                    functionalType: TransactionType.NFT_SALE,
                    confidence,
                    reasons: builder.getReasons(),
                    details: {}
                };
            }
        }

        // FALLBACK: NFT movement with no sale conditions
        if (hasNftIn || hasNftOut) {
            builder.setBase(0.75, 'Fallback to NFT Transfer');
            return {
                functionalType: TransactionType.NFT_TRANSFER,
                confidence: builder.getScore(),
                reasons: builder.getReasons(),
                details: {}
            };
        }

        return this.noMatch();
    }
}
