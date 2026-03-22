import { describe, expect, it } from "vitest";
import {
  type CVFSkillDraft,
  DEFAULT_GUARD_RUNTIME_CONFIG,
  EXECUTION_GATEWAY_WRAPPER_ALIGNMENT,
  EXECUTION_MCP_BRIDGE_ALIGNMENT,
  EXECUTION_PLANE_FOUNDATION_COORDINATION,
  ExplainabilityLayer,
  MODEL_GATEWAY_WRAPPER,
  PHASE_ORDER,
  ReleaseEvidenceAdapter,
  SessionMemory,
  SkillValidator,
  createExecutionGatewaySurface,
  createExecutionMcpBridgeSurface,
  createExecutionPlaneFoundationShell,
  createExecutionPlanePromptPreview,
  describeExecutionPlaneFoundationShell,
  describeExecutionPlaneWrapperAlignment,
  parseVibe,
} from "../src/index";

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
});
