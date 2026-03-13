// ═══ FILE: rules/dex/SwapRule.ts ═══
import { BaseRule } from '../../core/BaseRule';
import { ClassificationContext } from '../../core/Context';
import { RuleResult, TransactionType } from '../../core/types';
import { ConfidenceBuilder } from '../../core/ConfidenceBuilder';

export class SwapRule extends BaseRule {
    readonly id = 'swap';
    readonly priority = 80;

    matches(ctx: ClassificationContext): boolean {
        const hasEvents = this.getEventsByCategory(ctx, 'dex_swap').length > 0 ||
            this.getEventsByCategory(ctx, 'dex_liquidity_add').length > 0 ||
            this.getEventsByCategory(ctx, 'dex_liquidity_remove').length > 0;

        if (hasEvents || ctx.targetIsCategory('dex')) return true;

        const sel = ctx.resolveSelector();
        const flow = this.getMeaningfulFlow(ctx);
        const isBidirectional = flow && flow.netOut.length > 0 && flow.netIn.length > 0;

        if (sel && sel.category.startsWith('dex_') && isBidirectional) return true;

        return false;
    }

    classify(ctx: ClassificationContext): RuleResult | null {
        if (!this.matches(ctx)) return this.noMatch();

        const flow = this.getMeaningfulFlow(ctx);
        const hasOut = flow && flow.netOut.length > 0;
        const hasIn = flow && flow.netIn.length > 0;
        const isBidirectional = hasOut && hasIn;
        const isUnidirectionalOut = hasOut && !hasIn;
        const isUnidirectionalIn = hasIn && !hasOut;

        const swapEvents = this.getEventsByCategory(ctx, 'dex_swap');
        const addLiqEvents = this.getEventsByCategory(ctx, 'dex_liquidity_add');
        const remLiqEvents = this.getEventsByCategory(ctx, 'dex_liquidity_remove');

        let subType: TransactionType | undefined;

        if (addLiqEvents.length > 0 && isUnidirectionalOut) {
            subType = TransactionType.ADD_LIQUIDITY;
        } else if (remLiqEvents.length > 0 && isUnidirectionalIn) {
            subType = TransactionType.REMOVE_LIQUIDITY;
        } else if (swapEvents.length > 0 || isBidirectional) {
            subType = TransactionType.SWAP;
        }

        if (!subType) return this.noMatch();

        const builder = new ConfidenceBuilder();
        const details: any = {};

        if (subType === TransactionType.SWAP) {
            if (!isBidirectional) return this.noMatch();
            builder.add(0.40, 'Bidirectional flow confirmed');

            const outAssets = flow!.netOut.map(m => m.asset);
            const inAssets = flow!.netIn.map(m => m.asset);

            // Penalize wrap/unwrap
            if (outAssets.length === 1 && inAssets.length === 1 && outAssets[0] === inAssets[0]) {
                builder.add(-0.40, 'Single asset in/out (likely wrap/unwrap)');
            }

            let bestEventBoost = 0;
            let pairInteraction = false;
            swapEvents.forEach(ev => {
                const evRecord = ctx.resolveEvent(ev.topics[0]);
                if (evRecord && evRecord.confidenceBoost > bestEventBoost) {
                    bestEventBoost = evRecord.confidenceBoost;
                }
                if (ev.address.toLowerCase() === ctx.effectiveTo) {
                    pairInteraction = true;
                }
            });

            if (bestEventBoost > 0) builder.add(bestEventBoost, 'Swap event confirmed');
            if (pairInteraction) builder.add(0.10, 'Swap event emitted by effectiveTo (direct pair interaction)');
            if (flow!.netIn.length === 1) builder.add(0.15, 'Clean single output');

            if (swapEvents.length >= 2) {
                // Determine route tokens roughly
                const allIntermediates = swapEvents.map(e => e.address);
                details.routeTokens = [...new Set(allIntermediates)];
            }

            const targetRecord = ctx.resolveTarget();
            if (targetRecord && targetRecord.category === 'dex') {
                builder.add(targetRecord.confidenceBoost, 'Target is a known DEX router');
            }

            const sel = ctx.resolveSelector();
            if (sel && sel.category === 'dex_swap') {
                builder.add(sel.confidenceBoost, 'DEX selector identified');
            }

        } else {
            // Add/Remove Liquidity logic
            builder.add(0.40, 'Unidirectional flow confirmed');

            const events = subType === TransactionType.ADD_LIQUIDITY ? addLiqEvents : remLiqEvents;
            let bestEventBoost = 0;
            events.forEach(ev => {
                const evRecord = ctx.resolveEvent(ev.topics[0]);
                if (evRecord && evRecord.confidenceBoost > bestEventBoost) {
                    bestEventBoost = evRecord.confidenceBoost;
                }
            });
            if (bestEventBoost > 0) builder.add(bestEventBoost, 'Liquidity event match');

            const targetRecord = ctx.resolveTarget();
            if (targetRecord && targetRecord.category === 'dex') {
                builder.add(targetRecord.confidenceBoost, 'Target is a known DEX');
            }
        }

        const confidence = builder.getScore();
        if (confidence < 0.55) return this.noMatch();

        return {
            functionalType: subType,
            confidence,
            reasons: builder.getReasons(),
            details
        };
    }
}
