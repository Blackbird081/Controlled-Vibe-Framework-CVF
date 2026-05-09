/**
 * LPF Learning Observability — Dedicated Tests (W6-T13)
 * =======================================================
 * GC-023: dedicated file — never merge into index.test.ts.
 *
 * Coverage:
 *   LearningObservabilityContract.report:
 *     - UNKNOWN health when both storageRecordCount and loopSignalCount are 0
 *     - CRITICAL health when dominantFeedbackClass is REJECT
 *     - CRITICAL health when dominantFeedbackClass is ESCALATE
 *     - DEGRADED health when dominantFeedbackClass is RETRY
 *     - HEALTHY health when dominantFeedbackClass is ACCEPT
 *     - non-empty storage/loop with ACCEPT does not return UNKNOWN
 *     - healthRationale contains health and feedback class
 *     - healthRationale for UNKNOWN mentions no records/signals
 *     - sourceStorageLogId and sourceLoopSummaryId propagated
 *     - storageRecordCount and loopSignalCount propagated
 *     - reportHash and reportId are deterministic
 *     - generatedAt is set to injected now()
 *     - factory createLearningObservabilityContract returns working instance
 *
 *   LearningObservabilitySnapshotContract.snapshot:
 *     - empty input → UNKNOWN dominant, INSUFFICIENT_DATA trend, zero counts
 *     - counts each ObservabilityHealth correctly
 *     - dominantHealth count-wins (CRITICAL wins when outnumbered by HEALTHY)
 *     - dominantHealth priority tiebreak (CRITICAL before DEGRADED on equal counts)
 *     - single report → INSUFFICIENT_DATA trend (< 2 required)
 *     - trend IMPROVING when lastHealth score > firstHealth score
 *     - trend DEGRADING when lastHealth score < firstHealth score
 *     - trend STABLE when first and last health scores are equal
 *     - CRITICAL and UNKNOWN both score 0 (STABLE on CRITICAL→UNKNOWN transition)
 *     - summary for empty indicates no reports
 *     - summary for non-empty contains dominant and trend
 *     - snapshotHash and snapshotId are deterministic
 *     - createdAt is set to injected now()
 *     - factory createLearningObservabilitySnapshotContract returns working instance
 */

import { describe, it, expect } from "vitest";

import {
  LearningObservabilityContract,
  createLearningObservabilityContract,
} from "../src/learning.observability.contract";
import type { LearningObservabilityReport } from "../src/learning.observability.contract";

import {
  LearningObservabilitySnapshotContract,
  createLearningObservabilitySnapshotContract,
} from "../src/learning.observability.snapshot.contract";

import type { LearningStorageLog } from "../src/learning.storage.log.contract";
import type { LearningLoopSummary } from "../src/learning.loop.contract";
import type { FeedbackClass } from "../src/feedback.ledger.contract";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-03-23T18:00:00.000Z";
const fixedNow = () => FIXED_NOW;

let _storageSeq = 0;
function makeStorageLog(totalRecords: number): LearningStorageLog {
  const n = ++_storageSeq;
  return {
    logId: `storage-log-${n}`,
    createdAt: FIXED_NOW,
    totalRecords,
  } as LearningStorageLog;
}

let _loopSeq = 0;
function makeLoopSummary(
  dominantFeedbackClass: FeedbackClass,
  totalSignals: number,
): LearningLoopSummary {
  const n = ++_loopSeq;
  return {
    summaryId: `loop-summary-${n}`,
    createdAt: FIXED_NOW,
    totalSignals,
    dominantFeedbackClass,
  } as LearningLoopSummary;
}

let _reportSeq = 0;
function makeReport(
  health: LearningObservabilityReport["observabilityHealth"],
): LearningObservabilityReport {
  const n = ++_reportSeq;
  return {
    reportId: `report-${n}`,
    generatedAt: FIXED_NOW,
    sourceStorageLogId: `storage-log-${n}`,
    sourceLoopSummaryId: `loop-summary-${n}`,
    storageRecordCount: 5,
    loopSignalCount: 3,
    observabilityHealth: health,
    healthRationale: `health=${health}`,
    reportHash: `hash-report-${n}`,
  };
}

// ─── LearningObservabilityContract ────────────────────────────────────────────

