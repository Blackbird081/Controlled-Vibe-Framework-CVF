/**
 * GEF Governance Consensus — Dedicated Tests (W6-T17)
 * =====================================================
 * GC-023: dedicated file — never merge into index.test.ts.
 *
 * Coverage:
 *   GovernanceConsensusContract.decide:
 *     - empty signals → PROCEED verdict, all counts zero, score=0
 *     - CRITICAL_THRESHOLD signal → ESCALATE verdict, criticalCount=1
 *     - ALERT_ACTIVE signal (no critical) → PAUSE verdict, alertActiveCount=1
 *     - ROUTINE signal → PROCEED verdict (neither criticalCount nor alertActiveCount)
 *     - NO_ACTION signal → PROCEED verdict (neither criticalCount nor alertActiveCount)
 *     - CRITICAL_THRESHOLD + ALERT_ACTIVE → ESCALATE (critical takes precedence)
 *     - consensusScore = (criticalCount/totalSignals)*100 rounded 2dp
 *     - score=0 when empty
 *     - 1 critical of 3 signals → score=33.33
 *     - 2 critical of 3 signals → score=66.67
 *     - totalSignals equals input length
 *     - issuedAt is set to injected now()
 *     - decisionHash and decisionId are deterministic for same inputs and timestamp
 *     - factory createGovernanceConsensusContract returns working instance
 *
 *   GovernanceConsensusSummaryContract.summarize:
 *     - empty decisions → ESCALATE dominant (tie at 0 — ESCALATE tiebreaks), all counts zero
 *     - all PROCEED → PROCEED dominant
 *     - all PAUSE → PAUSE dominant
 *     - all ESCALATE → ESCALATE dominant
 *     - ESCALATE tiebreaks over PAUSE (1 ESCALATE vs 1 PAUSE)
 *     - PAUSE tiebreaks over PROCEED (1 PAUSE vs 1 PROCEED, 0 ESCALATE)
 *     - ESCALATE is frequency-wins (2 PROCEED vs 1 ESCALATE → PROCEED dominant)
 *     - counts are accurate (proceedCount, pauseCount, escalateCount)
 *     - totalDecisions equals input length
 *     - createdAt is set to injected now()
 *     - summaryHash and summaryId are deterministic for same inputs and timestamp
 *     - factory createGovernanceConsensusSummaryContract returns working instance
 */

import { describe, it, expect } from "vitest";

import {
  GovernanceConsensusContract,
  createGovernanceConsensusContract,
} from "../src/governance.consensus.contract";
import type { GovernanceAuditSignal, AuditTrigger } from "../src/governance.audit.signal.contract";

import {
  GovernanceConsensusSummaryContract,
  createGovernanceConsensusSummaryContract,
} from "../src/governance.consensus.summary.contract";
import type { ConsensusDecision, ConsensusVerdict } from "../src/governance.consensus.contract";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-03-23T22:00:00.000Z";
const fixedNow = () => FIXED_NOW;

let _sigSeq = 0;
function makeSignal(auditTrigger: AuditTrigger): GovernanceAuditSignal {
  const n = ++_sigSeq;
  return {
    signalId: `sig-${n}`,
    issuedAt: FIXED_NOW,
    sourceAlertLogId: `alert-log-${n}`,
    auditTrigger,
    triggerRationale: `rationale-${n}`,
    signalHash: `hash-sig-${n}`,
  };
}

let _decSeq = 0;
function makeDecision(verdict: ConsensusVerdict): ConsensusDecision {
  const n = ++_decSeq;
  return {
    decisionId: `dec-${n}`,
    issuedAt: FIXED_NOW,
    verdict,
    criticalCount: verdict === "ESCALATE" ? 1 : 0,
    alertActiveCount: verdict === "PAUSE" ? 1 : 0,
    totalSignals: 1,
    consensusScore: verdict === "ESCALATE" ? 100 : 0,
    decisionHash: `hash-dec-${n}`,
  };
}

// ─── GovernanceConsensusContract ─────────────────────────────────────────────

