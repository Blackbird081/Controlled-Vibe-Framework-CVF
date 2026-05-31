import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type {
  FeedbackClass,
  FeedbackPriority,
  LearningFeedbackInput,
} from "./feedback.ledger.contract";

export const LEARNING_SIGNAL_INTAKE_BRIDGE_VERSION =
  "cvf.learningSignalIntakeBridge.2026-05-29.v1";

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

export type LearningSignalSeverity = "critical" | "high" | "medium" | "low";

export type LearningSignalDisposition =
  | "RULE_EXISTS"
  | "RULE_ADDED"
  | "MACHINE_CHECK_ADDED"
  | "MACHINE_CHECK_CANDIDATE"
  | "PHASE_GATE_PLACEMENT_GAP"
  | "DESIGN_REVIEW_REQUIRED"
  | "RUNTIME_LEARNING_CANDIDATE"
  | "N/A_WITH_REASON";

export interface LearningSignalIntakeInput {
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

export interface LearningSignalIntakeRecord {
  recordId: string;
  recordedAt: string;
  bridgeVersion: typeof LEARNING_SIGNAL_INTAKE_BRIDGE_VERSION;
  sourceId: string;
  sourceArtifact: string;
  sourceSummary: string;
  lane: LearningSignalLane;
  defectClass: LearningSignalDefectClass;
  severity: LearningSignalSeverity;
  disposition: LearningSignalDisposition;
  nextControlAction: string;
  evidenceBasis: string;
  feedbackInput: LearningFeedbackInput;
  autonomousMutationAuthorized: false;
  requiresGovernanceWorkOrder: boolean;
  recordHash: string;
}

export interface LearningSignalIntakeBridgeDependencies {
  now?: () => string;
}

function feedbackClassForSignal(
  input: LearningSignalIntakeInput,
): FeedbackClass {
  if (input.disposition === "MACHINE_CHECK_ADDED" || input.disposition === "RULE_ADDED") {
    return "ACCEPT";
  }
  if (input.severity === "critical") {
    return "REJECT";
  }
  if (
    input.severity === "high" ||
    input.lane === "RUNTIME_BEHAVIOR_LEARNING" ||
    input.lane === "PROVIDER_OUTPUT_LEARNING"
  ) {
    return "ESCALATE";
  }
  if (
    input.disposition === "MACHINE_CHECK_CANDIDATE" ||
    input.disposition === "RUNTIME_LEARNING_CANDIDATE" ||
    input.disposition === "DESIGN_REVIEW_REQUIRED"
  ) {
    return "RETRY";
  }
  return "ACCEPT";
}

function priorityForSignal(input: LearningSignalIntakeInput): FeedbackPriority {
  if (input.severity === "critical") return "critical";
  if (input.severity === "high") return "high";
  if (input.severity === "medium") return "medium";
  return "low";
}

function requiresGovernanceWorkOrder(input: LearningSignalIntakeInput): boolean {
  return (
    input.disposition === "MACHINE_CHECK_CANDIDATE" ||
    input.disposition === "RUNTIME_LEARNING_CANDIDATE" ||
    input.disposition === "PHASE_GATE_PLACEMENT_GAP" ||
    input.disposition === "DESIGN_REVIEW_REQUIRED"
  );
}

export class LearningSignalIntakeBridge {
  private readonly now: () => string;

  constructor(dependencies: LearningSignalIntakeBridgeDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  intake(input: LearningSignalIntakeInput): LearningSignalIntakeRecord {
    const recordedAt = this.now();
    const feedbackClass = feedbackClassForSignal(input);
    const priority = priorityForSignal(input);
    const governanceWorkOrderRequired = requiresGovernanceWorkOrder(input);

    const feedbackInput: LearningFeedbackInput = {
      feedbackId: computeDeterministicHash(
        "learning-signal-feedback-id",
        input.sourceId,
        input.lane,
        input.disposition,
      ),
      sourcePipelineId: input.sourceArtifact,
      feedbackClass,
      priority,
      confidenceBoost: feedbackClass === "ACCEPT" ? 0 : 1,
    };

    const recordHash = computeDeterministicHash(
      "learning-signal-intake-record",
      LEARNING_SIGNAL_INTAKE_BRIDGE_VERSION,
      `${recordedAt}:${input.sourceId}:${input.sourceArtifact}`,
      `${input.lane}:${input.defectClass}:${input.disposition}`,
      `${feedbackClass}:${priority}:${governanceWorkOrderRequired}`,
    );

    const recordId = computeDeterministicHash(
      "learning-signal-intake-id",
      recordHash,
      input.sourceId,
    );

    return {
      recordId,
      recordedAt,
      bridgeVersion: LEARNING_SIGNAL_INTAKE_BRIDGE_VERSION,
      sourceId: input.sourceId,
      sourceArtifact: input.sourceArtifact,
      sourceSummary: input.sourceSummary,
      lane: input.lane,
      defectClass: input.defectClass,
      severity: input.severity,
      disposition: input.disposition,
      nextControlAction: input.nextControlAction,
      evidenceBasis: input.evidenceBasis,
      feedbackInput,
      autonomousMutationAuthorized: false,
      requiresGovernanceWorkOrder: governanceWorkOrderRequired,
      recordHash,
    };
  }
}

export function createLearningSignalIntakeBridge(
  dependencies?: LearningSignalIntakeBridgeDependencies,
): LearningSignalIntakeBridge {
  return new LearningSignalIntakeBridge(dependencies);
}
