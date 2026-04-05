import { AsyncCommandRuntimeContract } from "./execution.async.runtime.contract";
import type { AsyncCommandRuntimeTicket, AsyncCommandRuntimeContractDependencies } from "./execution.async.runtime.contract";
import type { CommandRuntimeResult } from "./command.runtime.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

export type AsyncCommandRuntimeBatchStatus =
  | "FULLY_QUEUED"
  | "PARTIALLY_QUEUED"
  | "FAILED"
  | "NONE";

export interface AsyncCommandRuntimeBatchInput {
  runtimeResult: CommandRuntimeResult;
}

export interface AsyncCommandRuntimeBatchResult {
  batchId: string;
  batchHash: string;
  processedAt: string;
  tickets: AsyncCommandRuntimeTicket[];
  totalTickets: number;
  totalExecuted: number;
  totalFailed: number;
  totalRecords: number;
  warnedCount: number;
  dominantStatus: AsyncCommandRuntimeBatchStatus;
}

export interface AsyncCommandRuntimeBatchContractDependencies {
  asyncRuntime?: AsyncCommandRuntimeContractDependencies;
  now?: () => string;
}

// --- Contract ---

export class AsyncCommandRuntimeBatchContract {
  private readonly asyncRuntime: AsyncCommandRuntimeContract;
  private readonly now: () => string;

  constructor(dependencies: AsyncCommandRuntimeBatchContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    const runtimeDeps = dependencies.asyncRuntime ?? {};
    this.asyncRuntime = new AsyncCommandRuntimeContract({
      ...runtimeDeps,
      now: runtimeDeps.now ?? this.now,
    });
  }

  batch(inputs: AsyncCommandRuntimeBatchInput[]): AsyncCommandRuntimeBatchResult {
    const processedAt = this.now();

    if (inputs.length === 0) {
      const batchHash = computeDeterministicHash(
        "w52-t1-cp1-async-command-runtime-batch",
        processedAt,
        "empty",
      );
      const batchId = computeDeterministicHash(
        "w52-t1-cp1-async-command-runtime-batch-id",
        batchHash,
      );
      return {
        batchId,
        batchHash,
        processedAt,
        tickets: [],
        totalTickets: 0,
        totalExecuted: 0,
        totalFailed: 0,
        totalRecords: 0,
        warnedCount: 0,
        dominantStatus: "NONE",
      };
    }

    const tickets: AsyncCommandRuntimeTicket[] = inputs.map((input) =>
      this.asyncRuntime.issue(input.runtimeResult),
    );

    const totalTickets = tickets.length;
    const totalExecuted = tickets.reduce((sum, t) => sum + t.executedCount, 0);
    const totalFailed = tickets.reduce((sum, t) => sum + t.failedCount, 0);
    const totalRecords = tickets.reduce((sum, t) => sum + t.recordCount, 0);
    const warnedCount = tickets.filter((t) => t.failedCount > 0).length;

    const dominantStatus = resolveDominantStatus(totalExecuted, totalFailed);

    const batchHash = computeDeterministicHash(
      "w52-t1-cp1-async-command-runtime-batch",
      processedAt,
      `executed:${totalExecuted}:failed:${totalFailed}:records:${totalRecords}`,
      tickets.map((t) => t.ticketId).join(":"),
    );

    const batchId = computeDeterministicHash(
      "w52-t1-cp1-async-command-runtime-batch-id",
      batchHash,
    );

    return {
      batchId,
      batchHash,
      processedAt,
      tickets,
      totalTickets,
      totalExecuted,
      totalFailed,
      totalRecords,
      warnedCount,
      dominantStatus,
    };
  }
}

function resolveDominantStatus(
  totalExecuted: number,
  totalFailed: number,
): AsyncCommandRuntimeBatchStatus {
  if (totalExecuted === 0) {
    return "FAILED";
  }
  if (totalFailed === 0) {
    return "FULLY_QUEUED";
  }
  return "PARTIALLY_QUEUED";
}

export function createAsyncCommandRuntimeBatchContract(
  dependencies?: AsyncCommandRuntimeBatchContractDependencies,
): AsyncCommandRuntimeBatchContract {
  return new AsyncCommandRuntimeBatchContract(dependencies);
}
