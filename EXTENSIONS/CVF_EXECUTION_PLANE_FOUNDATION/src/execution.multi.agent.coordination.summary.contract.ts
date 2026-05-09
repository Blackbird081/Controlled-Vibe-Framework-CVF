import type {
  CoordinationStatus,
  MultiAgentCoordinationResult,
} from "./execution.multi.agent.coordination.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

export interface MultiAgentCoordinationSummary {
  summaryId: string;
  createdAt: string;
  totalCoordinations: number;
  coordinatedCount: number;
  partialCount: number;
  failedCount: number;
  dominantStatus: CoordinationStatus;
  summaryHash: string;
}

export interface MultiAgentCoordinationSummaryContractDependencies {
  now?: () => string;
}

// --- Helpers ---

function resolveDominantStatus(
  failedCount: number,
  partialCount: number,
): CoordinationStatus {
  if (failedCount > 0) return "FAILED";
  if (partialCount > 0) return "PARTIAL";
  return "COORDINATED";
}

// --- Contract ---

export class MultiAgentCoordinationSummaryContract {
  private readonly now: () => string;

  constructor(
    dependencies: MultiAgentCoordinationSummaryContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  summarize(
    results: MultiAgentCoordinationResult[],
  ): MultiAgentCoordinationSummary {
    const createdAt = this.now();
    const totalCoordinations = results.length;
    const coordinatedCount = results.filter(
      (r) => r.coordinationStatus === "COORDINATED",
    ).length;
    const partialCount = results.filter(
      (r) => r.coordinationStatus === "PARTIAL",
    ).length;
    const failedCount = results.filter(
      (r) => r.coordinationStatus === "FAILED",
    ).length;

    const dominantStatus = resolveDominantStatus(failedCount, partialCount);

    const summaryHash = computeDeterministicHash(
      "w2-t9-cp2-coordination-summary",
      `${createdAt}:total:${totalCoordinations}`,
      `coordinated:${coordinatedCount}:partial:${partialCount}:failed:${failedCount}`,
      `dominant:${dominantStatus}`,
    );

    const summaryId = computeDeterministicHash(
      "w2-t9-cp2-summary-id",
      summaryHash,
      createdAt,
    );

    return {
      summaryId,
      createdAt,
      totalCoordinations,
      coordinatedCount,
      partialCount,
      failedCount,
      dominantStatus,
      summaryHash,
    };
  }
}

export function createMultiAgentCoordinationSummaryContract(
  dependencies?: MultiAgentCoordinationSummaryContractDependencies,
): MultiAgentCoordinationSummaryContract {
  return new MultiAgentCoordinationSummaryContract(dependencies);
}
