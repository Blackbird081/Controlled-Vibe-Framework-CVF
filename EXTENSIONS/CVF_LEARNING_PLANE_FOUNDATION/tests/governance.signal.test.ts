/**
 * LPF Governance Signal — Dedicated Tests (W6-T11)
 * ==================================================
 * GC-023: dedicated file — never merge into index.test.ts.
 *
 * Coverage:
 *   GovernanceSignalContract.signal:
 *     - ESCALATE signal when overallStatus is FAILING
 *     - TRIGGER_REVIEW signal when overallStatus is WARNING
 *     - MONITOR signal when overallStatus is INSUFFICIENT_DATA
 *     - NO_ACTION signal when overallStatus is PASSING
 *     - urgency CRITICAL for ESCALATE
 *     - urgency HIGH for TRIGGER_REVIEW
 *     - urgency LOW for MONITOR
 *     - urgency LOW for NO_ACTION
 *     - recommendation contains signalType keyword
 *     - recommendation contains failCount for ESCALATE
 *     - recommendation contains warnCount for TRIGGER_REVIEW
 *     - recommendation contains inconclusiveCount for MONITOR
 *     - recommendation contains passCount for NO_ACTION
 *     - sourceAssessmentId and sourceOverallStatus propagated
 *     - custom deriveSignal override is respected
 *     - signalHash and signalId are deterministic
 *     - issuedAt is set to injected now()
 *     - factory createGovernanceSignalContract returns working instance
 *
 *   GovernanceSignalLogContract.log:
 *     - empty input → NO_ACTION dominant, zero counts
 *     - counts each signalType correctly
 *     - dominantSignalType is severity-first (ESCALATE wins regardless of count)
 *     - TRIGGER_REVIEW dominates over MONITOR and NO_ACTION (when no ESCALATE)
 *     - MONITOR dominates over NO_ACTION (when no ESCALATE or TRIGGER_REVIEW)
 *     - all NO_ACTION → dominantSignalType NO_ACTION
 *     - summary for empty indicates no signals
 *     - summary for non-empty contains dominant and breakdown
 *     - logHash and logId are deterministic
 *     - createdAt is set to injected now()
 *     - factory createGovernanceSignalLogContract returns working instance
 */

import { describe, it, expect } from "vitest";

import {
  GovernanceSignalContract,
  createGovernanceSignalContract,
} from "../src/governance.signal.contract";
import type { GovernanceSignal } from "../src/governance.signal.contract";

import {
  GovernanceSignalLogContract,
  createGovernanceSignalLogContract,
} from "../src/governance.signal.log.contract";

import type { ThresholdAssessment } from "../src/evaluation.threshold.contract";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-03-23T16:00:00.000Z";
const fixedNow = () => FIXED_NOW;

let _assessSeq = 0;
function makeAssessment(
  overallStatus: ThresholdAssessment["overallStatus"],
  overrides: Partial<ThresholdAssessment> = {},
): ThresholdAssessment {
  const n = ++_assessSeq;
  return {
    assessmentId: `assess-${n}`,
    assessedAt: FIXED_NOW,
    totalVerdicts: overrides.totalVerdicts ?? 4,
    passCount: overrides.passCount ?? 0,
    warnCount: overrides.warnCount ?? 0,
    failCount: overrides.failCount ?? 0,
    inconclusiveCount: overrides.inconclusiveCount ?? 0,
    overallStatus,
    summary: overrides.summary ?? `status=${overallStatus}`,
    assessmentHash: overrides.assessmentHash ?? `hash-${n}`,
    ...overrides,
  };
}

let _sigSeq = 0;
function makeSignal(
  signalType: GovernanceSignal["signalType"],
): GovernanceSignal {
  const n = ++_sigSeq;
  return {
    signalId: `sig-${n}`,
    issuedAt: FIXED_NOW,
    sourceAssessmentId: `assess-${n}`,
    sourceOverallStatus: "PASSING",
    signalType,
    urgency: "LOW",
    recommendation: `recommendation for ${signalType}`,
    signalHash: `hash-sig-${n}`,
  };
}

// ─── GovernanceSignalContract ─────────────────────────────────────────────────

