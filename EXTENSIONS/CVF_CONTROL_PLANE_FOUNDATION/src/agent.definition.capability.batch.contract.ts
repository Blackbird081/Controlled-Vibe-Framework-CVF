import type {
  CapabilityValidationResult,
  CapabilityValidationStatus,
} from "./agent.definition.boundary.contract";
import {
  createDeterministicBatchIdentity,
  resolveDominantByCount,
} from "./batch.contract.shared";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CapabilityBatchDominantStatus = CapabilityValidationStatus | "EMPTY";

export interface AgentDefinitionCapabilityBatch {
  batchId: string;
  batchHash: string;
  createdAt: string;
  totalResults: number;
  withinScopeCount: number;
  outOfScopeCount: number;
  undeclaredAgentCount: number;
  dominantStatus: CapabilityBatchDominantStatus;
}

export interface AgentDefinitionCapabilityBatchContractDependencies {
  now?: () => string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolveDominantStatus(
  withinScopeCount: number,
  outOfScopeCount: number,
  undeclaredAgentCount: number,
): CapabilityBatchDominantStatus {
  return resolveDominantByCount<CapabilityValidationStatus, "EMPTY">(
    {
      WITHIN_SCOPE: withinScopeCount,
      OUT_OF_SCOPE: outOfScopeCount,
      UNDECLARED_AGENT: undeclaredAgentCount,
    },
    ["WITHIN_SCOPE", "OUT_OF_SCOPE", "UNDECLARED_AGENT"],
    "EMPTY",
  );
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * AgentDefinitionCapabilityBatchContract (W13-T1 CP1 — Full Lane GC-019)
 * -----------------------------------------------------------------------
 * Aggregates CapabilityValidationResult[] into a governed batch summary.
 *
 * Fields:
 *   withinScopeCount    = count of results where status === "WITHIN_SCOPE"
 *   outOfScopeCount     = count of results where status === "OUT_OF_SCOPE"
 *   undeclaredAgentCount = count of results where status === "UNDECLARED_AGENT"
 *   dominantStatus      = status with highest count; tie-broken by precedence
 *                         (WITHIN_SCOPE > OUT_OF_SCOPE > UNDECLARED_AGENT)
 *                         "EMPTY" when batch is empty
 *   batchHash           = hash of all resultHashes + createdAt
 *   batchId             = hash(batchHash) — distinct from batchHash
 */
export class AgentDefinitionCapabilityBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: AgentDefinitionCapabilityBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(results: CapabilityValidationResult[]): AgentDefinitionCapabilityBatch {
    const createdAt = this.now();

    const withinScopeCount = results.filter((r) => r.status === "WITHIN_SCOPE").length;
    const outOfScopeCount = results.filter((r) => r.status === "OUT_OF_SCOPE").length;
    const undeclaredAgentCount = results.filter((r) => r.status === "UNDECLARED_AGENT").length;

    const dominantStatus = resolveDominantStatus(
      withinScopeCount,
      outOfScopeCount,
      undeclaredAgentCount,
    );

    const { batchHash, batchId } = createDeterministicBatchIdentity({
      batchSeed: "w13-t1-cp1-agent-def-cap-batch",
      batchIdSeed: "w13-t1-cp1-agent-def-cap-batch-id",
      hashParts: [...results.map((result) => result.resultHash), createdAt],
    });

    return {
      batchId,
      batchHash,
      createdAt,
      totalResults: results.length,
      withinScopeCount,
      outOfScopeCount,
      undeclaredAgentCount,
      dominantStatus,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createAgentDefinitionCapabilityBatchContract(
  dependencies?: AgentDefinitionCapabilityBatchContractDependencies,
): AgentDefinitionCapabilityBatchContract {
  return new AgentDefinitionCapabilityBatchContract(dependencies);
}
