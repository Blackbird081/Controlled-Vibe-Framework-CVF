import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { AgentDefinitionAudit } from "./agent.definition.boundary.contract";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AgentDefinitionAuditBatch {
  batchId: string;
  batchHash: string;
  createdAt: string;
  totalAudits: number;
  totalAgentsAcrossAudits: number;
}

export interface AgentDefinitionAuditBatchContractDependencies {
  now?: () => string;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * AgentDefinitionAuditBatchContract (W15-T1 CP1 — Full Lane GC-019)
 * -----------------------------------------------------------------
 * Aggregates AgentDefinitionAudit[] into a governed batch summary.
 *
 * Fields:
 *   totalAudits              = audits.length
 *   totalAgentsAcrossAudits  = sum of audit.totalAgents across all audits
 *   batchHash                = hash of all auditHashes + createdAt
 *   batchId                  = hash(batchHash) — distinct from batchHash
 *
 * Note: AgentDefinitionAudit has no status enum; aggregate is by totalAgents
 * count. This differentiates W15-T1 from W13-T1 (capability status) and
 * W14-T1 (scope resolution status).
 */
export class AgentDefinitionAuditBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: AgentDefinitionAuditBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(audits: AgentDefinitionAudit[]): AgentDefinitionAuditBatch {
    const createdAt = this.now();

    const totalAudits = audits.length;
    const totalAgentsAcrossAudits = audits.reduce(
      (sum, a) => sum + a.totalAgents,
      0,
    );

    const batchHash = computeDeterministicHash(
      "w15-t1-cp1-agent-def-audit-batch",
      ...audits.map((a) => a.auditHash),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w15-t1-cp1-agent-def-audit-batch-id",
      batchHash,
    );

    return {
      batchId,
      batchHash,
      createdAt,
      totalAudits,
      totalAgentsAcrossAudits,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createAgentDefinitionAuditBatchContract(
  dependencies?: AgentDefinitionAuditBatchContractDependencies,
): AgentDefinitionAuditBatchContract {
  return new AgentDefinitionAuditBatchContract(dependencies);
}
