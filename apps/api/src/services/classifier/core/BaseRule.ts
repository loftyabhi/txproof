// ═══ FILE: core/BaseRule.ts ═══
import { ClassificationRule } from './Rule';
import { ClassificationContext } from './Context';
import { RuleResult, Log, TokenMovement } from './types';

/**
 * Abstract class that all classification rules MUST extend.
 * Provides mandatory builder tools and protects against invalid raw returns.
 */
export abstract class BaseRule implements ClassificationRule {
    abstract readonly id: string;
    abstract readonly priority: number;

    abstract matches(ctx: ClassificationContext): boolean;
    abstract classify(ctx: ClassificationContext): RuleResult | null;

    /**
     * Always use this instead of `return null as any`
     */
    protected noMatch(): null {
        return null;
    }

    /** Get all logs matching a specific event category from registry */
    protected getEventsByCategory(ctx: ClassificationContext, category: string): Log[] {
        return ctx.getLogsByCategory(category);
    }

    /** Check if tx data starts with selector of given category */
    protected selectorMatchesCategory(ctx: ClassificationContext, category: string): boolean {
        const rec = ctx.resolveSelector();
        return rec?.category === category;
    }

    /** 
     * Get net meaningful flows for sender (above chain dust threshold) 
     * Returns null if sender has no flow entry
     */
    protected getMeaningfulFlow(ctx: ClassificationContext): {
        netOut: TokenMovement[];
        netIn: TokenMovement[];
        nftOut: TokenMovement[];
        nftIn: TokenMovement[];
        hasAnyFlow: boolean;
    } | null {
        const flow = ctx.getSenderFlow();
        if (!flow) return null;

        const dust = ctx.chainConfig.dustThresholdWei;
        const netOut = flow.outgoing.filter(m => BigInt(m.amount) > dust);
        const netIn = flow.incoming.filter(m => BigInt(m.amount) > dust);
        const nftOut = netOut.filter(m => m.type === 'ERC721' || m.type === 'ERC1155');
        const nftIn = netIn.filter(m => m.type === 'ERC721' || m.type === 'ERC1155');

        return {
            netOut, netIn, nftOut, nftIn,
            hasAnyFlow: netOut.length > 0 || netIn.length > 0,
        };
    }
}
