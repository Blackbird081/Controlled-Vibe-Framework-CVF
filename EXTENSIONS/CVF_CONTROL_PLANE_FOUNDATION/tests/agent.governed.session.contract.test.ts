import { describe, expect, it } from "vitest";

import {
  createAgentDefinitionBoundaryContract,
  type AgentDefinitionRecord,
} from "../src/agent.definition.boundary.contract";
import {
  AgentGovernedSessionContract,
  createAgentGovernedSessionContract,
  type AgentGovernedActionRequest,
  type AgentHandoffInput,
  type AgentPermissionProfile,
} from "../src/agent.governed.session.contract";

const FIXED_NOW = "2026-05-16T11:00:00.000Z";
const fixedNow = () => FIXED_NOW;

function makeAgent(capabilities = ["write:docs", "run:tests"]): AgentDefinitionRecord {
  return createAgentDefinitionBoundaryContract({ now: fixedNow }).registerDefinition({
    name: "docs-agent",
    role: "executor",
    declaredCapabilities: capabilities,
    declaredDomains: ["documentation"],
  });
}

function makeProfile(overrides: Partial<AgentPermissionProfile> = {}): AgentPermissionProfile {
  return {
    profileId: "write_docs",
    description: "Documentation-only write access",
    fileAccess: {
      read: ["**/*"],
      write: ["docs/**", "*.md"],
      deny: [".env", "secrets/**", "src/**"],
    },
    toolAccess: {
      shell: false,
      network: false,
      testRunner: false,
      packageManager: false,
      database: false,
      deployment: false,
      secrets: false,
    },
    executionLimits: {
      maxFilesChanged: 10,
      maxCommands: 0,
      requiresApprovalAboveRisk: "medium",
    },
    audit: {
      commandLogRequired: false,
      fileDiffRequired: true,
      receiptRequired: true,
    },
    ...overrides,
  };
}

function makeRequest(overrides: Partial<AgentGovernedActionRequest> = {}): AgentGovernedActionRequest {
  return {
    sessionId: "session-1",
    taskId: "task-1",
    phase: "documentation",
    requestedCapability: "write:docs",
    requestedAction: "rewrite docs handoff",
    actionType: "documentation",
    riskLevel: "low",
    agent: makeAgent(),
    permissionProfile: makeProfile(),
    filesRead: ["README.md"],
    filesChanged: ["docs/guide.md"],
    toolsRequested: [],
    commandCount: 0,
    contextPackageId: "ctx-1",
    ...overrides,
  };
}

function makeHandoff(overrides: Partial<AgentHandoffInput> = {}): AgentHandoffInput {
  return {
    handoffId: "handoff-1",
    sourceAgentId: "agent-source",
    targetAgentId: "agent-target",
    taskId: "task-1",
    phase: "review",
    taskSummary: "Docs agent rewrote the guide.",
    currentState: "Ready for review.",
    actionsCompleted: ["Updated docs guide"],
    filesTouched: [{ path: "docs/guide.md", changeType: "modified", summary: "clarified setup" }],
    risksFound: [],
    nextRequiredAction: "review changes",
    auditReference: { receiptId: "receipt-1", traceId: "trace-1" },
    ...overrides,
  };
}

describe("AgentGovernedSessionContract.evaluateAction", () => {
  it("allows registered agents within permission, capability, and risk scope", () => {
    const contract = createAgentGovernedSessionContract({ now: fixedNow });

    const decision = contract.evaluateAction(makeRequest());

    expect(decision.policyDecision).toBe("allow");
    expect(decision.finalStatus).toBe("completed");
    expect(decision.reasons).toHaveLength(0);
    expect(decision.decisionId).toBeTruthy();
    expect(decision.decidedAt).toBe(FIXED_NOW);
  });

  it("denies unregistered agents", () => {
    const contract = createAgentGovernedSessionContract({ now: fixedNow });

    const decision = contract.evaluateAction(makeRequest({ agent: undefined }));

    expect(decision.policyDecision).toBe("deny");
    expect(decision.finalStatus).toBe("denied");
    expect(decision.reasons).toContain("agent is not registered");
  });

  it("denies capability self-extension beyond registry scope", () => {
    const contract = createAgentGovernedSessionContract({ now: fixedNow });

    const decision = contract.evaluateAction(makeRequest({ requestedCapability: "deploy:prod" }));

    expect(decision.policyDecision).toBe("deny");
    expect(decision.reasons).toContain("requested capability is outside agent registry scope");
  });

  it("denies denied paths and tools outside permission profile", () => {
    const contract = createAgentGovernedSessionContract({ now: fixedNow });

    const decision = contract.evaluateAction(
      makeRequest({
        filesRead: [".env"],
        filesChanged: ["src/auth.ts"],
        toolsRequested: ["shell", "network"],
      }),
    );

    expect(decision.policyDecision).toBe("deny");
    expect(decision.deniedPaths).toEqual(expect.arrayContaining([".env", "src/auth.ts"]));
    expect(decision.deniedTools).toEqual(expect.arrayContaining(["shell", "network"]));
  });

  it("requires approval above profile threshold and allows with constraints when approved", () => {
    const contract = createAgentGovernedSessionContract({ now: fixedNow });

    const pending = contract.evaluateAction(makeRequest({ riskLevel: "high" }));
    const approved = contract.evaluateAction(
      makeRequest({ riskLevel: "high", approvalReference: "approval-1" }),
    );

    expect(pending.policyDecision).toBe("require_approval");
    expect(pending.finalStatus).toBe("approval_required");
    expect(approved.policyDecision).toBe("allow_with_constraints");
    expect(approved.constraints).toContain("approval required before execution may complete");
    expect(approved.constraints).toContain("validation evidence required");
  });
});

