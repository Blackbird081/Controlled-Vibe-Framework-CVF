import { describe, it, expect } from "vitest";
import {
  ContextBuildConsumerPipelineContract,
  createContextBuildConsumerPipelineContract,
} from "../src/context.build.consumer.pipeline.contract";
import {
  ContextBuildConsumerPipelineBatchContract,
  createContextBuildConsumerPipelineBatchContract,
} from "../src/context.build.consumer.pipeline.batch.contract";
import type { ContextPackage, ContextSegment } from "../src/context.build.contract";

const FIXED_NOW = "2026-03-27T10:00:00.000Z";

// --- Helper: build a ContextSegment ---
function makeSeg(
  type: ContextSegment["segmentType"],
  content: string,
  tokens = 10,
): ContextSegment {
  return {
    segmentId: `seg-${type}-${content.slice(0, 6)}`,
    segmentType: type,
    content,
    tokenEstimate: tokens,
  };
}

// --- Helper: build a ContextPackage ---
function makePackage(options: {
  contextId?: string;
  query?: string;
  segments?: ContextSegment[];
  estimatedTokens?: number;
  packageId?: string;
  packageHash?: string;
} = {}): ContextPackage {
  const {
    contextId = "ctx-abc",
    query = "What is CVF?",
    segments = [makeSeg("QUERY", "What is CVF?", 4), makeSeg("KNOWLEDGE", "CVF is a framework.", 20)],
    packageId = "pkg-abc",
    packageHash = "hash-pkg-abc",
  } = options;

  const estimatedTokens = options.estimatedTokens ?? segments.reduce((s, seg) => s + seg.tokenEstimate, 0);

  return {
    packageId,
    builtAt: FIXED_NOW,
    contextId,
    query,
    segments,
    totalSegments: segments.length,
    estimatedTokens,
    packageHash,
  };
}

const fullPackage = makePackage();
const queryOnlyPackage = makePackage({
  segments: [makeSeg("QUERY", "Query only", 5)],
  contextId: "ctx-query-only",
  packageId: "pkg-query",
  packageHash: "hash-pkg-query",
});
const emptyPackage = makePackage({
  segments: [],
  estimatedTokens: 0,
  contextId: "ctx-empty",
  packageId: "pkg-empty",
  packageHash: "hash-pkg-empty",
});
const richPackage = makePackage({
  segments: [
    makeSeg("QUERY", "Tell me about agents", 6),
    makeSeg("KNOWLEDGE", "Agents coordinate tasks.", 30),
    makeSeg("KNOWLEDGE", "Multi-agent systems.", 25),
    makeSeg("METADATA", "source:internal", 5),
  ],
  contextId: "ctx-rich",
  packageId: "pkg-rich",
  packageHash: "hash-pkg-rich",
});

