/**
 * LPF Truth Model & Pattern Detection — Dedicated Tests (W6-T16)
 * ================================================================
 * GC-023: dedicated file — never merge into index.test.ts.
 *
 * Coverage:
 *   PatternDetectionContract.analyze:
 *     - empty ledger → EMPTY dominant, HEALTHY health, zero rates
 *     - dominantPattern: most frequent feedbackClass wins
 *     - dominantPattern: tie → MIXED
 *     - health CRITICAL when rejectRate > 0
 *     - health CRITICAL when badRate (escalate+reject) >= 0.6
 *     - health DEGRADED when badRate >= 0.3 (no reject)
 *     - health HEALTHY when badRate < 0.3 (no reject)
 *     - rates computed and rounded to 2dp
 *     - summary contains dominant pattern and health
 *     - summary for empty ledger indicates no feedback
 *     - sourceLedgerId propagated from ledger.ledgerId
 *     - custom classifyHealth override is respected
 *     - insightHash and insightId are deterministic
 *     - analyzedAt is set to injected now()
 *     - factory createPatternDetectionContract returns working instance
 *
 *   TruthModelContract.build:
 *     - empty insights → EMPTY dominant, HEALTHY health, UNKNOWN trajectory, version 1
 *     - totalInsightsProcessed equals input length
 *     - currentHealthSignal equals last insight's healthSignal
 *     - dominantPattern from history (most frequent, MIXED on tie, skips MIXED/EMPTY)
 *     - healthTrajectory UNKNOWN when < 2 insights
 *     - healthTrajectory IMPROVING/DEGRADING/STABLE from first/last severity
 *     - confidenceLevel capped at 1.0 (min(total/10, 1))
 *     - patternHistory entries carry correct dominantPattern and healthSignal
 *     - custom computeConfidence override is respected
 *     - modelHash and modelId are deterministic
 *     - createdAt is set to injected now()
 *     - factory createTruthModelContract returns working instance
 *
 *   TruthModelUpdateContract.update:
 *     - version incremented by 1
 *     - totalInsightsProcessed incremented by 1
 *     - new entry appended to patternHistory
 *     - currentHealthSignal updated to new insight's healthSignal
 *     - healthTrajectory recomputed from full history
 *     - dominantPattern recomputed from full history
 *     - confidenceLevel recomputed (min((n+1)/10, 1))
 *     - modelId and modelHash change on each update (distinct from original)
 *     - factory createTruthModelUpdateContract returns working instance
 */

import { describe, it, expect } from "vitest";

import {
  PatternDetectionContract,
  createPatternDetectionContract,
} from "../src/pattern.detection.contract";

import {
  TruthModelContract,
  createTruthModelContract,
} from "../src/truth.model.contract";

import {
  TruthModelUpdateContract,
  createTruthModelUpdateContract,
} from "../src/truth.model.update.contract";

import type { FeedbackLedger } from "../src/feedback.ledger.contract";
import type { PatternInsight, HealthSignal, DominantPattern } from "../src/pattern.detection.contract";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-03-23T21:00:00.000Z";
const fixedNow = () => FIXED_NOW;

let _ledgerSeq = 0;
function makeLedger(
  acceptCount: number,
  retryCount: number,
  escalateCount: number,
  rejectCount: number,
): FeedbackLedger {
  const n = ++_ledgerSeq;
  const totalRecords = acceptCount + retryCount + escalateCount + rejectCount;
  return {
    ledgerId: `ledger-${n}`,
    compiledAt: FIXED_NOW,
    records: [],
    totalRecords,
    acceptCount,
    retryCount,
    escalateCount,
    rejectCount,
    ledgerHash: `hash-ledger-${n}`,
  };
}

let _insightSeq = 0;
function makeInsight(
  dominantPattern: DominantPattern,
  healthSignal: HealthSignal,
): PatternInsight {
  const n = ++_insightSeq;
  return {
    insightId: `insight-${n}`,
    analyzedAt: FIXED_NOW,
    sourceLedgerId: `ledger-${n}`,
    dominantPattern,
    acceptRate: 0,
    retryRate: 0,
    escalateRate: 0,
    rejectRate: 0,
    healthSignal,
    summary: `pattern=${dominantPattern} health=${healthSignal}`,
    insightHash: `hash-insight-${n}`,
  };
}

