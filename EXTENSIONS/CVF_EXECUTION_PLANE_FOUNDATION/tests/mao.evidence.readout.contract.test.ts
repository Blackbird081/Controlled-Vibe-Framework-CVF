// CVF MAO-T7 - Evidence, Observability, And Operator Readout Contract Tests
//
// Focused tests for src/mao/evidence.readout.contract.ts. Covers secret-safe
// redaction, evidence ledger ingestion, deterministic read-model replay,
// retention policy, freshness classification, and milestone-only workspace
// projection. No provider, network, real wall-clock, queue, UI, or
// workspace/session mutation.

import { describe, expect, it } from "vitest";
import {
  redactFields,
  MaoEvidenceLedger,
  buildEvidenceReadout,
  readoutsAreEqual,
  evaluateRetention,
  classifyReadoutFreshness,
  milestoneForReceiptKind,
  projectWorkspaceMilestones,
  type MaoReceiptKind,
} from "../src/mao/evidence.readout.contract";

const T0 = "2026-07-11T00:00:00.000Z";

function iso(offsetMs: number): string {
  return new Date(new Date(T0).getTime() + offsetMs).toISOString();
}

describe("redactFields", () => {
  it("drops known secret-shaped field names and keeps safe fields", () => {
    const result = redactFields({
      role: "worker",
      apiKey: "sk-should-not-appear",
      note: "ok",
    });
    expect(result.redactedFields).toEqual(["apiKey"]);
    expect(result.safeFields).toEqual({ role: "worker", note: "ok" });
  });

  it("drops case- and separator-insensitive secret field names", () => {
    const result = redactFields({
      "Raw-Prompt": "leak",
      RAW_PROMPT: "leak2",
      ACCESS_TOKEN: "leak3",
      taskId: "t-1",
    });
    expect([...result.redactedFields].sort()).toEqual(["ACCESS_TOKEN", "RAW_PROMPT", "Raw-Prompt"].sort());
    expect(result.safeFields).toEqual({ taskId: "t-1" });
  });

  it("returns empty redaction for an all-safe field map", () => {
    const result = redactFields({ taskId: "t-1", role: "reviewer" });
    expect(result.redactedFields).toEqual([]);
    expect(result.safeFields).toEqual({ taskId: "t-1", role: "reviewer" });
  });

  it("redacts every field when all are secret-shaped", () => {
    const result = redactFields({ password: "x", token: "y" });
    expect([...result.redactedFields].sort()).toEqual(["password", "token"]);
    expect(result.safeFields).toEqual({});
  });
});

