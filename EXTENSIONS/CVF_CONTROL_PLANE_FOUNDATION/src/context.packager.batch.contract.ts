import {
  ContextPackagerContract,
  type ContextPackagerRequest,
  type TypedContextPackage,
  type ContextPackagerContractDependencies,
} from "./context.packager.contract";
import { createDeterministicBatchIdentity } from "./batch.contract.shared";

// --- Types ---

export type ContextPackagerBatchStatus = "PACKAGED" | "EMPTY";

export interface ContextPackagerBatch {
  batchId: string;
  batchHash: string;
  createdAt: string;
  totalRequests: number;
  packagedCount: number;
  emptyCount: number;
  totalSegments: number;
  dominantStatus: ContextPackagerBatchStatus | "NONE";
  dominantTokenBudget: number;
  results: TypedContextPackage[];
}

export interface ContextPackagerBatchContractDependencies {
  contractDependencies?: ContextPackagerContractDependencies;
  now?: () => string;
}

// --- Contract ---

export class ContextPackagerBatchContract {
  private readonly contract: ContextPackagerContract;
  private readonly now: () => string;

  constructor(dependencies: ContextPackagerBatchContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.contract = new ContextPackagerContract({
      ...(dependencies.contractDependencies ?? {}),
      now: dependencies.contractDependencies?.now ?? this.now,
    });
  }

  batch(requests: ContextPackagerRequest[]): ContextPackagerBatch {
    const createdAt = this.now();
    const results: TypedContextPackage[] = requests.map((req) =>
      this.contract.pack(req),
    );

    const totalRequests = results.length;
    let packagedCount = 0;
    let emptyCount = 0;
    let totalSegments = 0;

    for (const result of results) {
      totalSegments += result.totalSegments;
      if (result.totalSegments > 0) {
        packagedCount++;
      } else {
        emptyCount++;
      }
    }

    const dominantStatus: ContextPackagerBatchStatus | "NONE" =
      totalRequests === 0
        ? "NONE"
        : packagedCount > 0
          ? "PACKAGED"
          : "EMPTY";

    const dominantTokenBudget =
      totalRequests === 0
        ? 0
        : Math.max(...results.map((r) => r.estimatedTokens));

    const { batchHash, batchId } = createDeterministicBatchIdentity({
      batchSeed: "w37-t1-cp1-context-packager-batch",
      batchIdSeed: "w37-t1-cp1-context-packager-batch-id",
      hashParts: [
        `${createdAt}:total:${totalRequests}`,
        `packaged:${packagedCount}`,
        `empty:${emptyCount}`,
        `segments:${totalSegments}`,
      ],
    });

    return {
      batchId,
      batchHash,
      createdAt,
      totalRequests,
      packagedCount,
      emptyCount,
      totalSegments,
      dominantStatus,
      dominantTokenBudget,
      results,
    };
  }
}

export function createContextPackagerBatchContract(
  dependencies?: ContextPackagerBatchContractDependencies,
): ContextPackagerBatchContract {
  return new ContextPackagerBatchContract(dependencies);
}
