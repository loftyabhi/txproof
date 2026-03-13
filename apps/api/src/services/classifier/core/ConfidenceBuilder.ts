// ═══ FILE: core/ConfidenceBuilder.ts ═══

/**
 * Fluent confidence scoring builder.
 * Required for all rules to avoid manual score arithmetic.
 */
export class ConfidenceBuilder {
    private score: number = 0;
    private readonly reasons: string[] = [];

    /**
     * Add or subtract confidence with a string reason.
     * Use positive amounts for boosts, negative for penalties.
     */
    add(amount: number, reason: string): this {
        if (amount > 0) {
            this.score += amount;
            this.reasons.push(`${reason} (+${amount.toFixed(2)})`);
        } else if (amount < 0) {
            this.score += amount;
            this.reasons.push(`${reason} (${amount.toFixed(2)})`);
        }
        return this;
    }

    /** Set base confidence abruptly */
    setBase(amount: number, reason: string): this {
        this.score = amount;
        this.reasons.push(`Base: ${reason} (=${amount.toFixed(2)})`);
        return this;
    }

    /** Returns the final score bound between 0 and 1 */
    getScore(): number {
        return Math.min(1.0, Math.max(0.0, this.score));
    }

    /** Get the log of reasons for this score */
    getReasons(): string[] {
        return [...this.reasons];
    }
}
