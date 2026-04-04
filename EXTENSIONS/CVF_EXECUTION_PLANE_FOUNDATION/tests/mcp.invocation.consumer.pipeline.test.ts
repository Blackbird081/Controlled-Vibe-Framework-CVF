import { describe, it, expect } from "vitest";
import {
  MCPInvocationConsumerPipelineContract,
  createMCPInvocationConsumerPipelineContract,
} from "../src/mcp.invocation.consumer.pipeline.contract";
import type { MCPInvocationConsumerPipelineRequest } from "../src/mcp.invocation.consumer.pipeline.contract";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(
  overrides: Partial<MCPInvocationConsumerPipelineRequest> = {},
): MCPInvocationConsumerPipelineRequest {
  return {
    invocationRequest: {
      toolName: "search_tool",
      toolArgs: { query: "test" },
      contextId: "ctx-001",
      requestId: "req-001",
    },
    invocationStatus: "SUCCESS",
    responsePayload: { results: ["a", "b"] },
    ...overrides,
  };
}

function fixedNow(ts = "2026-03-24T10:00:00.000Z"): () => string {
  return () => ts;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("MCPInvocationConsumerPipelineContract", () => {
  it("returns a result with all required fields for SUCCESS status", () => {
    const contract = createMCPInvocationConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest());

    expect(result.resultId).toBeTruthy();
    expect(result.createdAt).toBe("2026-03-24T10:00:00.000Z");
    expect(result.invocationResult).toBeDefined();
    expect(result.invocationResult.toolName).toBe("search_tool");
    expect(result.invocationResult.invocationStatus).toBe("SUCCESS");
    expect(result.consumerPackage).toBeDefined();
    expect(result.consumerPackage.contextId).toBe(result.invocationResult.resultId);
    expect(result.pipelineHash).toBeTruthy();
    expect(result.warnings).toEqual([]);
  });

  it("derives query from toolName:invocationStatus, max 120 chars", () => {
    const contract = createMCPInvocationConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest());

    expect(result.consumerPackage.query).toBe("search_tool:SUCCESS");
  });

  it("query is truncated to 120 chars for long toolName", () => {
    const longName = "a".repeat(130);
    const contract = createMCPInvocationConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest({
      invocationRequest: {
        toolName: longName,
        toolArgs: {},
        contextId: "ctx-x",
        requestId: "req-x",
      },
    }));

    expect(result.consumerPackage.query.length).toBeLessThanOrEqual(120);
  });

  it("contextId on consumerPackage equals the invocationResult.resultId", () => {
    const contract = createMCPInvocationConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest());

    expect(result.consumerPackage.contextId).toBe(result.invocationResult.resultId);
  });

  it("FAILURE status produces expected warning", () => {
    const contract = createMCPInvocationConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest({ invocationStatus: "FAILURE" }));

    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("[mcp] invocation failed");
    expect(result.invocationResult.invocationStatus).toBe("FAILURE");
  });

  it("TIMEOUT status produces expected warning", () => {
    const contract = createMCPInvocationConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest({ invocationStatus: "TIMEOUT" }));

    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("[mcp] invocation timed out");
  });

  it("REJECTED status produces expected warning", () => {
    const contract = createMCPInvocationConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest({ invocationStatus: "REJECTED" }));

    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("[mcp] invocation rejected");
  });

  it("SUCCESS status produces no warnings", () => {
    const contract = createMCPInvocationConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest({ invocationStatus: "SUCCESS" }));

    expect(result.warnings).toEqual([]);
  });

  it("consumerId is preserved when provided", () => {
    const contract = createMCPInvocationConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest({ consumerId: "consumer-abc" }));

    expect(result.consumerId).toBe("consumer-abc");
  });

  it("consumerId is undefined when not provided", () => {
    const contract = createMCPInvocationConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest());

    expect(result.consumerId).toBeUndefined();
  });

  it("resultId differs from pipelineHash", () => {
    const contract = createMCPInvocationConsumerPipelineContract({ now: fixedNow() });
    const result = contract.execute(makeRequest());

    expect(result.resultId).not.toBe(result.pipelineHash);
  });

  it("is deterministic — same input produces identical hashes", () => {
    const contract = createMCPInvocationConsumerPipelineContract({ now: fixedNow() });
    const r1 = contract.execute(makeRequest());
    const r2 = contract.execute(makeRequest());

    expect(r1.pipelineHash).toBe(r2.pipelineHash);
    expect(r1.resultId).toBe(r2.resultId);
    expect(r1.invocationResult.invocationHash).toBe(r2.invocationResult.invocationHash);
  });

  it("different toolName produces different hashes", () => {
    const contract = createMCPInvocationConsumerPipelineContract({ now: fixedNow() });
    const r1 = contract.execute(makeRequest());
    const r2 = contract.execute(makeRequest({
      invocationRequest: { toolName: "other_tool", toolArgs: { query: "test" }, contextId: "ctx-001", requestId: "req-001" },
    }));

    expect(r1.pipelineHash).not.toBe(r2.pipelineHash);
  });

  it("factory function creates a working contract", () => {
    const contract = createMCPInvocationConsumerPipelineContract({ now: fixedNow() });
    expect(contract).toBeInstanceOf(MCPInvocationConsumerPipelineContract);
    const result = contract.execute(makeRequest());
    expect(result.pipelineHash).toBeTruthy();
  });

  it("direct instantiation works identically to factory", () => {
    const now = fixedNow();
    const direct = new MCPInvocationConsumerPipelineContract({ now });
    const via = createMCPInvocationConsumerPipelineContract({ now });

    const r1 = direct.execute(makeRequest());
    const r2 = via.execute(makeRequest());

    expect(r1.pipelineHash).toBe(r2.pipelineHash);
  });
});
