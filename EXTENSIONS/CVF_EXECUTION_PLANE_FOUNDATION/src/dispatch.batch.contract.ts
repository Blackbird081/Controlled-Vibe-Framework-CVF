import type { TaskAssignment } from "../../CVF_CONTROL_PLANE_FOUNDATION/src/orchestration.contract";
import { DispatchContract, createDispatchContract } from "./dispatch.contract";
import type { DispatchResult, DispatchContractDependencies } from "./dispatch.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

export interface DispatchBatchInput {
  orchestrationId: string;
  assignments: TaskAssignment[];
}

export type DispatchBatchStatus =
  | "FULLY_AUTHORIZED"
  | "PARTIALLY_AUTHORIZED"
  | "FULLY_BLOCKED"
  | "NONE";

export interface DispatchBatchResult {
  batchId: string;
  batchHash: string;
  createdAt: string;
  totalDispatches: number;
  totalAssignments: number;
  totalAuthorized: number;
  totalBlocked: number;
  totalEscalated: number;
  warnedCount: number;
  dominantStatus: DispatchBatchStatus;
  results: DispatchResult[];
}

export interface DispatchBatchContractDependencies {
  dispatch?: DispatchContract;
  now?: () => string;
}

// --- Status Helper ---

function resolveDispatchBatchStatus(
  totalAuthorized: number,
  totalBlocked: number,
  totalEscalated: number,
  totalDispatches: number,
): DispatchBatchStatus {
  if (totalDispatches === 0) return "NONE";
  if (totalAuthorized === 0) return "FULLY_BLOCKED";
  if (totalBlocked > 0 || totalEscalated > 0) return "PARTIALLY_AUTHORIZED";
  return "FULLY_AUTHORIZED";
}

// --- Contract ---

export class DispatchBatchContract {
  private readonly dispatch: DispatchContract;
  private readonly now: () => string;

  constructor(dependencies: DispatchBatchContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.dispatch = dependencies.dispatch ?? createDispatchContract({ now: this.now });
  }

  batch(inputs: DispatchBatchInput[]): DispatchBatchResult {
    const createdAt = this.now();

    const results: DispatchResult[] = inputs.map((input) =>
      this.dispatch.dispatch(input.orchestrationId, input.assignments),
    );

    const totalDispatches = results.length;
    const totalAssignments = inputs.reduce(
      (sum, input) => sum + input.assignments.length,
      0,
    );
    const totalAuthorized = results.reduce(
      (sum, r) => sum + r.authorizedCount,
      0,
    );
    const totalBlocked = results.reduce((sum, r) => sum + r.blockedCount, 0);
    const totalEscalated = results.reduce(
      (sum, r) => sum + r.escalatedCount,
      0,
    );
    const warnedCount = results.filter((r) => r.warnings.length > 0).length;

    const dominantStatus = resolveDispatchBatchStatus(
      totalAuthorized,
      totalBlocked,
      totalEscalated,
      totalDispatches,
    );

    const batchHash = computeDeterministicHash(
      "w49-t1-cp1-dispatch-batch",
      `${createdAt}:total:${totalDispatches}`,
      `assignments:${totalAssignments}`,
      `authorized:${totalAuthorized}:blocked:${totalBlocked}:escalated:${totalEscalated}`,
      `dominant:${dominantStatus}`,
    );

    const batchId = computeDeterministicHash(
      "w49-t1-cp1-dispatch-batch-id",
      batchHash,
    );

    return {
      batchId,
      batchHash,
      createdAt,
      totalDispatches,
      totalAssignments,
      totalAuthorized,
      totalBlocked,
      totalEscalated,
      warnedCount,
      dominantStatus,
      results,
    };
  }
}

export function createDispatchBatchContract(
  dependencies?: DispatchBatchContractDependencies,
): DispatchBatchContract {
  return new DispatchBatchContract(dependencies);
}
