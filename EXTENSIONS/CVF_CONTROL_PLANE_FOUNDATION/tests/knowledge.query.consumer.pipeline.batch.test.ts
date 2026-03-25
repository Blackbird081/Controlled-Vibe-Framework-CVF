import {
  KnowledgeQueryConsumerPipelineBatchContract,
  createKnowledgeQueryConsumerPipelineBatchContract,
} from "../src/knowledge.query.consumer.pipeline.batch.contract";
import { KnowledgeQueryConsumerPipelineContract } from "../src/knowledge.query.consumer.pipeline.contract";
import type { KnowledgeItem } from "../src/knowledge.query.contract";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-03-25T13:00:00.000Z";
const fixedNow = () => FIXED_NOW;

function buildItem(id: string, score: number): KnowledgeItem {
  return {
    itemId: id,
    title: `Item ${id}`,
    content: `Content ${id}`,
    relevanceScore: score,
    source: `source-${id}`,
  };
}

const pipelineContract = new KnowledgeQueryConsumerPipelineContract({ now: fixedNow });

function buildResult(
  query: string,
  contextId: string,
  candidateItems: KnowledgeItem[] = [],
  relevanceThreshold?: number,
  consumerId?: string,
) {
  return pipelineContract.execute({
    queryRequest: { query, contextId, candidateItems, relevanceThreshold },
    consumerId,
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("KnowledgeQueryConsumerPipelineBatchContract", () => {
  const batchContract = new KnowledgeQueryConsumerPipelineBatchContract({ now: fixedNow });

  describe("instantiation", () => {
    it("instantiates without dependencies", () => {
      expect(() => new KnowledgeQueryConsumerPipelineBatchContract()).not.toThrow();
    });

    it("factory returns a working instance", () => {
      const c = createKnowledgeQueryConsumerPipelineBatchContract({ now: fixedNow });
      expect(c.batch([]).totalResults).toBe(0);
    });
  });

  describe("empty batch", () => {
    it("totalResults=0 for empty input", () => {
      expect(batchContract.batch([]).totalResults).toBe(0);
    });

    it("dominantTokenBudget=0 for empty input", () => {
      expect(batchContract.batch([]).dominantTokenBudget).toBe(0);
    });

    it("emptyResultCount=0 for empty input", () => {
      expect(batchContract.batch([]).emptyResultCount).toBe(0);
    });

    it("results is empty array", () => {
      expect(batchContract.batch([]).results).toHaveLength(0);
    });

    it("batchHash is truthy for empty input", () => {
      expect(batchContract.batch([]).batchHash.length).toBeGreaterThan(0);
    });
  });

  describe("batchId vs batchHash", () => {
    it("batchId is distinct from batchHash", () => {
      const r = buildResult("q", "ctx-b1");
      const batch = batchContract.batch([r]);
      expect(batch.batchId).not.toBe(batch.batchHash);
    });

    it("batchHash is deterministic for same results", () => {
      const r = buildResult("q", "ctx-b2");
      expect(batchContract.batch([r]).batchHash).toBe(batchContract.batch([r]).batchHash);
    });

    it("batchHash differs for different results", () => {
      const r1 = buildResult("q", "ctx-b3");
      const r2 = buildResult("q", "ctx-b4");
      expect(batchContract.batch([r1]).batchHash).not.toBe(batchContract.batch([r2]).batchHash);
    });
  });

  describe("emptyResultCount", () => {
    it("all empty queries → all counted", () => {
      const r1 = buildResult("q", "ctx-e1");
      const r2 = buildResult("q", "ctx-e2");
      expect(batchContract.batch([r1, r2]).emptyResultCount).toBe(2);
    });

    it("all queries with results → emptyResultCount=0", () => {
      const items = [buildItem("x1", 0.9)];
      const r = buildResult("q", "ctx-e3", items, 0.5);
      expect(batchContract.batch([r]).emptyResultCount).toBe(0);
    });

    it("mixed → correct emptyResultCount", () => {
      const items = [buildItem("y1", 0.9)];
      const rEmpty = buildResult("q", "ctx-e4");
      const rFull = buildResult("q", "ctx-e5", items, 0.5);
      expect(batchContract.batch([rEmpty, rFull]).emptyResultCount).toBe(1);
    });
  });

  describe("dominantTokenBudget", () => {
    it("single result → dominantTokenBudget equals its estimatedTokens", () => {
      const r = buildResult("q", "ctx-t1");
      const tokens = r.consumerPackage.typedContextPackage.estimatedTokens;
      expect(batchContract.batch([r]).dominantTokenBudget).toBe(tokens);
    });

    it("multiple results → dominantTokenBudget is the max", () => {
      const r1 = buildResult("q", "ctx-t2");
      const r2 = buildResult("q longer query", "ctx-t3");
      const expected = Math.max(
        r1.consumerPackage.typedContextPackage.estimatedTokens,
        r2.consumerPackage.typedContextPackage.estimatedTokens,
      );
      expect(batchContract.batch([r1, r2]).dominantTokenBudget).toBe(expected);
    });
  });

  describe("general fields", () => {
    it("createdAt equals injected now()", () => {
      expect(batchContract.batch([]).createdAt).toBe(FIXED_NOW);
    });

    it("totalResults equals results.length", () => {
      const r1 = buildResult("q", "ctx-g1");
      const r2 = buildResult("q", "ctx-g2");
      expect(batchContract.batch([r1, r2]).totalResults).toBe(2);
    });

    it("results array is preserved on the batch", () => {
      const r = buildResult("q", "ctx-g3");
      expect(batchContract.batch([r]).results[0]).toBe(r);
    });
  });
});
