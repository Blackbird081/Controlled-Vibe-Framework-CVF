import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { RagContextEngineConvergenceReport } from "./rag.context.engine.convergence.contract";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RagContextEngineConvergenceBatch {
  batchId: string;
  createdAt: string;
  totalResults: number;
  results: RagContextEngineConvergenceReport[];
  dominantSurfaceCount: number;
  totalFixedInputCount: number;
  totalInScopeCount: number;
  batchHash: string;
}

export interface RagContextEngineConvergenceBatchContractDependencies {
  now?: () => string;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * RagContextEngineConvergenceBatchContract (W9-T1 CP2 — Fast Lane GC-021)
 * -----------------------------------------------------------------------
 * Aggregates RagContextEngineConvergenceReport[] into a governed batch.
 *
 * Fields:
 *   dominantSurfaceCount  = Math.max(...results.map(r => r.surfaces.length)); 0 for empty
 *   totalFixedInputCount  = sum of r.fixedInputCount across all results
 *   totalInScopeCount     = sum of r.inScopeCount across all results
 *   batchHash             = hash of all reportHashes + createdAt
 *   batchId               = hash(batchHash) — distinct from batchHash
 */
export class RagContextEngineConvergenceBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: RagContextEngineConvergenceBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    results: RagContextEngineConvergenceReport[],
  ): RagContextEngineConvergenceBatch {
    const createdAt = this.now();

    const dominantSurfaceCount =
      results.length === 0
        ? 0
        : Math.max(...results.map((r) => r.surfaces.length));

    const totalFixedInputCount = results.reduce(
      (sum, r) => sum + r.fixedInputCount,
      0,
    );

    const totalInScopeCount = results.reduce(
      (sum, r) => sum + r.inScopeCount,
      0,
    );

    const batchHash = computeDeterministicHash(
      "w9-t1-cp2-rag-context-engine-convergence-batch",
      ...results.map((r) => r.reportHash),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w9-t1-cp2-rag-context-engine-convergence-batch-id",
      batchHash,
    );

    return {
      batchId,
      createdAt,
      totalResults: results.length,
      results,
      dominantSurfaceCount,
      totalFixedInputCount,
      totalInScopeCount,
      batchHash,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createRagContextEngineConvergenceBatchContract(
  dependencies?: RagContextEngineConvergenceBatchContractDependencies,
): RagContextEngineConvergenceBatchContract {
  return new RagContextEngineConvergenceBatchContract(dependencies);
}