describe("LearningObservabilityContract.report", () => {
  const contract = new LearningObservabilityContract({ now: fixedNow });

  it("UNKNOWN health when both storageRecordCount and loopSignalCount are 0", () => {
    const result = contract.report(
      makeStorageLog(0),
      makeLoopSummary("ACCEPT", 0),
    );
    expect(result.observabilityHealth).toBe("UNKNOWN");
  });

  it("CRITICAL health when dominantFeedbackClass is REJECT (non-zero records/signals)", () => {
    const result = contract.report(
      makeStorageLog(5),
      makeLoopSummary("REJECT", 3),
    );
    expect(result.observabilityHealth).toBe("CRITICAL");
  });

  it("CRITICAL health when dominantFeedbackClass is ESCALATE", () => {
    const result = contract.report(
      makeStorageLog(5),
      makeLoopSummary("ESCALATE", 3),
    );
    expect(result.observabilityHealth).toBe("CRITICAL");
  });

  it("DEGRADED health when dominantFeedbackClass is RETRY", () => {
    const result = contract.report(
      makeStorageLog(5),
      makeLoopSummary("RETRY", 3),
    );
    expect(result.observabilityHealth).toBe("DEGRADED");
  });

  it("HEALTHY health when dominantFeedbackClass is ACCEPT", () => {
    const result = contract.report(
      makeStorageLog(5),
      makeLoopSummary("ACCEPT", 3),
    );
    expect(result.observabilityHealth).toBe("HEALTHY");
  });

  it("non-zero storage with ACCEPT → HEALTHY (not UNKNOWN)", () => {
    const result = contract.report(
      makeStorageLog(1),
      makeLoopSummary("ACCEPT", 0),
    );
    // storageRecordCount=1 means not both empty, so health derives from dominantFeedbackClass
    expect(result.observabilityHealth).toBe("HEALTHY");
  });

  it("healthRationale for UNKNOWN mentions no records/signals", () => {
    const result = contract.report(makeStorageLog(0), makeLoopSummary("ACCEPT", 0));
    expect(result.healthRationale).toContain("UNKNOWN");
  });

  it("healthRationale for non-UNKNOWN contains health and feedback class", () => {
    const result = contract.report(makeStorageLog(5), makeLoopSummary("ACCEPT", 3));
    expect(result.healthRationale).toContain("HEALTHY");
    expect(result.healthRationale).toContain("ACCEPT");
  });

  it("sourceStorageLogId and sourceLoopSummaryId are propagated", () => {
    const storage = makeStorageLog(5);
    const loop = makeLoopSummary("ACCEPT", 2);
    const result = contract.report(storage, loop);
    expect(result.sourceStorageLogId).toBe(storage.logId);
    expect(result.sourceLoopSummaryId).toBe(loop.summaryId);
  });

  it("storageRecordCount and loopSignalCount are propagated", () => {
    const result = contract.report(makeStorageLog(7), makeLoopSummary("ACCEPT", 4));
    expect(result.storageRecordCount).toBe(7);
    expect(result.loopSignalCount).toBe(4);
  });

  it("reportHash and reportId are deterministic for same inputs and timestamp", () => {
    const storage = makeStorageLog(3);
    const loop = makeLoopSummary("RETRY", 2);
    const r1 = contract.report(storage, loop);
    const r2 = contract.report(storage, loop);
    expect(r1.reportHash).toBe(r2.reportHash);
    expect(r1.reportId).toBe(r2.reportId);
  });

  it("generatedAt is set to injected now()", () => {
    const result = contract.report(makeStorageLog(1), makeLoopSummary("ACCEPT", 1));
    expect(result.generatedAt).toBe(FIXED_NOW);
  });

  it("factory createLearningObservabilityContract returns working instance", () => {
    const c = createLearningObservabilityContract({ now: fixedNow });
    const result = c.report(makeStorageLog(0), makeLoopSummary("ACCEPT", 0));
    expect(result.observabilityHealth).toBe("UNKNOWN");
    expect(result.generatedAt).toBe(FIXED_NOW);
  });
});

// ─── LearningObservabilitySnapshotContract ────────────────────────────────────

