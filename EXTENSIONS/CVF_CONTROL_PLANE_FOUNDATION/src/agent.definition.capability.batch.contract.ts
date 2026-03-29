import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type {
  CapabilityValidationResult,
  CapabilityValidationStatus,
} from "./agent.definition.boundary.contract";

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

const STATUS_PRECEDENCE: Record<CapabilityValidationStatus, number> = {
  WITHIN_SCOPE: 3,
  OUT_OF_SCOPE: 2,
  UNDECLARED_AGENT: 1,
};

function resolveDominantStatus(
  withinScopeCount: number,
  outOfScopeCount: number,
  undeclaredAgentCount: number,
): CapabilityBatchDominantStatus {
  const total = withinScopeCount + outOfScopeCount + undeclaredAgentCount;
  if (total === 0) return "EMPTY";

  const candidates: Array<{ status: CapabilityValidationStatus; count: number }> = [
    { status: "WITHIN_SCOPE", count: withinScopeCount },
    { status: "OUT_OF_SCOPE", count: outOfScopeCount },
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

    const batchHash = computeDeterministicHash(
      "w13-t1-cp1-agent-def-cap-batch",
      ...results.map((r) => r.resultHash),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w13-t1-cp1-agent-def-cap-batch-id",
      batchHash,
    );

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
