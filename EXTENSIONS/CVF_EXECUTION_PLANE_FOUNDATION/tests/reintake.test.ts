/**
 * EPF Reintake — Dedicated Tests (W6-T22)
 * =========================================
 * GC-023: dedicated file — never merge into index.test.ts.
 *
 * Coverage:
 *   ExecutionReintakeContract.reinject:
 *     - CRITICAL urgencyLevel → REPLAN reintakeAction
 *     - HIGH urgencyLevel → RETRY reintakeAction
 *     - NORMAL urgencyLevel → ACCEPT reintakeAction
 *     - REPLAN vibe mentions CRITICAL urgency
 *     - RETRY vibe mentions HIGH urgency
 *     - ACCEPT vibe mentions "accepted"
 *     - sourceSummaryId = summary.summaryId
 *     - sourceUrgencyLevel = summary.urgencyLevel
 *     - custom deriveAction override respected
 *     - reintakeHash and reintakeId are deterministic for same inputs and timestamp
 *     - requestedAt set to injected now()
 *     - factory createExecutionReintakeContract returns working instance
 *
 *   ExecutionReintakeSummaryContract.summarize:
 *     - empty → totalRequests=0, ACCEPT dominant, "No re-intake requests" summary
 *     - CRITICAL resolution → replanCount incremented, REPLAN dominant
 *     - HIGH resolution → retryCount incremented, RETRY dominant (no replan)
 *     - NORMAL resolution → acceptCount incremented, ACCEPT dominant (no replan/retry)
 *     - REPLAN dominant when any replan exists (even if outnumbered by retry/accept)
 *     - RETRY dominant when no replan but retry > 0
 *     - ACCEPT dominant when no replan or retry
 *     - totalRequests equals input length
 *     - counts per action accurate
 *     - summary mentions replan/retry/accepted for non-zero buckets
 *     - summary mentions dominant action
 *     - summaryHash and summaryId are deterministic for same inputs and timestamp
 *     - createdAt set to injected now()
 *     - factory createExecutionReintakeSummaryContract returns working instance
 */

import { describe, it, expect } from "vitest";

import {
  ExecutionReintakeContract,
  createExecutionReintakeContract,
} from "../src/execution.reintake.contract";
import {
  ExecutionReintakeSummaryContract,
  createExecutionReintakeSummaryContract,
} from "../src/execution.reintake.summary.contract";
import type { FeedbackResolutionSummary, UrgencyLevel } from "../src/feedback.resolution.contract";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-03-24T01:00:00.000Z";
const fixedNow = () => FIXED_NOW;

let _sSeq = 0;
function makeResolutionSummary(urgencyLevel: UrgencyLevel): FeedbackResolutionSummary {
  const n = ++_sSeq;
  return {
    summaryId: `sum-${n}`,
    resolvedAt: FIXED_NOW,
    totalDecisions: 1,
    acceptCount: urgencyLevel === "NORMAL" ? 1 : 0,
    retryCount: urgencyLevel === "HIGH" ? 1 : 0,
    escalateCount: urgencyLevel === "CRITICAL" ? 1 : 0,
    rejectCount: 0,
    urgencyLevel,
    summary: `test summary ${n}`,
    summaryHash: `shash-${n}`,
  };
}

// ─── ExecutionReintakeContract ────────────────────────────────────────────────

describe("ExecutionReintakeContract.reinject", () => {
  const contract = new ExecutionReintakeContract({ now: fixedNow });

  describe("reintakeAction derivation", () => {
    it("CRITICAL urgency → REPLAN reintakeAction", () => {
      expect(contract.reinject(makeResolutionSummary("CRITICAL")).reintakeAction).toBe("REPLAN");
    });

    it("HIGH urgency → RETRY reintakeAction", () => {
      expect(contract.reinject(makeResolutionSummary("HIGH")).reintakeAction).toBe("RETRY");
    });

    it("NORMAL urgency → ACCEPT reintakeAction", () => {
      expect(contract.reinject(makeResolutionSummary("NORMAL")).reintakeAction).toBe("ACCEPT");
    });
  });

  describe("reintakeVibe content", () => {
    it("REPLAN vibe mentions CRITICAL urgency", () => {
      const request = contract.reinject(makeResolutionSummary("CRITICAL"));
      expect(request.reintakeVibe).toContain("CRITICAL");
    });

    it("RETRY vibe mentions HIGH urgency", () => {
      const request = contract.reinject(makeResolutionSummary("HIGH"));
      expect(request.reintakeVibe).toContain("HIGH");
    });

    it("ACCEPT vibe mentions 'accepted'", () => {
      const request = contract.reinject(makeResolutionSummary("NORMAL"));
      expect(request.reintakeVibe.toLowerCase()).toContain("accepted");
    });
  });

  it("sourceSummaryId = summary.summaryId", () => {
    const summary = makeResolutionSummary("NORMAL");
    expect(contract.reinject(summary).sourceSummaryId).toBe(summary.summaryId);
  });

  it("sourceUrgencyLevel = summary.urgencyLevel", () => {
    const summary = makeResolutionSummary("HIGH");
    expect(contract.reinject(summary).sourceUrgencyLevel).toBe("HIGH");
  });

  it("custom deriveAction override respected", () => {
    const custom = new ExecutionReintakeContract({
      now: fixedNow,
      deriveAction: () => "RETRY",
    });
    expect(custom.reinject(makeResolutionSummary("CRITICAL")).reintakeAction).toBe("RETRY");
  });

  it("reintakeHash and reintakeId are deterministic for same inputs and timestamp", () => {
    const summary = makeResolutionSummary("HIGH");
    const r1 = contract.reinject(summary);
    const r2 = contract.reinject(summary);
    expect(r1.reintakeHash).toBe(r2.reintakeHash);
    expect(r1.reintakeId).toBe(r2.reintakeId);
  });

  it("requestedAt set to injected now()", () => {
    expect(contract.reinject(makeResolutionSummary("NORMAL")).requestedAt).toBe(FIXED_NOW);
  });

  it("factory createExecutionReintakeContract returns working instance", () => {
    const c = createExecutionReintakeContract({ now: fixedNow });
    const request = c.reinject(makeResolutionSummary("NORMAL"));
    expect(request.reintakeAction).toBe("ACCEPT");
    expect(request.requestedAt).toBe(FIXED_NOW);
  });
});

