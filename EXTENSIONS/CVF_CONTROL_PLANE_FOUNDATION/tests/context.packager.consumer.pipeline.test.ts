import { describe, it, expect } from "vitest";
import {
  ContextPackagerConsumerPipelineContract,
  createContextPackagerConsumerPipelineContract,
} from "../src/context.packager.consumer.pipeline.contract";
import {
  ContextPackagerConsumerPipelineBatchContract,
  createContextPackagerConsumerPipelineBatchContract,
} from "../src/context.packager.consumer.pipeline.batch.contract";
import type { TypedContextPackage } from "../src/context.packager.contract";

const FIXED_NOW = "2026-03-27T10:00:00.000Z";

// --- Helpers ---

function makePkg(options: {
  contextId?: string;
  totalSegments?: number;
  estimatedTokens?: number;
  knowledgeTokens?: number;
  packageHash?: string;
} = {}): TypedContextPackage {
  const {
    contextId = "ctx-001",
    totalSegments = 3,
    estimatedTokens = 120,
    knowledgeTokens = 60,
    packageHash = `hash-${contextId}`,
  } = options;
  const queryTokens = estimatedTokens === 0 ? 0 : 10;
  const systemTokens = Math.max(0, estimatedTokens - queryTokens - knowledgeTokens);
  return {
    packageId: `pkg-${contextId}`,
    builtAt: FIXED_NOW,
    contextId,
    query: "test query",
    segments: [],
    totalSegments,
    estimatedTokens,
    perTypeTokens: {
      QUERY: queryTokens,
      KNOWLEDGE: knowledgeTokens,
      CODE: 0,
      STRUCTURED: 0,
      METADATA: 0,
      SYSTEM: systemTokens,
    },
    packageHash,
  };
}

const richPkg = makePkg({ contextId: "ctx-rich", totalSegments: 3, estimatedTokens: 120, knowledgeTokens: 60 });
const emptyPkg = makePkg({ contextId: "ctx-empty", totalSegments: 0, estimatedTokens: 0, knowledgeTokens: 0, packageHash: "hash-empty" });
const noKnowledgePkg = makePkg({ contextId: "ctx-nok", totalSegments: 2, estimatedTokens: 80, knowledgeTokens: 0, packageHash: "hash-nok" });

