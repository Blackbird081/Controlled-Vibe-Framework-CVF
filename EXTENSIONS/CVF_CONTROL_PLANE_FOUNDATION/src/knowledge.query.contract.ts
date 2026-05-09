import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

export interface KnowledgeItem {
  itemId: string;
  title: string;
  content: string;
  relevanceScore: number; // 0.0 – 1.0
  source: string;
}

export interface KnowledgeQueryRequest {
  query: string;
  contextId: string;
  maxItems?: number; // default: no limit
  relevanceThreshold?: number; // 0.0–1.0; default 0.0 (include all)
  candidateItems?: KnowledgeItem[]; // injectable for deterministic testing
}

export interface KnowledgeResult {
  resultId: string;
  queriedAt: string;
  contextId: string;
  query: string;
  items: KnowledgeItem[];
  totalFound: number;
  relevanceThreshold: number;
  queryHash: string;
}

export interface KnowledgeQueryContractDependencies {
  now?: () => string;
}

// --- Contract ---

export class KnowledgeQueryContract {
  private readonly now: () => string;

  constructor(dependencies: KnowledgeQueryContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  query(request: KnowledgeQueryRequest): KnowledgeResult {
    const queriedAt = this.now();
    const relevanceThreshold = request.relevanceThreshold ?? 0.0;
    const candidates = request.candidateItems ?? [];

    // Filter by threshold, sort descending by relevance, apply maxItems cap
    let filtered = candidates.filter(
      (item) => item.relevanceScore >= relevanceThreshold,
    );
    filtered = filtered.sort((a, b) => b.relevanceScore - a.relevanceScore);
    if (request.maxItems !== undefined && request.maxItems > 0) {
      filtered = filtered.slice(0, request.maxItems);
    }

    const queryHash = computeDeterministicHash(
      "w1-t10-cp1-knowledge-query",
      `${queriedAt}:${request.contextId}`,
      `query:${request.query}`,
      `found:${filtered.length}:threshold:${relevanceThreshold}`,
    );

    const resultId = computeDeterministicHash(
      "w1-t10-cp1-result-id",
      queryHash,
      queriedAt,
    );

    return {
      resultId,
      queriedAt,
      contextId: request.contextId,
      query: request.query,
      items: filtered,
      totalFound: filtered.length,
      relevanceThreshold,
      queryHash,
    };
  }
}

export function createKnowledgeQueryContract(
  dependencies?: KnowledgeQueryContractDependencies,
): KnowledgeQueryContract {
  return new KnowledgeQueryContract(dependencies);
}