// ─── PatternDetectionContract ─────────────────────────────────────────────────

describe("PatternDetectionContract.analyze", () => {
  const contract = new PatternDetectionContract({ now: fixedNow });

  it("empty ledger → EMPTY dominant, HEALTHY health, zero rates", () => {
    const result = contract.analyze(makeLedger(0, 0, 0, 0));
    expect(result.dominantPattern).toBe("EMPTY");
    expect(result.healthSignal).toBe("HEALTHY");
    expect(result.acceptRate).toBe(0);
    expect(result.retryRate).toBe(0);
    expect(result.escalateRate).toBe(0);
    expect(result.rejectRate).toBe(0);
  });

  describe("dominantPattern derivation", () => {
    it("most frequent feedbackClass wins (ACCEPT wins when majority)", () => {
      const result = contract.analyze(makeLedger(3, 1, 0, 0));
      expect(result.dominantPattern).toBe("ACCEPT");
    });

    it("REJECT wins when highest count", () => {
      const result = contract.analyze(makeLedger(0, 0, 1, 3));
      expect(result.dominantPattern).toBe("REJECT");
    });

    it("MIXED when two classes tie for highest count", () => {
      // ACCEPT=2, RETRY=2 → MIXED
      const result = contract.analyze(makeLedger(2, 2, 0, 0));
      expect(result.dominantPattern).toBe("MIXED");
    });

    it("MIXED when all four classes equal", () => {
      const result = contract.analyze(makeLedger(1, 1, 1, 1));
      expect(result.dominantPattern).toBe("MIXED");
    });

    it("ESCALATE wins when highest", () => {
      const result = contract.analyze(makeLedger(1, 0, 3, 0));
      expect(result.dominantPattern).toBe("ESCALATE");
    });
  });

  describe("health classification", () => {
    it("CRITICAL when rejectRate > 0", () => {
      // 1 reject out of 10 → rejectRate=0.1 > 0 → CRITICAL
      const result = contract.analyze(makeLedger(9, 0, 0, 1));
      expect(result.healthSignal).toBe("CRITICAL");
    });

    it("CRITICAL when badRate (escalate+reject) >= 0.6", () => {
      // 6 escalate out of 10 → escalateRate=0.6 → badRate=0.6 → CRITICAL
      const result = contract.analyze(makeLedger(4, 0, 6, 0));
      expect(result.healthSignal).toBe("CRITICAL");
    });

    it("DEGRADED when badRate >= 0.3 and < 0.6 (no reject)", () => {
      // 3 escalate out of 10 → escalateRate=0.3 → badRate=0.3 → DEGRADED
      const result = contract.analyze(makeLedger(7, 0, 3, 0));
      expect(result.healthSignal).toBe("DEGRADED");
    });

    it("HEALTHY when badRate < 0.3 and no reject", () => {
      // 2 escalate out of 10 → escalateRate=0.2 → badRate=0.2 → HEALTHY
      const result = contract.analyze(makeLedger(8, 0, 2, 0));
      expect(result.healthSignal).toBe("HEALTHY");
    });

    it("HEALTHY for all-ACCEPT ledger", () => {
      const result = contract.analyze(makeLedger(5, 0, 0, 0));
      expect(result.healthSignal).toBe("HEALTHY");
    });
  });

  it("rates summed to ~1.0 for non-empty ledger", () => {
    const result = contract.analyze(makeLedger(5, 3, 1, 1));
    const total = result.acceptRate + result.retryRate + result.escalateRate + result.rejectRate;
    expect(total).toBeCloseTo(1.0, 1);
  });

  it("summary for empty ledger indicates no feedback", () => {
    expect(contract.analyze(makeLedger(0, 0, 0, 0)).summary).toContain("No feedback");
  });

  it("summary for non-empty contains dominant pattern and health", () => {
    const result = contract.analyze(makeLedger(3, 0, 0, 0));
    expect(result.summary).toContain("ACCEPT");
    expect(result.summary).toContain("HEALTHY");
  });

  it("sourceLedgerId propagated from ledger.ledgerId", () => {
    const ledger = makeLedger(3, 0, 0, 0);
    expect(contract.analyze(ledger).sourceLedgerId).toBe(ledger.ledgerId);
  });

  it("custom classifyHealth override is respected", () => {
    const custom = new PatternDetectionContract({
      now: fixedNow,
      classifyHealth: () => "CRITICAL",
    });
    const result = custom.analyze(makeLedger(10, 0, 0, 0));
    expect(result.healthSignal).toBe("CRITICAL");
  });

  it("insightHash and insightId are deterministic for same inputs and timestamp", () => {
    const ledger = makeLedger(4, 1, 0, 0);
    const r1 = contract.analyze(ledger);
    const r2 = contract.analyze(ledger);
    expect(r1.insightHash).toBe(r2.insightHash);
    expect(r1.insightId).toBe(r2.insightId);
  });

  it("analyzedAt is set to injected now()", () => {
    expect(contract.analyze(makeLedger(1, 0, 0, 0)).analyzedAt).toBe(FIXED_NOW);
  });

  it("factory createPatternDetectionContract returns working instance", () => {
    const c = createPatternDetectionContract({ now: fixedNow });
    const result = c.analyze(makeLedger(0, 0, 0, 0));
    expect(result.dominantPattern).toBe("EMPTY");
    expect(result.analyzedAt).toBe(FIXED_NOW);
  });
});