describe("LearningObservabilitySnapshotContract.snapshot", () => {
  const contract = new LearningObservabilitySnapshotContract({ now: fixedNow });

  it("empty input → UNKNOWN dominant, INSUFFICIENT_DATA trend, zero counts", () => {
    const result = contract.snapshot([]);
    expect(result.totalReports).toBe(0);
    expect(result.dominantHealth).toBe("UNKNOWN");
    expect(result.snapshotTrend).toBe("INSUFFICIENT_DATA");
    expect(result.healthyCount).toBe(0);
    expect(result.degradedCount).toBe(0);
    expect(result.criticalCount).toBe(0);
    expect(result.unknownCount).toBe(0);
  });

  it("counts each ObservabilityHealth correctly", () => {
    const reports = [
      makeReport("HEALTHY"),
      makeReport("HEALTHY"),
      makeReport("DEGRADED"),
      makeReport("CRITICAL"),
      makeReport("UNKNOWN"),
    ];
    const result = contract.snapshot(reports);
    expect(result.totalReports).toBe(5);
    expect(result.healthyCount).toBe(2);
    expect(result.degradedCount).toBe(1);
    expect(result.criticalCount).toBe(1);
    expect(result.unknownCount).toBe(1);
  });

  describe("dominantHealth — count-wins with priority tiebreak", () => {
    it("CRITICAL wins by count when more CRITICAL than HEALTHY", () => {
      const reports = [
        makeReport("CRITICAL"),
        makeReport("CRITICAL"),
        makeReport("CRITICAL"),
        makeReport("HEALTHY"),
      ];
      expect(contract.snapshot(reports).dominantHealth).toBe("CRITICAL");
    });

    it("HEALTHY wins when more HEALTHY than others", () => {
      const reports = [
        makeReport("HEALTHY"),
        makeReport("HEALTHY"),
        makeReport("HEALTHY"),
        makeReport("CRITICAL"),
      ];
      expect(contract.snapshot(reports).dominantHealth).toBe("HEALTHY");
    });

    it("priority tiebreaks ties (CRITICAL before DEGRADED on equal counts)", () => {
      const reports = [makeReport("CRITICAL"), makeReport("DEGRADED")];
      expect(contract.snapshot(reports).dominantHealth).toBe("CRITICAL");
    });

    it("priority tiebreaks ties (DEGRADED before UNKNOWN on equal counts)", () => {
      const reports = [makeReport("DEGRADED"), makeReport("UNKNOWN")];
      expect(contract.snapshot(reports).dominantHealth).toBe("DEGRADED");
    });
  });

  describe("snapshotTrend", () => {
    it("INSUFFICIENT_DATA for single report (< 2 required)", () => {
      expect(contract.snapshot([makeReport("HEALTHY")]).snapshotTrend).toBe("INSUFFICIENT_DATA");
    });

    it("IMPROVING when last health score > first (CRITICAL→HEALTHY)", () => {
      // CRITICAL=0, HEALTHY=2 → IMPROVING
      const reports = [makeReport("CRITICAL"), makeReport("HEALTHY")];
      expect(contract.snapshot(reports).snapshotTrend).toBe("IMPROVING");
    });

    it("IMPROVING when DEGRADED→HEALTHY", () => {
      // DEGRADED=1, HEALTHY=2 → IMPROVING
      const reports = [makeReport("DEGRADED"), makeReport("HEALTHY")];
      expect(contract.snapshot(reports).snapshotTrend).toBe("IMPROVING");
    });

    it("DEGRADING when last health score < first (HEALTHY→CRITICAL)", () => {
      // HEALTHY=2, CRITICAL=0 → DEGRADING
      const reports = [makeReport("HEALTHY"), makeReport("CRITICAL")];
      expect(contract.snapshot(reports).snapshotTrend).toBe("DEGRADING");
    });

    it("DEGRADING when HEALTHY→DEGRADED", () => {
      const reports = [makeReport("HEALTHY"), makeReport("DEGRADED")];
      expect(contract.snapshot(reports).snapshotTrend).toBe("DEGRADING");
    });

    it("STABLE when first and last scores are equal (HEALTHY→HEALTHY)", () => {
      const reports = [makeReport("HEALTHY"), makeReport("DEGRADED"), makeReport("HEALTHY")];
      expect(contract.snapshot(reports).snapshotTrend).toBe("STABLE");
    });

    it("STABLE when CRITICAL→UNKNOWN (both score 0)", () => {
      const reports = [makeReport("CRITICAL"), makeReport("UNKNOWN")];
      expect(contract.snapshot(reports).snapshotTrend).toBe("STABLE");
    });

    it("STABLE when DEGRADED→DEGRADED", () => {
      const reports = [makeReport("DEGRADED"), makeReport("DEGRADED")];
      expect(contract.snapshot(reports).snapshotTrend).toBe("STABLE");
    });
  });

  it("summary for empty indicates no reports", () => {
    expect(contract.snapshot([]).summary).toContain("No");
  });

  it("summary for non-empty contains dominant health and trend", () => {
    const reports = [makeReport("HEALTHY"), makeReport("HEALTHY")];
    const result = contract.snapshot(reports);
    expect(result.summary).toContain("HEALTHY");
    expect(result.summary).toContain("STABLE");
  });

  it("snapshotHash and snapshotId are deterministic for same inputs and timestamp", () => {
    const reports = [makeReport("HEALTHY"), makeReport("DEGRADED")];
    const r1 = contract.snapshot(reports);
    const r2 = contract.snapshot(reports);
    expect(r1.snapshotHash).toBe(r2.snapshotHash);
    expect(r1.snapshotId).toBe(r2.snapshotId);
  });

  it("createdAt is set to injected now()", () => {
    expect(contract.snapshot([]).createdAt).toBe(FIXED_NOW);
  });

  it("factory createLearningObservabilitySnapshotContract returns working instance", () => {
    const c = createLearningObservabilitySnapshotContract({ now: fixedNow });
    const result = c.snapshot([]);
    expect(result.dominantHealth).toBe("UNKNOWN");
    expect(result.createdAt).toBe(FIXED_NOW);
  });
});
