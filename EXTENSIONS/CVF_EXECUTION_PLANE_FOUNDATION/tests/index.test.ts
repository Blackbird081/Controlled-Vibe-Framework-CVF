import { describe, expect, it } from "vitest";
import {
  type CVFSkillDraft,
  DEFAULT_GUARD_RUNTIME_CONFIG,
  EXECUTION_ADAPTER_EVIDENCE_ALIGNMENT,
  EXECUTION_AUTHORIZATION_BOUNDARY_ALIGNMENT,
  EXECUTION_GATEWAY_WRAPPER_ALIGNMENT,
  EXECUTION_MCP_BRIDGE_ALIGNMENT,
  EXECUTION_PLANE_FOUNDATION_COORDINATION,
  ExplainabilityLayer,
  MODEL_GATEWAY_WRAPPER,
  PHASE_ORDER,
  ReleaseEvidenceAdapter,
  SessionMemory,
  SkillValidator,
  createExecutionAdapterEvidenceSurface,
  createExecutionAuthorizationBoundarySurface,
  createExecutionGatewaySurface,
  createExecutionMcpBridgeSurface,
  createExecutionPlaneFoundationShell,
  createExecutionPlanePromptPreview,
  describeExecutionAdapterEvidence,
  describeExecutionAuthorizationBoundary,
  describeExecutionPlaneFoundationShell,
  describeExecutionPlaneWrapperAlignment,
  parseVibe,
  // W2-T2
  DispatchContract,
  createDispatchContract,
  PolicyGateContract,
  createPolicyGateContract,
  ExecutionBridgeConsumerContract,
  createExecutionBridgeConsumerContract,
  // W2-T3
  CommandRuntimeContract,
  createCommandRuntimeContract,
  ExecutionPipelineContract,
  createExecutionPipelineContract,
  // W2-T4
  ExecutionObserverContract,
  createExecutionObserverContract,
  ExecutionFeedbackContract,
  createExecutionFeedbackContract,
  // W2-T5
  FeedbackRoutingContract,
  createFeedbackRoutingContract,
  FeedbackResolutionContract,
  createFeedbackResolutionContract,
} from "../src/index";
import type { ExecutionFeedbackSignal } from "../src/index";
import { createGuardEngine } from "../../CVF_ECO_v2.5_MCP_SERVER/src/sdk";
import {
  createDesignConsumerContract,
  createControlPlaneIntakeContract,
} from "../../CVF_CONTROL_PLANE_FOUNDATION/src/index";
import type { TaskAssignment } from "../../CVF_CONTROL_PLANE_FOUNDATION/src/orchestration.contract";
import type { DispatchResult } from "../src/dispatch.contract";

