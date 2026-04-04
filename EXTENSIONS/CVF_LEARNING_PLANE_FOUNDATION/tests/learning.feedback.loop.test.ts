/**
 * LPF Feedback Loop — Dedicated Tests (W6-T15)
 * ==============================================
 * GC-023: dedicated file — never merge into index.test.ts.
 *
 * Coverage:
 *   LearningReinjectionContract.reinject:
 *     - ESCALATE signal → feedbackClass REJECT, priority critical, boost 0
 *     - TRIGGER_REVIEW signal → feedbackClass ESCALATE, priority critical, boost 0
 *     - MONITOR signal → feedbackClass RETRY, priority low, boost 0.05
 *     - NO_ACTION signal → feedbackClass ACCEPT, priority low, boost 0.1
 *     - sourceSignalId and sourceSignalType propagated
 *     - feedbackInput.feedbackId === signal.signalId
 *     - feedbackInput.sourcePipelineId === signal.sourceAssessmentId
 *     - custom mapSignal override is respected
 *     - reinjectionHash and reinjectionId are deterministic
 *     - reinjectedAt is set to injected now()
 *     - factory createLearningReinjectionContract returns working instance
 *
 *   LearningLoopContract.summarize:
 *     - empty input → ACCEPT dominant, zero counts
 *     - ESCALATE signal → rejectCount++ (mapped via reinjector)
 *     - TRIGGER_REVIEW signal → escalateCount++ (mapped via reinjector)
 *     - MONITOR signal → retryCount++ (mapped via reinjector)
 *     - NO_ACTION signal → acceptCount++ (mapped via reinjector)
 *     - dominantFeedbackClass is severity-first: any REJECT wins regardless of count
 *     - ESCALATE dominates over RETRY and ACCEPT (when no REJECT)
 *     - RETRY dominates over ACCEPT (when no REJECT or ESCALATE)
 *     - all NO_ACTION → ACCEPT dominant
 *     - totalSignals equals input length
 *     - summary for empty indicates no signals
 *     - summary for non-empty contains dominant and breakdown
 *     - summaryHash and summaryId are deterministic
 *     - createdAt is set to injected now()
 *     - factory createLearningLoopContract returns working instance
 *
 *   FeedbackLedgerContract.compile:
 *     - empty input → empty records, zero counts
 *     - totalRecords equals input length
 *     - records are built for each signal (feedbackClass, priority, confidenceBoost)
 *     - counts each feedbackClass correctly
 *     - record.recordedAt equals compiledAt
 *     - record.sourcePipelineId propagated from feedbackInput
 *     - record.recordId is deterministic for same signal fields
 *     - different feedbackId → different recordId
 *     - ledgerHash and ledgerId are deterministic
 *     - compiledAt is set to injected now()
 *     - factory createFeedbackLedgerContract returns working instance
 */

import { describe, it, expect } from "vitest";

import {
  LearningReinjectionContract,
  createLearningReinjectionContract,
} from "../src/learning.reinjection.contract";

import {
  LearningLoopContract,
  createLearningLoopContract,
} from "../src/learning.loop.contract";

import {
  FeedbackLedgerContract,
  createFeedbackLedgerContract,
} from "../src/feedback.ledger.contract";
import type { LearningFeedbackInput } from "../src/feedback.ledger.contract";

import type { GovernanceSignal, GovernanceSignalType } from "../src/governance.signal.contract";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-03-23T20:00:00.000Z";
const fixedNow = () => FIXED_NOW;

let _sigSeq = 0;
function makeSignal(signalType: GovernanceSignalType): GovernanceSignal {
  const n = ++_sigSeq;
  return {
    signalId: `sig-${n}`,
    issuedAt: FIXED_NOW,
    sourceAssessmentId: `assess-${n}`,
    sourceOverallStatus: "PASSING",
    signalType,
    urgency: "LOW",
    recommendation: `rec-${n}`,
    signalHash: `hash-sig-${n}`,
  };
}

let _fbSeq = 0;
function makeFeedbackInput(
  feedbackClass: LearningFeedbackInput["feedbackClass"],
  overrides: Partial<LearningFeedbackInput> = {},
): LearningFeedbackInput {
  const n = ++_fbSeq;
  return {
    feedbackId: `fb-${n}`,
    sourcePipelineId: `pipe-${n}`,
    feedbackClass,
    priority: overrides.priority ?? "low",
    confidenceBoost: overrides.confidenceBoost ?? 0,
    ...overrides,
  };
}

