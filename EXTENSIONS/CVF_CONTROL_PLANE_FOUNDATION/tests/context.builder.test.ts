import { describe, expect, it } from "vitest";
import {
  ContextBuildBatchContract,
  ContextBuildContract,
  createContextBuildBatchContract,
  createContextBuildContract,
} from "../src/index";
import type { ContextPackage, KnowledgeItem } from "../src/index";

function makeContextPackage(totalSegments: number, id: string): ContextPackage {
  return {
    packageId: `pkg-${id}`,
    builtAt: "2026-03-22T10:00:00.000Z",
    contextId: `ctx-${id}`,
    query: `query-${id}`,
    segments: Array.from({ length: totalSegments }, (_, i) => ({
      segmentId: `seg-${id}-${i}`,
      segmentType: "QUERY" as const,
      content: `content-${i}`,
      tokenEstimate: 4,
    })),
    totalSegments,
    estimatedTokens: totalSegments * 4,
    packageHash: `hash-${id}`,
  };
}

describe("CVF_CONTROL_PLANE_FOUNDATION W1-T11", () => {
  describe("CP1 — ContextBuildContract", () => {
    it("builds a package with QUERY segment always present", () => {
      const contract = createContextBuildContract({
        now: () => "2026-03-22T10:00:00.000Z",
      });
      const result = contract.build({ query: "test query", contextId: "ctx-1" });

      expect(result.segments).toHaveLength(1);
      expect(result.segments[0]?.segmentType).toBe("QUERY");
      expect(result.segments[0]?.content).toBe("test query");
    });

    it("assembles KNOWLEDGE segments after QUERY", () => {
      const contract = createContextBuildContract({
        now: () => "2026-03-22T10:00:00.000Z",
      });
      const knowledgeItems: KnowledgeItem[] = [
        { itemId: "k1", title: "Doc1", content: "body1", relevanceScore: 0.9, source: "src1" },
        { itemId: "k2", title: "Doc2", content: "body2", relevanceScore: 0.7, source: "src2" },
      ];
      const result = contract.build({ query: "q", contextId: "ctx-2", knowledgeItems });

      expect(result.segments).toHaveLength(3);
      expect(result.segments[1]?.segmentType).toBe("KNOWLEDGE");
      expect(result.segments[1]?.content).toBe("Doc1: body1");
      expect(result.segments[2]?.content).toBe("Doc2: body2");
    });

    it("assembles METADATA segments after KNOWLEDGE", () => {
      const contract = createContextBuildContract({
        now: () => "2026-03-22T10:00:00.000Z",
      });
      const result = contract.build({
        query: "q",
        contextId: "ctx-3",
        metadata: { env: "prod", version: "1.0" },
      });

      const metaSegments = result.segments.filter((segment) => segment.segmentType === "METADATA");
      expect(metaSegments).toHaveLength(2);
      expect(metaSegments[0]?.content).toBe("env: prod");
    });

    it("respects maxTokens cap and stops adding segments that would exceed it", () => {
      const contract = createContextBuildContract({
        now: () => "2026-03-22T10:00:00.000Z",
        estimateTokens: () => 10,
      });
      const knowledgeItems: KnowledgeItem[] = [
        { itemId: "k1", title: "A", content: "a", relevanceScore: 1, source: "s" },
        { itemId: "k2", title: "B", content: "b", relevanceScore: 1, source: "s" },
      ];
      const result = contract.build({
        query: "q",
        contextId: "ctx-4",
        knowledgeItems,
        maxTokens: 15,
      });

      expect(result.segments).toHaveLength(1);
      expect(result.segments[0]?.segmentType).toBe("QUERY");
    });

    it("packageHash and packageId are deterministic for identical inputs", () => {
      const fixed = "2026-03-22T10:00:00.000Z";
      const c1 = createContextBuildContract({ now: () => fixed });
      const c2 = createContextBuildContract({ now: () => fixed });
      const request = { query: "hello", contextId: "ctx-det" };

      expect(c1.build(request).packageHash).toBe(c2.build(request).packageHash);
      expect(c1.build(request).packageId).toBe(c2.build(request).packageId);
    });

    it("estimatedTokens equals the sum of segment token estimates", () => {
      const contract = createContextBuildContract({
        now: () => "2026-03-22T10:00:00.000Z",
        estimateTokens: (content) => content.length,
      });
      const result = contract.build({
        query: "hello",
        contextId: "ctx-5",
        metadata: { k: "v" },
      });
      const expected = result.segments.reduce((sum, segment) => sum + segment.tokenEstimate, 0);

      expect(result.estimatedTokens).toBe(expected);
    });

    it("propagates KnowledgeItem source onto the KNOWLEDGE segment", () => {
      const contract = createContextBuildContract({
        now: () => "2026-03-22T10:00:00.000Z",
      });
      const result = contract.build({
        query: "q",
        contextId: "ctx-6",
        knowledgeItems: [{ itemId: "k1", title: "T", content: "C", relevanceScore: 1, source: "my-source" }],
      });

      expect(result.segments[1]?.source).toBe("my-source");
    });

    it("sets totalSegments to the segments array length", () => {
      const contract = createContextBuildContract({
        now: () => "2026-03-22T10:00:00.000Z",
      });
      const result = contract.build({
        query: "q",
        contextId: "ctx-7",
        knowledgeItems: [{ itemId: "k1", title: "T", content: "C", relevanceScore: 1, source: "s" }],
        metadata: { a: "b" },
      });

      expect(result.totalSegments).toBe(result.segments.length);
    });

    it("creates ContextBuildContract via class constructor", () => {
      const contract = new ContextBuildContract();
      expect(contract).toBeInstanceOf(ContextBuildContract);
    });
  });

  describe("CP2 — ContextBuildBatchContract", () => {
    it("returns correct totalPackages and totalSegments", () => {
      const contract = createContextBuildBatchContract({
        now: () => "2026-03-22T10:00:00.000Z",
      });
      const result = contract.batch([makeContextPackage(3, "1"), makeContextPackage(5, "2")]);

      expect(result.totalPackages).toBe(2);
      expect(result.totalSegments).toBe(8);
    });

    it("computes avgSegmentsPerPackage for uneven distribution", () => {
      const contract = createContextBuildBatchContract({
        now: () => "2026-03-22T10:00:00.000Z",
      });
      const result = contract.batch([
        makeContextPackage(3, "1"),
        makeContextPackage(2, "2"),
        makeContextPackage(1, "3"),
      ]);

      expect(result.avgSegmentsPerPackage).toBe(2);
    });

    it("returns zeros for an empty batch", () => {
      const contract = createContextBuildBatchContract({
        now: () => "2026-03-22T10:00:00.000Z",
      });
      const result = contract.batch([]);

      expect(result.totalPackages).toBe(0);
      expect(result.totalSegments).toBe(0);
      expect(result.avgSegmentsPerPackage).toBe(0);
    });

    it("keeps batchId deterministic for identical inputs", () => {
      const fixed = "2026-03-22T10:00:00.000Z";
      const c1 = createContextBuildBatchContract({ now: () => fixed });
      const c2 = createContextBuildBatchContract({ now: () => fixed });
      const packages = [makeContextPackage(4, "1"), makeContextPackage(2, "2")];

      expect(c1.batch(packages).batchId).toBe(c2.batch(packages).batchId);
    });

    it("returns correct average for a single package batch", () => {
      const contract = createContextBuildBatchContract({
        now: () => "2026-03-22T10:00:00.000Z",
      });
      const result = contract.batch([makeContextPackage(7, "1")]);

      expect(result.totalPackages).toBe(1);
      expect(result.totalSegments).toBe(7);
      expect(result.avgSegmentsPerPackage).toBe(7);
    });

    it("produces a 32-character batchHash", () => {
      const contract = createContextBuildBatchContract({
        now: () => "2026-03-22T10:00:00.000Z",
      });
      const result = contract.batch([makeContextPackage(3, "1")]);

      expect(result.batchHash).toHaveLength(32);
    });

    it("rounds avgSegmentsPerPackage to 2 decimal places", () => {
      const contract = createContextBuildBatchContract({
        now: () => "2026-03-22T10:00:00.000Z",
      });
      const result = contract.batch([
        makeContextPackage(1, "1"),
        makeContextPackage(1, "2"),
        makeContextPackage(2, "3"),
      ]);

      expect(result.avgSegmentsPerPackage).toBe(1.33);
    });

    it("creates ContextBuildBatchContract via class constructor", () => {
      const contract = new ContextBuildBatchContract();
      expect(contract).toBeInstanceOf(ContextBuildBatchContract);
    });
  });
});
