import type { AgentDefinitionInput, AgentDefinitionRecord } from "./agent.definition.boundary.contract";
import { AgentDefinitionBoundaryContract } from "./agent.definition.boundary.contract";
import {
  createDeterministicBatchIdentity,
  resolveDominantByCount,
} from "./batch.contract.shared";

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

function resolveDominantStatus(
  registeredCount: number,
  duplicateCount: number,
): RegistrationBatchDominantStatus {
  return resolveDominantByCount<RegistrationStatus, "EMPTY">(
    {
      REGISTERED: registeredCount,
      DUPLICATE: duplicateCount,
    },
    ["REGISTERED", "DUPLICATE"],
    "EMPTY",
  );
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

      const { batchHash: resultHash, batchId: resultId } =
        createDeterministicBatchIdentity({
          batchSeed: "w17-t1-cp1-reg-batch-result",
          batchIdSeed: "w17-t1-cp1-reg-batch-result-id",
          hashParts: [
            processedAt,
            `agent:${record.agentId}`,
            `name:${record.name}`,
            `status:${status}`,
            `defHash:${record.definitionHash}`,
          ],
        });

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

    const { batchHash, batchId } = createDeterministicBatchIdentity({
      batchSeed: "w17-t1-cp1-reg-batch",
      batchIdSeed: "w17-t1-cp1-reg-batch-id",
      hashParts: [...results.map((result) => result.resultHash), createdAt],
    });

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
