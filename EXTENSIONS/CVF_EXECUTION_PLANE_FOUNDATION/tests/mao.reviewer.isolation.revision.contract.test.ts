import { describe, expect, it } from "vitest";
import {
  buildIsolatedSourcePacket,
  verifyIsolatedSourcePacket,
  checkSelfApproval,
  checkEvidenceIndependence,
  buildRecomputedEvidence,
} from "../src/mao/reviewer.isolation.contract";
import type {
  MaoIsolatedSourcePacket,
} from "../src/mao/reviewer.isolation.contract";
import {
  buildReviewReceipt,
  buildDefectEntry,
  buildDissentRecord,
  checkRevisionCeiling,
  createRevisionLedger,
  recordReviewInLedger,
  terminalReviewDecision,
  verifyDissentDeterminism,
  verifyReviewReceiptConsistency,
} from "../src/mao/dissent.revision.contract";
import type {
  MaoDefectClass,
  MaoReviewDecision,
  MaoDefectEntry,
  MaoReviewReceipt,
} from "../src/mao/dissent.revision.contract";

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const SRC_A = "docs/reference/CVF_MAO_RUNTIME_FOUNDATION_CONTRACT.md";
const SRC_B = "docs/reference/CVF_MAO_RUNTIME_FOUNDATION_SCHEMA.json";
const SRC_C = "EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/mao/task.graph.contract.ts";
const WORKER_OUT = "docs/reviews/worker-output.md";

function sources(): string[] {
  return [SRC_A, SRC_B, SRC_C, WORKER_OUT];
}

function workerOutputs(): string[] {
  return [WORKER_OUT, "EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/tests/mao.reviewer.isolation.revision.contract.test.ts"];
}

const T0 = "2026-07-11T00:00:00.000Z";
const T1 = "2026-07-11T01:00:00.000Z";

// ===========================================================================
// 1. Isolated source packet
// ===========================================================================

describe("buildIsolatedSourcePacket", () => {
  it("produces a deterministic packet hash for identical inputs", () => {
    const a = buildIsolatedSourcePacket(sources(), [WORKER_OUT], T0);
    const b = buildIsolatedSourcePacket(sources(), [WORKER_OUT], T0);
    expect(a.packetHash).toBe(b.packetHash);
  });

  it("excludes worker output paths from the effective source manifest", () => {
    const packet = buildIsolatedSourcePacket(sources(), [WORKER_OUT], T0);
    expect(packet.sourceManifest).not.toContain(WORKER_OUT);
    expect(packet.sourceManifest).toContain(SRC_A);
    expect(packet.sourceManifest).toContain(SRC_B);
    expect(packet.sourceManifest).toContain(SRC_C);
  });

  it("creates an excluded context entry for each excluded path", () => {
    const packet = buildIsolatedSourcePacket(sources(), [WORKER_OUT], T0);
    expect(packet.excludedContext).toHaveLength(1);
    expect(packet.excludedContext[0].path).toBe(WORKER_OUT);
    expect(packet.excludedContext[0].reason).toContain("worker output");
  });

  it("excludes all paths that appear in workerOutputPaths", () => {
    const packet = buildIsolatedSourcePacket(sources(), [WORKER_OUT, SRC_A], T0);
    expect(packet.sourceManifest).not.toContain(WORKER_OUT);
    expect(packet.sourceManifest).not.toContain(SRC_A);
    expect(packet.sourceManifest).toContain(SRC_B);
    expect(packet.sourceManifest).toContain(SRC_C);
    expect(packet.excludedContext).toHaveLength(2);
  });

  it("different sources produce different packet hash", () => {
    const a = buildIsolatedSourcePacket([SRC_A], [], T0);
    const b = buildIsolatedSourcePacket([SRC_B], [], T0);
    expect(a.packetHash).not.toBe(b.packetHash);
  });

  it("different timestamps produce different packet hash", () => {
    const a = buildIsolatedSourcePacket(sources(), [WORKER_OUT], T0);
    const b = buildIsolatedSourcePacket(sources(), [WORKER_OUT], T1);
    expect(a.packetHash).not.toBe(b.packetHash);
  });

  it("identical effective sources with identical timestamp produce same hash regardless of workerOutputPaths order", () => {
    const a = buildIsolatedSourcePacket(sources(), [WORKER_OUT, SRC_A], T0);
    const b = buildIsolatedSourcePacket(sources(), [SRC_A, WORKER_OUT], T0);
    expect(a.sourceManifest.length).toBe(b.sourceManifest.length);
    // The effective sources are the same set, so the hash should match.
    expect(a.packetHash).toBe(b.packetHash);
  });

  it("packet is deeply frozen", () => {
    const packet = buildIsolatedSourcePacket(sources(), [WORKER_OUT], T0);
    expect(Object.isFrozen(packet)).toBe(true);
    expect(Object.isFrozen(packet.sourceManifest)).toBe(true);
    expect(Object.isFrozen(packet.excludedContext)).toBe(true);
  });
});

