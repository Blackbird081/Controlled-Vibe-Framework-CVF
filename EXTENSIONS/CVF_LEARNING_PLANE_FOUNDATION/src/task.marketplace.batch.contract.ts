import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { TaskAllocationRecord, PriorityCeiling } from "./task.marketplace.contract";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TaskMarketplaceBatch {
  batchId: string;
  batchHash: string;
  createdAt: string;
  totalRecords: number;
  assignCount: number;
  deferCount: number;
  rejectCount: number;
  /**
   * Highest priority ceiling present across all ASSIGN records.
   * Order: critical > high > medium > none.
   * "none" when batch is empty or all records are DEFER/REJECT.
   */
  dominantPriorityCeiling: PriorityCeiling;
}

export interface TaskMarketplaceBatchContractDependencies {
  now?: () => string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PRIORITY_CEILING_RANK: Record<PriorityCeiling, number> = {
  critical: 3,
  high: 2,
  medium: 1,
  none: 0,
};

function highestPriorityCeiling(ceilings: PriorityCeiling[]): PriorityCeiling {
  if (ceilings.length === 0) return "none";
  return ceilings.reduce((best, current) =>
    PRIORITY_CEILING_RANK[current] > PRIORITY_CEILING_RANK[best] ? current : best,
  );
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * TaskMarketplaceBatchContract (W10-T1 CP3 — Fast Lane GC-021)
 * -------------------------------------------------------------
 * Aggregates TaskAllocationRecord[] into a governed batch summary.
 *
 * - assignCount             = records where allocationDecision === "ASSIGN"
 * - deferCount              = records where allocationDecision === "DEFER"
 * - rejectCount             = records where allocationDecision === "REJECT"
 * - dominantPriorityCeiling = highest assignedPriorityCeiling among ASSIGN records; "none" for empty/no-assign batch
 * - batchId ≠ batchHash (batchId is hash of batchHash only)
 */
export class TaskMarketplaceBatchContract {
  private readonly now: () => string;

  constructor(dependencies: TaskMarketplaceBatchContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(records: TaskAllocationRecord[]): TaskMarketplaceBatch {
    const createdAt = this.now();

    const assignCount = records.filter((r) => r.allocationDecision === "ASSIGN").length;
    const deferCount = records.filter((r) => r.allocationDecision === "DEFER").length;
    const rejectCount = records.filter((r) => r.allocationDecision === "REJECT").length;

    const assignedCeilings = records
      .filter((r) => r.allocationDecision === "ASSIGN")
      .map((r) => r.assignedPriorityCeiling);

    const dominantPriorityCeiling = highestPriorityCeiling(assignedCeilings);

    const batchHash = computeDeterministicHash(
      "w10-t1-cp3-task-marketplace-batch",
      ...records.map((r) => r.allocationHash),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w10-t1-cp3-task-marketplace-batch-id",
      batchHash,
    );

    return {
      batchId,
      batchHash,
      createdAt,
      totalRecords: records.length,
      assignCount,
      deferCount,
      rejectCount,
      dominantPriorityCeiling,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createTaskMarketplaceBatchContract(
  dependencies?: TaskMarketplaceBatchContractDependencies,
): TaskMarketplaceBatchContract {
  return new TaskMarketplaceBatchContract(dependencies);
}
