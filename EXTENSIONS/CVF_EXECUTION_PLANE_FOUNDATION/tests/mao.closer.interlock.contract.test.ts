import { describe, expect, it } from "vitest";
import {
  validateExactlyOneCloser,
  checkCloserIdentity,
  buildIntegrationReceipt,
  checkCommitAuthorization,
  buildSessionSyncProjection,
  makeIntegrationDecision,
  verifyIntegrationReceiptConsistency,
} from "../src/mao/closer.interlock.contract";
import { buildReviewReceipt } from "../src/mao/dissent.revision.contract";
import type { MaoReviewReceipt } from "../src/mao/dissent.revision.contract";
import type { MaoIntegrationDecision } from "../src/mao/closer.interlock.contract";

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const CLOSER = "closer-1";
const WORKER = "worker-1";
const ADAPTER = "adapter-1";
const SPECIALIST = "specialist-1";
const TASK_GRAPH_ID = "graph-t5-001";

const T0 = "2026-07-11T00:00:00.000Z";
const T1 = "2026-07-11T01:00:00.000Z";

function makeAcceptReview(taskId: string, overrides: Partial<{ revisionNumber: number; recordedAt: string }> = {}): MaoReviewReceipt {
  return buildReviewReceipt({
    taskId,
    isolatedSourcePacketHash: "abc123",
    recomputedEvidence: ["ev1.md"],
    decision: "ACCEPT",
    revisionNumber: overrides.revisionNumber ?? 0,
    recordedAt: overrides.recordedAt ?? T0,
  });
}

function makeRejectReview(taskId: string, dissent: string = "output is wrong"): MaoReviewReceipt {
  return buildReviewReceipt({
    taskId,
    isolatedSourcePacketHash: "abc456",
    recomputedEvidence: ["ev2.md"],
    decision: "REJECT",
    dissent,
    revisionNumber: 0,
    recordedAt: T0,
  });
}

function makeRepairReview(taskId: string): MaoReviewReceipt {
  return buildReviewReceipt({
    taskId,
    isolatedSourcePacketHash: "abc789",
    recomputedEvidence: ["ev3.md"],
    decision: "REQUEST_REPAIR",
    repairOwner: WORKER,
    revisionNumber: 0,
    recordedAt: T0,
  });
}

// ===========================================================================
// 1. Exactly-one closer validation
// ===========================================================================

describe("validateExactlyOneCloser", () => {
  it("accepts a valid non-empty closer identity", () => {
    const result = validateExactlyOneCloser(CLOSER);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.closerActorId).toBe(CLOSER);
  });

  it("trims whitespace from the closer identity", () => {
    const result = validateExactlyOneCloser("  closer-1  ");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.closerActorId).toBe("closer-1");
  });

  it("rejects null closerActorId", () => {
    const result = validateExactlyOneCloser(null);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("empty or missing");
  });

  it("rejects undefined closerActorId", () => {
    const result = validateExactlyOneCloser(undefined);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("empty or missing");
  });

  it("rejects empty string", () => {
    const result = validateExactlyOneCloser("");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("empty or missing");
  });

  it("rejects whitespace-only string", () => {
    const result = validateExactlyOneCloser("   ");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("empty or missing");
  });
});

// ===========================================================================
// 2. Closer identity check
// ===========================================================================

describe("checkCloserIdentity", () => {
  it("passes when the actor is the designated closer", () => {
    const result = checkCloserIdentity(CLOSER, CLOSER);
    expect(result.ok).toBe(true);
  });

  it("rejects a worker attempting closer action", () => {
    const result = checkCloserIdentity(WORKER, CLOSER);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain(WORKER);
    if (!result.ok) expect(result.reason).toContain(CLOSER);
  });

  it("rejects an adapter attempting closer action", () => {
    const result = checkCloserIdentity(ADAPTER, CLOSER);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain(ADAPTER);
  });

  it("rejects a specialist attempting closer action", () => {
    const result = checkCloserIdentity(SPECIALIST, CLOSER);
    expect(result.ok).toBe(false);
  });

  it("rejects an empty actor ID", () => {
    const result = checkCloserIdentity("", CLOSER);
    expect(result.ok).toBe(false);
  });

  it("rejects matching empty actor and designated closer identities", () => {
    expect(checkCloserIdentity("", "").ok).toBe(false);
  });
});

