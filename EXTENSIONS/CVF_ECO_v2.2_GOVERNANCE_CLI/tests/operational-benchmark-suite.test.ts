import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CommandRegistry } from "../src/command.registry";
import {
  buildOperationalBenchmarkReport,
  formatOperationalBenchmarkReport,
  parseOperationalBenchmarkInput,
} from "../src/operational-benchmark-suite";

describe("operational benchmark suite", () => {
  it("builds the Review-CVF operational metric envelope from mixed evidence modes", () => {
    const events = parseOperationalBenchmarkInput([
      JSON.stringify({
        executionId: "exec-live-1",
        runId: "run-live",
        eventType: "execution_requested",
        evidenceMode: "live",
        provider: "alibaba",
        model: "qwen-turbo",
        receiptId: "receipt-live",
        decision: "allow",
        enforcement: { status: "allow" },
      }),
      JSON.stringify({
        executionId: "exec-live-1",
        eventType: "retry",
        evidenceMode: "live",
        enforcement: { status: "retry" },
      }),
      JSON.stringify({
        executionId: "exec-offline-1",
        runId: "run-offline",
        eventType: "operator_correction",
        evidenceMode: "offline",
        correctedAt: "2026-05-22T00:00:00Z",
        correctionSource: "operator",
      }),
      JSON.stringify({
        executionId: "exec-offline-2",
        eventType: "rollback",
        evidenceMode: "offline",
        rolledBackAt: "2026-05-22T00:00:00Z",
        success: true,
      }),
    ].join("\n"));

    const report = buildOperationalBenchmarkReport(events, "audit.jsonl");

    expect(report.schemaVersion).toBe("cvf.operationalBenchmark.v1");
    expect(report.source).toMatchObject({
      input: "audit.jsonl",
      eventCount: 4,
      evidenceModes: ["live", "offline"],
      providerLanes: ["alibaba"],
      modelLanes: ["qwen-turbo"],
    });
    expect(report.metrics.retryCount).toEqual({ count: 1, total: 4 });
    expect(report.metrics.humanCorrectionCount).toEqual({ count: 1, total: 3 });
    expect(report.metrics.rollbackSuccessRate).toEqual({ rate: 1, count: 1, total: 1 });
    expect(report.evidenceModeBreakdown.map((entry) => entry.evidenceMode)).toEqual(["live", "offline"]);
    expect(report.deferredMetrics[0]).toMatchObject({
      metric: "hallucinationRecovery",
      status: "deferred",
    });
  });

  it("ingests release-gate JSON output with nested receipt evidence", () => {
    const events = parseOperationalBenchmarkInput(JSON.stringify({
      date: "2026-05-22",
      gate_result: "PASS",
      checks: [
        { name: "Web build", status: "PASS" },
        {
          name: "Live governance",
          status: "PASS",
          evidenceMode: "live",
          governanceEvidenceReceipt: {
            traceId: "trace-live",
            receiptId: "receipt-live",
            provider: "alibaba",
            model: "qwen-turbo",
            decision: "ALLOW",
          },
        },
      ],
    }));

    const report = buildOperationalBenchmarkReport(events);

    expect(events).toHaveLength(3);
    expect(report.source.evidenceModes).toEqual(["live", "unknown"]);
    expect(report.source.providerLanes).toEqual(["alibaba"]);
    expect(report.metrics.receiptIntegrityRate.count).toBe(1);
  });

  it("prefers nested live probe results over top-level proof status", () => {
    const events = parseOperationalBenchmarkInput(JSON.stringify({
      schemaVersion: "cvf-s3-governance-benchmark-live-evidence-1",
      status: "PASS",
      liveCallCount: 2,
      results: [
        {
          run: 1,
          httpStatus: 200,
          success: true,
          receiptId: "receipt-live-1",
          traceId: "trace-live-1",
          evidenceMode: "live",
          provider: "alibaba",
          model: "qwen-turbo",
        },
        {
          run: 2,
          httpStatus: 200,
          success: true,
          receiptId: "receipt-live-2",
          traceId: "trace-live-2",
          evidenceMode: "live",
          provider: "alibaba",
          model: "qwen-turbo",
        },
      ],
    }));

    const report = buildOperationalBenchmarkReport(events);

    expect(events).toHaveLength(2);
    expect(report.source).toMatchObject({
      eventCount: 2,
      evidenceModes: ["live"],
      providerLanes: ["alibaba"],
      modelLanes: ["qwen-turbo"],
    });
    expect(report.scorecard.callLevel).toMatchObject({
      totalCalls: 2,
      successfulCalls: 2,
      liveCalls: 2,
      receiptBackedCalls: 2,
    });
  });

  it("separates call-level pass rate from event-model denominators", () => {
    const events = parseOperationalBenchmarkInput([
      JSON.stringify({
        executionId: "exec-live-1",
        eventType: "execution_completed",
        evidenceMode: "live",
        provider: "alibaba",
        model: "qwen-turbo",
        receiptId: "receipt-live-1",
        decision: "allow",
        enforcement: { status: "allow" },
      }),
      JSON.stringify({
        executionId: "exec-live-1",
        eventType: "receipt_emitted",
        evidenceMode: "live",
        provider: "alibaba",
        model: "qwen-turbo",
        receiptId: "receipt-live-1",
        decision: "captured",
        enforcement: { status: "allow" },
      }),
      JSON.stringify({
        executionId: "exec-live-2",
        eventType: "execution_completed",
        evidenceMode: "live",
        provider: "alibaba",
        model: "qwen-turbo",
        receiptId: "receipt-live-2",
        decision: "allow",
        enforcement: { status: "allow" },
      }),
      JSON.stringify({
        executionId: "exec-live-2",
        eventType: "receipt_emitted",
        evidenceMode: "live",
        provider: "alibaba",
        model: "qwen-turbo",
        receiptId: "receipt-live-2",
        decision: "captured",
        enforcement: { status: "allow" },
      }),
    ].join("\n"));

    const report = buildOperationalBenchmarkReport(events);

    expect(report.scorecard.callLevel).toMatchObject({
      totalCalls: 2,
      successfulCalls: 2,
      failedCalls: 0,
      liveCalls: 2,
      receiptBackedCalls: 2,
      callPassRate: { rate: 1, count: 2, total: 2 },
    });
    expect(report.metrics.taskCompletionRate).toEqual({ rate: 0.5, count: 2, total: 4 });
    expect(report.scorecard.eventModel).toMatchObject({
      totalEvents: 4,
      eventsPerCall: 2,
      taskCompletionRate: { rate: 0.5, count: 2, total: 4 },
      receiptIntegrityRate: { rate: 0.5, count: 2, total: 4 },
    });
    expect(report.scorecard.clarityStatus).toBe("needs_context");
    expect(report.scorecard.operatorSummary).toContain("2/2 call(s) passed");
    expect(report.scorecard.operatorSummary).toContain("event model contains 4 event(s)");
  });

  it("counts diagnostics and user actions for failed calls", () => {
    const events = parseOperationalBenchmarkInput([
      JSON.stringify({
        executionId: "exec-fail-1",
        eventType: "execution_completed",
        evidenceMode: "live",
        decision: "deny",
        enforcement: { status: "deny" },
        diagnostic: {
          class: "provider_timeout",
          userAction: "wait_and_retry",
        },
      }),
      JSON.stringify({
        executionId: "exec-fail-2",
        eventType: "execution_completed",
        evidenceMode: "live",
        decision: "deny",
        enforcement: { status: "deny" },
        diagnosticClass: "receipt_missing",
        userAction: "inspect_receipt",
        overconstraintDetected: true,
        frictionSignals: ["excessive_procedure"],
      }),
      JSON.stringify({
        executionId: "exec-fail-3",
        eventType: "execution_completed",
        evidenceMode: "live",
        decision: "deny",
        enforcement: { status: "deny" },
      }),
    ].join("\n"));

    const report = buildOperationalBenchmarkReport(events);

    expect(report.scorecard.callLevel).toMatchObject({
      totalCalls: 3,
      successfulCalls: 0,
      failedCalls: 3,
    });
    expect(report.scorecard.diagnostics).toMatchObject({
      diagnosticBackedFailures: 2,
      failedCallsWithoutDiagnostic: 1,
    });
    expect(report.scorecard.diagnostics.classCounts).toEqual([
      { label: "provider_timeout", count: 1 },
      { label: "receipt_missing", count: 1 },
    ]);
    expect(report.scorecard.diagnostics.userActionCounts).toEqual([
      { label: "inspect_receipt", count: 1 },
      { label: "wait_and_retry", count: 1 },
    ]);
    expect(report.scorecard.advisorySignals.frictionSignals).toEqual([
      { label: "excessive_procedure", count: 1 },
    ]);
    expect(report.scorecard.advisorySignals.overconstraintSignals).toEqual([
      { label: "overconstraint_detected", count: 1 },
    ]);
    expect(report.scorecard.clarityStatus).toBe("needs_context");
  });

  it("formats an operational report as a table with claim boundary", () => {
    const report = buildOperationalBenchmarkReport([
      {
        executionId: "exec-1",
        eventType: "execution_requested",
        evidenceMode: "fixture",
        receiptId: "receipt-1",
        decision: "allow",
        enforcement: { status: "allow" },
      },
    ]);

    const output = formatOperationalBenchmarkReport(report, "table");

    expect(output).toContain("CVF Operational Governance Benchmark");
    expect(output).toContain("callLevel 1/1 pass=1.000");
    expect(output).toContain("eventModel events=1");
    expect(output).toContain("retryCount 0/1");
    expect(output).toContain("deferred: hallucinationRecovery");
    expect(output).toContain("claimBoundary:");
  });

  it("runs cvf benchmark operational against JSONL", () => {
    const tempDir = mkdtempSync(join(tmpdir(), "cvf-operational-benchmark-"));
    const inputPath = join(tempDir, "audit.jsonl");
    writeFileSync(inputPath, [
      JSON.stringify({
        executionId: "exec-1",
        eventType: "execution_requested",
        evidenceMode: "live",
        provider: "alibaba",
        model: "qwen-turbo",
        receiptId: "receipt-1",
        decision: "allow",
        enforcement: { status: "allow" },
      }),
    ].join("\n"));

    try {
      const result = new CommandRegistry().execute({
        command: "benchmark",
        positional: ["operational"],
        flags: { input: inputPath, format: "json" },
      });

      expect(result.success).toBe(true);
      expect(JSON.parse(result.message)).toMatchObject({
        schemaVersion: "cvf.operationalBenchmark.v1",
        source: {
          evidenceModes: ["live"],
          providerLanes: ["alibaba"],
          modelLanes: ["qwen-turbo"],
        },
        metrics: {
          taskCompletionRate: { count: 1, total: 1 },
        },
        scorecard: {
          callLevel: { totalCalls: 1, successfulCalls: 1 },
          eventModel: { totalEvents: 1 },
        },
      });
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
