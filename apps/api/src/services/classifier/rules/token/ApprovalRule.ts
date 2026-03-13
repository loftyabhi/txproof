// ═══ FILE: rules/token/ApprovalRule.ts ═══
import { BaseRule } from '../../core/BaseRule';
import { ClassificationContext } from '../../core/Context';
import { RuleResult, TransactionType } from '../../core/types';
import { ConfidenceBuilder } from '../../core/ConfidenceBuilder';
import { EVM } from '../../infrastructure/constants/evm';

export class ApprovalRule extends BaseRule {
    readonly id = 'token_approval';
    readonly priority = 95;

    matches(ctx: ClassificationContext): boolean {
        if (this.selectorMatchesCategory(ctx, 'token_approval')) return true;
        return this.getEventsByCategory(ctx, 'token_approval').length > 0;
    }

    classify(ctx: ClassificationContext): RuleResult | null {
        if (!this.matches(ctx)) return this.noMatch();

        const builder = new ConfidenceBuilder();
        const sel = ctx.resolveSelector();
        if (sel?.category === 'token_approval') {
            builder.add(sel.confidenceBoost, 'Matched token_approval selector');
        }

        const approvalEvents = this.getEventsByCategory(ctx, 'token_approval');
        let spender: string | undefined;
        let isForAll = false;

        if (approvalEvents.length > 0) {
            const eventTopic = approvalEvents[0].topics[0];
            const evRecord = ctx.resolveEvent(eventTopic);
            if (evRecord) {
                builder.add(evRecord.confidenceBoost, 'Matched token_approval event log');
            }

            if (eventTopic === EVM.ERC20_APPROVAL_TOPIC && approvalEvents[0].topics.length === 3) {
                // ERC-20 Approval(owner, spender, value)
                spender = '0x' + approvalEvents[0].topics[2].slice(-40);
            } else if (eventTopic === EVM.ERC721_APPROVAL_FOR_ALL_TOPIC && approvalEvents[0].topics.length === 3) {
                // ERC-721 ApprovalForAll(owner, operator, approved)
                spender = '0x' + approvalEvents[0].topics[2].slice(-40);
                isForAll = true;
            }
        }

        if (spender) {
            const target = ctx.resolveAddress(spender);
            if (target) {
                builder.add(0.2, 'Spender is a known protocol address');
            }
        }

        const transferLogs = ctx.receipt.logs.filter(l =>
            l.topics[0] === EVM.ERC20_TRANSFER_TOPIC ||
            l.topics[0] === EVM.ERC721_TRANSFER_TOPIC ||
            l.topics[0] === EVM.ERC1155_TRANSFER_SINGLE_TOPIC ||
            l.topics[0] === EVM.ERC1155_TRANSFER_BATCH_TOPIC
        );

        if (transferLogs.length > 0) {
            builder.add(-0.2, 'Transfer events present, likely a wrapped call or mixed tx');
        }

        const confidence = builder.getScore();
        if (confidence < 0.55) return this.noMatch();

        return {
            functionalType: TransactionType.TOKEN_APPROVAL,
            confidence,
            reasons: builder.getReasons(),
            details: {
                spender,
                isForAll
            }
        };
    }
}