describe("AgentGovernedSessionContract.validateHandoff", () => {
  it("accepts structured handoff with audit reference", () => {
    const contract = createAgentGovernedSessionContract({ now: fixedNow });

    const validation = contract.validateHandoff(makeHandoff());

    expect(validation.valid).toBe(true);
    expect(validation.reasons).toHaveLength(0);
    expect(validation.validatedAt).toBe(FIXED_NOW);
  });

  it("rejects vague handoff without required state", () => {
    const contract = createAgentGovernedSessionContract({ now: fixedNow });

    const validation = contract.validateHandoff(
      makeHandoff({
        taskSummary: "",
        nextRequiredAction: "",
        auditReference: { receiptId: "" },
      }),
    );

    expect(validation.valid).toBe(false);
    expect(validation.reasons).toEqual(expect.arrayContaining([
      "task summary is missing",
      "next required action is missing",
      "audit receipt reference is missing",
    ]));
  });

  it("stops high-risk handoff unless policy state requires approval", () => {
    const contract = createAgentGovernedSessionContract({ now: fixedNow });

    const invalid = contract.validateHandoff(
      makeHandoff({
        risksFound: [{
          riskId: "risk-1",
          severity: "high",
          description: "Security-sensitive file touched",
          recommendedAction: "approval",
        }],
      }),
    );
    const valid = contract.validateHandoff(
      makeHandoff({
        risksFound: [{
          riskId: "risk-1",
          severity: "high",
          description: "Security-sensitive file touched",
          recommendedAction: "approval",
        }],
        policyState: { policyDecision: "require_approval", approvalRequired: true },
      }),
    );

    expect(invalid.valid).toBe(false);
    expect(invalid.requiresApprovalStop).toBe(true);
    expect(valid.valid).toBe(true);
  });
});

describe("AgentGovernedSessionContract.createReceipt", () => {
  it("creates deterministic audit receipt for governed agent execution", () => {
    const contract = createAgentGovernedSessionContract({ now: fixedNow });
    const request = makeRequest();
    const decision = contract.evaluateAction(request);
    const handoff = contract.validateHandoff(makeHandoff());

    const receipt = contract.createReceipt(request, {
      decision,
      outputType: "documentation",
      outputSummary: "Updated docs guide and prepared handoff.",
      validationRequired: false,
      validationResult: "skipped",
      providerName: "local-agent",
      handoff,
    });

    expect(receipt.receiptId).toBeTruthy();
    expect(receipt.traceId).toBeTruthy();
    expect(receipt.agentId).toBe(request.agent?.agentId);
    expect(receipt.permissionProfile).toBe("write_docs");
    expect(receipt.policyDecision).toBe("allow");
    expect(receipt.filesChanged).toEqual(["docs/guide.md"]);
    expect(receipt.handoffId).toBe("handoff-1");

    const receiptAgain = contract.createReceipt(request, {
      decision,
      outputType: "documentation",
      outputSummary: "Updated docs guide and prepared handoff.",
      validationRequired: false,
      validationResult: "skipped",
      providerName: "local-agent",
      handoff,
    });
    expect(receiptAgain.receiptId).toBe(receipt.receiptId);
  });

  it("factory returns a working contract", () => {
    const contract = createAgentGovernedSessionContract({ now: fixedNow });
    expect(contract).toBeInstanceOf(AgentGovernedSessionContract);
  });
});
