// src/services/classifier/core/Engine.ts
import {
    ClassificationResult,
    Transaction,
    Receipt,
    TransactionType,
    ExecutionType
} from './types';
import { ClassificationContext } from './Context';
import { TokenFlowAnalyzer } from '../infrastructure/TokenFlow';
import { ExecutionResolver } from '../infrastructure/ExecutionResolver';
import { ClassificationRule, RuleResult } from './Rule';

// Import Rules
import { SwapRule } from '../rules/dex/SwapRule';
import { NFTSaleRule } from '../rules/nft/NFTSaleRule';
import { BridgeRule } from '../rules/bridge/BridgeRule';
import { LendingRule } from '../rules/lending/LendingRule';
import { TransferRule } from '../rules/transfer/TransferRule';
import { ContractCreationRule } from '../rules/creation/ContractCreationRule';

export class ClassificationEngine {
    private rules: ClassificationRule[] = [];

    constructor() {
        this.registerRules();
    }

    private registerRules() {
        // Register ALL rules
        const rawRules = [
            new ContractCreationRule(),
            new SwapRule(),
            new BridgeRule(),
            new LendingRule(),
            new NFTSaleRule(),
            new TransferRule()
        ];

        // STRICT PRIORITY SORT: Higher Priority First
        this.rules = rawRules.sort((a, b) => b.priority - a.priority);
    }

    public async classify(tx: Transaction, receipt: Receipt, chainId: number): Promise<ClassificationResult> {
        // --- PHASE 1: Normalization & Execution Resolution ---
        // Resolves Proxies, Multisigs, and Contracts BEFORE any rule sees the tx.
        const executionDetails = ExecutionResolver.resolve(tx, receipt);

        // --- PHASE 2: Log Decoding & Token Flow ---
        // Captures Native, ERC20, ERC721 movements (and internal txs if available later)
        const flow = TokenFlowAnalyzer.analyze(receipt.logs, tx.value, tx.from, tx.to, []);

        // --- PHASE 3: Context Assembly (Immutable/Frozen) ---
        const ctx = new ClassificationContext(
            tx,
            receipt,
            flow,
            chainId,
            executionDetails
        );

        // --- PHASE 4: Rule Evaluation (Strict First-Match) ---
        let bestMatch: RuleResult | null = null;

        interface DebugTraceEntry {
            rule: string;
            priority: number;
            matched: boolean;
            classified: boolean;
            error?: string;
            failureReason?: string;
        }

        const debugTrace: DebugTraceEntry[] = [];
        const executionInfo = {
            effectiveTo: executionDetails.effectiveTo,
            resolutionMethod: executionDetails.resolutionMethod,
            isProxy: executionDetails.isProxy,
            isMultisig: executionDetails.isMultisig,
            isDelegateCall: executionDetails.isDelegateCall
        };

        for (const rule of this.rules) {
            const entry: DebugTraceEntry = {
                rule: rule.id,
                priority: rule.priority,
                matched: false,
                classified: false
            };

            // 1. Check Applicability (Pure Check)
            if (!rule.matches(ctx)) {
                entry.failureReason = 'matches() returned false';
                debugTrace.push(entry);
                continue;
            }

            entry.matched = true;

            // 2. Evaluate & Classify
            try {
                // If matches() is true, we attempt classification.
                // The first rule to return a result is the FINAL classification.
                // We trust the Priority Order implicitly.
                const result = rule.classify(ctx);

                if (result) {
                    entry.classified = true;
                    debugTrace.push(entry);
                    bestMatch = result;
                    break; // STOP IMMEDIATELY
                } else {
                    entry.failureReason = 'classify() returned null';
                    debugTrace.push(entry);
                }
            } catch (e: any) {
                entry.error = e.message;
                entry.failureReason = 'classify() threw exception';
                debugTrace.push(entry);
            }
        }

        // --- PHASE 5: Deliver Result ---

        // Determine Execution Type Final Label
        const finalExecutionType = executionDetails.isProxy ? ExecutionType.RELAYED : ExecutionType.DIRECT;

        // A. Match Found
        if (bestMatch) {
            const nearMisses = debugTrace.filter(e => e.matched && !e.classified).slice(0, 2);
            return {
                functionalType: bestMatch.type,
                executionType: finalExecutionType, // Decoupled from Functional Type
                confidence: {
                    score: bestMatch.confidence,
                    reasons: [
                        ...bestMatch.reasons,
                        `Execution: ${executionDetails.resolutionMethod}`,
                        ...(nearMisses.length > 0 ? [`Near misses: ${JSON.stringify(nearMisses)}`] : [])
                    ]
                },
                details: {
                    protocol: bestMatch.protocol,
                    ...executionDetails, // Include proxy details in output
                    debugTrace: process.env.DEBUG_CLASSIFIER ? debugTrace : undefined
                },
                protocol: bestMatch.protocol
            };
        }

        // B. Fallback: Successful Transaction but No Semantic Match
        if (receipt.status !== 0) {
            const topNearMisses = debugTrace.filter(e => e.matched).slice(0, 2);
            return {
                functionalType: TransactionType.CONTRACT_INTERACTION,
                executionType: finalExecutionType,
                confidence: {
                    score: 0.1, // Low confidence generic fallback
                    reasons: [
                        'Fallback: Valid execution but no semantic rule matched',
                        `Execution: ${executionDetails.resolutionMethod}`,
                        `Top near-matches: ${JSON.stringify(topNearMisses)}`
                    ]
                },
                details: {
                    protocol: 'Unknown Protocol',
                    ...executionDetails,
                    debugTrace: process.env.DEBUG_CLASSIFIER ? debugTrace : undefined
                }
            };
        }

        // C. Terminal Unknown (Failed Tx or total miss)
        const topNearMisses = debugTrace.filter(e => e.matched).slice(0, 2);
        return {
            functionalType: TransactionType.UNKNOWN,
            executionType: ExecutionType.UNKNOWN,
            confidence: {
                score: 0,
                reasons: [
                    'No rule matched any transaction pattern',
                    `Execution: ${executionDetails.resolutionMethod}`,
                    `Rules evaluated: ${debugTrace.length}`,
                    ...(topNearMisses.length > 0 ? [`Top near-matches: ${JSON.stringify(topNearMisses)}`] : [])
                ]
            },
            details: {
                ...executionDetails,
                debugTrace: process.env.DEBUG_CLASSIFIER ? debugTrace : undefined
            }
        };
    }
}
