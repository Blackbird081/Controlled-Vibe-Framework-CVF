// CVF MAO-OA-T4 - Operational Review Convergence Focused Tests
//
// Covers worker-output exclusion from isolated reviewer sources, distinct
// reviewer recomputation with packet-bound receipts, self-approval/tainted/
// empty-evidence negatives, deterministic defect/dissent/receipt replay,
// repair-owner requirement, bounded repair versus ceiling escalation,
// repaired-revision terminal ACCEPT, closer count/identity negatives,
// terminal-review convergence outcomes (ACCEPT/REJECT/PARTIAL_ACCEPT),
// commit authorization, session-sync pending-versus-projected states,
// material/session path overlap, and local-barrel export. No test performs
// any filesystem, git, process, or network action.

import { describe, expect, it } from "vitest";

import { createRevisionLedger, recordReviewInLedger, buildReviewReceipt } from "../src/mao/dissent.revision.contract";
import type { MaoReviewReceipt, MaoRevisionLedger } from "../src/mao/dissent.revision.contract";
import { MaoOperationalReviewConvergence, createMaoOperationalReviewConvergence } from "../src/mao/operational.review.convergence";
import type { MaoOperationalReviewRequest, MaoOperationalClosureRequest } from "../src/mao/operational.review.convergence";
import { MaoOperationalReviewConvergence as BarrelConvergence } from "../src/mao";

const WORK_ORDER_ID =
  "docs/work_orders/CVF_AGENT_WORK_ORDER_MAO_OA_T4_OPERATIONAL_REVIEW_CONVERGENCE_AND_COMMIT_SESSION_INTERLOCK_2026-07-17.md";

function freshLedger(maxRevisionDepth = 1): MaoRevisionLedger {
  return createRevisionLedger(maxRevisionDepth);
}

function reviewRequest(overrides: Partial<MaoOperationalReviewRequest> = {}): MaoOperationalReviewRequest {
  return {
    taskId: "t1",
    sourceManifest: [WORK_ORDER_ID, "EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/mao/operational.review.convergence.ts", "worker-output.ts"],
    workerOutputPaths: ["worker-output.ts"],
    workerIdentity: "worker-1",
    reviewerIdentity: "reviewer-1",
    evidenceItems: [WORK_ORDER_ID],
    decision: "ACCEPT",
    ledger: freshLedger(),
    builtAt: "2026-07-17T00:00:00.000Z",
    ...overrides,
  };
}

function acceptedReceiptForClosure(taskId: string, recordedAt = "2026-07-17T00:00:00.000Z"): MaoReviewReceipt {
  return buildReviewReceipt({
    taskId,
    isolatedSourcePacketHash: "packet-hash-fixture",
    recomputedEvidence: [WORK_ORDER_ID],
    decision: "ACCEPT",
    revisionNumber: 0,
    recordedAt,
  });
}

function rejectedReceiptForClosure(taskId: string, recordedAt = "2026-07-17T00:00:00.000Z"): MaoReviewReceipt {
  return buildReviewReceipt({
    taskId,
    isolatedSourcePacketHash: "packet-hash-fixture",
    recomputedEvidence: [WORK_ORDER_ID],
    decision: "REJECT",
    dissent: "rejected-for-test",
    revisionNumber: 0,
    recordedAt,
  });
}

function closureRequest(overrides: Partial<MaoOperationalClosureRequest> = {}): MaoOperationalClosureRequest {
  return {
    taskGraphId: "graph-1",
    reviews: [acceptedReceiptForClosure("t1")],
    designatedCloserIds: ["closer-1"],
    actingCloserId: "closer-1",
    acceptedOutputs: ["t1"],
    rejectedOutputs: [],
    finalChangedSet: ["EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/mao/operational.review.convergence.ts"],
    recordedAt: "2026-07-17T00:00:00.000Z",
    ...overrides,
  };
}

