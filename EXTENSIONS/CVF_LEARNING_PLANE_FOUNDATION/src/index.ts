// W4-T8 — Evaluation Engine Consumer Pipeline Bridge (CP1)
export {
  EvaluationEngineConsumerPipelineContract,
  createEvaluationEngineConsumerPipelineContract,
} from "./evaluation.engine.consumer.pipeline.contract";
export type {
  EvaluationEngineConsumerPipelineRequest,
  EvaluationEngineConsumerPipelineResult,
  EvaluationEngineConsumerPipelineContractDependencies,
} from "./evaluation.engine.consumer.pipeline.contract";

// W4-T8 — Evaluation Engine Consumer Pipeline Bridge (CP2)
export {
  EvaluationEngineConsumerPipelineBatchContract,
  createEvaluationEngineConsumerPipelineBatchContract,
} from "./evaluation.engine.consumer.pipeline.batch.contract";
export type {
  EvaluationEngineConsumerPipelineBatch,
} from "./evaluation.engine.consumer.pipeline.batch.contract";

// W4-T9 — TruthScore Consumer Pipeline Bridge (CP1)
export {
  TruthScoreConsumerPipelineContract,
  createTruthScoreConsumerPipelineContract,
} from "./truth.score.consumer.pipeline.contract";
export type {
  TruthScoreConsumerPipelineRequest,
  TruthScoreConsumerPipelineResult,
  TruthScoreConsumerPipelineContractDependencies,
} from "./truth.score.consumer.pipeline.contract";

// W4-T9 — TruthScore Consumer Pipeline Bridge (CP2)
export {
  TruthScoreConsumerPipelineBatchContract,
  createTruthScoreConsumerPipelineBatchContract,
} from "./truth.score.consumer.pipeline.batch.contract";
export type {
  TruthScoreConsumerPipelineBatch,
} from "./truth.score.consumer.pipeline.batch.contract";

// W6-T8 — Truth Model Scoring Slice (CP1–CP2)
export {
  TruthScoreContract,
  createTruthScoreContract,
} from "./truth.score.contract";
export type {
  TruthScoreClass,
  TruthScoreDimensions,
  TruthScore,
  TruthScoreContractDependencies,
} from "./truth.score.contract";
export {
  TruthScoreLogContract,
  createTruthScoreLogContract,
} from "./truth.score.log.contract";
export type {
  TruthScoreLog,
  TruthScoreLogContractDependencies,
} from "./truth.score.log.contract";

// W6-T6 — Pattern Drift Detection Slice (CP1–CP2)
export {
  PatternDriftContract,
  createPatternDriftContract,
} from "./pattern.drift.contract";
export type {
  DriftClass,
  PatternDriftSignal,
  PatternDriftContractDependencies,
} from "./pattern.drift.contract";
export {
  PatternDriftLogContract,
  createPatternDriftLogContract,
} from "./pattern.drift.log.contract";
export type {
  PatternDriftLog,
  PatternDriftLogContractDependencies,
} from "./pattern.drift.log.contract";

// W4-T7 — Learning Plane Observability Slice (CP1–CP2)
export {
  LearningObservabilityContract,
  createLearningObservabilityContract,
} from "./learning.observability.contract";
export type {
  ObservabilityHealth,
  LearningObservabilityReport,
  LearningObservabilityContractDependencies,
} from "./learning.observability.contract";
export {
  LearningObservabilitySnapshotContract,
  createLearningObservabilitySnapshotContract,
} from "./learning.observability.snapshot.contract";
export type {
  SnapshotTrend,
  LearningObservabilitySnapshot,
  LearningObservabilitySnapshotContractDependencies,
} from "./learning.observability.snapshot.contract";