describe("verifyIsolatedSourcePacket", () => {
  it("returns true for a valid packet", () => {
    const packet = buildIsolatedSourcePacket(sources(), [WORKER_OUT], T0);
    expect(verifyIsolatedSourcePacket(packet)).toBe(true);
  });

  it("returns false when sourceManifest is tampered with", () => {
    const packet = buildIsolatedSourcePacket(sources(), [WORKER_OUT], T0);
    const tampered = { ...packet, sourceManifest: [...packet.sourceManifest, "fake.md"] } as MaoIsolatedSourcePacket;
    expect(verifyIsolatedSourcePacket(tampered)).toBe(false);
  });

  it("returns false when packetHash is tampered with", () => {
    const packet = buildIsolatedSourcePacket(sources(), [WORKER_OUT], T0);
    const tampered = { ...packet, packetHash: "tampered-hash" } as MaoIsolatedSourcePacket;
    expect(verifyIsolatedSourcePacket(tampered)).toBe(false);
  });

  it("returns false when builtAt differs from original", () => {
    const packet = buildIsolatedSourcePacket(sources(), [WORKER_OUT], T0);
    const tampered = { ...packet, builtAt: T1 } as MaoIsolatedSourcePacket;
    expect(verifyIsolatedSourcePacket(tampered)).toBe(false);
  });
});

// ===========================================================================
// 2. Self-approval guard
// ===========================================================================

describe("checkSelfApproval", () => {
  it("rejects when worker and reviewer are the same identity", () => {
    const result = checkSelfApproval("agent-1", "agent-1");
    expect(result.ok).toBe(false);
    expect(result.reason).toContain("self-approval is forbidden");
  });

  it("passes when worker and reviewer are different", () => {
    const result = checkSelfApproval("worker-1", "reviewer-1");
    expect(result.ok).toBe(true);
  });

  it("rejects empty-string identity match", () => {
    const result = checkSelfApproval("", "");
    expect(result.ok).toBe(false);
  });
});

describe("checkEvidenceIndependence", () => {
  it("rejects when a reviewer evidence path is in worker output", () => {
    const result = checkEvidenceIndependence([WORKER_OUT], [WORKER_OUT]);
    expect(result.ok).toBe(false);
    expect(result.reason).toContain(WORKER_OUT);
  });

  it("passes with no overlap", () => {
    const result = checkEvidenceIndependence([SRC_A, SRC_B], [WORKER_OUT]);
    expect(result.ok).toBe(true);
  });

  it("passes with empty evidence list", () => {
    const result = checkEvidenceIndependence([], [WORKER_OUT]);
    expect(result.ok).toBe(true);
  });

  it("rejects when multiple evidence paths intersect", () => {
    const result = checkEvidenceIndependence([SRC_A, WORKER_OUT], [WORKER_OUT, SRC_B]);
    expect(result.ok).toBe(false);
    expect(result.reason).toContain(WORKER_OUT);
  });
});

// ===========================================================================
// 3. Evidence recomputation
// ===========================================================================

