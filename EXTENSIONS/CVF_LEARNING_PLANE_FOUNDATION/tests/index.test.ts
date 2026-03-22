import { describe, expect, it } from "vitest";
import {
  LEARNING_PLANE_FOUNDATION_COORDINATION,
  FeedbackLedgerContract,
  createFeedbackLedgerContract,
  PatternDetectionContract,
  createPatternDetectionContract,
  TruthModelContract,
  createTruthModelContract,
  TruthModelUpdateContract,
  createTruthModelUpdateContract,
  EvaluationEngineContract,
  createEvaluationEngineContract,
  EvaluationThresholdContract,
  createEvaluationThresholdContract,
  GovernanceSignalContract,
  createGovernanceSignalContract,
  GovernanceSignalLogContract,
  createGovernanceSignalLogContract,
} from "../src/index";
import type {
  LearningFeedbackInput,
  PatternInsight,
  TruthModel,
  EvaluationResult,
  GovernanceSignal,
  ThresholdAssessment,
} from "../src/index";

function makeSignal(
  feedbackClass: "ACCEPT" | "RETRY" | "ESCALATE" | "REJECT",
  id = "sig-001",
): LearningFeedbackInput {
  return {
    feedbackId: id,
    sourcePipelineId: `pipe-${id}`,
    feedbackClass,
    priority: feedbackClass === "ESCALATE" ? "critical" : "low",
    confidenceBoost: feedbackClass === "ACCEPT" ? 0.1 : 0,
  };
}

