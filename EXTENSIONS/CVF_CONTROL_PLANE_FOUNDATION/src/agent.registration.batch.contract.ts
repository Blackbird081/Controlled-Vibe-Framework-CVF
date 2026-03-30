import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { AgentDefinitionInput, AgentDefinitionRecord } from "./agent.definition.boundary.contract";
import { AgentDefinitionBoundaryContract } from "./agent.definition.boundary.contract";

// ─── Types ────────────────────────────────────────────────────────────────────

export type RegistrationStatus = "REGISTERED" | "DUPLICATE";
export type RegistrationBatchDominantStatus = RegistrationStatus | "EMPTY";

export interface AgentRegistrationResult {
  resultId: string;
  processedAt: string;
  agentId: string;
  name: string;
  status: RegistrationStatus;
  reason: string;
  record: AgentDefinitionRecord;
  resultHash: string;
}

export interface AgentRegistrationBatch {
  batchId: string;
  batchHash: string;
  createdAt: string;
  totalResults: number;
  registeredCount: number;
  duplicateCount: number;
  dominantStatus: RegistrationBatchDominantStatus;
  results: AgentRegistrationResult[];
}

export interface AgentRegistrationBatchContractDependencies {
  now?: () => string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_PRECEDENCE: Record<RegistrationStatus, number> = {
  REGISTERED: 2,
  DUPLICATE: 1,
};

function resolveDominantStatus(
  registeredCount: number,
  duplicateCount: number,
): RegistrationBatchDominantStatus {
  const total = registeredCount + duplicateCount;
  if (total === 0) return "EMPTY";

  const candidates: Array<{ status: RegistrationStatus; count: number }> = [
    { status: "REGISTERED", count: registeredCount },
    { status: "DUPLICATE", count: duplicateCount },
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

function computeInputContentKey(input: AgentDefinitionInput): string {
  return [
    `name:${input.name}`,
    `role:${input.role}`,
    `caps:${[...input.declaredCapabilities].sort().join(",")}`,
    `domains:${[...input.declaredDomains].sort().join(",")}`,
  ].join("|");
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * AgentRegistrationBatchContract (W17-T1 CP1 — Full Lane GC-019)
 * ---------------------------------------------------------------
 * Batches AgentDefinitionInput[] through registerDefinition() into a
 * governed batch summary. Duplicate detection is content-based:
 * same name + role + capabilities + domains within a batch run → DUPLICATE.
 *
 * Fields:
 *   registeredCount  = count of results where status === "REGISTERED"
 *   duplicateCount   = count of results where status === "DUPLICATE"
 *   dominantStatus   = status with highest count; tie-broken by precedence
 *                      (REGISTERED > DUPLICATE)
 *                      "EMPTY" when batch is empty
 *   batchHash        = hash of all resultHashes + createdAt
 *   batchId          = hash(batchHash) — distinct from batchHash
 */
export class AgentRegistrationBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: AgentRegistrationBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    inputs: AgentDefinitionInput[],
    boundary: AgentDefinitionBoundaryContract,
  ): AgentRegistrationBatch {
    const createdAt = this.now();
    const seenContentKeys = new Set<string>();
    const results: AgentRegistrationResult[] = [];

    for (const input of inputs) {
      const processedAt = this.now();
      const contentKey = computeInputContentKey(input);
      const isDuplicate = seenContentKeys.has(contentKey);

      const record = boundary.registerDefinition(input);

      const status: RegistrationStatus = isDuplicate ? "DUPLICATE" : "REGISTERED";
      const reason = isDuplicate
        ? `Input content (name:'${input.name}', role:'${input.role}') is a duplicate of an earlier entry in this batch`
        : `Agent definition registered for '${input.name}' with role '${input.role}'`;

      if (!isDuplicate) {
        seenContentKeys.add(contentKey);
      }

      const resultHash = computeDeterministicHash(
        "w17-t1-cp1-reg-batch-result",
        processedAt,
        `agent:${record.agentId}`,
        `name:${record.name}`,
        `status:${status}`,
        `defHash:${record.definitionHash}`,
      );

      const resultId = computeDeterministicHash(
        "w17-t1-cp1-reg-batch-result-id",
        resultHash,
        processedAt,
      );

      results.push({
        resultId,
        processedAt,
        agentId: record.agentId,
        name: record.name,
        status,
        reason,
        record,
        resultHash,
      });
    }

    const registeredCount = results.filter((r) => r.status === "REGISTERED").length;
    const duplicateCount = results.filter((r) => r.status === "DUPLICATE").length;

    const dominantStatus = resolveDominantStatus(registeredCount, duplicateCount);

    const batchHash = computeDeterministicHash(
      "w17-t1-cp1-reg-batch",
      ...results.map((r) => r.resultHash),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w17-t1-cp1-reg-batch-id",
      batchHash,
    );

    return {
      batchId,
      batchHash,
      createdAt,
      totalResults: results.length,
      registeredCount,
      duplicateCount,
      dominantStatus,
      results,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createAgentRegistrationBatchContract(
  dependencies?: AgentRegistrationBatchContractDependencies,
): AgentRegistrationBatchContract {
  return new AgentRegistrationBatchContract(dependencies);
}
