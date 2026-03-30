import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type {
  IsolationEnforcementMode,
  IsolationScopeRequest,
  IsolationScopeResult,
} from "./trust.isolation.boundary.contract";
import { TrustIsolationBoundaryContract } from "./trust.isolation.boundary.contract";

// ─── Types ────────────────────────────────────────────────────────────────────

export type IsolationBatchDominantEnforcementMode = IsolationEnforcementMode | "EMPTY";

export interface IsolationScopeBatch {
  batchId: string;
  batchHash: string;
  createdAt: string;
  totalResults: number;
  hardBlockCount: number;
  escalateCount: number;
  passCount: number;
  dominantEnforcementMode: IsolationBatchDominantEnforcementMode;
  results: IsolationScopeResult[];
}

export interface IsolationScopeBatchContractDependencies {
  now?: () => string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ENFORCEMENT_PRECEDENCE: Record<IsolationEnforcementMode, number> = {
  HARD_BLOCK: 3,
  ESCALATE: 2,
  PASS: 1,
};

function resolveDominantEnforcementMode(
  hardBlockCount: number,
  escalateCount: number,
  passCount: number,
): IsolationBatchDominantEnforcementMode {
  const total = hardBlockCount + escalateCount + passCount;
  if (total === 0) return "EMPTY";

  const candidates: Array<{ mode: IsolationEnforcementMode; count: number }> = [
    { mode: "HARD_BLOCK", count: hardBlockCount },
    { mode: "ESCALATE", count: escalateCount },
    { mode: "PASS", count: passCount },
  ];

  return candidates.reduce((best, candidate) => {
    if (candidate.count > best.count) return candidate;
    if (
      candidate.count === best.count &&
      ENFORCEMENT_PRECEDENCE[candidate.mode] > ENFORCEMENT_PRECEDENCE[best.mode]
    )
      return candidate;
    return best;
  }).mode;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * IsolationScopeBatchContract (W19-T1 CP1 — Full Lane GC-019)
 * ------------------------------------------------------------
 * Batches IsolationScopeRequest[] through evaluateIsolationScope() into a
 * governed batch summary.
 *
 * Fields:
 *   hardBlockCount            = count of results where enforcementMode === "HARD_BLOCK"
 *   escalateCount             = count of results where enforcementMode === "ESCALATE"
 *   passCount                 = count of results where enforcementMode === "PASS"
 *   dominantEnforcementMode   = mode with highest count; tie-broken by precedence
 *                               (HARD_BLOCK > ESCALATE > PASS)
 *                               "EMPTY" when batch is empty
 *   batchHash                 = hash of all resultHashes + createdAt
 *   batchId                   = hash(batchHash) — distinct from batchHash
 *   results                   = full IsolationScopeResult[] in input order
 */
export class IsolationScopeBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: IsolationScopeBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    requests: IsolationScopeRequest[],
    boundary: TrustIsolationBoundaryContract,
  ): IsolationScopeBatch {
    const createdAt = this.now();
    const results: IsolationScopeResult[] = [];

    for (const request of requests) {
      results.push(boundary.evaluateIsolationScope(request));
    }

    const hardBlockCount = results.filter((r) => r.enforcementMode === "HARD_BLOCK").length;
    const escalateCount = results.filter((r) => r.enforcementMode === "ESCALATE").length;
    const passCount = results.filter((r) => r.enforcementMode === "PASS").length;

    const dominantEnforcementMode = resolveDominantEnforcementMode(
      hardBlockCount,
      escalateCount,
      passCount,
    );

    const batchHash = computeDeterministicHash(
      "w19-t1-cp1-isolation-scope-batch",
      ...results.map((r) => r.resultHash),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w19-t1-cp1-isolation-scope-batch-id",
      batchHash,
    );

    return {
      batchId,
      batchHash,
      createdAt,
      totalResults: results.length,
      hardBlockCount,
      escalateCount,
      passCount,
      dominantEnforcementMode,
      results,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createIsolationScopeBatchContract(
  dependencies?: IsolationScopeBatchContractDependencies,
): IsolationScopeBatchContract {
  return new IsolationScopeBatchContract(dependencies);
}
