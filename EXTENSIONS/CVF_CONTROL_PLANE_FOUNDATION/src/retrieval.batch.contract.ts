import {
  RetrievalContract,
  type RetrievalRequest,
  type RetrievalResultSurface,
  type RetrievalContractDependencies,
} from "./retrieval.contract";
import { createDeterministicBatchIdentity } from "./batch.contract.shared";

// --- Types ---

export type RetrievalBatchStatus = "HIT" | "EMPTY";

export interface RetrievalBatch {
  batchId: string;
  batchHash: string;
  createdAt: string;
  totalRequests: number;
  hitCount: number;
  emptyCount: number;
  totalChunkCount: number;
  dominantStatus: RetrievalBatchStatus | "NONE";
  results: RetrievalResultSurface[];
}

export interface RetrievalBatchContractDependencies {
  contractDependencies?: RetrievalContractDependencies;
  now?: () => string;
}

// --- Contract ---

export class RetrievalBatchContract {
  private readonly contract: RetrievalContract;
  private readonly now: () => string;

  constructor(dependencies: RetrievalBatchContractDependencies = {}) {
    this.contract = new RetrievalContract(
      dependencies.contractDependencies ?? {},
    );
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(requests: RetrievalRequest[]): RetrievalBatch {
    const createdAt = this.now();
    const results: RetrievalResultSurface[] = requests.map((req) =>
      this.contract.retrieve(req),
    );

    const totalRequests = results.length;
    let hitCount = 0;
    let emptyCount = 0;
    let totalChunkCount = 0;

    for (const result of results) {
      totalChunkCount += result.chunkCount;
      if (result.chunkCount > 0) {
        hitCount++;
      } else {
        emptyCount++;
      }
    }

    const dominantStatus: RetrievalBatchStatus | "NONE" =
      totalRequests === 0
        ? "NONE"
        : hitCount > 0
          ? "HIT"
          : "EMPTY";

    const { batchHash, batchId } = createDeterministicBatchIdentity({
      batchSeed: "w36-t1-cp1-retrieval-batch",
      batchIdSeed: "w36-t1-cp1-retrieval-batch-id",
      hashParts: [
        `${createdAt}:total:${totalRequests}`,
        `hit:${hitCount}`,
        `empty:${emptyCount}`,
        `chunks:${totalChunkCount}`,
      ],
      batchIdParts: [createdAt],
    });

    return {
      batchId,
      batchHash,
      createdAt,
      totalRequests,
      hitCount,
      emptyCount,
      totalChunkCount,
      dominantStatus,
      results,
    };
  }
}

export function createRetrievalBatchContract(
  dependencies?: RetrievalBatchContractDependencies,
): RetrievalBatchContract {
  return new RetrievalBatchContract(dependencies);
}
