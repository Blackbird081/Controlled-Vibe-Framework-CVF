import {
  KnowledgeRefactorContract,
  type KnowledgeRefactorRequest,
  type KnowledgeRefactorProposal,
  type KnowledgeRefactorContractDependencies,
} from "./knowledge.refactor.contract";
import { createDeterministicBatchIdentity } from "./batch.contract.shared";

// --- Types ---

export interface KnowledgeRefactorBatch {
  batchId: string;
  batchHash: string;
  createdAt: string;
  totalProposed: number;
  proposals: KnowledgeRefactorProposal[];
}

export interface KnowledgeRefactorBatchContractDependencies {
  contractDependencies?: KnowledgeRefactorContractDependencies;
  now?: () => string;
}

// --- Contract ---

export class KnowledgeRefactorBatchContract {
  private readonly contract: KnowledgeRefactorContract;
  private readonly now: () => string;

  constructor(dependencies: KnowledgeRefactorBatchContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.contract = new KnowledgeRefactorContract({
      ...(dependencies.contractDependencies ?? {}),
      now: dependencies.contractDependencies?.now ?? this.now,
    });
  }

  batch(requests: KnowledgeRefactorRequest[]): KnowledgeRefactorBatch {
    const createdAt = this.now();
    const proposals: KnowledgeRefactorProposal[] = requests.map((req) =>
      this.contract.recommend(req),
    );

    const totalProposed = proposals.length;
    const proposalHashesSig = proposals.map((p) => p.proposalHash).join(",");

    const { batchHash, batchId } = createDeterministicBatchIdentity({
      batchSeed: "w74-t1-refactor-batch",
      batchIdSeed: "w74-t1-refactor-batch-id",
      hashParts: [
        `${createdAt}:total:${totalProposed}`,
        `proposalHashes:[${proposalHashesSig}]`,
      ],
    });

    return { batchId, batchHash, createdAt, totalProposed, proposals };
  }
}

export function createKnowledgeRefactorBatchContract(
  dependencies?: KnowledgeRefactorBatchContractDependencies,
): KnowledgeRefactorBatchContract {
  return new KnowledgeRefactorBatchContract(dependencies);
}