// ─── LearningReinjectionContract ──────────────────────────────────────────────

describe("LearningReinjectionContract.reinject", () => {
  const contract = new LearningReinjectionContract({ now: fixedNow });

  describe("signal type mapping", () => {
    it("ESCALATE signal → feedbackClass REJECT, priority critical, boost 0", () => {
      const result = contract.reinject(makeSignal("ESCALATE"));
      expect(result.feedbackInput.feedbackClass).toBe("REJECT");
      expect(result.feedbackInput.priority).toBe("critical");
      expect(result.feedbackInput.confidenceBoost).toBe(0);
    });

    it("TRIGGER_REVIEW signal → feedbackClass ESCALATE, priority critical, boost 0", () => {
      const result = contract.reinject(makeSignal("TRIGGER_REVIEW"));
      expect(result.feedbackInput.feedbackClass).toBe("ESCALATE");
      expect(result.feedbackInput.priority).toBe("critical");
      expect(result.feedbackInput.confidenceBoost).toBe(0);
    });

    it("MONITOR signal → feedbackClass RETRY, priority low, boost 0.05", () => {
      const result = contract.reinject(makeSignal("MONITOR"));
      expect(result.feedbackInput.feedbackClass).toBe("RETRY");
      expect(result.feedbackInput.priority).toBe("low");
      expect(result.feedbackInput.confidenceBoost).toBe(0.05);
    });

    it("NO_ACTION signal → feedbackClass ACCEPT, priority low, boost 0.1", () => {
      const result = contract.reinject(makeSignal("NO_ACTION"));
      expect(result.feedbackInput.feedbackClass).toBe("ACCEPT");
      expect(result.feedbackInput.priority).toBe("low");
      expect(result.feedbackInput.confidenceBoost).toBe(0.1);
    });
  });

  it("sourceSignalId and sourceSignalType are propagated", () => {
    const signal = makeSignal("MONITOR");
    const result = contract.reinject(signal);
    expect(result.sourceSignalId).toBe(signal.signalId);
    expect(result.sourceSignalType).toBe("MONITOR");
  });

  it("feedbackInput.feedbackId equals signal.signalId", () => {
    const signal = makeSignal("NO_ACTION");
    expect(contract.reinject(signal).feedbackInput.feedbackId).toBe(signal.signalId);
  });

  it("feedbackInput.sourcePipelineId equals signal.sourceAssessmentId", () => {
    const signal = makeSignal("ESCALATE");
    expect(contract.reinject(signal).feedbackInput.sourcePipelineId).toBe(signal.sourceAssessmentId);
  });

  it("custom mapSignal override is respected", () => {
    const custom = new LearningReinjectionContract({
      now: fixedNow,
      mapSignal: (sig) => ({
        feedbackId: sig.signalId,
        sourcePipelineId: sig.sourceAssessmentId,
        feedbackClass: "ACCEPT",
        priority: "high",
        confidenceBoost: 0.99,
      }),
    });
    const result = custom.reinject(makeSignal("ESCALATE"));
    expect(result.feedbackInput.feedbackClass).toBe("ACCEPT");
    expect(result.feedbackInput.confidenceBoost).toBe(0.99);
  });

  it("reinjectionHash and reinjectionId are deterministic for same inputs and timestamp", () => {
    const signal = makeSignal("MONITOR");
    const r1 = contract.reinject(signal);
    const r2 = contract.reinject(signal);
    expect(r1.reinjectionHash).toBe(r2.reinjectionHash);
    expect(r1.reinjectionId).toBe(r2.reinjectionId);
  });

  it("reinjectedAt is set to injected now()", () => {
    expect(contract.reinject(makeSignal("NO_ACTION")).reinjectedAt).toBe(FIXED_NOW);
  });

  it("factory createLearningReinjectionContract returns working instance", () => {
    const c = createLearningReinjectionContract({ now: fixedNow });
    const result = c.reinject(makeSignal("NO_ACTION"));
    expect(result.feedbackInput.feedbackClass).toBe("ACCEPT");
    expect(result.reinjectedAt).toBe(FIXED_NOW);
  });
});