describe("GovernanceConsensusContract.decide", () => {
  const contract = new GovernanceConsensusContract({ now: fixedNow });

  it("empty signals → PROCEED verdict, all counts zero, score=0", () => {
    const result = contract.decide([]);
    expect(result.verdict).toBe("PROCEED");
    expect(result.criticalCount).toBe(0);
    expect(result.alertActiveCount).toBe(0);
    expect(result.totalSignals).toBe(0);
    expect(result.consensusScore).toBe(0);
  });

  describe("verdict derivation", () => {
    it("CRITICAL_THRESHOLD signal → ESCALATE verdict, criticalCount=1", () => {
      const result = contract.decide([makeSignal("CRITICAL_THRESHOLD")]);
      expect(result.verdict).toBe("ESCALATE");
      expect(result.criticalCount).toBe(1);
      expect(result.alertActiveCount).toBe(0);
    });

    it("ALERT_ACTIVE signal (no critical) → PAUSE verdict, alertActiveCount=1", () => {
      const result = contract.decide([makeSignal("ALERT_ACTIVE")]);
      expect(result.verdict).toBe("PAUSE");
      expect(result.criticalCount).toBe(0);
      expect(result.alertActiveCount).toBe(1);
    });

    it("ROUTINE signal → PROCEED verdict", () => {
      const result = contract.decide([makeSignal("ROUTINE")]);
      expect(result.verdict).toBe("PROCEED");
      expect(result.criticalCount).toBe(0);
      expect(result.alertActiveCount).toBe(0);
    });

    it("NO_ACTION signal → PROCEED verdict", () => {
      const result = contract.decide([makeSignal("NO_ACTION")]);
      expect(result.verdict).toBe("PROCEED");
      expect(result.criticalCount).toBe(0);
      expect(result.alertActiveCount).toBe(0);
    });

    it("CRITICAL_THRESHOLD + ALERT_ACTIVE → ESCALATE (critical takes precedence)", () => {
      const result = contract.decide([
        makeSignal("CRITICAL_THRESHOLD"),
        makeSignal("ALERT_ACTIVE"),
      ]);
      expect(result.verdict).toBe("ESCALATE");
      expect(result.criticalCount).toBe(1);
      expect(result.alertActiveCount).toBe(1);
    });
  });

  describe("consensusScore computation", () => {
    it("score=0 when empty", () => {
      expect(contract.decide([]).consensusScore).toBe(0);
    });

    it("1 critical of 1 signal → score=100", () => {
      expect(contract.decide([makeSignal("CRITICAL_THRESHOLD")]).consensusScore).toBe(100);
    });

    it("1 critical of 3 signals → score=33.33", () => {
      const signals = [
        makeSignal("CRITICAL_THRESHOLD"),
        makeSignal("ROUTINE"),
        makeSignal("NO_ACTION"),
      ];
      expect(contract.decide(signals).consensusScore).toBe(33.33);
    });

    it("2 critical of 3 signals → score=66.67", () => {
      const signals = [
        makeSignal("CRITICAL_THRESHOLD"),
        makeSignal("CRITICAL_THRESHOLD"),
        makeSignal("ROUTINE"),
      ];
      expect(contract.decide(signals).consensusScore).toBe(66.67);
    });

    it("0 critical of 2 signals → score=0", () => {
      const signals = [makeSignal("ALERT_ACTIVE"), makeSignal("ROUTINE")];
      expect(contract.decide(signals).consensusScore).toBe(0);
    });
  });

  it("totalSignals equals input length", () => {
    const signals = [makeSignal("ROUTINE"), makeSignal("NO_ACTION"), makeSignal("ALERT_ACTIVE")];
    expect(contract.decide(signals).totalSignals).toBe(3);
  });

  it("issuedAt is set to injected now()", () => {
    expect(contract.decide([]).issuedAt).toBe(FIXED_NOW);
  });

  it("decisionHash and decisionId are deterministic for same inputs and timestamp", () => {
    const signals = [makeSignal("CRITICAL_THRESHOLD"), makeSignal("ROUTINE")];
    const r1 = contract.decide(signals);
    const r2 = contract.decide(signals);
    expect(r1.decisionHash).toBe(r2.decisionHash);
    expect(r1.decisionId).toBe(r2.decisionId);
  });

  it("factory createGovernanceConsensusContract returns working instance", () => {
    const c = createGovernanceConsensusContract({ now: fixedNow });
    const result = c.decide([]);
    expect(result.verdict).toBe("PROCEED");
    expect(result.issuedAt).toBe(FIXED_NOW);
  });
});

