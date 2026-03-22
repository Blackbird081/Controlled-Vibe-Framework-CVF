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
