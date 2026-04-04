import { describe, it, expect } from "vitest";
import {
  MultiAgentCoordinationConsumerPipelineBatchContract,
  createMultiAgentCoordinationConsumerPipelineBatchContract,
} from "../src/execution.multi.agent.coordination.consumer.pipeline.batch.contract";
import { createMultiAgentCoordinationConsumerPipelineContract } from "../src/execution.multi.agent.coordination.consumer.pipeline.contract";
import type { MultiAgentCoordinationConsumerPipelineResult } from "../src/execution.multi.agent.coordination.consumer.pipeline.contract";
import type { CommandRuntimeResult } from "../src/command.runtime.contract";
import type { CoordinationPolicy } from "../src/execution.multi.agent.coordination.contract";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fixedNow(ts = "2026-03-24T10:00:00.000Z"): () => string {
  return () => ts;
}

function makeRuntimeResult(runtimeId: string): CommandRuntimeResult {
  return {
    runtimeId,
    gateId: `gate-${runtimeId}`,
    executedAt: "2026-03-24T10:00:00.000Z",
    records: [],
    executedCount: 1,
    sandboxedCount: 0,
    skippedCount: 0,
    failedCount: 0,
    runtimeHash: `hash-${runtimeId}`,
    summary: `executed ${runtimeId}`,
  };
}

function makeResult(
  runtimeIds: string[],
  policy: CoordinationPolicy,
  ts = "2026-03-24T10:00:00.000Z",
): MultiAgentCoordinationConsumerPipelineResult {
  const contract = createMultiAgentCoordinationConsumerPipelineContract({ now: () => ts });
  return contract.execute({
    runtimeResults: runtimeIds.map(makeRuntimeResult),
    coordinationPolicy: policy,
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("MultiAgentCoordinationConsumerPipelineBatchContract", () => {
  it("empty batch returns valid batch with zero counts and dominantTokenBudget 0", () => {
    const contract = createMultiAgentCoordinationConsumerPipelineBatchContract({ now: fixedNow() });
    const batch = contract.batch([]);

    expect(batch.totalResults).toBe(0);
    expect(batch.dominantTokenBudget).toBe(0);
    expect(batch.coordinatedCount).toBe(0);
    expect(batch.failedCount).toBe(0);
    expect(batch.partialCount).toBe(0);
    expect(batch.batchHash).toBeTruthy();
    expect(batch.batchId).toBeTruthy();
    expect(batch.results).toEqual([]);
  });

  it("batchId differs from batchHash", () => {
    const contract = createMultiAgentCoordinationConsumerPipelineBatchContract({ now: fixedNow() });
    const batch = contract.batch([]);

    expect(batch.batchId).not.toBe(batch.batchHash);
  });

  it("single COORDINATED result — coordinatedCount 1, others 0", () => {
    const contract = createMultiAgentCoordinationConsumerPipelineBatchContract({ now: fixedNow() });
    const result = makeResult(["r-001", "r-002"], { agentCount: 2, distributionStrategy: "ROUND_ROBIN" });
    const batch = contract.batch([result]);

    expect(batch.totalResults).toBe(1);
    expect(batch.coordinatedCount).toBe(1);
    expect(batch.failedCount).toBe(0);
    expect(batch.partialCount).toBe(0);
  });

  it("FAILED result — failedCount 1, coordinatedCount 0", () => {
    const contract = createMultiAgentCoordinationConsumerPipelineBatchContract({ now: fixedNow() });
    const result = makeResult([], { agentCount: 2, distributionStrategy: "ROUND_ROBIN" });
    const batch = contract.batch([result]);

    expect(batch.failedCount).toBe(1);
    expect(batch.coordinatedCount).toBe(0);
    expect(batch.partialCount).toBe(0);
  });

  it("PARTIAL result — partialCount 1, others 0", () => {
    const contract = createMultiAgentCoordinationConsumerPipelineBatchContract({ now: fixedNow() });
    const result = makeResult(["r-001"], { agentCount: 3, distributionStrategy: "ROUND_ROBIN" });
    const batch = contract.batch([result]);

    expect(batch.partialCount).toBe(1);
    expect(batch.coordinatedCount).toBe(0);
    expect(batch.failedCount).toBe(0);
  });

  it("mixed batch — correct counts", () => {
    const contract = createMultiAgentCoordinationConsumerPipelineBatchContract({ now: fixedNow() });
    const results = [
      makeResult(["r-001", "r-002"], { agentCount: 2, distributionStrategy: "ROUND_ROBIN" }, "2026-03-24T10:00:00.000Z"),
      makeResult([], { agentCount: 2, distributionStrategy: "ROUND_ROBIN" }, "2026-03-24T10:01:00.000Z"),
      makeResult(["r-003"], { agentCount: 3, distributionStrategy: "ROUND_ROBIN" }, "2026-03-24T10:02:00.000Z"),
      makeResult(["r-004", "r-005"], { agentCount: 2, distributionStrategy: "BROADCAST" }, "2026-03-24T10:03:00.000Z"),
    ];
    const batch = contract.batch(results);

    expect(batch.totalResults).toBe(4);
    expect(batch.coordinatedCount).toBe(2);
    expect(batch.failedCount).toBe(1);
    expect(batch.partialCount).toBe(1);
  });

  it("dominantTokenBudget equals max estimatedTokens across results", () => {
    const contract = createMultiAgentCoordinationConsumerPipelineBatchContract({ now: fixedNow() });
    const results = [
      makeResult(["r-001", "r-002"], { agentCount: 2, distributionStrategy: "ROUND_ROBIN" }, "2026-03-24T10:00:00.000Z"),
      makeResult(["r-003", "r-004"], { agentCount: 2, distributionStrategy: "BROADCAST" }, "2026-03-24T10:01:00.000Z"),
    ];
    const batch = contract.batch(results);

    const expectedMax = Math.max(
      ...results.map((r) => r.consumerPackage.typedContextPackage.estimatedTokens),
    );
    expect(batch.dominantTokenBudget).toBe(expectedMax);
  });

  it("results array is preserved in batch", () => {
    const contract = createMultiAgentCoordinationConsumerPipelineBatchContract({ now: fixedNow() });
    const results = [
      makeResult(["r-001", "r-002"], { agentCount: 2, distributionStrategy: "ROUND_ROBIN" }),
      makeResult([], { agentCount: 2, distributionStrategy: "ROUND_ROBIN" }),
    ];
    const batch = contract.batch(results);

    expect(batch.results).toHaveLength(2);
  });

  it("is deterministic — same inputs produce identical batch hashes", () => {
    const ts = "2026-03-24T10:00:00.000Z";
    const r1 = makeResult(["r-001", "r-002"], { agentCount: 2, distributionStrategy: "ROUND_ROBIN" }, ts);
    const r2 = makeResult(["r-001", "r-002"], { agentCount: 2, distributionStrategy: "ROUND_ROBIN" }, ts);

    const contract = createMultiAgentCoordinationConsumerPipelineBatchContract({ now: fixedNow() });
    const b1 = contract.batch([r1]);
    const b2 = contract.batch([r2]);

    expect(b1.batchHash).toBe(b2.batchHash);
    expect(b1.batchId).toBe(b2.batchId);
  });

  it("factory creates a working contract", () => {
    const contract = createMultiAgentCoordinationConsumerPipelineBatchContract({ now: fixedNow() });
    expect(contract).toBeInstanceOf(MultiAgentCoordinationConsumerPipelineBatchContract);
    const batch = contract.batch([]);
    expect(batch.batchHash).toBeTruthy();
  });
});
