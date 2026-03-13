// ═══ FILE: core/Engine.ts ═══
import { Transaction, Receipt, ClassificationResult, TransactionType, ExecutionType } from './types';
import { ProtocolRegistry } from '../infrastructure/ProtocolRegistry';
import { ExecutionResolver } from '../infrastructure/ExecutionResolver';
import { TokenFlowAnalyzer } from '../infrastructure/TokenFlow';
import { ClassificationContext } from './Context';
import { ClassificationRule } from './Rule';
// Import all rules
import { ContractCreationRule } from '../rules/creation/ContractCreationRule';
import { ApprovalRule } from '../rules/token/ApprovalRule';
import { BridgeRule } from '../rules/bridge/BridgeRule';
import { LendingRule } from '../rules/lending/LendingRule';
import { FlashLoanRule } from '../rules/lending/FlashLoanRule';
import { GovernanceRule } from '../rules/governance/GovernanceRule';
import { StakingRule } from '../rules/staking/StakingRule';
import { SwapRule } from '../rules/dex/SwapRule';
import { NFTSaleRule } from '../rules/nft/NFTSaleRule';
import { BulkTransferRule } from '../rules/transfer/BulkTransferRule';
import { TransferRule } from '../rules/transfer/TransferRule';
import { ContractInteractionRule } from '../rules/fallback/ContractInteractionRule';

class LRUCache<K, V> {
    private cache = new Map<K, V>();
    constructor(private maxSize: number) { }

    get(key: K): V | undefined {
        if (!this.cache.has(key)) return undefined;
        const val = this.cache.get(key)!;
        this.cache.delete(key);
        this.cache.set(key, val);
        return val;
    }

    set(key: K, value: V): void {
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        this.cache.set(key, value);
    }
}

export class ClassificationEngine {
    private readonly rules: ClassificationRule[];
    private readonly cache: LRUCache<string, ClassificationResult>;

    constructor(
        private readonly registry: ProtocolRegistry,
        cacheSize: number = 10000
    ) {
        this.cache = new LRUCache<string, ClassificationResult>(cacheSize);
        this.rules = [
            new ContractCreationRule(),
            new ApprovalRule(),
            new BridgeRule(),
            new LendingRule(),
            new FlashLoanRule(),
            new GovernanceRule(),
            new StakingRule(),
            new SwapRule(),
            new NFTSaleRule(),
            new BulkTransferRule(),
            new TransferRule(),
            new ContractInteractionRule()
        ].sort((a, b) => b.priority - a.priority);
    }

    async classify(tx: Transaction, receipt: Receipt): Promise<ClassificationResult> {
        // Phase 1: Cache Check
        const cacheKey = `${tx.chainId}:${tx.hash}`;
        const cached = this.cache.get(cacheKey);
        if (cached) return cached;

        // Phase 2: Registry Snapshot
        const snapshot = await this.registry.getSnapshot();

        // Phase 3: Execution Resolution
        const execDetails = await ExecutionResolver.resolve(tx, receipt, snapshot, tx.chainId);

        // Phase 4: Token Flow Analysis
        const chainConfig = snapshot.byChain.get(tx.chainId) || { dustThresholdWei: 1000n } as any;
        const flow = TokenFlowAnalyzer.analyze(
            receipt.logs,
            tx.value,
            tx.from,
            tx.to,
            [], // internal txs not available
            chainConfig.dustThresholdWei
        );

        // Phase 5: Context Assembly
        const ctx = new ClassificationContext(tx, receipt, flow, tx.chainId, snapshot, execDetails);

        // Phase 6: Rule Evaluation
        let bestRuleResult = null;
        for (const rule of this.rules) {
            if (!rule.matches(ctx)) continue;

            const result = rule.classify(ctx);
            if (result && result.confidence >= 0.50) {
                if (!bestRuleResult || result.confidence > bestRuleResult.confidence) {
                    bestRuleResult = result;
                    if (result.confidence >= 0.95) break; // short circuit
                }
            }
        }

        // Phase 7: Selection & Formatting
        let finalResult: ClassificationResult;

        if (bestRuleResult) {
            finalResult = {
                functionalType: bestRuleResult.functionalType,
                executionType: execDetails.executionType,
                confidence: {
                    score: bestRuleResult.confidence,
                    reasons: bestRuleResult.reasons
                },
                details: bestRuleResult.details,
                protocol: bestRuleResult.details.stakingProtocol || ctx.resolveTarget()?.protocolName
            };
        } else {
            finalResult = {
                functionalType: TransactionType.UNCLASSIFIED_COMPLEX,
                executionType: execDetails.executionType,
                confidence: { score: 0, reasons: ['No rule met minimum confidence threshold'] },
                details: {}
            };
        }

        if (execDetails.isProxy) {
            finalResult.details.isProxy = true;
            finalResult.details.proxyImplementation = execDetails.implementation ?? undefined;
        }

        this.cache.set(cacheKey, finalResult);
        return finalResult;
    }
}