describe("ContextPackagerConsumerPipelineContract", () => {
  const contract = new ContextPackagerConsumerPipelineContract({ now: () => FIXED_NOW });

  describe("instantiation", () => {
    it("instantiates without dependencies", () => {
      expect(() => new ContextPackagerConsumerPipelineContract()).not.toThrow();
    });

    it("factory returns working instance", () => {
      const c = createContextPackagerConsumerPipelineContract();
      expect(c.execute({ typedContextPackage: richPkg })).toBeDefined();
    });
  });

  describe("output shape", () => {
    const result = contract.execute({ typedContextPackage: richPkg });

    it("has resultId", () => { expect(typeof result.resultId).toBe("string"); expect(result.resultId.length).toBeGreaterThan(0); });
    it("has createdAt equal to now()", () => { expect(result.createdAt).toBe(FIXED_NOW); });
    it("has typedContextPackage reference", () => { expect(result.typedContextPackage).toBe(richPkg); });
    it("has consumerPackage", () => { expect(result.consumerPackage).toBeDefined(); });
    it("has query containing ContextPackager:", () => { expect(result.query).toContain("ContextPackager:"); });
    it("has contextId", () => { expect(typeof result.contextId).toBe("string"); });
    it("has distinctTypeCount as number", () => { expect(typeof result.distinctTypeCount).toBe("number"); });
    it("has warnings array", () => { expect(Array.isArray(result.warnings)).toBe(true); });
    it("consumerId is undefined when not provided", () => { expect(result.consumerId).toBeUndefined(); });
    it("has pipelineHash", () => { expect(typeof result.pipelineHash).toBe("string"); expect(result.pipelineHash.length).toBeGreaterThan(0); });
    it("resultId differs from pipelineHash", () => { expect(result.resultId).not.toBe(result.pipelineHash); });
  });

  describe("consumerId propagation", () => {
    it("propagates consumerId", () => {
      const r = contract.execute({ typedContextPackage: richPkg, consumerId: "consumer-q" });
      expect(r.consumerId).toBe("consumer-q");
    });
    it("consumerId undefined when not provided", () => {
      expect(contract.execute({ typedContextPackage: richPkg }).consumerId).toBeUndefined();
    });
  });

  describe("query derivation", () => {
    it("includes totalSegments in query", () => {
      expect(contract.execute({ typedContextPackage: richPkg }).query).toContain("segments=3");
    });
    it("includes estimatedTokens in query", () => {
      expect(contract.execute({ typedContextPackage: richPkg }).query).toContain("tokens=120");
    });
    it("includes distinctTypeCount in query", () => {
      const r = contract.execute({ typedContextPackage: richPkg });
      expect(r.query).toContain(`types=${r.distinctTypeCount}`);
    });
    it("empty pkg has segments=0 in query", () => {
      expect(contract.execute({ typedContextPackage: emptyPkg }).query).toContain("segments=0");
    });
  });

  describe("contextId extraction", () => {
    it("contextId equals typedContextPackage.contextId", () => {
      expect(contract.execute({ typedContextPackage: richPkg }).contextId).toBe("ctx-rich");
    });
    it("different packages yield different contextIds", () => {
      const r1 = contract.execute({ typedContextPackage: richPkg });
      const r2 = contract.execute({ typedContextPackage: emptyPkg });
      expect(r1.contextId).not.toBe(r2.contextId);
    });
  });

  describe("distinctTypeCount", () => {
    it("counts non-zero perTypeToken fields", () => {
      const r = contract.execute({ typedContextPackage: richPkg });
      // QUERY=10, KNOWLEDGE=60, SYSTEM=50 → 3 distinct types
      expect(r.distinctTypeCount).toBe(3);
    });
    it("is 0 for empty pkg with all-zero perTypeTokens", () => {
      const r = contract.execute({ typedContextPackage: emptyPkg });
      expect(r.distinctTypeCount).toBe(0);
    });
  });

  describe("warnings", () => {
    it("emits no warnings for rich pkg with knowledge tokens", () => {
      expect(contract.execute({ typedContextPackage: richPkg }).warnings).toHaveLength(0);
    });

    it("emits WARNING_NO_SEGMENTS when totalSegments === 0", () => {
      expect(contract.execute({ typedContextPackage: emptyPkg }).warnings).toContain("WARNING_NO_SEGMENTS");
    });
    it("emits WARNING_TOKEN_BUDGET_ZERO when estimatedTokens === 0", () => {
      expect(contract.execute({ typedContextPackage: emptyPkg }).warnings).toContain("WARNING_TOKEN_BUDGET_ZERO");
    });
    it("emits WARNING_NO_KNOWLEDGE_TOKENS when KNOWLEDGE === 0", () => {
      expect(contract.execute({ typedContextPackage: emptyPkg }).warnings).toContain("WARNING_NO_KNOWLEDGE_TOKENS");
    });
    it("emits all 3 warnings for empty pkg", () => {
      expect(contract.execute({ typedContextPackage: emptyPkg }).warnings).toHaveLength(3);
    });

    it("emits only WARNING_NO_KNOWLEDGE_TOKENS when segments>0 but no knowledge", () => {
      const r = contract.execute({ typedContextPackage: noKnowledgePkg });
      expect(r.warnings).toContain("WARNING_NO_KNOWLEDGE_TOKENS");
      expect(r.warnings).not.toContain("WARNING_NO_SEGMENTS");
      expect(r.warnings).not.toContain("WARNING_TOKEN_BUDGET_ZERO");
      expect(r.warnings).toHaveLength(1);
    });

    it("WARNING_NO_SEGMENTS comes before WARNING_TOKEN_BUDGET_ZERO", () => {
      const r = contract.execute({ typedContextPackage: emptyPkg });
      expect(r.warnings[0]).toBe("WARNING_NO_SEGMENTS");
      expect(r.warnings[1]).toBe("WARNING_TOKEN_BUDGET_ZERO");
    });
    it("WARNING_TOKEN_BUDGET_ZERO comes before WARNING_NO_KNOWLEDGE_TOKENS", () => {
      const r = contract.execute({ typedContextPackage: emptyPkg });
      expect(r.warnings[1]).toBe("WARNING_TOKEN_BUDGET_ZERO");
      expect(r.warnings[2]).toBe("WARNING_NO_KNOWLEDGE_TOKENS");
    });
  });

  describe("deterministic hashing", () => {
    it("pipelineHash is deterministic", () => {
      const r1 = contract.execute({ typedContextPackage: richPkg });
      const r2 = contract.execute({ typedContextPackage: richPkg });
      expect(r1.pipelineHash).toBe(r2.pipelineHash);
    });
    it("resultId is deterministic", () => {
      const r1 = contract.execute({ typedContextPackage: richPkg });
      const r2 = contract.execute({ typedContextPackage: richPkg });
      expect(r1.resultId).toBe(r2.resultId);
    });
    it("pipelineHash differs for different packages", () => {
      const r1 = contract.execute({ typedContextPackage: richPkg });
      const r2 = contract.execute({ typedContextPackage: emptyPkg });
      expect(r1.pipelineHash).not.toBe(r2.pipelineHash);
    });
  });
});

