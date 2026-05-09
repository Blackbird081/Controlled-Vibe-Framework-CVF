import { describe, it, expect } from "vitest";
import {
  MultiAgentCoordinationConsumerPipelineContract,
  createMultiAgentCoordinationConsumerPipelineContract,
} from "../src/execution.multi.agent.coordination.consumer.pipeline.contract";
import type { MultiAgentCoordinationConsumerPipelineRequest } from "../src/execution.multi.agent.coordination.consumer.pipeline.contract";
import type { CommandRuntimeResult } from "../src/command.runtime.contract";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fixedNow(ts = "2026-03-24T10:00:00.000Z"): () => string {
  return () => ts;
}

function makeRuntimeResult(
  runtimeId = "runtime-001",
  ts = "2026-03-24T10:00:00.000Z",
): CommandRuntimeResult {
  return {
    runtimeId,
    gateId: `gate-${runtimeId}`,
    executedAt: ts,
    records: [],
    executedCount: 1,
    sandboxedCount: 0,
    skippedCount: 0,
    failedCount: 0,
    runtimeHash: `hash-${runtimeId}`,
    summary: `runtime ${runtimeId} executed`,
  };
}

function makeRequest(
  overrides: Partial<MultiAgentCoordinationConsumerPipelineRequest> = {},
): MultiAgentCoordinationConsumerPipelineRequest {
  return {
    runtimeResults: [makeRuntimeResult("runtime-001"), makeRuntimeResult("runtime-002")],
    coordinationPolicy: {
      agentCount: 2,
      distributionStrategy: "ROUND_ROBIN",
    },
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("MultiAgentCoordinationConsumerPipelineContract", () => {
  it("returns a result with all required fields for COORDINATED status", () => {
    const contract = createMultiAgentCoordinationConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest());

    expect(result.resultId).toBeTruthy();
    expect(result.createdAt).toBe("2026-03-24T10:00:00.000Z");
    expect(result.coordinationResult).toBeDefined();
    expect(result.coordinationResult.coordinationStatus).toBe("COORDINATED");
    expect(result.consumerPackage).toBeDefined();
    expect(result.pipelineHash).toBeTruthy();
    expect(result.warnings).toEqual([]);
  });

  it("contextId on consumerPackage equals the coordinationResult.coordinationId", () => {
    const contract = createMultiAgentCoordinationConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest());

    expect(result.consumerPackage.contextId).toBe(result.coordinationResult.coordinationId);
  });

  it("query contains coordinationStatus, agent count, and tasks", () => {
    const contract = createMultiAgentCoordinationConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest());

    expect(result.consumerPackage.query).toContain("COORDINATED");
    expect(result.consumerPackage.query).toContain("agents:");
    expect(result.consumerPackage.query).toContain("tasks:");
  });

  it("query is truncated to 120 chars maximum", () => {
    const contract = createMultiAgentCoordinationConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest({ coordinationPolicy: { agentCount: 99, distributionStrategy: "BROADCAST" } }));

    expect(result.consumerPackage.query.length).toBeLessThanOrEqual(120);
  });

  it("FAILED coordination status produces expected warning", () => {
    const contract = createMultiAgentCoordinationConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest({
      runtimeResults: [],
      coordinationPolicy: { agentCount: 2, distributionStrategy: "ROUND_ROBIN" },
    }));

    expect(result.coordinationResult.coordinationStatus).toBe("FAILED");
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("[coordination] coordination failed");
  });

  it("PARTIAL coordination status produces expected warning", () => {
    const contract = createMultiAgentCoordinationConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest({
      runtimeResults: [makeRuntimeResult("runtime-001")],
      coordinationPolicy: { agentCount: 3, distributionStrategy: "ROUND_ROBIN" },
    }));

    expect(result.coordinationResult.coordinationStatus).toBe("PARTIAL");
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("[coordination] partial agent assignment");
  });

  it("COORDINATED status produces no warnings", () => {
    const contract = createMultiAgentCoordinationConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest());

    expect(result.warnings).toEqual([]);
  });

  it("consumerId is preserved when provided", () => {
    const contract = createMultiAgentCoordinationConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest({ consumerId: "consumer-xyz" }));

    expect(result.consumerId).toBe("consumer-xyz");
  });

  it("consumerId is undefined when not provided", () => {
    const contract = createMultiAgentCoordinationConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest());

    expect(result.consumerId).toBeUndefined();
  });

  it("resultId differs from pipelineHash", () => {
    const contract = createMultiAgentCoordinationConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest());

    expect(result.resultId).not.toBe(result.pipelineHash);
  });

  it("is deterministic — same input produces identical hashes", () => {
    const contract = createMultiAgentCoordinationConsumerPipelineContract({ now: fixedNow() });
    const r1 = contract.execute(makeRequest());
    const r2 = contract.execute(makeRequest());

    expect(r1.pipelineHash).toBe(r2.pipelineHash);
    expect(r1.resultId).toBe(r2.resultId);
    expect(r1.coordinationResult.coordinationHash).toBe(r2.coordinationResult.coordinationHash);
  });

  it("different runtimeResults produce different hashes", () => {
    const contract = createMultiAgentCoordinationConsumerPipelineContract({ now: fixedNow() });
    const r1 = contract.execute(makeRequest());
    const r2 = contract.execute(makeRequest({
      runtimeResults: [makeRuntimeResult("runtime-999")],
    }));

    expect(r1.pipelineHash).not.toBe(r2.pipelineHash);
  });

  it("BROADCAST distribution strategy works correctly", () => {
    const contract = createMultiAgentCoordinationConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest({
      coordinationPolicy: { agentCount: 2, distributionStrategy: "BROADCAST" },
    }));

    expect(result.coordinationResult.coordinationStatus).toBe("COORDINATED");
    expect(result.consumerPackage.query).toContain("COORDINATED");
  });

  it("PRIORITY_FIRST distribution strategy concentrates tasks on agent 0", () => {
    const contract = createMultiAgentCoordinationConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest({
      coordinationPolicy: { agentCount: 1, distributionStrategy: "PRIORITY_FIRST" },
    }));

    expect(result.coordinationResult.coordinationStatus).toBe("COORDINATED");
    expect(result.coordinationResult.agents[0].taskIds.length).toBeGreaterThan(0);
  });

  it("factory function creates a working contract", () => {
    const contract = createMultiAgentCoordinationConsumerPipelineContract({ now: fixedNow() });
    expect(contract).toBeInstanceOf(MultiAgentCoordinationConsumerPipelineContract);
    const result = contract.execute(makeRequest());
    expect(result.pipelineHash).toBeTruthy();
  });

  it("direct instantiation works identically to factory", () => {
    const now = fixedNow();
    const direct = new MultiAgentCoordinationConsumerPipelineContract({ now });
    const via = createMultiAgentCoordinationConsumerPipelineContract({ now });

    const r1 = direct.execute(makeRequest());
    const r2 = via.execute(makeRequest());

    expect(r1.pipelineHash).toBe(r2.pipelineHash);
  });
});