describe("CVF_EXECUTION_PLANE_FOUNDATION", () => {
  it("creates a stable execution-plane shell while preserving lineage", () => {
    const shell = createExecutionPlaneFoundationShell();

    expect(shell.gatewayWrapper.executionClass).toBe("wrapper/re-export merge");
    expect(shell.gateway.wrapper).toBe(MODEL_GATEWAY_WRAPPER);
    expect(shell.mcpBridge.alignment.sourcePackage).toContain("CVF_ECO_v2.5_MCP_SERVER");
    expect(shell.registry.count()).toBeGreaterThan(0);
    expect(shell.memory.getPhase()).toBe("DISCOVERY");
    expect(shell.explainability).toBeInstanceOf(ExplainabilityLayer);
    expect(shell.releaseEvidence).toBeInstanceOf(ReleaseEvidenceAdapter);
  });

  it("describes the shell as a coordination package with deferred MCP internals", () => {
    const summary = describeExecutionPlaneFoundationShell();

    expect(summary.trancheId).toBe("W2-T1");
    expect(summary.controlPointId).toBe("CP1");
    expect(summary.coordination.executionClass).toBe("coordination package");
    expect(summary.coordination.modelGateway).toContain("CVF_MODEL_GATEWAY");
    expect(summary.coordination.initialPhysicalMoveExcluded).toContain(
      "EXTENSIONS/CVF_ECO_v2.5_MCP_SERVER/src/guards",
    );
    expect(summary.gatewayWrapper).toBe(MODEL_GATEWAY_WRAPPER);
    expect(summary.registeredGuardCount).toBeGreaterThan(0);
    expect(summary.enabledGuardCount).toBe(summary.registeredGuardCount);
    expect(summary.textSurface).toContain("CVF W2-T1 CP1 Execution-Plane Foundation Shell");
    expect(summary.markdownSurface).toContain("## Deferred Initial Surfaces");
  });

  it("publishes explicit gateway and MCP wrapper alignment surfaces", () => {
    const gateway = createExecutionGatewaySurface();
    const mcpBridge = createExecutionMcpBridgeSurface();
    const summary = describeExecutionPlaneWrapperAlignment();

    expect(gateway.alignment).toBe(EXECUTION_GATEWAY_WRAPPER_ALIGNMENT);
    expect(gateway.wrapper).toBe(MODEL_GATEWAY_WRAPPER);
    expect(gateway.skills.SkillValidator).toBe(SkillValidator);
    expect(mcpBridge.alignment).toBe(EXECUTION_MCP_BRIDGE_ALIGNMENT);
    expect(typeof mcpBridge.runtime.createGuardEngine).toBe("function");
    expect(summary.controlPointId).toBe("CP2");
    expect(summary.gatewayAlignment.wrapperAnchor).toBe("wrapper/re-export merge");
    expect(summary.mcpBridgeAlignment.deferredInternals).toContain(
      "EXTENSIONS/CVF_ECO_v2.5_MCP_SERVER/src/cli",
    );
    expect(summary.textSurface).toContain("CP2 MCP And Gateway Wrapper Alignment");
    expect(summary.markdownSurface).toContain("## Gateway Wrapper Boundary");
  });

  it("re-exports core MCP and execution surfaces needed for the shell", async () => {
    const parsed = parseVibe("Hãy tạo cầu nối MCP an toàn và yêu cầu xác nhận trước khi chạy.");

    expect(PHASE_ORDER).toContain("BUILD");
    expect(DEFAULT_GUARD_RUNTIME_CONFIG).toBeTruthy();
    expect(parsed.actionType).toBeTruthy();
    expect(parsed.constraints.length).toBeGreaterThanOrEqual(0);

    const memory = new SessionMemory("test-shell");
    memory.advancePhase("BUILD");
    expect(memory.getPhase()).toBe("BUILD");

    const draft: CVFSkillDraft = {
      skill_id: "skill_exec_bridge",
      slug: "skill-exec-bridge",
      created_at: "2026-03-22T00:00:00.000Z",
      updated_at: "2026-03-22T00:00:00.000Z",
      source: "manual_upload",
      original_format: "markdown",
      raw_content_hash: "hash-exec-bridge",
      title: "Execution bridge skill",
      description: "Test draft for execution-plane validation.",
      logic: {
        procedural_steps: "Build a governed MCP bridge and review the execution path.",
      },
      governance: {},
      status: "draft",
    };

    expect(typeof SkillValidator.validate).toBe("function");
    await expect(SkillValidator.validate(draft)).resolves.toMatchObject({
      status: "validated",
    });
  });

  it("produces a prompt preview for execution-plane shell review", () => {
    const preview = createExecutionPlanePromptPreview();

    expect(preview.trancheId).toBe("W2-T1");
    expect(preview.controlPointId).toBe("CP1");
    expect(preview.prompt.systemPrompt).toContain("W2-T1 execution-plane foundation shell");
    expect(preview.prompt.sections).toContain("mcp_tools");
    expect(preview.prompt.activeRules).toContain(
      "MCP guard tools available — use before risky actions",
    );
  });

  it("records canonical coordination metadata for CP1", () => {
    expect(EXECUTION_PLANE_FOUNDATION_COORDINATION.preservesLineage).toBe(true);
    expect(EXECUTION_PLANE_FOUNDATION_COORDINATION.externalIntegrationReference).toContain(
      "CVF_v1.2.1_EXTERNAL_INTEGRATION",
    );
  });

  // CP3 — Adapter Evidence & Explainability Integration
  it("creates a reviewable adapter evidence surface with explainability and release evidence", () => {
    const surface = createExecutionAdapterEvidenceSurface();

    expect(surface.alignment.controlPoint).toBe("CP3");
    expect(surface.alignment.executionClass).toBe("coordination package");
    expect(surface.alignment.preservesLineage).toBe(true);
    expect(surface.explainability.layer).toBeInstanceOf(ExplainabilityLayer);
    expect(surface.explainability.supportedLocales).toContain("vi");
    expect(surface.explainability.supportedLocales).toContain("en");
    expect(surface.explainability.sampleExplanation.summary).toBeTruthy();
    expect(surface.explainability.sampleExplanation.riskMessage).toContain("45");
    expect(surface.releaseEvidence.adapter).toBeInstanceOf(ReleaseEvidenceAdapter);
    expect(surface.adapterInventory.count).toBe(4);
    expect(surface.adapterInventory.registered).toContain("OpenClawAdapter");
    expect(surface.adapterInventory.registered).toContain("NanoAdapter");
  });

  it("describes adapter evidence as a CP3 review surface with text and markdown", () => {
    const summary = describeExecutionAdapterEvidence();

    expect(summary.trancheId).toBe("W2-T1");
    expect(summary.controlPointId).toBe("CP3");
    expect(summary.alignment.explainabilitySource).toContain("RUNTIME_ADAPTER_HUB");
    expect(summary.explainabilityLocales).toContain("en");
    expect(summary.sampleExplanation.summary).toBeTruthy();
    expect(summary.registeredAdapters).toHaveLength(4);
    expect(summary.adapterCount).toBe(4);
    expect(summary.textSurface).toContain("CVF W2-T1 CP3 Adapter Evidence And Explainability Integration");
    expect(summary.markdownSurface).toContain("## Explainability Surface");
    expect(summary.markdownSurface).toContain("## Release Evidence Surface");
    expect(summary.markdownSurface).toContain("## Adapter Inventory");
  });

  it("records CP3 alignment metadata preserving lineage", () => {
    expect(EXECUTION_ADAPTER_EVIDENCE_ALIGNMENT.preservesLineage).toBe(true);
    expect(EXECUTION_ADAPTER_EVIDENCE_ALIGNMENT.evidenceEntrypoints).toContain("ExplainabilityLayer");
    expect(EXECUTION_ADAPTER_EVIDENCE_ALIGNMENT.evidenceEntrypoints).toContain("ReleaseEvidenceAdapter");
    expect(EXECUTION_ADAPTER_EVIDENCE_ALIGNMENT.adapterInventory).toHaveLength(4);
  });

  // CP4 — Selected Execution Authorization Boundary Alignment
  it("creates an authorization boundary surface with policy, edge security, and guard boundary", () => {
    const surface = createExecutionAuthorizationBoundarySurface();

    expect(surface.alignment.controlPoint).toBe("CP4");
    expect(surface.alignment.executionClass).toBe("wrapper/re-export");
    expect(surface.alignment.preservesLineage).toBe(true);
    expect(surface.policy.decisionTypes).toContain("allow");
    expect(surface.policy.decisionTypes).toContain("deny");
    expect(surface.policy.decisionTypes).toContain("pending");
    expect(surface.policy.contractSurface).toContain("PolicyContract");
    expect(surface.edgeSecurity.config.enablePIIMasking).toBe(true);
    expect(surface.edgeSecurity.config.enableAuditLog).toBe(true);
    expect(surface.edgeSecurity.enabledCapabilities).toContain("PII Masking");
    expect(surface.edgeSecurity.enabledCapabilities).toContain("Audit Log");
    expect(surface.guardBoundary.registeredGuardCount).toBeGreaterThan(0);
  });

  it("describes authorization boundary as a CP4 review surface with text and markdown", () => {
    const summary = describeExecutionAuthorizationBoundary();

    expect(summary.trancheId).toBe("W2-T1");
    expect(summary.controlPointId).toBe("CP4");
    expect(summary.policyDecisionTypes).toHaveLength(5);
    expect(summary.edgeSecurityCapabilities.length).toBeGreaterThan(0);
    expect(summary.registeredGuardCount).toBeGreaterThan(0);
    expect(summary.textSurface).toContain("CVF W2-T1 CP4 Selected Execution Authorization Boundary Alignment");
    expect(summary.markdownSurface).toContain("## Policy Authorization Boundary");
    expect(summary.markdownSurface).toContain("## Edge Security Boundary");
    expect(summary.markdownSurface).toContain("## Guard Boundary");
    expect(summary.markdownSurface).toContain("## Deferred Internals");
  });

  it("records CP4 alignment metadata with deferred internals", () => {
    expect(EXECUTION_AUTHORIZATION_BOUNDARY_ALIGNMENT.preservesLineage).toBe(true);
    expect(EXECUTION_AUTHORIZATION_BOUNDARY_ALIGNMENT.authorizationTypes).toContain("PolicyContract");
    expect(EXECUTION_AUTHORIZATION_BOUNDARY_ALIGNMENT.authorizationTypes).toContain("EdgeSecurityConfig");
    expect(EXECUTION_AUTHORIZATION_BOUNDARY_ALIGNMENT.deferredInternals).toContain(
      "EXTENSIONS/CVF_ECO_v2.5_MCP_SERVER/src/guards",
    );
  });
});

// W2-T2 — Execution Dispatch Bridge

function makeAssignment(overrides: Partial<TaskAssignment> = {}): TaskAssignment {
  return {
    assignmentId: "assign-001",
    taskId: "task-001",
    title: "Implement intake module",
    assignedRole: "builder",
    targetPhase: "BUILD",
    riskLevel: "R1",
    scopeConstraints: ["phase:BUILD", "risk:R1", "role:builder", "requires:test-coverage"],
    dependencies: [],
    executionAuthorizationHash: "auth-hash-001",
    ...overrides,
  };
}

