import { describe, it, expect } from "vitest";
import {
  KnowledgeRankingContract,
  createKnowledgeRankingContract,
} from "../src/knowledge.ranking.contract";
import type {
  RankableKnowledgeItem,
  KnowledgeRankingRequest,
} from "../src/knowledge.ranking.contract";

// ─── W1-T12 CP1: KnowledgeRankingContract ────────────────────────────────────

function makeItem(
  id: string,
  relevanceScore: number,
  tier?: string,
  recencyScore?: number,
): RankableKnowledgeItem {
  return {
    itemId: id,
    title: `Item ${id}`,
    content: `Content for ${id}`,
    relevanceScore,
    source: `source-${id}`,
    tier,
    recencyScore,
  };
}

describe("W1-T12 CP1: KnowledgeRankingContract", () => {
  it("createKnowledgeRankingContract returns a KnowledgeRankingContract instance", () => {
    expect(createKnowledgeRankingContract()).toBeInstanceOf(KnowledgeRankingContract);
  });

  it("ranks items by composite score descending", () => {
    const items: RankableKnowledgeItem[] = [
      makeItem("low", 0.3, "T3", 0.1),
      makeItem("high", 0.9, "T1", 0.8),
      makeItem("mid", 0.6, "T2", 0.5),
    ];
    const req: KnowledgeRankingRequest = {
      query: "test ranking",
      contextId: "ctx-rank",
      candidateItems: items,
    };
    const result = createKnowledgeRankingContract({
      now: () => "2026-03-23T10:00:00.000Z",
    }).rank(req);

    expect(result.items[0].itemId).toBe("high");
    expect(result.items[1].itemId).toBe("mid");
    expect(result.items[2].itemId).toBe("low");
  });

  it("assigns 1-based ranks in score order", () => {
    const items = [makeItem("a", 0.5), makeItem("b", 0.9), makeItem("c", 0.1)];
    const result = createKnowledgeRankingContract({
      now: () => "2026-03-23T10:00:00.000Z",
    }).rank({ query: "q", contextId: "ctx", candidateItems: items });

    expect(result.items[0].rank).toBe(1);
    expect(result.items[1].rank).toBe(2);
    expect(result.items[2].rank).toBe(3);
  });

  it("score breakdown contributions sum to compositeScore", () => {
    const items = [makeItem("x", 0.7, "T1", 0.6)];
    const result = createKnowledgeRankingContract({
      now: () => "2026-03-23T10:00:00.000Z",
    }).rank({ query: "q", contextId: "ctx", candidateItems: items });

    const item = result.items[0];
    const { relevanceContribution, tierContribution, recencyContribution } =
      item.scoreBreakdown;
    expect(item.compositeScore).toBeCloseTo(
      relevanceContribution + tierContribution + recencyContribution,
      10,
    );
  });

  it("normalizes scoring weights so they sum to 1", () => {
    const items = [makeItem("a", 0.8, "T1", 0.5)];
    const result = createKnowledgeRankingContract({
      now: () => "2026-03-23T10:00:00.000Z",
    }).rank({
      query: "q",
      contextId: "ctx",
      candidateItems: items,
      scoringWeights: { relevanceWeight: 2, tierWeight: 2, recencyWeight: 2 },
    });

    const { relevanceWeight, tierWeight, recencyWeight } = result.weightsUsed;
    expect(relevanceWeight + tierWeight + recencyWeight).toBeCloseTo(1.0, 10);
  });

  it("respects relevanceThreshold pre-filter", () => {
    const items = [makeItem("pass", 0.8), makeItem("fail", 0.2), makeItem("edge", 0.5)];
    const result = createKnowledgeRankingContract({
      now: () => "2026-03-23T10:00:00.000Z",
    }).rank({
      query: "q",
      contextId: "ctx",
      candidateItems: items,
      relevanceThreshold: 0.5,
    });

    expect(result.totalRanked).toBe(2);
    expect(result.items.every((i) => i.relevanceScore >= 0.5)).toBe(true);
  });

  it("respects maxItems cap after ranking", () => {
    const items = [
      makeItem("a", 0.9),
      makeItem("b", 0.8),
      makeItem("c", 0.7),
      makeItem("d", 0.6),
    ];
    const result = createKnowledgeRankingContract({
      now: () => "2026-03-23T10:00:00.000Z",
    }).rank({ query: "q", contextId: "ctx", candidateItems: items, maxItems: 2 });

    expect(result.totalRanked).toBe(2);
    expect(result.items[0].itemId).toBe("a");
  });

  it("uses tier scoring: T1 > T2 > T3", () => {
    const items = [
      makeItem("t3", 0.5, "T3", 0.0),
      makeItem("t1", 0.5, "T1", 0.0),
      makeItem("t2", 0.5, "T2", 0.0),
    ];
    const result = createKnowledgeRankingContract({
      now: () => "2026-03-23T10:00:00.000Z",
    }).rank({
      query: "q",
      contextId: "ctx",
      candidateItems: items,
      scoringWeights: { relevanceWeight: 0, tierWeight: 1, recencyWeight: 0 },
    });

    expect(result.items[0].itemId).toBe("t1");
    expect(result.items[1].itemId).toBe("t2");
    expect(result.items[2].itemId).toBe("t3");
  });

  it("produces deterministic ranking hash for same input", () => {
    const items = [makeItem("a", 0.9, "T1", 0.7), makeItem("b", 0.5, "T2", 0.3)];
    const fixedNow = () => "2026-03-23T10:00:00.000Z";
    const req: KnowledgeRankingRequest = {
      query: "deterministic",
      contextId: "ctx-det",
      candidateItems: items,
    };

    const r1 = createKnowledgeRankingContract({ now: fixedNow }).rank(req);
    const r2 = createKnowledgeRankingContract({ now: fixedNow }).rank(req);

    expect(r1.rankingHash).toBe(r2.rankingHash);
    expect(r1.resultId).toBe(r2.resultId);
  });

  it("returns empty result for empty candidate list", () => {
    const result = createKnowledgeRankingContract({
      now: () => "2026-03-23T10:00:00.000Z",
    }).rank({ query: "q", contextId: "ctx", candidateItems: [] });

    expect(result.totalRanked).toBe(0);
    expect(result.items).toHaveLength(0);
  });

  it("defaults missing recencyScore to 0.0", () => {
    const items = [makeItem("no-recency", 0.7, "T1")]; // no recencyScore
    const result = createKnowledgeRankingContract({
      now: () => "2026-03-23T10:00:00.000Z",
    }).rank({ query: "q", contextId: "ctx", candidateItems: items });

    expect(result.items[0].scoreBreakdown.recencyContribution).toBeCloseTo(0, 10);
  });
});
