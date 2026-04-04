import { describe, it, expect } from "vitest";
import {
  ContextEnrichmentConsumerPipelineContract,
  createContextEnrichmentConsumerPipelineContract,
} from "../src/context.enrichment.consumer.pipeline.contract";
import {
  ContextEnrichmentConsumerPipelineBatchContract,
  createContextEnrichmentConsumerPipelineBatchContract,
} from "../src/context.enrichment.consumer.pipeline.batch.contract";
import type { ContextValidationResult } from "../src/context.enrichment.contract";

const FIXED_NOW = "2026-03-27T10:00:00.000Z";

// --- Helpers ---

function makeValid(packageId = "pkg-valid"): ContextValidationResult {
  return {
    packageId,
    status: "VALID",
    violations: [],
    checkedAt: FIXED_NOW,
  };
}

function makeInvalid(violations: { rule: string; detail: string }[], packageId = "pkg-invalid"): ContextValidationResult {
  return {
    packageId,
    status: "INVALID",
    violations,
    checkedAt: FIXED_NOW,
  };
}

const validResult = makeValid();
const singleViolation = makeInvalid([{ rule: "minSegments", detail: "Need at least 1 segment." }]);
const multiViolation = makeInvalid([
  { rule: "minSegments", detail: "Need at least 2 segments." },
  { rule: "maxTokens", detail: "Exceeds 500 tokens." },
  { rule: "requiredSegmentTypes", detail: "Missing KNOWLEDGE segment." },
]);

describe("ContextEnrichmentConsumerPipelineContract", () => {
  const contract = new ContextEnrichmentConsumerPipelineContract({ now: () => FIXED_NOW });

  describe("instantiation", () => {
    it("instantiates without dependencies", () => {
      expect(() => new ContextEnrichmentConsumerPipelineContract()).not.toThrow();
    });

    it("factory returns a working instance", () => {
      const c = createContextEnrichmentConsumerPipelineContract();
      expect(c.execute({ validationResult: validResult })).toBeDefined();
    });
  });

  describe("output shape", () => {
    const result = contract.execute({ validationResult: validResult });

    it("has resultId", () => {
      expect(typeof result.resultId).toBe("string");
      expect(result.resultId.length).toBeGreaterThan(0);
    });

    it("has createdAt equal to now()", () => {
      expect(result.createdAt).toBe(FIXED_NOW);
    });

    it("has validationResult reference", () => {
      expect(result.validationResult).toBe(validResult);
    });

    it("has consumerPackage", () => {
      expect(result.consumerPackage).toBeDefined();
    });

    it("has query containing ContextEnrichment:", () => {
      expect(result.query).toContain("ContextEnrichment:");
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
      const r = contract.execute({ validationResult: validResult, consumerId: "consumer-z" });
      expect(r.consumerId).toBe("consumer-z");
    });

    it("consumerId is undefined when not provided", () => {
      expect(contract.execute({ validationResult: validResult }).consumerId).toBeUndefined();
    });
  });

  describe("query derivation", () => {
    it("includes status in query", () => {
      expect(contract.execute({ validationResult: validResult }).query).toContain("status=VALID");
    });

    it("includes violation count in query", () => {
      expect(contract.execute({ validationResult: validResult }).query).toContain("violations=0");
    });

    it("includes packageId in query", () => {
      expect(contract.execute({ validationResult: validResult }).query).toContain("packageId=pkg-valid");
    });

    it("derives INVALID query correctly", () => {
      const r = contract.execute({ validationResult: singleViolation });
      expect(r.query).toContain("status=INVALID");
      expect(r.query).toContain("violations=1");
    });

    it("derives multi-violation query correctly", () => {
      const r = contract.execute({ validationResult: multiViolation });
      expect(r.query).toContain("violations=3");
    });
  });

  describe("contextId extraction", () => {
    it("contextId equals validationResult.packageId", () => {
      expect(contract.execute({ validationResult: validResult }).contextId).toBe("pkg-valid");
    });

    it("different results yield different contextIds", () => {
      const r1 = contract.execute({ validationResult: validResult });
      const r2 = contract.execute({ validationResult: singleViolation });
      expect(r1.contextId).not.toBe(r2.contextId);
    });
  });

  describe("warnings", () => {
    it("emits no warnings for VALID result with 0 violations", () => {
      expect(contract.execute({ validationResult: validResult }).warnings).toHaveLength(0);
    });

    it("emits WARNING_VALIDATION_INVALID for INVALID status", () => {
      const r = contract.execute({ validationResult: singleViolation });
      expect(r.warnings).toContain("WARNING_VALIDATION_INVALID");
    });

    it("emits WARNING_VIOLATIONS_PRESENT when violations exist", () => {
      const r = contract.execute({ validationResult: singleViolation });
      expect(r.warnings).toContain("WARNING_VIOLATIONS_PRESENT");
    });

    it("emits both warnings for INVALID with violations", () => {
      const r = contract.execute({ validationResult: singleViolation });
      expect(r.warnings).toHaveLength(2);
      expect(r.warnings[0]).toBe("WARNING_VALIDATION_INVALID");
      expect(r.warnings[1]).toBe("WARNING_VIOLATIONS_PRESENT");
    });

    it("emits both warnings for multi-violation result", () => {
      const r = contract.execute({ validationResult: multiViolation });
      expect(r.warnings).toHaveLength(2);
    });

    it("does not emit WARNING_VALIDATION_INVALID for VALID result", () => {
      expect(contract.execute({ validationResult: validResult }).warnings).not.toContain("WARNING_VALIDATION_INVALID");
    });

    it("does not emit WARNING_VIOLATIONS_PRESENT for empty violations", () => {
      expect(contract.execute({ validationResult: validResult }).warnings).not.toContain("WARNING_VIOLATIONS_PRESENT");
    });

    it("WARNING_VALIDATION_INVALID is first (severity order)", () => {
      const r = contract.execute({ validationResult: singleViolation });
      expect(r.warnings[0]).toBe("WARNING_VALIDATION_INVALID");
    });
  });

  describe("deterministic hashing", () => {
    it("pipelineHash is deterministic for same input", () => {
      const r1 = contract.execute({ validationResult: validResult });
      const r2 = contract.execute({ validationResult: validResult });
      expect(r1.pipelineHash).toBe(r2.pipelineHash);
    });

    it("resultId is deterministic for same input", () => {
      const r1 = contract.execute({ validationResult: validResult });
      const r2 = contract.execute({ validationResult: validResult });
      expect(r1.resultId).toBe(r2.resultId);
    });

    it("pipelineHash differs for different results", () => {
      const r1 = contract.execute({ validationResult: validResult });
      const r2 = contract.execute({ validationResult: singleViolation });
      expect(r1.pipelineHash).not.toBe(r2.pipelineHash);
    });
  });
});

