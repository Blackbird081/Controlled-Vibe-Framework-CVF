import {
  GovernanceSignalConsumerPipelineContract,
  createGovernanceSignalConsumerPipelineContract,
} from "../src/governance.signal.consumer.pipeline.contract";
import type { ThresholdAssessment } from "../src/evaluation.threshold.contract";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-03-25T17:00:00.000Z";
const fixedNow = () => FIXED_NOW;

function buildAssessment(overrides: Partial<ThresholdAssessment> = {}): ThresholdAssessment {
  return {
    assessmentId: "test-assessment-id",
    assessedAt: FIXED_NOW,
    totalVerdicts: 5,
    passCount: 5,
    warnCount: 0,
    failCount: 0,
    inconclusiveCount: 0,
    overallStatus: "PASSING",
    summary: "Threshold assessment: PASSING — all 5 result(s) passed.",
    assessmentHash: "test-assessment-hash",
    ...overrides,
  };
}

// PASSING → NO_ACTION, urgency=LOW, no warnings
const passingAssessment = buildAssessment({
  assessmentId: "a-pass",
  overallStatus: "PASSING",
  totalVerdicts: 5,
  passCount: 5,
  warnCount: 0,
  failCount: 0,
  inconclusiveCount: 0,
  assessmentHash: "hash-pass",
});

// WARNING → TRIGGER_REVIEW, urgency=HIGH, warning fired
const warningAssessment = buildAssessment({
  assessmentId: "a-warn",
  overallStatus: "WARNING",
  totalVerdicts: 5,
  passCount: 3,
  warnCount: 2,
  failCount: 0,
  inconclusiveCount: 0,
  assessmentHash: "hash-warn",
});

// FAILING → ESCALATE, urgency=CRITICAL, warning fired
const failingAssessment = buildAssessment({
  assessmentId: "a-fail",
  overallStatus: "FAILING",
  totalVerdicts: 5,
  passCount: 2,
  warnCount: 0,
  failCount: 3,
  inconclusiveCount: 0,
  assessmentHash: "hash-fail",
});

