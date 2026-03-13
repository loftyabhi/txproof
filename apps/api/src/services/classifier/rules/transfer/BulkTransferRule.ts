// ═══ FILE: rules/transfer/BulkTransferRule.ts ═══
import { BaseRule } from '../../core/BaseRule';
import { ClassificationContext } from '../../core/Context';
import { RuleResult, TransactionType } from '../../core/types';
import { ConfidenceBuilder } from '../../core/ConfidenceBuilder';
import { EVM } from '../../infrastructure/constants/evm';

export class BulkTransferRule extends BaseRule {
    readonly id = 'bulk_transfer';
    readonly priority = 60;

    matches(ctx: ClassificationContext): boolean {
        if (ctx.receipt.logs.length <= 5) return false;

        const transferLogs = ctx.receipt.logs.filter(l =>
            l.topics[0] === EVM.ERC20_TRANSFER_TOPIC ||
            l.topics[0] === EVM.ERC721_TRANSFER_TOPIC ||
            l.topics[0] === EVM.ERC1155_TRANSFER_SINGLE_TOPIC ||
            l.topics[0] === EVM.ERC1155_TRANSFER_BATCH_TOPIC
        );

        if (transferLogs.length < 3) return false;

        // Count unique recipient addresses
        const recipients = new Set<string>();
        for (const l of transferLogs) {
            if (l.topics[0] === EVM.ERC20_TRANSFER_TOPIC || l.topics[0] === EVM.ERC721_TRANSFER_TOPIC) {
                if (l.topics.length >= 3) recipients.add('0x' + l.topics[2].slice(-40).toLowerCase());
            } else if (l.topics[0] === EVM.ERC1155_TRANSFER_SINGLE_TOPIC) {
                if (l.topics.length >= 4) recipients.add('0x' + l.topics[3].slice(-40).toLowerCase());
            }
        }

        return recipients.size >= 3;
    }

    classify(ctx: ClassificationContext): RuleResult | null {
        if (!this.matches(ctx)) return this.noMatch();

        const transferLogs = ctx.receipt.logs.filter(l =>
            l.topics[0] === EVM.ERC20_TRANSFER_TOPIC ||
            l.topics[0] === EVM.ERC721_TRANSFER_TOPIC ||
            l.topics[0] === EVM.ERC1155_TRANSFER_SINGLE_TOPIC ||
            l.topics[0] === EVM.ERC1155_TRANSFER_BATCH_TOPIC
        );

        const recipients = new Set<string>();
        const tokens = new Set<string>();

        transferLogs.forEach(l => {
            tokens.add(l.address.toLowerCase());
            if (l.topics[0] === EVM.ERC20_TRANSFER_TOPIC || l.topics[0] === EVM.ERC721_TRANSFER_TOPIC) {
                if (l.topics.length >= 3) recipients.add('0x' + l.topics[2].slice(-40).toLowerCase());
            } else if (l.topics[0] === EVM.ERC1155_TRANSFER_SINGLE_TOPIC) {
                if (l.topics.length >= 4) recipients.add('0x' + l.topics[3].slice(-40).toLowerCase());
            }
        });

        const builder = new ConfidenceBuilder();

        if (recipients.size >= 3) {
            builder.add(0.40, `Multiple recipients (${recipients.size})`);
        }
        if (tokens.size === 1) {
            builder.add(0.20, 'All transfers from a single token contract');
        }
        if (ctx.tx.from.toLowerCase() === ctx.effectiveTo.toLowerCase()) {
            builder.add(0.20, 'Direct distribution (sender is the router/contract)');
        }
        if (recipients.size >= 10) {
            builder.add(0.10, 'Massive distribution (>= 10 recipients)');
        }

        const flow = this.getMeaningfulFlow(ctx);
        if (flow && flow.netIn.length > 0) {
            builder.add(-0.30, 'Incoming funds to sender detected (not pure distribution)');
        }

        const confidence = builder.getScore();
        if (confidence < 0.60) return this.noMatch();

        return {
            functionalType: TransactionType.BULK_TRANSFER,
            confidence,
            reasons: builder.getReasons(),
            details: {}
        };
    }
}
