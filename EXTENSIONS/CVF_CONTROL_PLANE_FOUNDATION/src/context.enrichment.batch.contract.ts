import {
  ContextEnrichmentContract,
  type ContextEnrichmentContractDependencies,
} from "./context.enrichment.contract";
import type { ContextPackage } from "./context.build.contract";
import { createDeterministicBatchIdentity } from "./batch.contract.shared";

// --- Types ---

export interface ContextEnrichmentBatchRequest {
  pkg: ContextPackage;
  systemContent: string;
}

export type ContextEnrichmentBatchStatus = "ENRICHED" | "EMPTY";

export interface ContextEnrichmentBatch {
  batchId: string;
  batchHash: string;
  createdAt: string;
  totalRequests: number;
  enrichedCount: number;
  emptyCount: number;
  totalSegments: number;
  dominantStatus: ContextEnrichmentBatchStatus | "NONE";
  dominantTokenBudget: number;
  results: ContextPackage[];
}

export interface ContextEnrichmentBatchContractDependencies {
  contractDependencies?: ContextEnrichmentContractDependencies;
  now?: () => string;
}

// --- Contract ---

export class ContextEnrichmentBatchContract {
  private readonly contract: ContextEnrichmentContract;
  private readonly now: () => string;

  constructor(dependencies: ContextEnrichmentBatchContractDependencies = {}) {
    this.contract = new ContextEnrichmentContract(
      dependencies.contractDependencies ?? {},
    );
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(requests: ContextEnrichmentBatchRequest[]): ContextEnrichmentBatch {
    const createdAt = this.now();
    const results: ContextPackage[] = requests.map((req) =>
      this.contract.addSystemSegment(req.pkg, req.systemContent),
    );

    const totalRequests = results.length;
    let enrichedCount = 0;
    let emptyCount = 0;
    let totalSegments = 0;

    for (const result of results) {
      totalSegments += result.totalSegments;
      if (result.totalSegments > 0) {
        enrichedCount++;
      } else {
        emptyCount++;
      }
    }

    const dominantStatus: ContextEnrichmentBatchStatus | "NONE" =
      totalRequests === 0
        ? "NONE"
        : enrichedCount > 0
          ? "ENRICHED"
          : "EMPTY";

    const dominantTokenBudget =
      totalRequests === 0
        ? 0
        : Math.max(...results.map((r) => r.estimatedTokens));

    const { batchHash, batchId } = createDeterministicBatchIdentity({
      batchSeed: "w38-t1-cp1-context-enrichment-batch",
      batchIdSeed: "w38-t1-cp1-context-enrichment-batch-id",
      hashParts: [
        `${createdAt}:total:${totalRequests}`,
        `enriched:${enrichedCount}`,
        `empty:${emptyCount}`,
        `segments:${totalSegments}`,
      ],
      batchIdParts: [createdAt],
    });

    return {
      batchId,
      batchHash,
      createdAt,
      totalRequests,
      enrichedCount,
      emptyCount,
      totalSegments,
      dominantStatus,
      dominantTokenBudget,
      results,
    };
  }
}

export function createContextEnrichmentBatchContract(
  dependencies?: ContextEnrichmentBatchContractDependencies,
): ContextEnrichmentBatchContract {
  return new ContextEnrichmentBatchContract(dependencies);
}
