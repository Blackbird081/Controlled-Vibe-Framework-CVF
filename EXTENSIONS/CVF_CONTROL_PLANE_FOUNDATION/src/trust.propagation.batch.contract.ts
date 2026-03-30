import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type {
  TrustPropagationDecision,
  TrustPropagationMode,
  TrustPropagationRequest,
} from "./trust.isolation.boundary.contract";
import { TrustIsolationBoundaryContract } from "./trust.isolation.boundary.contract";

// ─── Types ────────────────────────────────────────────────────────────────────

export type TrustPropagationBatchDominantMode = TrustPropagationMode | "EMPTY";

export interface TrustPropagationBatch {
  batchId: string;
  batchHash: string;
  createdAt: string;
  totalDecisions: number;
  blockedCount: number;
  graphGatedCount: number;
  directCount: number;
  dominantMode: TrustPropagationBatchDominantMode;
  decisions: TrustPropagationDecision[];
}

export interface TrustPropagationBatchContractDependencies {
  now?: () => string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PROPAGATION_PRECEDENCE: Record<TrustPropagationMode, number> = {
  BLOCKED: 3,
  GRAPH_GATED: 2,
  DIRECT: 1,
};

function resolveDominantMode(
  blockedCount: number,
  graphGatedCount: number,
  directCount: number,
): TrustPropagationBatchDominantMode {
  const total = blockedCount + graphGatedCount + directCount;
  if (total === 0) return "EMPTY";

  const candidates: Array<{ mode: TrustPropagationMode; count: number }> = [
    { mode: "BLOCKED", count: blockedCount },
    { mode: "GRAPH_GATED", count: graphGatedCount },
    { mode: "DIRECT", count: directCount },
  ];

  return candidates.reduce((best, candidate) => {
    if (candidate.count > best.count) return candidate;
    if (
      candidate.count === best.count &&
      PROPAGATION_PRECEDENCE[candidate.mode] > PROPAGATION_PRECEDENCE[best.mode]
    )
      return candidate;
    return best;
  }).mode;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * TrustPropagationBatchContract (W20-T1 CP1 — Full Lane GC-019)
 * -------------------------------------------------------------
 * Batches TrustPropagationRequest[] through decideTrustPropagation() into a
 * governed batch summary.
 *
 * Fields:
 *   blockedCount     = count of decisions where mode === "BLOCKED"
 *   graphGatedCount  = count of decisions where mode === "GRAPH_GATED"
 *   directCount      = count of decisions where mode === "DIRECT"
 *   dominantMode     = mode with highest count; tie-broken by precedence
 *                      (BLOCKED > GRAPH_GATED > DIRECT)
 *                      "EMPTY" when batch is empty
 *   batchHash        = hash of all decisionHashes + createdAt
 *   batchId          = hash(batchHash) — distinct from batchHash
 *   decisions        = full TrustPropagationDecision[] in input order
 */
export class TrustPropagationBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: TrustPropagationBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    requests: TrustPropagationRequest[],
    boundary: TrustIsolationBoundaryContract,
  ): TrustPropagationBatch {
    const createdAt = this.now();
    const decisions: TrustPropagationDecision[] = [];

    for (const request of requests) {
      decisions.push(boundary.decideTrustPropagation(request));
    }

    const blockedCount = decisions.filter((d) => d.mode === "BLOCKED").length;
    const graphGatedCount = decisions.filter((d) => d.mode === "GRAPH_GATED").length;
    const directCount = decisions.filter((d) => d.mode === "DIRECT").length;

    const dominantMode = resolveDominantMode(
      blockedCount,
      graphGatedCount,
      directCount,
    );

    const batchHash = computeDeterministicHash(
      "w20-t1-cp1-trust-propagation-batch",
      ...decisions.map((d) => d.decisionHash),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w20-t1-cp1-trust-propagation-batch-id",
      batchHash,
    );

    return {
      batchId,
      batchHash,
      createdAt,
      totalDecisions: decisions.length,
      blockedCount,
      graphGatedCount,
      directCount,
      dominantMode,
      decisions,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createTrustPropagationBatchContract(
  dependencies?: TrustPropagationBatchContractDependencies,
): TrustPropagationBatchContract {
  return new TrustPropagationBatchContract(dependencies);
}
