import type { ReputationSignal, ReputationClass } from "./reputation.signal.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Priority level for a requested task.
 * Ordered: critical > high > medium > low.
 */
export type TaskPriority = "critical" | "high" | "medium" | "low";

/**
 * Maximum priority ceiling an agent may be assigned, derived from reputation class.
 * none → agent is not eligible for task allocation.
 */
export type PriorityCeiling = "critical" | "high" | "medium" | "none";

/**
 * Decision outcome of a task allocation attempt.
 *
 *   ASSIGN — agent is eligible and has sufficient capacity; task is allocated.
 *   DEFER  — agent is conditionally eligible but capacity is insufficient; retry later.
 *   REJECT — agent is not eligible for task allocation.
 */
export type AllocationDecision = "ASSIGN" | "DEFER" | "REJECT";

export interface TaskAllocationRequest {
  requestId: string;
  agentId: string;
  /** Reputation signal produced by CP1 ReputationSignalContract (FIXED INPUT). */
  reputationSignal: ReputationSignal;
  /** Priority of the task being requested. */
  taskPriority: TaskPriority;
  /** Declared agent capacity 0–1 (0 = no capacity, 1 = full capacity). */
  declaredCapacity: number;
}

export interface TaskAllocationRecord {
  recordId: string;
  allocatedAt: string;
  requestId: string;
  agentId: string;
  allocationDecision: AllocationDecision;
  /** Maximum task priority this agent may be assigned, derived from reputation class. */
  assignedPriorityCeiling: PriorityCeiling;
  rationale: string;
  allocationHash: string;
}

export interface TaskMarketplaceContractDependencies {
  now?: () => string;
}

// ─── Allocation Rules ─────────────────────────────────────────────────────────

/** Maps reputation class to the priority ceiling the agent may be assigned. */
function derivePriorityCeiling(reputationClass: ReputationClass): PriorityCeiling {
  switch (reputationClass) {
    case "TRUSTED":     return "critical";
    case "RELIABLE":    return "high";
    case "PROVISIONAL": return "medium";
    case "UNTRUSTED":   return "none";
    default:            return "none";
  }
}

/**
 * Applies allocation rules based on reputation class and declared capacity.
 *
 * | Reputation class | Capacity | Decision |
 * | TRUSTED          | any      | ASSIGN   |
 * | RELIABLE         | ≥ 0.3    | ASSIGN   |
 * | RELIABLE         | < 0.3    | DEFER    |
 * | PROVISIONAL      | ≥ 0.5    | DEFER    |
 * | PROVISIONAL      | < 0.5    | REJECT   |
 * | UNTRUSTED        | any      | REJECT   |
 */
function deriveAllocationDecision(
  reputationClass: ReputationClass,
  declaredCapacity: number,
): AllocationDecision {
  switch (reputationClass) {
    case "TRUSTED":
      return "ASSIGN";
    case "RELIABLE":
      return declaredCapacity >= 0.3 ? "ASSIGN" : "DEFER";
    case "PROVISIONAL":
      return declaredCapacity >= 0.5 ? "DEFER" : "REJECT";
    case "UNTRUSTED":
      return "REJECT";
    default:
      return "REJECT";
  }
}

// ─── Rationale ────────────────────────────────────────────────────────────────

function buildRationale(
  request: TaskAllocationRequest,
  decision: AllocationDecision,
  priorityCeiling: PriorityCeiling,
): string {
  return (
    `AllocationDecision=${decision} for agent=${request.agentId} ` +
    `(reputationClass=${request.reputationSignal.reputationClass}, ` +
    `compositeScore=${request.reputationSignal.compositeReputationScore}/100, ` +
    `capacity=${request.declaredCapacity}). ` +
    `requestedPriority=${request.taskPriority}, ` +
    `assignedPriorityCeiling=${priorityCeiling}.`
  );
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * TaskMarketplaceContract (W10-T1 CP2)
 * -------------------------------------
 * Routes task allocation decisions based on ReputationSignal output (FIXED INPUT
 * from CP1) and declared agent capacity, producing a deterministic TaskAllocationRecord.
 *
 * Allocation rules:
 *   TRUSTED     + any capacity    → ASSIGN  (ceiling: critical)
 *   RELIABLE    + capacity ≥ 0.3  → ASSIGN  (ceiling: high)
 *   RELIABLE    + capacity < 0.3  → DEFER   (ceiling: high)
 *   PROVISIONAL + capacity ≥ 0.5  → DEFER   (ceiling: medium)
 *   PROVISIONAL + capacity < 0.5  → REJECT  (ceiling: medium)
 *   UNTRUSTED   + any capacity    → REJECT  (ceiling: none)
 *
 * ReputationSignal (CP1 output) is the sole reputation authority; no re-scoring.
 */
export class TaskMarketplaceContract {
  private readonly now: () => string;

  constructor(dependencies: TaskMarketplaceContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  allocate(request: TaskAllocationRequest): TaskAllocationRecord {
    const allocatedAt = this.now();

    const allocationDecision = deriveAllocationDecision(
      request.reputationSignal.reputationClass,
      request.declaredCapacity,
    );

    const assignedPriorityCeiling = derivePriorityCeiling(
      request.reputationSignal.reputationClass,
    );

    const rationale = buildRationale(request, allocationDecision, assignedPriorityCeiling);

    const allocationHash = computeDeterministicHash(
      "w10-t1-cp2-task-marketplace",
      `${allocatedAt}:requestId=${request.requestId}:agentId=${request.agentId}`,
      `decision=${allocationDecision}:ceiling=${assignedPriorityCeiling}`,
      `reputationClass=${request.reputationSignal.reputationClass}:score=${request.reputationSignal.compositeReputationScore}`,
      `capacity=${request.declaredCapacity}:priority=${request.taskPriority}`,
    );

    const recordId = computeDeterministicHash(
      "w10-t1-cp2-record-id",
      allocationHash,
      allocatedAt,
    );

    return {
      recordId,
      allocatedAt,
      requestId: request.requestId,
      agentId: request.agentId,
      allocationDecision,
      assignedPriorityCeiling,
      rationale,
      allocationHash,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createTaskMarketplaceContract(
  dependencies?: TaskMarketplaceContractDependencies,
): TaskMarketplaceContract {
  return new TaskMarketplaceContract(dependencies);
}
