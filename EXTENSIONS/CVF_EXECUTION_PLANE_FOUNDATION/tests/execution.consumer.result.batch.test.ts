import { describe, it, expect } from "vitest";
import {
  ExecutionConsumerResultBatchContract,
  createExecutionConsumerResultBatchContract,
} from "../src/execution.consumer.result.batch.contract";
import { createExecutionConsumerResultContract } from "../src/execution.consumer.result.contract";
import type { MultiAgentCoordinationResult } from "../src/execution.multi.agent.coordination.contract";

// ─── W2-T10 CP2: ExecutionConsumerResultBatchContract ────────────────────────

const FIXED_NOW = () => "2026-03-24T07:00:00.000Z";

const CANDIDATE_ITEMS = [
  {
    itemId: "item-batch-1",
    title: "Batch Coordination Pattern",
    content: "Batch processing of coordination results enables aggregate analysis.",
    source: "docs",
    relevanceScore: 0.88,
    tier: "T1" as const,
    recencyScore: 0.8,
  },
];

function makeCoordination(id: string): MultiAgentCoordinationResult {
  return {
    coordinationId: id,
    coordinatedAt: FIXED_NOW(),
    agents: [{ agentId: "agent-1", assignedRuntimeId: "rt-1", taskIds: ["t1"], assignmentHash: "ah-1" }],
    totalTasksDistributed: 1,
    coordinationStatus: "COORDINATED",
    coordinationHash: `hash-${id}`,
  };
}

function makeResult(id: string) {
  const pipeline = createExecutionConsumerResultContract({ now: FIXED_NOW });
  return pipeline.execute({
    coordinationResult: makeCoordination(id),
    candidateItems: CANDIDATE_ITEMS,
  });
}

describe("W2-T10 CP2: ExecutionConsumerResultBatchContract", () => {
  it("createExecutionConsumerResultBatchContract returns an instance", () => {
    expect(createExecutionConsumerResultBatchContract()).toBeInstanceOf(
      ExecutionConsumerResultBatchContract,
    );
  });

  it("batch returns an ExecutionConsumerResultBatch with all required fields", () => {
    const contract = createExecutionConsumerResultBatchContract({ now: FIXED_NOW });
    const r1 = makeResult("coord-alpha");
    const batch = contract.batch([r1]);
    expect(batch.batchId).toBeTruthy();
    expect(batch.createdAt).toBe(FIXED_NOW());
    expect(batch.totalResults).toBe(1);
    expect(batch.results).toHaveLength(1);
    expect(batch.dominantTokenBudget).toBeGreaterThanOrEqual(0);
    expect(batch.batchHash).toBeTruthy();
  });

  it("totalResults reflects the number of input results", () => {
    const contract = createExecutionConsumerResultBatchContract({ now: FIXED_NOW });
    const results = [makeResult("c1"), makeResult("c2"), makeResult("c3")];
    const batch = contract.batch(results);
    expect(batch.totalResults).toBe(3);
  });

  it("dominantTokenBudget is max estimatedTokens across all consumer packages", () => {
    const contract = createExecutionConsumerResultBatchContract({ now: FIXED_NOW });
    const r1 = makeResult("small");
    const r2 = makeResult("large");
    const batch = contract.batch([r1, r2]);
    const expected = Math.max(
      r1.consumerPackage.typedContextPackage.estimatedTokens,
      r2.consumerPackage.typedContextPackage.estimatedTokens,
    );
    expect(batch.dominantTokenBudget).toBe(expected);
  });

  it("batchHash is deterministic for the same inputs", () => {
    const contract = createExecutionConsumerResultBatchContract({ now: FIXED_NOW });
    const r1 = makeResult("determinism");
    const b1 = contract.batch([r1]);
    const b2 = contract.batch([r1]);
    expect(b1.batchHash).toBe(b2.batchHash);
    expect(b1.batchId).toBe(b2.batchId);
  });

  it("batchHash changes when results change", () => {
    const contract = createExecutionConsumerResultBatchContract({ now: FIXED_NOW });
    const r1 = makeResult("coord-x");
    const r2 = makeResult("coord-y");
    const b1 = contract.batch([r1]);
    const b2 = contract.batch([r2]);
    expect(b1.batchHash).not.toBe(b2.batchHash);
  });

  it("empty batch produces valid result with totalResults 0 and dominantTokenBudget 0", () => {
    const contract = createExecutionConsumerResultBatchContract({ now: FIXED_NOW });
    const batch = contract.batch([]);
    expect(batch.totalResults).toBe(0);
    expect(batch.dominantTokenBudget).toBe(0);
    expect(batch.batchHash).toBeTruthy();
  });

  it("results array in batch contains all input results in order", () => {
    const contract = createExecutionConsumerResultBatchContract({ now: FIXED_NOW });
    const r1 = makeResult("order-1");
    const r2 = makeResult("order-2");
    const batch = contract.batch([r1, r2]);
    expect(batch.results[0].coordinationResult.coordinationId).toBe("order-1");
    expect(batch.results[1].coordinationResult.coordinationId).toBe("order-2");
  });

  it("batchId differs from batchHash", () => {
    const contract = createExecutionConsumerResultBatchContract({ now: FIXED_NOW });
    const r1 = makeResult("id-diff");
    const batch = contract.batch([r1]);
    expect(batch.batchId).not.toBe(batch.batchHash);
  });
});