describe("GovernanceSignalContract.signal", () => {
  const contract = new GovernanceSignalContract({ now: fixedNow });

  describe("signalType derivation", () => {
    it("ESCALATE when overallStatus is FAILING", () => {
      const a = makeAssessment("FAILING", { failCount: 2, totalVerdicts: 4 });
      expect(contract.signal(a).signalType).toBe("ESCALATE");
    });

    it("TRIGGER_REVIEW when overallStatus is WARNING", () => {
      const a = makeAssessment("WARNING", { warnCount: 1, totalVerdicts: 4 });
      expect(contract.signal(a).signalType).toBe("TRIGGER_REVIEW");
    });

    it("MONITOR when overallStatus is INSUFFICIENT_DATA", () => {
      const a = makeAssessment("INSUFFICIENT_DATA", { inconclusiveCount: 4, totalVerdicts: 4 });
      expect(contract.signal(a).signalType).toBe("MONITOR");
    });

    it("NO_ACTION when overallStatus is PASSING", () => {
      const a = makeAssessment("PASSING", { passCount: 4, totalVerdicts: 4 });
      expect(contract.signal(a).signalType).toBe("NO_ACTION");
    });
  });

  describe("urgency derivation", () => {
    it("urgency CRITICAL for ESCALATE signal", () => {
      const a = makeAssessment("FAILING", { failCount: 1 });
      expect(contract.signal(a).urgency).toBe("CRITICAL");
    });

    it("urgency HIGH for TRIGGER_REVIEW signal", () => {
      const a = makeAssessment("WARNING", { warnCount: 1 });
      expect(contract.signal(a).urgency).toBe("HIGH");
    });

    it("urgency LOW for MONITOR signal", () => {
      const a = makeAssessment("INSUFFICIENT_DATA", { inconclusiveCount: 4, totalVerdicts: 4 });
      expect(contract.signal(a).urgency).toBe("LOW");
    });

    it("urgency LOW for NO_ACTION signal", () => {
      const a = makeAssessment("PASSING", { passCount: 3, totalVerdicts: 3 });
      expect(contract.signal(a).urgency).toBe("LOW");
    });
  });

  describe("recommendation content", () => {
    it("ESCALATE recommendation contains ESCALATE and failCount", () => {
      const a = makeAssessment("FAILING", { failCount: 3, totalVerdicts: 5 });
      const rec = contract.signal(a).recommendation;
      expect(rec).toContain("ESCALATE");
      expect(rec).toContain("3");
    });

    it("TRIGGER_REVIEW recommendation contains TRIGGER and warnCount", () => {
      const a = makeAssessment("WARNING", { warnCount: 2, totalVerdicts: 5 });
      const rec = contract.signal(a).recommendation;
      expect(rec).toContain("TRIGGER");
      expect(rec).toContain("2");
    });

    it("MONITOR recommendation contains MONITOR and inconclusiveCount", () => {
      const a = makeAssessment("INSUFFICIENT_DATA", { inconclusiveCount: 4, totalVerdicts: 4 });
      const rec = contract.signal(a).recommendation;
      expect(rec).toContain("MONITOR");
      expect(rec).toContain("4");
    });

    it("NO_ACTION recommendation contains NO GOVERNANCE ACTION and passCount", () => {
      const a = makeAssessment("PASSING", { passCount: 5, totalVerdicts: 5 });
      const rec = contract.signal(a).recommendation;
      expect(rec).toContain("NO GOVERNANCE ACTION");
      expect(rec).toContain("5");
    });
  });

  it("sourceAssessmentId and sourceOverallStatus are propagated", () => {
    const a = makeAssessment("PASSING", { passCount: 2 });
    const result = contract.signal(a);
    expect(result.sourceAssessmentId).toBe(a.assessmentId);
    expect(result.sourceOverallStatus).toBe("PASSING");
  });

  it("custom deriveSignal override is respected", () => {
    const customContract = new GovernanceSignalContract({
      now: fixedNow,
      deriveSignal: () => "ESCALATE",
    });
    const a = makeAssessment("PASSING", { passCount: 4, totalVerdicts: 4 });
    expect(customContract.signal(a).signalType).toBe("ESCALATE");
    expect(customContract.signal(a).urgency).toBe("CRITICAL");
  });

  it("signalHash and signalId are deterministic for same inputs and timestamp", () => {
    const a = makeAssessment("PASSING", { passCount: 3, totalVerdicts: 3 });
    const r1 = contract.signal(a);
    const r2 = contract.signal(a);
    expect(r1.signalHash).toBe(r2.signalHash);
    expect(r1.signalId).toBe(r2.signalId);
  });

  it("issuedAt is set to injected now()", () => {
    const a = makeAssessment("PASSING");
    expect(contract.signal(a).issuedAt).toBe(FIXED_NOW);
  });

  it("factory createGovernanceSignalContract returns working instance", () => {
    const c = createGovernanceSignalContract({ now: fixedNow });
    const a = makeAssessment("PASSING", { passCount: 1, totalVerdicts: 1 });
    const result = c.signal(a);
    expect(result.signalType).toBe("NO_ACTION");
    expect(result.issuedAt).toBe(FIXED_NOW);
  });
});