// ===========================================================================
// 3. Integration receipt building
// ===========================================================================

describe("buildIntegrationReceipt", () => {
  const BASE = {
    taskGraphId: TASK_GRAPH_ID,
    closerActorId: CLOSER,
    acceptedOutputs: ["src/a.ts", "tests/a.test.ts"] as readonly string[],
    rejectedOutputs: [] as readonly string[],
    finalChangedSet: ["src/a.ts", "tests/a.test.ts"] as readonly string[],
    decision: "ACCEPT" as MaoIntegrationDecision,
    recordedAt: T0,
  };

  it("produces deterministic receiptId for identical inputs", () => {
    const a = buildIntegrationReceipt(BASE);
    const b = buildIntegrationReceipt(BASE);
    expect(a.receiptId).toBe(b.receiptId);
  });

  it("different closerActorId produces different receiptId", () => {
    const a = buildIntegrationReceipt(BASE);
    const b = buildIntegrationReceipt({ ...BASE, closerActorId: "closer-2" });
    expect(a.receiptId).not.toBe(b.receiptId);
  });

  it("different decision produces different receiptId", () => {
    const a = buildIntegrationReceipt(BASE);
    const b = buildIntegrationReceipt({ ...BASE, decision: "REJECT" });
    expect(a.receiptId).not.toBe(b.receiptId);
  });

  it("different acceptedOutputs produces different receiptId", () => {
    const a = buildIntegrationReceipt(BASE);
    const b = buildIntegrationReceipt({ ...BASE, acceptedOutputs: ["only-b.ts"] });
    expect(a.receiptId).not.toBe(b.receiptId);
  });

  it("receiptId is order-insensitive to acceptedOutputs", () => {
    const a = buildIntegrationReceipt({ ...BASE, acceptedOutputs: ["a.md", "b.md"] });
    const b = buildIntegrationReceipt({ ...BASE, acceptedOutputs: ["b.md", "a.md"] });
    expect(a.receiptId).toBe(b.receiptId);
  });

  it("receiptId is order-insensitive to finalChangedSet", () => {
    const a = buildIntegrationReceipt({ ...BASE, finalChangedSet: ["a.md", "b.md"] });
    const b = buildIntegrationReceipt({ ...BASE, finalChangedSet: ["b.md", "a.md"] });
    expect(a.receiptId).toBe(b.receiptId);
  });

  it("unresolvedDissent is preserved", () => {
    const receipt = buildIntegrationReceipt({
      ...BASE,
      unresolvedDissent: ["dissent-1"],
    });
    expect(receipt.unresolvedDissent).toHaveLength(1);
    expect(receipt.unresolvedDissent[0]).toBe("dissent-1");
  });

  it("commitStewardResult defaults to null", () => {
    const receipt = buildIntegrationReceipt(BASE);
    expect(receipt.commitStewardResult).toBeNull();
  });

  it("commitStewardResult is preserved when set", () => {
    const receipt = buildIntegrationReceipt({ ...BASE, commitStewardResult: "PASS" });
    expect(receipt.commitStewardResult).toBe("PASS");
  });

  it("sessionSyncRequired defaults to false", () => {
    const receipt = buildIntegrationReceipt(BASE);
    expect(receipt.sessionSyncRequired).toBe(false);
  });

  it("sessionSyncRequired is preserved when true", () => {
    const receipt = buildIntegrationReceipt({ ...BASE, sessionSyncRequired: true });
    expect(receipt.sessionSyncRequired).toBe(true);
  });

  it("receipt is deeply frozen", () => {
    const receipt = buildIntegrationReceipt(BASE);
    expect(Object.isFrozen(receipt)).toBe(true);
    expect(Object.isFrozen(receipt.acceptedOutputs)).toBe(true);
    expect(Object.isFrozen(receipt.rejectedOutputs)).toBe(true);
    expect(Object.isFrozen(receipt.unresolvedDissent)).toBe(true);
    expect(Object.isFrozen(receipt.finalChangedSet)).toBe(true);
  });

  it("rejectedOutputs appear in the receipt", () => {
    const receipt = buildIntegrationReceipt({
      ...BASE,
      rejectedOutputs: ["bad.ts"],
    });
    expect(receipt.rejectedOutputs).toHaveLength(1);
    expect(receipt.rejectedOutputs[0]).toBe("bad.ts");
  });
});

