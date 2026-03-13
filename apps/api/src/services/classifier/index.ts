// ═══ FILE: index.ts ═══
// Main exported facade for the classifier package
export { TransactionClassifierService } from '../TransactionClassifier';
export { TransactionType, ExecutionType, TransactionEnvelopeType } from './core/types';
export type { Transaction, Receipt, Log, ClassificationResult, ConfidenceScore, ClassificationDetails } from './core/types';
export { ProtocolRegistry } from './infrastructure/ProtocolRegistry';