// INSUFFICIENT_DATA → MONITOR, urgency=LOW, no warnings
const insufficientAssessment = buildAssessment({
  assessmentId: "a-insuf",
  overallStatus: "INSUFFICIENT_DATA",
  totalVerdicts: 5,
  passCount: 0,
  warnCount: 0,
  failCount: 0,
  inconclusiveCount: 5,
  assessmentHash: "hash-insuf",
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("GovernanceSignalConsumerPipelineContract", () => {
  const contract = new GovernanceSignalConsumerPipelineContract({ now: fixedNow });

  describe("instantiation", () => {
    it("instantiates without dependencies", () => {
      expect(() => new GovernanceSignalConsumerPipelineContract()).not.toThrow();
    });

    it("factory returns a working instance", () => {
      const c = createGovernanceSignalConsumerPipelineContract({ now: fixedNow });
      expect(c.execute({ assessment: passingAssessment })).toBeDefined();
    });
  });

  describe("output shape", () => {
    const result = contract.execute({ assessment: passingAssessment });

    it("has resultId", () => {
      expect(typeof result.resultId).toBe("string");
      expect(result.resultId.length).toBeGreaterThan(0);
    });

    it("has createdAt", () => {
      expect(result.createdAt).toBe(FIXED_NOW);
    });

    it("has signalResult", () => {
      expect(result.signalResult).toBeDefined();
    });

    it("has consumerPackage", () => {
      expect(result.consumerPackage).toBeDefined();
    });

    it("has pipelineHash", () => {
      expect(typeof result.pipelineHash).toBe("string");
      expect(result.pipelineHash.length).toBeGreaterThan(0);
    });

    it("has warnings array", () => {
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    it("has consumerId field (may be undefined)", () => {
      expect("consumerId" in result).toBe(true);
    });
  });

  describe("consumerId propagation", () => {
    it("propagates consumerId when provided", () => {
      const r = contract.execute({ assessment: passingAssessment, consumerId: "consumer-xyz" });
      expect(r.consumerId).toBe("consumer-xyz");
    });

    it("consumerId is undefined when not provided", () => {
      const r = contract.execute({ assessment: passingAssessment });
      expect(r.consumerId).toBeUndefined();
    });
  });

  describe("deterministic hashing", () => {
    it("pipelineHash is deterministic for same inputs", () => {
      const r1 = contract.execute({ assessment: passingAssessment });
      const r2 = contract.execute({ assessment: passingAssessment });
      expect(r1.pipelineHash).toBe(r2.pipelineHash);
    });

    it("resultId is deterministic for same inputs", () => {
      const r1 = contract.execute({ assessment: passingAssessment });
      const r2 = contract.execute({ assessment: passingAssessment });
      expect(r1.resultId).toBe(r2.resultId);
    });

    it("resultId differs from pipelineHash", () => {
      const r = contract.execute({ assessment: passingAssessment });
      expect(r.resultId).not.toBe(r.pipelineHash);
    });

    it("pipelineHash differs for different assessments", () => {
      const r1 = contract.execute({ assessment: passingAssessment });
      const r2 = contract.execute({ assessment: failingAssessment });
      expect(r1.pipelineHash).not.toBe(r2.pipelineHash);
    });
  });

  describe("query derivation", () => {
    it("query contains signalType for FAILING assessment (ESCALATE)", () => {
      const r = contract.execute({ assessment: failingAssessment });
      expect(r.consumerPackage.query).toContain("type:ESCALATE");
    });

    it("query contains urgency CRITICAL for FAILING assessment", () => {
      const r = contract.execute({ assessment: failingAssessment });
      expect(r.consumerPackage.query).toContain("urgency:CRITICAL");
    });

    it("query contains signalType TRIGGER_REVIEW for WARNING assessment", () => {
      const r = contract.execute({ assessment: warningAssessment });
      expect(r.consumerPackage.query).toContain("type:TRIGGER_REVIEW");
      expect(r.consumerPackage.query).toContain("urgency:HIGH");
    });

    it("query contains signalType NO_ACTION for PASSING assessment", () => {
      const r = contract.execute({ assessment: passingAssessment });
      expect(r.consumerPackage.query).toContain("type:NO_ACTION");
    });

    it("query contains signalType MONITOR for INSUFFICIENT_DATA assessment", () => {
      const r = contract.execute({ assessment: insufficientAssessment });
      expect(r.consumerPackage.query).toContain("type:MONITOR");
    });

    it("query contains sourceAssessmentId", () => {
      const r = contract.execute({ assessment: passingAssessment });
      expect(r.consumerPackage.query).toContain("assessment:a-pass");
    });

    it("query is capped at 120 characters", () => {
      const longAssessment = buildAssessment({ assessmentId: "a-" + "x".repeat(200) });
      const r = contract.execute({ assessment: longAssessment });
      expect(r.consumerPackage.query.length).toBeLessThanOrEqual(120);
    });

    it("contextId equals signalResult.signalId", () => {
      const r = contract.execute({ assessment: passingAssessment });
      expect(r.consumerPackage.contextId).toBe(r.signalResult.signalId);
    });
  });

  describe("warning messages", () => {
    it("ESCALATE signal fires escalation warning", () => {
      const r = contract.execute({ assessment: failingAssessment });
      expect(r.warnings).toContain(
        "[governance-signal] escalation required — governed intervention triggered",
      );
    });

    it("TRIGGER_REVIEW signal fires review warning", () => {
      const r = contract.execute({ assessment: warningAssessment });
      expect(r.warnings).toContain(
        "[governance-signal] review triggered — governance threshold breached",
      );
    });

    it("NO_ACTION produces no warnings", () => {
      const r = contract.execute({ assessment: passingAssessment });
      expect(r.warnings).toHaveLength(0);
    });

    it("MONITOR produces no warnings", () => {
      const r = contract.execute({ assessment: insufficientAssessment });
      expect(r.warnings).toHaveLength(0);
    });

    it("ESCALATE does not fire TRIGGER_REVIEW warning", () => {
      const r = contract.execute({ assessment: failingAssessment });
      expect(r.warnings).not.toContain(
        "[governance-signal] review triggered — governance threshold breached",
      );
    });
  });

  describe("signalResult propagation", () => {
    it("signalType = ESCALATE for FAILING assessment", () => {
      const r = contract.execute({ assessment: failingAssessment });
      expect(r.signalResult.signalType).toBe("ESCALATE");
    });

    it("signalType = TRIGGER_REVIEW for WARNING assessment", () => {
      const r = contract.execute({ assessment: warningAssessment });
      expect(r.signalResult.signalType).toBe("TRIGGER_REVIEW");
    });

    it("signalType = NO_ACTION for PASSING assessment", () => {
      const r = contract.execute({ assessment: passingAssessment });
      expect(r.signalResult.signalType).toBe("NO_ACTION");
    });

    it("signalType = MONITOR for INSUFFICIENT_DATA assessment", () => {
      const r = contract.execute({ assessment: insufficientAssessment });
      expect(r.signalResult.signalType).toBe("MONITOR");
    });

    it("urgency = CRITICAL for ESCALATE signal", () => {
      const r = contract.execute({ assessment: failingAssessment });
      expect(r.signalResult.urgency).toBe("CRITICAL");
    });

    it("urgency = HIGH for TRIGGER_REVIEW signal", () => {
      const r = contract.execute({ assessment: warningAssessment });
      expect(r.signalResult.urgency).toBe("HIGH");
    });

    it("sourceAssessmentId matches assessment.assessmentId", () => {
      const r = contract.execute({ assessment: passingAssessment });
      expect(r.signalResult.sourceAssessmentId).toBe("a-pass");
    });

    it("sourceOverallStatus matches assessment.overallStatus", () => {
      const r = contract.execute({ assessment: failingAssessment });
      expect(r.signalResult.sourceOverallStatus).toBe("FAILING");
    });
  });
});
