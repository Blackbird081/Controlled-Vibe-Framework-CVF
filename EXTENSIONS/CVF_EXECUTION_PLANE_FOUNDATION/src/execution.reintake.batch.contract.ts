import { ExecutionReintakeContract } from "./execution.reintake.contract";
import type { ExecutionReintakeRequest, ExecutionReintakeContractDependencies } from "./execution.reintake.contract";
import type { ReintakeAction } from "./execution.reintake.contract";
import type { FeedbackResolutionSummary } from "./feedback.resolution.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

export type ExecutionReintakeBatchDominant = ReintakeAction | "NONE";

export interface ExecutionReintakeBatchInput {
  summary: FeedbackResolutionSummary;
}

export interface ExecutionReintakeBatchResult {
  batchId: string;
  batchHash: string;
  processedAt: string;
  requests: ExecutionReintakeRequest[];
  totalRequests: number;
  replanCount: number;
  retryCount: number;
  acceptCount: number;
  warnedCount: number;
  dominantAction: ExecutionReintakeBatchDominant;
}

export interface ExecutionReintakeBatchContractDependencies {
  reintake?: ExecutionReintakeContractDependencies;
  now?: () => string;
}

// --- Contract ---

export class ExecutionReintakeBatchContract {
  private readonly reintakeContract: ExecutionReintakeContract;
  private readonly now: () => string;

  constructor(dependencies: ExecutionReintakeBatchContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    const reintakeDeps = dependencies.reintake ?? {};
    this.reintakeContract = new ExecutionReintakeContract({
      ...reintakeDeps,
      now: reintakeDeps.now ?? this.now,
    });
  }

  batch(inputs: ExecutionReintakeBatchInput[]): ExecutionReintakeBatchResult {
    const processedAt = this.now();

    if (inputs.length === 0) {
      const batchHash = computeDeterministicHash(
        "w54-t1-cp1-execution-reintake-batch",
        processedAt,
        "empty",
      );
      const batchId = computeDeterministicHash(
        "w54-t1-cp1-execution-reintake-batch-id",
        batchHash,
      );
      return {
        batchId,
        batchHash,
        processedAt,
        requests: [],
        totalRequests: 0,
        replanCount: 0,
        retryCount: 0,
        acceptCount: 0,
        warnedCount: 0,
        dominantAction: "NONE",
      };
    }

    const requests: ExecutionReintakeRequest[] = inputs.map((input) =>
      this.reintakeContract.reinject(input.summary),
    );

    const totalRequests = requests.length;
    const replanCount = requests.filter((r) => r.reintakeAction === "REPLAN").length;
    const retryCount = requests.filter((r) => r.reintakeAction === "RETRY").length;
    const acceptCount = requests.filter((r) => r.reintakeAction === "ACCEPT").length;
    const warnedCount = requests.filter((r) => r.reintakeAction !== "ACCEPT").length;

    const dominantAction = resolveDominantAction(replanCount, retryCount);

    const batchHash = computeDeterministicHash(
      "w54-t1-cp1-execution-reintake-batch",
      processedAt,
      `replan:${replanCount}:retry:${retryCount}:accept:${acceptCount}`,
      requests.map((r) => r.reintakeId).join(":"),
    );

    const batchId = computeDeterministicHash(
      "w54-t1-cp1-execution-reintake-batch-id",
      batchHash,
    );

    return {
      batchId,
      batchHash,
      processedAt,
      requests,
      totalRequests,
      replanCount,
      retryCount,
      acceptCount,
      warnedCount,
      dominantAction,
    };
  }
}

function resolveDominantAction(
  replanCount: number,
  retryCount: number,
): ExecutionReintakeBatchDominant {
  if (replanCount > 0) return "REPLAN";
  if (retryCount > 0) return "RETRY";
  return "ACCEPT";
}

export function createExecutionReintakeBatchContract(
  dependencies?: ExecutionReintakeBatchContractDependencies,
): ExecutionReintakeBatchContract {
  return new ExecutionReintakeBatchContract(dependencies);
}
