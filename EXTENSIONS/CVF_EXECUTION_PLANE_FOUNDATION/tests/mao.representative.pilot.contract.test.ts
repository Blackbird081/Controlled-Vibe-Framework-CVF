// CVF MAO-T8 - Representative End-To-End Pilot Harness Tests
//
// Focused tests for src/mao/representative.pilot.contract.ts. Covers the
// full worker -> independent reviewer -> one classified revision ->
// designated closer chain for the selected pilot task
// `MAO-T8-LOCAL-STALE-READOUT-REPAIR`, plus the five required negative
// scenarios: self-approval, duplicate execution/admission, timeout, cancel,
// and budget ceiling. No provider, network, real wall-clock, queue, UI, or
// workspace/session mutation.

import { describe, expect, it } from "vitest";
import {
  PILOT_TASK_GRAPH_ID,
  PILOT_WORKER_IDENTITY,
  PILOT_REVIEWER_IDENTITY,
  PILOT_CLOSER_IDENTITY,
  PILOT_MAX_REVISION_DEPTH,
  compilePilotGraph,
  runWorkerPhase,
  runReviewerPhase,
  runCloserPhase,
  runDuplicateAdmissionNegative,
  runTimeoutNegative,
  runCancelNegative,
  runBudgetCeilingNegative,
  runPilotChain,
  type MaoPilotSeedReceipt,
} from "../src/mao/representative.pilot.contract";
import { createRevisionLedger } from "../src/mao/dissent.revision.contract";

const T0 = "2026-07-11T00:00:00.000Z";

function iso(offsetMs: number): string {
  return new Date(new Date(T0).getTime() + offsetMs).toISOString();
}

const SEED_RECEIPTS: MaoPilotSeedReceipt[] = [
  { taskId: null, receiptKind: "GRAPH", fields: { compilerVersion: "1" }, recordedAt: iso(0) },
  { taskId: "worker-task", receiptKind: "ROLE_RESOLUTION", fields: { role: "worker" }, recordedAt: iso(1000) },
  { taskId: "worker-task", receiptKind: "OUTPUT", fields: { note: "readout-produced" }, recordedAt: iso(2000) },
];

describe("compilePilotGraph", () => {
  it("compiles successfully at the pilot concurrency ceiling", () => {
    const result = compilePilotGraph(3);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.graph.tasks).toHaveLength(2);
      expect(result.graph.tasks.map((t) => t.taskId)).toEqual(["worker-task", "reviewer-task"]);
    }
  });

  it("rejects a graph above the pilot concurrency ceiling", () => {
    const result = compilePilotGraph(4);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("BUDGET_CONCURRENCY_EXCEEDS_CEILING");
  });
});

describe("runWorkerPhase", () => {
  it("seeds the ledger in order and builds a readout", () => {
    const { ledger, readout } = runWorkerPhase(SEED_RECEIPTS, iso(3000));
    expect(ledger.getTaskGraphId()).toBe(PILOT_TASK_GRAPH_ID);
    expect(ledger.getRecords()).toHaveLength(3);
    expect(readout.totalReceipts).toBe(3);
    expect(readout.lastRecordedAt).toBe(iso(2000));
  });

  it("produces a deliberately stale readout when generatedAt is far past the last receipt", () => {
    const { readout } = runWorkerPhase(SEED_RECEIPTS, iso(999_999));
    expect(readout.lastRecordedAt).toBe(iso(2000));
    // Readout construction itself is a pure fold; staleness is a downstream
    // reviewer judgment, not something buildEvidenceReadout decides.
    expect(readout.generatedAt).toBe(iso(999_999));
  });
});