describe("CVF_LEARNING_PLANE_FOUNDATION", () => {
  it("exports coordination constant with correct tranche and prerequisite", () => {
    expect(LEARNING_PLANE_FOUNDATION_COORDINATION.tranche).toBe("W4-T1");
    expect(LEARNING_PLANE_FOUNDATION_COORDINATION.crossPlaneIndependence).toBe(true);
    expect(LEARNING_PLANE_FOUNDATION_COORDINATION.prerequisite).toContain("W2-T4");
  });

  // ─── W4-T2 CP1 — TruthModelContract ─────────────────────────────────────

  describe("W4-T2 CP1 — TruthModelContract", () => {
    function makeInsight(
      dominantPattern: "ACCEPT" | "RETRY" | "ESCALATE" | "REJECT" | "MIXED" | "EMPTY",
      healthSignal: "HEALTHY" | "DEGRADED" | "CRITICAL",
      id = "insight-001",
    ): PatternInsight {
      const fixedTime = "2026-03-22T10:00:00.000Z";
      return {
        insightId: id,
        analyzedAt: fixedTime,
        sourceLedgerId: `ledger-${id}`,
        dominantPattern,
        acceptRate: dominantPattern === "ACCEPT" ? 1 : 0,
        retryRate: dominantPattern === "RETRY" ? 1 : 0,
        escalateRate: dominantPattern === "ESCALATE" ? 1 : 0,
        rejectRate: dominantPattern === "REJECT" ? 1 : 0,
        healthSignal,
        summary: `Test insight ${id}`,
        insightHash: `hash-${id}`,
      };
    }

    it("builds model from empty insights with EMPTY pattern and UNKNOWN trajectory", () => {
      const contract = createTruthModelContract();
      const model = contract.build([]);

      expect(model.dominantPattern).toBe("EMPTY");
      expect(model.currentHealthSignal).toBe("HEALTHY");
      expect(model.healthTrajectory).toBe("UNKNOWN");
      expect(model.totalInsightsProcessed).toBe(0);
      expect(model.version).toBe(1);
      expect(model.confidenceLevel).toBe(0);
      expect(model.patternHistory).toHaveLength(0);
    });

    it("builds model from single ACCEPT/HEALTHY insight with UNKNOWN trajectory", () => {
      const contract = createTruthModelContract();
      const model = contract.build([makeInsight("ACCEPT", "HEALTHY", "i1")]);

      expect(model.dominantPattern).toBe("ACCEPT");
      expect(model.currentHealthSignal).toBe("HEALTHY");
      expect(model.healthTrajectory).toBe("UNKNOWN");
      expect(model.totalInsightsProcessed).toBe(1);
      expect(model.patternHistory).toHaveLength(1);
    });

    it("derives STABLE trajectory when first and last health are identical", () => {
      const contract = createTruthModelContract();
      const model = contract.build([
        makeInsight("ACCEPT", "HEALTHY", "i1"),
        makeInsight("ACCEPT", "HEALTHY", "i2"),
      ]);

      expect(model.healthTrajectory).toBe("STABLE");
    });

    it("derives IMPROVING trajectory from CRITICAL to HEALTHY", () => {
      const contract = createTruthModelContract();
      const model = contract.build([
        makeInsight("ESCALATE", "CRITICAL", "i1"),
        makeInsight("ACCEPT", "HEALTHY", "i2"),
      ]);

      expect(model.healthTrajectory).toBe("IMPROVING");
    });

    it("derives DEGRADING trajectory from HEALTHY to CRITICAL", () => {
      const contract = createTruthModelContract();
      const model = contract.build([
        makeInsight("ACCEPT", "HEALTHY", "i1"),
        makeInsight("ESCALATE", "CRITICAL", "i2"),
      ]);

      expect(model.healthTrajectory).toBe("DEGRADING");
    });

    it("returns MIXED dominantPattern when two classes are equally frequent", () => {
      const contract = createTruthModelContract();
      const model = contract.build([
        makeInsight("ACCEPT", "HEALTHY", "i1"),
        makeInsight("ACCEPT", "HEALTHY", "i2"),
        makeInsight("RETRY", "DEGRADED", "i3"),
        makeInsight("RETRY", "DEGRADED", "i4"),
      ]);

      expect(model.dominantPattern).toBe("MIXED");
    });

    it("confidence level grows with insights and caps at 1.0", () => {
      const contract = createTruthModelContract();
      const m1 = contract.build([makeInsight("ACCEPT", "HEALTHY", "i1")]);
      const m10 = contract.build(
        Array.from({ length: 10 }, (_, i) => makeInsight("ACCEPT", "HEALTHY", `i${i}`)),
      );
      const m20 = contract.build(
        Array.from({ length: 20 }, (_, i) => makeInsight("ACCEPT", "HEALTHY", `i${i}`)),
      );

      expect(m1.confidenceLevel).toBeCloseTo(0.1);
      expect(m10.confidenceLevel).toBe(1.0);
      expect(m20.confidenceLevel).toBe(1.0);
    });

    it("produces stable modelHash for identical inputs with fixed time", () => {
      const fixedTime = "2026-03-22T10:00:00.000Z";
      const c1 = createTruthModelContract({ now: () => fixedTime });
      const c2 = createTruthModelContract({ now: () => fixedTime });
      const insights = [makeInsight("ACCEPT", "HEALTHY", "i1")];

      expect(c1.build(insights).modelHash).toBe(c2.build(insights).modelHash);
    });

    it("accepts injectable computeConfidence override", () => {
      const contract = createTruthModelContract({
        computeConfidence: () => 0.5,
      });
      const model = contract.build([makeInsight("ACCEPT", "HEALTHY", "i1")]);

      expect(model.confidenceLevel).toBe(0.5);
    });

    it("creates TruthModelContract via class constructor", () => {
      const contract = new TruthModelContract();
      expect(contract).toBeInstanceOf(TruthModelContract);
    });
  });

  // ─── W4-T2 CP2 — TruthModelUpdateContract ────────────────────────────────

  describe("W4-T2 CP2 — TruthModelUpdateContract", () => {
    function makeInsight(
      dominantPattern: "ACCEPT" | "RETRY" | "ESCALATE" | "REJECT" | "MIXED" | "EMPTY",
      healthSignal: "HEALTHY" | "DEGRADED" | "CRITICAL",
      id = "insight-001",
    ): PatternInsight {
      const fixedTime = "2026-03-22T10:00:00.000Z";
      return {
        insightId: id,
        analyzedAt: fixedTime,
        sourceLedgerId: `ledger-${id}`,
        dominantPattern,
        acceptRate: dominantPattern === "ACCEPT" ? 1 : 0,
        retryRate: dominantPattern === "RETRY" ? 1 : 0,
        escalateRate: dominantPattern === "ESCALATE" ? 1 : 0,
        rejectRate: dominantPattern === "REJECT" ? 1 : 0,
        healthSignal,
        summary: `Test insight ${id}`,
        insightHash: `hash-${id}`,
      };
    }

    function makeBaseModel() {
      const fixedTime = "2026-03-22T10:00:00.000Z";
      return createTruthModelContract({ now: () => fixedTime }).build([
        makeInsight("ACCEPT", "HEALTHY", "base-1"),
      ]);
    }

    it("update increments version by 1", () => {
      const model = makeBaseModel();
      const updated = createTruthModelUpdateContract().update(
        model,
        makeInsight("RETRY", "DEGRADED", "new-1"),
      );

      expect(updated.version).toBe(model.version + 1);
    });

    it("update appends exactly one entry to patternHistory", () => {
      const model = makeBaseModel();
      const updated = createTruthModelUpdateContract().update(
        model,
        makeInsight("RETRY", "DEGRADED", "new-1"),
      );

      expect(updated.patternHistory).toHaveLength(model.patternHistory.length + 1);
    });

    it("update increments totalInsightsProcessed by 1", () => {
      const model = makeBaseModel();
      const updated = createTruthModelUpdateContract().update(
        model,
        makeInsight("RETRY", "DEGRADED", "new-1"),
      );

      expect(updated.totalInsightsProcessed).toBe(model.totalInsightsProcessed + 1);
    });

    it("currentHealthSignal reflects the new insight after update", () => {
      const model = makeBaseModel();
      const updated = createTruthModelUpdateContract().update(
        model,
        makeInsight("ESCALATE", "CRITICAL", "new-1"),
      );

      expect(updated.currentHealthSignal).toBe("CRITICAL");
    });

    it("healthTrajectory updates correctly — HEALTHY then CRITICAL becomes DEGRADING", () => {
      const model = makeBaseModel(); // base = HEALTHY
      const updated = createTruthModelUpdateContract().update(
        model,
        makeInsight("ESCALATE", "CRITICAL", "new-1"),
      );

      expect(updated.healthTrajectory).toBe("DEGRADING");
    });

    it("modelHash changes after update (different input produces different hash)", () => {
      const model = makeBaseModel();
      const updated = createTruthModelUpdateContract().update(
        model,
        makeInsight("RETRY", "DEGRADED", "new-1"),
      );

      expect(updated.modelHash).not.toBe(model.modelHash);
    });

    it("creates TruthModelUpdateContract via class constructor", () => {
      const contract = new TruthModelUpdateContract();
      expect(contract).toBeInstanceOf(TruthModelUpdateContract);
    });
  });

  // ─── W4-T4 CP1 — GovernanceSignalContract ────────────────────────────────

  describe("W4-T4 CP1 — GovernanceSignalContract", () => {
    function makeAssessment(
      overrides: Partial<ThresholdAssessment> = {},
    ): ThresholdAssessment {
      return {
        assessmentId: "assess-001",
        assessedAt: "2026-03-22T10:00:00.000Z",
        totalVerdicts: 3,
        passCount: 3,
        warnCount: 0,
        failCount: 0,
        inconclusiveCount: 0,
        overallStatus: "PASSING",
        summary: "All passing",
        assessmentHash: "hash-assess-001",
        ...overrides,
      };
    }

    it("returns ESCALATE + CRITICAL urgency for FAILING assessment", () => {
      const contract = createGovernanceSignalContract();
      const result = contract.signal(
        makeAssessment({ overallStatus: "FAILING", failCount: 2, passCount: 1 }),
      );

      expect(result.signalType).toBe("ESCALATE");
      expect(result.urgency).toBe("CRITICAL");
    });

    it("returns TRIGGER_REVIEW + HIGH urgency for WARNING assessment", () => {
      const contract = createGovernanceSignalContract();
      const result = contract.signal(
        makeAssessment({ overallStatus: "WARNING", warnCount: 1, passCount: 2 }),
      );

      expect(result.signalType).toBe("TRIGGER_REVIEW");
      expect(result.urgency).toBe("HIGH");
    });

    it("returns MONITOR + LOW urgency for INSUFFICIENT_DATA assessment", () => {
      const contract = createGovernanceSignalContract();
      const result = contract.signal(
        makeAssessment({
          overallStatus: "INSUFFICIENT_DATA",
          inconclusiveCount: 2,
          totalVerdicts: 2,
          passCount: 0,
        }),
      );

      expect(result.signalType).toBe("MONITOR");
      expect(result.urgency).toBe("LOW");
    });

    it("returns NO_ACTION + LOW urgency for PASSING assessment", () => {
      const contract = createGovernanceSignalContract();
      const result = contract.signal(makeAssessment({ overallStatus: "PASSING" }));

      expect(result.signalType).toBe("NO_ACTION");
      expect(result.urgency).toBe("LOW");
    });

    it("sourceAssessmentId traces back to input assessment", () => {
      const contract = createGovernanceSignalContract();
      const assessment = makeAssessment({ assessmentId: "my-assess-xyz" });
      const result = contract.signal(assessment);

      expect(result.sourceAssessmentId).toBe("my-assess-xyz");
    });

    it("recommendation is non-empty for all signal types", () => {
      const contract = createGovernanceSignalContract();
      for (const status of ["FAILING", "WARNING", "INSUFFICIENT_DATA", "PASSING"] as const) {
        const result = contract.signal(makeAssessment({ overallStatus: status }));
        expect(result.recommendation.length).toBeGreaterThan(0);
      }
    });

    it("produces stable signalHash with fixed time injection", () => {
      const fixedTime = "2026-03-22T10:00:00.000Z";
      const c1 = createGovernanceSignalContract({ now: () => fixedTime });
      const c2 = createGovernanceSignalContract({ now: () => fixedTime });
      const assessment = makeAssessment();

      expect(c1.signal(assessment).signalHash).toBe(c2.signal(assessment).signalHash);
    });

    it("signalId and signalHash are distinct values", () => {
      const fixedTime = "2026-03-22T10:00:00.000Z";
      const contract = createGovernanceSignalContract({ now: () => fixedTime });
      const result = contract.signal(makeAssessment());

      expect(result.signalId).not.toBe(result.signalHash);
    });

    it("creates GovernanceSignalContract via class constructor", () => {
      const contract = new GovernanceSignalContract();
      expect(contract).toBeInstanceOf(GovernanceSignalContract);
    });
  });

  // ─── W4-T4 CP2 — GovernanceSignalLogContract ─────────────────────────────

  describe("W4-T4 CP2 — GovernanceSignalLogContract", () => {
    function makeSignalOfType(
      signalType: GovernanceSignal["signalType"],
      id = "s1",
    ): GovernanceSignal {
      return {
        signalId: id,
        issuedAt: "2026-03-22T10:00:00.000Z",
        sourceAssessmentId: "assess-001",
        sourceOverallStatus: "PASSING",
        signalType,
        urgency: "LOW",
        recommendation: `Test signal ${id}`,
        signalHash: `hash-${id}`,
      };
    }

    it("returns NO_ACTION dominant for empty signals", () => {
      const contract = createGovernanceSignalLogContract();
      const log = contract.log([]);

      expect(log.dominantSignalType).toBe("NO_ACTION");
      expect(log.totalSignals).toBe(0);
    });

    it("returns ESCALATE as dominant when any ESCALATE present", () => {
      const contract = createGovernanceSignalLogContract();
      const log = contract.log([
        makeSignalOfType("NO_ACTION", "s1"),
        makeSignalOfType("TRIGGER_REVIEW", "s2"),
        makeSignalOfType("ESCALATE", "s3"),
      ]);

      expect(log.dominantSignalType).toBe("ESCALATE");
      expect(log.escalateCount).toBe(1);
    });

    it("returns TRIGGER_REVIEW as dominant when no ESCALATE present", () => {
      const contract = createGovernanceSignalLogContract();
      const log = contract.log([
        makeSignalOfType("MONITOR", "s1"),
        makeSignalOfType("TRIGGER_REVIEW", "s2"),
        makeSignalOfType("NO_ACTION", "s3"),
      ]);

      expect(log.dominantSignalType).toBe("TRIGGER_REVIEW");
    });

    it("counts all signal types correctly", () => {
      const contract = createGovernanceSignalLogContract();
      const log = contract.log([
        makeSignalOfType("ESCALATE", "s1"),
        makeSignalOfType("TRIGGER_REVIEW", "s2"),
        makeSignalOfType("MONITOR", "s3"),
        makeSignalOfType("NO_ACTION", "s4"),
      ]);

      expect(log.escalateCount).toBe(1);
      expect(log.reviewCount).toBe(1);
      expect(log.monitorCount).toBe(1);
      expect(log.noActionCount).toBe(1);
      expect(log.totalSignals).toBe(4);
    });

    it("produces stable logHash with fixed time injection", () => {
      const fixedTime = "2026-03-22T10:00:00.000Z";
      const c1 = createGovernanceSignalLogContract({ now: () => fixedTime });
      const c2 = createGovernanceSignalLogContract({ now: () => fixedTime });
      const signals = [makeSignalOfType("NO_ACTION", "s1"), makeSignalOfType("MONITOR", "s2")];

      expect(c1.log(signals).logHash).toBe(c2.log(signals).logHash);
    });

    it("summary is non-empty for any input", () => {
      const contract = createGovernanceSignalLogContract();
      expect(contract.log([]).summary.length).toBeGreaterThan(0);
      expect(contract.log([makeSignalOfType("ESCALATE")]).summary.length).toBeGreaterThan(0);
    });

    it("creates GovernanceSignalLogContract via class constructor", () => {
      const contract = new GovernanceSignalLogContract();
      expect(contract).toBeInstanceOf(GovernanceSignalLogContract);
    });
  });

  // ─── W4-T3 CP1 — EvaluationEngineContract ────────────────────────────────

  describe("W4-T3 CP1 — EvaluationEngineContract", () => {
    function makeModel(overrides: Partial<TruthModel> = {}): TruthModel {
      return {
        modelId: "model-001",
        createdAt: "2026-03-22T10:00:00.000Z",
        version: 3,
        totalInsightsProcessed: 5,
        dominantPattern: "ACCEPT",
        currentHealthSignal: "HEALTHY",
        healthTrajectory: "STABLE",
        confidenceLevel: 0.8,
        patternHistory: [],
        modelHash: "hash-model-001",
        ...overrides,
      };
    }

    it("returns INCONCLUSIVE when confidenceLevel < 0.3", () => {
      const contract = createEvaluationEngineContract();
      const result = contract.evaluate(makeModel({ confidenceLevel: 0.2, healthTrajectory: "STABLE" }));

      expect(result.verdict).toBe("INCONCLUSIVE");
      expect(result.severity).toBe("LOW");
    });

    it("returns INCONCLUSIVE when healthTrajectory is UNKNOWN", () => {
      const contract = createEvaluationEngineContract();
      const result = contract.evaluate(makeModel({ healthTrajectory: "UNKNOWN", confidenceLevel: 0.9 }));

      expect(result.verdict).toBe("INCONCLUSIVE");
      expect(result.severity).toBe("LOW");
    });

    it("returns FAIL with CRITICAL severity when currentHealthSignal is CRITICAL", () => {
      const contract = createEvaluationEngineContract();
      const result = contract.evaluate(makeModel({ currentHealthSignal: "CRITICAL", confidenceLevel: 0.9 }));

      expect(result.verdict).toBe("FAIL");
      expect(result.severity).toBe("CRITICAL");
    });

    it("returns FAIL with HIGH severity when dominantPattern is REJECT", () => {
      const contract = createEvaluationEngineContract();
      const result = contract.evaluate(makeModel({ dominantPattern: "REJECT", confidenceLevel: 0.9 }));

      expect(result.verdict).toBe("FAIL");
      expect(result.severity).toBe("HIGH");
    });

    it("returns WARN with MEDIUM severity when currentHealthSignal is DEGRADED", () => {
      const contract = createEvaluationEngineContract();
      const result = contract.evaluate(makeModel({ currentHealthSignal: "DEGRADED", confidenceLevel: 0.9 }));

      expect(result.verdict).toBe("WARN");
      expect(result.severity).toBe("MEDIUM");
    });

    it("returns WARN with HIGH severity when healthTrajectory is DEGRADING", () => {
      const contract = createEvaluationEngineContract();
      const result = contract.evaluate(makeModel({ healthTrajectory: "DEGRADING", confidenceLevel: 0.9 }));

      expect(result.verdict).toBe("WARN");
      expect(result.severity).toBe("HIGH");
    });

    it("returns PASS with NONE severity when health is nominal and confidence >= 0.5", () => {
      const contract = createEvaluationEngineContract();
      const result = contract.evaluate(makeModel({ confidenceLevel: 0.8 }));

      expect(result.verdict).toBe("PASS");
      expect(result.severity).toBe("NONE");
    });

    it("produces stable evaluationHash with fixed time injection", () => {
      const fixedTime = "2026-03-22T10:00:00.000Z";
      const c1 = createEvaluationEngineContract({ now: () => fixedTime });
      const c2 = createEvaluationEngineContract({ now: () => fixedTime });
      const model = makeModel();

      expect(c1.evaluate(model).evaluationHash).toBe(c2.evaluate(model).evaluationHash);
    });

    it("creates EvaluationEngineContract via class constructor", () => {
      const contract = new EvaluationEngineContract();
      expect(contract).toBeInstanceOf(EvaluationEngineContract);
    });
  });

  // ─── W4-T3 CP2 — EvaluationThresholdContract ─────────────────────────────

  describe("W4-T3 CP2 — EvaluationThresholdContract", () => {
    function makeResult(verdict: EvaluationResult["verdict"], id = "r1"): EvaluationResult {
      return {
        resultId: id,
        evaluatedAt: "2026-03-22T10:00:00.000Z",
        sourceTruthModelId: "model-001",
        sourceTruthModelVersion: 1,
        verdict,
        severity: "NONE",
        confidenceLevel: 0.8,
        rationale: `Test result ${id}`,
        evaluationHash: `hash-${id}`,
      };
    }

    it("returns INSUFFICIENT_DATA for empty results", () => {
      const contract = createEvaluationThresholdContract();
      const assessment = contract.assess([]);

      expect(assessment.overallStatus).toBe("INSUFFICIENT_DATA");
      expect(assessment.totalVerdicts).toBe(0);
    });

    it("returns INSUFFICIENT_DATA when all results are INCONCLUSIVE", () => {
      const contract = createEvaluationThresholdContract();
      const assessment = contract.assess([
        makeResult("INCONCLUSIVE", "r1"),
        makeResult("INCONCLUSIVE", "r2"),
      ]);

      expect(assessment.overallStatus).toBe("INSUFFICIENT_DATA");
      expect(assessment.inconclusiveCount).toBe(2);
    });

    it("returns FAILING when any result has FAIL verdict", () => {
      const contract = createEvaluationThresholdContract();
      const assessment = contract.assess([
        makeResult("PASS", "r1"),
        makeResult("FAIL", "r2"),
        makeResult("WARN", "r3"),
      ]);

      expect(assessment.overallStatus).toBe("FAILING");
      expect(assessment.failCount).toBe(1);
    });

    it("returns WARNING when any WARN present and no FAIL", () => {
      const contract = createEvaluationThresholdContract();
      const assessment = contract.assess([
        makeResult("PASS", "r1"),
        makeResult("WARN", "r2"),
      ]);

      expect(assessment.overallStatus).toBe("WARNING");
      expect(assessment.warnCount).toBe(1);
    });

    it("returns PASSING when all results are PASS", () => {
      const contract = createEvaluationThresholdContract();
      const assessment = contract.assess([
        makeResult("PASS", "r1"),
        makeResult("PASS", "r2"),
        makeResult("PASS", "r3"),
      ]);

      expect(assessment.overallStatus).toBe("PASSING");
      expect(assessment.passCount).toBe(3);
    });

    it("produces stable assessmentHash with fixed time injection", () => {
      const fixedTime = "2026-03-22T10:00:00.000Z";
      const c1 = createEvaluationThresholdContract({ now: () => fixedTime });
      const c2 = createEvaluationThresholdContract({ now: () => fixedTime });
      const results = [makeResult("PASS", "r1"), makeResult("WARN", "r2")];

      expect(c1.assess(results).assessmentHash).toBe(c2.assess(results).assessmentHash);
    });

    it("creates EvaluationThresholdContract via class constructor", () => {
      const contract = new EvaluationThresholdContract();
      expect(contract).toBeInstanceOf(EvaluationThresholdContract);
    });
  });

  // ─── W4-T1 CP1 — FeedbackLedgerContract ─────────────────────────────────

  describe("W4-T1 CP1 — FeedbackLedgerContract", () => {
    it("compiles an empty ledger when no signals provided", () => {
      const contract = createFeedbackLedgerContract();
      const ledger = contract.compile([]);

      expect(ledger.totalRecords).toBe(0);
      expect(ledger.acceptCount).toBe(0);
      expect(ledger.retryCount).toBe(0);
      expect(ledger.escalateCount).toBe(0);
      expect(ledger.rejectCount).toBe(0);
      expect(ledger.records).toHaveLength(0);
    });

    it("counts each feedback class correctly", () => {
      const contract = createFeedbackLedgerContract();
      const signals = [
        makeSignal("ACCEPT", "s1"),
        makeSignal("ACCEPT", "s2"),
        makeSignal("RETRY", "s3"),
        makeSignal("ESCALATE", "s4"),
        makeSignal("REJECT", "s5"),
      ];
      const ledger = contract.compile(signals);

      expect(ledger.totalRecords).toBe(5);
      expect(ledger.acceptCount).toBe(2);
      expect(ledger.retryCount).toBe(1);
      expect(ledger.escalateCount).toBe(1);
      expect(ledger.rejectCount).toBe(1);
    });

    it("each record has a non-empty recordId", () => {
      const contract = createFeedbackLedgerContract();
      const ledger = contract.compile([makeSignal("ACCEPT", "s1"), makeSignal("RETRY", "s2")]);

      for (const record of ledger.records) {
        expect(record.recordId.length).toBeGreaterThan(0);
        expect(record.sourcePipelineId.length).toBeGreaterThan(0);
      }
    });

    it("produces stable ledgerHash for identical inputs with fixed time", () => {
      const fixedTime = "2026-03-22T10:00:00.000Z";
      const c1 = createFeedbackLedgerContract({ now: () => fixedTime });
      const c2 = createFeedbackLedgerContract({ now: () => fixedTime });
      const signals = [makeSignal("ACCEPT", "s1"), makeSignal("ESCALATE", "s2")];

      expect(c1.compile(signals).ledgerHash).toBe(c2.compile(signals).ledgerHash);
    });

    it("ledgerId is non-empty and distinct from ledgerHash", () => {
      const contract = createFeedbackLedgerContract();
      const ledger = contract.compile([makeSignal("ACCEPT", "s1")]);

      expect(ledger.ledgerId.length).toBeGreaterThan(0);
      expect(ledger.ledgerId).not.toBe(ledger.ledgerHash);
    });

    it("preserves feedbackClass and priority in records", () => {
      const contract = createFeedbackLedgerContract();
      const ledger = contract.compile([makeSignal("ESCALATE", "s1")]);

      expect(ledger.records[0].feedbackClass).toBe("ESCALATE");
      expect(ledger.records[0].priority).toBe("critical");
    });

    it("creates FeedbackLedgerContract via class constructor", () => {
      const contract = new FeedbackLedgerContract();
      expect(contract).toBeInstanceOf(FeedbackLedgerContract);
    });
  });

  // ─── W4-T1 CP2 — PatternDetectionContract ───────────────────────────────

  describe("W4-T1 CP2 — PatternDetectionContract", () => {
    function makeLedger(
      acceptCount: number,
      retryCount: number,
      escalateCount: number,
      rejectCount: number,
    ) {
      const fixedTime = "2026-03-22T10:00:00.000Z";
      const contract = createFeedbackLedgerContract({ now: () => fixedTime });
      const signals: LearningFeedbackInput[] = [
        ...Array.from({ length: acceptCount }, (_, i) => makeSignal("ACCEPT", `a${i}`)),
        ...Array.from({ length: retryCount }, (_, i) => makeSignal("RETRY", `r${i}`)),
        ...Array.from({ length: escalateCount }, (_, i) => makeSignal("ESCALATE", `e${i}`)),
        ...Array.from({ length: rejectCount }, (_, i) => makeSignal("REJECT", `rj${i}`)),
      ];
      return contract.compile(signals);
    }

    it("returns EMPTY dominantPattern and HEALTHY signal for empty ledger", () => {
      const contract = createPatternDetectionContract();
      const ledger = makeLedger(0, 0, 0, 0);
      const insight = contract.analyze(ledger);

      expect(insight.dominantPattern).toBe("EMPTY");
      expect(insight.healthSignal).toBe("HEALTHY");
    });

    it("detects ACCEPT as dominant pattern with HEALTHY signal", () => {
      const contract = createPatternDetectionContract();
      const ledger = makeLedger(8, 1, 1, 0);
      const insight = contract.analyze(ledger);

      expect(insight.dominantPattern).toBe("ACCEPT");
      expect(insight.healthSignal).toBe("HEALTHY");
    });

    it("detects ESCALATE as dominant and DEGRADED health", () => {
      const contract = createPatternDetectionContract();
      const ledger = makeLedger(2, 1, 4, 0);
      const insight = contract.analyze(ledger);

      expect(insight.dominantPattern).toBe("ESCALATE");
      expect(insight.healthSignal).toBe("DEGRADED");
    });

    it("returns CRITICAL health when any rejects exist", () => {
      const contract = createPatternDetectionContract();
      const ledger = makeLedger(3, 2, 2, 1);
      const insight = contract.analyze(ledger);

      expect(insight.healthSignal).toBe("CRITICAL");
    });

    it("returns CRITICAL health when escalate+reject rate >= 0.6", () => {
      const contract = createPatternDetectionContract();
      const ledger = makeLedger(1, 0, 5, 0);
      const insight = contract.analyze(ledger);

      expect(insight.healthSignal).toBe("CRITICAL");
    });

    it("returns MIXED pattern when two classes are tied", () => {
      const contract = createPatternDetectionContract();
      const ledger = makeLedger(3, 3, 0, 0);
      const insight = contract.analyze(ledger);

      expect(insight.dominantPattern).toBe("MIXED");
    });

    it("produces non-empty summary string", () => {
      const contract = createPatternDetectionContract();
      const ledger = makeLedger(5, 1, 1, 0);
      const insight = contract.analyze(ledger);

      expect(insight.summary.length).toBeGreaterThan(0);
      expect(insight.summary).toContain("HEALTHY");
    });

    it("produces stable insightHash for identical inputs with fixed time", () => {
      const fixedTime = "2026-03-22T10:00:00.000Z";
      const d1 = createPatternDetectionContract({ now: () => fixedTime });
      const d2 = createPatternDetectionContract({ now: () => fixedTime });
      const ledger = makeLedger(5, 1, 1, 0);

      expect(d1.analyze(ledger).insightHash).toBe(d2.analyze(ledger).insightHash);
    });

    it("accepts injectable classifyHealth override", () => {
      const contract = createPatternDetectionContract({
        classifyHealth: () => "CRITICAL",
      });
      const ledger = makeLedger(10, 0, 0, 0);
      const insight = contract.analyze(ledger);

      expect(insight.healthSignal).toBe("CRITICAL");
    });

    it("accept/retry/escalate/reject rates sum to approximately 1.0 for non-empty ledger", () => {
      const contract = createPatternDetectionContract();
      const ledger = makeLedger(5, 2, 2, 1);
      const insight = contract.analyze(ledger);

      const total = insight.acceptRate + insight.retryRate + insight.escalateRate + insight.rejectRate;
      expect(total).toBeCloseTo(1.0, 1);
    });

    it("creates PatternDetectionContract via class constructor", () => {
      const contract = new PatternDetectionContract();
      expect(contract).toBeInstanceOf(PatternDetectionContract);
    });
  });
});