// ─── TruthModelContract ───────────────────────────────────────────────────────

describe("TruthModelContract.build", () => {
  const contract = new TruthModelContract({ now: fixedNow });

  it("empty insights → EMPTY dominant, HEALTHY health, UNKNOWN trajectory, version 1", () => {
    const result = contract.build([]);
    expect(result.dominantPattern).toBe("EMPTY");
    expect(result.currentHealthSignal).toBe("HEALTHY");
    expect(result.healthTrajectory).toBe("UNKNOWN");
    expect(result.version).toBe(1);
    expect(result.totalInsightsProcessed).toBe(0);
    expect(result.confidenceLevel).toBe(0);
  });

  it("totalInsightsProcessed equals input length", () => {
    const insights = [makeInsight("ACCEPT", "HEALTHY"), makeInsight("ACCEPT", "HEALTHY")];
    expect(contract.build(insights).totalInsightsProcessed).toBe(2);
  });

  it("currentHealthSignal equals last insight's healthSignal", () => {
    const insights = [
      makeInsight("ACCEPT", "HEALTHY"),
      makeInsight("RETRY", "CRITICAL"),
    ];
    expect(contract.build(insights).currentHealthSignal).toBe("CRITICAL");
  });

  describe("dominantPattern from history", () => {
    it("ACCEPT dominant when all insights have ACCEPT pattern", () => {
      const insights = [makeInsight("ACCEPT", "HEALTHY"), makeInsight("ACCEPT", "HEALTHY")];
      expect(contract.build(insights).dominantPattern).toBe("ACCEPT");
    });

    it("MIXED when two patterns tie", () => {
      const insights = [makeInsight("ACCEPT", "HEALTHY"), makeInsight("RETRY", "DEGRADED")];
      expect(contract.build(insights).dominantPattern).toBe("MIXED");
    });

    it("MIXED entries in history are skipped for dominant calculation", () => {
      // 2 ACCEPT, 1 MIXED (skipped) → ACCEPT wins
      const insights = [
        makeInsight("ACCEPT", "HEALTHY"),
        makeInsight("MIXED", "DEGRADED"),
        makeInsight("ACCEPT", "HEALTHY"),
      ];
      expect(contract.build(insights).dominantPattern).toBe("ACCEPT");
    });

    it("EMPTY pattern entries are skipped for dominant calculation", () => {
      const insights = [
        makeInsight("EMPTY", "HEALTHY"),
        makeInsight("RETRY", "DEGRADED"),
      ];
      // EMPTY skipped → only RETRY remains → RETRY
      expect(contract.build(insights).dominantPattern).toBe("RETRY");
    });
  });

  describe("healthTrajectory", () => {
    it("UNKNOWN for single insight", () => {
      expect(contract.build([makeInsight("ACCEPT", "HEALTHY")]).healthTrajectory).toBe("UNKNOWN");
    });

    it("IMPROVING when last healthSignal is better (CRITICAL→HEALTHY)", () => {
      const insights = [makeInsight("ACCEPT", "CRITICAL"), makeInsight("ACCEPT", "HEALTHY")];
      expect(contract.build(insights).healthTrajectory).toBe("IMPROVING");
    });

    it("DEGRADING when last healthSignal is worse (HEALTHY→CRITICAL)", () => {
      const insights = [makeInsight("ACCEPT", "HEALTHY"), makeInsight("ACCEPT", "CRITICAL")];
      expect(contract.build(insights).healthTrajectory).toBe("DEGRADING");
    });

    it("STABLE when first and last healthSignals are equal", () => {
      const insights = [
        makeInsight("ACCEPT", "HEALTHY"),
        makeInsight("RETRY", "DEGRADED"),
        makeInsight("ACCEPT", "HEALTHY"),
      ];
      expect(contract.build(insights).healthTrajectory).toBe("STABLE");
    });
  });

  it("confidenceLevel = min(total/10, 1.0) — capped at 1.0 for >= 10 insights", () => {
    const fiveInsights = Array.from({ length: 5 }, () => makeInsight("ACCEPT", "HEALTHY"));
    expect(contract.build(fiveInsights).confidenceLevel).toBeCloseTo(0.5);

    const tenInsights = Array.from({ length: 10 }, () => makeInsight("ACCEPT", "HEALTHY"));
    expect(contract.build(tenInsights).confidenceLevel).toBe(1.0);

    const twelveInsights = Array.from({ length: 12 }, () => makeInsight("ACCEPT", "HEALTHY"));
    expect(contract.build(twelveInsights).confidenceLevel).toBe(1.0);
  });

  it("patternHistory has same length as insights input", () => {
    const insights = [makeInsight("ACCEPT", "HEALTHY"), makeInsight("RETRY", "DEGRADED")];
    expect(contract.build(insights).patternHistory).toHaveLength(2);
  });

  it("history entries carry correct dominantPattern and healthSignal", () => {
    const insights = [makeInsight("ESCALATE", "CRITICAL")];
    const model = contract.build(insights);
    expect(model.patternHistory[0].dominantPattern).toBe("ESCALATE");
    expect(model.patternHistory[0].healthSignal).toBe("CRITICAL");
  });

  it("custom computeConfidence override is respected", () => {
    const custom = new TruthModelContract({
      now: fixedNow,
      computeConfidence: () => 0.42,
    });
    const insights = [makeInsight("ACCEPT", "HEALTHY")];
    expect(custom.build(insights).confidenceLevel).toBe(0.42);
  });

  it("modelHash and modelId are deterministic for same inputs and timestamp", () => {
    const insights = [makeInsight("ACCEPT", "HEALTHY")];
    const r1 = contract.build(insights);
    const r2 = contract.build(insights);
    expect(r1.modelHash).toBe(r2.modelHash);
    expect(r1.modelId).toBe(r2.modelId);
  });

  it("createdAt is set to injected now()", () => {
    expect(contract.build([]).createdAt).toBe(FIXED_NOW);
  });

  it("factory createTruthModelContract returns working instance", () => {
    const c = createTruthModelContract({ now: fixedNow });
    const result = c.build([]);
    expect(result.version).toBe(1);
    expect(result.createdAt).toBe(FIXED_NOW);
  });
});

