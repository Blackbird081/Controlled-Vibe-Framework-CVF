import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { ModelGatewayBoundaryReport } from "./model.gateway.boundary.contract";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ModelGatewayBoundaryBatch {
  batchId: string;
  batchHash: string;
  createdAt: string;
  totalResults: number;
  dominantSurfaceCount: number;
  totalFixedInputCount: number;
  totalInScopeCount: number;
  results: ModelGatewayBoundaryReport[];
}

export interface ModelGatewayBoundaryBatchContractDependencies {
  now?: () => string;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * ModelGatewayBoundaryBatchContract (W39-T1 CP1 — Full Lane)
 * ----------------------------------------------------------
 * Aggregates ModelGatewayBoundaryReport[] into a governed batch envelope.
 *
 * Fields:
 *   dominantSurfaceCount  = Math.max(...results.map(r => r.surfaces.length)); 0 for empty
 *   totalFixedInputCount  = sum of r.fixedInputCount across all results
 *   totalInScopeCount     = sum of r.inScopeCount across all results
 *   batchHash             = hash of all reportHashes + createdAt
 *   batchId               = hash(batchHash) — distinct from batchHash
 */
export class ModelGatewayBoundaryBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: ModelGatewayBoundaryBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(reports: ModelGatewayBoundaryReport[]): ModelGatewayBoundaryBatch {
    const createdAt = this.now();

    const dominantSurfaceCount =
      reports.length === 0
        ? 0
        : Math.max(...reports.map((r) => r.surfaces.length));

    const totalFixedInputCount = reports.reduce(
      (sum, r) => sum + r.fixedInputCount,
      0,
    );

    const totalInScopeCount = reports.reduce(
      (sum, r) => sum + r.inScopeCount,
      0,
    );

    const batchHash = computeDeterministicHash(
      "w39-t1-cp1-model-gateway-boundary-batch",
      ...reports.map((r) => r.reportHash),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w39-t1-cp1-model-gateway-boundary-batch-id",
      batchHash,
    );

    return {
      batchId,
      batchHash,
      createdAt,
      totalResults: reports.length,
      dominantSurfaceCount,
      totalFixedInputCount,
      totalInScopeCount,
      results: reports,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createModelGatewayBoundaryBatchContract(
  dependencies?: ModelGatewayBoundaryBatchContractDependencies,
): ModelGatewayBoundaryBatchContract {
  return new ModelGatewayBoundaryBatchContract(dependencies);
}