describe("ContextBuildConsumerPipelineContract", () => {
  const contract = new ContextBuildConsumerPipelineContract({ now: () => FIXED_NOW });

  describe("instantiation", () => {
    it("instantiates without dependencies", () => {
      expect(() => new ContextBuildConsumerPipelineContract()).not.toThrow();
    });

    it("factory returns a working instance", () => {
      const c = createContextBuildConsumerPipelineContract();
      expect(c.execute({ contextPackage: fullPackage })).toBeDefined();
    });
  });

  describe("output shape", () => {
    const result = contract.execute({ contextPackage: fullPackage });

    it("has resultId", () => {
      expect(typeof result.resultId).toBe("string");
      expect(result.resultId.length).toBeGreaterThan(0);
    });

    it("has createdAt equal to now()", () => {
      expect(result.createdAt).toBe(FIXED_NOW);
    });

    it("has contextPackage reference", () => {
      expect(result.contextPackage).toBe(fullPackage);
    });

    it("has consumerPackage", () => {
      expect(result.consumerPackage).toBeDefined();
      expect(typeof result.consumerPackage.pipelineHash).toBe("string");
    });

    it("has query string", () => {
      expect(typeof result.query).toBe("string");
      expect(result.query).toContain("ContextBuild:");
    });

    it("has contextId", () => {
      expect(typeof result.contextId).toBe("string");
    });

    it("has warnings array", () => {
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    it("consumerId is undefined when not provided", () => {
      expect(result.consumerId).toBeUndefined();
    });

    it("has pipelineHash", () => {
      expect(typeof result.pipelineHash).toBe("string");
      expect(result.pipelineHash.length).toBeGreaterThan(0);
    });

    it("resultId differs from pipelineHash", () => {
      expect(result.resultId).not.toBe(result.pipelineHash);
    });
  });

  describe("consumerId propagation", () => {
    it("propagates provided consumerId", () => {
      const result = contract.execute({ contextPackage: fullPackage, consumerId: "consumer-a" });
      expect(result.consumerId).toBe("consumer-a");
    });

    it("consumerId is undefined when not provided", () => {
      expect(contract.execute({ contextPackage: fullPackage }).consumerId).toBeUndefined();
    });
  });

  describe("query derivation", () => {
    it("includes segment count in query", () => {
      const result = contract.execute({ contextPackage: fullPackage });
      expect(result.query).toContain(`segments=${fullPackage.totalSegments}`);
    });

    it("includes estimated tokens in query", () => {
      const result = contract.execute({ contextPackage: fullPackage });
      expect(result.query).toContain(`tokens=${fullPackage.estimatedTokens}`);
    });

    it("includes contextId in query", () => {
      const result = contract.execute({ contextPackage: fullPackage });
      expect(result.query).toContain(`contextId=${fullPackage.contextId}`);
    });

    it("derives correct query for empty package", () => {
      const result = contract.execute({ contextPackage: emptyPackage });
      expect(result.query).toContain("segments=0");
      expect(result.query).toContain("tokens=0");
    });

    it("derives correct query for rich package", () => {
      const result = contract.execute({ contextPackage: richPackage });
      expect(result.query).toContain(`segments=${richPackage.totalSegments}`);
    });
  });

  describe("contextId extraction", () => {
    it("contextId equals contextPackage.contextId", () => {
      const result = contract.execute({ contextPackage: fullPackage });
      expect(result.contextId).toBe(fullPackage.contextId);
    });

    it("different packages yield different contextIds", () => {
      const r1 = contract.execute({ contextPackage: fullPackage });
      const r2 = contract.execute({ contextPackage: emptyPackage });
      expect(r1.contextId).not.toBe(r2.contextId);
    });
  });

  describe("warnings", () => {
    it("emits no warnings for full package", () => {
      const result = contract.execute({ contextPackage: fullPackage });
      expect(result.warnings).toHaveLength(0);
    });

    it("emits WARNING_NO_SEGMENTS for empty package", () => {
      const result = contract.execute({ contextPackage: emptyPackage });
      expect(result.warnings).toContain("WARNING_NO_SEGMENTS");
    });

    it("does not emit WARNING_NO_SEGMENTS for package with segments", () => {
      const result = contract.execute({ contextPackage: fullPackage });
      expect(result.warnings).not.toContain("WARNING_NO_SEGMENTS");
    });

    it("emits WARNING_NO_KNOWLEDGE for query-only package", () => {
      const result = contract.execute({ contextPackage: queryOnlyPackage });
      expect(result.warnings).toContain("WARNING_NO_KNOWLEDGE");
    });

    it("does not emit WARNING_NO_KNOWLEDGE when KNOWLEDGE segments exist", () => {
      const result = contract.execute({ contextPackage: fullPackage });
      expect(result.warnings).not.toContain("WARNING_NO_KNOWLEDGE");
    });

    it("emits WARNING_TOKEN_BUDGET_ZERO for 0-token package", () => {
      const result = contract.execute({ contextPackage: emptyPackage });
      expect(result.warnings).toContain("WARNING_TOKEN_BUDGET_ZERO");
    });

    it("does not emit WARNING_TOKEN_BUDGET_ZERO for package with tokens", () => {
      const result = contract.execute({ contextPackage: fullPackage });
      expect(result.warnings).not.toContain("WARNING_TOKEN_BUDGET_ZERO");
    });

    it("emits WARNING_NO_SEGMENTS and WARNING_TOKEN_BUDGET_ZERO for empty package", () => {
      const result = contract.execute({ contextPackage: emptyPackage });
      expect(result.warnings).toContain("WARNING_NO_SEGMENTS");
      expect(result.warnings).toContain("WARNING_TOKEN_BUDGET_ZERO");
    });

    it("emits WARNING_NO_KNOWLEDGE for query-only (has segments, no KNOWLEDGE)", () => {
      const result = contract.execute({ contextPackage: queryOnlyPackage });
      expect(result.warnings).toContain("WARNING_NO_KNOWLEDGE");
      expect(result.warnings).not.toContain("WARNING_NO_SEGMENTS");
    });

    it("rich package emits no warnings", () => {
      const result = contract.execute({ contextPackage: richPackage });
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe("deterministic hashing", () => {
    it("pipelineHash is deterministic for same input", () => {
      const r1 = contract.execute({ contextPackage: fullPackage });
      const r2 = contract.execute({ contextPackage: fullPackage });
      expect(r1.pipelineHash).toBe(r2.pipelineHash);
    });

    it("resultId is deterministic for same input", () => {
      const r1 = contract.execute({ contextPackage: fullPackage });
      const r2 = contract.execute({ contextPackage: fullPackage });
      expect(r1.resultId).toBe(r2.resultId);
    });

    it("pipelineHash differs for different packages", () => {
      const r1 = contract.execute({ contextPackage: fullPackage });
      const r2 = contract.execute({ contextPackage: richPackage });
      expect(r1.pipelineHash).not.toBe(r2.pipelineHash);
    });
  });
});

describe("ContextBuildConsumerPipelineBatchContract", () => {
  const pipelineContract = new ContextBuildConsumerPipelineContract({ now: () => FIXED_NOW });
  const batchContract = new ContextBuildConsumerPipelineBatchContract({ now: () => FIXED_NOW });

  function makeResult(pkg: ContextPackage) {
    return pipelineContract.execute({ contextPackage: pkg });
  }

  describe("instantiation", () => {
    it("instantiates without dependencies", () => {
      expect(() => new ContextBuildConsumerPipelineBatchContract()).not.toThrow();
    });

    it("factory returns a working instance", () => {
      const c = createContextBuildConsumerPipelineBatchContract();
      expect(c.batch([])).toBeDefined();
    });
  });

  describe("output shape", () => {
    const batch = batchContract.batch([makeResult(fullPackage)]);

    it("has batchId", () => { expect(typeof batch.batchId).toBe("string"); });
    it("has batchHash", () => { expect(typeof batch.batchHash).toBe("string"); });
    it("batchId differs from batchHash", () => { expect(batch.batchId).not.toBe(batch.batchHash); });
    it("has createdAt", () => { expect(batch.createdAt).toBe(FIXED_NOW); });
    it("has totalPackages", () => { expect(typeof batch.totalPackages).toBe("number"); });
    it("has totalSegments", () => { expect(typeof batch.totalSegments).toBe("number"); });
    it("has totalTokens", () => { expect(typeof batch.totalTokens).toBe("number"); });
    it("has dominantTokenBudget", () => { expect(typeof batch.dominantTokenBudget).toBe("number"); });
    it("has results array", () => { expect(batch.results).toHaveLength(1); });
  });

  describe("aggregation", () => {
    it("calculates totalPackages", () => {
      const batch = batchContract.batch([makeResult(fullPackage), makeResult(richPackage)]);
      expect(batch.totalPackages).toBe(2);
    });

    it("calculates totalSegments", () => {
      // fullPackage: 2 segs, richPackage: 4 segs
      const batch = batchContract.batch([makeResult(fullPackage), makeResult(richPackage)]);
      expect(batch.totalSegments).toBe(fullPackage.totalSegments + richPackage.totalSegments);
    });

    it("calculates totalTokens", () => {
      const batch = batchContract.batch([makeResult(fullPackage), makeResult(richPackage)]);
      expect(batch.totalTokens).toBe(fullPackage.estimatedTokens + richPackage.estimatedTokens);
    });

    it("handles empty batch", () => {
      const batch = batchContract.batch([]);
      expect(batch.totalPackages).toBe(0);
      expect(batch.totalSegments).toBe(0);
      expect(batch.totalTokens).toBe(0);
      expect(batch.dominantTokenBudget).toBe(0);
    });
  });

  describe("deterministic hashing", () => {
    it("batchHash is deterministic", () => {
      const results = [makeResult(fullPackage)];
      expect(batchContract.batch(results).batchHash).toBe(batchContract.batch(results).batchHash);
    });

    it("batchId is deterministic", () => {
      const results = [makeResult(fullPackage)];
      expect(batchContract.batch(results).batchId).toBe(batchContract.batch(results).batchId);
    });
  });
});
