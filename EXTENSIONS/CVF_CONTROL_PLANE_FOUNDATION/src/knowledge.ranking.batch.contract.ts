import {
  KnowledgeRankingContract,
  type KnowledgeRankingRequest,
  type RankedKnowledgeResult,
  type KnowledgeRankingContractDependencies,
} from "./knowledge.ranking.contract";
import { createDeterministicBatchIdentity } from "./batch.contract.shared";

// --- Types ---

export interface KnowledgeRankingBatch {
  batchId: string;
  batchHash: string;
  createdAt: string;
  totalRankings: number;
  dominantRankedCount: number;
  results: RankedKnowledgeResult[];
}

export interface KnowledgeRankingBatchContractDependencies {
  contractDependencies?: KnowledgeRankingContractDependencies;
  now?: () => string;
}

// --- Contract ---

export class KnowledgeRankingBatchContract {
  private readonly contract: KnowledgeRankingContract;
  private readonly now: () => string;

  constructor(
    dependencies: KnowledgeRankingBatchContractDependencies = {},
  ) {
    this.contract = new KnowledgeRankingContract(
      dependencies.contractDependencies ?? {},
    );
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(requests: KnowledgeRankingRequest[]): KnowledgeRankingBatch {
    const createdAt = this.now();
    const results: RankedKnowledgeResult[] = requests.map((req) =>
      this.contract.rank(req),
    );

    const totalRankings = results.length;
    const dominantRankedCount =
      totalRankings === 0
        ? 0
        : Math.max(...results.map((r) => r.totalRanked));

    const { batchHash, batchId } = createDeterministicBatchIdentity({
      batchSeed: "w33-t1-cp1-knowledge-ranking-batch",
      batchIdSeed: "w33-t1-cp1-knowledge-ranking-batch-id",
      hashParts: [
        `${createdAt}:total:${totalRankings}`,
        `dominantRankedCount:${dominantRankedCount}`,
      ],
      batchIdParts: [createdAt],
    });

    return {
      batchId,
      batchHash,
      createdAt,
      totalRankings,
      dominantRankedCount,
      results,
    };
  }
}

export function createKnowledgeRankingBatchContract(
  dependencies?: KnowledgeRankingBatchContractDependencies,
): KnowledgeRankingBatchContract {
  return new KnowledgeRankingBatchContract(dependencies);
}
