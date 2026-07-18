import { describe, expect, it } from "vitest";

import {
  createAgentDefinitionBoundaryContract,
  type AgentDefinitionRecord,
} from "../src/agent.definition.boundary.contract";
import {
  AGENT_GOVERNED_SESSION_WORKING_MEMORY_ADAPTER_VERSION,
  createAgentGovernedSessionContract,
  type AgentGovernedActionRequest,
  type AgentPermissionProfile,
} from "../src";

const FIXED_NOW = "2026-05-21T01:00:00.000Z";
const fixedNow = () => FIXED_NOW;

function makeAgent(): AgentDefinitionRecord {
  return createAgentDefinitionBoundaryContract({ now: fixedNow }).registerDefinition({
    name: "memory-tail-agent",
    role: "executor",
    declaredCapabilities: ["write:handoff"],
    declaredDomains: ["documentation"],
  });
}

function makeProfile(): AgentPermissionProfile {
  return {
    profileId: "handoff_writer",
    description: "Handoff-only write access",
    fileAccess: {
      read: ["**/*"],
      write: ["docs/**"],
      deny: [".env", "secrets/**"],
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
      maxFilesChanged: 3,
      maxCommands: 0,
      requiresApprovalAboveRisk: "medium",
    },
    audit: {
      commandLogRequired: false,
      fileDiffRequired: true,
      receiptRequired: true,
    },
  };
}

function makeRequest(): AgentGovernedActionRequest {
  return {
    sessionId: "session-memory-tail",
    taskId: "task-memory-tail",
    phase: "handoff",
    requestedCapability: "write:handoff",
    requestedAction: "prepare governed memory-tail handoff",
    actionType: "documentation",
    riskLevel: "low",
    agent: makeAgent(),
    permissionProfile: makeProfile(),
    filesRead: ["docs/source.md"],
    filesChanged: ["docs/handoff.md"],
    toolsRequested: [],
    commandCount: 0,
  };
}

describe("Phase 2.B memory tail adapters", () => {
  it("builds M-01 working-memory adapter snapshot from existing agent receipt", () => {
    const contract = createAgentGovernedSessionContract({ now: fixedNow });
    const request = makeRequest();
    const decision = contract.evaluateAction(request);
    const adapter = contract.createWorkingMemoryAdapterSnapshot(request, {
      decision,
      outputType: "handoff",
      outputSummary: "Prepared bounded memory-tail handoff.",
      validationRequired: false,
      validationResult: "skipped",
    });
    const receipt = contract.createReceipt(request, {
      decision,
      outputType: "handoff",
      outputSummary: "Prepared bounded memory-tail handoff.",
      validationRequired: false,
      validationResult: "skipped",
    });

    expect(adapter.version).toBe(AGENT_GOVERNED_SESSION_WORKING_MEMORY_ADAPTER_VERSION);
    expect(adapter.source).toBe("control-plane:agent-governed-session-working-memory");
    expect(adapter.memoryKind).toBe("working");
    expect(adapter.sessionId).toBe(receipt.sessionId);
    expect(adapter.taskId).toBe(receipt.taskId);
    expect(adapter.receiptId).toBe(receipt.receiptId);
    expect(adapter.fileChangedCount).toBe(1);
    expect(adapter.persistentStoreCreated).toBe(false);
    expect(adapter.reinjectionRuntimeEnabled).toBe(false);
  });
});
