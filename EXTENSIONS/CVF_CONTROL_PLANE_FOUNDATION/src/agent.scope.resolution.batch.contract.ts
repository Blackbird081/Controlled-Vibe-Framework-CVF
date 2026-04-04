import type {
  AgentScopeResolution,
  ScopeResolutionStatus,
} from "./agent.definition.boundary.contract";
import {
  createDeterministicBatchIdentity,
  resolveDominantByCount,
} from "./batch.contract.shared";

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

function resolveDominantStatus(
  resolvedCount: number,
  emptyScopeCount: number,
  undeclaredAgentCount: number,
): ScopeResolutionBatchDominantStatus {
  return resolveDominantByCount<ScopeResolutionStatus, "EMPTY">(
    {
      RESOLVED: resolvedCount,
      EMPTY_SCOPE: emptyScopeCount,
      UNDECLARED_AGENT: undeclaredAgentCount,
    },
    ["RESOLVED", "EMPTY_SCOPE", "UNDECLARED_AGENT"],
    "EMPTY",
  );
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

    const { batchHash, batchId } = createDeterministicBatchIdentity({
      batchSeed: "w14-t1-cp1-agent-scope-res-batch",
      batchIdSeed: "w14-t1-cp1-agent-scope-res-batch-id",
      hashParts: [...results.map((result) => result.resolutionHash), createdAt],
    });

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
