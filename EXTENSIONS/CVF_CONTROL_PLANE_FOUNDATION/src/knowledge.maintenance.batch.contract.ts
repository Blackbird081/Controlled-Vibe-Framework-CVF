import {
  KnowledgeMaintenanceContract,
  type KnowledgeMaintenanceRequest,
  type KnowledgeMaintenanceResult,
  type KnowledgeMaintenanceContractDependencies,
} from "./knowledge.maintenance.contract";
import { createDeterministicBatchIdentity } from "./batch.contract.shared";

// --- Types ---

export interface KnowledgeMaintenanceBatch {
  batchId: string;
  batchHash: string;
  createdAt: string;
  totalEvaluated: number;
  results: KnowledgeMaintenanceResult[];
}

export interface KnowledgeMaintenanceBatchContractDependencies {
  contractDependencies?: KnowledgeMaintenanceContractDependencies;
  now?: () => string;
}

// --- Contract ---

export class KnowledgeMaintenanceBatchContract {
  private readonly contract: KnowledgeMaintenanceContract;
  private readonly now: () => string;

  constructor(dependencies: KnowledgeMaintenanceBatchContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.contract = new KnowledgeMaintenanceContract({
      ...(dependencies.contractDependencies ?? {}),
      now: dependencies.contractDependencies?.now ?? this.now,
    });
  }

  batch(requests: KnowledgeMaintenanceRequest[]): KnowledgeMaintenanceBatch {
    const createdAt = this.now();
    const results: KnowledgeMaintenanceResult[] = requests.map((req) =>
      this.contract.evaluate(req),
    );

    const totalEvaluated = results.length;
    const resultHashesSig = results.map((r) => r.resultHash).join(",");

    const { batchHash, batchId } = createDeterministicBatchIdentity({
      batchSeed: "w73-t2-maintenance-batch",
      batchIdSeed: "w73-t2-maintenance-batch-id",
      hashParts: [
        `${createdAt}:total:${totalEvaluated}`,
        `resultHashes:[${resultHashesSig}]`,
      ],
    });

    return { batchId, batchHash, createdAt, totalEvaluated, results };
  }
}

export function createKnowledgeMaintenanceBatchContract(
  dependencies?: KnowledgeMaintenanceBatchContractDependencies,
): KnowledgeMaintenanceBatchContract {
  return new KnowledgeMaintenanceBatchContract(dependencies);
}
