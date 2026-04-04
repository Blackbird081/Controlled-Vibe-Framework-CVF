import { describe, it, expect } from "vitest";
import {
  KnowledgeRankingConsumerPipelineContract,
  createKnowledgeRankingConsumerPipelineContract,
} from "../src/knowledge.ranking.consumer.pipeline.contract";
import type {
  KnowledgeRankingConsumerPipelineRequest,
} from "../src/knowledge.ranking.consumer.pipeline.contract";
import type { RankableKnowledgeItem } from "../src/knowledge.ranking.contract";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-03-24T11:00:00.000Z";

function fixedNow(): string {
  return FIXED_NOW;
}

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
    source: "test-source",
    tier,
    recencyScore,
  };
}

function makeRequest(
  opts: {
    query?: string;
    contextId?: string;
    items?: RankableKnowledgeItem[];
    consumerId?: string;
  } = {},
): KnowledgeRankingConsumerPipelineRequest {
  return {
    rankingRequest: {
      query: opts.query ?? "what is the CVF architecture?",
      contextId: opts.contextId ?? "ctx-test",
      candidateItems: opts.items ?? [
        makeItem("item-1", 0.9, "T0", 0.8),
        makeItem("item-2", 0.7, "T1", 0.6),
      ],
    },
    consumerId: opts.consumerId,
  };
}

function makeContract(): KnowledgeRankingConsumerPipelineContract {
  return createKnowledgeRankingConsumerPipelineContract({ now: fixedNow });
}

const BASE_REQUEST = makeRequest();
const EMPTY_REQUEST = makeRequest({ items: [] });

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("KnowledgeRankingConsumerPipelineContract", () => {
  it("is instantiable via factory", () => {
    const contract = createKnowledgeRankingConsumerPipelineContract();
    expect(contract).toBeInstanceOf(KnowledgeRankingConsumerPipelineContract);
  });

  it("execute returns a result with expected shape", () => {
    const result = makeContract().execute(BASE_REQUEST);
    expect(result).toHaveProperty("resultId");
    expect(result).toHaveProperty("createdAt");
    expect(result).toHaveProperty("rankedResult");
    expect(result).toHaveProperty("consumerPackage");
    expect(result).toHaveProperty("pipelineHash");
    expect(result).toHaveProperty("warnings");
  });

  it("createdAt matches injected now", () => {
    const result = makeContract().execute(BASE_REQUEST);
    expect(result.createdAt).toBe(FIXED_NOW);
  });

  it("non-empty ranking — no warnings", () => {
    const result = makeContract().execute(BASE_REQUEST);
    expect(result.rankedResult.totalRanked).toBeGreaterThan(0);
    expect(result.warnings).toHaveLength(0);
  });

  it("empty candidateItems — warning contains [knowledge] prefix", () => {
    const result = makeContract().execute(EMPTY_REQUEST);
    expect(result.rankedResult.totalRanked).toBe(0);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain("[knowledge]");
  });

  it("empty ranking — warning references 'no ranked items returned'", () => {
    const result = makeContract().execute(EMPTY_REQUEST);
    expect(result.warnings[0]).toContain("no ranked items returned");
  });

  it("empty ranking — warning references 'query may need broadening'", () => {
    const result = makeContract().execute(EMPTY_REQUEST);
    expect(result.warnings[0]).toContain("query may need broadening");
  });

  it("query contains the ranking query text", () => {
    const result = makeContract().execute(BASE_REQUEST);
    expect(result.consumerPackage.query).toContain("what is the CVF architecture?");
  });

  it("query contains 'ranked'", () => {
    const result = makeContract().execute(BASE_REQUEST);
    expect(result.consumerPackage.query).toContain("ranked");
  });

  it("query length is at most 120 chars", () => {
    const result = makeContract().execute(
      makeRequest({ query: "q".repeat(200), items: [makeItem("x", 0.9)] }),
    );
    expect(result.consumerPackage.query.length).toBeLessThanOrEqual(120);
  });

  it("consumerPackage contextId matches rankedResult.resultId", () => {
    const result = makeContract().execute(BASE_REQUEST);
    expect(result.consumerPackage.contextId).toBe(result.rankedResult.resultId);
  });

  it("pipelineHash and resultId are non-empty strings", () => {
    const result = makeContract().execute(BASE_REQUEST);
    expect(typeof result.pipelineHash).toBe("string");
    expect(result.pipelineHash.length).toBeGreaterThan(0);
    expect(typeof result.resultId).toBe("string");
    expect(result.resultId.length).toBeGreaterThan(0);
  });

  it("pipelineHash differs from resultId", () => {
    const result = makeContract().execute(BASE_REQUEST);
    expect(result.pipelineHash).not.toBe(result.resultId);
  });

  it("is deterministic — same input yields same hashes", () => {
    const contract = makeContract();
    const r1 = contract.execute(BASE_REQUEST);
    const r2 = contract.execute(BASE_REQUEST);
    expect(r1.pipelineHash).toBe(r2.pipelineHash);
    expect(r1.resultId).toBe(r2.resultId);
  });

  it("different queries produce different pipelineHash", () => {
    const contract = makeContract();
    const r1 = contract.execute(makeRequest({ query: "alpha query" }));
    const r2 = contract.execute(makeRequest({ query: "beta query" }));
    expect(r1.pipelineHash).not.toBe(r2.pipelineHash);
  });

  it("rankedResult.totalRanked reflects item count", () => {
    const result = makeContract().execute(
      makeRequest({ items: [makeItem("a", 0.9), makeItem("b", 0.8), makeItem("c", 0.7)] }),
    );
    expect(result.rankedResult.totalRanked).toBe(3);
  });

  it("rankedResult items are sorted by rank ascending (rank 1 = best)", () => {
    const result = makeContract().execute(
      makeRequest({
        items: [
          makeItem("low", 0.3, "T3"),
          makeItem("high", 0.95, "T0", 0.9),
        ],
      }),
    );
    const ranks = result.rankedResult.items.map((i) => i.rank);
    expect(ranks[0]).toBe(1);
    expect(ranks[1]).toBe(2);
  });

  it("relevanceThreshold filters items before ranking", () => {
    const result = makeContract().execute({
      rankingRequest: {
        query: "filter test",
        contextId: "ctx-filter",
        candidateItems: [
          makeItem("hi", 0.9),
          makeItem("lo", 0.1),
        ],
        relevanceThreshold: 0.5,
      },
    });
    expect(result.rankedResult.totalRanked).toBe(1);
    expect(result.warnings).toHaveLength(0);
  });

  it("consumerPackage.rankedKnowledgeResult.totalRanked matches rankedResult.totalRanked", () => {
    const result = makeContract().execute(BASE_REQUEST);
    expect(result.consumerPackage.rankedKnowledgeResult.totalRanked).toBe(
      result.rankedResult.totalRanked,
    );
  });

  it("consumerId carried through to result", () => {
    const result = makeContract().execute(makeRequest({ consumerId: "consumer-001" }));
    expect(result.consumerId).toBe("consumer-001");
  });

  it("consumerId is undefined when not provided", () => {
    const result = makeContract().execute(BASE_REQUEST);
    expect(result.consumerId).toBeUndefined();
  });

  it("empty ranking — pipelineHash and resultId still truthy", () => {
    const result = makeContract().execute(EMPTY_REQUEST);
    expect(result.pipelineHash).toBeTruthy();
    expect(result.resultId).toBeTruthy();
  });
});