describe("buildRecomputedEvidence", () => {
  const packet = buildIsolatedSourcePacket(sources(), [WORKER_OUT], T0);

  it("succeeds with valid isolation, different identities, and independent evidence", () => {
    const result = buildRecomputedEvidence(packet, "reviewer-1", "worker-1", [SRC_A], [WORKER_OUT], T0);
    expect(result.error).toBeNull();
    expect(result.evidence).not.toBeNull();
    if (result.evidence) {
      expect(result.evidence.packetHash).toBe(packet.packetHash);
      expect(result.evidence.evidenceItems).toEqual([SRC_A]);
      expect(Object.isFrozen(result.evidence)).toBe(true);
    }
  });

  it("fails when packet hash is corrupted", () => {
    const tampered = { ...packet, packetHash: "bad" } as MaoIsolatedSourcePacket;
    const result = buildRecomputedEvidence(tampered, "reviewer-1", "worker-1", [SRC_A], [WORKER_OUT], T0);
    expect(result.evidence).toBeNull();
    expect(result.error).toContain("hash verification failed");
  });

  it("fails on self-approval (same identity)", () => {
    const result = buildRecomputedEvidence(packet, "agent-1", "agent-1", [SRC_A], [WORKER_OUT], T0);
    expect(result.evidence).toBeNull();
    expect(result.error).toContain("self-approval");
  });

  it("fails when evidence depends on worker output", () => {
    const result = buildRecomputedEvidence(packet, "reviewer-1", "worker-1", [WORKER_OUT], [WORKER_OUT], T0);
    expect(result.evidence).toBeNull();
    expect(result.error).toContain(WORKER_OUT);
  });

  it("fails when multiple evidence items depend on worker output", () => {
    const result = buildRecomputedEvidence(packet, "reviewer-1", "worker-1", [WORKER_OUT, "more.md"], [WORKER_OUT, "more.md"], T0);
    expect(result.evidence).toBeNull();
    expect(result.error).toContain("worker output");
  });
});

// ===========================================================================
// 4. Review receipt building
// ===========================================================================

describe("buildReviewReceipt", () => {
  const BASE = {
    taskId: "t-review",
    isolatedSourcePacketHash: "abc123",
    recomputedEvidence: ["ev1.md", "ev2.md"] as readonly string[],
    decision: "REQUEST_REPAIR" as MaoReviewDecision,
    revisionNumber: 0,
    recordedAt: T0,
  };

  it("produces deterministic receiptId for identical inputs", () => {
    const a = buildReviewReceipt(BASE);
    const b = buildReviewReceipt(BASE);
    expect(a.receiptId).toBe(b.receiptId);
  });

  it("different taskId produces different receiptId", () => {
    const a = buildReviewReceipt(BASE);
    const b = buildReviewReceipt({ ...BASE, taskId: "t-other" });
    expect(a.receiptId).not.toBe(b.receiptId);
  });

  it("different decision produces different receiptId", () => {
    const a = buildReviewReceipt(BASE);
    const b = buildReviewReceipt({ ...BASE, decision: "ACCEPT" });
    expect(a.receiptId).not.toBe(b.receiptId);
  });

  it("different revisionNumber produces different receiptId", () => {
    const a = buildReviewReceipt(BASE);
    const b = buildReviewReceipt({ ...BASE, revisionNumber: 1 });
    expect(a.receiptId).not.toBe(b.receiptId);
  });

  it("different recomputedEvidence produces different receiptId", () => {
    const a = buildReviewReceipt(BASE);
    const b = buildReviewReceipt({ ...BASE, recomputedEvidence: ["only-one.md"] });
    expect(a.receiptId).not.toBe(b.receiptId);
  });

  it("receiptId is order-insensitive to recomputedEvidence array", () => {
    const a = buildReviewReceipt({ ...BASE, recomputedEvidence: ["a.md", "b.md"] });
    const b = buildReviewReceipt({ ...BASE, recomputedEvidence: ["b.md", "a.md"] });
    expect(a.receiptId).toBe(b.receiptId);
  });

  it("includes defects in the receipt", () => {
    const defect = buildDefectEntry("MISSING_EVIDENCE", "no test for feature X", "worker");
    const receipt = buildReviewReceipt({ ...BASE, defects: [defect] });
    expect(receipt.defects).toHaveLength(1);
    expect(receipt.defects[0].defectId).toBe(defect.defectId);
  });

  it("receipt is deeply frozen", () => {
    const receipt = buildReviewReceipt(BASE);
    expect(Object.isFrozen(receipt)).toBe(true);
    expect(Object.isFrozen(receipt.recomputedEvidence)).toBe(true);
    expect(Object.isFrozen(receipt.defects)).toBe(true);
  });

  it("dissent field is preserved in the receipt", () => {
    const receipt = buildReviewReceipt({ ...BASE, dissent: "output is incorrect" });
    expect(receipt.dissent).toBe("output is incorrect");
  });

  it("repairOwner is preserved when set", () => {
    const receipt = buildReviewReceipt({ ...BASE, repairOwner: "specialist-1" });
    expect(receipt.repairOwner).toBe("specialist-1");
  });
});

