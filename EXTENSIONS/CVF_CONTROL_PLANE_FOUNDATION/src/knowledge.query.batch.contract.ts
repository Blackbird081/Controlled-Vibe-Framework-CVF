import type { KnowledgeResult } from "./knowledge.query.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

export interface KnowledgeQueryBatch {
  batchId: string;
  createdAt: string;
  totalQueries: number;
  totalItemsFound: number;
  avgItemsPerQuery: number;
  queriesWithResults: number;
  emptyQueryCount: number;
  batchHash: string;
}

export interface KnowledgeQueryBatchContractDependencies {
  now?: () => string;
}

// --- Contract ---

export class KnowledgeQueryBatchContract {
  private readonly now: () => string;

  constructor(dependencies: KnowledgeQueryBatchContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(results: KnowledgeResult[]): KnowledgeQueryBatch {
    const createdAt = this.now();

    const totalItemsFound = results.reduce((sum, r) => sum + r.totalFound, 0);
    const queriesWithResults = results.filter((r) => r.totalFound > 0).length;
    const emptyQueryCount = results.length - queriesWithResults;
    const avgItemsPerQuery =
      results.length > 0
        ? Math.round((totalItemsFound / results.length) * 100) / 100
        : 0;

    const batchHash = computeDeterministicHash(
      "w1-t10-cp2-knowledge-batch",
      `${createdAt}:total:${results.length}`,
      `items:${totalItemsFound}:withResults:${queriesWithResults}:empty:${emptyQueryCount}`,
    );

    const batchId = computeDeterministicHash(
      "w1-t10-cp2-batch-id",
      batchHash,
      createdAt,
    );

    return {
      batchId,
      createdAt,
      totalQueries: results.length,
      totalItemsFound,
      avgItemsPerQuery,
      queriesWithResults,
      emptyQueryCount,
      batchHash,
    };
  }
}

export function createKnowledgeQueryBatchContract(
  dependencies?: KnowledgeQueryBatchContractDependencies,
): KnowledgeQueryBatchContract {
  return new KnowledgeQueryBatchContract(dependencies);
}
