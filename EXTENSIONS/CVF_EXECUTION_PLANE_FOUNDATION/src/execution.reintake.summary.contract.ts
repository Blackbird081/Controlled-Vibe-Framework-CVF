import type { ExecutionReintakeRequest, ReintakeAction } from "./execution.reintake.contract";
import { createExecutionReintakeContract } from "./execution.reintake.contract";
import type { FeedbackResolutionSummary } from "./feedback.resolution.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

export interface ExecutionReintakeSummary {
  summaryId: string;
  createdAt: string;
  totalRequests: number;
  replanCount: number;
  retryCount: number;
  acceptCount: number;
  dominantReintakeAction: ReintakeAction;
  summary: string;
  summaryHash: string;
}

export interface ExecutionReintakeSummaryContractDependencies {
  now?: () => string;
}

// --- Dominant Action Derivation ---

function deriveDominantReintakeAction(
  replanCount: number,
  retryCount: number,
  acceptCount: number,
): ReintakeAction {
  if (replanCount > 0) return "REPLAN";
  if (retryCount > 0) return "RETRY";
  return "ACCEPT";
}

// --- Summary Building ---

function buildSummaryText(
  total: number,
  replanCount: number,
  retryCount: number,
  acceptCount: number,
  dominant: ReintakeAction,
): string {
  if (total === 0) {
    return "No re-intake requests to summarize. Re-intake summary is empty.";
  }
  const parts: string[] = [];
  if (replanCount > 0) parts.push(`${replanCount} requiring replanning`);
  if (retryCount > 0) parts.push(`${retryCount} queued for retry`);
  if (acceptCount > 0) parts.push(`${acceptCount} accepted`);
  return (
    `Execution re-intake summary: ${parts.join(", ")}. ` +
    `Dominant action: ${dominant}.`
  );
}

// --- Contract ---

export class ExecutionReintakeSummaryContract {
  private readonly now: () => string;

  constructor(
    dependencies: ExecutionReintakeSummaryContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  summarize(
    resolutionSummaries: FeedbackResolutionSummary[],
  ): ExecutionReintakeSummary {
    const createdAt = this.now();
    const reintakeContract = createExecutionReintakeContract({
      now: () => createdAt,
    });

    const requests: ExecutionReintakeRequest[] = resolutionSummaries.map(
      (s) => reintakeContract.reinject(s),
    );

    const replanCount = requests.filter(
      (r) => r.reintakeAction === "REPLAN",
    ).length;
    const retryCount = requests.filter(
      (r) => r.reintakeAction === "RETRY",
    ).length;
    const acceptCount = requests.filter(
      (r) => r.reintakeAction === "ACCEPT",
    ).length;
    const totalRequests = requests.length;

    const dominantReintakeAction = deriveDominantReintakeAction(
      replanCount,
      retryCount,
      acceptCount,
    );

    const summaryText = buildSummaryText(
      totalRequests,
      replanCount,
      retryCount,
      acceptCount,
      dominantReintakeAction,
    );

    const summaryHash = computeDeterministicHash(
      "w2-t6-cp2-reintake-summary",
      `${createdAt}:total:${totalRequests}`,
      `replan:${replanCount}:retry:${retryCount}:accept:${acceptCount}`,
      `dominant:${dominantReintakeAction}`,
    );

    const summaryId = computeDeterministicHash(
      "w2-t6-cp2-summary-id",
      summaryHash,
      createdAt,
    );

    return {
      summaryId,
      createdAt,
      totalRequests,
      replanCount,
      retryCount,
      acceptCount,
      dominantReintakeAction,
      summary: summaryText,
      summaryHash,
    };
  }
}

export function createExecutionReintakeSummaryContract(
  dependencies?: ExecutionReintakeSummaryContractDependencies,
): ExecutionReintakeSummaryContract {
  return new ExecutionReintakeSummaryContract(dependencies);
}
