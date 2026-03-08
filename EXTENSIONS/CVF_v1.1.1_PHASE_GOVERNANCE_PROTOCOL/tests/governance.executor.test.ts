import { describe, it, expect } from "vitest";
import { GovernanceExecutor, GovernanceModulePlugin } from "../runtime/governance.executor.js";
import { ArtifactRegistry } from "../governance/phase_protocol/artifact.registry.js";
import { GovernanceAuditLog } from "../governance/reports/governance.audit.log.js";
import { createGovernanceControlPlane } from "../governance/control_plane/governance.control.plane.js";

function registerRequiredArtifacts(registry: ArtifactRegistry): void {
    registry.registerArtifact("feature.spec", "/specs/feature.md", "content");
    registry.registerArtifact("state.machine", "/specs/sm.md", "content");
    registry.registerArtifact("state.diagram", "/specs/diagram.md", "content");
    registry.registerArtifact("implementation", "/src/impl.ts", "content");
    registry.registerArtifact("unit.tests", "/tests/unit.ts", "content");
    registry.registerArtifact("scenario.tests", "/tests/scenario.ts", "content");
}

describe("GovernanceExecutor — Integration Test", () => {
    it("should orchestrate the full 6-module pipeline successfully for a valid phase", () => {
        const registry = new ArtifactRegistry("test_component");
        registerRequiredArtifacts(registry);

        const parsedSM = {
            states: ["Start", "End"],
            transitions: {
                "Start": ["End"],
                "End": []
            },
            terminalStates: ["End"]
        } as any;

        const executor = new GovernanceExecutor(
            parsedSM,
            registry,
            "test_component",
            {
                diagramSourceText: "stateDiagram-v2\nStart --> End",
                baselineMachine: parsedSM,
            }
        );

        const result = executor.run();

        expect(result.overallPassed).toBe(true);
        expect(result.modules).toHaveLength(6);

        const moduleNames = result.modules.map(r => r.module);
        expect(moduleNames).toEqual([
            "artifact_integrity",
            "state_enforcement",
            "diagram_validation",
            "structural_diff",
            "scenario_simulator",
            "reports"
        ]);

        // Trust boundary check
        const integrityResult = result.modules.find(r => r.module === "artifact_integrity");
        const integrityDetails = integrityResult?.details as { hashesVerified: boolean; unhashedCount: number } | undefined;
        expect(integrityResult?.passed).toBe(true);
        expect(integrityDetails?.hashesVerified).toBe(true);
        expect(integrityDetails?.unhashedCount).toBe(0);

        // Gate should be approved
        const gateResult = result.modules.find(r => r.module === "reports");
        const gateDetails = gateResult?.details as { gateStatus: string; riskLevel: string } | undefined;
        expect(gateResult?.passed).toBe(true);
        expect(gateDetails?.gateStatus).toBe("APPROVED");
        expect(gateDetails?.riskLevel).toBe("R0");
    });

    it("should skip diagram validation if no raw diagram context is provided", () => {
        const registry = new ArtifactRegistry("test_component");
        registerRequiredArtifacts(registry);

        const parsedSM = {
            states: ["Start", "End"],
            transitions: {
                "Start": ["End"],
                "End": []
            },
            terminalStates: ["End"]
        } as any;

        const executor = new GovernanceExecutor(parsedSM, registry, "test_component");
        const result = executor.run();

        const diagramResult = result.modules.find(r => r.module === "diagram_validation");
        expect(diagramResult?.passed).toBe(true);
        expect((diagramResult?.details as any).note).toContain("diagramSourceText not provided");
    });

    it("should fail diagram validation when diagram drifts from state machine", () => {
        const registry = new ArtifactRegistry("test_component");
        registerRequiredArtifacts(registry);

        const parsedSM = {
            states: ["Start", "Review", "End"],
            transitions: {
                "Start": ["Review"],
                "Review": ["End"],
                "End": []
            },
            terminalStates: ["End"]
        } as any;

        const executor = new GovernanceExecutor(
            parsedSM,
            registry,
            "test_component",
            {
                diagramSourceText: "stateDiagram-v2\nStart --> End", // missing Review
            }
        );
        const result = executor.run();

        const diagramResult = result.modules.find(r => r.module === "diagram_validation");
        expect(diagramResult?.passed).toBe(false);
        expect(result.overallPassed).toBe(false);
        expect((diagramResult?.details as any).missingStates).toContain("Review");
    });

    it("should fail structural diff when baseline and current machine diverge", () => {
        const registry = new ArtifactRegistry("test_component");
        registerRequiredArtifacts(registry);

        const baseline = {
            states: ["Start", "End"],
            transitions: {
                "Start": ["End"],
                "End": []
            },
            terminalStates: ["End"]
        } as any;

        const current = {
            states: ["Start", "Review", "End"],
            transitions: {
                "Start": ["Review"],
                "Review": ["End"],
                "End": []
            },
            terminalStates: ["End"]
        } as any;

        const executor = new GovernanceExecutor(
            current,
            registry,
            "test_component",
            {
                diagramSourceText: "stateDiagram-v2\nStart --> Review\nReview --> End",
                baselineMachine: baseline,
            }
        );

        const result = executor.run();
        const structuralResult = result.modules.find(r => r.module === "structural_diff");
        expect(structuralResult?.passed).toBe(false);
        expect((structuralResult?.details as any).baselineProvided).toBe(true);
        expect((structuralResult?.details as any).addedStates).toContain("Review");
        expect(result.overallPassed).toBe(false);
    });

    it("should fail the pipeline if an artifact is missing a content hash (Trust Boundary violation)", () => {
        const registry = new ArtifactRegistry("test_component");

        // Missing hash bypass — by omitting content, registerArtifact won't compute hash
        registry.registerArtifact("feature.spec", "/specs/feature.md");
        registry.registerArtifact("state.machine", "/specs/sm.md", "content: state machine definition");

        const parsedSM = {
            states: ["Start", "End"],
            transitions: {
                "Start": ["End"],
                "End": []
            },
            terminalStates: ["End"]
        } as any;

        const executor = new GovernanceExecutor(parsedSM, registry, "test_component");
        const result = executor.run();

        // Pipeline fails due to artifact integrity module
        expect(result.overallPassed).toBe(false);

        const integrityResult = result.modules.find(r => r.module === "artifact_integrity");
        const integrityDetails = integrityResult?.details as { hashesVerified: boolean } | undefined;
        expect(integrityResult?.passed).toBe(false);
        expect(integrityDetails?.hashesVerified).toBe(false);

        // Gate status shouldn't be APPROVED (likely REJECTED due to critical rule failure)
        const gateResult = result.modules.find(r => r.module === "reports");
        const gateDetails = gateResult?.details as { gateStatus: string; riskLevel: string } | undefined;
        expect(gateDetails?.gateStatus).not.toBe("APPROVED");
        // Specifically, it gets R3 due to missing hashes
        expect(gateDetails?.riskLevel).toBe("R3");
    });

    it("should allow pluggable verification modules without breaking pipeline order", () => {
        const registry = new ArtifactRegistry("test_component");
        registerRequiredArtifacts(registry);

        const parsedSM = {
            states: ["Start", "End"],
            transitions: {
                "Start": ["End"],
                "End": []
            },
            terminalStates: ["End"]
        } as any;

        const customScenarioPlugin: GovernanceModulePlugin = {
            name: "scenario_simulator",
            execute(context) {
                expect(context.priorResults.map((result) => result.module)).toEqual([
                    "artifact_integrity",
                    "state_enforcement",
                    "diagram_validation",
                    "structural_diff",
                ]);

                return {
                    module: "scenario_simulator",
                    passed: false,
                    details: {
                        note: "custom plugin override",
                    },
                };
            },
        };

        const executor = new GovernanceExecutor(
            parsedSM,
            registry,
            "test_component",
            {
                executionContext: {
                    diagramSourceText: "stateDiagram-v2\nStart --> End",
                    baselineMachine: parsedSM,
                },
                plugins: {
                    scenario_simulator: customScenarioPlugin,
                },
            }
        );

        const result = executor.run();

        expect(result.pipelineOrder).toEqual([
            "artifact_integrity",
            "state_enforcement",
            "diagram_validation",
            "structural_diff",
            "scenario_simulator",
            "reports",
        ]);
        expect(result.modules.find((module) => module.module === "scenario_simulator")?.passed).toBe(false);
        expect(result.modules).toHaveLength(6);
        expect(result.overallPassed).toBe(false);
    });

    it("should fail fast when a required governance plugin is missing", () => {
        const registry = new ArtifactRegistry("test_component");
        registerRequiredArtifacts(registry);

        const parsedSM = {
            states: ["Start", "End"],
            transitions: {
                "Start": ["End"],
                "End": []
            },
            terminalStates: ["End"]
        } as any;

        const executor = new GovernanceExecutor(
            parsedSM,
            registry,
            "test_component",
            {
                plugins: {
                    reports: undefined as unknown as GovernanceModulePlugin,
                },
            }
        );

        expect(() => executor.run()).toThrow("Missing governance plugin: reports");
    });

    it("should persist phase report and hash ledger when audit log is provided", () => {
        const registry = new ArtifactRegistry("test_component");
        registerRequiredArtifacts(registry);
        const auditLog = new GovernanceAuditLog();

        const parsedSM = {
            states: ["Start", "End"],
            transitions: {
                "Start": ["End"],
                "End": []
            },
            terminalStates: ["End"]
        } as any;

        const executor = new GovernanceExecutor(
            parsedSM,
            registry,
            "test_component",
            {
                executionContext: {
                    diagramSourceText: "stateDiagram-v2\nStart --> End",
                    baselineMachine: parsedSM,
                },
                auditLog,
                auditPhase: "PHASE_GATE",
                traceMetadata: {
                    requestId: "REQ-TEST-001",
                    traceBatch: "TRACE-TEST-BATCH",
                    traceHash: "trace-hash-001",
                    remediationBatch: "REM-TEST-001",
                    policyVersion: "v1.1.2",
                },
            }
        );

        const result = executor.run();

        expect(result.overallPassed).toBe(true);
        expect(auditLog.getAll()).toHaveLength(1);
        expect(auditLog.getAll()[0]?.phase).toBe("PHASE_GATE");
        expect(auditLog.getAll()[0]?.gate.component).toBe("test_component");
        expect(auditLog.getAll()[0]?.trace?.requestId).toBe("REQ-TEST-001");
        expect(auditLog.getAll()[0]?.trace?.traceBatch).toBe("TRACE-TEST-BATCH");
        expect(auditLog.getHashLedgerHistory()).toHaveLength(1);
        expect(auditLog.getHashLedgerHistory()[0]?.entries).toHaveLength(6);
        expect(auditLog.getHashLedgerHistory()[0]?.trace?.traceHash).toBe("trace-hash-001");
    });

    it("should bind default control-plane policyVersion into audit records", () => {
        const registry = new ArtifactRegistry("test_component");
        registerRequiredArtifacts(registry);
        const auditLog = new GovernanceAuditLog();

        const parsedSM = {
            states: ["Start", "End"],
            transitions: {
                "Start": ["End"],
                "End": []
            },
            terminalStates: ["End"]
        } as any;

        const executor = new GovernanceExecutor(
            parsedSM,
            registry,
            "test_component",
            {
                executionContext: {
                    diagramSourceText: "stateDiagram-v2\nStart --> End",
                    baselineMachine: parsedSM,
                },
                auditLog,
                traceMetadata: {
                    requestId: "REQ-TEST-002",
                    traceBatch: "TRACE-TEST-BATCH-002",
                    traceHash: "trace-hash-002",
                },
            }
        );

        executor.run();

        expect(auditLog.getAll()[0]?.phase).toBe("PHASE_GATE");
        expect(auditLog.getAll()[0]?.trace?.policyVersion).toBe("v1.1.2");
        expect(auditLog.getHashLedgerHistory()[0]?.trace?.policyVersion).toBe("v1.1.2");
    });

    it("should allow a custom control plane to set auditPhase and policyVersion", () => {
        const registry = new ArtifactRegistry("test_component");
        registerRequiredArtifacts(registry);
        const auditLog = new GovernanceAuditLog();

        const parsedSM = {
            states: ["Start", "End"],
            transitions: {
                "Start": ["End"],
                "End": []
            },
            terminalStates: ["End"]
        } as any;

        const executor = new GovernanceExecutor(
            parsedSM,
            registry,
            "test_component",
            {
                executionContext: {
                    diagramSourceText: "stateDiagram-v2\nStart --> End",
                    baselineMachine: parsedSM,
                },
                auditLog,
                controlPlane: createGovernanceControlPlane({
                    policyVersion: "v1.1.2-local",
                    auditPhase: "LOCAL_PHASE_GATE",
                }),
                traceMetadata: {
                    requestId: "REQ-TEST-003",
                    traceBatch: "TRACE-TEST-BATCH-003",
                    traceHash: "trace-hash-003",
                },
            }
        );

        const result = executor.run();

        expect(result.pipelineOrder).toEqual([
            "artifact_integrity",
            "state_enforcement",
            "diagram_validation",
            "structural_diff",
            "scenario_simulator",
            "reports",
        ]);
        expect(auditLog.getAll()[0]?.phase).toBe("LOCAL_PHASE_GATE");
        expect(auditLog.getAll()[0]?.trace?.policyVersion).toBe("v1.1.2-local");
        expect(auditLog.getHashLedgerHistory()[0]?.trace?.policyVersion).toBe("v1.1.2-local");
    });
});