// ===========================================================================
// 5. Defect entries
// ===========================================================================

describe("buildDefectEntry", () => {
  it("produces deterministic defectId", () => {
    const a = buildDefectEntry("MISSING_EVIDENCE", "no coverage", "worker");
    const b = buildDefectEntry("MISSING_EVIDENCE", "no coverage", "worker");
    expect(a.defectId).toBe(b.defectId);
  });

  it("different defectClass produces different defectId", () => {
    const a = buildDefectEntry("MISSING_EVIDENCE", "no coverage", "worker");
    const b = buildDefectEntry("WRONG_RESULT", "no coverage", "worker");
    expect(a.defectId).not.toBe(b.defectId);
  });

  it("different detail produces different defectId", () => {
    const a = buildDefectEntry("MISSING_EVIDENCE", "no coverage", "worker");
    const b = buildDefectEntry("MISSING_EVIDENCE", "wrong coverage", "worker");
    expect(a.defectId).not.toBe(b.defectId);
  });

  it("different repairOwner produces different defectId", () => {
    const a = buildDefectEntry("MISSING_EVIDENCE", "no coverage", "worker");
    const b = buildDefectEntry("MISSING_EVIDENCE", "no coverage", "specialist");
    expect(a.defectId).not.toBe(b.defectId);
  });

  it("null repairOwner is treated as 'unassigned' for determinism", () => {
    const a = buildDefectEntry("MISSING_EVIDENCE", "no coverage", null);
    const b = buildDefectEntry("MISSING_EVIDENCE", "no coverage", null);
    expect(a.defectId).toBe(b.defectId);
  });

  it("result is frozen", () => {
    const entry = buildDefectEntry("MISSING_EVIDENCE", "no coverage", "worker");
    expect(Object.isFrozen(entry)).toBe(true);
  });
});

// ===========================================================================
// 6. Dissent records
// ===========================================================================

describe("buildDissentRecord", () => {
  it("produces deterministic dissentId", () => {
    const a = buildDissentRecord("t1", "reviewer-1", "WRONG_RESULT", "bad output", T0);
    const b = buildDissentRecord("t1", "reviewer-1", "WRONG_RESULT", "bad output", T0);
    expect(a.dissentId).toBe(b.dissentId);
  });

  it("different defectClass produces different dissentId", () => {
    const a = buildDissentRecord("t1", "reviewer-1", "WRONG_RESULT", "bad", T0);
    const b = buildDissentRecord("t1", "reviewer-1", "MISSING_EVIDENCE", "bad", T0);
    expect(a.dissentId).not.toBe(b.dissentId);
  });

  it("different reviewer produces different dissentId", () => {
    const a = buildDissentRecord("t1", "reviewer-1", "WRONG_RESULT", "bad", T0);
    const b = buildDissentRecord("t1", "reviewer-2", "WRONG_RESULT", "bad", T0);
    expect(a.dissentId).not.toBe(b.dissentId);
  });

  it("result is frozen", () => {
    const record = buildDissentRecord("t1", "reviewer-1", "WRONG_RESULT", "bad output", T0);
    expect(Object.isFrozen(record)).toBe(true);
  });
});