// ===========================================================================
// 4. Commit authorization (no-auto-commit guard)
// ===========================================================================

describe("checkCommitAuthorization", () => {
  it("authorizes the designated closer", () => {
    const result = checkCommitAuthorization(CLOSER, CLOSER);
    expect(result.authorized).toBe(true);
  });

  it("denies a worker", () => {
    const result = checkCommitAuthorization(WORKER, CLOSER);
    expect(result.authorized).toBe(false);
    if (!result.authorized) {
      expect(result.reason).toContain(WORKER);
      expect(result.reason).toContain("not authorized");
    }
  });

  it("denies an adapter", () => {
    const result = checkCommitAuthorization(ADAPTER, CLOSER);
    expect(result.authorized).toBe(false);
  });

  it("denies a specialist", () => {
    const result = checkCommitAuthorization(SPECIALIST, CLOSER);
    expect(result.authorized).toBe(false);
  });

  it("denies an empty actor ID", () => {
    const result = checkCommitAuthorization("", CLOSER);
    expect(result.authorized).toBe(false);
  });

  it("denies matching empty actor and designated closer identities", () => {
    expect(checkCommitAuthorization("", "").authorized).toBe(false);
  });

  it("denies a different closer (not the designated one)", () => {
    const result = checkCommitAuthorization("closer-2", CLOSER);
    expect(result.authorized).toBe(false);
    if (!result.authorized) expect(result.reason).toContain("closer-2");
  });
});

// ===========================================================================
// 5. Session-sync projection
// ===========================================================================

describe("buildSessionSyncProjection", () => {
  it("signals required with material commit ref and surface paths", () => {
    const proj = buildSessionSyncProjection("abc1234", [
      "CVF_SESSION_MEMORY.md",
      "CVF_SESSION/ACTIVE_SESSION_STATE.json",
    ]);
    expect(proj.required).toBe(true);
    expect(proj.materialCommitRef).toBe("abc1234");
    expect(proj.surfacePaths).toHaveLength(2);
  });

  it("is deeply frozen", () => {
    const proj = buildSessionSyncProjection("abc1234", ["path.md"]);
    expect(Object.isFrozen(proj)).toBe(true);
    expect(Object.isFrozen(proj.surfacePaths)).toBe(true);
  });

  it("material commit ref is always a string (opaque identifier)", () => {
    const proj = buildSessionSyncProjection("6a38755a1", ["handoff.md"]);
    expect(proj.materialCommitRef).toBe("6a38755a1");
  });

  it("empty surface paths produce an empty frozen array", () => {
    const proj = buildSessionSyncProjection("abc", []);
    expect(proj.surfacePaths).toHaveLength(0);
    expect(Object.isFrozen(proj.surfacePaths)).toBe(true);
  });
});

// ===========================================================================
// 6. Integration decision (end-to-end)
// ===========================================================================