// ─── LearningLoopContract ─────────────────────────────────────────────────────

describe("LearningLoopContract.summarize", () => {
  const contract = new LearningLoopContract({ now: fixedNow });

  it("empty input → ACCEPT dominant, all counts zero", () => {
    const result = contract.summarize([]);
    expect(result.totalSignals).toBe(0);
    expect(result.dominantFeedbackClass).toBe("ACCEPT");
    expect(result.rejectCount).toBe(0);
    expect(result.escalateCount).toBe(0);
    expect(result.retryCount).toBe(0);
    expect(result.acceptCount).toBe(0);
  });

  describe("signal → feedbackClass mapping via reinjector", () => {
    it("ESCALATE signal → rejectCount incremented", () => {
      expect(contract.summarize([makeSignal("ESCALATE")]).rejectCount).toBe(1);
    });

    it("TRIGGER_REVIEW signal → escalateCount incremented", () => {
      expect(contract.summarize([makeSignal("TRIGGER_REVIEW")]).escalateCount).toBe(1);
    });

    it("MONITOR signal → retryCount incremented", () => {
      expect(contract.summarize([makeSignal("MONITOR")]).retryCount).toBe(1);
    });

    it("NO_ACTION signal → acceptCount incremented", () => {
      expect(contract.summarize([makeSignal("NO_ACTION")]).acceptCount).toBe(1);
    });
  });

  describe("dominantFeedbackClass — severity-first (not count-wins)", () => {
    it("REJECT dominates even when outnumbered (1 ESCALATE vs 3 NO_ACTION)", () => {
      const signals = [
        makeSignal("NO_ACTION"),
        makeSignal("NO_ACTION"),
        makeSignal("NO_ACTION"),
        makeSignal("ESCALATE"), // → REJECT feedbackClass
      ];
      expect(contract.summarize(signals).dominantFeedbackClass).toBe("REJECT");
    });

    it("ESCALATE dominates over RETRY and ACCEPT (when no REJECT)", () => {
      const signals = [
        makeSignal("MONITOR"),    // → RETRY
        makeSignal("MONITOR"),    // → RETRY
        makeSignal("TRIGGER_REVIEW"), // → ESCALATE
      ];
      expect(contract.summarize(signals).dominantFeedbackClass).toBe("ESCALATE");
    });

    it("RETRY dominates over ACCEPT (when no REJECT or ESCALATE)", () => {
      const signals = [
        makeSignal("NO_ACTION"), // → ACCEPT
        makeSignal("NO_ACTION"), // → ACCEPT
        makeSignal("MONITOR"),   // → RETRY
      ];
      expect(contract.summarize(signals).dominantFeedbackClass).toBe("RETRY");
    });

    it("all NO_ACTION → ACCEPT dominant", () => {
      const signals = [makeSignal("NO_ACTION"), makeSignal("NO_ACTION")];
      expect(contract.summarize(signals).dominantFeedbackClass).toBe("ACCEPT");
    });
  });

  it("totalSignals equals input length", () => {
    const signals = [makeSignal("ESCALATE"), makeSignal("MONITOR"), makeSignal("NO_ACTION")];
    expect(contract.summarize(signals).totalSignals).toBe(3);
  });

  it("summary for empty indicates no signals", () => {
    expect(contract.summarize([]).summary).toContain("no signals");
  });

  it("summary for non-empty contains dominant feedbackClass and breakdown", () => {
    const signals = [makeSignal("ESCALATE"), makeSignal("NO_ACTION")];
    const result = contract.summarize(signals);
    expect(result.summary).toContain("REJECT");
    expect(result.summary).toContain("reject=1");
  });

  it("summaryHash and summaryId are deterministic for same inputs and timestamp", () => {
    const signals = [makeSignal("MONITOR"), makeSignal("NO_ACTION")];
    const r1 = contract.summarize(signals);
    const r2 = contract.summarize(signals);
    expect(r1.summaryHash).toBe(r2.summaryHash);
    expect(r1.summaryId).toBe(r2.summaryId);
  });

  it("createdAt is set to injected now()", () => {
    expect(contract.summarize([]).createdAt).toBe(FIXED_NOW);
  });

  it("factory createLearningLoopContract returns working instance", () => {
    const c = createLearningLoopContract({ now: fixedNow });
    const result = c.summarize([]);
    expect(result.dominantFeedbackClass).toBe("ACCEPT");
    expect(result.createdAt).toBe(FIXED_NOW);
  });
});

