import { describe, it, expect } from "vitest";
import {
  MCPInvocationConsumerPipelineBatchContract,
  createMCPInvocationConsumerPipelineBatchContract,
} from "../src/mcp.invocation.consumer.pipeline.batch.contract";
import { createMCPInvocationConsumerPipelineContract } from "../src/mcp.invocation.consumer.pipeline.contract";
import type { MCPInvocationConsumerPipelineResult } from "../src/mcp.invocation.consumer.pipeline.contract";
import type { MCPInvocationStatus } from "../src/mcp.invocation.contract";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fixedNow(ts = "2026-03-24T10:00:00.000Z"): () => string {
  return () => ts;
}

function makeResult(
  status: MCPInvocationStatus = "SUCCESS",
  toolName = "search_tool",
  ts = "2026-03-24T10:00:00.000Z",
): MCPInvocationConsumerPipelineResult {
  const contract = createMCPInvocationConsumerPipelineContract({ now: () => ts });
  return contract.execute({
    invocationRequest: {
      toolName,
      toolArgs: { q: toolName },
      contextId: `ctx-${toolName}`,
      requestId: `req-${toolName}-${status}`,
    },
    invocationStatus: status,
    responsePayload: { ok: status === "SUCCESS" },
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("MCPInvocationConsumerPipelineBatchContract", () => {
  it("empty batch returns valid batch with zero counts and dominantTokenBudget 0", () => {
    const contract = createMCPInvocationConsumerPipelineBatchContract({ now: fixedNow() });
    const batch = contract.batch([]);

    expect(batch.totalResults).toBe(0);
    expect(batch.dominantTokenBudget).toBe(0);
    expect(batch.successCount).toBe(0);
    expect(batch.failureCount).toBe(0);
    expect(batch.batchHash).toBeTruthy();
    expect(batch.batchId).toBeTruthy();
    expect(batch.results).toEqual([]);
  });

  it("batchId differs from batchHash", () => {
    const contract = createMCPInvocationConsumerPipelineBatchContract({ now: fixedNow() });
    const batch = contract.batch([]);

    expect(batch.batchId).not.toBe(batch.batchHash);
  });

  it("single SUCCESS result — successCount 1, failureCount 0", () => {
    const contract = createMCPInvocationConsumerPipelineBatchContract({ now: fixedNow() });
    const batch = contract.batch([makeResult("SUCCESS")]);

    expect(batch.totalResults).toBe(1);
    expect(batch.successCount).toBe(1);
    expect(batch.failureCount).toBe(0);
  });

  it("single FAILURE result — successCount 0, failureCount 1", () => {
    const contract = createMCPInvocationConsumerPipelineBatchContract({ now: fixedNow() });
    const batch = contract.batch([makeResult("FAILURE")]);

    expect(batch.totalResults).toBe(1);
    expect(batch.successCount).toBe(0);
    expect(batch.failureCount).toBe(1);
  });

  it("TIMEOUT is counted as failure", () => {
    const contract = createMCPInvocationConsumerPipelineBatchContract({ now: fixedNow() });
    const batch = contract.batch([makeResult("TIMEOUT")]);

    expect(batch.failureCount).toBe(1);
    expect(batch.successCount).toBe(0);
  });

  it("REJECTED is counted as failure", () => {
    const contract = createMCPInvocationConsumerPipelineBatchContract({ now: fixedNow() });
    const batch = contract.batch([makeResult("REJECTED")]);

    expect(batch.failureCount).toBe(1);
    expect(batch.successCount).toBe(0);
  });

  it("mixed batch — correct success/failure counts", () => {
    const contract = createMCPInvocationConsumerPipelineBatchContract({ now: fixedNow() });
    const results = [
      makeResult("SUCCESS", "tool_a", "2026-03-24T10:00:00.000Z"),
      makeResult("FAILURE", "tool_b", "2026-03-24T10:01:00.000Z"),
      makeResult("TIMEOUT", "tool_c", "2026-03-24T10:02:00.000Z"),
      makeResult("SUCCESS", "tool_d", "2026-03-24T10:03:00.000Z"),
      makeResult("REJECTED", "tool_e", "2026-03-24T10:04:00.000Z"),
    ];
    const batch = contract.batch(results);

    expect(batch.totalResults).toBe(5);
    expect(batch.successCount).toBe(2);
    expect(batch.failureCount).toBe(3);
  });

  it("dominantTokenBudget equals max estimatedTokens across results", () => {
    const contract = createMCPInvocationConsumerPipelineBatchContract({ now: fixedNow() });
    const results = [
      makeResult("SUCCESS", "tool_a", "2026-03-24T10:00:00.000Z"),
      makeResult("SUCCESS", "tool_b", "2026-03-24T10:01:00.000Z"),
    ];
    const batch = contract.batch(results);

    const expectedMax = Math.max(
      ...results.map((r) => r.consumerPackage.typedContextPackage.estimatedTokens),
    );
    expect(batch.dominantTokenBudget).toBe(expectedMax);
  });

  it("results array is preserved in batch", () => {
    const contract = createMCPInvocationConsumerPipelineBatchContract({ now: fixedNow() });
    const results = [makeResult("SUCCESS"), makeResult("FAILURE")];
    const batch = contract.batch(results);

    expect(batch.results).toHaveLength(2);
    expect(batch.results[0].invocationResult.invocationStatus).toBe("SUCCESS");
    expect(batch.results[1].invocationResult.invocationStatus).toBe("FAILURE");
  });

  it("is deterministic — same inputs produce identical batch hashes", () => {
    const r1 = makeResult("SUCCESS", "tool_a", "2026-03-24T10:00:00.000Z");
    const r2 = makeResult("SUCCESS", "tool_a", "2026-03-24T10:00:00.000Z");

    const contract = createMCPInvocationConsumerPipelineBatchContract({ now: fixedNow() });
    const b1 = contract.batch([r1]);
    const b2 = contract.batch([r2]);

    expect(b1.batchHash).toBe(b2.batchHash);
    expect(b1.batchId).toBe(b2.batchId);
  });

  it("factory creates a working contract", () => {
    const contract = createMCPInvocationConsumerPipelineBatchContract({ now: fixedNow() });
    expect(contract).toBeInstanceOf(MCPInvocationConsumerPipelineBatchContract);
    const batch = contract.batch([]);
    expect(batch.batchHash).toBeTruthy();
  });
});