// ===========================================================================
// 7. Revision ceiling
// ===========================================================================

describe("checkRevisionCeiling", () => {
  it("allows revision 0 with maxRevisionDepth 1", () => {
    const result = checkRevisionCeiling(0, 1);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.nextRevision).toBe(1);
  });

  it("allows revision 0 with maxRevisionDepth 2", () => {
    const result = checkRevisionCeiling(0, 2);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.nextRevision).toBe(1);
  });

  it("blocks revision 1 with maxRevisionDepth 1 (at ceiling)", () => {
    const result = checkRevisionCeiling(1, 1);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain("ceiling reached");
      expect(result.escalationRequired).toBe(true);
    }
  });

  it("blocks revision 0 with maxRevisionDepth 0 (zero repairs)", () => {
    const result = checkRevisionCeiling(0, 0);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.escalationRequired).toBe(true);
  });

  it("allows revision 2 with maxRevisionDepth 3", () => {
    const result = checkRevisionCeiling(2, 3);
    expect(result.ok).toBe(true);
  });

  it("blocks revision 3 with maxRevisionDepth 3", () => {
    const result = checkRevisionCeiling(3, 3);
    expect(result.ok).toBe(false);
  });

  it("forceEscalate overrides even when under ceiling", () => {
    const result = checkRevisionCeiling(0, 10, true);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain("escalation flag");
      expect(result.escalationRequired).toBe(true);
    }
  });
});

// ===========================================================================
// 8. Revision ledger
// ===========================================================================

function makeTestReceipt(overrides: Partial<{
  taskId: string; decision: MaoReviewDecision; revisionNumber: number; repairOwner: string | null;
}> = {}): MaoReviewReceipt {
  return buildReviewReceipt({
    taskId: overrides.taskId ?? "t1",
    isolatedSourcePacketHash: "abc123",
    recomputedEvidence: ["ev1.md"],
    decision: overrides.decision ?? "REQUEST_REPAIR",
    repairOwner: overrides.repairOwner ?? "worker",
    revisionNumber: overrides.revisionNumber ?? 0,
    recordedAt: T0,
  });
}

describe("createRevisionLedger", () => {
  it("starts at revision 0 with configured maxRevisionDepth", () => {
    const ledger = createRevisionLedger(1);
    expect(ledger.currentRevision).toBe(0);
    expect(ledger.maxRevisionDepth).toBe(1);
    expect(ledger.receipts).toHaveLength(0);
  });
});

describe("recordReviewInLedger", () => {
  it("records first receipt successfully", () => {
    const ledger = createRevisionLedger(1);
    const receipt = makeTestReceipt({ revisionNumber: 0 });
    const result = recordReviewInLedger(ledger, receipt);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.ledger.receipts).toHaveLength(1);
      expect(result.ledger.currentRevision).toBe(0);
    }
  });

  it("rejects recording when ceiling is hit (revision 1, max 1)", () => {
    const prior = makeTestReceipt({ revisionNumber: 1 });
    const ledger = { receipts: [prior], currentRevision: 1, maxRevisionDepth: 1 };
    const receipt = makeTestReceipt({ revisionNumber: 2 });
    const result = recordReviewInLedger(ledger, receipt);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain("exceeds maxRevisionDepth");
    }
  });

  it("records multiple reviews up to the ceiling", () => {
    let ledger = createRevisionLedger(3);
    const r0 = makeTestReceipt({ revisionNumber: 0 });
    const res0 = recordReviewInLedger(ledger, r0);
    expect(res0.ok).toBe(true);
    if (res0.ok) {
      ledger = res0.ledger;
      expect(ledger.receipts).toHaveLength(1);
      expect(ledger.currentRevision).toBe(0);
    }

    const r1 = makeTestReceipt({ revisionNumber: 1 });
    const res1 = recordReviewInLedger(ledger, r1);
    expect(res1.ok).toBe(true);
    if (res1.ok) {
      ledger = res1.ledger;
      expect(ledger.receipts).toHaveLength(2);
      expect(ledger.currentRevision).toBe(1);
    }
  });

  it("allows the initial review with zero-repair ceiling", () => {
    const ledger = createRevisionLedger(0);
    const receipt = makeTestReceipt({ revisionNumber: 0 });
    const result = recordReviewInLedger(ledger, receipt);
    expect(result.ok).toBe(true);
  });
});