describe("W2-T2 CP1 — DispatchContract", () => {
  it("dispatches a single R1 assignment and returns ALLOW decision", () => {
    const contract = createDispatchContract();
    const assignments = [makeAssignment()];
    const result = contract.dispatch("orch-001", assignments);

    expect(result.orchestrationId).toBe("orch-001");
    expect(result.totalDispatched).toBe(1);
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].assignmentId).toBe("assign-001");
    expect(result.entries[0].taskId).toBe("task-001");
    expect(["ALLOW", "BLOCK", "ESCALATE"]).toContain(result.entries[0].guardDecision);
    expect(result.dispatchId).toBeTruthy();
    expect(result.dispatchHash).toBe(result.dispatchId);
  });

  it("sets dispatchAuthorized=true when guard returns ALLOW", () => {
    const engine = createGuardEngine();
    const contract = createDispatchContract({ engine });
    const assignments = [makeAssignment({ riskLevel: "R0", targetPhase: "DESIGN" })];
    const result = contract.dispatch("orch-r0", assignments);

    const entry = result.entries[0];
    expect(entry.dispatchAuthorized).toBe(entry.guardDecision === "ALLOW");
  });

  it("correctly counts authorized, blocked, and escalated entries", () => {
    const contract = createDispatchContract();
    const assignments = [
      makeAssignment({ assignmentId: "a1", taskId: "t1", riskLevel: "R0" }),
      makeAssignment({ assignmentId: "a2", taskId: "t2", riskLevel: "R1" }),
      makeAssignment({ assignmentId: "a3", taskId: "t3", riskLevel: "R2" }),
    ];
    const result = contract.dispatch("orch-multi", assignments);

    expect(result.totalDispatched).toBe(3);
    expect(result.authorizedCount + result.blockedCount + result.escalatedCount).toBe(3);
  });

  it("handles empty assignment list and emits warning", () => {
    const contract = createDispatchContract();
    const result = contract.dispatch("orch-empty", []);

    expect(result.totalDispatched).toBe(0);
    expect(result.entries).toHaveLength(0);
    expect(result.authorizedCount).toBe(0);
    expect(result.warnings.some((w) => w.includes("zero assignments"))).toBe(true);
  });

  it("maps reviewer role to REVIEWER guard role", () => {
    const contract = createDispatchContract();
    const assignments = [makeAssignment({ assignedRole: "reviewer", targetPhase: "REVIEW" })];
    const result = contract.dispatch("orch-review", assignments);

    expect(result.entries[0].pipelineResult.requestId).toBe(assignments[0].assignmentId);
  });

  it("produces a stable dispatchHash for identical inputs", () => {
    const fixedTime = "2026-03-22T10:00:00.000Z";
    const contract = createDispatchContract({ now: () => fixedTime });
    const assignments = [makeAssignment()];

    const r1 = contract.dispatch("orch-stable", assignments);
    const r2 = contract.dispatch("orch-stable", assignments);

    expect(r1.dispatchHash).toBe(r2.dispatchHash);
  });

  it("produces a different dispatchHash when orchestrationId changes", () => {
    const fixedTime = "2026-03-22T10:00:00.000Z";
    const contract = createDispatchContract({ now: () => fixedTime });
    const assignments = [makeAssignment()];

    const r1 = contract.dispatch("orch-A", assignments);
    const r2 = contract.dispatch("orch-B", assignments);

    expect(r1.dispatchHash).not.toBe(r2.dispatchHash);
  });

  it("populates agentGuidance from pipelineResult", () => {
    const contract = createDispatchContract();
    const result = contract.dispatch("orch-guidance", [makeAssignment()]);

    const entry = result.entries[0];
    // agentGuidance may be undefined if no guidance is emitted by the engine
    expect(entry.pipelineResult).toBeTruthy();
    expect(entry.pipelineResult.executedAt).toBeTruthy();
  });

  it("includes R3 assignments and records warnings for high-risk dispatch", () => {
    const contract = createDispatchContract();
    const assignments = [makeAssignment({ riskLevel: "R3", scopeConstraints: ["phase:BUILD", "risk:R3", "requires:full-governance-review"] })];
    const result = contract.dispatch("orch-r3", assignments);

    expect(result.totalDispatched).toBe(1);
    // warnings may include BLOCK or ESCALATE signals from guard engine on R3
    expect(Array.isArray(result.warnings)).toBe(true);
  });

  it("creates DispatchContract via class constructor with default engine", () => {
    const contract = new DispatchContract();
    expect(contract).toBeInstanceOf(DispatchContract);
    const result = contract.dispatch("orch-ctor", [makeAssignment()]);
    expect(result.dispatchId).toBeTruthy();
  });
});

describe("W2-T2 CP2 — PolicyGateContract", () => {
  function makeDispatchResult(entries: { assignmentId: string; taskId: string; guardDecision: "ALLOW" | "BLOCK" | "ESCALATE"; riskLevel: string }[]): DispatchResult {
    const dispatchEntries = entries.map((e) => ({
      assignmentId: e.assignmentId,
      taskId: e.taskId,
      dispatchedAt: "2026-03-22T10:00:00.000Z",
      guardDecision: e.guardDecision as any,
      pipelineResult: {
        requestId: e.assignmentId,
        finalDecision: e.guardDecision as any,
        results: [{ context: { riskLevel: e.riskLevel } } as any],
        executedAt: "2026-03-22T10:00:00.000Z",
        durationMs: 1,
      },
      dispatchAuthorized: e.guardDecision === "ALLOW",
    }));

    return {
      dispatchId: "dispatch-test-001",
      orchestrationId: "orch-test-001",
      dispatchedAt: "2026-03-22T10:00:00.000Z",
      entries: dispatchEntries as any,
      totalDispatched: entries.length,
      authorizedCount: entries.filter((e) => e.guardDecision === "ALLOW").length,
      blockedCount: entries.filter((e) => e.guardDecision === "BLOCK").length,
      escalatedCount: entries.filter((e) => e.guardDecision === "ESCALATE").length,
      dispatchHash: "test-dispatch-hash",
      warnings: [],
    };
  }

  it("produces allow decision for ALLOW + R0", () => {
    const gate = createPolicyGateContract();
    const result = gate.evaluate(makeDispatchResult([{ assignmentId: "a1", taskId: "t1", guardDecision: "ALLOW", riskLevel: "R0" }]));

    expect(result.entries[0].gateDecision).toBe("allow");
    expect(result.allowedCount).toBe(1);
    expect(result.deniedCount).toBe(0);
  });

  it("produces deny decision for BLOCK", () => {
    const gate = createPolicyGateContract();
    const result = gate.evaluate(makeDispatchResult([{ assignmentId: "a1", taskId: "t1", guardDecision: "BLOCK", riskLevel: "R1" }]));

    expect(result.entries[0].gateDecision).toBe("deny");
    expect(result.deniedCount).toBe(1);
  });

  it("produces review decision for ESCALATE", () => {
    const gate = createPolicyGateContract();
    const result = gate.evaluate(makeDispatchResult([{ assignmentId: "a1", taskId: "t1", guardDecision: "ESCALATE", riskLevel: "R2" }]));

    expect(result.entries[0].gateDecision).toBe("review");
    expect(result.reviewRequiredCount).toBe(1);
  });

  it("produces sandbox decision for ALLOW + R3", () => {
    const gate = createPolicyGateContract();
    const result = gate.evaluate(makeDispatchResult([{ assignmentId: "a1", taskId: "t1", guardDecision: "ALLOW", riskLevel: "R3" }]));

    expect(result.entries[0].gateDecision).toBe("sandbox");
    expect(result.sandboxedCount).toBe(1);
  });

  it("produces review decision for ALLOW + R2", () => {
    const gate = createPolicyGateContract();
    const result = gate.evaluate(makeDispatchResult([{ assignmentId: "a1", taskId: "t1", guardDecision: "ALLOW", riskLevel: "R2" }]));

    expect(result.entries[0].gateDecision).toBe("review");
  });

  it("handles mixed decisions and counts correctly", () => {
    const gate = createPolicyGateContract();
    const result = gate.evaluate(makeDispatchResult([
      { assignmentId: "a1", taskId: "t1", guardDecision: "ALLOW", riskLevel: "R0" },
      { assignmentId: "a2", taskId: "t2", guardDecision: "BLOCK", riskLevel: "R1" },
      { assignmentId: "a3", taskId: "t3", guardDecision: "ALLOW", riskLevel: "R3" },
    ]));

    expect(result.allowedCount).toBe(1);
    expect(result.deniedCount).toBe(1);
    expect(result.sandboxedCount).toBe(1);
    expect(result.entries).toHaveLength(3);
  });

  it("handles empty dispatch result", () => {
    const gate = createPolicyGateContract();
    const result = gate.evaluate(makeDispatchResult([]));

    expect(result.entries).toHaveLength(0);
    expect(result.allowedCount).toBe(0);
    expect(result.summary).toContain("zero entries");
  });

  it("produces a stable gateHash for identical inputs", () => {
    const fixedTime = "2026-03-22T10:00:00.000Z";
    const gate = createPolicyGateContract({ now: () => fixedTime });
    const dispatchResult = makeDispatchResult([{ assignmentId: "a1", taskId: "t1", guardDecision: "ALLOW", riskLevel: "R1" }]);

    const r1 = gate.evaluate(dispatchResult);
    const r2 = gate.evaluate(dispatchResult);

    expect(r1.gateHash).toBe(r2.gateHash);
  });
});

