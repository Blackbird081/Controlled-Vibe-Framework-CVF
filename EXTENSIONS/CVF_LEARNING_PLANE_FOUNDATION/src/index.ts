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
