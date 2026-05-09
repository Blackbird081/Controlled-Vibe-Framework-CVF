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
import { createGateResult, GateResult } from "../governance/phase_gate/gate.result";
import { validateDiagram } from "../governance/diagram_validation/diagram.validator";
import { detectStructuralDiff } from "../governance/structural_diff/structural.diff";
import { GovernanceAuditLog } from "../governance/reports/governance.audit.log";
import { generatePhaseReport, GovernanceTraceMetadata } from "../governance/reports/phase.report.generator";
import {
    bindControlPlaneTrace,
    DEFAULT_GOVERNANCE_CONTROL_PLANE,
    GovernanceControlPlane,
} from "../governance/control_plane/governance.control.plane";

export interface ModuleResult {
    module: string;
    passed: boolean;
    details: unknown;
}

export interface ExecutorResult {
    pipelineOrder: string[];
    modules: ModuleResult[];
    overallPassed: boolean;
    riskLevel: string;
    timestamp: number;
}

export interface GovernanceExecutionContext {
    diagramSourceText?: string;
    baselineMachine?: StateMachine;
}

export interface GovernanceExecutorOptions {
    executionContext?: GovernanceExecutionContext;
    plugins?: Partial<GovernanceModulePluginMap>;
    auditLog?: GovernanceAuditLog;
    auditPhase?: string;
    traceMetadata?: GovernanceTraceMetadata;
    controlPlane?: GovernanceControlPlane;
}

export interface GovernanceModuleExecutionContext {
    machine: StateMachine;
    registry: ArtifactRegistry;
    componentName: string;
    executionContext: GovernanceExecutionContext;
    priorResults: ModuleResult[];
}

export interface GovernanceModulePlugin {
    name: (typeof GOVERNANCE_PIPELINE)[number];
    execute(context: GovernanceModuleExecutionContext): ModuleResult;
}

type GovernanceModulePluginMap = Record<(typeof GOVERNANCE_PIPELINE)[number], GovernanceModulePlugin>;

function createDefaultGovernancePlugins(): GovernanceModulePluginMap {
    return {
        state_enforcement: {
            name: "state_enforcement",
            execute({ machine }) {
                const deadlocks = detectDeadlocks(machine, { terminalStates: machine.terminalStates });
                return {
                    module: "state_enforcement",
                    passed: deadlocks.length === 0,
                    details: { deadlockCount: deadlocks.length, deadlockStates: deadlocks },
                };
            },
        },
        diagram_validation: {
            name: "diagram_validation",
            execute({ machine, registry, executionContext }) {
                const diagramArtifact = registry.findArtifact("state.diagram");
                const rawDiagramContext = executionContext.diagramSourceText;
                const diagramResult = diagramArtifact && rawDiagramContext
                    ? validateDiagram(machine, rawDiagramContext)
                    : null;

                return {
                    module: "diagram_validation",
                    passed: diagramResult ? diagramResult.passed : true,
                    details: diagramArtifact
                        ? (diagramResult ?? {
                            note: "state.diagram artifact registered but diagramSourceText not provided — skipped",
                        })
                        : { note: "no state.diagram artifact — skipped" },
                };
            },
        },
        structural_diff: {
            name: "structural_diff",
            execute({ machine, executionContext }) {
                const diffResult = detectStructuralDiff(machine, executionContext.baselineMachine);
                return {
                    module: "structural_diff",
                    passed: diffResult.passed,
                    details: diffResult,
                };
            },
        },
        scenario_simulator: {
            name: "scenario_simulator",
            execute({ machine }) {
                const scenarios = generateScenarios(machine);
                const terminalSet = new Set(machine.terminalStates || []);
                const anomalies = detectAnomalies(machine, terminalSet);
                const invariantViolations = checkInvariants(machine, scenarios);
                const simPassed = anomalies.length === 0 && invariantViolations.length === 0;

                return {
                    module: "scenario_simulator",
                    passed: simPassed,
                    details: {
                        scenarioCount: scenarios.length,
                        anomalyCount: anomalies.length,
                        anomalies,
                        invariantViolationCount: invariantViolations.length,
                        invariantViolations,
                    },
                };
            },
        },
        artifact_integrity: {
            name: "artifact_integrity",
            execute({ registry }) {
                const hashesVerified = registry.verifyAllHashes();
                const ledger = registry.getHashLedger();

                return {
                    module: "artifact_integrity",
                    passed: hashesVerified,
                    details: {
                        hashesVerified,
                        ledgerEntries: ledger.length,
                        unhashedCount: registry.getArtifacts().length - ledger.length,
                    },
                };
            },
        },
        reports: {
            name: "reports",
            execute({ registry, componentName }) {
                const gateChecks = GateRules.validateArtifacts(registry);
                const gateResult = createGateResult(componentName, gateChecks);

                return {
                    module: "reports",
                    passed: gateResult.status === "APPROVED",
                    details: {
                        gateStatus: gateResult.status,
                        riskLevel: gateResult.riskLevel,
                        checks: gateResult.checks,
                        gateResult,
                    },
                };
            },
        },
    };
}

