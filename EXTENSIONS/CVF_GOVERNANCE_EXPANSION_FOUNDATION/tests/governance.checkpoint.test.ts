import { describe, expect, it } from "vitest";
import {
  GovernanceCheckpointContract,
  createGovernanceCheckpointContract,
  GovernanceCheckpointLogContract,
  createGovernanceCheckpointLogContract,
} from "../src/index";
import type { GovernanceCheckpointDecision } from "../src/index";
import type { GovernanceConsensusSummary } from "../src/index";

// --- Shared helper ---

function makeConsensusSummary(
  dominantVerdict: "PROCEED" | "PAUSE" | "ESCALATE",
  overrides: Partial<GovernanceConsensusSummary> = {},
): GovernanceConsensusSummary {
  const base: GovernanceConsensusSummary = {
    summaryId: "summary-001",
    createdAt: "2026-03-23T10:00:00.000Z",
    totalDecisions: 3,
    proceedCount: dominantVerdict === "PROCEED" ? 2 : 0,
    pauseCount: dominantVerdict === "PAUSE" ? 2 : 0,
    escalateCount: dominantVerdict === "ESCALATE" ? 2 : 0,
    dominantVerdict,
    summaryHash: "summary-hash-001",
  };
  return { ...base, ...overrides };
}

function makeCheckpointDecision(
  action: "PROCEED" | "HALT" | "ESCALATE",
  id: string,
): GovernanceCheckpointDecision {
  return {
    checkpointId: `checkpoint-${id}`,
    generatedAt: "2026-03-23T10:00:00.000Z",
    sourceConsensusSummaryId: `summary-${id}`,
    checkpointAction: action,
    checkpointRationale: `rationale-${action}-${id}`,
    dominantVerdictRef: action === "HALT" ? "PAUSE" : action === "PROCEED" ? "PROCEED" : "ESCALATE",
    totalDecisionsRef: 3,
    checkpointHash: `hash-${id}`,
  };
}

// ---------------------------------------------------------------------------
// W6-T4 CP1 — GovernanceCheckpointContract
// ---------------------------------------------------------------------------

describe("W6-T4 CP1 — GovernanceCheckpointContract", () => {
  it("maps PROCEED consensus summary to PROCEED checkpoint action", () => {
    const contract = createGovernanceCheckpointContract({
      now: () => "2026-03-23T10:00:00.000Z",
    });
    const summary = makeConsensusSummary("PROCEED");
    const decision = contract.checkpoint(summary);

    expect(decision.checkpointAction).toBe("PROCEED");
  });

  it("maps PAUSE consensus summary to HALT checkpoint action", () => {
    const contract = createGovernanceCheckpointContract({
      now: () => "2026-03-23T10:00:00.000Z",
    });
    const summary = makeConsensusSummary("PAUSE");
    const decision = contract.checkpoint(summary);

    expect(decision.checkpointAction).toBe("HALT");
  });

  it("maps ESCALATE consensus summary to ESCALATE checkpoint action", () => {
    const contract = createGovernanceCheckpointContract({
      now: () => "2026-03-23T10:00:00.000Z",
    });
    const summary = makeConsensusSummary("ESCALATE");
    const decision = contract.checkpoint(summary);

    expect(decision.checkpointAction).toBe("ESCALATE");
  });

  it("carries sourceConsensusSummaryId from the input summary", () => {
    const contract = createGovernanceCheckpointContract({
      now: () => "2026-03-23T10:00:00.000Z",
    });
    const summary = makeConsensusSummary("PROCEED", { summaryId: "summary-xyz" });
    const decision = contract.checkpoint(summary);

    expect(decision.sourceConsensusSummaryId).toBe("summary-xyz");
  });

  it("carries dominantVerdictRef from the input summary", () => {
    const contract = createGovernanceCheckpointContract({
      now: () => "2026-03-23T10:00:00.000Z",
    });
    const summary = makeConsensusSummary("PAUSE");
    const decision = contract.checkpoint(summary);

    expect(decision.dominantVerdictRef).toBe("PAUSE");
  });

  it("includes HALT rationale mentioning pauseCount", () => {
    const contract = createGovernanceCheckpointContract({
      now: () => "2026-03-23T10:00:00.000Z",
    });
    const summary = makeConsensusSummary("PAUSE", { pauseCount: 2, totalDecisions: 3 });
    const decision = contract.checkpoint(summary);

    expect(decision.checkpointRationale).toContain("HALT");
    expect(decision.checkpointRationale).toContain("2/3");
  });

  it("produces a non-empty deterministic checkpointHash", () => {
    const contract = createGovernanceCheckpointContract({
      now: () => "2026-03-23T10:00:00.000Z",
    });
    const summary = makeConsensusSummary("PROCEED");
    const d1 = contract.checkpoint(summary);
    const d2 = contract.checkpoint(summary);

    expect(d1.checkpointHash).toBeTruthy();
    expect(d1.checkpointHash).toBe(d2.checkpointHash);
  });

  it("custom deriveAction override is respected", () => {
    const contract = createGovernanceCheckpointContract({
      now: () => "2026-03-23T10:00:00.000Z",
      deriveAction: () => "ESCALATE",
    });
    const summary = makeConsensusSummary("PROCEED");
    const decision = contract.checkpoint(summary);

    expect(decision.checkpointAction).toBe("ESCALATE");
  });
});

