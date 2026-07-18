"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = require("node:fs");
const node_os_1 = require("node:os");
const node_path_1 = require("node:path");
const vitest_1 = require("vitest");
const command_registry_1 = require("../src/command.registry");
const operational_benchmark_suite_1 = require("../src/operational-benchmark-suite");
(0, vitest_1.describe)("operational benchmark suite", () => {
    (0, vitest_1.it)("builds the Review-CVF operational metric envelope from mixed evidence modes", () => {
        const events = (0, operational_benchmark_suite_1.parseOperationalBenchmarkInput)([
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
        const report = (0, operational_benchmark_suite_1.buildOperationalBenchmarkReport)(events, "audit.jsonl");
        (0, vitest_1.expect)(report.schemaVersion).toBe("cvf.operationalBenchmark.v1");
        (0, vitest_1.expect)(report.source).toMatchObject({
            input: "audit.jsonl",
            eventCount: 4,
            evidenceModes: ["live", "offline"],
            providerLanes: ["alibaba"],
            modelLanes: ["qwen-turbo"],
        });
        (0, vitest_1.expect)(report.metrics.retryCount).toEqual({ count: 1, total: 4 });
        (0, vitest_1.expect)(report.metrics.humanCorrectionCount).toEqual({ count: 1, total: 3 });
        (0, vitest_1.expect)(report.metrics.rollbackSuccessRate).toEqual({ rate: 1, count: 1, total: 1 });
        (0, vitest_1.expect)(report.evidenceModeBreakdown.map((entry) => entry.evidenceMode)).toEqual(["live", "offline"]);
        (0, vitest_1.expect)(report.deferredMetrics[0]).toMatchObject({
            metric: "hallucinationRecovery",
            status: "deferred",
        });
    });
    (0, vitest_1.it)("ingests release-gate JSON output with nested receipt evidence", () => {
        const events = (0, operational_benchmark_suite_1.parseOperationalBenchmarkInput)(JSON.stringify({
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
        const report = (0, operational_benchmark_suite_1.buildOperationalBenchmarkReport)(events);
        (0, vitest_1.expect)(events).toHaveLength(3);
        (0, vitest_1.expect)(report.source.evidenceModes).toEqual(["live", "unknown"]);
        (0, vitest_1.expect)(report.source.providerLanes).toEqual(["alibaba"]);
        (0, vitest_1.expect)(report.metrics.receiptIntegrityRate.count).toBe(1);
    });
    (0, vitest_1.it)("prefers nested live probe results over top-level proof status", () => {
        const events = (0, operational_benchmark_suite_1.parseOperationalBenchmarkInput)(JSON.stringify({
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
        const report = (0, operational_benchmark_suite_1.buildOperationalBenchmarkReport)(events);
        (0, vitest_1.expect)(events).toHaveLength(2);
        (0, vitest_1.expect)(report.source).toMatchObject({
            eventCount: 2,
            evidenceModes: ["live"],
            providerLanes: ["alibaba"],
            modelLanes: ["qwen-turbo"],
        });
        (0, vitest_1.expect)(report.scorecard.callLevel).toMatchObject({
            totalCalls: 2,
            successfulCalls: 2,
            liveCalls: 2,
            receiptBackedCalls: 2,
        });
    });
    (0, vitest_1.it)("separates call-level pass rate from event-model denominators", () => {
        const events = (0, operational_benchmark_suite_1.parseOperationalBenchmarkInput)([
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
        const report = (0, operational_benchmark_suite_1.buildOperationalBenchmarkReport)(events);
        (0, vitest_1.expect)(report.scorecard.callLevel).toMatchObject({
            totalCalls: 2,
            successfulCalls: 2,
            failedCalls: 0,
            liveCalls: 2,
            receiptBackedCalls: 2,
            callPassRate: { rate: 1, count: 2, total: 2 },
        });
        (0, vitest_1.expect)(report.metrics.taskCompletionRate).toEqual({ rate: 0.5, count: 2, total: 4 });
        (0, vitest_1.expect)(report.scorecard.eventModel).toMatchObject({
            totalEvents: 4,
            eventsPerCall: 2,
            taskCompletionRate: { rate: 0.5, count: 2, total: 4 },
            receiptIntegrityRate: { rate: 0.5, count: 2, total: 4 },
        });
        (0, vitest_1.expect)(report.scorecard.clarityStatus).toBe("needs_context");
        (0, vitest_1.expect)(report.scorecard.operatorSummary).toContain("2/2 call(s) passed");
        (0, vitest_1.expect)(report.scorecard.operatorSummary).toContain("event model contains 4 event(s)");
    });
    (0, vitest_1.it)("counts diagnostics and user actions for failed calls", () => {
        const events = (0, operational_benchmark_suite_1.parseOperationalBenchmarkInput)([
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
        const report = (0, operational_benchmark_suite_1.buildOperationalBenchmarkReport)(events);
        (0, vitest_1.expect)(report.scorecard.callLevel).toMatchObject({
            totalCalls: 3,
            successfulCalls: 0,
            failedCalls: 3,
        });
        (0, vitest_1.expect)(report.scorecard.diagnostics).toMatchObject({
            diagnosticBackedFailures: 2,
            failedCallsWithoutDiagnostic: 1,
        });
        (0, vitest_1.expect)(report.scorecard.diagnostics.classCounts).toEqual([
            { label: "provider_timeout", count: 1 },
            { label: "receipt_missing", count: 1 },
        ]);
        (0, vitest_1.expect)(report.scorecard.diagnostics.userActionCounts).toEqual([
            { label: "inspect_receipt", count: 1 },
            { label: "wait_and_retry", count: 1 },
        ]);
        (0, vitest_1.expect)(report.scorecard.advisorySignals.frictionSignals).toEqual([
            { label: "excessive_procedure", count: 1 },
        ]);
        (0, vitest_1.expect)(report.scorecard.advisorySignals.overconstraintSignals).toEqual([
            { label: "overconstraint_detected", count: 1 },
        ]);
        (0, vitest_1.expect)(report.scorecard.clarityStatus).toBe("needs_context");
    });
    (0, vitest_1.it)("formats an operational report as a table with claim boundary", () => {
        const report = (0, operational_benchmark_suite_1.buildOperationalBenchmarkReport)([
            {
                executionId: "exec-1",
                eventType: "execution_requested",
                evidenceMode: "fixture",
                receiptId: "receipt-1",
                decision: "allow",
                enforcement: { status: "allow" },
            },
        ]);
        const output = (0, operational_benchmark_suite_1.formatOperationalBenchmarkReport)(report, "table");
        (0, vitest_1.expect)(output).toContain("CVF Operational Governance Benchmark");
        (0, vitest_1.expect)(output).toContain("callLevel 1/1 pass=1.000");
        (0, vitest_1.expect)(output).toContain("eventModel events=1");
        (0, vitest_1.expect)(output).toContain("retryCount 0/1");
        (0, vitest_1.expect)(output).toContain("deferred: hallucinationRecovery");
        (0, vitest_1.expect)(output).toContain("claimBoundary:");
    });
    (0, vitest_1.it)("runs cvf benchmark operational against JSONL", () => {
        const tempDir = (0, node_fs_1.mkdtempSync)((0, node_path_1.join)((0, node_os_1.tmpdir)(), "cvf-operational-benchmark-"));
        const inputPath = (0, node_path_1.join)(tempDir, "audit.jsonl");
        (0, node_fs_1.writeFileSync)(inputPath, [
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
            const result = new command_registry_1.CommandRegistry().execute({
                command: "benchmark",
                positional: ["operational"],
                flags: { input: inputPath, format: "json" },
            });
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(JSON.parse(result.message)).toMatchObject({
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
        }
        finally {
            (0, node_fs_1.rmSync)(tempDir, { recursive: true, force: true });
        }
    });
});
