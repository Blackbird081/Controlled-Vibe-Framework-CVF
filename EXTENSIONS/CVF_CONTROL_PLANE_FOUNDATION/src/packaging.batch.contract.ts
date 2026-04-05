import {
  PackagingContract,
  type PackagingRequest,
  type PackagingResultSurface,
  type PackagingContractDependencies,
} from "./packaging.contract";
import { createDeterministicBatchIdentity } from "./batch.contract.shared";

// --- Types ---

export type PackagingBatchStatus = "FULL" | "TRUNCATED";

export interface PackagingBatch {
  batchId: string;
  batchHash: string;
  createdAt: string;
  totalRequests: number;
  fullCount: number;
  truncatedCount: number;
  totalTokens: number;
  dominantStatus: PackagingBatchStatus | "NONE";
  dominantTokenBudget: number;
  results: PackagingResultSurface[];
}

export interface PackagingBatchContractDependencies {
  contractDependencies?: PackagingContractDependencies;
  now?: () => string;
}

// --- Contract ---

export class PackagingBatchContract {
  private readonly contract: PackagingContract;
  private readonly now: () => string;

  constructor(dependencies: PackagingBatchContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.contract = new PackagingContract({
      ...(dependencies.contractDependencies ?? {}),
      now: dependencies.contractDependencies?.now ?? this.now,
    });
  }

  batch(requests: PackagingRequest[]): PackagingBatch {
    const createdAt = this.now();
    const results: PackagingResultSurface[] = requests.map((req) =>
      this.contract.package(req),
    );

    const totalRequests = results.length;
    let fullCount = 0;
    let truncatedCount = 0;
    let totalTokens = 0;

    for (const result of results) {
      totalTokens += result.totalTokens;
      if (result.truncated) {
        truncatedCount++;
      } else {
        fullCount++;
      }
    }

    const dominantStatus: PackagingBatchStatus | "NONE" =
      totalRequests === 0
        ? "NONE"
        : truncatedCount > 0
          ? "TRUNCATED"
          : "FULL";

    const dominantTokenBudget =
      totalRequests === 0
        ? 0
        : Math.max(...results.map((r) => r.tokenBudget));

    const { batchHash, batchId } = createDeterministicBatchIdentity({
      batchSeed: "w40-t1-cp1-packaging-batch",
      batchIdSeed: "w40-t1-cp1-packaging-batch-id",
      hashParts: [
        `${createdAt}:total:${totalRequests}`,
        `full:${fullCount}`,
        `truncated:${truncatedCount}`,
        `tokens:${totalTokens}`,
      ],
    });

    return {
      batchId,
      batchHash,
      createdAt,
      totalRequests,
      fullCount,
      truncatedCount,
      totalTokens,
      dominantStatus,
      dominantTokenBudget,
      results,
    };
  }
}

export function createPackagingBatchContract(
  dependencies?: PackagingBatchContractDependencies,
): PackagingBatchContract {
  return new PackagingBatchContract(dependencies);
}