// ─── GovernanceSignalLogContract ──────────────────────────────────────────────

describe("GovernanceSignalLogContract.log", () => {
  const contract = new GovernanceSignalLogContract({ now: fixedNow });

  it("empty input → NO_ACTION dominant, all counts zero", () => {
    const result = contract.log([]);
    expect(result.totalSignals).toBe(0);
    expect(result.dominantSignalType).toBe("NO_ACTION");
    expect(result.escalateCount).toBe(0);
    expect(result.reviewCount).toBe(0);
    expect(result.monitorCount).toBe(0);
    expect(result.noActionCount).toBe(0);
  });

  it("counts each signalType correctly", () => {
    const signals = [
      makeSignal("ESCALATE"),
      makeSignal("TRIGGER_REVIEW"),
      makeSignal("TRIGGER_REVIEW"),
      makeSignal("MONITOR"),
      makeSignal("NO_ACTION"),
    ];
    const result = contract.log(signals);
    expect(result.totalSignals).toBe(5);
    expect(result.escalateCount).toBe(1);
    expect(result.reviewCount).toBe(2);
    expect(result.monitorCount).toBe(1);
    expect(result.noActionCount).toBe(1);
  });

  describe("dominantSignalType — severity-first (not count-wins)", () => {
    it("ESCALATE dominates even when outnumbered by TRIGGER_REVIEW", () => {
      const signals = [
        makeSignal("TRIGGER_REVIEW"),
        makeSignal("TRIGGER_REVIEW"),
        makeSignal("TRIGGER_REVIEW"),
        makeSignal("ESCALATE"),
      ];
      expect(contract.log(signals).dominantSignalType).toBe("ESCALATE");
    });

    it("ESCALATE dominates over all other types", () => {
      const signals = [
        makeSignal("NO_ACTION"),
        makeSignal("MONITOR"),
        makeSignal("TRIGGER_REVIEW"),
        makeSignal("ESCALATE"),
      ];
      expect(contract.log(signals).dominantSignalType).toBe("ESCALATE");
    });

    it("TRIGGER_REVIEW dominates over MONITOR and NO_ACTION", () => {
      const signals = [
        makeSignal("NO_ACTION"),
        makeSignal("NO_ACTION"),
        makeSignal("MONITOR"),
        makeSignal("TRIGGER_REVIEW"),
      ];
      expect(contract.log(signals).dominantSignalType).toBe("TRIGGER_REVIEW");
    });

    it("MONITOR dominates over NO_ACTION", () => {
      const signals = [
        makeSignal("NO_ACTION"),
        makeSignal("NO_ACTION"),
        makeSignal("NO_ACTION"),
        makeSignal("MONITOR"),
      ];
      expect(contract.log(signals).dominantSignalType).toBe("MONITOR");
    });

    it("all NO_ACTION → dominantSignalType NO_ACTION", () => {
      const signals = [makeSignal("NO_ACTION"), makeSignal("NO_ACTION")];
      expect(contract.log(signals).dominantSignalType).toBe("NO_ACTION");
    });
  });

  it("summary for empty indicates no signals", () => {
    expect(contract.log([]).summary).toContain("no signals");
  });

  it("summary for non-empty contains dominant type and breakdown fields", () => {
    const signals = [makeSignal("ESCALATE"), makeSignal("NO_ACTION")];
    const result = contract.log(signals);
    expect(result.summary).toContain("ESCALATE");
    expect(result.summary).toContain("escalate=1");
  });

  it("logHash and logId are deterministic for same inputs and timestamp", () => {
    const signals = [makeSignal("MONITOR"), makeSignal("NO_ACTION")];
    const r1 = contract.log(signals);
    const r2 = contract.log(signals);
    expect(r1.logHash).toBe(r2.logHash);
    expect(r1.logId).toBe(r2.logId);
  });

  it("createdAt is set to injected now()", () => {
    expect(contract.log([]).createdAt).toBe(FIXED_NOW);
  });

  it("factory createGovernanceSignalLogContract returns working instance", () => {
    const c = createGovernanceSignalLogContract({ now: fixedNow });
    const result = c.log([]);
    expect(result.dominantSignalType).toBe("NO_ACTION");
    expect(result.createdAt).toBe(FIXED_NOW);
  });
});
