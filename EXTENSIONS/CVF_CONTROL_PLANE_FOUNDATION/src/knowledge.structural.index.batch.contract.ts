import {
  StructuralIndexContract,
  type StructuralIndexRequest,
  type StructuralIndexResult,
  type StructuralIndexContractDependencies,
} from "./knowledge.structural.index.contract";
import { createDeterministicBatchIdentity } from "./batch.contract.shared";

// --- Types ---

export interface StructuralIndexBatch {
  batchId: string;
  batchHash: string;
  createdAt: string;
  totalIndexed: number;
  dominantNeighborCount: number;
  results: StructuralIndexResult[];
}

export interface StructuralIndexBatchContractDependencies {
  contractDependencies?: StructuralIndexContractDependencies;
  now?: () => string;
}

// --- Contract ---

export class StructuralIndexBatchContract {
  private readonly contract: StructuralIndexContract;
  private readonly now: () => string;

  constructor(dependencies: StructuralIndexBatchContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.contract = new StructuralIndexContract({
      ...(dependencies.contractDependencies ?? {}),
      now: dependencies.contractDependencies?.now ?? this.now,
    });
  }

  batch(requests: StructuralIndexRequest[]): StructuralIndexBatch {
    const createdAt = this.now();
    const results: StructuralIndexResult[] = requests.map((req) =>
      this.contract.index(req),
    );

    const totalIndexed = results.length;
    const dominantNeighborCount =
      totalIndexed === 0
        ? 0
        : Math.max(...results.map((r) => r.neighbors.length));

    const { batchHash, batchId } = createDeterministicBatchIdentity({
      batchSeed: "w72-t1-cp1-structural-index-batch",
      batchIdSeed: "w72-t1-cp1-structural-index-batch-id",
      hashParts: [
        `${createdAt}:total:${totalIndexed}`,
        `dominantNeighborCount:${dominantNeighborCount}`,
      ],
    });

    return {
      batchId,
      batchHash,
      createdAt,
      totalIndexed,
      dominantNeighborCount,
      results,
    };
  }
}

export function createStructuralIndexBatchContract(
  dependencies?: StructuralIndexBatchContractDependencies,
): StructuralIndexBatchContract {
  return new StructuralIndexBatchContract(dependencies);
}