// ─── ExecutionReintakeSummaryContract ─────────────────────────────────────────

describe("ExecutionReintakeSummaryContract.summarize", () => {
  const contract = new ExecutionReintakeSummaryContract({ now: fixedNow });

  it("empty → totalRequests=0, ACCEPT dominant, 'No re-intake requests' summary", () => {
    const result = contract.summarize([]);
    expect(result.totalRequests).toBe(0);
    expect(result.replanCount).toBe(0);
    expect(result.retryCount).toBe(0);
    expect(result.acceptCount).toBe(0);
    expect(result.dominantReintakeAction).toBe("ACCEPT");
    expect(result.summary).toContain("No re-intake requests");
  });

  describe("action mapping from resolution urgency", () => {
    it("CRITICAL resolution → replanCount incremented, REPLAN dominant", () => {
      const result = contract.summarize([makeResolutionSummary("CRITICAL")]);
      expect(result.replanCount).toBe(1);
      expect(result.dominantReintakeAction).toBe("REPLAN");
    });

    it("HIGH resolution → retryCount incremented, RETRY dominant (no replan)", () => {
      const result = contract.summarize([makeResolutionSummary("HIGH")]);
      expect(result.retryCount).toBe(1);
      expect(result.dominantReintakeAction).toBe("RETRY");
    });

    it("NORMAL resolution → acceptCount incremented, ACCEPT dominant", () => {
      const result = contract.summarize([makeResolutionSummary("NORMAL")]);
      expect(result.acceptCount).toBe(1);
      expect(result.dominantReintakeAction).toBe("ACCEPT");
    });
  });

  describe("dominant action — REPLAN > RETRY > ACCEPT", () => {
    it("REPLAN dominant even when outnumbered (1 CRITICAL vs 2 NORMAL)", () => {
      const summaries = [
        makeResolutionSummary("NORMAL"),
        makeResolutionSummary("NORMAL"),
        makeResolutionSummary("CRITICAL"),
      ];
      expect(contract.summarize(summaries).dominantReintakeAction).toBe("REPLAN");
    });

    it("RETRY dominant when no replan but retry > 0", () => {
      const summaries = [makeResolutionSummary("NORMAL"), makeResolutionSummary("HIGH")];
      expect(contract.summarize(summaries).dominantReintakeAction).toBe("RETRY");
    });

    it("ACCEPT dominant when no replan or retry (all NORMAL)", () => {
      const summaries = [makeResolutionSummary("NORMAL"), makeResolutionSummary("NORMAL")];
      expect(contract.summarize(summaries).dominantReintakeAction).toBe("ACCEPT");
    });
  });

  it("totalRequests equals input length", () => {
    const summaries = [
      makeResolutionSummary("CRITICAL"),
      makeResolutionSummary("HIGH"),
      makeResolutionSummary("NORMAL"),
    ];
    expect(contract.summarize(summaries).totalRequests).toBe(3);
  });

  it("counts per action accurate", () => {
    const summaries = [
      makeResolutionSummary("CRITICAL"),
      makeResolutionSummary("HIGH"),
      makeResolutionSummary("HIGH"),
      makeResolutionSummary("NORMAL"),
    ];
    const result = contract.summarize(summaries);
    expect(result.replanCount).toBe(1);
    expect(result.retryCount).toBe(2);
    expect(result.acceptCount).toBe(1);
  });

  it("summary mentions replanning for non-zero replanCount", () => {
    expect(contract.summarize([makeResolutionSummary("CRITICAL")]).summary).toContain("replanning");
  });

  it("summary mentions retry for non-zero retryCount", () => {
    expect(contract.summarize([makeResolutionSummary("HIGH")]).summary).toContain("retry");
  });

  it("summary mentions accepted for non-zero acceptCount", () => {
    expect(contract.summarize([makeResolutionSummary("NORMAL")]).summary).toContain("accepted");
  });

  it("summary mentions dominant action", () => {
    const result = contract.summarize([makeResolutionSummary("CRITICAL")]);
    expect(result.summary).toContain("REPLAN");
  });

  it("summaryHash and summaryId are deterministic for same inputs and timestamp", () => {
    const summaries = [makeResolutionSummary("HIGH"), makeResolutionSummary("NORMAL")];
    const r1 = contract.summarize(summaries);
    const r2 = contract.summarize(summaries);
    expect(r1.summaryHash).toBe(r2.summaryHash);
    expect(r1.summaryId).toBe(r2.summaryId);
  });

  it("createdAt set to injected now()", () => {
    expect(contract.summarize([]).createdAt).toBe(FIXED_NOW);
  });

  it("factory createExecutionReintakeSummaryContract returns working instance", () => {
    const c = createExecutionReintakeSummaryContract({ now: fixedNow });
    const result = c.summarize([]);
    expect(result.dominantReintakeAction).toBe("ACCEPT");
    expect(result.createdAt).toBe(FIXED_NOW);
  });
});