// ===========================================================================
// 9. Terminal review decision
// ===========================================================================

describe("terminalReviewDecision", () => {
  it("ACCEPT passes through when under ceiling", () => {
    const receipt = makeTestReceipt({ decision: "ACCEPT" });
    const ceiling = checkRevisionCeiling(0, 1);
    const result = terminalReviewDecision(receipt, ceiling);
    expect(result.decision).toBe("ACCEPT");
  });

  it("REQUEST_REPAIR passes through when under ceiling", () => {
    const receipt = makeTestReceipt({ decision: "REQUEST_REPAIR" });
    const ceiling = checkRevisionCeiling(0, 1);
    const result = terminalReviewDecision(receipt, ceiling);
    expect(result.decision).toBe("REQUEST_REPAIR");
    if (result.decision === "REQUEST_REPAIR") {
      expect(result.repairOwner).toBe("worker");
    }
  });

  it("REJECT passes through when under ceiling", () => {
    const receipt = makeTestReceipt({ decision: "REJECT" });
    const ceiling = checkRevisionCeiling(0, 1);
    const result = terminalReviewDecision(receipt, ceiling);
    expect(result.decision).toBe("REJECT");
  });

  it("ESCALATE passes through when under ceiling", () => {
    const receipt = makeTestReceipt({ decision: "ESCALATE" });
    const ceiling = checkRevisionCeiling(0, 1);
    const result = terminalReviewDecision(receipt, ceiling);
    expect(result.decision).toBe("ESCALATE");
  });

  it("REQUEST_REPAIR promotes to ESCALATE when at ceiling", () => {
    const receipt = makeTestReceipt({ decision: "REQUEST_REPAIR" });
    const ceiling = checkRevisionCeiling(1, 1);
    expect(ceiling.ok).toBe(false);
    const result = terminalReviewDecision(receipt, ceiling);
    expect(result.decision).toBe("ESCALATE");
    if (result.decision === "ESCALATE") {
      expect(result.reason).toContain("ceiling reached");
    }
  });

  it("ACCEPT still passes through when at ceiling (terminal, not repair)", () => {
    const receipt = makeTestReceipt({ decision: "ACCEPT" });
    const ceiling = checkRevisionCeiling(1, 1);
    expect(ceiling.ok).toBe(false);
    const result = terminalReviewDecision(receipt, ceiling);
    expect(result.decision).toBe("ACCEPT");
  });

  it("REJECT still passes through when at ceiling", () => {
    const receipt = makeTestReceipt({ decision: "REJECT" });
    const ceiling = checkRevisionCeiling(1, 1);
    expect(ceiling.ok).toBe(false);
    const result = terminalReviewDecision(receipt, ceiling);
    expect(result.decision).toBe("REJECT");
  });

  it("ESCALATE promotes to ESCALATE with ceiling reason when at ceiling", () => {
    const receipt = makeTestReceipt({ decision: "ESCALATE" });
    const ceiling = checkRevisionCeiling(1, 1);
    expect(ceiling.ok).toBe(false);
    const result = terminalReviewDecision(receipt, ceiling);
    expect(result.decision).toBe("ESCALATE");
    if (result.decision === "ESCALATE") {
      expect(result.reason).toContain("ceiling reached");
    }
  });

  it("REQUEST_REPAIR uses receipt repairOwner in terminal decision output", () => {
    const receipt = makeTestReceipt({ decision: "REQUEST_REPAIR", repairOwner: "specialist-1" });
    const ceiling = checkRevisionCeiling(0, 1);
    const result = terminalReviewDecision(receipt, ceiling);
    if (result.decision === "REQUEST_REPAIR") {
      expect(result.repairOwner).toBe("specialist-1");
    }
  });
});

