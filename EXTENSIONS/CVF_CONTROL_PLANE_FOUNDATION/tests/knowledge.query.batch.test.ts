/**
 * CPF Knowledge Query & Knowledge Query Batch — Dedicated Tests (W6-T35)
 * ======================================================================
 * GC-023: dedicated file — never merge into index.test.ts.
 *
 * Coverage:
 *   KnowledgeQueryContract.query:
 *     - empty candidateItems → items=[], totalFound=0
 *     - filters items by relevanceThreshold (default 0.0 includes all)
 *     - items with relevanceScore < threshold are excluded
 *     - items with relevanceScore >= threshold are included
 *     - items sorted descending by relevanceScore
 *     - maxItems cap applied after filtering and sorting
 *     - maxItems=0 → no cap (unlimited)
 *     - contextId propagated
 *     - query string propagated
 *     - relevanceThreshold propagated (default 0.0 when not provided)
 *     - queriedAt = injected now()
 *     - queryHash deterministic for same inputs and timestamp
 *     - resultId truthy
 *     - factory createKnowledgeQueryContract returns working instance
 *   KnowledgeQueryBatchContract.batch:
 *     - empty results → totalQueries=0, totalItemsFound=0, avgItemsPerQuery=0
 *     - totalItemsFound = sum of all result.totalFound
 *     - queriesWithResults = count of results where totalFound > 0
 *     - emptyQueryCount = totalQueries - queriesWithResults
 *     - avgItemsPerQuery = round((totalItemsFound/total)*100)/100
 *     - avgItemsPerQuery = 0 when empty
 *     - totalQueries = results.length
 *     - batchHash deterministic for same inputs and timestamp
 *     - batchId truthy
 *     - createdAt = injected now()
 *     - factory createKnowledgeQueryBatchContract returns working instance
 */

import { describe, it, expect } from "vitest";

import {
  KnowledgeQueryContract,
  createKnowledgeQueryContract,
} from "../src/knowledge.query.contract";
import type {
  KnowledgeQueryRequest,
  KnowledgeItem,
  KnowledgeResult,
} from "../src/knowledge.query.contract";

import {
  KnowledgeQueryBatchContract,
  createKnowledgeQueryBatchContract,
} from "../src/knowledge.query.batch.contract";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-03-24T10:30:00.000Z";
const fixedNow = () => FIXED_NOW;

function makeItem(overrides: Partial<KnowledgeItem> = {}): KnowledgeItem {
  return {
    itemId: "item-1",
    title: "CVF Governance Guide",
    content: "Governance content here",
    relevanceScore: 0.8,
    source: "cvf-docs",
    ...overrides,
  };
}

function makeQueryRequest(
  overrides: Partial<KnowledgeQueryRequest> = {},
): KnowledgeQueryRequest {
  return {
    query: "governance rules",
    contextId: "ctx-001",
    ...overrides,
  };
}

function makeKnowledgeResult(
  overrides: Partial<KnowledgeResult> = {},
): KnowledgeResult {
  return {
    resultId: "res-1",
    queriedAt: FIXED_NOW,
    contextId: "ctx-001",
    query: "governance rules",
    items: [],
    totalFound: 0,
    relevanceThreshold: 0.0,
    queryHash: "hash-1",
    ...overrides,
  };
}

// ─── KnowledgeQueryContract.query ─────────────────────────────────────────────

