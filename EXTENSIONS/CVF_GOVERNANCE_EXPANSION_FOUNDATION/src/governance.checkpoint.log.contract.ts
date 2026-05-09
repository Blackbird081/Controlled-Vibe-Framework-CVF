import type { GovernanceCheckpointDecision, CheckpointAction } from "./governance.checkpoint.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

export interface GovernanceCheckpointLog {
  logId: string;
  generatedAt: string;
  totalCheckpoints: number;
  proceedCount: number;
  haltCount: number;
  escalateCount: number;
  dominantCheckpointAction: CheckpointAction;
  logHash: string;
}

export interface GovernanceCheckpointLogContractDependencies {
  now?: () => string;
}

// --- Dominant Action ---
// Severity-first: ESCALATE > HALT > PROCEED

function deriveDominantAction(decisions: GovernanceCheckpointDecision[]): CheckpointAction {
  const actions = decisions.map((d) => d.checkpointAction);
  if (actions.includes("ESCALATE")) return "ESCALATE";
  if (actions.includes("HALT")) return "HALT";
  return "PROCEED";
}

// --- Contract ---

export class GovernanceCheckpointLogContract {
  private readonly now: () => string;

  constructor(dependencies: GovernanceCheckpointLogContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  log(decisions: GovernanceCheckpointDecision[]): GovernanceCheckpointLog {
    const generatedAt = this.now();
    const totalCheckpoints = decisions.length;
    const proceedCount = decisions.filter((d) => d.checkpointAction === "PROCEED").length;
    const haltCount = decisions.filter((d) => d.checkpointAction === "HALT").length;
    const escalateCount = decisions.filter((d) => d.checkpointAction === "ESCALATE").length;
    const dominantCheckpointAction = deriveDominantAction(decisions);

    const logHash = computeDeterministicHash(
      "w6-t4-cp2-checkpoint-log",
      `${generatedAt}:checkpoints:${totalCheckpoints}`,
      `proceed:${proceedCount}:halt:${haltCount}:escalate:${escalateCount}`,
    );

    const logId = computeDeterministicHash(
      "w6-t4-cp2-log-id",
      logHash,
      generatedAt,
    );

    return {
      logId,
      generatedAt,
      totalCheckpoints,
      proceedCount,
      haltCount,
      escalateCount,
      dominantCheckpointAction,
      logHash,
    };
  }
}

export function createGovernanceCheckpointLogContract(
  dependencies?: GovernanceCheckpointLogContractDependencies,
): GovernanceCheckpointLogContract {
  return new GovernanceCheckpointLogContract(dependencies);
}
