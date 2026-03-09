import {
  RAGDocument,
  RAGQuery,
  RetrievalTier,
  TierConfig,
  DEFAULT_TIER_CONFIG,
} from "./types";
import { DocumentStore } from "./document.store";

export class Retriever {
  private tierConfig: TierConfig[];

  constructor(tierConfig?: TierConfig[]) {
    this.tierConfig = tierConfig ?? [...DEFAULT_TIER_CONFIG];
  }

  retrieve(store: DocumentStore, query: RAGQuery): RAGDocument[] {
    const tiers = query.tiers ?? this.tierConfig.map((t) => t.tier);
    const maxResults = query.maxResults ?? 10;
    const minScore = query.minScore ?? 0.01;

    const allScored: RAGDocument[] = [];

    for (const tierCfg of this.tierConfig) {
      if (!tiers.includes(tierCfg.tier)) continue;

      let candidates = store.findByTier(tierCfg.tier);

      if (query.domain) {
        const domainFiltered = candidates.filter((d) => d.domain === query.domain);
        if (domainFiltered.length > 0) {
          candidates = domainFiltered;
        }
      }

      if (query.tags && query.tags.length > 0) {
        const tagFiltered = candidates.filter((d) =>
          query.tags!.some((t) => d.tags.includes(t))
        );
        if (tagFiltered.length > 0) {
          candidates = tagFiltered;
        }
      }

      const scored = candidates.map((doc) => ({
        ...doc,
        score: this.scoreDocument(doc, query, tierCfg),
      }));

      scored.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
      const limited = scored.slice(0, tierCfg.maxDocuments);
      allScored.push(...limited);
    }

    return allScored
      .filter((d) => (d.score ?? 0) >= minScore)
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, maxResults);
  }

  getTotalCandidates(store: DocumentStore, query: RAGQuery): number {
    const tiers = query.tiers ?? this.tierConfig.map((t) => t.tier);
    let total = 0;
    for (const tier of tiers) {
      total += store.findByTier(tier).length;
    }
    return total;
  }

  private scoreDocument(
    doc: RAGDocument,
    query: RAGQuery,
    tierCfg: TierConfig
  ): number {
    let score = 0;

    const queryTerms = query.query.toLowerCase().split(/\s+/);
    const contentLower = doc.content.toLowerCase();
    const titleLower = doc.title.toLowerCase();

    let termMatches = 0;
    for (const term of queryTerms) {
      if (term.length < 3) continue;
      if (contentLower.includes(term)) termMatches++;
      if (titleLower.includes(term)) termMatches += 2;
    }

    const meaningfulTerms = queryTerms.filter((t) => t.length >= 3).length;
    if (meaningfulTerms > 0) {
      score = termMatches / (meaningfulTerms * 3);
    }

    if (query.domain && doc.domain === query.domain) {
      score += 0.2;
    }

    if (query.tags && query.tags.length > 0) {
      const tagMatches = query.tags.filter((t) => doc.tags.includes(t)).length;
      score += (tagMatches / query.tags.length) * 0.15;
    }

    score *= tierCfg.boostFactor;

    return Math.min(score, 1.0);
  }
}