describe("KnowledgeQueryContract.query", () => {
  const contract = new KnowledgeQueryContract({ now: fixedNow });

  describe("empty candidateItems", () => {
    it("no candidateItems → items=[], totalFound=0", () => {
      const result = contract.query(makeQueryRequest());
      expect(result.items).toEqual([]);
      expect(result.totalFound).toBe(0);
    });

    it("empty candidateItems explicit → items=[], totalFound=0", () => {
      const result = contract.query(makeQueryRequest({ candidateItems: [] }));
      expect(result.items).toHaveLength(0);
    });
  });

  describe("relevanceThreshold filtering", () => {
    it("default threshold (0.0) includes all items", () => {
      const items = [
        makeItem({ itemId: "a", relevanceScore: 0.0 }),
        makeItem({ itemId: "b", relevanceScore: 0.5 }),
        makeItem({ itemId: "c", relevanceScore: 1.0 }),
      ];
      const result = contract.query(makeQueryRequest({ candidateItems: items }));
      expect(result.items).toHaveLength(3);
    });

    it("item with relevanceScore < threshold excluded", () => {
      const items = [
        makeItem({ itemId: "low", relevanceScore: 0.3 }),
        makeItem({ itemId: "high", relevanceScore: 0.8 }),
      ];
      const result = contract.query(makeQueryRequest({
        candidateItems: items,
        relevanceThreshold: 0.5,
      }));
      expect(result.items.map((i) => i.itemId)).not.toContain("low");
    });

    it("item with relevanceScore >= threshold included", () => {
      const items = [
        makeItem({ itemId: "exact", relevanceScore: 0.5 }),
        makeItem({ itemId: "above", relevanceScore: 0.9 }),
      ];
      const result = contract.query(makeQueryRequest({
        candidateItems: items,
        relevanceThreshold: 0.5,
      }));
      expect(result.items.map((i) => i.itemId)).toContain("exact");
      expect(result.items.map((i) => i.itemId)).toContain("above");
    });

    it("all items below threshold → items=[], totalFound=0", () => {
      const items = [
        makeItem({ itemId: "a", relevanceScore: 0.1 }),
        makeItem({ itemId: "b", relevanceScore: 0.2 }),
      ];
      const result = contract.query(makeQueryRequest({
        candidateItems: items,
        relevanceThreshold: 0.5,
      }));
      expect(result.items).toHaveLength(0);
      expect(result.totalFound).toBe(0);
    });
  });

  describe("sorting", () => {
    it("items sorted descending by relevanceScore", () => {
      const items = [
        makeItem({ itemId: "low", relevanceScore: 0.3 }),
        makeItem({ itemId: "high", relevanceScore: 0.9 }),
        makeItem({ itemId: "mid", relevanceScore: 0.6 }),
      ];
      const result = contract.query(makeQueryRequest({ candidateItems: items }));
      expect(result.items[0].itemId).toBe("high");
      expect(result.items[1].itemId).toBe("mid");
      expect(result.items[2].itemId).toBe("low");
    });
  });

  describe("maxItems cap", () => {
    it("maxItems=2 caps result to 2 items", () => {
      const items = [
        makeItem({ itemId: "a", relevanceScore: 0.9 }),
        makeItem({ itemId: "b", relevanceScore: 0.7 }),
        makeItem({ itemId: "c", relevanceScore: 0.5 }),
      ];
      const result = contract.query(makeQueryRequest({ candidateItems: items, maxItems: 2 }));
      expect(result.items).toHaveLength(2);
      expect(result.totalFound).toBe(2);
    });

    it("maxItems larger than available → returns all", () => {
      const items = [makeItem({ itemId: "a" }), makeItem({ itemId: "b" })];
      const result = contract.query(makeQueryRequest({ candidateItems: items, maxItems: 10 }));
      expect(result.items).toHaveLength(2);
    });

    it("maxItems=0 → no cap, returns all items", () => {
      const items = [
        makeItem({ itemId: "a" }),
        makeItem({ itemId: "b" }),
        makeItem({ itemId: "c" }),
      ];
      const result = contract.query(makeQueryRequest({ candidateItems: items, maxItems: 0 }));
      expect(result.items).toHaveLength(3);
    });

    it("maxItems applied after threshold filter", () => {
      const items = [
        makeItem({ itemId: "high", relevanceScore: 0.9 }),
        makeItem({ itemId: "mid", relevanceScore: 0.6 }),
        makeItem({ itemId: "low", relevanceScore: 0.1 }),
      ];
      const result = contract.query(makeQueryRequest({
        candidateItems: items,
        relevanceThreshold: 0.5,
        maxItems: 1,
      }));
      expect(result.items).toHaveLength(1);
      expect(result.items[0].itemId).toBe("high");
    });
  });

  describe("output fields", () => {
    it("contextId propagated", () => {
      const result = contract.query(makeQueryRequest({ contextId: "ctx-xyz" }));
      expect(result.contextId).toBe("ctx-xyz");
    });

    it("query string propagated", () => {
      const result = contract.query(makeQueryRequest({ query: "risk management" }));
      expect(result.query).toBe("risk management");
    });

    it("relevanceThreshold defaults to 0.0 when not provided", () => {
      const result = contract.query(makeQueryRequest());
      expect(result.relevanceThreshold).toBe(0.0);
    });

    it("relevanceThreshold = provided value when specified", () => {
      const result = contract.query(makeQueryRequest({ relevanceThreshold: 0.7 }));
      expect(result.relevanceThreshold).toBe(0.7);
    });

    it("queriedAt = injected now()", () => {
      expect(contract.query(makeQueryRequest()).queriedAt).toBe(FIXED_NOW);
    });

    it("queryHash deterministic for same inputs and timestamp", () => {
      const req = makeQueryRequest({ contextId: "ctx-det", query: "test-query" });
      const r1 = contract.query(req);
      const r2 = contract.query(req);
      expect(r1.queryHash).toBe(r2.queryHash);
    });

    it("resultId is truthy", () => {
      expect(contract.query(makeQueryRequest()).resultId.length).toBeGreaterThan(0);
    });
  });

  it("factory createKnowledgeQueryContract returns working instance", () => {
    const c = createKnowledgeQueryContract({ now: fixedNow });
    const result = c.query(makeQueryRequest());
    expect(result.queriedAt).toBe(FIXED_NOW);
    expect(result.relevanceThreshold).toBe(0.0);
  });
});

