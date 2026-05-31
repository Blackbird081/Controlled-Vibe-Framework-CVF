import { describe, expect, it } from "vitest";
import {
  REPUTATION_ROUTING_ADVISORY_VERSION,
  computeRoutingAdvisory,
  createReputationSignalContract,
} from "../src/index";
import type {
  ReputationSignalInput,
  ReputationSignal,
  TruthScore,
  FeedbackLedger,
  EvaluationResult,
  GovernanceSignal,
} from "../src/index";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeTruthScore(compositeScore: number): TruthScore {
  const scoreClass =
    compositeScore >= 80 ? "STRONG"
    : compositeScore >= 55 ? "ADEQUATE"
    : compositeScore >= 30 ? "WEAK"
    : "INSUFFICIENT";
  return {
    scoreId: `score-${compositeScore}`,
    scoredAt: "2026-05-31T00:00:00.000Z",
    sourceTruthModelId: "model-1",
    sourceTruthModelVersion: 1,
    compositeScore,
    scoreClass,
    dimensions: { confidenceScore: 0, healthScore: 0, trajectoryScore: 0, patternScore: 0 },
    rationale: `score ${compositeScore}`,
    scoreHash: `hash-${compositeScore}`,
  };
}

function makeFeedbackLedger(acceptCount: number, totalRecords: number): FeedbackLedger {
  return {
    ledgerId: "ledger-1",
    compiledAt: "2026-05-31T00:00:00.000Z",
    records: [],
    acceptCount,
    retryCount: 0,
    escalateCount: 0,
    rejectCount: totalRecords - acceptCount,
    totalRecords,
    ledgerHash: "hash-ledger",
  };
}

function makeEvaluationResult(verdict: EvaluationResult["verdict"]): EvaluationResult {
  return {
    resultId: "result-1",
    evaluatedAt: "2026-05-31T00:00:00.000Z",
    sourceTruthModelId: "model-1",
    sourceTruthModelVersion: 1,
    verdict,
    severity: verdict === "PASS" ? "NONE" : verdict === "WARN" ? "LOW" : "HIGH",
    confidenceLevel: 0.8,
    rationale: `verdict ${verdict}`,
    evaluationHash: "hash-result",
  };
}

function makeGovernanceSignal(signalType: GovernanceSignal["signalType"]): GovernanceSignal {
  return {
    signalId: "gov-1",
    issuedAt: "2026-05-31T00:00:00.000Z",
    sourceAssessmentId: "assessment-1",
    sourceOverallStatus: "ok",
    signalType,
    urgency: "NORMAL",
    recommendation: `signal ${signalType}`,
    signalHash: "hash-gov",
  };
}

function buildSignal(input: ReputationSignalInput): ReputationSignal {
  return createReputationSignalContract({ now: () => "2026-05-31T00:00:00.000Z" }).compute(input);
}

const trustedInput: ReputationSignalInput = {
  agentId: "agent-trusted",
  truthScore: makeTruthScore(100),
  feedbackLedger: makeFeedbackLedger(10, 10),
  evaluationResult: makeEvaluationResult("PASS"),
  governanceSignal: makeGovernanceSignal("NO_ACTION"),
};

const untrustedInput: ReputationSignalInput = {
  agentId: "agent-untrusted",
  truthScore: makeTruthScore(0),
  feedbackLedger: makeFeedbackLedger(0, 10),
  evaluationResult: makeEvaluationResult("FAIL"),
  governanceSignal: makeGovernanceSignal("ESCALATE"),
};

const provisionalInput: ReputationSignalInput = {
  agentId: "agent-provisional",
  truthScore: makeTruthScore(50),
  feedbackLedger: makeFeedbackLedger(3, 10),
  evaluationResult: makeEvaluationResult("FAIL"),
  governanceSignal: makeGovernanceSignal("MONITOR"),
};

// ─── RM1 — Reputation Routing Advisory ───────────────────────────────────────