describe("makeIntegrationDecision", () => {
  it("returns ACCEPT when all reviews are ACCEPT", () => {
    const reviews = [makeAcceptReview("t1"), makeAcceptReview("t2")];
    const result = makeIntegrationDecision(
      reviews, CLOSER, CLOSER, TASK_GRAPH_ID,
      ["out1.md", "out2.md"], [], ["out1.md", "out2.md"], T0,
    );
    expect(result.error).toBeNull();
    expect(result.receipt).not.toBeNull();
    if (result.receipt) {
      expect(result.receipt.decision).toBe("ACCEPT");
      expect(result.receipt.sessionSyncRequired).toBe(true);
    }
  });

  it("returns REJECT when all reviews are REJECT", () => {
    const reviews = [makeRejectReview("t1"), makeRejectReview("t2")];
    const result = makeIntegrationDecision(
      reviews, CLOSER, CLOSER, TASK_GRAPH_ID,
      [], ["out1.md", "out2.md"], [], T0,
    );
    expect(result.error).toBeNull();
    expect(result.receipt).not.toBeNull();
    if (result.receipt) {
      expect(result.receipt.decision).toBe("REJECT");
    }
  });

  it("returns PARTIAL_ACCEPT when reviews are mixed", () => {
    const reviews = [makeAcceptReview("t1"), makeRejectReview("t2")];
    const result = makeIntegrationDecision(
      reviews, CLOSER, CLOSER, TASK_GRAPH_ID,
      ["out1.md"], ["out2.md"], ["out1.md"], T0,
    );
    expect(result.error).toBeNull();
    expect(result.receipt).not.toBeNull();
    if (result.receipt) {
      expect(result.receipt.decision).toBe("PARTIAL_ACCEPT");
    }
  });

  it("collects unresolved dissent from non-ACCEPT reviews with dissent", () => {
    const reviews = [makeAcceptReview("t1"), makeRejectReview("t2", "bad output")];
    const result = makeIntegrationDecision(
      reviews, CLOSER, CLOSER, TASK_GRAPH_ID,
      ["out1.md"], ["out2.md"], ["out1.md"], T0,
    );
    expect(result.error).toBeNull();
    expect(result.receipt).not.toBeNull();
    if (result.receipt) {
      expect(result.receipt.unresolvedDissent).toContain("bad output");
    }
  });

  it("does not include dissent from ACCEPT reviews", () => {
    const accept = buildReviewReceipt({
      taskId: "t1",
      isolatedSourcePacketHash: "abc",
      recomputedEvidence: ["ev.md"],
      decision: "ACCEPT",
      dissent: "noise",
      revisionNumber: 0,
      recordedAt: T0,
    });
    const result = makeIntegrationDecision(
      [accept], CLOSER, CLOSER, TASK_GRAPH_ID,
      ["out1.md"], [], ["out1.md"], T0,
    );
    expect(result.receipt).not.toBeNull();
    if (result.receipt) {
      expect(result.receipt.unresolvedDissent).toHaveLength(0);
    }
  });

  it("rejects when the closer actor is not the designated closer", () => {
    const reviews = [makeAcceptReview("t1")];
    const result = makeIntegrationDecision(
      reviews, WORKER, CLOSER, TASK_GRAPH_ID,
      ["out1.md"], [], ["out1.md"], T0,
    );
    expect(result.receipt).toBeNull();
    expect(result.error).toContain("not the designated closer");
  });

  it("rejects when no review receipts are provided", () => {
    const result = makeIntegrationDecision(
      [], CLOSER, CLOSER, TASK_GRAPH_ID,
      [], [], [], T0,
    );
    expect(result.receipt).toBeNull();
    expect(result.error).toContain("at least one review receipt");
  });

  it("blocks integration while a repair request remains open", () => {
    const result = makeIntegrationDecision(
      [makeRepairReview("t1")], CLOSER, CLOSER, TASK_GRAPH_ID, [], [], [], T0,
    );
    expect(result.receipt).toBeNull();
    expect(result.error).toContain("non-terminal");
  });

  it("blocks integration while escalation remains open", () => {
    const result = makeIntegrationDecision(
      [buildReviewReceipt({
        taskId: "t1",
        isolatedSourcePacketHash: "abc-escalate",
        recomputedEvidence: ["ev4.md"],
        decision: "ESCALATE",
        revisionNumber: 0,
        recordedAt: T0,
      })], CLOSER, CLOSER, TASK_GRAPH_ID, [], [], [], T0,
    );
    expect(result.receipt).toBeNull();
    expect(result.error).toContain("non-terminal");
  });

  it("receipt is deterministic for identical integration decisions", () => {
    const reviews = [makeAcceptReview("t1")];
    const a = makeIntegrationDecision(
      reviews, CLOSER, CLOSER, TASK_GRAPH_ID,
      ["out.md"], [], ["out.md"], T0,
    );
    const b = makeIntegrationDecision(
      reviews, CLOSER, CLOSER, TASK_GRAPH_ID,
      ["out.md"], [], ["out.md"], T0,
    );
    expect(a.receipt?.receiptId).toBe(b.receipt?.receiptId);
  });

  it("receipt is deeply frozen", () => {
    const reviews = [makeAcceptReview("t1")];
    const result = makeIntegrationDecision(
      reviews, CLOSER, CLOSER, TASK_GRAPH_ID,
      ["out.md"], [], ["out.md"], T0,
    );
    expect(result.receipt).not.toBeNull();
    if (result.receipt) {
      expect(Object.isFrozen(result.receipt)).toBe(true);
    }
  });
});

// ===========================================================================
// 7. Integration receipt consistency verification
// ===========================================================================

