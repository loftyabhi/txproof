import {
    Transaction, Receipt, Log, ClassificationResult, TransactionType, ExecutionType,
    IExecutionResolver, IProtocolDetector, ClassificationDetails, ConfidenceScore
} from './types';
import { Decoder } from './utils';
import { TokenFlowAnalyzer } from './TokenFlow';
import { DirectResolver, MultisigResolver, AccountAbstractionResolver } from './resolvers';
import { DEXDetector, NFTDetector, BridgeDetector, LendingDetector } from './protocols';

export class ClassificationEngine {
    private executionResolvers: IExecutionResolver[];
    private protocolDetectors: IProtocolDetector[];

    constructor() {
        this.executionResolvers = [
            new AccountAbstractionResolver(),
            new MultisigResolver(),
            new DirectResolver() // Fallback
        ];

        this.protocolDetectors = [
            new DEXDetector(),
            new NFTDetector(),
            new BridgeDetector(),
            new LendingDetector()
        ];
    }

    async classify(tx: Transaction, receipt: Receipt): Promise<ClassificationResult> {
        // 1. Resolve Execution Type
        let executionType = ExecutionType.UNKNOWN;
        for (const resolver of this.executionResolvers) {
            const type = await resolver.resolve(tx, receipt, receipt.logs);
            if (type !== ExecutionType.UNKNOWN) {
                executionType = type;
                break; // Stop at first specific match (Priority: AA > Multisig > Direct)
            }
        }
        if (executionType === ExecutionType.UNKNOWN) executionType = ExecutionType.DIRECT;

        // 2. Resolve Protocol / Functional Type
        let match = null;
        for (const detector of this.protocolDetectors) {
            const result = await detector.detect(tx, receipt);
            if (result) {
                // Heuristic: If we found a match, is it better than what we have? 
                // Currently first match wins or we could compare confidence.
                // Detector order matters: DEX > NFT > Bridge > Lending
                match = result;
                break;
            }
        }

        // 3. Token Flow Analysis (if no protocol detected or to enhance details)
        const flow = TokenFlowAnalyzer.analyze(
            receipt.logs,
            tx.value,
            tx.from,
            tx.to || '0x0'
        );

        // 4. Construct Result
        let functionalType = match ? match.type : TransactionType.UNKNOWN;
        let confidenceScore = match ? match.confidence : 0;
        let protocol = match ? match.name : undefined;
        let details: ClassificationDetails = {
            protocol,
            method: tx.data.slice(0, 10),
            contractAddress: tx.to || undefined,
            isProxy: executionType !== ExecutionType.DIRECT
        };

        // Fallback Logic
        if (functionalType === TransactionType.UNKNOWN) {
            // Check Contract Deployment
            if (!tx.to) {
                functionalType = TransactionType.CONTRACT_DEPLOYMENT;
                confidenceScore = 1.0;
            }
            // Check Native Transfer
            else if (tx.data === '0x' && BigInt(tx.value) > BigInt(0) && receipt.logs.length === 0) {
                functionalType = TransactionType.NATIVE_TRANSFER;
                confidenceScore = 1.0;
            }
            // Check Token Transfer (from Flow)
            else {
                // Analyze Flow
                // If 1 outgoing ERC20/721/1155 and 0 incoming -> Transfer
                // If 1 incoming -> Receive (but from perspective of sender it's Interaction)
                // Start simple generic fallback
                functionalType = TransactionType.CONTRACT_INTERACTION;
                confidenceScore = 0.5;

                // Try to be more specific
                const senderFlow = flow[Decoder.normalizeAddress(tx.from)];
                if (senderFlow) {
                    if (senderFlow.outgoing.length === 1 && senderFlow.incoming.length === 0) {
                        const out = senderFlow.outgoing[0];
                        if (out.type === 'ERC20') functionalType = TransactionType.TOKEN_TRANSFER;
                        if (out.type === 'ERC721') functionalType = TransactionType.NFT_TRANSFER;
                        if (out.type === 'ERC1155') functionalType = TransactionType.NFT_TRANSFER; // Simplify
                        confidenceScore = 0.8;
                    }
                }
            }
        }

        return {
            functionalType,
            executionType,
            confidence: {
                score: confidenceScore,
                reasons: match ? [match.name + ' detected'] : ['Heuristic classification']
            },
            details,
            type: functionalType // Backward compat
        };
    }
}
