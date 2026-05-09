import type { CheckpointReintakeRequest, ReintakeScope } from "./governance.checkpoint.reintake.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

export interface CheckpointReintakeSummary {
  summaryId: string;
  generatedAt: string;
  totalRequests: number;
  immediateCount: number;
  deferredCount: number;
  noReintakeCount: number;
  dominantScope: ReintakeScope;
  summaryHash: string;
}

export interface GovernanceCheckpointReintakeSummaryContractDependencies {
  now?: () => string;
}

// --- Dominant Scope ---
// Severity-first: IMMEDIATE > DEFERRED > NONE

function deriveDominantScope(requests: CheckpointReintakeRequest[]): ReintakeScope {
  const scopes = requests.map((r) => r.reintakeScope);
  if (scopes.includes("IMMEDIATE")) return "IMMEDIATE";
  if (scopes.includes("DEFERRED")) return "DEFERRED";
  return "NONE";
}

// --- Contract ---

export class GovernanceCheckpointReintakeSummaryContract {
  private readonly now: () => string;

  constructor(dependencies: GovernanceCheckpointReintakeSummaryContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  summarize(requests: CheckpointReintakeRequest[]): CheckpointReintakeSummary {
    const generatedAt = this.now();
    const totalRequests = requests.length;
    const immediateCount = requests.filter((r) => r.reintakeScope === "IMMEDIATE").length;
    const deferredCount = requests.filter((r) => r.reintakeScope === "DEFERRED").length;
    const noReintakeCount = requests.filter((r) => r.reintakeScope === "NONE").length;
    const dominantScope = deriveDominantScope(requests);

    const summaryHash = computeDeterministicHash(
      "w6-t5-cp2-reintake-summary",
      `${generatedAt}:requests:${totalRequests}`,
      `immediate:${immediateCount}:deferred:${deferredCount}:none:${noReintakeCount}`,
    );

    const summaryId = computeDeterministicHash(
      "w6-t5-cp2-summary-id",
      summaryHash,
      generatedAt,
    );

    return {
      summaryId,
      generatedAt,
      totalRequests,
      immediateCount,
      deferredCount,
      noReintakeCount,
      dominantScope,
      summaryHash,
    };
  }
}

export function createGovernanceCheckpointReintakeSummaryContract(
  dependencies?: GovernanceCheckpointReintakeSummaryContractDependencies,
): GovernanceCheckpointReintakeSummaryContract {
  return new GovernanceCheckpointReintakeSummaryContract(dependencies);
}
