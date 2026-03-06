/**
 * Governance Executor — v1.1.2 (De_xuat_01)
 *
 * Runtime orchestrator for the CVF governance pipeline.
 * Executes all governance modules in the canonical order defined by
 * GOVERNANCE_PIPELINE in gate.rules.ts.
 *
 * Design principle (De_xuat_01):
 *   The governance MODULES (/governance/*) are immutable logic — they define WHAT to check.
 *   This EXECUTOR is a separate runtime concern — it defines HOW and IN WHAT ORDER to run them.
 *   Keeping executor outside /governance ensures the core module tree stays pure.
 *
 * Usage:
 *   const executor = new GovernanceExecutor(machine, registry);
 *   const result = await executor.run();
 */

import { StateMachine } from "../governance/state_enforcement/state.machine.parser";
import { detectDeadlocks } from "../governance/state_enforcement/deadlock.detector";
import { generateScenarios, checkInvariants } from "../governance/scenario_simulator/scenario.generator";
import { detectAnomalies } from "../governance/scenario_simulator/execution.trace";
import { ArtifactRegistry } from "../governance/phase_protocol/artifact.registry";
import { GateRules, GOVERNANCE_PIPELINE } from "../governance/phase_gate/gate.rules";
import { createGateResult } from "../governance/phase_gate/gate.result";

export interface ModuleResult {
    module: string;
    passed: boolean;
    details: Record<string, unknown>;
}

export interface ExecutorResult {
    pipelineOrder: string[];
    modules: ModuleResult[];
    overallPassed: boolean;
    riskLevel: string;
    timestamp: number;
}

export class GovernanceExecutor {
    private machine: StateMachine;
    private registry: ArtifactRegistry;
    private componentName: string;

    constructor(machine: StateMachine, registry: ArtifactRegistry, componentName = "unknown") {
        this.machine = machine;
        this.registry = registry;
        this.componentName = componentName;
    }

    /**
     * run()
     *
     * Executes all governance modules in GOVERNANCE_PIPELINE order.
     * Collects results per module, derives overall gate result.
     */
    public run(): ExecutorResult {
        const results: ModuleResult[] = [];

        // ── 1. state_enforcement ─────────────────────────────────────
        const deadlocks = detectDeadlocks(this.machine);
        results.push({
            module: "state_enforcement",
            passed: deadlocks.length === 0,
            details: { deadlockCount: deadlocks.length, deadlockStates: deadlocks },
        });

        // ── 2. diagram_validation ────────────────────────────────────
        // Placeholder — full diagram-state validation requires diagram source.
        // Returns passed=true when no diagram is provided (no artifact to drift from).
        const diagramArtifact = this.registry.findArtifact("state.diagram");
        results.push({
            module: "diagram_validation",
            passed: true,
            details: { note: diagramArtifact ? "diagram registered" : "no diagram artifact — skipped" },
        });

        // ── 3. structural_diff ───────────────────────────────────────
        // Placeholder — requires previous baseline snapshot for diffing.
        results.push({
            module: "structural_diff",
            passed: true,
            details: { note: "no baseline snapshot provided — diff skipped" },
        });

        // ── 4. scenario_simulator ────────────────────────────────────
        const scenarios = generateScenarios(this.machine);
        const anomalies = detectAnomalies(this.machine);
        const invariantViolations = checkInvariants(this.machine, scenarios);
        const simPassed = anomalies.length === 0 && invariantViolations.length === 0;

        results.push({
            module: "scenario_simulator",
            passed: simPassed,
            details: {
                scenarioCount: scenarios.length,
                anomalyCount: anomalies.length,
                anomalies,
                invariantViolationCount: invariantViolations.length,
                invariantViolations,
            },
        });

        // ── 5. artifact_integrity ────────────────────────────────────
        const hashesVerified = this.registry.verifyAllHashes();
        const ledger = this.registry.getHashLedger();

        results.push({
            module: "artifact_integrity",
            passed: hashesVerified,
            details: {
                hashesVerified,
                ledgerEntries: ledger.length,
                unhashedCount: this.registry.getArtifacts().length - ledger.length,
            },
        });

        // ── 6. reports ───────────────────────────────────────────────
        const gateChecks = GateRules.validateArtifacts(this.registry);
        const gateResult = createGateResult(this.componentName, gateChecks);

        results.push({
            module: "reports",
            passed: gateResult.status === "APPROVED",
            details: {
                gateStatus: gateResult.status,
                riskLevel: gateResult.riskLevel,
                checks: gateResult.checks,
            },
        });

        // ── Overall ──────────────────────────────────────────────────
        const overallPassed = results.every((r) => r.passed);

        return {
            pipelineOrder: [...GOVERNANCE_PIPELINE],
            modules: results,
            overallPassed,
            riskLevel: gateResult.riskLevel,
            timestamp: Date.now(),
        };
    }
}