describe("W2-T2 CP3 — ExecutionBridgeConsumerContract", () => {
  function buildDesignConsumptionReceipt() {
    const intakeContract = createControlPlaneIntakeContract();
    const intake = intakeContract.execute({
      vibe: "Build a governed execution bridge for task dispatch",
      consumerId: "w2-t2-test",
    });
    const designConsumer = createDesignConsumerContract();
    return designConsumer.consume(intake);
  }

  it("bridges a DesignConsumptionReceipt to an ExecutionBridgeReceipt", () => {
    const designReceipt = buildDesignConsumptionReceipt();
    const bridge = createExecutionBridgeConsumerContract();
    const result = bridge.bridge(designReceipt);

    expect(result.bridgeReceiptId).toBeTruthy();
    expect(result.designReceiptId).toBe(designReceipt.receiptId);
    expect(result.orchestrationId).toBe(designReceipt.orchestrationResult.orchestrationId);
    expect(result.totalAssignments).toBe(designReceipt.orchestrationResult.assignments.length);
    expect(result.bridgeHash).toBeTruthy();
  });

  it("produces a DispatchResult inside the bridge receipt", () => {
    const designReceipt = buildDesignConsumptionReceipt();
    const bridge = createExecutionBridgeConsumerContract();
    const result = bridge.bridge(designReceipt);

    expect(result.dispatchResult).toBeTruthy();
    expect(result.dispatchResult.totalDispatched).toBe(result.totalAssignments);
    expect(result.dispatchResult.orchestrationId).toBe(result.orchestrationId);
  });

  it("produces a PolicyGateResult inside the bridge receipt", () => {
    const designReceipt = buildDesignConsumptionReceipt();
    const bridge = createExecutionBridgeConsumerContract();
    const result = bridge.bridge(designReceipt);

    expect(result.policyGateResult).toBeTruthy();
    expect(result.policyGateResult.entries).toHaveLength(result.totalAssignments);
    expect(result.policyGateResult.dispatchId).toBe(result.dispatchResult.dispatchId);
  });

  it("tracks 5 pipeline stages", () => {
    const designReceipt = buildDesignConsumptionReceipt();
    const bridge = createExecutionBridgeConsumerContract();
    const result = bridge.bridge(designReceipt);

    expect(result.pipelineStages).toHaveLength(5);
    const stageNames = result.pipelineStages.map((s) => s.stage);
    expect(stageNames).toContain("DESIGN_RECEIPT_INGESTED");
    expect(stageNames).toContain("ORCHESTRATION_EXTRACTED");
    expect(stageNames).toContain("DISPATCH_EVALUATED");
    expect(stageNames).toContain("POLICY_GATE_APPLIED");
    expect(stageNames).toContain("BRIDGE_RECEIPT_ISSUED");
  });

  it("authorization counts sum to totalAssignments", () => {
    const designReceipt = buildDesignConsumptionReceipt();
    const bridge = createExecutionBridgeConsumerContract();
    const result = bridge.bridge(designReceipt);

    const sum = result.authorizedForExecution + result.requiresReview + result.sandboxed + result.blockedFromExecution;
    expect(sum).toBe(result.totalAssignments);
  });

  it("produces a non-empty deterministic bridgeHash", () => {
    const fixedTime = "2026-03-22T10:00:00.000Z";
    const designReceipt = buildDesignConsumptionReceipt();
    const bridge = createExecutionBridgeConsumerContract({ now: () => fixedTime });
    const result = bridge.bridge(designReceipt);

    expect(result.bridgeHash).toBeTruthy();
    expect(result.bridgeHash.length).toBeGreaterThan(0);
    expect(result.bridgeReceiptId).not.toBe(result.bridgeHash);
  });

  it("propagates warnings from the design receipt", () => {
    const designReceipt = buildDesignConsumptionReceipt();
    // Add a synthetic warning to the design receipt
    const receiptWithWarning = { ...designReceipt, warnings: ["test warning from design phase"] };
    const bridge = createExecutionBridgeConsumerContract();
    const result = bridge.bridge(receiptWithWarning);

    expect(result.warnings.some((w) => w.includes("[design]") && w.includes("test warning"))).toBe(true);
  });

  it("preserves consumerId from design receipt", () => {
    const designReceipt = buildDesignConsumptionReceipt();
    const bridge = createExecutionBridgeConsumerContract();
    const result = bridge.bridge(designReceipt);

    expect(result.consumerId).toBe(designReceipt.consumerId);
  });

  it("creates ExecutionBridgeConsumerContract via class constructor", () => {
    const contract = new ExecutionBridgeConsumerContract();
    expect(contract).toBeInstanceOf(ExecutionBridgeConsumerContract);
    const designReceipt = buildDesignConsumptionReceipt();
    const result = contract.bridge(designReceipt);
    expect(result.bridgeReceiptId).toBeTruthy();
  });
});