// ─── GovernanceConsensusSummaryContract ──────────────────────────────────────

describe("GovernanceConsensusSummaryContract.summarize", () => {
  const contract = new GovernanceConsensusSummaryContract({ now: fixedNow });

  it("empty decisions → ESCALATE dominant (0>=0 tiebreak), all counts zero", () => {
    const result = contract.summarize([]);
    expect(result.totalDecisions).toBe(0);
    expect(result.proceedCount).toBe(0);
    expect(result.pauseCount).toBe(0);
    expect(result.escalateCount).toBe(0);
    expect(result.dominantVerdict).toBe("ESCALATE");
  });

  describe("dominantVerdict — frequency-first with severity tiebreak", () => {
    it("all PROCEED → PROCEED dominant", () => {
      const decisions = [makeDecision("PROCEED"), makeDecision("PROCEED")];
      expect(contract.summarize(decisions).dominantVerdict).toBe("PROCEED");
    });

    it("all PAUSE → PAUSE dominant", () => {
      const decisions = [makeDecision("PAUSE"), makeDecision("PAUSE")];
      expect(contract.summarize(decisions).dominantVerdict).toBe("PAUSE");
    });

    it("all ESCALATE → ESCALATE dominant", () => {
      const decisions = [makeDecision("ESCALATE"), makeDecision("ESCALATE")];
      expect(contract.summarize(decisions).dominantVerdict).toBe("ESCALATE");
    });

    it("ESCALATE tiebreaks over PAUSE (1 each)", () => {
      const decisions = [makeDecision("ESCALATE"), makeDecision("PAUSE")];
      expect(contract.summarize(decisions).dominantVerdict).toBe("ESCALATE");
    });

    it("PAUSE tiebreaks over PROCEED (1 each, 0 ESCALATE)", () => {
      const decisions = [makeDecision("PAUSE"), makeDecision("PROCEED")];
      expect(contract.summarize(decisions).dominantVerdict).toBe("PAUSE");
    });

    it("majority wins — 2 PROCEED vs 1 ESCALATE → PROCEED dominant", () => {
      const decisions = [makeDecision("PROCEED"), makeDecision("PROCEED"), makeDecision("ESCALATE")];
      expect(contract.summarize(decisions).dominantVerdict).toBe("PROCEED");
    });

    it("majority wins — 3 PAUSE vs 2 ESCALATE → PAUSE dominant", () => {
      const decisions = [
        makeDecision("PAUSE"),
        makeDecision("PAUSE"),
        makeDecision("PAUSE"),
        makeDecision("ESCALATE"),
        makeDecision("ESCALATE"),
      ];
      expect(contract.summarize(decisions).dominantVerdict).toBe("PAUSE");
    });
  });

  it("counts each verdict correctly", () => {
    const decisions = [
      makeDecision("PROCEED"),
      makeDecision("PAUSE"),
      makeDecision("PAUSE"),
      makeDecision("ESCALATE"),
    ];
    const result = contract.summarize(decisions);
    expect(result.proceedCount).toBe(1);
    expect(result.pauseCount).toBe(2);
    expect(result.escalateCount).toBe(1);
  });

  it("totalDecisions equals input length", () => {
    const decisions = [makeDecision("PROCEED"), makeDecision("ESCALATE"), makeDecision("PAUSE")];
    expect(contract.summarize(decisions).totalDecisions).toBe(3);
  });

  it("createdAt is set to injected now()", () => {
    expect(contract.summarize([]).createdAt).toBe(FIXED_NOW);
  });

  it("summaryHash and summaryId are deterministic for same inputs and timestamp", () => {
    const decisions = [makeDecision("PROCEED"), makeDecision("ESCALATE")];
    const r1 = contract.summarize(decisions);
    const r2 = contract.summarize(decisions);
    expect(r1.summaryHash).toBe(r2.summaryHash);
    expect(r1.summaryId).toBe(r2.summaryId);
  });

  it("factory createGovernanceConsensusSummaryContract returns working instance", () => {
    const c = createGovernanceConsensusSummaryContract({ now: fixedNow });
    const result = c.summarize([]);
    expect(result.dominantVerdict).toBe("ESCALATE");
    expect(result.createdAt).toBe(FIXED_NOW);
  });
});
