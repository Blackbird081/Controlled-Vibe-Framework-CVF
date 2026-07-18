import { describe, expect, it } from "vitest";
import {
  MEMORY_RUNTIME_WORKFLOW_CHAIN_VERSION,
  runMemoryRuntimeWorkflowChain,
} from "../src/memory-runtime-workflow-chain";
import type { MemoryRetrievalCandidate } from "../src/memory-retrieval-policy";

const candidates: MemoryRetrievalCandidate[] = [
  {
    id: "mem-1",
    scope: "project-a",
    summary: "Alibaba provider routing requires R1-safe payload",
    content: "RAW_PROVIDER_NOTE_SHOULD_NOT_APPEAR",
    createdAt: 200,
    auditTrust: 0.94,
    lifecycleState: "semantic",
  },
  {
    id: "mem-2",
    scope: "project-b",
    summary: "Other project note",
    createdAt: 300,
    auditTrust: 0.8,
    lifecycleState: "semantic",
  },
  {
    id: "mem-3",
    scope: "project-a",
    summary: "Secret-bearing memory must be excluded",
    createdAt: 400,
    auditTrust: 1,
    lifecycleState: "semantic",
    containsSecret: true,
  },
];

const baseInput = {
  operationId: "mkg5-op-1",
  sessionId: "session-1",
  projectId: "project-a",
  actorId: "actor-1",
  actorRole: "OPERATOR" as const,
  scope: "project-a",
  riskLevel: "R1" as const,
  query: "Alibaba provider routing",
  tokenBudget: 100,
  candidates,
};

describe("memory runtime workflow chain MKG5 T1", () => {
  it("packages governed summary-only memory context through the full runtime chain", () => {
    const result = runMemoryRuntimeWorkflowChain(baseInput);

    expect(result.contractVersion).toBe(MEMORY_RUNTIME_WORKFLOW_CHAIN_VERSION);
    expect(result).toMatchObject({
      status: "packaged",
      reason: "memory_runtime_workflow_chain_packaged",
      rawMemoryReleased: false,
      canReinject: false,
      gatewayDecision: {
        allowed: true,
        rawMemoryReleased: false,
        canReinject: false,
      },
      retrievalEvent: {
        decision: "allow_context_read",
        allowed: true,
        receipt: {
          rawMemoryReleased: false,
          canReinject: false,
        },
      },
      contextEvent: {
        decision: "allow_context_read",
        allowed: true,
        receipt: {
          rawMemoryReleased: false,
          canReinject: false,
        },
      },
    });
    expect(result.sourceMemoryIds).toEqual(["mem-1"]);
    expect(result.contextBlock?.text).toContain("Alibaba provider routing requires R1-safe payload");
    expect(result.contextBlock?.text).not.toContain("RAW_PROVIDER_NOTE_SHOULD_NOT_APPEAR");
    expect(result.contextBlock?.evidence).toMatchObject({
      includedMemoryCount: 1,
      excludedMemoryCount: 2,
      rawMemoryReleased: false,
      canReinject: false,
    });
  });

  it("denies the chain before retrieval when policy blocks the gateway", () => {
    const result = runMemoryRuntimeWorkflowChain({
      ...baseInput,
      operationId: "mkg5-op-deny",
      policyDecision: "deny",
    });

    expect(result).toMatchObject({
      status: "denied",
      reason: "policy_gate_denied_memory_event",
      rawMemoryReleased: false,
      canReinject: false,
    });
    expect(result.retrievalResult).toBeUndefined();
    expect(result.contextBlock).toBeUndefined();
  });

  it("fails closed when no memory id can back the context event", () => {
    const result = runMemoryRuntimeWorkflowChain({
      ...baseInput,
      operationId: "mkg5-op-empty",
      query: "no matching topic",
    });

    expect(result).toMatchObject({
      status: "denied",
      reason: "memory_ids_required_for_context_event",
      rawMemoryReleased: false,
      canReinject: false,
      contextBlock: {
        sourceMemoryIds: [],
        rawMemoryReleased: false,
      },
    });
  });
});
