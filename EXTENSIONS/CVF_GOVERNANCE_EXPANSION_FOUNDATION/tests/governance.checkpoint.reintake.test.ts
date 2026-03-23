import { describe, expect, it } from "vitest";
import {
  GovernanceCheckpointReintakeContract,
  createGovernanceCheckpointReintakeContract,
  GovernanceCheckpointReintakeSummaryContract,
  createGovernanceCheckpointReintakeSummaryContract,
} from "../src/index";
import type { CheckpointReintakeRequest } from "../src/index";
import type { GovernanceCheckpointDecision, CheckpointAction } from "../src/index";

// --- Shared helper ---

function makeCheckpointDecision(
  action: CheckpointAction,
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

function makeReintakeRequest(
  scope: "IMMEDIATE" | "DEFERRED" | "NONE",
  id: string,
): CheckpointReintakeRequest {
  return {
    reintakeId: `reintake-${id}`,
    generatedAt: "2026-03-23T10:00:00.000Z",
    sourceCheckpointId: `checkpoint-${id}`,
    reintakeTrigger:
      scope === "IMMEDIATE"
        ? "ESCALATION_REQUIRED"
        : scope === "DEFERRED"
          ? "HALT_REVIEW_PENDING"
          : "NO_REINTAKE",
    reintakeScope: scope,
    reintakeRationale: `rationale-${id}`,
    checkpointActionRef: scope === "IMMEDIATE" ? "ESCALATE" : scope === "DEFERRED" ? "HALT" : "PROCEED",
    reintakeHash: `hash-${id}`,
  };
}

// ---------------------------------------------------------------------------
// W6-T5 CP1 — GovernanceCheckpointReintakeContract
// ---------------------------------------------------------------------------

describe("W6-T5 CP1 — GovernanceCheckpointReintakeContract", () => {
  it("ESCALATE checkpoint → ESCALATION_REQUIRED trigger and IMMEDIATE scope", () => {
    const contract = createGovernanceCheckpointReintakeContract({
      now: () => "2026-03-23T10:00:00.000Z",
    });
    const req = contract.reintake(makeCheckpointDecision("ESCALATE", "a"));

    expect(req.reintakeTrigger).toBe("ESCALATION_REQUIRED");
    expect(req.reintakeScope).toBe("IMMEDIATE");
  });

  it("HALT checkpoint → HALT_REVIEW_PENDING trigger and DEFERRED scope", () => {
    const contract = createGovernanceCheckpointReintakeContract({
      now: () => "2026-03-23T10:00:00.000Z",
    });
    const req = contract.reintake(makeCheckpointDecision("HALT", "b"));

    expect(req.reintakeTrigger).toBe("HALT_REVIEW_PENDING");
    expect(req.reintakeScope).toBe("DEFERRED");
  });

  it("PROCEED checkpoint → NO_REINTAKE trigger and NONE scope", () => {
    const contract = createGovernanceCheckpointReintakeContract({
      now: () => "2026-03-23T10:00:00.000Z",
    });
    const req = contract.reintake(makeCheckpointDecision("PROCEED", "c"));

    expect(req.reintakeTrigger).toBe("NO_REINTAKE");
    expect(req.reintakeScope).toBe("NONE");
  });

  it("carries sourceCheckpointId from the input decision", () => {
    const contract = createGovernanceCheckpointReintakeContract({
      now: () => "2026-03-23T10:00:00.000Z",
    });
    const decision = makeCheckpointDecision("HALT", "d");
    const req = contract.reintake(decision);

    expect(req.sourceCheckpointId).toBe("checkpoint-d");
  });

  it("carries checkpointActionRef from the input decision", () => {
    const contract = createGovernanceCheckpointReintakeContract({
      now: () => "2026-03-23T10:00:00.000Z",
    });
    const req = contract.reintake(makeCheckpointDecision("ESCALATE", "e"));

    expect(req.checkpointActionRef).toBe("ESCALATE");
  });

  it("ESCALATE rationale mentions ESCALATION_REQUIRED and IMMEDIATE", () => {
    const contract = createGovernanceCheckpointReintakeContract({
      now: () => "2026-03-23T10:00:00.000Z",
    });
    const req = contract.reintake(makeCheckpointDecision("ESCALATE", "f"));

    expect(req.reintakeRationale).toContain("ESCALATION_REQUIRED");
    expect(req.reintakeRationale).toContain("ESCALATE");
  });

  it("produces a non-empty deterministic reintakeHash", () => {
    const contract = createGovernanceCheckpointReintakeContract({
      now: () => "2026-03-23T10:00:00.000Z",
    });
    const decision = makeCheckpointDecision("HALT", "g");
    const r1 = contract.reintake(decision);
    const r2 = contract.reintake(decision);

    expect(r1.reintakeHash).toBeTruthy();
    expect(r1.reintakeHash).toBe(r2.reintakeHash);
  });

  it("produces distinct reintakeIds for distinct checkpointIds", () => {
    const contract = createGovernanceCheckpointReintakeContract({
      now: () => "2026-03-23T10:00:00.000Z",
    });
    const r1 = contract.reintake(makeCheckpointDecision("HALT", "h1"));
    const r2 = contract.reintake(makeCheckpointDecision("HALT", "h2"));

    expect(r1.reintakeId).not.toBe(r2.reintakeId);
  });
});

// ---------------------------------------------------------------------------
// W6-T5 CP2 — GovernanceCheckpointReintakeSummaryContract
// ---------------------------------------------------------------------------

describe("W6-T5 CP2 — GovernanceCheckpointReintakeSummaryContract", () => {
  it("single IMMEDIATE request → dominantScope IMMEDIATE", () => {
    const contract = createGovernanceCheckpointReintakeSummaryContract({
      now: () => "2026-03-23T10:00:00.000Z",
    });
    const summary = contract.summarize([makeReintakeRequest("IMMEDIATE", "a")]);

    expect(summary.dominantScope).toBe("IMMEDIATE");
  });

  it("single DEFERRED request → dominantScope DEFERRED", () => {
    const contract = createGovernanceCheckpointReintakeSummaryContract({
      now: () => "2026-03-23T10:00:00.000Z",
    });
    const summary = contract.summarize([makeReintakeRequest("DEFERRED", "b")]);

    expect(summary.dominantScope).toBe("DEFERRED");
  });

  it("single NONE request → dominantScope NONE", () => {
    const contract = createGovernanceCheckpointReintakeSummaryContract({
      now: () => "2026-03-23T10:00:00.000Z",
    });
    const summary = contract.summarize([makeReintakeRequest("NONE", "c")]);

    expect(summary.dominantScope).toBe("NONE");
  });

  it("IMMEDIATE dominates over DEFERRED in mixed batch", () => {
    const contract = createGovernanceCheckpointReintakeSummaryContract({
      now: () => "2026-03-23T10:00:00.000Z",
    });
    const summary = contract.summarize([
      makeReintakeRequest("DEFERRED", "d1"),
      makeReintakeRequest("IMMEDIATE", "d2"),
      makeReintakeRequest("NONE", "d3"),
    ]);

    expect(summary.dominantScope).toBe("IMMEDIATE");
  });

  it("DEFERRED dominates over NONE in mixed batch (no IMMEDIATE)", () => {
    const contract = createGovernanceCheckpointReintakeSummaryContract({
      now: () => "2026-03-23T10:00:00.000Z",
    });
    const summary = contract.summarize([
      makeReintakeRequest("NONE", "e1"),
      makeReintakeRequest("DEFERRED", "e2"),
    ]);

    expect(summary.dominantScope).toBe("DEFERRED");
  });

  it("counts per scope are correct in a mixed batch", () => {
    const contract = createGovernanceCheckpointReintakeSummaryContract({
      now: () => "2026-03-23T10:00:00.000Z",
    });
    const summary = contract.summarize([
      makeReintakeRequest("IMMEDIATE", "f1"),
      makeReintakeRequest("DEFERRED", "f2"),
      makeReintakeRequest("DEFERRED", "f3"),
      makeReintakeRequest("NONE", "f4"),
    ]);

    expect(summary.totalRequests).toBe(4);
    expect(summary.immediateCount).toBe(1);
    expect(summary.deferredCount).toBe(2);
    expect(summary.noReintakeCount).toBe(1);
  });

  it("summary includes a non-empty deterministic summaryHash", () => {
    const contract = createGovernanceCheckpointReintakeSummaryContract({
      now: () => "2026-03-23T10:00:00.000Z",
    });
    const requests = [makeReintakeRequest("NONE", "g")];
    const s1 = contract.summarize(requests);
    const s2 = contract.summarize(requests);

    expect(s1.summaryHash).toBeTruthy();
    expect(s1.summaryHash).toBe(s2.summaryHash);
  });

  it("empty request list → dominantScope NONE with zero counts", () => {
    const contract = createGovernanceCheckpointReintakeSummaryContract({
      now: () => "2026-03-23T10:00:00.000Z",
    });
    const summary = contract.summarize([]);

    expect(summary.totalRequests).toBe(0);
    expect(summary.immediateCount).toBe(0);
    expect(summary.deferredCount).toBe(0);
    expect(summary.noReintakeCount).toBe(0);
    expect(summary.dominantScope).toBe("NONE");
  });
});