// ---------------------------------------------------------------------------
// W6-T4 CP2 — GovernanceCheckpointLogContract
// ---------------------------------------------------------------------------

describe("W6-T4 CP2 — GovernanceCheckpointLogContract", () => {
  it("logs single PROCEED decision → dominantCheckpointAction PROCEED", () => {
    const contract = createGovernanceCheckpointLogContract({
      now: () => "2026-03-23T10:00:00.000Z",
    });
    const log = contract.log([makeCheckpointDecision("PROCEED", "a")]);

    expect(log.dominantCheckpointAction).toBe("PROCEED");
  });

  it("logs single HALT decision → dominantCheckpointAction HALT", () => {
    const contract = createGovernanceCheckpointLogContract({
      now: () => "2026-03-23T10:00:00.000Z",
    });
    const log = contract.log([makeCheckpointDecision("HALT", "b")]);

    expect(log.dominantCheckpointAction).toBe("HALT");
  });

  it("logs single ESCALATE decision → dominantCheckpointAction ESCALATE", () => {
    const contract = createGovernanceCheckpointLogContract({
      now: () => "2026-03-23T10:00:00.000Z",
    });
    const log = contract.log([makeCheckpointDecision("ESCALATE", "c")]);

    expect(log.dominantCheckpointAction).toBe("ESCALATE");
  });

  it("ESCALATE dominates over HALT in mixed batch", () => {
    const contract = createGovernanceCheckpointLogContract({
      now: () => "2026-03-23T10:00:00.000Z",
    });
    const decisions = [
      makeCheckpointDecision("HALT", "d1"),
      makeCheckpointDecision("ESCALATE", "d2"),
      makeCheckpointDecision("PROCEED", "d3"),
    ];
    const log = contract.log(decisions);

    expect(log.dominantCheckpointAction).toBe("ESCALATE");
  });

  it("HALT dominates over PROCEED in mixed batch (no ESCALATE)", () => {
    const contract = createGovernanceCheckpointLogContract({
      now: () => "2026-03-23T10:00:00.000Z",
    });
    const decisions = [
      makeCheckpointDecision("PROCEED", "e1"),
      makeCheckpointDecision("HALT", "e2"),
      makeCheckpointDecision("PROCEED", "e3"),
    ];
    const log = contract.log(decisions);

    expect(log.dominantCheckpointAction).toBe("HALT");
  });

  it("counts per action are correct in a mixed batch", () => {
    const contract = createGovernanceCheckpointLogContract({
      now: () => "2026-03-23T10:00:00.000Z",
    });
    const decisions = [
      makeCheckpointDecision("PROCEED", "f1"),
      makeCheckpointDecision("HALT", "f2"),
      makeCheckpointDecision("HALT", "f3"),
      makeCheckpointDecision("ESCALATE", "f4"),
    ];
    const log = contract.log(decisions);

    expect(log.totalCheckpoints).toBe(4);
    expect(log.proceedCount).toBe(1);
    expect(log.haltCount).toBe(2);
    expect(log.escalateCount).toBe(1);
  });

  it("log includes a non-empty deterministic logHash", () => {
    const contract = createGovernanceCheckpointLogContract({
      now: () => "2026-03-23T10:00:00.000Z",
    });
    const decisions = [makeCheckpointDecision("PROCEED", "g")];
    const l1 = contract.log(decisions);
    const l2 = contract.log(decisions);

    expect(l1.logHash).toBeTruthy();
    expect(l1.logHash).toBe(l2.logHash);
  });

  it("empty decision list produces PROCEED dominant with zero counts", () => {
    const contract = createGovernanceCheckpointLogContract({
      now: () => "2026-03-23T10:00:00.000Z",
    });
    const log = contract.log([]);

    expect(log.totalCheckpoints).toBe(0);
    expect(log.proceedCount).toBe(0);
    expect(log.haltCount).toBe(0);
    expect(log.escalateCount).toBe(0);
    expect(log.dominantCheckpointAction).toBe("PROCEED");
  });
});
