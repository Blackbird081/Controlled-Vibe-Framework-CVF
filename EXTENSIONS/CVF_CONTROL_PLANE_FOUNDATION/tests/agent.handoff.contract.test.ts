import { describe, expect, it } from "vitest";
import {
  createAgentHandoff,
  validateAgentHandoff,
  verifyPolicyContinuity,
  type AgentHandoffRecord,
} from "../src/agent.handoff.contract";

const handoffInput = (
  overrides: Partial<Omit<AgentHandoffRecord, "receiptId">> = {},
): Omit<AgentHandoffRecord, "receiptId"> => ({
  handoffId: "handoff-001",
  sourceAgentId: "codex",
  targetAgentId: "claude",
  taskId: "task-001",
  handoffPhase: "BUILD",
  contextSnapshot: {
    closedDecisions: ["decision-001"],
    openItems: ["item-001"],
    artifactRefs: ["docs/roadmaps/example.md"],
    evidenceReceiptIds: ["receipt-001"],
  },
  policyContinuity: {
    inheritedPolicies: ["policy-a"],
    riskCeiling: "R2",
    sandboxTier: 1,
  },
  acceptanceCriteria: {
    requiredFinalEvidence: ["handoff-summary"],
    returnToSourceCondition: "target blocked",
  },
  ...overrides,
});

const handoff = (
  overrides: Partial<Omit<AgentHandoffRecord, "receiptId">> = {},
): AgentHandoffRecord => createAgentHandoff(handoffInput(overrides));

describe("AgentHandoffRecord", () => {
  it("round-trips a valid handoff record with all required fields", () => {
    const subject = handoff();
    expect(JSON.parse(JSON.stringify(subject))).toEqual(subject);
    expect(validateAgentHandoff(subject).valid).toBe(true);
  });

  it("generates a non-empty receiptId", () => {
    expect(handoff().receiptId).toBe("agent-handoff-receipt:handoff-001:task-001");
  });

  it("allows equal target risk ceiling", () => {
    expect(verifyPolicyContinuity(handoff(), "R2")).toBe(true);
  });

  it("rejects lower target risk ceiling as policy downgrade", () => {
    expect(verifyPolicyContinuity(handoff(), "R1")).toBe(false);
  });

  it("allows a higher target risk ceiling", () => {
    expect(verifyPolicyContinuity(handoff(), "R3")).toBe(true);
  });

  it("rejects unknown target risk ceiling values", () => {
    expect(verifyPolicyContinuity(handoff(), "critical")).toBe(false);
  });

  it("accepts empty closedDecisions", () => {
    const subject = handoff({
      contextSnapshot: {
        closedDecisions: [],
        openItems: ["item-001"],
        artifactRefs: [],
        evidenceReceiptIds: [],
      },
    });

    expect(validateAgentHandoff(subject).valid).toBe(true);
  });

  it("accepts a delegationContractRef", () => {
    const subject = handoff({ delegationContractRef: "delegation-001" });
    expect(subject.delegationContractRef).toBe("delegation-001");
  });

  it("flags missing requiredFinalEvidence array", () => {
    const subject = handoff() as Partial<AgentHandoffRecord>;
    subject.acceptanceCriteria = {} as AgentHandoffRecord["acceptanceCriteria"];

    expect(validateAgentHandoff(subject).violations).toContain(
      "acceptanceCriteria.requiredFinalEvidence must be an array",
    );
  });

  it("accepts missing returnToSourceCondition", () => {
    const subject = handoff({
      acceptanceCriteria: { requiredFinalEvidence: ["receipt"] },
    });

    expect(validateAgentHandoff(subject).valid).toBe(true);
  });

  it("accepts sandboxTier 0", () => {
    const subject = handoff({
      policyContinuity: {
        inheritedPolicies: [],
        riskCeiling: "R0",
        sandboxTier: 0,
      },
    });

    expect(validateAgentHandoff(subject).valid).toBe(true);
  });

  it("keeps two handoffs with same taskId distinct by handoffId", () => {
    const first = handoff({ handoffId: "handoff-a", taskId: "same-task" });
    const second = handoff({ handoffId: "handoff-b", taskId: "same-task" });

    expect(first.receiptId).not.toBe(second.receiptId);
  });

  it("flags empty handoffId", () => {
    expect(validateAgentHandoff({ ...handoff(), handoffId: "" }).violations).toContain(
      "handoffId must be non-empty",
    );
  });

  it("flags empty sourceAgentId", () => {
    expect(
      validateAgentHandoff({ ...handoff(), sourceAgentId: " " }).violations,
    ).toContain("sourceAgentId must be non-empty");
  });

  it("flags empty targetAgentId", () => {
    expect(validateAgentHandoff({ ...handoff(), targetAgentId: "" }).valid).toBe(false);
  });

  it("flags missing contextSnapshot", () => {
    const subject = handoff() as Partial<AgentHandoffRecord>;
    delete subject.contextSnapshot;

    expect(validateAgentHandoff(subject).violations).toContain(
      "contextSnapshot is required",
    );
  });

  it("flags missing policyContinuity", () => {
    const subject = handoff() as Partial<AgentHandoffRecord>;
    delete subject.policyContinuity;

    expect(validateAgentHandoff(subject).violations).toContain(
      "policyContinuity is required",
    );
  });

  it("flags invalid risk ceilings", () => {
    const subject = handoff() as Partial<AgentHandoffRecord>;
    subject.policyContinuity = {
      inheritedPolicies: [],
      riskCeiling: "R4" as AgentHandoffRecord["policyContinuity"]["riskCeiling"],
      sandboxTier: 1,
    };

    expect(validateAgentHandoff(subject).violations).toContain(
      "policyContinuity.riskCeiling must be R0, R1, R2, or R3",
    );
  });

  it("flags negative sandbox tiers", () => {
    const subject = handoff({
      policyContinuity: {
        inheritedPolicies: [],
        riskCeiling: "R1",
        sandboxTier: -1,
      },
    });

    expect(validateAgentHandoff(subject).valid).toBe(false);
  });

  it("returns multiple violations together", () => {
    const result = validateAgentHandoff({
      handoffId: "",
      taskId: "",
      policyContinuity: {
        inheritedPolicies: [],
        riskCeiling: "R9" as AgentHandoffRecord["policyContinuity"]["riskCeiling"],
        sandboxTier: -1,
      },
    });

    expect(result.violations.length).toBeGreaterThanOrEqual(4);
  });
});
