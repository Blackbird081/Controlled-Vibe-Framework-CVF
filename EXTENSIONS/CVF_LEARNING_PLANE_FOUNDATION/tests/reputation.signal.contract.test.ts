/**
 * ReputationSignalContract — Tests (W10-T1 CP1)
 * ================================================
 * GC-023: dedicated file — never merge into index.test.ts.
 *
 * Coverage:
 *   ReputationSignalContract.compute:
 *     - perfect input → composite 100, TRUSTED
 *     - worst input → composite 0, UNTRUSTED
 *     - truthContribution: maps compositeScore (0–100) → 0–40 correctly
 *     - feedbackContribution: empty ledger → 0; full accept ratio → 35
 *     - feedbackContribution: partial accept ratio computed correctly
 *     - evaluationContribution: PASS→15, WARN→8, INCONCLUSIVE→5, FAIL→0
 *     - governanceContribution: NO_ACTION→10, MONITOR→7, TRIGGER_REVIEW→3, ESCALATE→0
 *     - reputationClass thresholds (≥80 TRUSTED, ≥55 RELIABLE, ≥30 PROVISIONAL, <30 UNTRUSTED)
 *     - agentId propagated correctly
 *     - compositeReputationScore is sum of four dimension contributions
 *     - reputationHash is deterministic for identical inputs
 *     - signalId ≠ reputationHash
 *     - rationale is non-empty and contains composite score and class
 *     - dimensions object contains all four fields
 *
 *   Factory: createReputationSignalContract
 */

import { describe, it, expect } from "vitest";
import {
  ReputationSignalContract,
  createReputationSignalContract,
} from "../src/reputation.signal.contract";
import type {
  ReputationSignalInput,
  ReputationClass,
} from "../src/reputation.signal.contract";
import type { TruthScore } from "../src/truth.score.contract";
import type { FeedbackLedger } from "../src/feedback.ledger.contract";
import type { EvaluationResult } from "../src/evaluation.engine.contract";
import type { GovernanceSignal } from "../src/governance.signal.contract";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-03-29T10:00:00.000Z";
const fixedNow = () => FIXED_NOW;

function makeTruthScore(compositeScore: number): TruthScore {
  let scoreClass: TruthScore["scoreClass"];
  if (compositeScore >= 80) scoreClass = "STRONG";
  else if (compositeScore >= 55) scoreClass = "ADEQUATE";
  else if (compositeScore >= 30) scoreClass = "WEAK";
  else scoreClass = "INSUFFICIENT";

  return {
    scoreId: `score-${compositeScore}`,
    scoredAt: FIXED_NOW,
    sourceTruthModelId: "model-a",
    sourceTruthModelVersion: 1,
    compositeScore,
    scoreClass,
    dimensions: {
      confidenceScore: Math.round(compositeScore * 0.25),
      healthScore: Math.round(compositeScore * 0.25),
      trajectoryScore: Math.round(compositeScore * 0.25),
      patternScore: Math.round(compositeScore * 0.25),
    },
    rationale: `TruthScore=${compositeScore}/100`,
    scoreHash: `truth-hash-${compositeScore}`,
  };
}

function makeFeedbackLedger(acceptCount: number, totalRecords: number): FeedbackLedger {
  const rejectCount = totalRecords - acceptCount;
  return {
    ledgerId: `ledger-${acceptCount}-${totalRecords}`,
    compiledAt: FIXED_NOW,
    records: [],
    totalRecords,
    acceptCount,
    retryCount: 0,
    escalateCount: 0,
    rejectCount,
    ledgerHash: `ledger-hash-${acceptCount}-${totalRecords}`,
  };
}

function makeEvaluationResult(verdict: EvaluationResult["verdict"]): EvaluationResult {
  return {
    resultId: `eval-${verdict}`,
    evaluatedAt: FIXED_NOW,
    sourceTruthModelId: "model-a",
    sourceTruthModelVersion: 1,
    verdict,
    severity: verdict === "FAIL" ? "HIGH" : verdict === "WARN" ? "MEDIUM" : "LOW",
    confidenceLevel: 0.8,
    rationale: `Evaluation verdict: ${verdict}`,
    evaluationHash: `eval-hash-${verdict}`,
  };
}

function makeGovernanceSignal(signalType: GovernanceSignal["signalType"]): GovernanceSignal {
  return {
    signalId: `signal-${signalType}`,
    issuedAt: FIXED_NOW,
    sourceAssessmentId: "assessment-1",
    sourceOverallStatus: "PASSING",
    signalType,
    urgency: signalType === "ESCALATE" ? "CRITICAL" : "LOW",
    recommendation: `Governance action: ${signalType}`,
    signalHash: `gov-hash-${signalType}`,
  };
}

