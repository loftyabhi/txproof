// src/services/classifier/rules/nft/NFTSaleRule.ts
import { ClassificationRule, RuleResult } from '../../core/Rule';
import { ClassificationContext } from '../../core/Context';
import { TransactionType } from '../../core/types';

const MARKETPLACE_EVENTS = [
    '0x9d9af8e38d66c62e2c12f0225249fd9d721c54b83f48d9352c97c6cacdcb6f31', // Seaport OrderFulfilled
    '0x61cbb2a3dee0b6064c2e681aadd61677fb4ef319f0b547508d495626f5a62f64', // Blur OrderMatched
];

export class NFTSaleRule implements ClassificationRule {
    id = 'nft_sale';
    name = 'NFT Marketplace Sale';
    priority = 80;

    matches(ctx: ClassificationContext): boolean {
        return ctx.receipt.logs.some(l => MARKETPLACE_EVENTS.includes(l.topics[0]));
    }

    classify(ctx: ClassificationContext): RuleResult {
        const marketLogs = ctx.receipt.logs.filter(l => MARKETPLACE_EVENTS.includes(l.topics[0]));

        // 1. Protocol Identification
        let protocol = 'Unknown Marketplace';
        if (marketLogs.some(l => l.topics[0] === MARKETPLACE_EVENTS[0])) protocol = 'OpenSea (Seaport)';
        if (marketLogs.some(l => l.topics[0] === MARKETPLACE_EVENTS[1])) protocol = 'Blur';

        // 2. Token Flow Analysis
        // Sales should involve NFT movement + Payment.
        const sender = ctx.tx.from.toLowerCase();
        const flow = ctx.flow[sender];

        let tokenFlowMatch = 0.5; // Baseline
        if (flow) {
            // Did we send ETH/WETH? Did we receive NFT? (BUY)
            // OR Did we send NFT? Did we receive ETH/WETH? (SELL)
            const hasIncoming = flow.incoming.length > 0;
            const hasOutgoing = flow.outgoing.length > 0;
            if (hasIncoming && hasOutgoing) {
                tokenFlowMatch = 1.0;
            }
        }

        // 3. Address Match
        // If effectiveTo == Marketplace Contract?
        let addressMatch = 0.0;
        if (marketLogs.some(l => l.address.toLowerCase() === ctx.effectiveTo)) {
            addressMatch = 1.0;
        }

        return {
            type: TransactionType.NFT_SALE,
            confidence: 0.95,
            breakdown: {
                eventMatch: 1.0,
                tokenFlowMatch,
                methodMatch: 0,
                addressMatch,
                executionMatch: 1.0
            },
            protocol,
            reasons: [`Matched ${protocol} event signatures`, `Execution targeted ${protocol} contract`]
        };
    }
}
