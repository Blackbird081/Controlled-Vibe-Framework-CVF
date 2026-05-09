import { describe, it, expect } from "vitest";
import {
  ContextPackagerContract,
  createContextPackagerContract,
} from "../src/context.packager.contract";
import type {
  ContextPackagerRequest,
  ExtendedSegmentType,
} from "../src/context.packager.contract";

// ─── W1-T12 CP2: ContextPackagerContract ─────────────────────────────────────

const FIXED_NOW = () => "2026-03-23T10:00:00.000Z";

function makeRequest(overrides: Partial<ContextPackagerRequest> = {}): ContextPackagerRequest {
  return {
    query: "test query",
    contextId: "ctx-test",
    ...overrides,
  };
}

describe("W1-T12 CP2: ContextPackagerContract", () => {
  it("createContextPackagerContract returns a ContextPackagerContract instance", () => {
    expect(createContextPackagerContract()).toBeInstanceOf(ContextPackagerContract);
  });

  it("always includes QUERY segment when allowed", () => {
    const result = createContextPackagerContract({ now: FIXED_NOW }).pack(
      makeRequest(),
    );
    expect(result.segments.some((s) => s.segmentType === "QUERY")).toBe(true);
  });

  it("includes CODE segments when codeSnippets provided", () => {
    const result = createContextPackagerContract({ now: FIXED_NOW }).pack(
      makeRequest({
        codeSnippets: [{ id: "cs1", content: "const x = 1;", source: "file.ts" }],
      }),
    );
    const codeSegs = result.segments.filter((s) => s.segmentType === "CODE");
    expect(codeSegs).toHaveLength(1);
    expect(codeSegs[0].content).toBe("const x = 1;");
  });

  it("includes STRUCTURED segments when structuredData provided", () => {
    const result = createContextPackagerContract({ now: FIXED_NOW }).pack(
      makeRequest({
        structuredData: [{ id: "sd1", content: '{"key":"val"}' }],
      }),
    );
    expect(result.segments.some((s) => s.segmentType === "STRUCTURED")).toBe(true);
  });

  it("includes KNOWLEDGE segments from knowledgeItems", () => {
    const result = createContextPackagerContract({ now: FIXED_NOW }).pack(
      makeRequest({
        knowledgeItems: [
          { itemId: "k1", title: "Topic", content: "Detail", relevanceScore: 0.9, source: "s" },
        ],
      }),
    );
    expect(result.segments.some((s) => s.segmentType === "KNOWLEDGE")).toBe(true);
  });

  it("respects allowedTypes constraint — excludes disallowed types", () => {
    const allowedTypes: ExtendedSegmentType[] = ["QUERY", "CODE"];
    const result = createContextPackagerContract({ now: FIXED_NOW }).pack(
      makeRequest({
        knowledgeItems: [
          { itemId: "k1", title: "T", content: "C", relevanceScore: 0.9, source: "s" },
        ],
        codeSnippets: [{ id: "cs1", content: "fn(){}" }],
        segmentTypeConstraints: { allowedTypes },
      }),
    );
    const types = result.segments.map((s) => s.segmentType);
    expect(types).not.toContain("KNOWLEDGE");
    expect(types).toContain("CODE");
  });

  it("respects per-type token cap", () => {
    const result = createContextPackagerContract({
      now: FIXED_NOW,
      estimateTokens: () => 10,
    }).pack(
      makeRequest({
        codeSnippets: [
          { id: "cs1", content: "snippet-1" },
          { id: "cs2", content: "snippet-2" },
        ],
        segmentTypeConstraints: {
          typeTokenCaps: { CODE: 10 }, // only 1 CODE segment (10 tokens) fits
        },
      }),
    );
    const codeSegs = result.segments.filter((s) => s.segmentType === "CODE");
    expect(codeSegs).toHaveLength(1);
    expect(result.perTypeTokens.CODE).toBeLessThanOrEqual(10);
  });

  it("respects global maxTokens budget", () => {
    const result = createContextPackagerContract({
      now: FIXED_NOW,
      estimateTokens: () => 20,
    }).pack(
      makeRequest({
        knowledgeItems: [
          { itemId: "k1", title: "A", content: "B", relevanceScore: 0.9, source: "s" },
          { itemId: "k2", title: "C", content: "D", relevanceScore: 0.8, source: "s" },
        ],
        maxTokens: 30,
      }),
    );
    expect(result.estimatedTokens).toBeLessThanOrEqual(30);
  });

  it("sorts segments by typePriorityOrder", () => {
    const result = createContextPackagerContract({ now: FIXED_NOW }).pack(
      makeRequest({
        knowledgeItems: [
          { itemId: "k1", title: "T", content: "C", relevanceScore: 0.9, source: "s" },
        ],
        codeSnippets: [{ id: "cs1", content: "code()" }],
        segmentTypeConstraints: {
          typePriorityOrder: ["KNOWLEDGE", "CODE", "QUERY"],
        },
      }),
    );
    expect(result.segments[0].segmentType).toBe("KNOWLEDGE");
    expect(result.segments[1].segmentType).toBe("CODE");
  });

  it("perTypeTokens breakdown sums to estimatedTokens", () => {
    const result = createContextPackagerContract({ now: FIXED_NOW }).pack(
      makeRequest({
        codeSnippets: [{ id: "cs1", content: "x = 1" }],
        metadata: { env: "test" },
      }),
    );
    const breakdownSum = Object.values(result.perTypeTokens).reduce(
      (sum, n) => sum + n,
      0,
    );
    expect(breakdownSum).toBe(result.estimatedTokens);
  });

  it("produces deterministic packageHash for same inputs", () => {
    const req = makeRequest({
      codeSnippets: [{ id: "cs1", content: "const x = 42;" }],
    });
    const r1 = createContextPackagerContract({ now: FIXED_NOW }).pack(req);
    const r2 = createContextPackagerContract({ now: FIXED_NOW }).pack(req);
    expect(r1.packageHash).toBe(r2.packageHash);
    expect(r1.packageId).toBe(r2.packageId);
  });

  it("returns empty segments for empty request", () => {
    const result = createContextPackagerContract({ now: FIXED_NOW }).pack(
      makeRequest({
        segmentTypeConstraints: { allowedTypes: ["CODE"] },
      }),
    );
    expect(result.totalSegments).toBe(0);
    expect(result.estimatedTokens).toBe(0);
  });
});