describe("ContextPackagerConsumerPipelineBatchContract", () => {
  const pipelineContract = new ContextPackagerConsumerPipelineContract({ now: () => FIXED_NOW });
  const batchContract = new ContextPackagerConsumerPipelineBatchContract({ now: () => FIXED_NOW });
  const makeResult = (pkg: TypedContextPackage) => pipelineContract.execute({ typedContextPackage: pkg });

  describe("instantiation", () => {
    it("instantiates without dependencies", () => {
      expect(() => new ContextPackagerConsumerPipelineBatchContract()).not.toThrow();
    });
    it("factory returns working instance", () => {
      expect(createContextPackagerConsumerPipelineBatchContract().batch([])).toBeDefined();
    });
  });

  describe("output shape", () => {
    const batch = batchContract.batch([makeResult(richPkg)]);
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
      expect(batchContract.batch([makeResult(richPkg), makeResult(emptyPkg)]).totalPackages).toBe(2);
    });
    it("calculates totalSegments", () => {
      const b = batchContract.batch([makeResult(richPkg), makeResult(noKnowledgePkg)]);
      expect(b.totalSegments).toBe(richPkg.totalSegments + noKnowledgePkg.totalSegments);
    });
    it("calculates totalTokens", () => {
      const b = batchContract.batch([makeResult(richPkg), makeResult(noKnowledgePkg)]);
      expect(b.totalTokens).toBe(richPkg.estimatedTokens + noKnowledgePkg.estimatedTokens);
    });
    it("dominantTokenBudget is the max estimatedTokens", () => {
      const b = batchContract.batch([makeResult(richPkg), makeResult(emptyPkg)]);
      expect(b.dominantTokenBudget).toBe(richPkg.estimatedTokens);
    });
    it("handles empty batch", () => {
      const b = batchContract.batch([]);
      expect(b.totalPackages).toBe(0);
      expect(b.totalSegments).toBe(0);
      expect(b.totalTokens).toBe(0);
      expect(b.dominantTokenBudget).toBe(0);
    });
  });

  describe("deterministic hashing", () => {
    it("batchHash is deterministic", () => {
      const results = [makeResult(richPkg)];
      expect(batchContract.batch(results).batchHash).toBe(batchContract.batch(results).batchHash);
    });
    it("batchId is deterministic", () => {
      const results = [makeResult(richPkg)];
      expect(batchContract.batch(results).batchId).toBe(batchContract.batch(results).batchId);
    });
  });
});
