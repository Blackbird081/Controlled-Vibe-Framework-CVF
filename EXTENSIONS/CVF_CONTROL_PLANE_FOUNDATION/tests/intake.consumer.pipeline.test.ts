import { describe, it, expect } from "vitest";
import {
  IntakeConsumerPipelineContract,
  createIntakeConsumerPipelineContract,
} from "../src/intake.consumer.pipeline.contract";
import {
  IntakeConsumerPipelineBatchContract,
  createIntakeConsumerPipelineBatchContract,
} from "../src/intake.consumer.pipeline.batch.contract";
import type { ControlPlaneIntakeResult } from "../src/intake.contract";
import type { ValidatedIntent } from "../../CVF_ECO_v1.0_INTENT_VALIDATION/src/types";

const FIXED_NOW = "2026-03-27T10:00:00.000Z";

// Helper: create test intake result
function makeIntakeResult(options: {
  domain?: string;
  chunkCount?: number;
  totalTokens?: number;
  valid?: boolean;
  requestId?: string;
} = {}): ControlPlaneIntakeResult {
  const {
    domain = "test-domain",
    chunkCount = 3,
    totalTokens = 150,
    valid = true,
    requestId = "request-123",
  } = options;

  const intent: ValidatedIntent = {
    valid,
    intent: {
      domain,
      action: "test-action",
      object: "test-object",
      rawVibe: "test vibe",
    },
    rules: [],
    constraints: [],
    errors: valid ? [] : ["Invalid intent"],
  };

  return {
    requestId,
    createdAt: FIXED_NOW,
    consumerId: "consumer-789",
    intent,
    retrieval: {
      query: "test query",
      chunkCount,
      totalCandidates: 10,
      retrievalTimeMs: 50,
      tiersSearched: ["tier1"],
      chunks: Array.from({ length: chunkCount }, (_, i) => ({
        id: `chunk-${i}`,
        source: `source-${i}`,
        content: `content-${i}`,
        relevanceScore: 0.8,
      })),
    },
    packagedContext: {
      chunks: Array.from({ length: chunkCount }, (_, i) => ({
        id: `chunk-${i}`,
        source: `source-${i}`,
        content: `content-${i}`,
        relevanceScore: 0.8,
      })),
      totalTokens,
      tokenBudget: 256,
      truncated: false,
      snapshotHash: "snapshot-hash-123",
    },
    warnings: [],
  };
}

const validIntake = makeIntakeResult({ domain: "test-domain" });
const unknownDomainIntake = makeIntakeResult({ domain: "unknown" });
const generalDomainIntake = makeIntakeResult({ domain: "general" });
const noChunksIntake = makeIntakeResult({ chunkCount: 0 });
const invalidIntentIntake = makeIntakeResult({ valid: false });

