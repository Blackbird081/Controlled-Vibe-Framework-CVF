import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CommandRegistry } from "../src/command.registry";
import {
  auditEventCaptureRate,
  computeGovernanceReliabilityReport,
  crossSessionContinuityRate,
  deterministicConsistencyRate,
  humanCorrectionRate,
  longHorizonStabilityRate,
  parseAuditJsonl,
  policyDecisionRate,
  policyViolationRate,
  receiptIntegrityRate,
  rollbackSuccessRate,
  retryRecoveryRate,
  stepTraceCompletionRate,
  taskCompletionRate,
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
      taskCompletionRate: { rate: 0, count: 0, total: 0 },
      retryRecoveryRate: { rate: 0, count: 0, total: 0 },
      policyViolationRate: { rate: 0, count: 0, total: 0 },
      crossSessionContinuityRate: { rate: 0, count: 0, total: 0 },
      deterministicConsistencyRate: { rate: 0, count: 0, total: 0 },
      humanCorrectionRate: { rate: 0, count: 0, total: 0 },
      longHorizonStabilityRate: { rate: 1, count: 0, total: 0 },
      rollbackSuccessRate: { rate: null, count: 0, total: 0 },
    });
  });

  it("computes task completion rate from allow decisions", () => {
    const result = taskCompletionRate([{ decision: "allow" }, { decision: "allow" }, { decision: "deny" }]);

    expect(result).toEqual({ rate: 2 / 3, count: 2, total: 3 });
  });

  it("computes retry recovery rate from retry and recovered statuses", () => {
    const result = retryRecoveryRate([
      { enforcement: { status: "retry" } },
      { enforcement: { status: "recovered" } },
      { enforcement: { status: "deny" } },
    ]);

    expect(result).toEqual({ rate: 2 / 3, count: 2, total: 3 });
  });

  it("computes policy violation rate from deny and blocked statuses", () => {
    const result = policyViolationRate([
      { enforcement: { status: "deny" } },
      { enforcement: { status: "blocked" } },
      { enforcement: { status: "allow" } },
    ]);

    expect(result).toEqual({ rate: 2 / 3, count: 2, total: 3 });
  });

  it("computes cross-session continuity from repeated runIds", () => {
    const result = crossSessionContinuityRate([{ runId: "run-1" }, { runId: "run-1" }, { runId: "run-2" }]);

    expect(result).toEqual({ rate: 0.5, count: 1, total: 2 });
  });

  it("computes deterministic consistency from executionIds with one event", () => {
    const result = deterministicConsistencyRate([
      { executionId: "exec-1" },
      { executionId: "exec-1" },
      { executionId: "exec-2" },
    ]);

    expect(result).toEqual({ rate: 0.5, count: 1, total: 2 });
  });

  it("returns zero human correction rate for an empty log", () => {
    expect(humanCorrectionRate([])).toEqual({ rate: 0, count: 0, total: 0 });
  });

  it("computes human correction rate by distinct execution", () => {
    const result = humanCorrectionRate([
      { executionId: "exec-1", eventType: "execution_requested" },
      { executionId: "exec-1", eventType: "operator_correction", correctedAt: "2026-05-20T00:00:00Z", correctionSource: "operator" },
      { executionId: "exec-2", eventType: "execution_requested" },
    ]);

    expect(result).toEqual({ rate: 0.5, count: 1, total: 2 });
  });

  it("does not count non-correction events as human corrections", () => {
    expect(humanCorrectionRate([
      { executionId: "exec-1", eventType: "execution_requested" },
      { executionId: "exec-2", eventType: "receipt_emitted" },
    ])).toEqual({ rate: 0, count: 0, total: 2 });
  });

  it("treats no executions as vacuously stable for long-horizon stability", () => {
    expect(longHorizonStabilityRate([], 30)).toEqual({ rate: 1, count: 0, total: 0 });
  });

  it("computes long-horizon stability within the requested window", () => {
    const result = longHorizonStabilityRate([
      { executionId: "exec-1", eventType: "execution_requested", timestamp: "2026-05-01T00:00:00Z" },
      { executionId: "exec-1", eventType: "receipt_emitted", timestamp: "2026-05-05T00:00:00Z" },
      { executionId: "exec-2", eventType: "execution_requested", timestamp: "2026-05-01T00:00:00Z" },
      { executionId: "exec-2", eventType: "receipt_emitted", timestamp: "2026-06-15T00:00:00Z" },
    ], 30);

    expect(result).toEqual({ rate: 0.5, count: 1, total: 2 });
  });

  it("marks executions unstable when rollback fails or policy violation occurs", () => {
    const result = longHorizonStabilityRate([
      { executionId: "exec-1", eventType: "execution_requested", timestamp: "2026-05-01T00:00:00Z" },
      { executionId: "exec-1", eventType: "rollback", rolledBackAt: "2026-05-02T00:00:00Z", success: false },
      { executionId: "exec-2", eventType: "policy_violation", timestamp: "2026-05-01T00:00:00Z" },
    ], 30);

    expect(result).toEqual({ rate: 0, count: 0, total: 2 });
  });

  it("returns null rollback success rate when no rollback events exist", () => {
    expect(rollbackSuccessRate([{ executionId: "exec-1", eventType: "execution_requested" }]))
      .toEqual({ rate: null, count: 0, total: 0 });
  });

  it("computes rollback success rate for all successful rollbacks", () => {
    expect(rollbackSuccessRate([
      { executionId: "exec-1", eventType: "rollback", rolledBackAt: "2026-05-20T00:00:00Z", success: true },
    ])).toEqual({ rate: 1, count: 1, total: 1 });
  });

  it("computes rollback success rate for mixed rollback outcomes", () => {
    expect(rollbackSuccessRate([
      { executionId: "exec-1", eventType: "rollback", rolledBackAt: "2026-05-20T00:00:00Z", success: true },
      { executionId: "exec-2", eventType: "rollback", rolledBackAt: "2026-05-20T00:00:00Z", success: false },
    ])).toEqual({ rate: 0.5, count: 1, total: 2 });
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
        deterministicConsistencyRate: { count: 2, total: 3 },
        humanCorrectionRate: { count: 0, total: 3 },
        rollbackSuccessRate: { rate: null, count: 0, total: 0 },
      });
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("runs cvf benchmark run against a JSONL file", () => {
    const tempDir = mkdtempSync(join(tmpdir(), "cvf-governance-benchmark-"));
    const inputPath = join(tempDir, "audit.jsonl");
    writeFileSync(inputPath, fixture.map((event) => JSON.stringify(event)).join("\n"));

    try {
      const result = new CommandRegistry().execute({
        command: "benchmark",
        positional: ["run"],
        flags: { input: inputPath },
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain("CVF Governance Reliability Report");
      expect(result.message).toContain("deterministicConsistencyRate:");
      expect(result.message).toContain("rollbackSuccessRate: n/a");
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