describe("verifyIntegrationReceiptConsistency", () => {
  it("returns ok for a valid receipt", () => {
    const receipt = buildIntegrationReceipt({
      taskGraphId: TASK_GRAPH_ID,
      closerActorId: CLOSER,
      acceptedOutputs: ["out.md"],
      rejectedOutputs: [],
      finalChangedSet: ["out.md"],
      decision: "ACCEPT",
      recordedAt: T0,
    });
    const result = verifyIntegrationReceiptConsistency(receipt);
    expect(result.ok).toBe(true);
  });

  it("returns false when decision is tampered with", () => {
    const receipt = buildIntegrationReceipt({
      taskGraphId: TASK_GRAPH_ID,
      closerActorId: CLOSER,
      acceptedOutputs: ["out.md"],
      rejectedOutputs: [],
      finalChangedSet: ["out.md"],
      decision: "ACCEPT",
      recordedAt: T0,
    });
    const tampered = { ...receipt, decision: "REJECT" as MaoIntegrationDecision };
    const result = verifyIntegrationReceiptConsistency(tampered);
    expect(result.ok).toBe(false);
    expect(result.reason).toContain("receiptId mismatch");
  });

  it("returns false when closerActorId is tampered with", () => {
    const receipt = buildIntegrationReceipt({
      taskGraphId: TASK_GRAPH_ID,
      closerActorId: CLOSER,
      acceptedOutputs: ["out.md"],
      rejectedOutputs: [],
      finalChangedSet: ["out.md"],
      decision: "ACCEPT",
      recordedAt: T0,
    });
    const tampered = { ...receipt, closerActorId: "evil-closer" };
    const result = verifyIntegrationReceiptConsistency(tampered);
    expect(result.ok).toBe(false);
  });

  it("returns false when acceptedOutputs is tampered with", () => {
    const receipt = buildIntegrationReceipt({
      taskGraphId: TASK_GRAPH_ID,
      closerActorId: CLOSER,
      acceptedOutputs: ["out.md"],
      rejectedOutputs: [],
      finalChangedSet: ["out.md"],
      decision: "ACCEPT",
      recordedAt: T0,
    });
    const tampered = { ...receipt, acceptedOutputs: ["evil.md"] };
    const result = verifyIntegrationReceiptConsistency(tampered);
    expect(result.ok).toBe(false);
  });
});

// ===========================================================================
// 8. Cross-contract integration: T4 review + T5 closer
// ===========================================================================

describe("T4-T5 cross-contract integration", () => {
  it("full flow: review -> integration -> commit authorization -> session projection", () => {
    // 1. Reviewer produces an ACCEPT receipt (T4)
    const review = makeAcceptReview("t-worker");

    // 2. Closer validates identity
    const identityCheck = checkCloserIdentity(CLOSER, CLOSER);
    expect(identityCheck.ok).toBe(true);

    // 3. Closer makes integration decision (T5)
    const integration = makeIntegrationDecision(
      [review], CLOSER, CLOSER, TASK_GRAPH_ID,
      ["src/worker.ts", "tests/worker.test.ts"],
      [],
      ["src/worker.ts", "tests/worker.test.ts"],
      T0,
    );
    expect(integration.error).toBeNull();
    expect(integration.receipt?.decision).toBe("ACCEPT");

    // 4. Only closer is authorized to commit
    const commitAuth = checkCommitAuthorization(CLOSER, CLOSER);
    expect(commitAuth.authorized).toBe(true);

    // 5. Worker is denied commit
    const workerAuth = checkCommitAuthorization(WORKER, CLOSER);
    expect(workerAuth.authorized).toBe(false);

    // 6. Session-sync projection is separate
    const proj = buildSessionSyncProjection("abc1234", [
      "CVF_SESSION_MEMORY.md",
      "AGENT_HANDOFF_V41_2026-07-11.md",
    ]);
    expect(proj.required).toBe(true);
    expect(proj.materialCommitRef).toBe("abc1234");
  });

  it("closer rejects integration when worker tries to act as closer", () => {
    const review = makeAcceptReview("t1");
    const result = makeIntegrationDecision(
      [review], WORKER, CLOSER, TASK_GRAPH_ID,
      ["out.md"], [], ["out.md"], T0,
    );
    expect(result.receipt).toBeNull();
    expect(result.error).toContain("not the designated closer");
  });

  it("exactly-one closer rejects null identity", () => {
    const closerCheck = validateExactlyOneCloser(null);
    expect(closerCheck.ok).toBe(false);

    // And without a valid closer, no one can commit
    // (this is tested by the null rejection above)
  });
});