export class GovernanceExecutor {
    private machine: StateMachine;
    private registry: ArtifactRegistry;
    private componentName: string;
    private executionContext: GovernanceExecutionContext;
    private plugins: GovernanceModulePluginMap;
    private auditLog?: GovernanceAuditLog;
    private auditPhase: string;
    private traceMetadata?: GovernanceTraceMetadata;
    private controlPlane: GovernanceControlPlane;

    constructor(
        machine: StateMachine,
        registry: ArtifactRegistry,
        componentName = "unknown",
        options: GovernanceExecutionContext | GovernanceExecutorOptions = {}
    ) {
        this.machine = machine;
        this.registry = registry;
        this.componentName = componentName;
        const resolvedOptions = normalizeExecutorOptions(options);
        this.executionContext = resolvedOptions.executionContext;
        this.controlPlane = resolvedOptions.controlPlane;
        this.plugins = {
            ...createDefaultGovernancePlugins(),
            ...resolvedOptions.plugins,
        };
        this.auditLog = resolvedOptions.auditLog;
        this.auditPhase = resolvedOptions.auditPhase ?? resolvedOptions.controlPlane.auditPhase;
        this.traceMetadata = bindControlPlaneTrace(
            resolvedOptions.controlPlane,
            resolvedOptions.traceMetadata
        );
    }

    /**
     * run()
     *
     * Executes all governance modules in GOVERNANCE_PIPELINE order.
     * Collects results per module, derives overall gate result.
     */
    public run(): ExecutorResult {
        const results: ModuleResult[] = [];
        for (const moduleName of this.controlPlane.pipeline) {
            const plugin = this.plugins[moduleName];
            if (!plugin) {
                throw new Error(`Missing governance plugin: ${moduleName}`);
            }

            results.push(plugin.execute({
                machine: this.machine,
                registry: this.registry,
                componentName: this.componentName,
                executionContext: this.executionContext,
                priorResults: results,
            }));
        }

        // ── Overall ──────────────────────────────────────────────────
        const overallPassed = results.every((r) => r.passed);
        const reportDetails = results.find((result) => result.module === "reports")?.details as
            | { riskLevel?: string; gateResult?: GateResult }
            | undefined;
        const integrityDetails = results.find((result) => result.module === "artifact_integrity")?.details as
            | { ledgerEntries?: number; hashesVerified?: boolean }
            | undefined;
        const gateResult = reportDetails?.gateResult;

        if (this.auditLog && gateResult) {
            this.auditLog.record(generatePhaseReport(
                this.auditPhase,
                gateResult,
                undefined,
                undefined,
                this.traceMetadata
            ));
            this.auditLog.recordHashLedger(this.auditPhase, this.registry.getHashLedger(), this.traceMetadata);
        }

        return {
            pipelineOrder: [...this.controlPlane.pipeline],
            modules: results,
            overallPassed,
            riskLevel: reportDetails?.riskLevel ?? "UNKNOWN",
            timestamp: Date.now(),
        };
    }
}

function normalizeExecutorOptions(
    options: GovernanceExecutionContext | GovernanceExecutorOptions
): Required<Pick<GovernanceExecutorOptions, "executionContext" | "plugins" | "auditPhase">> &
    Required<Pick<GovernanceExecutorOptions, "controlPlane">> &
    Pick<GovernanceExecutorOptions, "auditLog" | "traceMetadata"> {
    const candidate = options as GovernanceExecutorOptions;
    const hasExecutorOptionsShape =
        Object.prototype.hasOwnProperty.call(candidate, "plugins")
        || Object.prototype.hasOwnProperty.call(candidate, "auditLog")
        || Object.prototype.hasOwnProperty.call(candidate, "auditPhase")
        || Object.prototype.hasOwnProperty.call(candidate, "executionContext")
        || Object.prototype.hasOwnProperty.call(candidate, "traceMetadata")
        || Object.prototype.hasOwnProperty.call(candidate, "controlPlane");

    if (hasExecutorOptionsShape) {
        return {
            executionContext: candidate.executionContext ?? {},
            plugins: candidate.plugins ?? {},
            auditLog: candidate.auditLog,
            auditPhase: candidate.auditPhase ?? candidate.controlPlane?.auditPhase ?? "PHASE_GATE",
            traceMetadata: candidate.traceMetadata,
            controlPlane: candidate.controlPlane ?? DEFAULT_GOVERNANCE_CONTROL_PLANE,
        };
    }

    return {
        executionContext: options as GovernanceExecutionContext,
        plugins: {},
        auditLog: undefined,
        auditPhase: "PHASE_GATE",
        traceMetadata: undefined,
        controlPlane: DEFAULT_GOVERNANCE_CONTROL_PLANE,
    };
}
