import type {
  AsyncCommandRuntimeTicket,
  AsyncExecutionStatus,
} from "./execution.async.runtime.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

export interface AsyncExecutionStatusSummary {
  summaryId: string;
  createdAt: string;
  totalTickets: number;
  pendingCount: number;
  runningCount: number;
  completedCount: number;
  failedCount: number;
  dominantStatus: AsyncExecutionStatus;
  summary: string;
  summaryHash: string;
}

export interface AsyncExecutionStatusContractDependencies {
  now?: () => string;
}

// --- Dominant Status Derivation ---

function deriveDominantStatus(
  failedCount: number,
  runningCount: number,
  pendingCount: number,
): AsyncExecutionStatus {
  if (failedCount > 0) return "FAILED";
  if (runningCount > 0) return "RUNNING";
  if (pendingCount > 0) return "PENDING";
  return "COMPLETED";
}

// --- Summary Building ---

function buildStatusSummary(
  total: number,
  pendingCount: number,
  runningCount: number,
  completedCount: number,
  failedCount: number,
  dominant: AsyncExecutionStatus,
): string {
  if (total === 0) {
    return "No async execution tickets to assess. Status summary is empty.";
  }
  const parts: string[] = [];
  if (pendingCount > 0) parts.push(`${pendingCount} pending`);
  if (runningCount > 0) parts.push(`${runningCount} running`);
  if (completedCount > 0) parts.push(`${completedCount} completed`);
  if (failedCount > 0) parts.push(`${failedCount} failed`);
  return (
    `Async execution status: ${parts.join(", ")}. ` +
    `Dominant status: ${dominant}.`
  );
}

// --- Contract ---

export class AsyncExecutionStatusContract {
  private readonly now: () => string;

  constructor(
    dependencies: AsyncExecutionStatusContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  assess(tickets: AsyncCommandRuntimeTicket[]): AsyncExecutionStatusSummary {
    const createdAt = this.now();

    const pendingCount = tickets.filter(
      (t) => t.asyncStatus === "PENDING",
    ).length;
    const runningCount = tickets.filter(
      (t) => t.asyncStatus === "RUNNING",
    ).length;
    const completedCount = tickets.filter(
      (t) => t.asyncStatus === "COMPLETED",
    ).length;
    const failedCount = tickets.filter(
      (t) => t.asyncStatus === "FAILED",
    ).length;
    const totalTickets = tickets.length;

    const dominantStatus = deriveDominantStatus(
      failedCount,
      runningCount,
      pendingCount,
    );

    const summaryText = buildStatusSummary(
      totalTickets,
      pendingCount,
      runningCount,
      completedCount,
      failedCount,
      dominantStatus,
    );

    const summaryHash = computeDeterministicHash(
      "w2-t7-cp2-async-status",
      `${createdAt}:total:${totalTickets}`,
      `pending:${pendingCount}:running:${runningCount}`,
      `completed:${completedCount}:failed:${failedCount}`,
      `dominant:${dominantStatus}`,
    );

    const summaryId = computeDeterministicHash(
      "w2-t7-cp2-summary-id",
      summaryHash,
      createdAt,
    );

    return {
      summaryId,
      createdAt,
      totalTickets,
      pendingCount,
      runningCount,
      completedCount,
      failedCount,
      dominantStatus,
      summary: summaryText,
      summaryHash,
    };
  }
}

export function createAsyncExecutionStatusContract(
  dependencies?: AsyncExecutionStatusContractDependencies,
): AsyncExecutionStatusContract {
  return new AsyncExecutionStatusContract(dependencies);
}
