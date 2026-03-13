// ═══ FILE: core/Rule.ts ═══
import { ClassificationContext } from './Context';
import { RuleResult } from './types';

/**
 * Interface for all classification rules.
 */
export interface ClassificationRule {
    /** Unique rule identifier, e.g. 'core_contract_creation' */
    readonly id: string;

    /** Priority 0-100. Higher priority rules are executed first and win ties. */
    readonly priority: number;

    /** Synchronous, fast check if this rule could apply. */
    matches(ctx: ClassificationContext): boolean;

    /** Synchronous, full classification. Returns result or null if no match. */
    classify(ctx: ClassificationContext): RuleResult | null;
}
