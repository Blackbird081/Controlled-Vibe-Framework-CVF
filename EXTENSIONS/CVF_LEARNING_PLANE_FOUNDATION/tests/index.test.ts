import { describe, expect, it } from "vitest";
import {
  LEARNING_PLANE_FOUNDATION_COORDINATION,
  FeedbackLedgerContract,
  createFeedbackLedgerContract,
  PatternDetectionContract,
  createPatternDetectionContract,
} from "../src/index";
import type { LearningFeedbackInput } from "../src/index";

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