// ─── TruthModelUpdateContract ─────────────────────────────────────────────────

describe("TruthModelUpdateContract.update", () => {
  const buildContract = new TruthModelContract({ now: fixedNow });
  const updateContract = new TruthModelUpdateContract({ now: fixedNow });

  function buildBase(insights: PatternInsight[] = []) {
    return buildContract.build(insights);
  }

  it("version is incremented by 1", () => {
    const base = buildBase([makeInsight("ACCEPT", "HEALTHY")]);
    const updated = updateContract.update(base, makeInsight("RETRY", "DEGRADED"));
    expect(updated.version).toBe(base.version + 1);
  });

  it("totalInsightsProcessed is incremented by 1", () => {
    const base = buildBase([makeInsight("ACCEPT", "HEALTHY")]);
    const updated = updateContract.update(base, makeInsight("RETRY", "DEGRADED"));
    expect(updated.totalInsightsProcessed).toBe(base.totalInsightsProcessed + 1);
  });

  it("new entry is appended to patternHistory", () => {
    const base = buildBase([makeInsight("ACCEPT", "HEALTHY")]);
    const newInsight = makeInsight("ESCALATE", "CRITICAL");
    const updated = updateContract.update(base, newInsight);
    expect(updated.patternHistory).toHaveLength(base.patternHistory.length + 1);
    expect(updated.patternHistory[updated.patternHistory.length - 1].insightId).toBe(newInsight.insightId);
  });

  it("currentHealthSignal updated to new insight's healthSignal", () => {
    const base = buildBase([makeInsight("ACCEPT", "HEALTHY")]);
    const updated = updateContract.update(base, makeInsight("REJECT", "CRITICAL"));
    expect(updated.currentHealthSignal).toBe("CRITICAL");
  });

  it("healthTrajectory recomputed from full history (HEALTHY→CRITICAL = DEGRADING)", () => {
    const base = buildBase([makeInsight("ACCEPT", "HEALTHY")]);
    const updated = updateContract.update(base, makeInsight("REJECT", "CRITICAL"));
    expect(updated.healthTrajectory).toBe("DEGRADING");
  });

  it("healthTrajectory IMPROVING when health improves (CRITICAL→HEALTHY)", () => {
    const base = buildBase([makeInsight("REJECT", "CRITICAL")]);
    const updated = updateContract.update(base, makeInsight("ACCEPT", "HEALTHY"));
    expect(updated.healthTrajectory).toBe("IMPROVING");
  });

  it("dominantPattern recomputed from full history", () => {
    // base has 1 ACCEPT; new insight is ESCALATE → ACCEPT still dominates (1 vs 1 → MIXED)
    const base = buildBase([makeInsight("ACCEPT", "HEALTHY")]);
    const updated = updateContract.update(base, makeInsight("ESCALATE", "DEGRADED"));
    // ACCEPT=1, ESCALATE=1 → MIXED
    expect(updated.dominantPattern).toBe("MIXED");
  });

  it("confidenceLevel recomputed (increases with more insights)", () => {
    const base = buildBase([makeInsight("ACCEPT", "HEALTHY")]);
    const updated = updateContract.update(base, makeInsight("ACCEPT", "HEALTHY"));
    // 2 insights → min(2/10, 1) = 0.2
    expect(updated.confidenceLevel).toBeCloseTo(0.2);
  });

  it("modelId and modelHash differ from original after update", () => {
    const base = buildBase([makeInsight("ACCEPT", "HEALTHY")]);
    const updated = updateContract.update(base, makeInsight("RETRY", "DEGRADED"));
    expect(updated.modelId).not.toBe(base.modelId);
    expect(updated.modelHash).not.toBe(base.modelHash);
  });

  it("factory createTruthModelUpdateContract returns working instance", () => {
    const c = createTruthModelUpdateContract({ now: fixedNow });
    const base = buildBase([makeInsight("ACCEPT", "HEALTHY")]);
    const updated = c.update(base, makeInsight("ACCEPT", "HEALTHY"));
    expect(updated.version).toBe(2);
  });
});
