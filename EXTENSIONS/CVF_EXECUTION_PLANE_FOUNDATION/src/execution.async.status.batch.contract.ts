import { AsyncExecutionStatusContract } from "./execution.async.status.contract";
import type { AsyncExecutionStatusSummary, AsyncExecutionStatusContractDependencies } from "./execution.async.status.contract";
import type { AsyncCommandRuntimeTicket, AsyncExecutionStatus } from "./execution.async.runtime.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

export type AsyncExecutionStatusBatchDominant = AsyncExecutionStatus | "NONE";

export interface AsyncExecutionStatusBatchInput {
  tickets: AsyncCommandRuntimeTicket[];
}

export interface AsyncExecutionStatusBatchResult {
  batchId: string;
  batchHash: string;
  processedAt: string;
  summaries: AsyncExecutionStatusSummary[];
  totalSummaries: number;
  totalTickets: number;
  totalPending: number;
  totalRunning: number;
  totalCompleted: number;
  totalFailed: number;
  warnedCount: number;
  dominantStatus: AsyncExecutionStatusBatchDominant;
}

export interface AsyncExecutionStatusBatchContractDependencies {
  statusContract?: AsyncExecutionStatusContractDependencies;
  now?: () => string;
}

// --- Contract ---

export class AsyncExecutionStatusBatchContract {
  private readonly statusContract: AsyncExecutionStatusContract;
  private readonly now: () => string;

  constructor(dependencies: AsyncExecutionStatusBatchContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    const statusDeps = dependencies.statusContract ?? {};
    this.statusContract = new AsyncExecutionStatusContract({
      ...statusDeps,
      now: statusDeps.now ?? this.now,
    });
  }

  batch(inputs: AsyncExecutionStatusBatchInput[]): AsyncExecutionStatusBatchResult {
    const processedAt = this.now();

    if (inputs.length === 0) {
      const batchHash = computeDeterministicHash(
        "w53-t1-cp1-async-execution-status-batch",
        processedAt,
        "empty",
      );
      const batchId = computeDeterministicHash(
        "w53-t1-cp1-async-execution-status-batch-id",
        batchHash,
      );
      return {
        batchId,
        batchHash,
        processedAt,
        summaries: [],
        totalSummaries: 0,
        totalTickets: 0,
        totalPending: 0,
        totalRunning: 0,
        totalCompleted: 0,
        totalFailed: 0,
        warnedCount: 0,
        dominantStatus: "NONE",
      };
    }

    const summaries: AsyncExecutionStatusSummary[] = inputs.map((input) =>
      this.statusContract.assess(input.tickets),
    );

    const totalSummaries = summaries.length;
    const totalTickets = summaries.reduce((sum, s) => sum + s.totalTickets, 0);
    const totalPending = summaries.reduce((sum, s) => sum + s.pendingCount, 0);
    const totalRunning = summaries.reduce((sum, s) => sum + s.runningCount, 0);
    const totalCompleted = summaries.reduce((sum, s) => sum + s.completedCount, 0);
    const totalFailed = summaries.reduce((sum, s) => sum + s.failedCount, 0);
    const warnedCount = summaries.filter((s) => s.failedCount > 0).length;

    const dominantStatus = resolveDominantStatus(
      totalFailed,
      totalRunning,
      totalPending,
    );

    const batchHash = computeDeterministicHash(
      "w53-t1-cp1-async-execution-status-batch",
      processedAt,
      `pending:${totalPending}:running:${totalRunning}:completed:${totalCompleted}:failed:${totalFailed}`,
      summaries.map((s) => s.summaryId).join(":"),
    );

    const batchId = computeDeterministicHash(
      "w53-t1-cp1-async-execution-status-batch-id",
      batchHash,
    );

    return {
      batchId,
      batchHash,
      processedAt,
      summaries,
      totalSummaries,
      totalTickets,
      totalPending,
      totalRunning,
      totalCompleted,
      totalFailed,
      warnedCount,
      dominantStatus,
    };
  }
}

function resolveDominantStatus(
  totalFailed: number,
  totalRunning: number,
  totalPending: number,
): AsyncExecutionStatusBatchDominant {
  if (totalFailed > 0) return "FAILED";
  if (totalRunning > 0) return "RUNNING";
  if (totalPending > 0) return "PENDING";
  return "COMPLETED";
}

export function createAsyncExecutionStatusBatchContract(
  dependencies?: AsyncExecutionStatusBatchContractDependencies,
): AsyncExecutionStatusBatchContract {
  return new AsyncExecutionStatusBatchContract(dependencies);
}