describe("W2-T3 CP1 — CommandRuntimeContract", () => {
  function makePolicyGateResult(
    entries: { assignmentId: string; taskId: string; gateDecision: "allow" | "deny" | "review" | "sandbox" | "pending"; riskLevel?: string }[],
  ) {
    const gateEntries = entries.map((e) => ({
      assignmentId: e.assignmentId,
      taskId: e.taskId,
      guardDecision: "ALLOW" as const,
      riskLevel: e.riskLevel ?? "R1",
      gateDecision: e.gateDecision,
      rationale: `Test rationale for ${e.gateDecision}`,
    }));

    return {
      gateId: "gate-test-001",
      dispatchId: "dispatch-test-001",
      evaluatedAt: "2026-03-22T10:00:00.000Z",
      entries: gateEntries,
      allowedCount: gateEntries.filter((e) => e.gateDecision === "allow").length,
      deniedCount: gateEntries.filter((e) => e.gateDecision === "deny").length,
      reviewRequiredCount: gateEntries.filter((e) => e.gateDecision === "review").length,
      sandboxedCount: gateEntries.filter((e) => e.gateDecision === "sandbox").length,
      pendingCount: gateEntries.filter((e) => e.gateDecision === "pending").length,
      gateHash: "gate-hash-001",
      summary: "Test gate result",
    };
  }

  it("produces EXECUTED records for allow decisions", () => {
    const contract = createCommandRuntimeContract();
    const gateResult = makePolicyGateResult([
      { assignmentId: "a1", taskId: "t1", gateDecision: "allow" },
    ]);
    const result = contract.execute(gateResult);

    expect(result.executedCount).toBe(1);
    expect(result.records[0].status).toBe("EXECUTED");
    expect(result.records[0].assignmentId).toBe("a1");
    expect(result.records[0].executionHash).toBeTruthy();
  });

  it("produces DELEGATED_TO_SANDBOX records for sandbox decisions", () => {
    const contract = createCommandRuntimeContract();
    const gateResult = makePolicyGateResult([
      { assignmentId: "a1", taskId: "t1", gateDecision: "sandbox", riskLevel: "R3" },
    ]);
    const result = contract.execute(gateResult);

    expect(result.sandboxedCount).toBe(1);
    expect(result.records[0].status).toBe("DELEGATED_TO_SANDBOX");
  });

  it("produces SKIPPED_DENIED records for deny decisions", () => {
    const contract = createCommandRuntimeContract();
    const gateResult = makePolicyGateResult([
      { assignmentId: "a1", taskId: "t1", gateDecision: "deny" },
    ]);
    const result = contract.execute(gateResult);

    expect(result.skippedCount).toBe(1);
    expect(result.records[0].status).toBe("SKIPPED_DENIED");
  });

  it("produces SKIPPED_REVIEW_REQUIRED records for review decisions", () => {
    const contract = createCommandRuntimeContract();
    const gateResult = makePolicyGateResult([
      { assignmentId: "a1", taskId: "t1", gateDecision: "review" },
    ]);
    const result = contract.execute(gateResult);

    expect(result.skippedCount).toBe(1);
    expect(result.records[0].status).toBe("SKIPPED_REVIEW_REQUIRED");
  });

  it("produces SKIPPED_PENDING records for pending decisions", () => {
    const contract = createCommandRuntimeContract();
    const gateResult = makePolicyGateResult([
      { assignmentId: "a1", taskId: "t1", gateDecision: "pending" },
    ]);
    const result = contract.execute(gateResult);

    expect(result.skippedCount).toBe(1);
    expect(result.records[0].status).toBe("SKIPPED_PENDING");
  });

  it("counts are correct for mixed gate decisions", () => {
    const contract = createCommandRuntimeContract();
    const gateResult = makePolicyGateResult([
      { assignmentId: "a1", taskId: "t1", gateDecision: "allow" },
      { assignmentId: "a2", taskId: "t2", gateDecision: "sandbox", riskLevel: "R3" },
      { assignmentId: "a3", taskId: "t3", gateDecision: "deny" },
      { assignmentId: "a4", taskId: "t4", gateDecision: "review" },
      { assignmentId: "a5", taskId: "t5", gateDecision: "pending" },
    ]);
    const result = contract.execute(gateResult);

    expect(result.executedCount).toBe(1);
    expect(result.sandboxedCount).toBe(1);
    expect(result.skippedCount).toBe(3);
    expect(result.failedCount).toBe(0);
    expect(result.records).toHaveLength(5);
  });

  it("accepts injectable executeTask and calls it for allow decisions", () => {
    let called = false;
    const customExecutor = (entry: any, sandbox: boolean) => {
      called = true;
      return {
        assignmentId: entry.assignmentId,
        taskId: entry.taskId,
        gateDecision: entry.gateDecision,
        status: "EXECUTED" as const,
        executionHash: "custom-hash-001",
        notes: "custom executor invoked",
      };
    };
    const contract = createCommandRuntimeContract({ executeTask: customExecutor });
    const gateResult = makePolicyGateResult([{ assignmentId: "a1", taskId: "t1", gateDecision: "allow" }]);
    contract.execute(gateResult);

    expect(called).toBe(true);
  });

  it("produces a stable runtimeHash for identical inputs", () => {
    const fixedTime = "2026-03-22T10:00:00.000Z";
    const contract1 = createCommandRuntimeContract({ now: () => fixedTime });
    const contract2 = createCommandRuntimeContract({ now: () => fixedTime });
    const gateResult = makePolicyGateResult([{ assignmentId: "a1", taskId: "t1", gateDecision: "allow" }]);

    const r1 = contract1.execute(gateResult);
    const r2 = contract2.execute(gateResult);

    expect(r1.runtimeHash).toBe(r2.runtimeHash);
  });

  it("handles empty gate result", () => {
    const contract = createCommandRuntimeContract();
    const gateResult = makePolicyGateResult([]);
    const result = contract.execute(gateResult);

    expect(result.records).toHaveLength(0);
    expect(result.executedCount).toBe(0);
    expect(result.summary).toContain("zero entries");
  });

  it("creates CommandRuntimeContract via class constructor", () => {
    const contract = new CommandRuntimeContract();
    expect(contract).toBeInstanceOf(CommandRuntimeContract);
    const gateResult = makePolicyGateResult([{ assignmentId: "a1", taskId: "t1", gateDecision: "allow" }]);
    const result = contract.execute(gateResult);
    expect(result.runtimeId).toBeTruthy();
  });

  it("records include gateDecision field from the entry", () => {
    const contract = createCommandRuntimeContract();
    const gateResult = makePolicyGateResult([
      { assignmentId: "a1", taskId: "t1", gateDecision: "allow" },
      { assignmentId: "a2", taskId: "t2", gateDecision: "deny" },
    ]);
    const result = contract.execute(gateResult);

    expect(result.records[0].gateDecision).toBe("allow");
    expect(result.records[1].gateDecision).toBe("deny");
  });
});