// ===========================================================================
// 10. Replay verification
// ===========================================================================

describe("verifyDissentDeterminism", () => {
  it("returns true when replayed dissent matches expected ID", () => {
    const record = buildDissentRecord("t1", "reviewer-1", "WRONG_RESULT", "bad output", T0);
    expect(verifyDissentDeterminism("t1", "reviewer-1", "WRONG_RESULT", "bad output", T0, record.dissentId)).toBe(true);
  });

  it("returns false when detail differs", () => {
    const record = buildDissentRecord("t1", "reviewer-1", "WRONG_RESULT", "bad output", T0);
    expect(verifyDissentDeterminism("t1", "reviewer-1", "WRONG_RESULT", "different detail", T0, record.dissentId)).toBe(false);
  });

  it("returns false when defectClass differs", () => {
    const record = buildDissentRecord("t1", "reviewer-1", "WRONG_RESULT", "bad output", T0);
    expect(verifyDissentDeterminism("t1", "reviewer-1", "MISSING_EVIDENCE", "bad output", T0, record.dissentId)).toBe(false);
  });
});

describe("verifyReviewReceiptConsistency", () => {
  it("returns ok for a valid receipt", () => {
    const receipt = makeTestReceipt();
    const result = verifyReviewReceiptConsistency(receipt);
    expect(result.ok).toBe(true);
  });

  it("returns false when decision is tampered with", () => {
    const receipt = makeTestReceipt();
    const tampered = { ...receipt, decision: "REJECT" as MaoReviewDecision };
    const result = verifyReviewReceiptConsistency(tampered);
    expect(result.ok).toBe(false);
    expect(result.reason).toContain("receiptId mismatch");
  });

  it("returns false when recomputedEvidence is tampered with", () => {
    const receipt = makeTestReceipt();
    const tampered = { ...receipt, recomputedEvidence: ["tampered.md"] };
    const result = verifyReviewReceiptConsistency(tampered);
    expect(result.ok).toBe(false);
  });

  it("returns false when defects are tampered with", () => {
    const receipt = buildReviewReceipt({
      taskId: "t1",
      isolatedSourcePacketHash: "abc123",
      recomputedEvidence: ["ev1.md"],
      decision: "REQUEST_REPAIR",
      revisionNumber: 0,
      recordedAt: T0,
      defects: [buildDefectEntry("MISSING_EVIDENCE", "no coverage", "worker")],
    });
    const tampered = {
      ...receipt,
      defects: [buildDefectEntry("WRONG_RESULT", "different", "worker")],
    };
    const result = verifyReviewReceiptConsistency(tampered);
    expect(result.ok).toBe(false);
  });

  it("returns ok for ACCEPT receipt with no defects", () => {
    const receipt = buildReviewReceipt({
      taskId: "t1",
      isolatedSourcePacketHash: "abc123",
      recomputedEvidence: ["ev1.md"],
      decision: "ACCEPT",
      revisionNumber: 0,
      recordedAt: T0,
    });
    expect(verifyReviewReceiptConsistency(receipt).ok).toBe(true);
  });
});

// ===========================================================================
// 11. Cross-module integration: full review flow
// ===========================================================================