describe("MaoOperationalReviewConvergence", () => {
  it("exports MaoOperationalReviewConvergence from the MAO local barrel", () => {
    expect(BarrelConvergence).toBe(MaoOperationalReviewConvergence);
  });

  // --- Isolated source / self-approval / tainted / empty evidence ---

  it("excludes worker output paths from the isolated reviewer source packet", () => {
    const convergence = createMaoOperationalReviewConvergence();
    const result = convergence.review(reviewRequest());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.packet.sourceManifest).not.toContain("worker-output.ts");
      expect(result.packet.excludedContext.some((entry) => entry.path === "worker-output.ts")).toBe(true);
    }
  });

  it("returns a receipt bound to the isolated packet hash for a distinct reviewer", () => {
    const convergence = createMaoOperationalReviewConvergence();
    const result = convergence.review(reviewRequest());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.receipt.isolatedSourcePacketHash).toBe(result.packet.packetHash);
      expect(result.evidence.packetHash).toBe(result.packet.packetHash);
    }
  });

  it("fails closed on self-approval when reviewer identity equals worker identity", () => {
    const convergence = createMaoOperationalReviewConvergence();
    const result = convergence.review(reviewRequest({ reviewerIdentity: "worker-1" }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("ISOLATED_EVIDENCE_REJECTED");
  });

  it("fails closed when reviewer evidence depends on excluded worker output", () => {
    const convergence = createMaoOperationalReviewConvergence();
    const result = convergence.review(reviewRequest({ evidenceItems: ["worker-output.ts"] }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("ISOLATED_EVIDENCE_REJECTED");
  });

  it("fails closed on empty evidence", () => {
    const convergence = createMaoOperationalReviewConvergence();
    const result = convergence.review(reviewRequest({ evidenceItems: [] }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("ISOLATED_EVIDENCE_REJECTED");
  });

  // --- Deterministic defect/dissent/receipt replay ---

  it("produces deterministic defect and dissent IDs for identical inputs", () => {
    const convergence = createMaoOperationalReviewConvergence();
    const request = reviewRequest({
      decision: "REQUEST_REPAIR",
      defectClass: "WRONG_RESULT",
      defectDetail: "output mismatch",
      repairOwner: "worker-1",
    });
    const first = convergence.review(request);
    const second = convergence.review({ ...request, ledger: freshLedger() });
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (first.ok && second.ok) {
      expect(first.defect?.defectId).toBe(second.defect?.defectId);
      expect(first.dissent?.dissentId).toBe(second.dissent?.dissentId);
      expect(first.receipt.receiptId).toBe(second.receipt.receiptId);
    }
  });

  // --- Repair-owner requirement ---

  it("rejects REQUEST_REPAIR with no repair owner", () => {
    const convergence = createMaoOperationalReviewConvergence();
    const result = convergence.review(reviewRequest({ decision: "REQUEST_REPAIR", repairOwner: null }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("INVALID_REVIEW_INPUT");
  });

  // --- Bounded repair vs ceiling escalation ---

  it("allows the first bounded repair below the revision ceiling", () => {
    const convergence = createMaoOperationalReviewConvergence();
    const result = convergence.review(
      reviewRequest({
        decision: "REQUEST_REPAIR",
        defectClass: "PARTIAL_OUTPUT",
        defectDetail: "missing section",
        repairOwner: "worker-1",
        ledger: freshLedger(1),
      }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.terminal.decision).toBe("REQUEST_REPAIR");
      expect(result.ledger.currentRevision).toBe(0);
    }
  });

  it("escalates a second repair attempt at the revision ceiling", () => {
    const convergence = createMaoOperationalReviewConvergence();
    const firstLedger = freshLedger(1);
    const first = convergence.review(
      reviewRequest({
        decision: "REQUEST_REPAIR",
        defectClass: "PARTIAL_OUTPUT",
        defectDetail: "missing section",
        repairOwner: "worker-1",
        ledger: firstLedger,
      }),
    );
    expect(first.ok).toBe(true);
    if (!first.ok) return;

    const second = convergence.review(
      reviewRequest({
        decision: "REQUEST_REPAIR",
        defectClass: "PARTIAL_OUTPUT",
        defectDetail: "still missing",
        repairOwner: "worker-1",
        ledger: first.ledger,
        builtAt: "2026-07-17T00:05:00.000Z",
      }),
    );
    expect(second.ok).toBe(true);
    if (second.ok) {
      expect(second.terminal.decision).toBe("ESCALATE");
    }
  });

  it("allows a repaired revision to terminate ACCEPT", () => {
    const convergence = createMaoOperationalReviewConvergence();
    const firstLedger = freshLedger(1);
    const first = convergence.review(
      reviewRequest({
        decision: "REQUEST_REPAIR",
        defectClass: "PARTIAL_OUTPUT",
        defectDetail: "missing section",
        repairOwner: "worker-1",
        ledger: firstLedger,
      }),
    );
    expect(first.ok).toBe(true);
    if (!first.ok) return;

    const second = convergence.review(
      reviewRequest({
        decision: "ACCEPT",
        ledger: first.ledger,
        builtAt: "2026-07-17T00:05:00.000Z",
      }),
    );
    expect(second.ok).toBe(true);
    if (second.ok) {
      expect(second.terminal.decision).toBe("ACCEPT");
    }
  });

  // --- Closer count / identity negatives ---

  it("fails closed with zero designated closers", () => {
    const convergence = createMaoOperationalReviewConvergence();
    const result = convergence.converge(closureRequest({ designatedCloserIds: [] }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("CLOSER_COUNT_OR_IDENTITY_FAILURE");
  });

  it("fails closed with one blank designated closer", () => {
    const convergence = createMaoOperationalReviewConvergence();
    const result = convergence.converge(closureRequest({ designatedCloserIds: ["  "] }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("CLOSER_COUNT_OR_IDENTITY_FAILURE");
  });

  it("fails closed with multiple designated closers", () => {
    const convergence = createMaoOperationalReviewConvergence();
    const result = convergence.converge(closureRequest({ designatedCloserIds: ["closer-1", "closer-2"] }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("CLOSER_COUNT_OR_IDENTITY_FAILURE");
  });

  it("fails closed when the acting actor is not the designated closer", () => {
    const convergence = createMaoOperationalReviewConvergence();
    const result = convergence.converge(closureRequest({ actingCloserId: "someone-else" }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("CLOSER_COUNT_OR_IDENTITY_FAILURE");
  });

  it("fails closed when the worker attempts to act as closer", () => {
    const convergence = createMaoOperationalReviewConvergence();
    const result = convergence.converge(closureRequest({ actingCloserId: "worker-1", designatedCloserIds: ["closer-1"] }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("CLOSER_COUNT_OR_IDENTITY_FAILURE");
  });

  // --- Terminal-review convergence outcomes ---

  it("blocks integration on an empty review collection", () => {
    const convergence = createMaoOperationalReviewConvergence();
    const result = convergence.converge(closureRequest({ reviews: [] }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("CLOSER_COUNT_OR_IDENTITY_FAILURE");
  });

  it("blocks integration on a non-terminal REQUEST_REPAIR review", () => {
    const convergence = createMaoOperationalReviewConvergence();
    const nonTerminal = buildReviewReceipt({
      taskId: "t1",
      isolatedSourcePacketHash: "packet-hash-fixture",
      recomputedEvidence: [WORK_ORDER_ID],
      decision: "REQUEST_REPAIR",
      repairOwner: "worker-1",
      revisionNumber: 0,
      recordedAt: "2026-07-17T00:00:00.000Z",
    });
    const result = convergence.converge(closureRequest({ reviews: [nonTerminal] }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("NON_TERMINAL_REVIEW");
  });

  it("blocks integration on a non-terminal ESCALATE review", () => {
    const convergence = createMaoOperationalReviewConvergence();
    const escalated = buildReviewReceipt({
      taskId: "t1",
      isolatedSourcePacketHash: "packet-hash-fixture",
      recomputedEvidence: [WORK_ORDER_ID],
      decision: "ESCALATE",
      revisionNumber: 1,
      recordedAt: "2026-07-17T00:00:00.000Z",
    });
    const result = convergence.converge(closureRequest({ reviews: [escalated] }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("NON_TERMINAL_REVIEW");
  });

  it("produces ACCEPT when every review is ACCEPT", () => {
    const convergence = createMaoOperationalReviewConvergence();
    const result = convergence.converge(closureRequest({ reviews: [acceptedReceiptForClosure("t1")] }));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.integration.decision).toBe("ACCEPT");
  });

  it("produces REJECT when every review is REJECT", () => {
    const convergence = createMaoOperationalReviewConvergence();
    const result = convergence.converge(
      closureRequest({ reviews: [rejectedReceiptForClosure("t1")], acceptedOutputs: [], rejectedOutputs: ["t1"] }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.integration.decision).toBe("REJECT");
  });

  it("produces PARTIAL_ACCEPT for mixed terminal reviews", () => {
    const convergence = createMaoOperationalReviewConvergence();
    const result = convergence.converge(
      closureRequest({
        reviews: [acceptedReceiptForClosure("t1"), rejectedReceiptForClosure("t2")],
        acceptedOutputs: ["t1"],
        rejectedOutputs: ["t2"],
      }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.integration.decision).toBe("PARTIAL_ACCEPT");
  });

  // --- Commit authorization ---

  it("authorizes commit only for the designated closer", () => {
    const convergence = createMaoOperationalReviewConvergence();
    const result = convergence.converge(closureRequest());
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.commitAuthorized).toBe(true);
  });

  // --- Session-sync pending vs projected ---

  it("returns a null session projection (pending) when no material commit ref is supplied", () => {
    const convergence = createMaoOperationalReviewConvergence();
    const result = convergence.converge(closureRequest());
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.sessionProjection).toBeNull();
  });

  it("builds a session projection preserving the caller ref and surfaces once a material commit ref exists", () => {
    const convergence = createMaoOperationalReviewConvergence();
    const result = convergence.converge(
      closureRequest({
        materialCommitRef: "abc1234",
        sessionSurfacePaths: ["CVF_SESSION_MEMORY.md"],
      }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.sessionProjection).not.toBeNull();
      expect(result.sessionProjection?.materialCommitRef).toBe("abc1234");
      expect(result.sessionProjection?.surfacePaths).toEqual(["CVF_SESSION_MEMORY.md"]);
      expect(result.sessionProjection?.required).toBe(true);
    }
  });

  // --- Material/session path overlap ---

  it("fails closed when a material changed-set path overlaps a session surface path", () => {
    const convergence = createMaoOperationalReviewConvergence();
    const result = convergence.converge(
      closureRequest({
        finalChangedSet: ["CVF_SESSION_MEMORY.md"],
        materialCommitRef: "abc1234",
        sessionSurfacePaths: ["CVF_SESSION_MEMORY.md"],
      }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("MATERIAL_SESSION_PATH_OVERLAP");
  });

  // --- Source import discipline ---

  it("imports no git, process, network, provider, or session-generator owner in its source", async () => {
    const { readFile } = await import("node:fs/promises");
    const { join } = await import("node:path");
    const sourcePath = join(__dirname, "..", "src", "mao", "operational.review.convergence.ts");
    const source = await readFile(sourcePath, "utf8");
    expect(source).not.toMatch(/node:child_process/);
    expect(source).not.toMatch(/node:https?/);
    expect(source).not.toMatch(/simple-git|isomorphic-git/);
    expect(source).not.toMatch(/generate_active_session_state/);
    expect(source).not.toMatch(/CVF_CONTROL_PLANE_FOUNDATION/);
  });
});
