/**
 * CPF Retrieval & Packaging — Dedicated Tests (W6-T25)
 * =====================================================
 * GC-023: dedicated file — never merge into index.test.ts.
 *
 * Coverage:
 *   RetrievalContract + helpers:
 *     - resolveSource: uses metadata.source when non-empty string; falls back to title
 *     - mapDocument: id/content/relevanceScore(score??0)/source/metadata fields propagated
 *     - matchesFilters: no sources→pass; sources match→pass; sources mismatch→reject;
 *       no filters→pass; string filter match→pass; mismatch→reject;
 *       array filter with overlap→pass; without overlap→reject
 *     - readStringFilter: string→returns; empty string/non-string→undefined
 *     - readStringList: string array→filtered; non-array/empty→undefined
 *     - retrieve: query propagated; chunkCount = filtered chunks; totalCandidates from pipeline
 *     - factory createRetrievalContract returns working instance
 *
 *   PackagingContract + helpers:
 *     - estimateTokenCount: ceil(content.length / 4)
 *     - serializeChunks: empty→"empty"; non-empty→JSON content
 *     - package: chunks within budget selected; truncated=true when budget exceeded;
 *       truncated=false when all fit; totalTokens = sum of selected; tokenBudget propagated;
 *       freeze=undefined when no executionId; freeze.executionId set when provided;
 *       snapshotHash deterministic for same inputs
 *     - factory createPackagingContract returns working instance
 */

import { describe, it, expect } from "vitest";

import {
  RetrievalContract,
  createRetrievalContract,
  resolveSource,
  mapDocument,
  matchesFilters,
  readStringFilter,
  readStringList,
} from "../src/retrieval.contract";
import type { RAGPipeline } from "../../CVF_ECO_v1.4_RAG_PIPELINE/src/rag.pipeline";
import type { RAGDocument } from "../../CVF_ECO_v1.4_RAG_PIPELINE/src/types";
import {
  PackagingContract,
  createPackagingContract,
  estimateTokenCount,
  serializeChunks,
} from "../src/packaging.contract";
import type { PackagingChunk } from "../src/packaging.contract";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeRAGDocument(overrides: Partial<RAGDocument> = {}): RAGDocument {
  return {
    id: "doc-1",
    title: "Test Title",
    content: "Test content",
    tier: "T3_OPERATIONAL",
    documentType: "context_snippet",
    score: 0.8,
    tags: [],
    metadata: {},
    ...overrides,
  };
}

function makeRAGPipeline(docs: RAGDocument[]): RAGPipeline {
  return {
    query: () => ({
      query: "test",
      documents: docs,
      totalCandidates: docs.length + 2,
      retrievalTimeMs: 5,
      tiersSearched: ["T3_OPERATIONAL" as const],
    }),
  } as unknown as RAGPipeline;
}

function makeChunk(overrides: Partial<PackagingChunk> = {}): PackagingChunk {
  return {
    id: "chunk-1",
    source: "src",
    content: "1234", // 4 chars → 1 token
    relevanceScore: 1.0,
    ...overrides,
  };
}

// ─── resolveSource ─────────────────────────────────────────────────────────────

describe("resolveSource", () => {
  it("returns metadata.source when non-empty string", () => {
    const doc = makeRAGDocument({ metadata: { source: "my-source" } });
    expect(resolveSource(doc)).toBe("my-source");
  });

  it("returns document.title when metadata.source is absent", () => {
    const doc = makeRAGDocument({ title: "My Title", metadata: {} });
    expect(resolveSource(doc)).toBe("My Title");
  });

  it("returns document.title when metadata.source is empty string", () => {
    const doc = makeRAGDocument({ title: "My Title", metadata: { source: "" } });
    expect(resolveSource(doc)).toBe("My Title");
  });

  it("returns document.title when metadata.source is not a string", () => {
    const doc = makeRAGDocument({ title: "My Title", metadata: { source: 42 } });
    expect(resolveSource(doc)).toBe("My Title");
  });
});

// ─── mapDocument ───────────────────────────────────────────────────────────────