// W4-T6 — Learning Plane Persistent Storage Slice (CP1–CP2)
export {
  LearningStorageContract,
  createLearningStorageContract,
} from "./learning.storage.contract";
export type {
  LearningRecordType,
  LearningStorageRecord,
  LearningStorageContractDependencies,
} from "./learning.storage.contract";
export {
  LearningStorageLogContract,
  createLearningStorageLogContract,
} from "./learning.storage.log.contract";
export type {
  LearningStorageLog,
  LearningStorageLogContractDependencies,
} from "./learning.storage.log.contract";

// W4-T5 — Learning Plane Re-injection Loop (CP1–CP2)
export {
  LearningReinjectionContract,
  createLearningReinjectionContract,
} from "./learning.reinjection.contract";
export type {
  LearningReinjectionResult,
  LearningReinjectionContractDependencies,
} from "./learning.reinjection.contract";
export {
  LearningLoopContract,
  createLearningLoopContract,
} from "./learning.loop.contract";
export type {
  LearningLoopSummary,
  LearningLoopContractDependencies,
} from "./learning.loop.contract";

// W4-T4 — Learning Plane Governance Signal Bridge (CP1–CP2)
export {
  GovernanceSignalContract,
  createGovernanceSignalContract,
} from "./governance.signal.contract";
export type {
  GovernanceSignalType,
  GovernanceUrgency,
  GovernanceSignal,
  GovernanceSignalContractDependencies,
} from "./governance.signal.contract";
export {
  GovernanceSignalLogContract,
  createGovernanceSignalLogContract,
} from "./governance.signal.log.contract";
export type {
  GovernanceSignalLog,
  GovernanceSignalLogContractDependencies,
} from "./governance.signal.log.contract";

// W4-T3 — Learning Plane Evaluation Engine Slice (CP1–CP2)
export {
  EvaluationEngineContract,
  createEvaluationEngineContract,
} from "./evaluation.engine.contract";
export type {
  EvaluationVerdict,
  EvaluationSeverity,
  EvaluationResult,
  EvaluationEngineContractDependencies,
} from "./evaluation.engine.contract";
export {
  EvaluationThresholdContract,
  createEvaluationThresholdContract,
} from "./evaluation.threshold.contract";
export type {
  OverallStatus,
  ThresholdAssessment,
  EvaluationThresholdContractDependencies,
} from "./evaluation.threshold.contract";

// W4-T2 — Learning Plane Truth Model Slice (CP1–CP2)
export {
  TruthModelContract,
  createTruthModelContract,
} from "./truth.model.contract";
export type {
  HealthTrajectory,
  PatternHistoryEntry,
  TruthModel,
  TruthModelContractDependencies,
} from "./truth.model.contract";
export {
  TruthModelUpdateContract,
  createTruthModelUpdateContract,
} from "./truth.model.update.contract";
export type { TruthModelUpdateContractDependencies } from "./truth.model.update.contract";

// W4-T1 — Learning Plane Foundation Slice (CP1–CP2)
export {
  FeedbackLedgerContract,
  createFeedbackLedgerContract,
} from "./feedback.ledger.contract";
export type {
  FeedbackClass,
  FeedbackPriority,
  LearningFeedbackInput,
  FeedbackRecord,
  FeedbackLedger,
  FeedbackLedgerContractDependencies,
} from "./feedback.ledger.contract";
export {
  PatternDetectionContract,
  createPatternDetectionContract,
} from "./pattern.detection.contract";
export type {
  HealthSignal,
  DominantPattern,
  PatternInsight,
  PatternDetectionContractDependencies,
} from "./pattern.detection.contract";

export const LEARNING_PLANE_FOUNDATION_COORDINATION = {
  executionClass: "realization-first learning-plane slice",
  tranche: "W4-T1",
  prerequisite: "ExecutionFeedbackSignal (W2-T4/CP2)",
  deterministicReproducibility:
    "EXTENSIONS/CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY",
  crossPlaneIndependence: true,
  rationale:
    "Learning plane defines its own LearningFeedbackInput interface — compatible with ExecutionFeedbackSignal but owned independently to avoid runtime coupling.",
} as const;
