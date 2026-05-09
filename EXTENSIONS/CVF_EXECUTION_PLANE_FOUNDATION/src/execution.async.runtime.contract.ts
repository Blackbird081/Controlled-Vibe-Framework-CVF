import type { CommandRuntimeResult } from "./command.runtime.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

export type AsyncExecutionStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";

export interface AsyncCommandRuntimeTicket {
  ticketId: string;
  issuedAt: string;
  sourceRuntimeId: string;
  sourceGateId: string;
  asyncStatus: AsyncExecutionStatus;
  recordCount: number;
  executedCount: number;
  failedCount: number;
  estimatedTimeoutMs: number;
  ticketHash: string;
}

export interface AsyncCommandRuntimeContractDependencies {
  estimateTimeout?: (executedCount: number) => number;
  now?: () => string;
}

// --- Timeout Estimation ---

function defaultEstimateTimeout(executedCount: number): number {
  return Math.max(1000, executedCount * 1000);
}

// --- Contract ---

export class AsyncCommandRuntimeContract {
  private readonly estimateTimeout: (executedCount: number) => number;
  private readonly now: () => string;

  constructor(dependencies: AsyncCommandRuntimeContractDependencies = {}) {
    this.estimateTimeout =
      dependencies.estimateTimeout ?? defaultEstimateTimeout;
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  issue(result: CommandRuntimeResult): AsyncCommandRuntimeTicket {
    const issuedAt = this.now();
    const asyncStatus: AsyncExecutionStatus = "PENDING";
    const estimatedTimeoutMs = this.estimateTimeout(result.executedCount);

    const ticketHash = computeDeterministicHash(
      "w2-t7-cp1-async-runtime",
      `${issuedAt}:${result.runtimeId}`,
      `status:${asyncStatus}:executed:${result.executedCount}:failed:${result.failedCount}`,
      `timeout:${estimatedTimeoutMs}`,
    );

    const ticketId = computeDeterministicHash(
      "w2-t7-cp1-ticket-id",
      ticketHash,
      issuedAt,
    );

    return {
      ticketId,
      issuedAt,
      sourceRuntimeId: result.runtimeId,
      sourceGateId: result.gateId,
      asyncStatus,
      recordCount: result.records.length,
      executedCount: result.executedCount,
      failedCount: result.failedCount,
      estimatedTimeoutMs,
      ticketHash,
    };
  }
}

export function createAsyncCommandRuntimeContract(
  dependencies?: AsyncCommandRuntimeContractDependencies,
): AsyncCommandRuntimeContract {
  return new AsyncCommandRuntimeContract(dependencies);
}
