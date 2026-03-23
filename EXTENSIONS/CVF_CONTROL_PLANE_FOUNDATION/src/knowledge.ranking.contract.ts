import type { KnowledgeItem } from "./knowledge.query.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

export interface RankableKnowledgeItem extends KnowledgeItem {
  tier?: string;       // e.g. "T0", "T1", "T2", "T3"
  recencyScore?: number; // 0.0 – 1.0; higher = more recent
}

export interface ScoringWeights {
  relevanceWeight: number;  // weight for item.relevanceScore
  tierWeight: number;       // weight for tier-derived score
  recencyWeight: number;    // weight for recencyScore
}

export interface ScoreBreakdown {
  relevanceContribution: number;
  tierContribution: number;
  recencyContribution: number;
}

export interface RankedKnowledgeItem extends RankableKnowledgeItem {
  compositeScore: number;
  scoreBreakdown: ScoreBreakdown;
  rank: number; // 1-based; 1 = highest score
}

export interface KnowledgeRankingRequest {
  query: string;
  contextId: string;
  candidateItems: RankableKnowledgeItem[];
  scoringWeights?: ScoringWeights;  // defaults to equal weights
  maxItems?: number;
  relevanceThreshold?: number;      // pre-filter before ranking
}

export interface RankedKnowledgeResult {
  resultId: string;
  rankedAt: string;
  contextId: string;
  query: string;
  items: RankedKnowledgeItem[];
  totalRanked: number;
  weightsUsed: ScoringWeights;
  rankingHash: string;
}

export interface KnowledgeRankingContractDependencies {
  now?: () => string;
}

// --- Helpers ---

const DEFAULT_WEIGHTS: ScoringWeights = {
  relevanceWeight: 1,
  tierWeight: 1,
  recencyWeight: 1,
};

function normalizeTierScore(tier?: string): number {
  if (!tier) return 0.25;
  const t = tier.toUpperCase();
  if (t === "T0") return 1.0;
  if (t === "T1") return 0.9;
  if (t === "T2") return 0.65;
  if (t === "T3") return 0.4;
  return 0.25;
}

function normalizeWeights(w: ScoringWeights): ScoringWeights {
  const total = w.relevanceWeight + w.tierWeight + w.recencyWeight;
  if (total === 0) return { relevanceWeight: 1 / 3, tierWeight: 1 / 3, recencyWeight: 1 / 3 };
  return {
    relevanceWeight: w.relevanceWeight / total,
    tierWeight: w.tierWeight / total,
    recencyWeight: w.recencyWeight / total,
  };
}

// --- Contract ---

export class KnowledgeRankingContract {
  private readonly now: () => string;

  constructor(dependencies: KnowledgeRankingContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  rank(request: KnowledgeRankingRequest): RankedKnowledgeResult {
    const rankedAt = this.now();
    const rawWeights = request.scoringWeights ?? DEFAULT_WEIGHTS;
    const weights = normalizeWeights(rawWeights);
    const relevanceThreshold = request.relevanceThreshold ?? 0.0;

    // Pre-filter by relevance threshold
    let candidates = request.candidateItems.filter(
      (item) => item.relevanceScore >= relevanceThreshold,
    );

    // Score each item
    const scored = candidates.map((item) => {
      const tierScore = normalizeTierScore(item.tier);
      const recencyScore = item.recencyScore ?? 0.0;

      const relevanceContribution = weights.relevanceWeight * item.relevanceScore;
      const tierContribution = weights.tierWeight * tierScore;
      const recencyContribution = weights.recencyWeight * recencyScore;
      const compositeScore = relevanceContribution + tierContribution + recencyContribution;

      return {
        ...item,
        compositeScore,
        scoreBreakdown: { relevanceContribution, tierContribution, recencyContribution },
        rank: 0, // placeholder
      };
    });

    // Sort descending by compositeScore, then relevanceScore as tiebreaker
    scored.sort((a, b) =>
      b.compositeScore !== a.compositeScore
        ? b.compositeScore - a.compositeScore
        : b.relevanceScore - a.relevanceScore,
    );

    // Apply maxItems cap
    const capped =
      request.maxItems !== undefined && request.maxItems > 0
        ? scored.slice(0, request.maxItems)
        : scored;

    // Assign ranks
    const ranked: RankedKnowledgeItem[] = capped.map((item, idx) => ({
      ...item,
      rank: idx + 1,
    }));

    const rankingHash = computeDeterministicHash(
      "w1-t12-cp1-knowledge-ranking",
      `${rankedAt}:${request.contextId}`,
      `query:${request.query}:ranked:${ranked.length}`,
      `weights:${weights.relevanceWeight.toFixed(4)}:${weights.tierWeight.toFixed(4)}:${weights.recencyWeight.toFixed(4)}`,
    );

    const resultId = computeDeterministicHash(
      "w1-t12-cp1-result-id",
      rankingHash,
      rankedAt,
    );

    return {
      resultId,
      rankedAt,
      contextId: request.contextId,
      query: request.query,
      items: ranked,
      totalRanked: ranked.length,
      weightsUsed: weights,
      rankingHash,
    };
  }
}

export function createKnowledgeRankingContract(
  dependencies?: KnowledgeRankingContractDependencies,
): KnowledgeRankingContract {
  return new KnowledgeRankingContract(dependencies);
}
