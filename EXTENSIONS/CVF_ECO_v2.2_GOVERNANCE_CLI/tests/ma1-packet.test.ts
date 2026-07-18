import { describe, it, expect } from "vitest";
import {
  buildMa1Packet,
  MA1_CLI_CONTRACT,
  MA1_STANDARD_CONTRACT,
} from "../src/ma1-packet";
import { WORKFLOW_CHAIN_CONTRACT, WorkflowStepResult } from "../src/workflow.client";

function makeStep(overrides: Partial<WorkflowStepResult> = {}): WorkflowStepResult {
  return {
    stepIndex: 0,
    agentRole: "OPERATOR",
    templateId: "fullCycle",
    input: "original input",
    output: "step output",
    success: true,
    ...overrides,
  };
}

describe("buildMa1Packet", () => {
  it("returns correct contract versions", () => {
    const packet = buildMa1Packet(makeStep(), "AI_AGENT", "fullCycle");
    expect(packet.contractVersion).toBe(MA1_CLI_CONTRACT);
    expect(packet.ma1ContractVersion).toBe(MA1_STANDARD_CONTRACT);
    expect(packet.workflowContractVersion).toBe(WORKFLOW_CHAIN_CONTRACT);
  });

  it("sets sourcePacket from completed step", () => {
    const step = makeStep({ agentRole: "OPERATOR", output: "orchestrator output" });
    const packet = buildMa1Packet(step, "AI_AGENT", "fullCycle");
    expect(packet.sourcePacket.role).toBe("OPERATOR");
    expect(packet.sourcePacket.output).toBe("orchestrator output");
  });

  it("sets roleAssignment.targetRole", () => {
    const packet = buildMa1Packet(makeStep(), "REVIEWER", "buildReview");
    expect(packet.roleAssignment.targetRole).toBe("REVIEWER");
  });

  it("includes provider in roleAssignment when provided", () => {
    const packet = buildMa1Packet(makeStep(), "AI_AGENT", "fullCycle", { provider: "deepseek" });
    expect(packet.roleAssignment.provider).toBe("deepseek");
  });

  it("integrationDecision is proceed when step succeeded", () => {
    const packet = buildMa1Packet(makeStep({ success: true }), "AI_AGENT", "fullCycle");
    expect(packet.integrationDecision.decision).toBe("proceed");
  });

  it("integrationDecision is hold when step failed", () => {
    const packet = buildMa1Packet(makeStep({ success: false, error: "timeout" }), "AI_AGENT", "fullCycle");
    expect(packet.integrationDecision.decision).toBe("hold");
  });

  it("surfaceFidelityGate.passed matches step success", () => {
    const passing = buildMa1Packet(makeStep({ success: true }), "AI_AGENT", "fullCycle");
    expect(passing.surfaceFidelityGate.passed).toBe(true);

    const failing = buildMa1Packet(makeStep({ success: false }), "AI_AGENT", "fullCycle");
    expect(failing.surfaceFidelityGate.passed).toBe(false);
  });

  it("extracts receiptId from receipt object", () => {
    const step = makeStep({
      receipt: { receiptId: "rcpt-test-abc", decision: "ALLOW" },
    });
    const packet = buildMa1Packet(step, "REVIEWER", "fullCycle");
    expect(packet.sourcePacket.receiptId).toBe("rcpt-test-abc");
    expect(packet.completionEvidence?.receiptId).toBe("rcpt-test-abc");
    expect(packet.completionEvidence?.decision).toBe("ALLOW");
  });

  it("completionEvidence is null when no receipt", () => {
    const packet = buildMa1Packet(makeStep({ receipt: undefined }), "AI_AGENT", "fullCycle");
    expect(packet.completionEvidence).toBeNull();
  });

  it("accumulates dissentLedger from options", () => {
    const packet = buildMa1Packet(makeStep(), "REVIEWER", "fullCycle", {
      dissentLedger: ["reviewer rejected: missing test coverage"],
    });
    expect(packet.dissentLedger).toContain("reviewer rejected: missing test coverage");
  });

  it("dissentLedger defaults to empty array", () => {
    const packet = buildMa1Packet(makeStep(), "AI_AGENT", "fullCycle");
    expect(packet.dissentLedger).toEqual([]);
  });

  it("stepIndex matches source step", () => {
    const step = makeStep({ stepIndex: 2 });
    const packet = buildMa1Packet(step, "REVIEWER", "fullCycle");
    expect(packet.stepIndex).toBe(2);
  });

  it("authorityChain contains WCE GC-018 and MA1 standard paths", () => {
    const packet = buildMa1Packet(makeStep(), "AI_AGENT", "fullCycle");
    expect(packet.authorityChain.some((p) => p.includes("GC018_WCE"))).toBe(true);
    expect(packet.authorityChain.some((p) => p.includes("MA1"))).toBe(true);
  });

  it("claimBoundary is present and non-empty", () => {
    const packet = buildMa1Packet(makeStep(), "AI_AGENT", "fullCycle");
    expect(packet.claimBoundary.length).toBeGreaterThan(10);
  });

  it("all 13 MA1 required sections are present", () => {
    const packet = buildMa1Packet(makeStep(), "AI_AGENT", "fullCycle");
    // Verify all 13 sections per connector spec S2 mapping
    expect(packet).toHaveProperty("contractVersion");
    expect(packet).toHaveProperty("ma1ContractVersion");
    expect(packet).toHaveProperty("date");
    expect(packet).toHaveProperty("topic");
    expect(packet).toHaveProperty("surfaceFidelityGate");
    expect(packet).toHaveProperty("authorityChain");
    expect(packet).toHaveProperty("sourcePacket");
    expect(packet).toHaveProperty("roleAssignment");
    expect(packet).toHaveProperty("executionInstructions");
    expect(packet).toHaveProperty("roleOutputSchema");
    expect(packet).toHaveProperty("dissentLedger");
    expect(packet).toHaveProperty("integrationDecision");
    expect(packet).toHaveProperty("completionEvidence");
    expect(packet).toHaveProperty("claimBoundary");
  });
});