describe("ContextEnrichmentConsumerPipelineBatchContract", () => {
  const pipelineContract = new ContextEnrichmentConsumerPipelineContract({ now: () => FIXED_NOW });
  const batchContract = new ContextEnrichmentConsumerPipelineBatchContract({ now: () => FIXED_NOW });

  function makeResult(vr: ContextValidationResult) {
    return pipelineContract.execute({ validationResult: vr });
  }

  describe("instantiation", () => {
    it("instantiates without dependencies", () => {
      expect(() => new ContextEnrichmentConsumerPipelineBatchContract()).not.toThrow();
    });

    it("factory returns a working instance", () => {
      const c = createContextEnrichmentConsumerPipelineBatchContract();
      expect(c.batch([])).toBeDefined();
    });
  });

  describe("output shape", () => {
    const batch = batchContract.batch([makeResult(validResult)]);
    it("has batchId", () => { expect(typeof batch.batchId).toBe("string"); });
    it("has batchHash", () => { expect(typeof batch.batchHash).toBe("string"); });
    it("batchId differs from batchHash", () => { expect(batch.batchId).not.toBe(batch.batchHash); });
    it("has createdAt", () => { expect(batch.createdAt).toBe(FIXED_NOW); });
    it("has totalValidations", () => { expect(typeof batch.totalValidations).toBe("number"); });
    it("has validCount", () => { expect(typeof batch.validCount).toBe("number"); });
    it("has invalidCount", () => { expect(typeof batch.invalidCount).toBe("number"); });
    it("has totalViolations", () => { expect(typeof batch.totalViolations).toBe("number"); });
    it("has dominantStatus", () => { expect(["VALID", "INVALID"]).toContain(batch.dominantStatus); });
  });

  describe("aggregation", () => {
    it("calculates totalValidations", () => {
      const b = batchContract.batch([makeResult(validResult), makeResult(singleViolation)]);
      expect(b.totalValidations).toBe(2);
    });

    it("calculates validCount", () => {
      const b = batchContract.batch([makeResult(validResult), makeResult(singleViolation)]);
      expect(b.validCount).toBe(1);
    });

    it("calculates invalidCount", () => {
      const b = batchContract.batch([makeResult(validResult), makeResult(singleViolation)]);
      expect(b.invalidCount).toBe(1);
    });

    it("calculates totalViolations", () => {
      const b = batchContract.batch([makeResult(singleViolation), makeResult(multiViolation)]);
      expect(b.totalViolations).toBe(4);
    });

    it("handles empty batch", () => {
      const b = batchContract.batch([]);
      expect(b.totalValidations).toBe(0);
      expect(b.validCount).toBe(0);
      expect(b.invalidCount).toBe(0);
      expect(b.totalViolations).toBe(0);
      expect(b.dominantStatus).toBe("VALID");
    });
  });

  describe("dominant status (severity-first)", () => {
    it("INVALID dominates even with 1 invalid vs many valid", () => {
      const b = batchContract.batch([
        makeResult(validResult),
        makeResult(validResult),
        makeResult(singleViolation),
      ]);
      expect(b.dominantStatus).toBe("INVALID");
    });

    it("VALID when all results are valid", () => {
      const b = batchContract.batch([makeResult(validResult), makeResult(validResult)]);
      expect(b.dominantStatus).toBe("VALID");
    });
  });

  describe("deterministic hashing", () => {
    it("batchHash is deterministic", () => {
      const results = [makeResult(validResult)];
      expect(batchContract.batch(results).batchHash).toBe(batchContract.batch(results).batchHash);
    });

    it("batchId is deterministic", () => {
      const results = [makeResult(validResult)];
      expect(batchContract.batch(results).batchId).toBe(batchContract.batch(results).batchId);
    });
  });
});
