// Inline logic mirroring LearningSignalIntakeBridge.intake() — no LPF import.
// Source: EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/learning-signal-intake-bridge.ts
export const FINDING_TO_LEARNING_BRIDGE_VERSION = "cvf.findingToLearningSignalBridge.rt2.v1";

export type LearningSignalLane =
  | "GOVERNANCE_CONTROL_PLANE"
  | "RUNTIME_BEHAVIOR_LEARNING"
  | "PROVIDER_OUTPUT_LEARNING"
  | "COST_ECONOMICS_LEARNING"
  | "DOCUMENTATION_ONLY_LEARNING";

export type LearningSignalDefectClass =
  | "WORKER_EXECUTION_ERROR"
  | "ORCHESTRATOR_PACKET_GAP"
  | "RULE_GAP"
  | "MACHINE_GATE_GAP"
  | "PHASE_GATE_PLACEMENT_GAP"
  | "OPERATOR_SCOPE_CLARITY_GAP"
  | "RUNTIME_SIGNAL_GAP";

export type LearningSignalDisposition =
  | "RULE_EXISTS"
  | "RULE_ADDED"
  | "MACHINE_CHECK_ADDED"
  | "MACHINE_CHECK_CANDIDATE"
  | "PHASE_GATE_PLACEMENT_GAP"
  | "DESIGN_REVIEW_REQUIRED"
  | "RUNTIME_LEARNING_CANDIDATE"
  | "N/A_WITH_REASON";

export type LearningSignalSeverity = "critical" | "high" | "medium" | "low";
export type FeedbackClass = "ACCEPT" | "REJECT" | "ESCALATE" | "RETRY";


export interface FindingToLearningInput {
  sourceId: string;
  sourceArtifact: string;
  sourceSummary: string;
  lane: LearningSignalLane;
  defectClass: LearningSignalDefectClass;
  severity: LearningSignalSeverity;
  disposition: LearningSignalDisposition;
  nextControlAction: string;
  evidenceBasis: string;
}

export interface FindingToLearningRecord {
  recordId: string;
  recordedAt: string;
  bridgeVersion: typeof FINDING_TO_LEARNING_BRIDGE_VERSION;
  sourceId: string;
  sourceArtifact: string;
  sourceSummary: string;
  lane: LearningSignalLane;
  defectClass: LearningSignalDefectClass;
  severity: LearningSignalSeverity;
  disposition: LearningSignalDisposition;
  nextControlAction: string;
  evidenceBasis: string;
  feedbackClass: FeedbackClass;
  requiresGovernanceWorkOrder: boolean;
  autonomousMutationAuthorized: false;
}

function deriveFeedbackClass(input: FindingToLearningInput): FeedbackClass {
  if (input.disposition === "MACHINE_CHECK_ADDED" || input.disposition === "RULE_ADDED") return "ACCEPT";
  if (input.severity === "critical") return "REJECT";
  if (input.severity === "high" || input.lane === "RUNTIME_BEHAVIOR_LEARNING" || input.lane === "PROVIDER_OUTPUT_LEARNING") return "ESCALATE";
  if (input.disposition === "MACHINE_CHECK_CANDIDATE" || input.disposition === "RUNTIME_LEARNING_CANDIDATE" || input.disposition === "DESIGN_REVIEW_REQUIRED") return "RETRY";
  return "ACCEPT";
}

function needsWorkOrder(disposition: LearningSignalDisposition): boolean {
  return disposition === "MACHINE_CHECK_CANDIDATE" || disposition === "RUNTIME_LEARNING_CANDIDATE" || disposition === "PHASE_GATE_PLACEMENT_GAP" || disposition === "DESIGN_REVIEW_REQUIRED";
}

export function buildFindingToLearningRecord(
  input: FindingToLearningInput,
  nowFn: () => string = () => new Date().toISOString(),
): FindingToLearningRecord {
  const recordedAt = nowFn();
  const feedbackClass = deriveFeedbackClass(input);
  const recordId = `ftl-${input.sourceId}-${Date.now()}`;

  return {
    recordId,
    recordedAt,
    bridgeVersion: FINDING_TO_LEARNING_BRIDGE_VERSION,
    sourceId: input.sourceId,
    sourceArtifact: input.sourceArtifact,
    sourceSummary: input.sourceSummary,
    lane: input.lane,
    defectClass: input.defectClass,
    severity: input.severity,
    disposition: input.disposition,
    nextControlAction: input.nextControlAction,
    evidenceBasis: input.evidenceBasis,
    feedbackClass,
    requiresGovernanceWorkOrder: needsWorkOrder(input.disposition),
    autonomousMutationAuthorized: false,
  };
}
