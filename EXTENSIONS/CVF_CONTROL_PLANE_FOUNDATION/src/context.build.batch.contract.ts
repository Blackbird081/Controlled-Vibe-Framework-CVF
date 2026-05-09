import type { ContextPackage } from "./context.build.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

export interface ContextBuildBatch {
  batchId: string;
  createdAt: string;
  totalPackages: number;
  totalSegments: number;
  avgSegmentsPerPackage: number; // rounded to 2dp; 0 for empty
  batchHash: string;
}

export interface ContextBuildBatchContractDependencies {
  now?: () => string;
}

// --- Contract ---

export class ContextBuildBatchContract {
  private readonly now: () => string;

  constructor(dependencies: ContextBuildBatchContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(packages: ContextPackage[]): ContextBuildBatch {
    const createdAt = this.now();
    const totalPackages = packages.length;
    const totalSegments = packages.reduce((sum, p) => sum + p.totalSegments, 0);
    const avgSegmentsPerPackage =
      totalPackages === 0
        ? 0
        : Math.round((totalSegments / totalPackages) * 100) / 100;

    const batchHash = computeDeterministicHash(
      "w1-t11-cp2-context-build-batch",
      `${createdAt}:packages:${totalPackages}`,
      `segments:${totalSegments}`,
    );

    const batchId = computeDeterministicHash(
      "w1-t11-cp2-batch-id",
      batchHash,
      createdAt,
    );

    return {
      batchId,
      createdAt,
      totalPackages,
      totalSegments,
      avgSegmentsPerPackage,
      batchHash,
    };
  }
}

export function createContextBuildBatchContract(
  dependencies?: ContextBuildBatchContractDependencies,
): ContextBuildBatchContract {
  return new ContextBuildBatchContract(dependencies);
}