describe("MaoEvidenceLedger.ingest", () => {
  it("rejects an empty taskGraphId", () => {
    const ledger = new MaoEvidenceLedger("graph-1");
    const result = ledger.ingest({
      taskGraphId: "",
      taskId: "t-1",
      receiptKind: "GRAPH",
      fields: { role: "worker" },
      recordedAt: T0,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("EMPTY_TASK_GRAPH_ID");
  });

  it("rejects an empty recordedAt", () => {
    const ledger = new MaoEvidenceLedger("graph-1");
    const result = ledger.ingest({
      taskGraphId: "graph-1",
      taskId: "t-1",
      receiptKind: "GRAPH",
      fields: { role: "worker" },
      recordedAt: "",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("EMPTY_RECORDED_AT");
  });

  it("rejects evidence from a different task graph", () => {
    const ledger = new MaoEvidenceLedger("graph-1");
    const result = ledger.ingest({
      taskGraphId: "graph-2",
      taskId: "t-1",
      receiptKind: "GRAPH",
      fields: { role: "worker" },
      recordedAt: T0,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("TASK_GRAPH_ID_MISMATCH");
    expect(ledger.getRecords()).toEqual([]);
  });

  it("stores a redacted evidence record and reports the redaction", () => {
    const ledger = new MaoEvidenceLedger("graph-1");
    const result = ledger.ingest({
      taskGraphId: "graph-1",
      taskId: "t-1",
      receiptKind: "INVOCATION",
      fields: { role: "worker", secret: "should-not-persist" },
      recordedAt: T0,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.record.safeFields).toEqual({ role: "worker" });
    expect(result.record.redactedFieldCount).toBe(1);
    expect(result.redaction.redactedFields).toEqual(["secret"]);
    expect(JSON.stringify(ledger.getRecords())).not.toContain("should-not-persist");
  });

  it("assigns strictly increasing sequence numbers across ingests", () => {
    const ledger = new MaoEvidenceLedger("graph-1");
    ledger.ingest({ taskGraphId: "graph-1", taskId: null, receiptKind: "GRAPH", fields: {}, recordedAt: iso(0) });
    ledger.ingest({ taskGraphId: "graph-1", taskId: "t-1", receiptKind: "ROLE_RESOLUTION", fields: {}, recordedAt: iso(1000) });
    const records = ledger.getRecords();
    expect(records.map((r) => r.sequence)).toEqual([1, 2]);
  });

  it("produces identical evidenceId for identical inputs (deterministic)", () => {
    const ledgerA = new MaoEvidenceLedger("graph-1");
    const ledgerB = new MaoEvidenceLedger("graph-1");
    const inputA = ledgerA.ingest({ taskGraphId: "graph-1", taskId: "t-1", receiptKind: "OUTPUT", fields: { note: "ok" }, recordedAt: T0 });
    const inputB = ledgerB.ingest({ taskGraphId: "graph-1", taskId: "t-1", receiptKind: "OUTPUT", fields: { note: "ok" }, recordedAt: T0 });
    expect(inputA.ok && inputB.ok).toBe(true);
    if (inputA.ok && inputB.ok) {
      expect(inputA.record.evidenceId).toBe(inputB.record.evidenceId);
      expect(inputA.record.receiptContentHash).toBe(inputB.record.receiptContentHash);
    }
  });

  it("getRecords returns a frozen defensive copy", () => {
    const ledger = new MaoEvidenceLedger("graph-1");
    ledger.ingest({ taskGraphId: "graph-1", taskId: "t-1", receiptKind: "GRAPH", fields: {}, recordedAt: T0 });
    const records = ledger.getRecords();
    expect(Object.isFrozen(records)).toBe(true);
    expect(Object.isFrozen(records[0])).toBe(true);
  });
});

describe("buildEvidenceReadout", () => {
  it("returns zeroed counts and null pointers for an empty ledger", () => {
    const ledger = new MaoEvidenceLedger("graph-1");
    const readout = buildEvidenceReadout(ledger, T0);
    expect(readout.totalReceipts).toBe(0);
    expect(readout.totalRedactedFields).toBe(0);
    expect(readout.lastEvidenceId).toBeNull();
    expect(readout.lastRecordedAt).toBeNull();
    expect(readout.receiptCountByKind.GRAPH).toBe(0);
  });

  it("counts receipts per kind and totals redacted fields", () => {
    const ledger = new MaoEvidenceLedger("graph-1");
    ledger.ingest({ taskGraphId: "graph-1", taskId: null, receiptKind: "GRAPH", fields: { secret: "x" }, recordedAt: iso(0) });
    ledger.ingest({ taskGraphId: "graph-1", taskId: "t-1", receiptKind: "ROLE_RESOLUTION", fields: {}, recordedAt: iso(1000) });
    ledger.ingest({ taskGraphId: "graph-1", taskId: "t-1", receiptKind: "ROLE_RESOLUTION", fields: { token: "y" }, recordedAt: iso(2000) });
    const readout = buildEvidenceReadout(ledger, iso(5000));
    expect(readout.totalReceipts).toBe(3);
    expect(readout.receiptCountByKind.GRAPH).toBe(1);
    expect(readout.receiptCountByKind.ROLE_RESOLUTION).toBe(2);
    expect(readout.totalRedactedFields).toBe(2);
  });

  it("lastEvidenceId/lastRecordedAt reflect the highest-sequence record, not insertion order of fields", () => {
    const ledger = new MaoEvidenceLedger("graph-1");
    ledger.ingest({ taskGraphId: "graph-1", taskId: "t-1", receiptKind: "GRAPH", fields: {}, recordedAt: iso(0) });
    const later = ledger.ingest({ taskGraphId: "graph-1", taskId: "t-2", receiptKind: "INTEGRATION", fields: {}, recordedAt: iso(9000) });
    const readout = buildEvidenceReadout(ledger, iso(10000));
    expect(later.ok).toBe(true);
    if (later.ok) {
      expect(readout.lastEvidenceId).toBe(later.record.evidenceId);
      expect(readout.lastRecordedAt).toBe(iso(9000));
    }
  });

  it("every declared receipt kind appears in receiptCountByKind even with zero count", () => {
    const ledger = new MaoEvidenceLedger("graph-1");
    const readout = buildEvidenceReadout(ledger, T0);
    const expectedKinds: MaoReceiptKind[] = ["GRAPH", "ROLE_RESOLUTION", "INVOCATION", "OUTPUT", "REVIEW", "INTEGRATION"];
    for (const kind of expectedKinds) {
      expect(readout.receiptCountByKind[kind]).toBe(0);
    }
  });
});

describe("readoutsAreEqual (deterministic replay)", () => {
  it("two readouts built from the same ledger at different times are equal ignoring generatedAt", () => {
    const ledger = new MaoEvidenceLedger("graph-1");
    ledger.ingest({ taskGraphId: "graph-1", taskId: "t-1", receiptKind: "GRAPH", fields: {}, recordedAt: iso(0) });
    ledger.ingest({ taskGraphId: "graph-1", taskId: "t-1", receiptKind: "INVOCATION", fields: {}, recordedAt: iso(500) });
    const first = buildEvidenceReadout(ledger, iso(1000));
    const second = buildEvidenceReadout(ledger, iso(999999));
    expect(readoutsAreEqual(first, second)).toBe(true);
  });

  it("readouts differ when totalReceipts differ", () => {
    const ledgerA = new MaoEvidenceLedger("graph-1");
    ledgerA.ingest({ taskGraphId: "graph-1", taskId: "t-1", receiptKind: "GRAPH", fields: {}, recordedAt: iso(0) });
    const ledgerB = new MaoEvidenceLedger("graph-1");
    const readoutA = buildEvidenceReadout(ledgerA, iso(1000));
    const readoutB = buildEvidenceReadout(ledgerB, iso(1000));
    expect(readoutsAreEqual(readoutA, readoutB)).toBe(false);
  });

  it("readouts differ when taskGraphId differs", () => {
    const ledgerA = new MaoEvidenceLedger("graph-1");
    const ledgerB = new MaoEvidenceLedger("graph-2");
    const readoutA = buildEvidenceReadout(ledgerA, T0);
    const readoutB = buildEvidenceReadout(ledgerB, T0);
    expect(readoutsAreEqual(readoutA, readoutB)).toBe(false);
  });
});

describe("evaluateRetention", () => {
  const baseRecord = {
    evidenceId: "e-1",
    taskGraphId: "graph-1",
    taskId: "t-1",
    receiptKind: "GRAPH" as MaoReceiptKind,
    receiptContentHash: "h-1",
    redactedFieldCount: 0,
    safeFields: {},
    recordedAt: T0,
    sequence: 1,
  };

  it("always retains while the batch is open (batchClosedAt null)", () => {
    const decision = evaluateRetention({
      record: baseRecord,
      batchClosedAt: null,
      closureEvidenceWindowMs: 1000,
      evaluatedAt: iso(999999999),
    });
    expect(decision).toBe("RETAIN");
  });

  it("retains within the closure evidence window", () => {
    const decision = evaluateRetention({
      record: baseRecord,
      batchClosedAt: iso(0),
      closureEvidenceWindowMs: 10_000,
      evaluatedAt: iso(5000),
    });
    expect(decision).toBe("RETAIN_WITHIN_CLOSURE_WINDOW");
  });

  it("is eligible for expiry exactly at the window boundary plus one ms", () => {
    const decision = evaluateRetention({
      record: baseRecord,
      batchClosedAt: iso(0),
      closureEvidenceWindowMs: 10_000,
      evaluatedAt: iso(10_001),
    });
    expect(decision).toBe("ELIGIBLE_FOR_EXPIRY");
  });

  it("retains exactly at the window boundary (inclusive)", () => {
    const decision = evaluateRetention({
      record: baseRecord,
      batchClosedAt: iso(0),
      closureEvidenceWindowMs: 10_000,
      evaluatedAt: iso(10_000),
    });
    expect(decision).toBe("RETAIN_WITHIN_CLOSURE_WINDOW");
  });
});

describe("classifyReadoutFreshness", () => {
  it("classifies NO_EVIDENCE_YET when the ledger has no records", () => {
    const ledger = new MaoEvidenceLedger("graph-1");
    const readout = buildEvidenceReadout(ledger, T0);
    expect(classifyReadoutFreshness(readout, 60_000, T0)).toBe("NO_EVIDENCE_YET");
  });

  it("classifies CURRENT within the staleness ceiling", () => {
    const ledger = new MaoEvidenceLedger("graph-1");
    ledger.ingest({ taskGraphId: "graph-1", taskId: "t-1", receiptKind: "GRAPH", fields: {}, recordedAt: iso(0) });
    const readout = buildEvidenceReadout(ledger, iso(30_000));
    expect(classifyReadoutFreshness(readout, 60_000, iso(30_000))).toBe("CURRENT");
  });

  it("classifies STALE beyond the staleness ceiling", () => {
    const ledger = new MaoEvidenceLedger("graph-1");
    ledger.ingest({ taskGraphId: "graph-1", taskId: "t-1", receiptKind: "GRAPH", fields: {}, recordedAt: iso(0) });
    const readout = buildEvidenceReadout(ledger, iso(120_000));
    expect(classifyReadoutFreshness(readout, 60_000, iso(120_000))).toBe("STALE");
  });
});

describe("milestoneForReceiptKind", () => {
  it("maps GRAPH to GRAPH_CREATED", () => {
    expect(milestoneForReceiptKind("GRAPH", false)).toBe("GRAPH_CREATED");
  });

  it("maps ROLE_RESOLUTION to TASK_ADMITTED", () => {
    expect(milestoneForReceiptKind("ROLE_RESOLUTION", false)).toBe("TASK_ADMITTED");
  });

  it("maps INTEGRATION to CLOSURE", () => {
    expect(milestoneForReceiptKind("INTEGRATION", false)).toBe("CLOSURE");
  });

  it("never maps INVOCATION (no per-heartbeat mirroring)", () => {
    expect(milestoneForReceiptKind("INVOCATION", false)).toBeNull();
    expect(milestoneForReceiptKind("INVOCATION", true)).toBeNull();
  });

  it("maps OUTPUT/REVIEW to TERMINAL_OUTCOME only when flagged terminal", () => {
    expect(milestoneForReceiptKind("OUTPUT", false)).toBeNull();
    expect(milestoneForReceiptKind("OUTPUT", true)).toBe("TERMINAL_OUTCOME");
    expect(milestoneForReceiptKind("REVIEW", false)).toBeNull();
    expect(milestoneForReceiptKind("REVIEW", true)).toBe("TERMINAL_OUTCOME");
  });
});

describe("projectWorkspaceMilestones", () => {
  it("excludes every INVOCATION receipt from the projection", () => {
    const ledger = new MaoEvidenceLedger("graph-1");
    ledger.ingest({ taskGraphId: "graph-1", taskId: "t-1", receiptKind: "GRAPH", fields: {}, recordedAt: iso(0) });
    ledger.ingest({ taskGraphId: "graph-1", taskId: "t-1", receiptKind: "INVOCATION", fields: {}, recordedAt: iso(1000) });
    ledger.ingest({ taskGraphId: "graph-1", taskId: "t-1", receiptKind: "INVOCATION", fields: {}, recordedAt: iso(2000) });
    const projections = projectWorkspaceMilestones(ledger, new Set());
    expect(projections.map((p) => p.milestoneKind)).toEqual(["GRAPH_CREATED"]);
  });

  it("includes OUTPUT/REVIEW only when their evidenceId is marked terminal", () => {
    const ledger = new MaoEvidenceLedger("graph-1");
    const output = ledger.ingest({ taskGraphId: "graph-1", taskId: "t-1", receiptKind: "OUTPUT", fields: {}, recordedAt: iso(0) });
    ledger.ingest({ taskGraphId: "graph-1", taskId: "t-1", receiptKind: "REVIEW", fields: {}, recordedAt: iso(1000) });
    expect(output.ok).toBe(true);
    if (!output.ok) return;
    const projections = projectWorkspaceMilestones(ledger, new Set([output.record.evidenceId]));
    expect(projections).toHaveLength(1);
    expect(projections[0].milestoneKind).toBe("TERMINAL_OUTCOME");
    expect(projections[0].evidenceId).toBe(output.record.evidenceId);
  });

  it("preserves ledger sequence order across mixed receipt kinds", () => {
    const ledger = new MaoEvidenceLedger("graph-1");
    ledger.ingest({ taskGraphId: "graph-1", taskId: null, receiptKind: "GRAPH", fields: {}, recordedAt: iso(0) });
    ledger.ingest({ taskGraphId: "graph-1", taskId: "t-1", receiptKind: "ROLE_RESOLUTION", fields: {}, recordedAt: iso(1000) });
    ledger.ingest({ taskGraphId: "graph-1", taskId: "t-1", receiptKind: "INTEGRATION", fields: {}, recordedAt: iso(2000) });
    const projections = projectWorkspaceMilestones(ledger, new Set());
    expect(projections.map((p) => p.milestoneKind)).toEqual(["GRAPH_CREATED", "TASK_ADMITTED", "CLOSURE"]);
  });

  it("returns an empty projection for an empty ledger", () => {
    const ledger = new MaoEvidenceLedger("graph-1");
    const projections = projectWorkspaceMilestones(ledger, new Set());
    expect(projections).toEqual([]);
  });
});

describe("end-to-end evidence/observability scenario", () => {
  it("ingests a full receipt-kind sequence, builds a readout, and projects only milestone events", () => {
    const ledger = new MaoEvidenceLedger("graph-1");
    const graphReceipt = ledger.ingest({ taskGraphId: "graph-1", taskId: null, receiptKind: "GRAPH", fields: { compilerVersion: "1" }, recordedAt: iso(0) });
    ledger.ingest({ taskGraphId: "graph-1", taskId: "t-1", receiptKind: "ROLE_RESOLUTION", fields: { role: "worker" }, recordedAt: iso(1000) });
    ledger.ingest({ taskGraphId: "graph-1", taskId: "t-1", receiptKind: "INVOCATION", fields: { latencyMs: "42" }, recordedAt: iso(2000) });
    const outputReceipt = ledger.ingest({ taskGraphId: "graph-1", taskId: "t-1", receiptKind: "OUTPUT", fields: { note: "ok" }, recordedAt: iso(3000) });
    ledger.ingest({ taskGraphId: "graph-1", taskId: "t-1", receiptKind: "REVIEW", fields: { decision: "ACCEPT" }, recordedAt: iso(4000) });
    ledger.ingest({ taskGraphId: "graph-1", taskId: null, receiptKind: "INTEGRATION", fields: { decision: "ACCEPT" }, recordedAt: iso(5000) });

    expect(graphReceipt.ok && outputReceipt.ok).toBe(true);

    const readout = buildEvidenceReadout(ledger, iso(6000));
    expect(readout.totalReceipts).toBe(6);
    expect(classifyReadoutFreshness(readout, 60_000, iso(6000))).toBe("CURRENT");
    expect(classifyReadoutFreshness(readout, 500, iso(6000))).toBe("STALE");

    const terminalIds = outputReceipt.ok ? new Set([outputReceipt.record.evidenceId]) : new Set<string>();
    const projections = projectWorkspaceMilestones(ledger, terminalIds);
    expect(projections.map((p) => p.milestoneKind)).toEqual([
      "GRAPH_CREATED",
      "TASK_ADMITTED",
      "TERMINAL_OUTCOME",
      "CLOSURE",
    ]);

    const retentionAfterClose = evaluateRetention({
      record: ledger.getRecords()[0],
      batchClosedAt: iso(5000),
      closureEvidenceWindowMs: 86_400_000,
      evaluatedAt: iso(6000),
    });
    expect(retentionAfterClose).toBe("RETAIN_WITHIN_CLOSURE_WINDOW");
  });
});