describe("end-to-end review flow", () => {
  it("builds isolated packet, recomputes evidence, issues review receipt, records in ledger, terminal accept", () => {
    const packet = buildIsolatedSourcePacket(sources(), [WORKER_OUT], T0);
    expect(verifyIsolatedSourcePacket(packet)).toBe(true);

    const evidenceResult = buildRecomputedEvidence(packet, "reviewer-1", "worker-1", [SRC_A, SRC_B], [WORKER_OUT], T0);
    expect(evidenceResult.error).toBeNull();
    expect(evidenceResult.evidence).not.toBeNull();

    const receipt = buildReviewReceipt({
      taskId: "t1",
      isolatedSourcePacketHash: packet.packetHash,
      recomputedEvidence: evidenceResult.evidence!.evidenceItems,
      decision: "ACCEPT",
      revisionNumber: 0,
      recordedAt: T0,
    });

    expect(verifyReviewReceiptConsistency(receipt).ok).toBe(true);

    const ledger = createRevisionLedger(1);
    const recordResult = recordReviewInLedger(ledger, receipt);
    expect(recordResult.ok).toBe(true);

    const ceiling = checkRevisionCeiling(0, 1);
    const terminal = terminalReviewDecision(receipt, ceiling);
    expect(terminal.decision).toBe("ACCEPT");
  });

  it("full repair/revision cycle: review, repair, re-review, accept", () => {
    const packet = buildIsolatedSourcePacket(sources(), [WORKER_OUT], T0);

    // First review: REQUEST_REPAIR
    const defect = buildDefectEntry("MISSING_EVIDENCE", "no test for edge case", "worker");
    const receipt1 = buildReviewReceipt({
      taskId: "t1",
      isolatedSourcePacketHash: packet.packetHash,
      recomputedEvidence: [SRC_A],
      defects: [defect],
      decision: "REQUEST_REPAIR",
      repairOwner: "worker",
      revisionNumber: 0,
      recordedAt: T0,
    });

    expect(verifyReviewReceiptConsistency(receipt1).ok).toBe(true);

    let ledger = createRevisionLedger(1);
    let res = recordReviewInLedger(ledger, receipt1);
    expect(res.ok).toBe(true);
    if (res.ok) ledger = res.ledger;

    // Second review after repair: ACCEPT
    const receipt2 = buildReviewReceipt({
      taskId: "t1",
      isolatedSourcePacketHash: packet.packetHash,
      recomputedEvidence: [SRC_A, SRC_B],
      decision: "ACCEPT",
      revisionNumber: 1,
      recordedAt: T1,
    });

    res = recordReviewInLedger(ledger, receipt2);
    expect(res.ok).toBe(true);
    if (res.ok) ledger = res.ledger;
    expect(ledger.currentRevision).toBe(1);
    expect(ledger.receipts).toHaveLength(2);

    // At ceiling, a third repair attempt should be blocked
    const receipt3 = buildReviewReceipt({
      taskId: "t1",
      isolatedSourcePacketHash: packet.packetHash,
      recomputedEvidence: [SRC_A],
      decision: "REQUEST_REPAIR",
      revisionNumber: 2,
      recordedAt: T0,
    });

    res = recordReviewInLedger(ledger, receipt3);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.escalationRequired).toBe(true);

    const ceiling = checkRevisionCeiling(1, 1);
    expect(ceiling.ok).toBe(false);
  });

  it("rejects when reviewer tries to use worker output as isolation source", () => {
    const taintedSources = [SRC_A, WORKER_OUT];
    const packet = buildIsolatedSourcePacket(taintedSources, [], T0);
    // The packet still builds (we didn't exclude anything), but it includes worker output...
    // However, buildIsolatedSourcePacket only excludes when workerOutputPaths is provided.
    // If the builder fails to exclude worker output, the packet's sourceManifest includes it,
    // and the downstream evidence recomputation checkEvidenceIndependence should catch it.
    const evidenceResult = buildRecomputedEvidence(packet, "reviewer-1", "worker-1", [WORKER_OUT], [WORKER_OUT], T0);
    expect(evidenceResult.evidence).toBeNull();
    expect(evidenceResult.error).toContain("worker output");
  });
});

// ===========================================================================
// 12. Negative: identity collision blocks the entire flow
// ===========================================================================

describe("identity collision blocks review", () => {
  it("self-approval detected in buildRecomputedEvidence", () => {
    const packet = buildIsolatedSourcePacket(sources(), [WORKER_OUT], T0);
    const result = buildRecomputedEvidence(packet, "same-agent", "same-agent", [SRC_A], [WORKER_OUT], T0);
    expect(result.evidence).toBeNull();
    expect(result.error).toContain("self-approval");
  });

  it("self-approval detected via checkSelfApproval directly", () => {
    const result = checkSelfApproval("agent-x", "agent-x");
    expect(result.ok).toBe(false);
  });
});