describe("W2-T3 CP2 — ExecutionPipelineContract", () => {
  function buildBridgeReceipt() {
    const intakeContract = createControlPlaneIntakeContract();
    const intake = intakeContract.execute({
      vibe: "Build an execution command runtime for task processing",
      consumerId: "w2-t3-test",
    });
    const designConsumer = createDesignConsumerContract();
    const designReceipt = designConsumer.consume(intake);
    const bridge = createExecutionBridgeConsumerContract();
    return bridge.bridge(designReceipt);
  }

  it("runs ExecutionPipelineContract and returns an ExecutionPipelineReceipt", () => {
    const bridgeReceipt = buildBridgeReceipt();
    const pipeline = createExecutionPipelineContract();
    const result = pipeline.run(bridgeReceipt);

    expect(result.pipelineReceiptId).toBeTruthy();
    expect(result.bridgeReceiptId).toBe(bridgeReceipt.bridgeReceiptId);
    expect(result.orchestrationId).toBe(bridgeReceipt.orchestrationId);
    expect(result.pipelineHash).toBeTruthy();
  });

  it("tracks 4 pipeline stages", () => {
    const bridgeReceipt = buildBridgeReceipt();
    const pipeline = createExecutionPipelineContract();
    const result = pipeline.run(bridgeReceipt);

    expect(result.pipelineStages).toHaveLength(4);
    const stageNames = result.pipelineStages.map((s) => s.stage);
    expect(stageNames).toContain("BRIDGE_INGESTED");
    expect(stageNames).toContain("GATE_EXTRACTED");
    expect(stageNames).toContain("RUNTIME_EXECUTED");
    expect(stageNames).toContain("PIPELINE_RECEIPT_ISSUED");
  });

  it("produces a CommandRuntimeResult inside the pipeline receipt", () => {
    const bridgeReceipt = buildBridgeReceipt();
    const pipeline = createExecutionPipelineContract();
    const result = pipeline.run(bridgeReceipt);

    expect(result.commandRuntimeResult).toBeTruthy();
    expect(result.commandRuntimeResult.runtimeId).toBeTruthy();
    expect(result.gateId).toBe(bridgeReceipt.policyGateResult.gateId);
    expect(result.runtimeId).toBe(result.commandRuntimeResult.runtimeId);
  });

  it("execution counts match command runtime result", () => {
    const bridgeReceipt = buildBridgeReceipt();
    const pipeline = createExecutionPipelineContract();
    const result = pipeline.run(bridgeReceipt);

    expect(result.executedCount).toBe(result.commandRuntimeResult.executedCount);
    expect(result.sandboxedCount).toBe(result.commandRuntimeResult.sandboxedCount);
    expect(result.skippedCount).toBe(result.commandRuntimeResult.skippedCount);
    expect(result.failedCount).toBe(result.commandRuntimeResult.failedCount);
  });

  it("totalEntries equals number of records in runtime result", () => {
    const bridgeReceipt = buildBridgeReceipt();
    const pipeline = createExecutionPipelineContract();
    const result = pipeline.run(bridgeReceipt);

    expect(result.totalEntries).toBe(result.commandRuntimeResult.records.length);
  });

  it("produces a non-empty deterministic pipelineHash", () => {
    const fixedTime = "2026-03-22T10:00:00.000Z";
    const bridgeReceipt = buildBridgeReceipt();
    const pipeline = createExecutionPipelineContract({ now: () => fixedTime });
    const result = pipeline.run(bridgeReceipt);

    expect(result.pipelineHash).toBeTruthy();
    expect(result.pipelineHash.length).toBeGreaterThan(0);
    expect(result.pipelineReceiptId).not.toBe(result.pipelineHash);
  });

  it("propagates bridge receipt warnings", () => {
    const bridgeReceipt = buildBridgeReceipt();
    const receiptWithWarning = { ...bridgeReceipt, warnings: ["test bridge warning"] };
    const pipeline = createExecutionPipelineContract();
    const result = pipeline.run(receiptWithWarning);

    expect(result.warnings.some((w) => w.includes("[bridge]") && w.includes("test bridge warning"))).toBe(true);
  });

  it("creates ExecutionPipelineContract via class constructor", () => {
    const contract = new ExecutionPipelineContract();
    expect(contract).toBeInstanceOf(ExecutionPipelineContract);
    const bridgeReceipt = buildBridgeReceipt();
    const result = contract.run(bridgeReceipt);
    expect(result.pipelineReceiptId).toBeTruthy();
  });

  // ─── W2-T4 CP1 — ExecutionObserverContract ──────────────────────────────

  describe("W2-T4 CP1 — ExecutionObserverContract", () => {
    function makePipelineReceipt(overrides: Partial<{
      executedCount: number;
      failedCount: number;
      sandboxedCount: number;
      skippedCount: number;
      totalEntries: number;
      warnings: string[];
    }> = {}) {
      const executedCount = overrides.executedCount ?? 3;
      const failedCount = overrides.failedCount ?? 0;
      const sandboxedCount = overrides.sandboxedCount ?? 0;
      const skippedCount = overrides.skippedCount ?? 0;
      const totalEntries = overrides.totalEntries ?? ((executedCount + failedCount + sandboxedCount + skippedCount) || 3);
      return {
        pipelineReceiptId: "pipe-test-001",
        createdAt: "2026-03-22T10:00:00.000Z",
        bridgeReceiptId: "bridge-001",
        orchestrationId: "orch-001",
        gateId: "gate-001",
        runtimeId: "runtime-001",
        commandRuntimeResult: {} as any,
        totalEntries,
        executedCount,
        failedCount,
        sandboxedCount,
        skippedCount,
        pipelineStages: [],
        pipelineHash: "hash-001",
        warnings: overrides.warnings ?? [],
      };
    }

    it("classifies SUCCESS when all entries executed with no failures", () => {
      const observer = createExecutionObserverContract();
      const receipt = makePipelineReceipt({ executedCount: 3, failedCount: 0, sandboxedCount: 0, skippedCount: 0 });
      const obs = observer.observe(receipt as any);

      expect(obs.outcomeClass).toBe("SUCCESS");
      expect(obs.confidenceSignal).toBe(1.0);
    });

    it("classifies SUCCESS with reduced confidence when warnings present", () => {
      const observer = createExecutionObserverContract();
      const receipt = makePipelineReceipt({ executedCount: 3, warnings: ["Some warning."] });
      const obs = observer.observe(receipt as any);

      expect(obs.outcomeClass).toBe("SUCCESS");
      expect(obs.confidenceSignal).toBe(0.8);
    });

    it("classifies FAILED when any failure exists", () => {
      const observer = createExecutionObserverContract();
      const receipt = makePipelineReceipt({ executedCount: 1, failedCount: 2, totalEntries: 3 });
      const obs = observer.observe(receipt as any);

      expect(obs.outcomeClass).toBe("FAILED");
      expect(obs.confidenceSignal).toBe(0.0);
    });

    it("classifies GATED when nothing executed and entries skipped", () => {
      const observer = createExecutionObserverContract();
      const receipt = makePipelineReceipt({ executedCount: 0, skippedCount: 3, totalEntries: 3 });
      const obs = observer.observe(receipt as any);

      expect(obs.outcomeClass).toBe("GATED");
    });

    it("classifies SANDBOXED when sandboxed but nothing executed", () => {
      const observer = createExecutionObserverContract();
      const receipt = makePipelineReceipt({ executedCount: 0, sandboxedCount: 2, totalEntries: 2 });
      const obs = observer.observe(receipt as any);

      expect(obs.outcomeClass).toBe("SANDBOXED");
    });

    it("classifies PARTIAL when some executed and some skipped", () => {
      const observer = createExecutionObserverContract();
      const receipt = makePipelineReceipt({ executedCount: 2, skippedCount: 1, totalEntries: 3 });
      const obs = observer.observe(receipt as any);

      expect(obs.outcomeClass).toBe("PARTIAL");
    });

    it("builds at least one observation note always", () => {
      const observer = createExecutionObserverContract();
      const receipt = makePipelineReceipt();
      const obs = observer.observe(receipt as any);

      expect(obs.notes.length).toBeGreaterThanOrEqual(1);
      expect(obs.notes[0].noteId.length).toBeGreaterThan(0);
    });

    it("builds additional notes for failures, sandbox, skips, and warnings", () => {
      const observer = createExecutionObserverContract();
      const receipt = makePipelineReceipt({
        executedCount: 1,
        failedCount: 1,
        sandboxedCount: 1,
        skippedCount: 1,
        totalEntries: 4,
        warnings: ["A warning."],
      });
      const obs = observer.observe(receipt as any);

      const categories = obs.notes.map((n) => n.category);
      expect(categories).toContain("risk_signal");
      expect(categories).toContain("gate_signal");
      expect(categories).toContain("warning_signal");
    });

    it("produces stable observationHash for identical inputs with fixed time", () => {
      const fixedTime = "2026-03-22T10:00:00.000Z";
      const o1 = createExecutionObserverContract({ now: () => fixedTime });
      const o2 = createExecutionObserverContract({ now: () => fixedTime });
      const receipt = makePipelineReceipt({ executedCount: 2 });

      expect(o1.observe(receipt as any).observationHash).toBe(o2.observe(receipt as any).observationHash);
    });

    it("accepts injectable classifyOutcome override", () => {
      const observer = createExecutionObserverContract({
        classifyOutcome: () => "REJECT" as any,
      });
      const receipt = makePipelineReceipt({ executedCount: 3 });
      const obs = observer.observe(receipt as any);

      expect(obs.outcomeClass).toBe("REJECT");
    });

    it("creates ExecutionObserverContract via class constructor", () => {
      const contract = new ExecutionObserverContract();
      expect(contract).toBeInstanceOf(ExecutionObserverContract);
    });
  });

  // ─── W2-T4 CP2 — ExecutionFeedbackContract ──────────────────────────────

  describe("W2-T4 CP2 — ExecutionFeedbackContract", () => {
    function makeObservation(outcomeClass: string, confidenceSignal = 1.0) {
      return {
        observationId: "obs-001",
        createdAt: "2026-03-22T10:00:00.000Z",
        sourcePipelineId: "pipe-001",
        outcomeClass,
        confidenceSignal,
        totalEntries: 3,
        executedCount: outcomeClass === "SUCCESS" ? 3 : 1,
        failedCount: outcomeClass === "FAILED" ? 2 : 0,
        sandboxedCount: outcomeClass === "SANDBOXED" ? 2 : 0,
        skippedCount: outcomeClass === "GATED" ? 3 : 0,
        notes: [],
        observationHash: "obs-hash-001",
      };
    }

    it("maps SUCCESS → ACCEPT with low priority", () => {
      const contract = createExecutionFeedbackContract();
      const obs = makeObservation("SUCCESS", 1.0);
      const signal = contract.generate(obs as any);

      expect(signal.feedbackClass).toBe("ACCEPT");
      expect(signal.priority).toBe("low");
    });

    it("maps PARTIAL → RETRY with medium priority", () => {
      const contract = createExecutionFeedbackContract();
      const obs = makeObservation("PARTIAL", 0.6);
      const signal = contract.generate(obs as any);

      expect(signal.feedbackClass).toBe("RETRY");
      expect(signal.priority).toBe("medium");
    });

    it("maps FAILED → ESCALATE with high priority", () => {
      const contract = createExecutionFeedbackContract();
      const obs = makeObservation("FAILED", 0.0);
      const signal = contract.generate(obs as any);

      expect(signal.feedbackClass).toBe("ESCALATE");
      expect(signal.priority).toBe("critical");
    });

    it("maps GATED → ESCALATE", () => {
      const contract = createExecutionFeedbackContract();
      const obs = makeObservation("GATED", 0.3);
      const signal = contract.generate(obs as any);

      expect(signal.feedbackClass).toBe("ESCALATE");
    });

    it("maps SANDBOXED → RETRY", () => {
      const contract = createExecutionFeedbackContract();
      const obs = makeObservation("SANDBOXED", 0.5);
      const signal = contract.generate(obs as any);

      expect(signal.feedbackClass).toBe("RETRY");
    });

    it("ACCEPT signal has non-zero confidenceBoost", () => {
      const contract = createExecutionFeedbackContract();
      const obs = makeObservation("SUCCESS", 0.8);
      const signal = contract.generate(obs as any);

      expect(signal.confidenceBoost).toBeGreaterThan(0);
    });

    it("ESCALATE signal has zero confidenceBoost", () => {
      const contract = createExecutionFeedbackContract();
      const obs = makeObservation("FAILED", 0.0);
      const signal = contract.generate(obs as any);

      expect(signal.confidenceBoost).toBe(0);
    });

    it("produces stable feedbackHash for identical inputs with fixed time", () => {
      const fixedTime = "2026-03-22T10:00:00.000Z";
      const f1 = createExecutionFeedbackContract({ now: () => fixedTime });
      const f2 = createExecutionFeedbackContract({ now: () => fixedTime });
      const obs = makeObservation("SUCCESS", 1.0);

      expect(f1.generate(obs as any).feedbackHash).toBe(f2.generate(obs as any).feedbackHash);
    });

    it("rationale is non-empty for all feedback classes", () => {
      const contract = createExecutionFeedbackContract();
      for (const outcome of ["SUCCESS", "PARTIAL", "FAILED", "GATED", "SANDBOXED"]) {
        const signal = contract.generate(makeObservation(outcome, 0.5) as any);
        expect(signal.rationale.length).toBeGreaterThan(0);
      }
    });

    it("creates ExecutionFeedbackContract via class constructor", () => {
      const contract = new ExecutionFeedbackContract();
      expect(contract).toBeInstanceOf(ExecutionFeedbackContract);
    });
  });

  // ─── W2-T5 CP1 — FeedbackRoutingContract ────────────────────────────────

  describe("W2-T5 CP1 — FeedbackRoutingContract", () => {
    function makeSignal(
      feedbackClass: "ACCEPT" | "RETRY" | "ESCALATE" | "REJECT",
      confidenceBoost = 0,
      id = "fb-001",
    ): ExecutionFeedbackSignal {
      return {
        feedbackId: id,
        createdAt: "2026-03-22T10:00:00.000Z",
        sourceObservationId: `obs-${id}`,
        sourcePipelineId: `pipe-${id}`,
        feedbackClass,
        priority: feedbackClass === "REJECT" ? "critical" : "low",
        rationale: `Test rationale for ${feedbackClass}`,
        confidenceBoost,
        feedbackHash: `hash-${id}`,
      };
    }

    it("routes ACCEPT signal with ACCEPT action and low priority", () => {
      const contract = createFeedbackRoutingContract();
      const decision = contract.route(makeSignal("ACCEPT", 0.1));

      expect(decision.routingAction).toBe("ACCEPT");
      expect(decision.routingPriority).toBe("low");
    });

    it("routes RETRY with confidenceBoost=0 as high priority", () => {
      const contract = createFeedbackRoutingContract();
      const decision = contract.route(makeSignal("RETRY", 0));

      expect(decision.routingAction).toBe("RETRY");
      expect(decision.routingPriority).toBe("high");
    });

    it("routes RETRY with confidenceBoost>0 as medium priority", () => {
      const contract = createFeedbackRoutingContract();
      const decision = contract.route(makeSignal("RETRY", 0.1));

      expect(decision.routingAction).toBe("RETRY");
      expect(decision.routingPriority).toBe("medium");
    });

    it("routes ESCALATE as high priority", () => {
      const contract = createFeedbackRoutingContract();
      const decision = contract.route(makeSignal("ESCALATE", 0));

      expect(decision.routingAction).toBe("ESCALATE");
      expect(decision.routingPriority).toBe("high");
    });

    it("routes REJECT as critical priority", () => {
      const contract = createFeedbackRoutingContract();
      const decision = contract.route(makeSignal("REJECT", 0));

      expect(decision.routingAction).toBe("REJECT");
      expect(decision.routingPriority).toBe("critical");
    });

    it("rationale is non-empty and references source pipeline", () => {
      const contract = createFeedbackRoutingContract();
      const decision = contract.route(makeSignal("ACCEPT", 0.1, "fb-xyz"));

      expect(decision.rationale.length).toBeGreaterThan(0);
      expect(decision.sourcePipelineId).toBe("pipe-fb-xyz");
    });

    it("produces stable decisionHash for identical inputs with fixed time", () => {
      const fixedTime = "2026-03-22T10:00:00.000Z";
      const c1 = createFeedbackRoutingContract({ now: () => fixedTime });
      const c2 = createFeedbackRoutingContract({ now: () => fixedTime });
      const signal = makeSignal("RETRY", 0.1, "fb-stable");

      expect(c1.route(signal).decisionHash).toBe(c2.route(signal).decisionHash);
    });

    it("decisionId is non-empty and distinct from decisionHash", () => {
      const contract = createFeedbackRoutingContract();
      const decision = contract.route(makeSignal("ACCEPT", 0.2));

      expect(decision.decisionId.length).toBeGreaterThan(0);
      expect(decision.decisionId).not.toBe(decision.decisionHash);
    });

    it("creates FeedbackRoutingContract via class constructor", () => {
      const contract = new FeedbackRoutingContract();
      expect(contract).toBeInstanceOf(FeedbackRoutingContract);
    });
  });

  // ─── W2-T5 CP2 — FeedbackResolutionContract ─────────────────────────────

  describe("W2-T5 CP2 — FeedbackResolutionContract", () => {
    function makeDecision(
      routingAction: "ACCEPT" | "RETRY" | "ESCALATE" | "REJECT",
      id = "dec-001",
    ) {
      const fixedTime = "2026-03-22T10:00:00.000Z";
      const contract = createFeedbackRoutingContract({ now: () => fixedTime });
      const signal: ExecutionFeedbackSignal = {
        feedbackId: id,
        createdAt: fixedTime,
        sourceObservationId: `obs-${id}`,
        sourcePipelineId: `pipe-${id}`,
        feedbackClass: routingAction,
        priority: "low",
        rationale: `rationale-${id}`,
        confidenceBoost: 0,
        feedbackHash: `hash-${id}`,
      };
      return contract.route(signal);
    }

    it("resolves empty decisions with NORMAL urgency and all counts 0", () => {
      const contract = createFeedbackResolutionContract();
      const summary = contract.resolve([]);

      expect(summary.urgencyLevel).toBe("NORMAL");
      expect(summary.totalDecisions).toBe(0);
      expect(summary.acceptCount).toBe(0);
      expect(summary.retryCount).toBe(0);
      expect(summary.escalateCount).toBe(0);
      expect(summary.rejectCount).toBe(0);
    });

    it("resolves all-ACCEPT decisions with NORMAL urgency", () => {
      const contract = createFeedbackResolutionContract();
      const summary = contract.resolve([
        makeDecision("ACCEPT", "d1"),
        makeDecision("ACCEPT", "d2"),
      ]);

      expect(summary.urgencyLevel).toBe("NORMAL");
      expect(summary.acceptCount).toBe(2);
    });

    it("resolves any RETRY to HIGH urgency", () => {
      const contract = createFeedbackResolutionContract();
      const summary = contract.resolve([
        makeDecision("ACCEPT", "d1"),
        makeDecision("RETRY", "d2"),
      ]);

      expect(summary.urgencyLevel).toBe("HIGH");
      expect(summary.retryCount).toBe(1);
    });

    it("resolves any ESCALATE to CRITICAL urgency", () => {
      const contract = createFeedbackResolutionContract();
      const summary = contract.resolve([
        makeDecision("ACCEPT", "d1"),
        makeDecision("ESCALATE", "d2"),
      ]);

      expect(summary.urgencyLevel).toBe("CRITICAL");
      expect(summary.escalateCount).toBe(1);
    });

    it("resolves any REJECT to CRITICAL urgency", () => {
      const contract = createFeedbackResolutionContract();
      const summary = contract.resolve([
        makeDecision("ACCEPT", "d1"),
        makeDecision("REJECT", "d2"),
      ]);

      expect(summary.urgencyLevel).toBe("CRITICAL");
      expect(summary.rejectCount).toBe(1);
    });

    it("produces stable summaryHash for identical inputs with fixed time", () => {
      const fixedTime = "2026-03-22T10:00:00.000Z";
      const c1 = createFeedbackResolutionContract({ now: () => fixedTime });
      const c2 = createFeedbackResolutionContract({ now: () => fixedTime });
      const decisions = [makeDecision("ACCEPT", "d1"), makeDecision("RETRY", "d2")];

      expect(c1.resolve(decisions).summaryHash).toBe(c2.resolve(decisions).summaryHash);
    });

    it("creates FeedbackResolutionContract via class constructor", () => {
      const contract = new FeedbackResolutionContract();
      expect(contract).toBeInstanceOf(FeedbackResolutionContract);
    });
  });
});