// ─── FeedbackLedgerContract ───────────────────────────────────────────────────

describe("FeedbackLedgerContract.compile", () => {
  const contract = new FeedbackLedgerContract({ now: fixedNow });

  it("empty input → empty records, zero counts", () => {
    const result = contract.compile([]);
    expect(result.totalRecords).toBe(0);
    expect(result.records).toHaveLength(0);
    expect(result.acceptCount).toBe(0);
    expect(result.retryCount).toBe(0);
    expect(result.escalateCount).toBe(0);
    expect(result.rejectCount).toBe(0);
  });

  it("totalRecords equals input length", () => {
    const inputs = [
      makeFeedbackInput("ACCEPT"),
      makeFeedbackInput("RETRY"),
      makeFeedbackInput("REJECT"),
    ];
    expect(contract.compile(inputs).totalRecords).toBe(3);
  });

  it("records carry feedbackClass, priority, confidenceBoost from input", () => {
    const input = makeFeedbackInput("ESCALATE", { priority: "high", confidenceBoost: 0.2 });
    const result = contract.compile([input]);
    expect(result.records[0].feedbackClass).toBe("ESCALATE");
    expect(result.records[0].priority).toBe("high");
    expect(result.records[0].confidenceBoost).toBe(0.2);
  });

  it("counts each feedbackClass correctly", () => {
    const inputs = [
      makeFeedbackInput("ACCEPT"),
      makeFeedbackInput("RETRY"),
      makeFeedbackInput("RETRY"),
      makeFeedbackInput("ESCALATE"),
      makeFeedbackInput("REJECT"),
    ];
    const result = contract.compile(inputs);
    expect(result.acceptCount).toBe(1);
    expect(result.retryCount).toBe(2);
    expect(result.escalateCount).toBe(1);
    expect(result.rejectCount).toBe(1);
  });

  it("record.recordedAt equals compiledAt (injected now)", () => {
    const input = makeFeedbackInput("ACCEPT");
    const result = contract.compile([input]);
    expect(result.records[0].recordedAt).toBe(FIXED_NOW);
  });

  it("record.sourcePipelineId is propagated from feedbackInput", () => {
    const input = { ...makeFeedbackInput("ACCEPT"), sourcePipelineId: "pipe-special" };
    const result = contract.compile([input]);
    expect(result.records[0].sourcePipelineId).toBe("pipe-special");
  });

  it("record.recordId is deterministic for same feedbackId + sourcePipelineId + feedbackClass", () => {
    const input = makeFeedbackInput("RETRY");
    const r1 = contract.compile([input]);
    const r2 = contract.compile([input]);
    expect(r1.records[0].recordId).toBe(r2.records[0].recordId);
  });

  it("different feedbackId → different recordId", () => {
    const i1 = makeFeedbackInput("ACCEPT");
    const i2 = makeFeedbackInput("ACCEPT");
    const r1 = contract.compile([i1]);
    const r2 = contract.compile([i2]);
    expect(r1.records[0].recordId).not.toBe(r2.records[0].recordId);
  });

  it("ledgerHash and ledgerId are deterministic for same inputs and timestamp", () => {
    const inputs = [makeFeedbackInput("ACCEPT"), makeFeedbackInput("REJECT")];
    const r1 = contract.compile(inputs);
    const r2 = contract.compile(inputs);
    expect(r1.ledgerHash).toBe(r2.ledgerHash);
    expect(r1.ledgerId).toBe(r2.ledgerId);
  });

  it("compiledAt is set to injected now()", () => {
    expect(contract.compile([]).compiledAt).toBe(FIXED_NOW);
  });

  it("factory createFeedbackLedgerContract returns working instance", () => {
    const c = createFeedbackLedgerContract({ now: fixedNow });
    const result = c.compile([]);
    expect(result.totalRecords).toBe(0);
    expect(result.compiledAt).toBe(FIXED_NOW);
  });
});