describe("runReviewerPhase", () => {
  it("rejects self-approval when reviewer identity equals worker identity", () => {
    const { ledger, readout } = runWorkerPhase(SEED_RECEIPTS, iso(3000));
    const revisionLedger = createRevisionLedger(PILOT_MAX_REVISION_DEPTH);
    const result = runReviewerPhase(
      ledger,
      readout,
      iso(3000),
      revisionLedger,
      0,
      iso(3000),
      PILOT_WORKER_IDENTITY,
      PILOT_WORKER_IDENTITY,
    );
    expect(result.outcome).toBeNull();
    expect(result.error).toContain("self-approval is forbidden");
  });

  it("excludes the worker output path from the isolated source packet", () => {
    const { ledger, readout } = runWorkerPhase(SEED_RECEIPTS, iso(3000));
    const revisionLedger = createRevisionLedger(PILOT_MAX_REVISION_DEPTH);
    const result = runReviewerPhase(ledger, readout, iso(3000), revisionLedger, 0, iso(3000));
    expect(result.outcome).not.toBeNull();
    if (!result.outcome) return;
    const excludedPaths = result.outcome.isolatedPacket.excludedContext.map((e) => e.path);
    expect(excludedPaths).toContain("pilot/readout.json");
  });

  it("independently classifies STALE and requests repair when the readout is stale", () => {
    const { ledger, readout } = runWorkerPhase(SEED_RECEIPTS, iso(999_999));
    const revisionLedger = createRevisionLedger(PILOT_MAX_REVISION_DEPTH);
    const result = runReviewerPhase(ledger, readout, iso(999_999), revisionLedger, 0, iso(999_999));
    expect(result.outcome).not.toBeNull();
    if (!result.outcome) return;
    expect(result.outcome.recomputedFreshness).toBe("STALE");
    expect(result.outcome.terminal.decision).toBe("REQUEST_REPAIR");
  });

  it("independently classifies CURRENT and accepts when the readout is fresh", () => {
    const { ledger, readout } = runWorkerPhase(SEED_RECEIPTS, iso(3000));
    const revisionLedger = createRevisionLedger(PILOT_MAX_REVISION_DEPTH);
    const result = runReviewerPhase(ledger, readout, iso(3000), revisionLedger, 0, iso(3000));
    expect(result.outcome).not.toBeNull();
    if (!result.outcome) return;
    expect(result.outcome.recomputedFreshness).toBe("CURRENT");
    expect(result.outcome.terminal.decision).toBe("ACCEPT");
  });
});

describe("runCloserPhase", () => {
  it("rejects an actor that is not the designated closer", () => {
    const result = runCloserPhase([], "some-other-actor", PILOT_CLOSER_IDENTITY, T0);
    expect(result.receipt).toBeNull();
    expect(result.error).toContain("not the designated closer");
  });

  it("rejects closing with zero review receipts", () => {
    const result = runCloserPhase([], PILOT_CLOSER_IDENTITY, PILOT_CLOSER_IDENTITY, T0);
    expect(result.receipt).toBeNull();
    expect(result.error).toContain("at least one review receipt");
  });
});

describe("negative scenario: self-approval", () => {
  it("is rejected end to end via runReviewerPhase", () => {
    const { ledger, readout } = runWorkerPhase(SEED_RECEIPTS, iso(3000));
    const revisionLedger = createRevisionLedger(PILOT_MAX_REVISION_DEPTH);
    const result = runReviewerPhase(
      ledger,
      readout,
      iso(3000),
      revisionLedger,
      0,
      iso(3000),
      "same-actor",
      "same-actor",
    );
    expect(result.outcome).toBeNull();
  });
});

describe("negative scenario: duplicate execution/admission", () => {
  it("rejects the second claim of the same idempotency key without a duplicate side effect", () => {
    const result = runDuplicateAdmissionNegative("pilot-idempotency-key-1");
    expect(result.firstClaim).toBe(true);
    expect(result.secondClaim).toBe(false);
    expect(result.duplicateRejectedWithoutSideEffect).toBe(true);
  });

  it("different keys are independent and both succeed", () => {
    const a = runDuplicateAdmissionNegative("key-a");
    const b = runDuplicateAdmissionNegative("key-b");
    expect(a.firstClaim).toBe(true);
    expect(b.firstClaim).toBe(true);
  });
});

describe("negative scenario: timeout", () => {
  it("classifies a terminal timed-out result and never infers success", () => {
    const result = runTimeoutNegative(T0, 1000, 5000);
    expect(result.timedOut).toBe(true);
    expect(result.inferredSuccess).toBe(false);
  });

  it("does not time out when under the ceiling, and still never infers success", () => {
    const result = runTimeoutNegative(T0, 10_000, 1000);
    expect(result.timedOut).toBe(false);
    expect(result.inferredSuccess).toBe(false);
  });
});

