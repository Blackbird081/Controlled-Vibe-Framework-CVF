import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CommandRegistry } from "../src/command.registry";
import {
  auditEventCaptureRate,
  computeGovernanceReliabilityReport,
  parseAuditJsonl,
  policyDecisionRate,
  receiptIntegrityRate,
  stepTraceCompletionRate,
  type AuditEvent,
} from "../src/governance-reliability-metrics";

const fixture: AuditEvent[] = [
  {
    executionId: "exec-1",
    eventType: "execution_requested",
    receiptId: "receipt-1",
    decision: "captured",
    enforcement: { status: "allow" },
    stepTraceIds: ["step-1"],
  },
  {
    executionId: "exec-1",
    eventType: "receipt_emitted",
    receiptId: "receipt-1",
    decision: "captured",
    enforcement: { status: "allow" },
    stepTraceIds: ["step-2"],
  },
  {
    executionId: "exec-2",
    eventType: "execution_requested",
    receiptId: null,
    decision: "missing",
    enforcement: { status: "error" },
    stepTraceIds: [],
  },
  {
    executionId: "exec-3",
    eventType: "execution_requested",
    receiptId: "receipt-3",
    decision: "captured",
    enforcement: { status: "deny" },
    stepTraceIds: ["step-1", "step-2"],
  },
];

describe("governance reliability metrics", () => {
  it("computes receipt integrity rate", () => {
    expect(receiptIntegrityRate(fixture)).toEqual({ rate: 0.75, count: 3, total: 4 });
  });

  it("computes policy decision rate", () => {
    expect(policyDecisionRate(fixture)).toEqual({ rate: 0.75, count: 3, total: 4 });
  });

  it("computes step trace completion rate", () => {
    expect(stepTraceCompletionRate(fixture)).toEqual({ rate: 0.75, count: 3, total: 4 });
  });

  it("computes audit event capture rate from execution requests", () => {
    expect(auditEventCaptureRate(fixture)).toEqual({ rate: 1, count: 3, total: 3 });
  });

  it("returns zero rates for an empty log", () => {
    expect(computeGovernanceReliabilityReport([])).toEqual({
      receiptIntegrityRate: { rate: 0, count: 0, total: 0 },
      policyDecisionRate: { rate: 0, count: 0, total: 0 },
      stepTraceCompletionRate: { rate: 0, count: 0, total: 0 },
      auditEventCaptureRate: { rate: 0, count: 0, total: 0 },
    });
  });

  it("returns zero receipt integrity when all receipts are null", () => {
    expect(receiptIntegrityRate([
      { executionId: "exec-1", receiptId: null, decision: "captured" },
      { executionId: "exec-2", receiptId: null, decision: "captured" },
    ])).toEqual({ rate: 0, count: 0, total: 2 });
  });

  it("parses JSONL audit content", () => {
    const parsed = parseAuditJsonl(
      fixture.map((event) => JSON.stringify(event)).join("\n"),
    );

    expect(parsed).toHaveLength(4);
    expect(parsed[0]).toMatchObject({ executionId: "exec-1" });
  });

  it("runs cvf benchmark governance against a JSONL file", () => {
    const tempDir = mkdtempSync(join(tmpdir(), "cvf-governance-benchmark-"));
    const inputPath = join(tempDir, "audit.jsonl");
    writeFileSync(inputPath, fixture.map((event) => JSON.stringify(event)).join("\n"));

    try {
      const result = new CommandRegistry().execute({
        command: "benchmark",
        positional: ["governance"],
        flags: { input: inputPath, format: "json" },
      });

      expect(result.success).toBe(true);
      expect(JSON.parse(result.message)).toMatchObject({
        receiptIntegrityRate: { count: 3, total: 4 },
      });
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
