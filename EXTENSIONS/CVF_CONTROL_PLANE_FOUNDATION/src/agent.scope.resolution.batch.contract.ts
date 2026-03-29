import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type {
  AgentScopeResolution,
  ScopeResolutionStatus,
} from "./agent.definition.boundary.contract";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ScopeResolutionBatchDominantStatus = ScopeResolutionStatus | "EMPTY";

export interface AgentScopeResolutionBatch {
  batchId: string;
  batchHash: string;
  createdAt: string;
  totalResults: number;
  resolvedCount: number;
  emptyScopeCount: number;
  undeclaredAgentCount: number;
  dominantStatus: ScopeResolutionBatchDominantStatus;
}

export interface AgentScopeResolutionBatchContractDependencies {
  now?: () => string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_PRECEDENCE: Record<ScopeResolutionStatus, number> = {
  RESOLVED: 3,
  EMPTY_SCOPE: 2,
  UNDECLARED_AGENT: 1,
};

function resolveDominantStatus(
  resolvedCount: number,
  emptyScopeCount: number,
  undeclaredAgentCount: number,
): ScopeResolutionBatchDominantStatus {
  const total = resolvedCount + emptyScopeCount + undeclaredAgentCount;
  if (total === 0) return "EMPTY";

  const candidates: Array<{ status: ScopeResolutionStatus; count: number }> = [
    { status: "RESOLVED", count: resolvedCount },
    { status: "EMPTY_SCOPE", count: emptyScopeCount },
    { status: "UNDECLARED_AGENT", count: undeclaredAgentCount },
  ];

  return candidates.reduce((best, candidate) => {
    if (candidate.count > best.count) return candidate;
    if (
      candidate.count === best.count &&
      STATUS_PRECEDENCE[candidate.status] > STATUS_PRECEDENCE[best.status]
    )
      return candidate;
    return best;
  }).status;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * AgentScopeResolutionBatchContract (W14-T1 CP1 — Full Lane GC-019)
 * -----------------------------------------------------------------
 * Aggregates AgentScopeResolution[] into a governed batch summary.
 *
 * Fields:
 *   resolvedCount        = count of results where status === "RESOLVED"
 *   emptyScopeCount      = count of results where status === "EMPTY_SCOPE"
 *   undeclaredAgentCount = count of results where status === "UNDECLARED_AGENT"
 *   dominantStatus       = status with highest count; tie-broken by precedence
 *                          (RESOLVED > EMPTY_SCOPE > UNDECLARED_AGENT)
 *                          "EMPTY" when batch is empty
 *   batchHash            = hash of all resolutionHashes + createdAt
 *   batchId              = hash(batchHash) — distinct from batchHash
 */
export class AgentScopeResolutionBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: AgentScopeResolutionBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(results: AgentScopeResolution[]): AgentScopeResolutionBatch {
    const createdAt = this.now();

    const resolvedCount = results.filter((r) => r.status === "RESOLVED").length;
    const emptyScopeCount = results.filter((r) => r.status === "EMPTY_SCOPE").length;
    const undeclaredAgentCount = results.filter((r) => r.status === "UNDECLARED_AGENT").length;

    const dominantStatus = resolveDominantStatus(
      resolvedCount,
      emptyScopeCount,
      undeclaredAgentCount,
    );

    const batchHash = computeDeterministicHash(
      "w14-t1-cp1-agent-scope-res-batch",
      ...results.map((r) => r.resolutionHash),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w14-t1-cp1-agent-scope-res-batch-id",
      batchHash,
    );

    return {
      batchId,
      batchHash,
      createdAt,
      totalResults: results.length,
      resolvedCount,
      emptyScopeCount,
      undeclaredAgentCount,
      dominantStatus,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createAgentScopeResolutionBatchContract(
  dependencies?: AgentScopeResolutionBatchContractDependencies,
): AgentScopeResolutionBatchContract {
  return new AgentScopeResolutionBatchContract(dependencies);
}
