"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = require("node:fs");
const node_os_1 = require("node:os");
const node_path_1 = require("node:path");
const vitest_1 = require("vitest");
const command_registry_1 = require("../src/command.registry");
const governance_reliability_metrics_1 = require("../src/governance-reliability-metrics");
const fixture = [
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
(0, vitest_1.describe)("governance reliability metrics", () => {
    (0, vitest_1.it)("computes receipt integrity rate", () => {
        (0, vitest_1.expect)((0, governance_reliability_metrics_1.receiptIntegrityRate)(fixture)).toEqual({ rate: 0.75, count: 3, total: 4 });
    });
    (0, vitest_1.it)("computes policy decision rate", () => {
        (0, vitest_1.expect)((0, governance_reliability_metrics_1.policyDecisionRate)(fixture)).toEqual({ rate: 0.75, count: 3, total: 4 });
    });
    (0, vitest_1.it)("computes step trace completion rate", () => {
        (0, vitest_1.expect)((0, governance_reliability_metrics_1.stepTraceCompletionRate)(fixture)).toEqual({ rate: 0.75, count: 3, total: 4 });
    });
    (0, vitest_1.it)("computes audit event capture rate from execution requests", () => {
        (0, vitest_1.expect)((0, governance_reliability_metrics_1.auditEventCaptureRate)(fixture)).toEqual({ rate: 1, count: 3, total: 3 });
    });
    (0, vitest_1.it)("returns zero rates for an empty log", () => {
        (0, vitest_1.expect)((0, governance_reliability_metrics_1.computeGovernanceReliabilityReport)([])).toEqual({
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
    (0, vitest_1.it)("computes task completion rate from allow decisions", () => {
        const result = (0, governance_reliability_metrics_1.taskCompletionRate)([{ decision: "allow" }, { decision: "allow" }, { decision: "deny" }]);
        (0, vitest_1.expect)(result).toEqual({ rate: 2 / 3, count: 2, total: 3 });
    });
    (0, vitest_1.it)("computes retry recovery rate from retry and recovered statuses", () => {
        const result = (0, governance_reliability_metrics_1.retryRecoveryRate)([
            { enforcement: { status: "retry" } },
            { enforcement: { status: "recovered" } },
            { enforcement: { status: "deny" } },
        ]);
        (0, vitest_1.expect)(result).toEqual({ rate: 2 / 3, count: 2, total: 3 });
    });
    (0, vitest_1.it)("computes retry count from retry and recovered statuses", () => {
        (0, vitest_1.expect)((0, governance_reliability_metrics_1.retryCount)([
            { enforcement: { status: "retry" } },
            { enforcement: { status: "recovered" } },
            { enforcement: { status: "allow" } },
        ])).toBe(2);
    });
    (0, vitest_1.it)("computes policy violation rate from deny and blocked statuses", () => {
        const result = (0, governance_reliability_metrics_1.policyViolationRate)([
            { enforcement: { status: "deny" } },
            { enforcement: { status: "blocked" } },
            { enforcement: { status: "allow" } },
        ]);
        (0, vitest_1.expect)(result).toEqual({ rate: 2 / 3, count: 2, total: 3 });
    });
    (0, vitest_1.it)("computes cross-session continuity from repeated runIds", () => {
        const result = (0, governance_reliability_metrics_1.crossSessionContinuityRate)([{ runId: "run-1" }, { runId: "run-1" }, { runId: "run-2" }]);
        (0, vitest_1.expect)(result).toEqual({ rate: 0.5, count: 1, total: 2 });
    });
    (0, vitest_1.it)("computes deterministic consistency from executionIds with one event", () => {
        const result = (0, governance_reliability_metrics_1.deterministicConsistencyRate)([
            { executionId: "exec-1" },
            { executionId: "exec-1" },
            { executionId: "exec-2" },
        ]);
        (0, vitest_1.expect)(result).toEqual({ rate: 0.5, count: 1, total: 2 });
    });
    (0, vitest_1.it)("returns zero human correction rate for an empty log", () => {
        (0, vitest_1.expect)((0, governance_reliability_metrics_1.humanCorrectionRate)([])).toEqual({ rate: 0, count: 0, total: 0 });
    });
    (0, vitest_1.it)("computes human correction rate by distinct execution", () => {
        const result = (0, governance_reliability_metrics_1.humanCorrectionRate)([
            { executionId: "exec-1", eventType: "execution_requested" },
            { executionId: "exec-1", eventType: "operator_correction", correctedAt: "2026-05-20T00:00:00Z", correctionSource: "operator" },
            { executionId: "exec-2", eventType: "execution_requested" },
        ]);
        (0, vitest_1.expect)(result).toEqual({ rate: 0.5, count: 1, total: 2 });
    });
    (0, vitest_1.it)("computes human correction count by event", () => {
        (0, vitest_1.expect)((0, governance_reliability_metrics_1.humanCorrectionCount)([
            { executionId: "exec-1", eventType: "operator_correction", correctedAt: "2026-05-20T00:00:00Z", correctionSource: "operator" },
            { executionId: "exec-1", eventType: "operator_correction", correctedAt: "2026-05-21T00:00:00Z", correctionSource: "reviewer" },
            { executionId: "exec-2", eventType: "execution_requested" },
        ])).toBe(2);
    });
    (0, vitest_1.it)("does not count non-correction events as human corrections", () => {
        (0, vitest_1.expect)((0, governance_reliability_metrics_1.humanCorrectionRate)([
            { executionId: "exec-1", eventType: "execution_requested" },
            { executionId: "exec-2", eventType: "receipt_emitted" },
        ])).toEqual({ rate: 0, count: 0, total: 2 });
    });
    (0, vitest_1.it)("treats no executions as vacuously stable for long-horizon stability", () => {
        (0, vitest_1.expect)((0, governance_reliability_metrics_1.longHorizonStabilityRate)([], 30)).toEqual({ rate: 1, count: 0, total: 0 });
    });
    (0, vitest_1.it)("computes long-horizon stability within the requested window", () => {
        const result = (0, governance_reliability_metrics_1.longHorizonStabilityRate)([
            { executionId: "exec-1", eventType: "execution_requested", timestamp: "2026-05-01T00:00:00Z" },
            { executionId: "exec-1", eventType: "receipt_emitted", timestamp: "2026-05-05T00:00:00Z" },
            { executionId: "exec-2", eventType: "execution_requested", timestamp: "2026-05-01T00:00:00Z" },
            { executionId: "exec-2", eventType: "receipt_emitted", timestamp: "2026-06-15T00:00:00Z" },
        ], 30);
        (0, vitest_1.expect)(result).toEqual({ rate: 0.5, count: 1, total: 2 });
    });
    (0, vitest_1.it)("marks executions unstable when rollback fails or policy violation occurs", () => {
        const result = (0, governance_reliability_metrics_1.longHorizonStabilityRate)([
            { executionId: "exec-1", eventType: "execution_requested", timestamp: "2026-05-01T00:00:00Z" },
            { executionId: "exec-1", eventType: "rollback", rolledBackAt: "2026-05-02T00:00:00Z", success: false },
            { executionId: "exec-2", eventType: "policy_violation", timestamp: "2026-05-01T00:00:00Z" },
        ], 30);
        (0, vitest_1.expect)(result).toEqual({ rate: 0, count: 0, total: 2 });
    });
    (0, vitest_1.it)("returns null rollback success rate when no rollback events exist", () => {
        (0, vitest_1.expect)((0, governance_reliability_metrics_1.rollbackSuccessRate)([{ executionId: "exec-1", eventType: "execution_requested" }]))
            .toEqual({ rate: null, count: 0, total: 0 });
    });
    (0, vitest_1.it)("computes rollback success rate for all successful rollbacks", () => {
        (0, vitest_1.expect)((0, governance_reliability_metrics_1.rollbackSuccessRate)([
            { executionId: "exec-1", eventType: "rollback", rolledBackAt: "2026-05-20T00:00:00Z", success: true },
        ])).toEqual({ rate: 1, count: 1, total: 1 });
    });
    (0, vitest_1.it)("computes rollback success rate for mixed rollback outcomes", () => {
        (0, vitest_1.expect)((0, governance_reliability_metrics_1.rollbackSuccessRate)([
            { executionId: "exec-1", eventType: "rollback", rolledBackAt: "2026-05-20T00:00:00Z", success: true },
            { executionId: "exec-2", eventType: "rollback", rolledBackAt: "2026-05-20T00:00:00Z", success: false },
        ])).toEqual({ rate: 0.5, count: 1, total: 2 });
    });
    (0, vitest_1.it)("returns zero receipt integrity when all receipts are null", () => {
        (0, vitest_1.expect)((0, governance_reliability_metrics_1.receiptIntegrityRate)([
            { executionId: "exec-1", receiptId: null, decision: "captured" },
            { executionId: "exec-2", receiptId: null, decision: "captured" },
        ])).toEqual({ rate: 0, count: 0, total: 2 });
    });
    (0, vitest_1.it)("parses JSONL audit content", () => {
        const parsed = (0, governance_reliability_metrics_1.parseAuditJsonl)(fixture.map((event) => JSON.stringify(event)).join("\n"));
        (0, vitest_1.expect)(parsed).toHaveLength(4);
        (0, vitest_1.expect)(parsed[0]).toMatchObject({ executionId: "exec-1" });
    });
    (0, vitest_1.it)("runs cvf benchmark governance against a JSONL file", () => {
        const tempDir = (0, node_fs_1.mkdtempSync)((0, node_path_1.join)((0, node_os_1.tmpdir)(), "cvf-governance-benchmark-"));
        const inputPath = (0, node_path_1.join)(tempDir, "audit.jsonl");
        (0, node_fs_1.writeFileSync)(inputPath, fixture.map((event) => JSON.stringify(event)).join("\n"));
        try {
            const result = new command_registry_1.CommandRegistry().execute({
                command: "benchmark",
                positional: ["governance"],
                flags: { input: inputPath, format: "json" },
            });
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(JSON.parse(result.message)).toMatchObject({
                receiptIntegrityRate: { count: 3, total: 4 },
                deterministicConsistencyRate: { count: 2, total: 3 },
                humanCorrectionRate: { count: 0, total: 3 },
                rollbackSuccessRate: { rate: null, count: 0, total: 0 },
            });
        }
        finally {
            (0, node_fs_1.rmSync)(tempDir, { recursive: true, force: true });
        }
    });
    (0, vitest_1.it)("runs cvf benchmark run against a JSONL file", () => {
        const tempDir = (0, node_fs_1.mkdtempSync)((0, node_path_1.join)((0, node_os_1.tmpdir)(), "cvf-governance-benchmark-"));
        const inputPath = (0, node_path_1.join)(tempDir, "audit.jsonl");
        (0, node_fs_1.writeFileSync)(inputPath, fixture.map((event) => JSON.stringify(event)).join("\n"));
        try {
            const result = new command_registry_1.CommandRegistry().execute({
                command: "benchmark",
                positional: ["run"],
                flags: { input: inputPath },
            });
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.message).toContain("CVF Governance Reliability Report");
            (0, vitest_1.expect)(result.message).toContain("deterministicConsistencyRate:");
            (0, vitest_1.expect)(result.message).toContain("rollbackSuccessRate: n/a");
        }
        finally {
            (0, node_fs_1.rmSync)(tempDir, { recursive: true, force: true });
        }
    });
});
