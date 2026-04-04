import { describe, it, expect } from "vitest";
import {
  KnowledgeRankingConsumerPipelineBatchContract,
  createKnowledgeRankingConsumerPipelineBatchContract,
} from "../src/knowledge.ranking.consumer.pipeline.batch.contract";
import { createKnowledgeRankingConsumerPipelineContract } from "../src/knowledge.ranking.consumer.pipeline.contract";
import type { RankableKnowledgeItem } from "../src/knowledge.ranking.contract";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-03-24T11:00:00.000Z";

function fixedNow(): string {
  return FIXED_NOW;
}

function makeItem(id: string, score: number): RankableKnowledgeItem {
  return {
    itemId: id,
    title: `Item ${id}`,
    content: `Content ${id}`,
    relevanceScore: score,
    source: "test",
  };
}

function makeResult(opts: {
  query?: string;
  contextId?: string;
  items?: RankableKnowledgeItem[];
} = {}) {
  const pipeline = createKnowledgeRankingConsumerPipelineContract({ now: fixedNow });
  return pipeline.execute({
    rankingRequest: {
      query: opts.query ?? "default query",
      contextId: opts.contextId ?? "ctx-batch",
      candidateItems: opts.items ?? [makeItem("i1", 0.9), makeItem("i2", 0.7)],
    },
  });
}

function makeEmptyResult() {
  return makeResult({ query: "empty query", contextId: "ctx-empty", items: [] });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("KnowledgeRankingConsumerPipelineBatchContract", () => {
  it("is instantiable via factory", () => {
    const contract = createKnowledgeRankingConsumerPipelineBatchContract();
    expect(contract).toBeInstanceOf(KnowledgeRankingConsumerPipelineBatchContract);
  });

  it("empty batch — totalResults is 0, dominantTokenBudget is 0", () => {
    const contract = createKnowledgeRankingConsumerPipelineBatchContract({ now: fixedNow });
    const batch = contract.batch([]);
    expect(batch.totalResults).toBe(0);
    expect(batch.dominantTokenBudget).toBe(0);
  });

  it("empty batch — batchHash and batchId are valid non-empty strings", () => {
    const contract = createKnowledgeRankingConsumerPipelineBatchContract({ now: fixedNow });
    const batch = contract.batch([]);
    expect(typeof batch.batchHash).toBe("string");
    expect(batch.batchHash.length).toBeGreaterThan(0);
    expect(typeof batch.batchId).toBe("string");
    expect(batch.batchId.length).toBeGreaterThan(0);
  });

  it("batchId differs from batchHash", () => {
    const contract = createKnowledgeRankingConsumerPipelineBatchContract({ now: fixedNow });
    const batch = contract.batch([makeResult()]);
    expect(batch.batchId).not.toBe(batch.batchHash);
  });

  it("empty batch — emptyRankingCount is 0", () => {
    const contract = createKnowledgeRankingConsumerPipelineBatchContract({ now: fixedNow });
    const batch = contract.batch([]);
    expect(batch.emptyRankingCount).toBe(0);
  });

  it("emptyRankingCount counts results where totalRanked === 0", () => {
    const contract = createKnowledgeRankingConsumerPipelineBatchContract({ now: fixedNow });
    const nonEmpty = makeResult({ query: "q1", contextId: "ctx1" });
    const empty = makeEmptyResult();
    const batch = contract.batch([nonEmpty, empty]);
    expect(batch.emptyRankingCount).toBe(1);
  });

  it("emptyRankingCount is 0 when all results have ranked items", () => {
    const contract = createKnowledgeRankingConsumerPipelineBatchContract({ now: fixedNow });
    const r1 = makeResult({ query: "q1", contextId: "c1" });
    const r2 = makeResult({ query: "q2", contextId: "c2" });
    const batch = contract.batch([r1, r2]);
    expect(batch.emptyRankingCount).toBe(0);
  });

  it("dominantTokenBudget is the max estimatedTokens across results", () => {
    const contract = createKnowledgeRankingConsumerPipelineBatchContract({ now: fixedNow });
    const r1 = makeResult({ query: "short q", contextId: "c1", items: [makeItem("a", 0.9)] });
    const r2 = makeResult({
      query: "q2",
      contextId: "c2",
      items: [makeItem("b", 0.8), makeItem("c", 0.7), makeItem("d", 0.6)],
    });
    const batch = contract.batch([r1, r2]);
    const expected = Math.max(
      r1.consumerPackage.typedContextPackage.estimatedTokens,
      r2.consumerPackage.typedContextPackage.estimatedTokens,
    );
    expect(batch.dominantTokenBudget).toBe(expected);
  });

  it("createdAt matches injected now", () => {
    const contract = createKnowledgeRankingConsumerPipelineBatchContract({ now: fixedNow });
    const batch = contract.batch([makeResult()]);
    expect(batch.createdAt).toBe(FIXED_NOW);
  });

  it("totalResults matches input length", () => {
    const contract = createKnowledgeRankingConsumerPipelineBatchContract({ now: fixedNow });
    const batch = contract.batch([
      makeResult({ query: "q1", contextId: "c1" }),
      makeResult({ query: "q2", contextId: "c2" }),
      makeResult({ query: "q3", contextId: "c3" }),
    ]);
    expect(batch.totalResults).toBe(3);
  });

  it("results array is preserved in batch output", () => {
    const contract = createKnowledgeRankingConsumerPipelineBatchContract({ now: fixedNow });
    const input = [
      makeResult({ query: "q1", contextId: "c1" }),
      makeResult({ query: "q2", contextId: "c2" }),
    ];
    const batch = contract.batch(input);
    expect(batch.results).toHaveLength(2);
  });

  it("single result — dominantTokenBudget equals that result's estimatedTokens", () => {
    const contract = createKnowledgeRankingConsumerPipelineBatchContract({ now: fixedNow });
    const r = makeResult();
    const batch = contract.batch([r]);
    expect(batch.dominantTokenBudget).toBe(
      r.consumerPackage.typedContextPackage.estimatedTokens,
    );
  });

  it("all empty rankings — emptyRankingCount equals totalResults", () => {
    const contract = createKnowledgeRankingConsumerPipelineBatchContract({ now: fixedNow });
    const e1 = makeResult({ query: "e1", contextId: "ce1", items: [] });
    const e2 = makeResult({ query: "e2", contextId: "ce2", items: [] });
    const batch = contract.batch([e1, e2]);
    expect(batch.emptyRankingCount).toBe(2);
    expect(batch.emptyRankingCount).toBe(batch.totalResults);
  });
});