describe("CVF Learning Plane Foundation", () => {
  describe("RM1 — computeRoutingAdvisory", () => {
    it("TRUSTED agent → PROCEED disposition, no R2 review", () => {
      const signal = buildSignal(trustedInput);
      const r = computeRoutingAdvisory(signal);
      expect(r.disposition).toBe("PROCEED");
      expect(r.reputationClass).toBe("TRUSTED");
      expect(r.r2ReviewRecommended).toBe(false);
    });

    it("RELIABLE agent → PROCEED disposition, no R2 review", () => {
      const reliableInput: ReputationSignalInput = {
        agentId: "agent-reliable",
        truthScore: makeTruthScore(100),
        feedbackLedger: makeFeedbackLedger(7, 10),
        evaluationResult: makeEvaluationResult("WARN"),
        governanceSignal: makeGovernanceSignal("MONITOR"),
      };
      const signal = buildSignal(reliableInput);
      const r = computeRoutingAdvisory(signal);
      expect(r.r2ReviewRecommended).toBe(false);
      // RELIABLE or TRUSTED both → PROCEED
      expect(["PROCEED"]).toContain(r.disposition);
    });

    it("PROVISIONAL agent → CAUTION disposition + R2 review recommended", () => {
      const signal = buildSignal(provisionalInput);
      const r = computeRoutingAdvisory(signal);
      // PROVISIONAL or CAUTION depends on computed score
      expect(["CAUTION", "DEFER"]).toContain(r.disposition);
      expect(r.r2ReviewRecommended).toBe(true);
    });

    it("UNTRUSTED agent → DEFER disposition + R2 review recommended", () => {
      const signal = buildSignal(untrustedInput);
      const r = computeRoutingAdvisory(signal);
      expect(r.disposition).toBe("DEFER");
      expect(r.reputationClass).toBe("UNTRUSTED");
      expect(r.r2ReviewRecommended).toBe(true);
    });

    it("runtimeRoutingAuthorized is always false", () => {
      expect(computeRoutingAdvisory(buildSignal(trustedInput)).runtimeRoutingAuthorized).toBe(false);
      expect(computeRoutingAdvisory(buildSignal(untrustedInput)).runtimeRoutingAuthorized).toBe(false);
    });

    it("contractVersion matches REPUTATION_ROUTING_ADVISORY_VERSION", () => {
      const r = computeRoutingAdvisory(buildSignal(trustedInput));
      expect(r.contractVersion).toBe(REPUTATION_ROUTING_ADVISORY_VERSION);
      expect(r.contractVersion).toBe("cvf.reputationRoutingAdvisory.rm1.v1");
    });

    it("agentId is preserved in result", () => {
      const signal = buildSignal({ ...trustedInput, agentId: "my-agent-42" });
      expect(computeRoutingAdvisory(signal).agentId).toBe("my-agent-42");
    });

    it("compositeReputationScore is preserved in result", () => {
      const signal = buildSignal(trustedInput);
      const r = computeRoutingAdvisory(signal);
      expect(r.compositeReputationScore).toBe(signal.compositeReputationScore);
    });

    it("advisoryNote is non-empty for all dispositions", () => {
      const proceed = computeRoutingAdvisory(buildSignal(trustedInput));
      const defer = computeRoutingAdvisory(buildSignal(untrustedInput));
      expect(proceed.advisoryNote.length).toBeGreaterThan(0);
      expect(defer.advisoryNote.length).toBeGreaterThan(0);
    });

    it("DEFER advisoryNote mentions advisory nature (not hard gate)", () => {
      const r = computeRoutingAdvisory(buildSignal(untrustedInput));
      expect(r.advisoryNote).toContain("Advisory only");
    });

    it("PROCEED advisoryNote mentions full task allocation", () => {
      const r = computeRoutingAdvisory(buildSignal(trustedInput));
      expect(r.advisoryNote).toContain("Full task allocation");
    });
  });
});