describe("mapDocument", () => {
  it("id = document.id", () => {
    const doc = makeRAGDocument({ id: "doc-abc" });
    expect(mapDocument(doc).id).toBe("doc-abc");
  });

  it("content = document.content", () => {
    const doc = makeRAGDocument({ content: "hello world" });
    expect(mapDocument(doc).content).toBe("hello world");
  });

  it("relevanceScore = document.score", () => {
    const doc = makeRAGDocument({ score: 0.75 });
    expect(mapDocument(doc).relevanceScore).toBe(0.75);
  });

  it("relevanceScore = 0 when score is undefined", () => {
    const doc = makeRAGDocument({ score: undefined });
    expect(mapDocument(doc).relevanceScore).toBe(0);
  });

  it("source uses resolveSource (metadata.source or title)", () => {
    const doc = makeRAGDocument({ metadata: { source: "resolved-src" } });
    expect(mapDocument(doc).source).toBe("resolved-src");
  });

  it("metadata includes title, tier, documentType, domain, tags", () => {
    const doc = makeRAGDocument({
      title: "T",
      tier: "T1_DOCTRINE",
      documentType: "policy",
      domain: "governance",
      tags: ["a", "b"],
      metadata: {},
    });
    const chunk = mapDocument(doc);
    expect(chunk.metadata?.title).toBe("T");
    expect(chunk.metadata?.tier).toBe("T1_DOCTRINE");
    expect(chunk.metadata?.documentType).toBe("policy");
    expect(chunk.metadata?.domain).toBe("governance");
    expect(chunk.metadata?.tags).toEqual(["a", "b"]);
  });

  it("metadata spreads document.metadata extra fields", () => {
    const doc = makeRAGDocument({ metadata: { customKey: "customVal" } });
    expect(mapDocument(doc).metadata?.customKey).toBe("customVal");
  });
});

// ─── matchesFilters ────────────────────────────────────────────────────────────

describe("matchesFilters", () => {
  const chunk = makeChunk({ source: "src-a", metadata: { category: "alpha", items: ["x", "y"] } });

  it("no options → true", () => {
    expect(matchesFilters(chunk, undefined)).toBe(true);
  });

  it("sources filter: source in list → true", () => {
    expect(matchesFilters(chunk, { sources: ["src-a", "src-b"] })).toBe(true);
  });

  it("sources filter: source not in list → false", () => {
    expect(matchesFilters(chunk, { sources: ["src-z"] })).toBe(false);
  });

  it("empty sources list → true (no filter applied)", () => {
    expect(matchesFilters(chunk, { sources: [] })).toBe(true);
  });

  it("no filters object → true", () => {
    expect(matchesFilters(chunk, {})).toBe(true);
  });

  it("string filter match → true", () => {
    expect(matchesFilters(chunk, { filters: { category: "alpha" } })).toBe(true);
  });

  it("string filter mismatch → false", () => {
    expect(matchesFilters(chunk, { filters: { category: "beta" } })).toBe(false);
  });

  it("array filter with overlap → true", () => {
    expect(matchesFilters(chunk, { filters: { items: ["x", "z"] } })).toBe(true);
  });

  it("array filter without overlap → false", () => {
    expect(matchesFilters(chunk, { filters: { items: ["z"] } })).toBe(false);
  });

  it("domain/tags keys skipped in filter loop", () => {
    // domain and tags are passed to RAGPipeline, not post-filtered here
    expect(matchesFilters(chunk, { filters: { domain: "anything", tags: ["x"] } })).toBe(true);
  });
});

// ─── readStringFilter ──────────────────────────────────────────────────────────

describe("readStringFilter", () => {
  it("non-empty string → returns the string", () => {
    expect(readStringFilter("hello")).toBe("hello");
  });

  it("empty string → undefined", () => {
    expect(readStringFilter("")).toBeUndefined();
  });

  it("undefined → undefined", () => {
    expect(readStringFilter(undefined)).toBeUndefined();
  });

  it("number → undefined", () => {
    expect(readStringFilter(42)).toBeUndefined();
  });
});

// ─── readStringList ────────────────────────────────────────────────────────────

describe("readStringList", () => {
  it("string array → returns non-empty items", () => {
    expect(readStringList(["a", "b"])).toEqual(["a", "b"]);
  });

  it("filters empty strings from array", () => {
    expect(readStringList(["a", "", "b"])).toEqual(["a", "b"]);
  });

  it("non-array → undefined", () => {
    expect(readStringList("string")).toBeUndefined();
  });

  it("empty array → undefined", () => {
    expect(readStringList([])).toBeUndefined();
  });

  it("array of only empty strings → undefined", () => {
    expect(readStringList(["", ""])).toBeUndefined();
  });
});

// ─── RetrievalContract.retrieve ────────────────────────────────────────────────

