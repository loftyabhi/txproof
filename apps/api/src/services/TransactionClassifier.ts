// ═══ FILE: TransactionClassifier.ts ═══
import { Transaction, Receipt, ClassificationResult, TransactionType, ExecutionType, TransactionEnvelopeType } from './classifier/core/types';
import { ProtocolRegistry } from './classifier/infrastructure/ProtocolRegistry';
import { ClassificationEngine } from './classifier/core/Engine';
import { getDatabasePool } from '../utils/db'; // Corrected path

export class TransactionClassifierService {
    private engine: ClassificationEngine;

    constructor() {
        const dbPool = getDatabasePool(); // Assume this gets the pg.Pool instance
        const registry = new ProtocolRegistry(dbPool);

        // LRU Cache implicitly inside engine
        this.engine = new ClassificationEngine(registry, 10000);
    }

    /**
     * Manually invalidate the internal engine/registry cache.
     */
    async invalidateCache(): Promise<void> {
        ProtocolRegistry.invalidate();
    }

    /**
     * Main entry point to classify a transaction.
     */
    async classifyTransaction(tx: Transaction, receipt: Receipt): Promise<ClassificationResult> {
        try {
            const startStr = Date.now();
            const result = await this.engine.classify(tx, receipt);
            const duration = Date.now() - startStr;

            // Overlapping error guard: if somehow unknown gets emitted with bad confidence
            if (result.confidence.score < 0.20 && result.functionalType !== TransactionType.UNCLASSIFIED_COMPLEX) {
                return {
                    ...result,
                    functionalType: TransactionType.UNCLASSIFIED_COMPLEX,
                    confidence: {
                        score: 0,
                        reasons: ['Overridden by classifier guard. Score too low.']
                    }
                };
            }

            // Could emit metrics here (duration, confidence hit misses, etc.)

            return result;
        } catch (error: any) {
            console.error(`[TransactionClassifier] Fatal error classifying tx ${tx.hash}:`, error);
            throw error;
        }
    }

    /**
     * Legacy wrapper for older usage. Maps ethers types to core types.
     */
    async classify(receipt: any, tx: any, chainId: number): Promise<ClassificationResult> {
        return this.classifyTransaction(
            { ...tx, hash: tx.hash, from: tx.from, to: tx.to, value: tx.value?.toString(), data: tx.data, chainId, nonce: tx.nonce, gasLimit: tx.gasLimit?.toString() } as any,
            { ...receipt, status: receipt.status, logs: receipt.logs, from: receipt.from, contractAddress: receipt.contractAddress, gasUsed: receipt.gasUsed?.toString() } as any
        );
    }

    getTypeLabel(type: TransactionType): string {
        switch (type) {
            case TransactionType.SOCIAL_CAST: return 'Social Cast';
            case TransactionType.NATIVE_TRANSFER: return 'Native Transfer';
            case TransactionType.TOKEN_TRANSFER: return 'Token Transfer';
            case TransactionType.SWAP: return 'Swap';
            case TransactionType.NFT_SALE: return 'NFT Sale';
            default: return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        }
    }

    getTypeIcon(type: TransactionType): string {
        switch (type) {
            case TransactionType.SOCIAL_CAST: return '💬';
            case TransactionType.NATIVE_TRANSFER: return '💸';
            case TransactionType.TOKEN_TRANSFER: return '🪙';
            case TransactionType.SWAP: return '🔄';
            case TransactionType.NFT_SALE: return '🖼️';
            default: return '📄';
        }
    }
}

export const transactionClassifier = new TransactionClassifierService();
export { TransactionType, ExecutionType, TransactionEnvelopeType };
export type { ClassificationResult };
