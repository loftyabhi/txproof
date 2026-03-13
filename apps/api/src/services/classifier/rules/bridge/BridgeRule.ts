// ═══ FILE: rules/bridge/BridgeRule.ts ═══
import { BaseRule } from '../../core/BaseRule';
import { ClassificationContext } from '../../core/Context';
import { RuleResult, TransactionType } from '../../core/types';
import { ConfidenceBuilder } from '../../core/ConfidenceBuilder';

export class BridgeRule extends BaseRule {
    readonly id = 'bridge';
    readonly priority = 90;

    matches(ctx: ClassificationContext): boolean {
        return ctx.targetIsCategory('bridge') ||
            ctx.hasInternalCallTo('bridge') ||
            this.getEventsByCategory(ctx, 'bridge_send').length > 0 ||
            this.getEventsByCategory(ctx, 'bridge_receive').length > 0;
    }

    classify(ctx: ClassificationContext): RuleResult | null {
        if (!this.matches(ctx)) return this.noMatch();

        const builder = new ConfidenceBuilder();
        const flow = this.getMeaningfulFlow(ctx);

        // Gate: Requires flow base + signal.
        if (!flow || !flow.hasAnyFlow) {
            // Cannot confidently identify direction without flow.
            return this.noMatch();
        }

        let direction: 'DEPOSIT' | 'WITHDRAW' | 'BIDIRECTIONAL' | 'UNKNOWN' = 'UNKNOWN';
        if (flow.netOut.length > 0 && flow.netIn.length === 0) {
            direction = 'DEPOSIT';
            builder.add(0.40, 'Unidirectional flow OUT (deposit)');
        } else if (flow.netIn.length > 0 && flow.netOut.length === 0) {
            direction = 'WITHDRAW';
            builder.add(0.40, 'Unidirectional flow IN (withdraw)');
        } else if (flow.netOut.length > 0 && flow.netIn.length > 0) {
            direction = 'BIDIRECTIONAL';
            builder.add(0.00, 'Bidirectional flow');
        }

        // SIGNAL BOOSTS
        const targetRecord = ctx.resolveTarget();
        if (targetRecord && targetRecord.category === 'bridge') {
            builder.add(targetRecord.confidenceBoost, 'Target is a known bridge contract');
        }

        const sendEvents = this.getEventsByCategory(ctx, 'bridge_send');
        const receiveEvents = this.getEventsByCategory(ctx, 'bridge_receive');

        // Distict event categories matching
        const observedEventCategories = new Set<string>();
        [...sendEvents, ...receiveEvents].forEach(ev => {
            const evRecord = ctx.resolveEvent(ev.topics[0]);
            if (evRecord && !observedEventCategories.has(evRecord.category)) {
                observedEventCategories.add(evRecord.category);
                builder.add(evRecord.confidenceBoost, `Matched ${evRecord.category} event`);
            }
        });

        if (ctx.hasInternalCallTo('bridge') && (!targetRecord || targetRecord.category !== 'bridge')) {
            builder.add(0.20, 'Has internal call to known bridge');
        }

        // PENALTIES
        if (sendEvents.length === 0 && receiveEvents.length === 0) {
            if (flow.netOut.some(m => m.type === 'ERC20') || flow.netIn.some(m => m.type === 'ERC20')) {
                builder.add(-0.25, 'Only ERC20 transfer, no bridge events (likely generic transfer)');
            }
            if (flow.nftOut.length > 0 || flow.nftIn.length > 0) {
                builder.add(-0.25, 'NFT moved without bridge events');
            }
        }

        const confidence = builder.getScore();
        // Comment in code: "Gate of 0.70 requires flow base (0.40) + at least one signal.
        // Address match alone (0.35) passes with flow. Event alone (0.25-0.30) does NOT
        // pass without address. This is intentional — prevents generic transfers being
        // misclassified as bridges."
        if (confidence < 0.70) return this.noMatch();

        let functionalType = TransactionType.UNKNOWN;
        const isL1 = ctx.chainConfig.chainType === 'L1';

        if (isL1 && direction === 'DEPOSIT') {
            // Target L2 bridge from L1 is L2_DEPOSIT
            // (Assuming generic cross chain is BRIDGE_DEPOSIT, L1->L2 is specifically L2_DEPOSIT)
            functionalType = TransactionType.BRIDGE_DEPOSIT;
            if (targetRecord?.label.includes('L1')) functionalType = TransactionType.L2_DEPOSIT; // As L1 gateway
        } else if (!isL1 && direction === 'DEPOSIT') {
            functionalType = TransactionType.L2_WITHDRAWAL;
        } else if (isL1 && direction === 'WITHDRAW') {
            functionalType = TransactionType.L2_FINALIZE_WITHDRAWAL;
        } else if (!isL1 && direction === 'WITHDRAW') {
            functionalType = TransactionType.BRIDGE_WITHDRAW;
        }

        return {
            functionalType,
            confidence,
            reasons: builder.getReasons(),
            details: {}
        };
    }
}