describe("RetrievalContract.retrieve", () => {
  it("query field = request.query", () => {
    const doc = makeRAGDocument({ metadata: {} });
    const pipeline = makeRAGPipeline([doc]);
    const contract = new RetrievalContract({ knowledge: pipeline });
    const result = contract.retrieve({ query: "my-query" });
    expect(result.query).toBe("my-query");
  });

  it("chunkCount = length of mapped and filtered chunks", () => {
    const docs = [makeRAGDocument({ metadata: {} }), makeRAGDocument({ id: "doc-2", metadata: {} })];
    const pipeline = makeRAGPipeline(docs);
    const contract = new RetrievalContract({ knowledge: pipeline });
    expect(contract.retrieve({ query: "q" }).chunkCount).toBe(2);
  });

  it("totalCandidates from RAGPipeline result", () => {
    const pipeline = makeRAGPipeline([]);
    const contract = new RetrievalContract({ knowledge: pipeline });
    // makeRAGPipeline sets totalCandidates = docs.length + 2 = 2
    expect(contract.retrieve({ query: "q" }).totalCandidates).toBe(2);
  });

  it("getKnowledge() returns the injected pipeline", () => {
    const pipeline = makeRAGPipeline([]);
    const contract = new RetrievalContract({ knowledge: pipeline });
    expect(contract.getKnowledge()).toBe(pipeline);
  });

  it("factory createRetrievalContract returns working instance", () => {
    const pipeline = makeRAGPipeline([]);
    const c = createRetrievalContract({ knowledge: pipeline });
    expect(c.retrieve({ query: "test" }).query).toBe("test");
  });
});

// ─── estimateTokenCount ────────────────────────────────────────────────────────

describe("estimateTokenCount", () => {
  it("empty string → 0", () => {
    expect(estimateTokenCount("")).toBe(0);
  });

  it("4-char string → 1 token (ceil(4/4))", () => {
    expect(estimateTokenCount("1234")).toBe(1);
  });

  it("5-char string → 2 tokens (ceil(5/4))", () => {
    expect(estimateTokenCount("12345")).toBe(2);
  });
});

// ─── serializeChunks ───────────────────────────────────────────────────────────

describe("serializeChunks", () => {
  it("empty array → 'empty'", () => {
    expect(serializeChunks([])).toBe("empty");
  });

  it("non-empty → contains id and content", () => {
    const serialized = serializeChunks([makeChunk({ id: "c1", content: "data" })]);
    expect(serialized).toContain("c1");
    expect(serialized).toContain("data");
  });
});

// ─── PackagingContract.package ─────────────────────────────────────────────────

describe("PackagingContract.package", () => {
  const contract = new PackagingContract();

  it("chunks within token budget are selected", () => {
    // 4 chars = 1 token each; budget = 2 → both fit
    const chunks = [makeChunk({ id: "a" }), makeChunk({ id: "b" })];
    const result = contract.package({ chunks, tokenBudget: 2 });
    expect(result.chunks).toHaveLength(2);
  });

  it("truncated = true when budget exceeded", () => {
    // chunk = 1 token, budget = 1 → only first chunk fits
    const chunks = [makeChunk({ id: "a" }), makeChunk({ id: "b" })];
    const result = contract.package({ chunks, tokenBudget: 1 });
    expect(result.truncated).toBe(true);
    expect(result.chunks).toHaveLength(1);
  });

  it("truncated = false when all chunks fit", () => {
    const chunks = [makeChunk({ id: "a" })];
    const result = contract.package({ chunks, tokenBudget: 100 });
    expect(result.truncated).toBe(false);
  });

  it("totalTokens = sum of selected chunk token estimates", () => {
    // 4 chars = 1 token; 2 chunks = 2 tokens
    const chunks = [makeChunk({ id: "a" }), makeChunk({ id: "b" })];
    const result = contract.package({ chunks, tokenBudget: 10 });
    expect(result.totalTokens).toBe(2);
  });

  it("tokenBudget = request.tokenBudget", () => {
    const result = contract.package({ chunks: [], tokenBudget: 500 });
    expect(result.tokenBudget).toBe(500);
  });

  it("freeze = undefined when no executionId", () => {
    const result = contract.package({ chunks: [], tokenBudget: 10 });
    expect(result.freeze).toBeUndefined();
  });

  it("freeze present and executionId set when executionId provided", () => {
    const result = contract.package({ chunks: [], tokenBudget: 10, executionId: "exec-1" });
    expect(result.freeze).toBeDefined();
    expect(result.freeze?.executionId).toBe("exec-1");
  });

  it("snapshotHash is deterministic for same inputs", () => {
    const chunks = [makeChunk({ id: "x" })];
    const r1 = contract.package({ chunks, tokenBudget: 10 });
    const r2 = contract.package({ chunks, tokenBudget: 10 });
    expect(r1.snapshotHash).toBe(r2.snapshotHash);
  });

  it("factory createPackagingContract returns working instance", () => {
    const c = createPackagingContract();
    const result = c.package({ chunks: [], tokenBudget: 10 });
    expect(result.truncated).toBe(false);
    expect(result.totalTokens).toBe(0);
  });
});
