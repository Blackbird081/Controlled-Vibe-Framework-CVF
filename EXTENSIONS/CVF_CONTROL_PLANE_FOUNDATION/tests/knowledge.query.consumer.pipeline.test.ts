import {
  KnowledgeQueryConsumerPipelineContract,
  createKnowledgeQueryConsumerPipelineContract,
} from "../src/knowledge.query.consumer.pipeline.contract";
import type {
  KnowledgeQueryConsumerPipelineRequest,
} from "../src/knowledge.query.consumer.pipeline.contract";
import type { KnowledgeItem } from "../src/knowledge.query.contract";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-03-25T12:00:00.000Z";
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

function buildRequest(
  query: string,
  contextId: string,
  candidateItems: KnowledgeItem[] = [],
  relevanceThreshold?: number,
  consumerId?: string,
): KnowledgeQueryConsumerPipelineRequest {
  return {
    queryRequest: { query, contextId, candidateItems, relevanceThreshold },
    consumerId,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("KnowledgeQueryConsumerPipelineContract", () => {
  const contract = new KnowledgeQueryConsumerPipelineContract({ now: fixedNow });

  describe("instantiation", () => {
    it("instantiates without dependencies", () => {
      expect(() => new KnowledgeQueryConsumerPipelineContract()).not.toThrow();
    });

    it("factory returns a working instance", () => {
      const c = createKnowledgeQueryConsumerPipelineContract({ now: fixedNow });
      const result = c.execute(buildRequest("test", "ctx-1"));
      expect(result.createdAt).toBe(FIXED_NOW);
    });
  });

  describe("output shape", () => {
    it("execute returns a result object", () => {
      const result = contract.execute(buildRequest("search", "ctx-2"));
      expect(result).toBeDefined();
    });

    it("resultId is a non-empty string", () => {
      const result = contract.execute(buildRequest("search", "ctx-3"));
      expect(typeof result.resultId).toBe("string");
      expect(result.resultId.length).toBeGreaterThan(0);
    });

    it("createdAt equals injected now()", () => {
      const result = contract.execute(buildRequest("search", "ctx-4"));
      expect(result.createdAt).toBe(FIXED_NOW);
    });

    it("queryResult is present", () => {
      const result = contract.execute(buildRequest("search", "ctx-5"));
      expect(result.queryResult).toBeDefined();
    });

    it("consumerPackage is present", () => {
      const result = contract.execute(buildRequest("search", "ctx-6"));
      expect(result.consumerPackage).toBeDefined();
    });

    it("consumerPackage has typedContextPackage", () => {
      const result = contract.execute(buildRequest("search", "ctx-7"));
      expect(result.consumerPackage.typedContextPackage).toBeDefined();
    });

    it("pipelineHash is a non-empty string", () => {
      const result = contract.execute(buildRequest("search", "ctx-8"));
      expect(result.pipelineHash.length).toBeGreaterThan(0);
    });

    it("warnings is an array", () => {
      const result = contract.execute(buildRequest("search", "ctx-9"));
      expect(Array.isArray(result.warnings)).toBe(true);
    });
  });

  describe("consumerId propagation", () => {
    it("consumerId is set when provided", () => {
      const result = contract.execute(buildRequest("q", "ctx-10", [], undefined, "consumer-xyz"));
      expect(result.consumerId).toBe("consumer-xyz");
    });

    it("consumerId is undefined when not provided", () => {
      const result = contract.execute(buildRequest("q", "ctx-11"));
      expect(result.consumerId).toBeUndefined();
    });
  });

  describe("deterministic hashing", () => {
    it("pipelineHash is deterministic for same inputs", () => {
      const r1 = contract.execute(buildRequest("q", "ctx-12"));
      const r2 = contract.execute(buildRequest("q", "ctx-12"));
      expect(r1.pipelineHash).toBe(r2.pipelineHash);
    });

    it("pipelineHash differs when contextId differs", () => {
      const r1 = contract.execute(buildRequest("q", "ctx-a"));
      const r2 = contract.execute(buildRequest("q", "ctx-b"));
      expect(r1.pipelineHash).not.toBe(r2.pipelineHash);
    });

    it("resultId is deterministic for same inputs", () => {
      const r1 = contract.execute(buildRequest("q", "ctx-13"));
      const r2 = contract.execute(buildRequest("q", "ctx-13"));
      expect(r1.resultId).toBe(r2.resultId);
    });

    it("resultId is distinct from pipelineHash", () => {
      const result = contract.execute(buildRequest("q", "ctx-14"));
      expect(result.resultId).not.toBe(result.pipelineHash);
    });
  });

  describe("query derivation", () => {
    it("query includes found:0 when no items match", () => {
      const result = contract.execute(buildRequest("q", "ctx-15"));
      expect(result.consumerPackage.typedContextPackage.query).toContain("found:0");
    });

    it("query includes correct found count when items match", () => {
      const items = [buildItem("i1", 0.8), buildItem("i2", 0.9)];
      const result = contract.execute(buildRequest("q", "ctx-16", items, 0.5));
      expect(result.consumerPackage.typedContextPackage.query).toContain("found:2");
    });

    it("query includes threshold:0.00 by default", () => {
      const result = contract.execute(buildRequest("q", "ctx-17"));
      expect(result.consumerPackage.typedContextPackage.query).toContain("threshold:0.00");
    });

    it("query includes threshold:0.50 when set", () => {
      const result = contract.execute(buildRequest("q", "ctx-18", [], 0.5));
      expect(result.consumerPackage.typedContextPackage.query).toContain("threshold:0.50");
    });

    it("query length is at most 120 characters", () => {
      const result = contract.execute(buildRequest("q".repeat(200), "ctx-19"));
      expect(result.consumerPackage.typedContextPackage.query.length).toBeLessThanOrEqual(120);
    });
  });

  describe("warning messages", () => {
    it("totalFound === 0 → warning about empty set", () => {
      const result = contract.execute(buildRequest("q", "ctx-20", [], 0.5));
      expect(result.warnings).toContain(
        "[knowledge-query] no results found — query returned empty set",
      );
    });

    it("relevanceThreshold === 0.0 → warning about zero threshold", () => {
      const items = [buildItem("x1", 0.9)];
      const result = contract.execute(buildRequest("q", "ctx-21", items));
      expect(result.warnings).toContain(
        "[knowledge-query] zero relevance threshold — all items included regardless of quality",
      );
    });

    it("both warnings apply when totalFound === 0 AND threshold === 0.0", () => {
      const result = contract.execute(buildRequest("q", "ctx-22"));
      expect(result.warnings).toHaveLength(2);
      expect(result.warnings).toContain("[knowledge-query] no results found — query returned empty set");
      expect(result.warnings).toContain("[knowledge-query] zero relevance threshold — all items included regardless of quality");
    });

    it("no warnings when totalFound > 0 and threshold > 0.0", () => {
      const items = [buildItem("y1", 0.9)];
      const result = contract.execute(buildRequest("q", "ctx-23", items, 0.5));
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe("queryResult propagation", () => {
    it("queryResult.contextId matches request contextId", () => {
      const result = contract.execute(buildRequest("q", "ctx-target"));
      expect(result.queryResult.contextId).toBe("ctx-target");
    });

    it("queryResult.totalFound matches filtered item count", () => {
      const items = [buildItem("a1", 0.9), buildItem("a2", 0.3)];
      const result = contract.execute(buildRequest("q", "ctx-24", items, 0.5));
      expect(result.queryResult.totalFound).toBe(1);
    });

    it("queryResult.items are sorted descending by relevanceScore", () => {
      const items = [buildItem("b1", 0.6), buildItem("b2", 0.9), buildItem("b3", 0.7)];
      const result = contract.execute(buildRequest("q", "ctx-25", items));
      expect(result.queryResult.items[0].relevanceScore).toBeGreaterThanOrEqual(
        result.queryResult.items[1].relevanceScore,
      );
    });
  });
});