function makeInput(overrides: {
  agentId?: string;
  compositeScore?: number;
  acceptCount?: number;
  totalRecords?: number;
  verdict?: EvaluationResult["verdict"];
  signalType?: GovernanceSignal["signalType"];
}): ReputationSignalInput {
  return {
    agentId: overrides.agentId ?? "agent-x",
    truthScore: makeTruthScore(overrides.compositeScore ?? 80),
    feedbackLedger: makeFeedbackLedger(overrides.acceptCount ?? 10, overrides.totalRecords ?? 10),
    evaluationResult: makeEvaluationResult(overrides.verdict ?? "PASS"),
    governanceSignal: makeGovernanceSignal(overrides.signalType ?? "NO_ACTION"),
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("ReputationSignalContract", () => {
  const contract = new ReputationSignalContract({ now: fixedNow });

  describe("perfect input → composite 100, TRUSTED", () => {
    it("should produce compositeReputationScore 100 for best possible input", () => {
      const input = makeInput({ compositeScore: 100, acceptCount: 10, totalRecords: 10, verdict: "PASS", signalType: "NO_ACTION" });
      const result = contract.compute(input);
      expect(result.compositeReputationScore).toBe(100);
    });

    it("should classify as TRUSTED for composite 100", () => {
      const input = makeInput({ compositeScore: 100, acceptCount: 10, totalRecords: 10, verdict: "PASS", signalType: "NO_ACTION" });
      const result = contract.compute(input);
      expect(result.reputationClass).toBe("TRUSTED");
    });
  });

  describe("worst input → composite 0, UNTRUSTED", () => {
    it("should produce compositeReputationScore 0 for worst possible input", () => {
      const input = makeInput({ compositeScore: 0, acceptCount: 0, totalRecords: 10, verdict: "FAIL", signalType: "ESCALATE" });
      const result = contract.compute(input);
      expect(result.compositeReputationScore).toBe(0);
    });

    it("should classify as UNTRUSTED for composite 0", () => {
      const input = makeInput({ compositeScore: 0, acceptCount: 0, totalRecords: 10, verdict: "FAIL", signalType: "ESCALATE" });
      const result = contract.compute(input);
      expect(result.reputationClass).toBe("UNTRUSTED");
    });
  });

  describe("truthContribution scoring (0–40, 40% weight)", () => {
    it("compositeScore=100 → truthContribution=40", () => {
      const result = contract.compute(makeInput({ compositeScore: 100, acceptCount: 0, totalRecords: 0, verdict: "FAIL", signalType: "ESCALATE" }));
      expect(result.dimensions.truthContribution).toBe(40);
    });

    it("compositeScore=0 → truthContribution=0", () => {
      const result = contract.compute(makeInput({ compositeScore: 0 }));
      expect(result.dimensions.truthContribution).toBe(0);
    });

    it("compositeScore=50 → truthContribution=20", () => {
      const result = contract.compute(makeInput({ compositeScore: 50 }));
      expect(result.dimensions.truthContribution).toBe(20);
    });

    it("compositeScore=75 → truthContribution=30", () => {
      const result = contract.compute(makeInput({ compositeScore: 75 }));
      expect(result.dimensions.truthContribution).toBe(30);
    });
  });

  describe("feedbackContribution scoring (0–35, 35% weight)", () => {
    it("empty ledger (totalRecords=0) → feedbackContribution=0", () => {
      const result = contract.compute(makeInput({ acceptCount: 0, totalRecords: 0 }));
      expect(result.dimensions.feedbackContribution).toBe(0);
    });

    it("all accepted (10/10) → feedbackContribution=35", () => {
      const result = contract.compute(makeInput({ acceptCount: 10, totalRecords: 10 }));
      expect(result.dimensions.feedbackContribution).toBe(35);
    });

    it("none accepted (0/10) → feedbackContribution=0", () => {
      const result = contract.compute(makeInput({ acceptCount: 0, totalRecords: 10 }));
      expect(result.dimensions.feedbackContribution).toBe(0);
    });

    it("half accepted (5/10) → feedbackContribution=18 (round(17.5))", () => {
      const result = contract.compute(makeInput({ acceptCount: 5, totalRecords: 10 }));
      expect(result.dimensions.feedbackContribution).toBe(18);
    });

    it("8/10 accepted → feedbackContribution=28", () => {
      const result = contract.compute(makeInput({ acceptCount: 8, totalRecords: 10 }));
      expect(result.dimensions.feedbackContribution).toBe(28);
    });
  });

  describe("evaluationContribution scoring (0–15)", () => {
    it("PASS → evaluationContribution=15", () => {
      const result = contract.compute(makeInput({ verdict: "PASS" }));
      expect(result.dimensions.evaluationContribution).toBe(15);
    });

    it("WARN → evaluationContribution=8", () => {
      const result = contract.compute(makeInput({ verdict: "WARN" }));
      expect(result.dimensions.evaluationContribution).toBe(8);
    });

    it("INCONCLUSIVE → evaluationContribution=5", () => {
      const result = contract.compute(makeInput({ verdict: "INCONCLUSIVE" }));
      expect(result.dimensions.evaluationContribution).toBe(5);
    });

    it("FAIL → evaluationContribution=0", () => {
      const result = contract.compute(makeInput({ verdict: "FAIL" }));
      expect(result.dimensions.evaluationContribution).toBe(0);
    });
  });

  describe("governanceContribution scoring (0–10)", () => {
    it("NO_ACTION → governanceContribution=10", () => {
      const result = contract.compute(makeInput({ signalType: "NO_ACTION" }));
      expect(result.dimensions.governanceContribution).toBe(10);
    });

    it("MONITOR → governanceContribution=7", () => {
      const result = contract.compute(makeInput({ signalType: "MONITOR" }));
      expect(result.dimensions.governanceContribution).toBe(7);
    });

    it("TRIGGER_REVIEW → governanceContribution=3", () => {
      const result = contract.compute(makeInput({ signalType: "TRIGGER_REVIEW" }));
      expect(result.dimensions.governanceContribution).toBe(3);
    });

    it("ESCALATE → governanceContribution=0", () => {
      const result = contract.compute(makeInput({ signalType: "ESCALATE" }));
      expect(result.dimensions.governanceContribution).toBe(0);
    });
  });

  describe("reputationClass thresholds", () => {
    it("composite ≥ 80 → TRUSTED", () => {
      const input = makeInput({ compositeScore: 100, acceptCount: 10, totalRecords: 10, verdict: "PASS", signalType: "NO_ACTION" });
      expect(contract.compute(input).reputationClass).toBe<ReputationClass>("TRUSTED");
    });

    it("composite exactly 80 → TRUSTED (boundary)", () => {
      // truth=40 (100*0.4), feedback=35 (10/10), eval=0 (FAIL), gov=0 (ESCALATE) = 75 → not quite 80
      // truth=40, feedback=35, eval=5 (INCONCLUSIVE), gov=0 = 80 → exactly TRUSTED
      const input = makeInput({ compositeScore: 100, acceptCount: 10, totalRecords: 10, verdict: "INCONCLUSIVE", signalType: "ESCALATE" });
      const result = contract.compute(input);
      expect(result.compositeReputationScore).toBe(80);
      expect(result.reputationClass).toBe("TRUSTED");
    });

    it("composite in range 55–79 → RELIABLE", () => {
      // truth=30 (75*0.4), feedback=18 (5/10), eval=5 (INCONCLUSIVE), gov=0 (ESCALATE) = 53 → PROVISIONAL
      // truth=24 (60*0.4), feedback=18, eval=8 (WARN), gov=7 (MONITOR) = 57 → RELIABLE
      const input = makeInput({ compositeScore: 60, acceptCount: 5, totalRecords: 10, verdict: "WARN", signalType: "MONITOR" });
      const result = contract.compute(input);
      expect(result.compositeReputationScore).toBe(57);
      expect(result.reputationClass).toBe("RELIABLE");
    });

    it("composite exactly 55 → RELIABLE (boundary)", () => {
      // truth=20 (50*0.4)=20, feedback=18 (5/10), eval=8 (WARN), gov=7 (MONITOR) = 53 → nope
      // truth=20, feedback=28 (8/10*35=28), eval=0, gov=7 = 55 → RELIABLE
      const input = makeInput({ compositeScore: 50, acceptCount: 8, totalRecords: 10, verdict: "FAIL", signalType: "MONITOR" });
      const result = contract.compute(input);
      expect(result.compositeReputationScore).toBe(55);
      expect(result.reputationClass).toBe("RELIABLE");
    });

    it("composite in range 30–54 → PROVISIONAL", () => {
      // truth=20 (50*0.4), feedback=0 (empty), eval=8 (WARN), gov=3 (TRIGGER_REVIEW) = 31 → PROVISIONAL
      const input = makeInput({ compositeScore: 50, acceptCount: 0, totalRecords: 0, verdict: "WARN", signalType: "TRIGGER_REVIEW" });
      const result = contract.compute(input);
      expect(result.compositeReputationScore).toBe(31);
      expect(result.reputationClass).toBe("PROVISIONAL");
    });

    it("composite exactly 30 → PROVISIONAL (boundary)", () => {
      // truth=20 (50*0.4), feedback=0, eval=5 (INCONCLUSIVE), gov=5? no, MONITOR=7
      // truth=12 (30*0.4), feedback=18 (5/10), eval=0, gov=0 = 30 → PROVISIONAL
      const input = makeInput({ compositeScore: 30, acceptCount: 5, totalRecords: 10, verdict: "FAIL", signalType: "ESCALATE" });
      const result = contract.compute(input);
      expect(result.compositeReputationScore).toBe(30);
      expect(result.reputationClass).toBe("PROVISIONAL");
    });

    it("composite < 30 → UNTRUSTED", () => {
      const input = makeInput({ compositeScore: 0, acceptCount: 0, totalRecords: 10, verdict: "FAIL", signalType: "ESCALATE" });
      expect(contract.compute(input).reputationClass).toBe<ReputationClass>("UNTRUSTED");
    });

    it("composite exactly 29 → UNTRUSTED (boundary)", () => {
      // truth=8 (20*0.4), feedback=21 (6/10*35=21), eval=0, gov=0 = 29 → UNTRUSTED
      const input = makeInput({ compositeScore: 20, acceptCount: 6, totalRecords: 10, verdict: "FAIL", signalType: "ESCALATE" });
      const result = contract.compute(input);
      expect(result.compositeReputationScore).toBe(29);
      expect(result.reputationClass).toBe("UNTRUSTED");
    });
  });

  describe("output fields", () => {
    it("agentId propagated to output", () => {
      const result = contract.compute(makeInput({ agentId: "agent-zyx" }));
      expect(result.agentId).toBe("agent-zyx");
    });

    it("compositeReputationScore equals sum of four dimensions", () => {
      const result = contract.compute(makeInput({}));
      const { truthContribution, feedbackContribution, evaluationContribution, governanceContribution } = result.dimensions;
      expect(result.compositeReputationScore).toBe(
        truthContribution + feedbackContribution + evaluationContribution + governanceContribution
      );
    });

    it("computedAt uses injected clock", () => {
      const result = contract.compute(makeInput({}));
      expect(result.computedAt).toBe(FIXED_NOW);
    });

    it("dimensions object has all four fields", () => {
      const result = contract.compute(makeInput({}));
      expect(result.dimensions).toHaveProperty("truthContribution");
      expect(result.dimensions).toHaveProperty("feedbackContribution");
      expect(result.dimensions).toHaveProperty("evaluationContribution");
      expect(result.dimensions).toHaveProperty("governanceContribution");
    });

    it("rationale is non-empty", () => {
      const result = contract.compute(makeInput({}));
      expect(result.rationale.length).toBeGreaterThan(0);
    });

    it("rationale contains composite score", () => {
      const result = contract.compute(makeInput({}));
      expect(result.rationale).toContain(String(result.compositeReputationScore));
    });

    it("rationale contains reputationClass", () => {
      const result = contract.compute(makeInput({}));
      expect(result.rationale).toContain(result.reputationClass);
    });
  });

  describe("determinism", () => {
    it("reputationHash is identical for identical inputs", () => {
      const input = makeInput({ agentId: "agent-det", compositeScore: 70, acceptCount: 7, totalRecords: 10, verdict: "WARN", signalType: "MONITOR" });
      const r1 = contract.compute(input);
      const r2 = contract.compute(input);
      expect(r1.reputationHash).toBe(r2.reputationHash);
    });

    it("signalId is identical for identical inputs", () => {
      const input = makeInput({ agentId: "agent-det", compositeScore: 70 });
      const r1 = contract.compute(input);
      const r2 = contract.compute(input);
      expect(r1.signalId).toBe(r2.signalId);
    });

    it("signalId ≠ reputationHash", () => {
      const result = contract.compute(makeInput({}));
      expect(result.signalId).not.toBe(result.reputationHash);
    });

    it("different agentId produces different reputationHash", () => {
      const r1 = contract.compute(makeInput({ agentId: "agent-alpha" }));
      const r2 = contract.compute(makeInput({ agentId: "agent-beta" }));
      expect(r1.reputationHash).not.toBe(r2.reputationHash);
    });

    it("different compositeScore produces different reputationHash", () => {
      const r1 = contract.compute(makeInput({ compositeScore: 50 }));
      const r2 = contract.compute(makeInput({ compositeScore: 90 }));
      expect(r1.reputationHash).not.toBe(r2.reputationHash);
    });
  });
});

describe("createReputationSignalContract (factory)", () => {
  it("returns a ReputationSignalContract instance", () => {
    const c = createReputationSignalContract({ now: fixedNow });
    expect(c).toBeInstanceOf(ReputationSignalContract);
  });

  it("factory produces same result as direct instantiation", () => {
    const c1 = new ReputationSignalContract({ now: fixedNow });
    const c2 = createReputationSignalContract({ now: fixedNow });
    const input = makeInput({});
    expect(c1.compute(input).reputationHash).toBe(c2.compute(input).reputationHash);
  });
});
