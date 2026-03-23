import type { GovernanceCheckpointDecision, CheckpointAction } from "./governance.checkpoint.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

export type ReintakeTrigger =
  | "ESCALATION_REQUIRED"
  | "HALT_REVIEW_PENDING"
  | "NO_REINTAKE";

export type ReintakeScope = "IMMEDIATE" | "DEFERRED" | "NONE";

export interface CheckpointReintakeRequest {
  reintakeId: string;
  generatedAt: string;
  sourceCheckpointId: string;
  reintakeTrigger: ReintakeTrigger;
  reintakeScope: ReintakeScope;
  reintakeRationale: string;
  checkpointActionRef: CheckpointAction;
  reintakeHash: string;
}

export interface GovernanceCheckpointReintakeContractDependencies {
  now?: () => string;
}

// --- Trigger / Scope Derivation ---
// ESCALATE → ESCALATION_REQUIRED / IMMEDIATE
// HALT    → HALT_REVIEW_PENDING  / DEFERRED
// PROCEED → NO_REINTAKE          / NONE

function deriveTrigger(action: CheckpointAction): ReintakeTrigger {
  switch (action) {
    case "ESCALATE":
      return "ESCALATION_REQUIRED";
    case "HALT":
      return "HALT_REVIEW_PENDING";
    case "PROCEED":
      return "NO_REINTAKE";
  }
}

function deriveScope(action: CheckpointAction): ReintakeScope {
  switch (action) {
    case "ESCALATE":
      return "IMMEDIATE";
    case "HALT":
      return "DEFERRED";
    case "PROCEED":
      return "NONE";
  }
}

function buildRationale(
  trigger: ReintakeTrigger,
  scope: ReintakeScope,
  decision: GovernanceCheckpointDecision,
): string {
  switch (trigger) {
    case "ESCALATION_REQUIRED":
      return `ReintakeTrigger=${trigger}. Governance escalation detected: checkpointAction=${decision.checkpointAction}, dominantVerdictRef=${decision.dominantVerdictRef}. Immediate control re-intake required.`;
    case "HALT_REVIEW_PENDING":
      return `ReintakeTrigger=${trigger}. Governance halt detected: checkpointAction=${decision.checkpointAction}, dominantVerdictRef=${decision.dominantVerdictRef}. Deferred control re-intake pending review.`;
    case "NO_REINTAKE":
      return `ReintakeTrigger=${trigger}. Governance checkpoint clear: checkpointAction=${decision.checkpointAction}. No control re-intake required.`;
  }
}

// --- Contract ---

export class GovernanceCheckpointReintakeContract {
  private readonly now: () => string;

  constructor(dependencies: GovernanceCheckpointReintakeContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  reintake(decision: GovernanceCheckpointDecision): CheckpointReintakeRequest {
    const generatedAt = this.now();
    const reintakeTrigger = deriveTrigger(decision.checkpointAction);
    const reintakeScope = deriveScope(decision.checkpointAction);
    const reintakeRationale = buildRationale(reintakeTrigger, reintakeScope, decision);

    const reintakeHash = computeDeterministicHash(
      "w6-t5-cp1-checkpoint-reintake",
      `${generatedAt}:${decision.checkpointId}`,
      `trigger:${reintakeTrigger}:scope:${reintakeScope}:action:${decision.checkpointAction}`,
    );

    const reintakeId = computeDeterministicHash(
      "w6-t5-cp1-reintake-id",
      reintakeHash,
      generatedAt,
    );

    return {
      reintakeId,
      generatedAt,
      sourceCheckpointId: decision.checkpointId,
      reintakeTrigger,
      reintakeScope,
      reintakeRationale,
      checkpointActionRef: decision.checkpointAction,
      reintakeHash,
    };
  }
}

export function createGovernanceCheckpointReintakeContract(
  dependencies?: GovernanceCheckpointReintakeContractDependencies,
): GovernanceCheckpointReintakeContract {
  return new GovernanceCheckpointReintakeContract(dependencies);
}