describe("negative scenario: cancel", () => {
  it("blocks new child admission once cancellation is accepted", () => {
    const result = runCancelNegative("pilot-task", T0);
    expect(result.tracker.state).toBe("ACCEPTED");
    expect(result.tracker.blocksNewChildren).toBe(true);
    expect(result.mayStartAfterAccept).toBe(false);
  });
});

describe("negative scenario: budget ceiling", () => {
  it("rejects an over-ceiling graph before any task executes", () => {
    const result = runBudgetCeilingNegative(4);
    expect(result.rejectedBeforeExecution).toBe(true);
    expect(result.compileResult.ok).toBe(false);
  });

  it("does not reject a graph at the ceiling", () => {
    const result = runBudgetCeilingNegative(3);
    expect(result.rejectedBeforeExecution).toBe(false);
    expect(result.compileResult.ok).toBe(true);
  });
});

describe("runPilotChain (full representative end-to-end chain)", () => {
  const STALE_AT = iso(999_999);
  const REVISED_AT = iso(1_000_000);
  const SECOND_REVIEW_AT = iso(1_000_500);
  const CLOSE_AT = iso(1_001_000);

  it("compiles the graph successfully", () => {
    const result = runPilotChain(SEED_RECEIPTS, STALE_AT, STALE_AT, REVISED_AT, SECOND_REVIEW_AT, CLOSE_AT);
    expect(result.compileResult.ok).toBe(true);
    expect(result.graph).not.toBeNull();
  });

  it("detects the deliberately stale initial readout and requests exactly one repair", () => {
    const result = runPilotChain(SEED_RECEIPTS, STALE_AT, STALE_AT, REVISED_AT, SECOND_REVIEW_AT, CLOSE_AT);
    expect(result.initialFreshness).toBe("STALE");
    expect(result.firstReview.terminal.decision).toBe("REQUEST_REPAIR");
    expect(result.revisionCount).toBe(1);
  });

  it("regenerates a fresh readout and the second review accepts it", () => {
    const result = runPilotChain(SEED_RECEIPTS, STALE_AT, STALE_AT, REVISED_AT, SECOND_REVIEW_AT, CLOSE_AT);
    expect(result.revisedReadout).not.toBeNull();
    expect(result.revisedFreshness).toBe("CURRENT");
    expect(result.secondReview).not.toBeNull();
    expect(result.secondReview?.terminal.decision).toBe("ACCEPT");
  });

  it("closes with a consistent terminal integration receipt only after acceptance", () => {
    const result = runPilotChain(SEED_RECEIPTS, STALE_AT, STALE_AT, REVISED_AT, SECOND_REVIEW_AT, CLOSE_AT);
    expect(result.closeOutcome).not.toBeNull();
    expect(result.closeOutcome?.receipt).not.toBeNull();
    expect(result.closeOutcome?.receipt?.decision).toBe("ACCEPT");
    expect(result.closeOutcome?.receipt?.closerActorId).toBe(PILOT_CLOSER_IDENTITY);
  });

  it("closes immediately with no revision when the initial readout is already fresh", () => {
    const result = runPilotChain(SEED_RECEIPTS, iso(3000), iso(3000), iso(3000), iso(3000), iso(4000));
    expect(result.initialFreshness).toBe("CURRENT");
    expect(result.firstReview.terminal.decision).toBe("ACCEPT");
    expect(result.revisionCount).toBe(0);
    expect(result.closeOutcome?.receipt?.decision).toBe("ACCEPT");
  });

  it("rejects a revision that moves the proof clock backwards", () => {
    expect(() => runPilotChain(SEED_RECEIPTS, STALE_AT, STALE_AT, iso(2500), iso(3000), iso(3500)))
      .toThrow("timestamps must be monotonic");
  });

  it("never mutates the underlying evidence ledger between the two reviews (deterministic replay)", () => {
    const resultA = runPilotChain(SEED_RECEIPTS, STALE_AT, STALE_AT, REVISED_AT, SECOND_REVIEW_AT, CLOSE_AT);
    const resultB = runPilotChain(SEED_RECEIPTS, STALE_AT, STALE_AT, REVISED_AT, SECOND_REVIEW_AT, CLOSE_AT);
    expect(resultA.closeOutcome?.receipt?.receiptId).toBe(resultB.closeOutcome?.receipt?.receiptId);
  });
});
