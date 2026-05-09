import type { GovernanceConsensusSummary, ConsensusVerdict } from "./governance.consensus.summary.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

export type CheckpointAction = "PROCEED" | "HALT" | "ESCALATE";

export interface GovernanceCheckpointDecision {
  checkpointId: string;
  generatedAt: string;
  sourceConsensusSummaryId: string;
  checkpointAction: CheckpointAction;
  checkpointRationale: string;
  dominantVerdictRef: ConsensusVerdict;
  totalDecisionsRef: number;
  checkpointHash: string;
}

export interface GovernanceCheckpointContractDependencies {
  now?: () => string;
  deriveAction?: (summary: GovernanceConsensusSummary) => CheckpointAction;
}

// --- Action Derivation ---
// ESCALATE: dominantVerdict === "ESCALATE" (critical threshold breached)
// HALT:     dominantVerdict === "PAUSE"    (alert-active; halt pending review)
// PROCEED:  dominantVerdict === "PROCEED"  (all signals clear)

function defaultDeriveAction(summary: GovernanceConsensusSummary): CheckpointAction {
  switch (summary.dominantVerdict) {
    case "ESCALATE":
      return "ESCALATE";
    case "PAUSE":
      return "HALT";
    case "PROCEED":
      return "PROCEED";
  }
}

function buildRationale(
  action: CheckpointAction,
  summary: GovernanceConsensusSummary,
): string {
  switch (action) {
    case "ESCALATE":
      return `CheckpointAction=${action}. Governance consensus escalated: dominantVerdict=${summary.dominantVerdict}, escalateCount=${summary.escalateCount}/${summary.totalDecisions}. Execution must escalate immediately.`;
    case "HALT":
      return `CheckpointAction=${action}. Governance consensus paused: dominantVerdict=${summary.dominantVerdict}, pauseCount=${summary.pauseCount}/${summary.totalDecisions}. Execution must halt pending review.`;
    case "PROCEED":
      return `CheckpointAction=${action}. Governance consensus clear: dominantVerdict=${summary.dominantVerdict}, proceedCount=${summary.proceedCount}/${summary.totalDecisions}. Execution may proceed.`;
  }
}

// --- Contract ---

export class GovernanceCheckpointContract {
  private readonly now: () => string;
  private readonly deriveAction: (summary: GovernanceConsensusSummary) => CheckpointAction;

  constructor(dependencies: GovernanceCheckpointContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.deriveAction = dependencies.deriveAction ?? defaultDeriveAction;
  }

  checkpoint(summary: GovernanceConsensusSummary): GovernanceCheckpointDecision {
    const generatedAt = this.now();
    const checkpointAction = this.deriveAction(summary);
    const checkpointRationale = buildRationale(checkpointAction, summary);

    const checkpointHash = computeDeterministicHash(
      "w6-t4-cp1-governance-checkpoint",
      `${generatedAt}:${summary.summaryId}`,
      `action:${checkpointAction}:verdict:${summary.dominantVerdict}:decisions:${summary.totalDecisions}`,
    );

    const checkpointId = computeDeterministicHash(
      "w6-t4-cp1-checkpoint-id",
      checkpointHash,
      generatedAt,
    );

    return {
      checkpointId,
      generatedAt,
      sourceConsensusSummaryId: summary.summaryId,
      checkpointAction,
      checkpointRationale,
      dominantVerdictRef: summary.dominantVerdict,
      totalDecisionsRef: summary.totalDecisions,
      checkpointHash,
    };
  }
}

export function createGovernanceCheckpointContract(
  dependencies?: GovernanceCheckpointContractDependencies,
): GovernanceCheckpointContract {
  return new GovernanceCheckpointContract(dependencies);
}
