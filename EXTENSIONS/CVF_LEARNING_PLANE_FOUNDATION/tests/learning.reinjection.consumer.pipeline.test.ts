import { describe, it, expect } from "vitest";
import {
  LearningReinjectionConsumerPipelineContract,
  createLearningReinjectionConsumerPipelineContract,
} from "../src/learning.reinjection.consumer.pipeline.contract";
import type { LearningReinjectionConsumerPipelineRequest } from "../src/learning.reinjection.consumer.pipeline.contract";
import type { GovernanceSignal, GovernanceSignalType } from "../src/governance.signal.contract";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FIXED_TS = "2026-03-27T12:00:00.000Z";

function fixedNow(ts = FIXED_TS): () => string {
  return () => ts;
}

function makeGovernanceSignal(signalType: GovernanceSignalType): GovernanceSignal {
  return {
    signalId: `signal-${signalType}`,
    sourceAssessmentId: "assessment-001",
    issuedAt: FIXED_TS,
    sourceOverallStatus: "FAILING",
    signalType,
    urgency: signalType === "ESCALATE" ? "CRITICAL" : signalType === "TRIGGER_REVIEW" ? "HIGH" : "LOW",
    recommendation: `Test rationale for ${signalType}`,
    signalHash: `hash-${signalType}`,
  };
}