// ─── KnowledgeQueryBatchContract.batch ───────────────────────────────────────

describe("KnowledgeQueryBatchContract.batch", () => {
  const contract = new KnowledgeQueryBatchContract({ now: fixedNow });

  describe("empty results", () => {
    it("empty → totalQueries=0, totalItemsFound=0, avgItemsPerQuery=0", () => {
      const batch = contract.batch([]);
      expect(batch.totalQueries).toBe(0);
      expect(batch.totalItemsFound).toBe(0);
      expect(batch.avgItemsPerQuery).toBe(0);
    });

    it("empty → queriesWithResults=0, emptyQueryCount=0", () => {
      const batch = contract.batch([]);
      expect(batch.queriesWithResults).toBe(0);
      expect(batch.emptyQueryCount).toBe(0);
    });
  });

  describe("aggregations", () => {
    it("totalItemsFound = sum of all result.totalFound", () => {
      const results = [
        makeKnowledgeResult({ totalFound: 3 }),
        makeKnowledgeResult({ totalFound: 2 }),
        makeKnowledgeResult({ totalFound: 0 }),
      ];
      expect(contract.batch(results).totalItemsFound).toBe(5);
    });

    it("queriesWithResults = count of results where totalFound > 0", () => {
      const results = [
        makeKnowledgeResult({ totalFound: 3 }),
        makeKnowledgeResult({ totalFound: 0 }),
        makeKnowledgeResult({ totalFound: 1 }),
      ];
      expect(contract.batch(results).queriesWithResults).toBe(2);
    });

    it("emptyQueryCount = totalQueries - queriesWithResults", () => {
      const results = [
        makeKnowledgeResult({ totalFound: 3 }),
        makeKnowledgeResult({ totalFound: 0 }),
        makeKnowledgeResult({ totalFound: 0 }),
      ];
      const batch = contract.batch(results);
      expect(batch.emptyQueryCount).toBe(2);
      expect(batch.totalQueries).toBe(3);
    });

    it("avgItemsPerQuery = round((totalFound/total)*100)/100", () => {
      const results = [
        makeKnowledgeResult({ totalFound: 3 }),
        makeKnowledgeResult({ totalFound: 2 }),
      ];
      // (3+2)/2 = 2.5
      expect(contract.batch(results).avgItemsPerQuery).toBe(2.5);
    });

    it("avgItemsPerQuery rounds to 2 decimal places", () => {
      const results = [
        makeKnowledgeResult({ totalFound: 1 }),
        makeKnowledgeResult({ totalFound: 2 }),
        makeKnowledgeResult({ totalFound: 2 }),
      ];
      // (1+2+2)/3 = 5/3 ≈ 1.67
      expect(contract.batch(results).avgItemsPerQuery).toBe(1.67);
    });

    it("all queries with results → emptyQueryCount=0", () => {
      const results = [
        makeKnowledgeResult({ totalFound: 5 }),
        makeKnowledgeResult({ totalFound: 3 }),
      ];
      expect(contract.batch(results).emptyQueryCount).toBe(0);
      expect(contract.batch(results).queriesWithResults).toBe(2);
    });
  });

  describe("output fields", () => {
    it("createdAt = injected now()", () => {
      expect(contract.batch([]).createdAt).toBe(FIXED_NOW);
    });

    it("batchHash deterministic for same inputs and timestamp", () => {
      const results = [makeKnowledgeResult({ totalFound: 2 })];
      const b1 = contract.batch(results);
      const b2 = contract.batch(results);
      expect(b1.batchHash).toBe(b2.batchHash);
    });

    it("batchId is truthy", () => {
      expect(contract.batch([]).batchId.length).toBeGreaterThan(0);
    });
  });

  it("factory createKnowledgeQueryBatchContract returns working instance", () => {
    const c = createKnowledgeQueryBatchContract({ now: fixedNow });
    const batch = c.batch([makeKnowledgeResult({ totalFound: 4 })]);
    expect(batch.totalItemsFound).toBe(4);
    expect(batch.createdAt).toBe(FIXED_NOW);
  });
});