describe("IntakeConsumerPipelineContract", () => {
  const contract = new IntakeConsumerPipelineContract({ now: () => FIXED_NOW });

  describe("instantiation", () => {
    it("instantiates without dependencies", () => {
      expect(() => new IntakeConsumerPipelineContract()).not.toThrow();
    });

    it("factory returns a working instance", () => {
      const c = createIntakeConsumerPipelineContract();
      expect(c.execute({ intakeResult: validIntake })).toBeDefined();
    });
  });

  describe("output shape", () => {
    const result = contract.execute({ intakeResult: validIntake });

    it("has resultId", () => {
      expect(typeof result.resultId).toBe("string");
      expect(result.resultId.length).toBeGreaterThan(0);
    });

    it("has createdAt equal to now()", () => {
      expect(result.createdAt).toBe(FIXED_NOW);
    });

    it("has intakeResult", () => {
      expect(result.intakeResult).toBeDefined();
      expect(result.intakeResult).toBe(validIntake);
    });

    it("has consumerPackage", () => {
      expect(result.consumerPackage).toBeDefined();
      expect(typeof result.consumerPackage.pipelineHash).toBe("string");
    });

    it("has query", () => {
      expect(typeof result.query).toBe("string");
      expect(result.query).toContain("Intake:");
    });

    it("has contextId", () => {
      expect(typeof result.contextId).toBe("string");
      expect(result.contextId).toBe(validIntake.requestId);
    });

    it("has warnings array", () => {
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    it("has pipelineHash", () => {
      expect(typeof result.pipelineHash).toBe("string");
      expect(result.pipelineHash.length).toBeGreaterThan(0);
    });

    it("resultId is distinct from pipelineHash", () => {
      expect(result.resultId).not.toBe(result.pipelineHash);
    });
  });

  describe("consumerId propagation", () => {
    it("propagates consumerId when provided", () => {
      const result = contract.execute({ intakeResult: validIntake, consumerId: "consumer-xyz" });
      expect(result.consumerId).toBe("consumer-xyz");
    });

    it("consumerId is undefined when not provided", () => {
      const result = contract.execute({ intakeResult: validIntake });
      expect(result.consumerId).toBeUndefined();
    });
  });

  describe("query derivation", () => {
    it("derives query with valid intake", () => {
      const result = contract.execute({ intakeResult: validIntake });
      expect(result.query).toBe("Intake: domain=test-domain, chunks=3, tokens=150");
    });

    it("derives query with unknown domain", () => {
      const result = contract.execute({ intakeResult: unknownDomainIntake });
      expect(result.query).toBe("Intake: domain=unknown, chunks=3, tokens=150");
    });

    it("derives query with no chunks", () => {
      const result = contract.execute({ intakeResult: noChunksIntake });
      expect(result.query).toBe("Intake: domain=test-domain, chunks=0, tokens=150");
    });

    it("derives query with different token count", () => {
      const intake = makeIntakeResult({ totalTokens: 500 });
      const result = contract.execute({ intakeResult: intake });
      expect(result.query).toContain("tokens=500");
    });
  });

  describe("contextId extraction", () => {
    it("extracts contextId from requestId", () => {
      const intake = makeIntakeResult({ requestId: "request-xyz-789" });
      const result = contract.execute({ intakeResult: intake });
      expect(result.contextId).toBe("request-xyz-789");
    });
  });

  describe("warnings", () => {
    it("emits WARNING_NO_DOMAIN when domain is unknown", () => {
      const result = contract.execute({ intakeResult: unknownDomainIntake });
      expect(result.warnings).toContain("WARNING_NO_DOMAIN");
    });

    it("emits WARNING_NO_DOMAIN when domain is general", () => {
      const result = contract.execute({ intakeResult: generalDomainIntake });
      expect(result.warnings).toContain("WARNING_NO_DOMAIN");
    });

    it("does not emit WARNING_NO_DOMAIN for valid domain", () => {
      const result = contract.execute({ intakeResult: validIntake });
      expect(result.warnings).not.toContain("WARNING_NO_DOMAIN");
    });

    it("emits WARNING_NO_CHUNKS when chunk count is 0", () => {
      const result = contract.execute({ intakeResult: noChunksIntake });
      expect(result.warnings).toContain("WARNING_NO_CHUNKS");
    });

    it("does not emit WARNING_NO_CHUNKS when chunks exist", () => {
      const result = contract.execute({ intakeResult: validIntake });
      expect(result.warnings).not.toContain("WARNING_NO_CHUNKS");
    });

    it("emits WARNING_INVALID_INTENT when intent is invalid", () => {
      const result = contract.execute({ intakeResult: invalidIntentIntake });
      expect(result.warnings).toContain("WARNING_INVALID_INTENT");
    });

    it("does not emit WARNING_INVALID_INTENT when intent is valid", () => {
      const result = contract.execute({ intakeResult: validIntake });
      expect(result.warnings).not.toContain("WARNING_INVALID_INTENT");
    });

    it("emits no warnings for normal intake", () => {
      const result = contract.execute({ intakeResult: validIntake });
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe("deterministic hashing", () => {
    it("pipelineHash is deterministic for same input", () => {
      const r1 = contract.execute({ intakeResult: validIntake });
      const r2 = contract.execute({ intakeResult: validIntake });
      expect(r1.pipelineHash).toBe(r2.pipelineHash);
    });

    it("resultId is deterministic for same input", () => {
      const r1 = contract.execute({ intakeResult: validIntake });
      const r2 = contract.execute({ intakeResult: validIntake });
      expect(r1.resultId).toBe(r2.resultId);
    });
  });
});

describe("IntakeConsumerPipelineBatchContract", () => {
  const pipelineContract = new IntakeConsumerPipelineContract({ now: () => FIXED_NOW });
  const batchContract = new IntakeConsumerPipelineBatchContract({ now: () => FIXED_NOW });

  function makeResult(domain: string, chunkCount = 3, totalTokens = 150) {
    const intake = makeIntakeResult({ domain, chunkCount, totalTokens });
    return pipelineContract.execute({ intakeResult: intake });
  }

  describe("instantiation", () => {
    it("instantiates without dependencies", () => {
      expect(() => new IntakeConsumerPipelineBatchContract()).not.toThrow();
    });

    it("factory returns a working instance", () => {
      const c = createIntakeConsumerPipelineBatchContract();
      expect(c.batch([])).toBeDefined();
    });
  });

  describe("output shape", () => {
    const results = [makeResult("test-domain")];
    const batch = batchContract.batch(results);

    it("has batchId", () => {
      expect(typeof batch.batchId).toBe("string");
      expect(batch.batchId.length).toBeGreaterThan(0);
    });

    it("has batchHash", () => {
      expect(typeof batch.batchHash).toBe("string");
      expect(batch.batchHash.length).toBeGreaterThan(0);
    });

    it("has createdAt", () => {
      expect(batch.createdAt).toBe(FIXED_NOW);
    });

    it("has totalIntakes", () => {
      expect(typeof batch.totalIntakes).toBe("number");
      expect(batch.totalIntakes).toBe(1);
    });

    it("has overallDominantDomain", () => {
      expect(typeof batch.overallDominantDomain).toBe("string");
    });

    it("has totalChunks", () => {
      expect(typeof batch.totalChunks).toBe("number");
    });

    it("has totalTokens", () => {
      expect(typeof batch.totalTokens).toBe("number");
    });

    it("has dominantTokenBudget", () => {
      expect(typeof batch.dominantTokenBudget).toBe("number");
    });

    it("has results array", () => {
      expect(Array.isArray(batch.results)).toBe(true);
      expect(batch.results).toHaveLength(1);
    });

    it("batchId differs from batchHash", () => {
      expect(batch.batchId).not.toBe(batch.batchHash);
    });
  });

  describe("aggregation", () => {
    it("calculates totalIntakes correctly", () => {
      const results = [makeResult("domain1"), makeResult("domain2"), makeResult("domain3")];
      const batch = batchContract.batch(results);
      expect(batch.totalIntakes).toBe(3);
    });

    it("calculates totalChunks correctly", () => {
      const results = [makeResult("domain1", 2), makeResult("domain2", 3), makeResult("domain3", 5)];
      const batch = batchContract.batch(results);
      expect(batch.totalChunks).toBe(10);
    });

    it("calculates totalTokens correctly", () => {
      const results = [makeResult("domain1", 3, 100), makeResult("domain2", 3, 200), makeResult("domain3", 3, 300)];
      const batch = batchContract.batch(results);
      expect(batch.totalTokens).toBe(600);
    });

    it("selects dominant domain based on frequency", () => {
      const results = [makeResult("domain1"), makeResult("domain1"), makeResult("domain2")];
      const batch = batchContract.batch(results);
      expect(batch.overallDominantDomain).toBe("domain1");
    });

    it("selects dominant domain based on frequency (different domain)", () => {
      const results = [makeResult("domain2"), makeResult("domain2"), makeResult("domain1")];
      const batch = batchContract.batch(results);
      expect(batch.overallDominantDomain).toBe("domain2");
    });

    it("calculates dominantTokenBudget as max", () => {
      const results = [makeResult("domain1"), makeResult("domain2"), makeResult("domain3")];
      const batch = batchContract.batch(results);
      expect(batch.dominantTokenBudget).toBeGreaterThan(0);
    });

    it("handles empty batch with dominantTokenBudget = 0", () => {
      const batch = batchContract.batch([]);
      expect(batch.totalIntakes).toBe(0);
      expect(batch.totalChunks).toBe(0);
      expect(batch.totalTokens).toBe(0);
      expect(batch.dominantTokenBudget).toBe(0);
      expect(batch.overallDominantDomain).toBe("unknown");
    });
  });

  describe("deterministic hashing", () => {
    it("batchHash is deterministic for same input", () => {
      const results = [makeResult("test-domain")];
      const b1 = batchContract.batch(results);
      const b2 = batchContract.batch(results);
      expect(b1.batchHash).toBe(b2.batchHash);
    });

    it("batchId is deterministic for same input", () => {
      const results = [makeResult("test-domain")];
      const b1 = batchContract.batch(results);
      const b2 = batchContract.batch(results);
      expect(b1.batchId).toBe(b2.batchId);
    });
  });
});