function makeRequest(
  signalType: GovernanceSignalType,
  overrides: Partial<LearningReinjectionConsumerPipelineRequest> = {},
): LearningReinjectionConsumerPipelineRequest {
  return { signal: makeGovernanceSignal(signalType), ...overrides };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("LearningReinjectionConsumerPipelineContract", () => {

  // ── Instantiation ──────────────────────────────────────────────────────────

  describe("instantiation", () => {
    it("should instantiate with no dependencies", () => {
      const contract = new LearningReinjectionConsumerPipelineContract();
      expect(contract).toBeDefined();
    });

    it("should instantiate via factory function", () => {
      const contract = createLearningReinjectionConsumerPipelineContract({ now: fixedNow() });
      expect(contract).toBeDefined();
    });

    it("should instantiate with custom now function", () => {
      const contract = new LearningReinjectionConsumerPipelineContract({ now: fixedNow() });
      const result = contract.execute(makeRequest("ESCALATE"));
      expect(result.createdAt).toBe(FIXED_TS);
    });
  });

  // ── Output shape ───────────────────────────────────────────────────────────

  describe("output shape", () => {
    it("should return a defined result", () => {
      const contract = createLearningReinjectionConsumerPipelineContract({ now: fixedNow() });
      const result = contract.execute(makeRequest("ESCALATE"));
      expect(result).toBeDefined();
    });

    it("should have a non-empty resultId", () => {
      const contract = createLearningReinjectionConsumerPipelineContract({ now: fixedNow() });
      const result = contract.execute(makeRequest("ESCALATE"));
      expect(result.resultId).toBeTruthy();
    });

    it("should have createdAt matching the fixed timestamp", () => {
      const contract = createLearningReinjectionConsumerPipelineContract({ now: fixedNow() });
      const result = contract.execute(makeRequest("ESCALATE"));
      expect(result.createdAt).toBe(FIXED_TS);
    });

    it("should have a reinjectionResult", () => {
      const contract = createLearningReinjectionConsumerPipelineContract({ now: fixedNow() });
      const result = contract.execute(makeRequest("ESCALATE"));
      expect(result.reinjectionResult).toBeDefined();
    });

    it("should have a consumerPackage", () => {
      const contract = createLearningReinjectionConsumerPipelineContract({ now: fixedNow() });
      const result = contract.execute(makeRequest("ESCALATE"));
      expect(result.consumerPackage).toBeDefined();
    });

    it("should have a non-empty pipelineHash", () => {
      const contract = createLearningReinjectionConsumerPipelineContract({ now: fixedNow() });
      const result = contract.execute(makeRequest("ESCALATE"));
      expect(result.pipelineHash).toBeTruthy();
    });

    it("should have a warnings array", () => {
      const contract = createLearningReinjectionConsumerPipelineContract({ now: fixedNow() });
      const result = contract.execute(makeRequest("ESCALATE"));
      expect(Array.isArray(result.warnings)).toBe(true);
    });
  });

  // ── consumerId propagation ─────────────────────────────────────────────────

  describe("consumerId propagation", () => {
    it("should propagate consumerId when provided", () => {
      const contract = createLearningReinjectionConsumerPipelineContract({ now: fixedNow() });
      const result = contract.execute(makeRequest("ESCALATE", { consumerId: "consumer-abc" }));
      expect(result.consumerId).toBe("consumer-abc");
    });

    it("should have undefined consumerId when not provided", () => {
      const contract = createLearningReinjectionConsumerPipelineContract({ now: fixedNow() });
      const result = contract.execute(makeRequest("ESCALATE"));
      expect(result.consumerId).toBeUndefined();
    });

    it("should propagate empty string consumerId", () => {
      const contract = createLearningReinjectionConsumerPipelineContract({ now: fixedNow() });
      const result = contract.execute(makeRequest("ESCALATE", { consumerId: "" }));
      expect(result.consumerId).toBe("");
    });
  });

  // ── Deterministic hashing ──────────────────────────────────────────────────

  describe("deterministic hashing", () => {
    it("should produce the same resultId for identical inputs", () => {
      const contract = createLearningReinjectionConsumerPipelineContract({ now: fixedNow() });
      const r1 = contract.execute(makeRequest("ESCALATE"));
      const r2 = contract.execute(makeRequest("ESCALATE"));
      expect(r1.resultId).toBe(r2.resultId);
    });

    it("should produce different resultId for different signal types", () => {
      const contract = createLearningReinjectionConsumerPipelineContract({ now: fixedNow() });
      const r1 = contract.execute(makeRequest("ESCALATE"));
      const r2 = contract.execute(makeRequest("MONITOR"));
      expect(r1.resultId).not.toBe(r2.resultId);
    });

    it("pipelineHash should differ from resultId", () => {
      const contract = createLearningReinjectionConsumerPipelineContract({ now: fixedNow() });
      const result = contract.execute(makeRequest("ESCALATE"));
      expect(result.pipelineHash).not.toBe(result.resultId);
    });

    it("should produce the same pipelineHash for identical inputs", () => {
      const contract = createLearningReinjectionConsumerPipelineContract({ now: fixedNow() });
      const r1 = contract.execute(makeRequest("ESCALATE"));
      const r2 = contract.execute(makeRequest("ESCALATE"));
      expect(r1.pipelineHash).toBe(r2.pipelineHash);
    });
  });

  // ── Query derivation ───────────────────────────────────────────────────────

  describe("query derivation", () => {
    it("should derive query from ESCALATE signal", () => {
      const contract = createLearningReinjectionConsumerPipelineContract({ now: fixedNow() });
      const result = contract.execute(makeRequest("ESCALATE"));
      expect(result.consumerPackage.query).toBe("Reinjection: ESCALATE → REJECT");
    });

    it("should derive query from TRIGGER_REVIEW signal", () => {
      const contract = createLearningReinjectionConsumerPipelineContract({ now: fixedNow() });
      const result = contract.execute(makeRequest("TRIGGER_REVIEW"));
      expect(result.consumerPackage.query).toBe("Reinjection: TRIGGER_REVIEW → ESCALATE");
    });

    it("should derive query from MONITOR signal", () => {
      const contract = createLearningReinjectionConsumerPipelineContract({ now: fixedNow() });
      const result = contract.execute(makeRequest("MONITOR"));
      expect(result.consumerPackage.query).toBe("Reinjection: MONITOR → RETRY");
    });

    it("should derive query from NO_ACTION signal", () => {
      const contract = createLearningReinjectionConsumerPipelineContract({ now: fixedNow() });
      const result = contract.execute(makeRequest("NO_ACTION"));
      expect(result.consumerPackage.query).toBe("Reinjection: NO_ACTION → ACCEPT");
    });
  });

  // ── Warning messages ───────────────────────────────────────────────────────

  describe("warning messages", () => {
    it("should add REJECT warning for ESCALATE signal", () => {
      const contract = createLearningReinjectionConsumerPipelineContract({ now: fixedNow() });
      const result = contract.execute(makeRequest("ESCALATE"));
      expect(result.warnings).toContain(
        "[learning-reinjection] REJECT feedback class — critical signal requires immediate attention",
      );
    });

    it("should add ESCALATE warning for TRIGGER_REVIEW signal", () => {
      const contract = createLearningReinjectionConsumerPipelineContract({ now: fixedNow() });
      const result = contract.execute(makeRequest("TRIGGER_REVIEW"));
      expect(result.warnings).toContain(
        "[learning-reinjection] ESCALATE feedback class — signal requires escalation review",
      );
    });

    it("should produce no warnings for MONITOR signal", () => {
      const contract = createLearningReinjectionConsumerPipelineContract({ now: fixedNow() });
      const result = contract.execute(makeRequest("MONITOR"));
      expect(result.warnings).toHaveLength(0);
    });

    it("should produce no warnings for NO_ACTION signal", () => {
      const contract = createLearningReinjectionConsumerPipelineContract({ now: fixedNow() });
      const result = contract.execute(makeRequest("NO_ACTION"));
      expect(result.warnings).toHaveLength(0);
    });
  });

  // ── reinjectionResult propagation ──────────────────────────────────────────

  describe("reinjectionResult propagation", () => {
    it("should have reinjectionId", () => {
      const contract = createLearningReinjectionConsumerPipelineContract({ now: fixedNow() });
      const result = contract.execute(makeRequest("ESCALATE"));
      expect(result.reinjectionResult.reinjectionId).toBeTruthy();
    });

    it("should have sourceSignalType matching input", () => {
      const contract = createLearningReinjectionConsumerPipelineContract({ now: fixedNow() });
      const result = contract.execute(makeRequest("ESCALATE"));
      expect(result.reinjectionResult.sourceSignalType).toBe("ESCALATE");
    });

    it("should map ESCALATE to REJECT feedback", () => {
      const contract = createLearningReinjectionConsumerPipelineContract({ now: fixedNow() });
      const result = contract.execute(makeRequest("ESCALATE"));
      expect(result.reinjectionResult.feedbackInput.feedbackClass).toBe("REJECT");
    });

    it("should map TRIGGER_REVIEW to ESCALATE feedback", () => {
      const contract = createLearningReinjectionConsumerPipelineContract({ now: fixedNow() });
      const result = contract.execute(makeRequest("TRIGGER_REVIEW"));
      expect(result.reinjectionResult.feedbackInput.feedbackClass).toBe("ESCALATE");
    });

    it("should map MONITOR to RETRY feedback", () => {
      const contract = createLearningReinjectionConsumerPipelineContract({ now: fixedNow() });
      const result = contract.execute(makeRequest("MONITOR"));
      expect(result.reinjectionResult.feedbackInput.feedbackClass).toBe("RETRY");
    });

    it("should map NO_ACTION to ACCEPT feedback", () => {
      const contract = createLearningReinjectionConsumerPipelineContract({ now: fixedNow() });
      const result = contract.execute(makeRequest("NO_ACTION"));
      expect(result.reinjectionResult.feedbackInput.feedbackClass).toBe("ACCEPT");
    });
  });

  // ── consumerPackage shape ──────────────────────────────────────────────────

  describe("consumerPackage shape", () => {
    it("should have a packageId", () => {
      const contract = createLearningReinjectionConsumerPipelineContract({ now: fixedNow() });
      const result = contract.execute(makeRequest("ESCALATE"));
      expect(result.consumerPackage.packageId).toBeTruthy();
    });

    it("should have contextId set to reinjectionResult.reinjectionId", () => {
      const contract = createLearningReinjectionConsumerPipelineContract({ now: fixedNow() });
      const result = contract.execute(makeRequest("ESCALATE"));
      expect(result.consumerPackage.contextId).toBe(result.reinjectionResult.reinjectionId);
    });

    it("should have a non-empty pipelineHash in the consumerPackage", () => {
      const contract = createLearningReinjectionConsumerPipelineContract({ now: fixedNow() });
      const result = contract.execute(makeRequest("ESCALATE"));
      expect(result.consumerPackage.pipelineHash).toBeTruthy();
    });

    it("should have a query derived from signal type and feedback class", () => {
      const contract = createLearningReinjectionConsumerPipelineContract({ now: fixedNow() });
      const result = contract.execute(makeRequest("ESCALATE"));
      expect(result.consumerPackage.query).toContain("Reinjection:");
      expect(result.consumerPackage.query).toContain("ESCALATE");
      expect(result.consumerPackage.query).toContain("REJECT");
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// BATCH CONTRACT TESTS (W4-T15 CP2)
// ═══════════════════════════════════════════════════════════════════════════════

import {
  LearningReinjectionConsumerPipelineBatchContract,
  createLearningReinjectionConsumerPipelineBatchContract,
} from "../src/learning.reinjection.consumer.pipeline.batch.contract";

describe("LearningReinjectionConsumerPipelineBatchContract", () => {

  // ── Instantiation ──────────────────────────────────────────────────────────

  describe("instantiation", () => {
    it("should instantiate with no dependencies", () => {
      const contract = new LearningReinjectionConsumerPipelineBatchContract();
      expect(contract).toBeDefined();
    });

    it("should instantiate via factory function", () => {
      const contract = createLearningReinjectionConsumerPipelineBatchContract({ now: fixedNow() });
      expect(contract).toBeDefined();
    });

    it("should instantiate with custom now function", () => {
      const contract = new LearningReinjectionConsumerPipelineBatchContract({ now: fixedNow() });
      const pipelineContract = createLearningReinjectionConsumerPipelineContract({ now: fixedNow() });
      const result = pipelineContract.execute(makeRequest("ESCALATE"));
      const batchResult = contract.execute([result]);
      expect(batchResult.createdAt).toBe(FIXED_TS);
    });
  });

  // ── Output shape ───────────────────────────────────────────────────────────

  describe("output shape", () => {
    it("should return a defined result", () => {
      const contract = createLearningReinjectionConsumerPipelineBatchContract({ now: fixedNow() });
      const result = contract.execute([]);
      expect(result).toBeDefined();
    });

    it("should have a non-empty batchId", () => {
      const contract = createLearningReinjectionConsumerPipelineBatchContract({ now: fixedNow() });
      const result = contract.execute([]);
      expect(result.batchId).toBeTruthy();
    });

    it("should have createdAt matching the fixed timestamp", () => {
      const contract = createLearningReinjectionConsumerPipelineBatchContract({ now: fixedNow() });
      const result = contract.execute([]);
      expect(result.createdAt).toBe(FIXED_TS);
    });

    it("should have a non-empty batchHash", () => {
      const contract = createLearningReinjectionConsumerPipelineBatchContract({ now: fixedNow() });
      const result = contract.execute([]);
      expect(result.batchHash).toBeTruthy();
    });

    it("batchHash should differ from batchId", () => {
      const contract = createLearningReinjectionConsumerPipelineBatchContract({ now: fixedNow() });
      const result = contract.execute([]);
      expect(result.batchHash).not.toBe(result.batchId);
    });
  });

  // ── Empty batch ────────────────────────────────────────────────────────────

  describe("empty batch", () => {
    it("should handle empty batch", () => {
      const contract = createLearningReinjectionConsumerPipelineBatchContract({ now: fixedNow() });
      const result = contract.execute([]);
      expect(result.totalResults).toBe(0);
    });

    it("should have dominantTokenBudget of 0 for empty batch", () => {
      const contract = createLearningReinjectionConsumerPipelineBatchContract({ now: fixedNow() });
      const result = contract.execute([]);
      expect(result.dominantTokenBudget).toBe(0);
    });

    it("should have all counts at 0 for empty batch", () => {
      const contract = createLearningReinjectionConsumerPipelineBatchContract({ now: fixedNow() });
      const result = contract.execute([]);
      expect(result.rejectCount).toBe(0);
      expect(result.escalateCount).toBe(0);
      expect(result.retryCount).toBe(0);
      expect(result.acceptCount).toBe(0);
    });

    it("should produce valid hash for empty batch", () => {
      const contract = createLearningReinjectionConsumerPipelineBatchContract({ now: fixedNow() });
      const result = contract.execute([]);
      expect(result.batchHash).toBeTruthy();
    });
  });

  // ── Single result ──────────────────────────────────────────────────────────

  describe("single result", () => {
    it("should handle single result", () => {
      const pipelineContract = createLearningReinjectionConsumerPipelineContract({ now: fixedNow() });
      const pipelineResult = pipelineContract.execute(makeRequest("ESCALATE"));
      const batchContract = createLearningReinjectionConsumerPipelineBatchContract({ now: fixedNow() });
      const batchResult = batchContract.execute([pipelineResult]);
      expect(batchResult.totalResults).toBe(1);
    });

    it("should have dominantTokenBudget from single result", () => {
      const pipelineContract = createLearningReinjectionConsumerPipelineContract({ now: fixedNow() });
      const pipelineResult = pipelineContract.execute(makeRequest("ESCALATE"));
      const batchContract = createLearningReinjectionConsumerPipelineBatchContract({ now: fixedNow() });
      const batchResult = batchContract.execute([pipelineResult]);
      expect(batchResult.dominantTokenBudget).toBe(pipelineResult.consumerPackage.typedContextPackage.estimatedTokens);
    });

    it("should count REJECT feedback from ESCALATE signal", () => {
      const pipelineContract = createLearningReinjectionConsumerPipelineContract({ now: fixedNow() });
      const pipelineResult = pipelineContract.execute(makeRequest("ESCALATE"));
      const batchContract = createLearningReinjectionConsumerPipelineBatchContract({ now: fixedNow() });
      const batchResult = batchContract.execute([pipelineResult]);
      expect(batchResult.rejectCount).toBe(1);
    });
  });

  // ── Multiple results ───────────────────────────────────────────────────────

  describe("multiple results", () => {
    it("should handle multiple results", () => {
      const pipelineContract = createLearningReinjectionConsumerPipelineContract({ now: fixedNow() });
      const r1 = pipelineContract.execute(makeRequest("ESCALATE"));
      const r2 = pipelineContract.execute(makeRequest("MONITOR"));
      const batchContract = createLearningReinjectionConsumerPipelineBatchContract({ now: fixedNow() });
      const batchResult = batchContract.execute([r1, r2]);
      expect(batchResult.totalResults).toBe(2);
    });

    it("should compute dominantTokenBudget as max across results", () => {
      const pipelineContract = createLearningReinjectionConsumerPipelineContract({ now: fixedNow() });
      const r1 = pipelineContract.execute(makeRequest("ESCALATE"));
      const r2 = pipelineContract.execute(makeRequest("MONITOR"));
      const batchContract = createLearningReinjectionConsumerPipelineBatchContract({ now: fixedNow() });
      const batchResult = batchContract.execute([r1, r2]);
      const expectedMax = Math.max(
        r1.consumerPackage.typedContextPackage.estimatedTokens,
        r2.consumerPackage.typedContextPackage.estimatedTokens,
      );
      expect(batchResult.dominantTokenBudget).toBe(expectedMax);
    });

    it("should count REJECT feedback correctly", () => {
      const pipelineContract = createLearningReinjectionConsumerPipelineContract({ now: fixedNow() });
      const r1 = pipelineContract.execute(makeRequest("ESCALATE"));
      const r2 = pipelineContract.execute(makeRequest("ESCALATE"));
      const batchContract = createLearningReinjectionConsumerPipelineBatchContract({ now: fixedNow() });
      const batchResult = batchContract.execute([r1, r2]);
      expect(batchResult.rejectCount).toBe(2);
    });

    it("should count ESCALATE feedback correctly", () => {
      const pipelineContract = createLearningReinjectionConsumerPipelineContract({ now: fixedNow() });
      const r1 = pipelineContract.execute(makeRequest("TRIGGER_REVIEW"));
      const r2 = pipelineContract.execute(makeRequest("TRIGGER_REVIEW"));
      const batchContract = createLearningReinjectionConsumerPipelineBatchContract({ now: fixedNow() });
      const batchResult = batchContract.execute([r1, r2]);
      expect(batchResult.escalateCount).toBe(2);
    });

    it("should count RETRY feedback correctly", () => {
      const pipelineContract = createLearningReinjectionConsumerPipelineContract({ now: fixedNow() });
      const r1 = pipelineContract.execute(makeRequest("MONITOR"));
      const r2 = pipelineContract.execute(makeRequest("MONITOR"));
      const batchContract = createLearningReinjectionConsumerPipelineBatchContract({ now: fixedNow() });
      const batchResult = batchContract.execute([r1, r2]);
      expect(batchResult.retryCount).toBe(2);
    });

    it("should count ACCEPT feedback correctly", () => {
      const pipelineContract = createLearningReinjectionConsumerPipelineContract({ now: fixedNow() });
      const r1 = pipelineContract.execute(makeRequest("NO_ACTION"));
      const r2 = pipelineContract.execute(makeRequest("NO_ACTION"));
      const batchContract = createLearningReinjectionConsumerPipelineBatchContract({ now: fixedNow() });
      const batchResult = batchContract.execute([r1, r2]);
      expect(batchResult.acceptCount).toBe(2);
    });
  });

  // ── Deterministic hashing ──────────────────────────────────────────────────

  describe("deterministic hashing", () => {
    it("should produce the same batchId for identical inputs", () => {
      const pipelineContract = createLearningReinjectionConsumerPipelineContract({ now: fixedNow() });
      const r1 = pipelineContract.execute(makeRequest("ESCALATE"));
      const batchContract = createLearningReinjectionConsumerPipelineBatchContract({ now: fixedNow() });
      const b1 = batchContract.execute([r1]);
      const b2 = batchContract.execute([r1]);
      expect(b1.batchId).toBe(b2.batchId);
    });

    it("should produce different batchId for different inputs", () => {
      const pipelineContract = createLearningReinjectionConsumerPipelineContract({ now: fixedNow() });
      const r1 = pipelineContract.execute(makeRequest("ESCALATE"));
      const r2 = pipelineContract.execute(makeRequest("MONITOR"));
      const batchContract = createLearningReinjectionConsumerPipelineBatchContract({ now: fixedNow() });
      const b1 = batchContract.execute([r1]);
      const b2 = batchContract.execute([r2]);
      expect(b1.batchId).not.toBe(b2.batchId);
    });

    it("should produce the same batchHash for identical inputs", () => {
      const pipelineContract = createLearningReinjectionConsumerPipelineContract({ now: fixedNow() });
      const r1 = pipelineContract.execute(makeRequest("ESCALATE"));
      const batchContract = createLearningReinjectionConsumerPipelineBatchContract({ now: fixedNow() });
      const b1 = batchContract.execute([r1]);
      const b2 = batchContract.execute([r1]);
      expect(b1.batchHash).toBe(b2.batchHash);
    });
  });

  // ── Mixed feedback classes ─────────────────────────────────────────────────

  describe("mixed feedback classes", () => {
    it("should aggregate mixed feedback classes correctly", () => {
      const pipelineContract = createLearningReinjectionConsumerPipelineContract({ now: fixedNow() });
      const r1 = pipelineContract.execute(makeRequest("ESCALATE"));
      const r2 = pipelineContract.execute(makeRequest("TRIGGER_REVIEW"));
      const r3 = pipelineContract.execute(makeRequest("MONITOR"));
      const r4 = pipelineContract.execute(makeRequest("NO_ACTION"));
      const batchContract = createLearningReinjectionConsumerPipelineBatchContract({ now: fixedNow() });
      const batchResult = batchContract.execute([r1, r2, r3, r4]);
      expect(batchResult.rejectCount).toBe(1);
      expect(batchResult.escalateCount).toBe(1);
      expect(batchResult.retryCount).toBe(1);
      expect(batchResult.acceptCount).toBe(1);
    });

    it("should handle multiple of each feedback class", () => {
      const pipelineContract = createLearningReinjectionConsumerPipelineContract({ now: fixedNow() });
      const r1 = pipelineContract.execute(makeRequest("ESCALATE"));
      const r2 = pipelineContract.execute(makeRequest("ESCALATE"));
      const r3 = pipelineContract.execute(makeRequest("MONITOR"));
      const batchContract = createLearningReinjectionConsumerPipelineBatchContract({ now: fixedNow() });
      const batchResult = batchContract.execute([r1, r2, r3]);
      expect(batchResult.rejectCount).toBe(2);
      expect(batchResult.retryCount).toBe(1);
    });
  });
});
