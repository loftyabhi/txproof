// Public Entry Point for Classification System

// Main Service
// We export the Service Class as 'TransactionClassifier'
export { TransactionClassifierService as TransactionClassifier } from '../TransactionClassifier';

// Public Types & Enums
export {
    TransactionType,
    TransactionEnvelopeType,
    ExecutionType
} from './core/types';

export type {
    ConfidenceScore,
    ConfidenceBreakdown,
    ClassificationResult,
    ClassificationDetails,
    TokenMovement,
    TokenFlow,
    FlowRole
} from './core/types';

// Export AA Details helper interface if public
export type { AADetails } from './resolvers/AccountAbstractionResolver';

// Do NOT export internal Engine, Rules, or Context.
