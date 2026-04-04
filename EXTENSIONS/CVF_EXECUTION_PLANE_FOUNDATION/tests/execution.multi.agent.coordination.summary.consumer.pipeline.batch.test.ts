import { describe, it, expect } from "vitest";
import {
  MultiAgentCoordinationSummaryConsumerPipelineBatchContract,
  createMultiAgentCoordinationSummaryConsumerPipelineBatchContract,
} from "../src/execution.multi.agent.coordination.summary.consumer.pipeline.batch.contract";
import {
  createMultiAgentCoordinationSummaryConsumerPipelineContract,
} from "../src/execution.multi.agent.coordination.summary.consumer.pipeline.contract";
import type { MultiAgentCoordinationSummaryConsumerPipelineResult } from "../src/execution.multi.agent.coordination.summary.consumer.pipeline.contract";
import type { MultiAgentCoordinationResult } from "../src/execution.multi.agent.coordination.contract";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-03-24T11:00:00.000Z";

function fixedNow(): string {
  return FIXED_NOW;
}

function makeCoordinationResult(
  id: string,
  status: "COORDINATED" | "PARTIAL" | "FAILED",
): MultiAgentCoordinationResult {
  return {
    coordinationId: id,
    coordinatedAt: FIXED_NOW,
    agents: [],
    totalTasksDistributed: status === "COORDINATED" ? 4 : status === "PARTIAL" ? 2 : 0,
    coordinationStatus: status,
    coordinationHash: `hash-${id}`,
  };
}

function makePipelineResult(
  status: "COORDINATED" | "PARTIAL" | "FAILED",
  id: string,
): MultiAgentCoordinationSummaryConsumerPipelineResult {
  const pipeline = createMultiAgentCoordinationSummaryConsumerPipelineContract({ now: fixedNow });
  return pipeline.execute({
    coordinationResults: [makeCoordinationResult(id, status)],
  });
}

function makeBatchContract(): MultiAgentCoordinationSummaryConsumerPipelineBatchContract {
  return createMultiAgentCoordinationSummaryConsumerPipelineBatchContract({ now: fixedNow });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("MultiAgentCoordinationSummaryConsumerPipelineBatchContract", () => {
  it("is instantiable via factory", () => {
    const contract = createMultiAgentCoordinationSummaryConsumerPipelineBatchContract();
    expect(contract).toBeInstanceOf(MultiAgentCoordinationSummaryConsumerPipelineBatchContract);
  });

  it("empty batch returns valid batch with zero counts", () => {
    const batch = makeBatchContract().batch([]);
    expect(batch.totalResults).toBe(0);
    expect(batch.failedResultCount).toBe(0);
    expect(batch.partialResultCount).toBe(0);
    expect(batch.dominantTokenBudget).toBe(0);
  });

  it("empty batch produces valid batchHash and batchId", () => {
    const batch = makeBatchContract().batch([]);
    expect(typeof batch.batchHash).toBe("string");
    expect(batch.batchHash.length).toBeGreaterThan(0);
    expect(typeof batch.batchId).toBe("string");
    expect(batch.batchId.length).toBeGreaterThan(0);
  });

  it("batchId differs from batchHash", () => {
    const batch = makeBatchContract().batch([makePipelineResult("COORDINATED", "c1")]);
    expect(batch.batchId).not.toBe(batch.batchHash);
  });

  it("totalResults matches input length", () => {
    const results = [
      makePipelineResult("COORDINATED", "a"),
      makePipelineResult("FAILED", "b"),
    ];
    const batch = makeBatchContract().batch(results);
    expect(batch.totalResults).toBe(2);
  });

  it("failedResultCount counts FAILED dominantStatus correctly", () => {
    const results = [
      makePipelineResult("FAILED", "f1"),
      makePipelineResult("FAILED", "f2"),
      makePipelineResult("COORDINATED", "c1"),
    ];
    const batch = makeBatchContract().batch(results);
    expect(batch.failedResultCount).toBe(2);
  });

  it("partialResultCount counts PARTIAL dominantStatus correctly", () => {
    const results = [
      makePipelineResult("PARTIAL", "p1"),
      makePipelineResult("COORDINATED", "c1"),
    ];
    const batch = makeBatchContract().batch(results);
    expect(batch.partialResultCount).toBe(1);
  });

  it("all coordinated — failedResultCount and partialResultCount are 0", () => {
    const results = [
      makePipelineResult("COORDINATED", "c1"),
      makePipelineResult("COORDINATED", "c2"),
    ];
    const batch = makeBatchContract().batch(results);
    expect(batch.failedResultCount).toBe(0);
    expect(batch.partialResultCount).toBe(0);
  });

  it("dominantTokenBudget is max estimatedTokens across results", () => {
    const r1 = makePipelineResult("COORDINATED", "c1");
    const r2 = makePipelineResult("FAILED", "f1");
    const batch = makeBatchContract().batch([r1, r2]);
    const expected = Math.max(
      r1.consumerPackage.typedContextPackage.estimatedTokens,
      r2.consumerPackage.typedContextPackage.estimatedTokens,
    );
    expect(batch.dominantTokenBudget).toBe(expected);
  });

  it("is deterministic — same inputs yield same hashes", () => {
    const results = [makePipelineResult("COORDINATED", "c1")];
    const b1 = makeBatchContract().batch(results);
    const b2 = makeBatchContract().batch(results);
    expect(b1.batchHash).toBe(b2.batchHash);
    expect(b1.batchId).toBe(b2.batchId);
  });

  it("different results produce different batchHash", () => {
    const b1 = makeBatchContract().batch([makePipelineResult("COORDINATED", "c1")]);
    const b2 = makeBatchContract().batch([makePipelineResult("FAILED", "f1")]);
    expect(b1.batchHash).not.toBe(b2.batchHash);
  });

  it("results array is preserved in output", () => {
    const results = [makePipelineResult("PARTIAL", "p1")];
    const batch = makeBatchContract().batch(results);
    expect(batch.results).toHaveLength(1);
    expect(batch.results[0].coordinationSummary.dominantStatus).toBe("PARTIAL");
  });

  it("createdAt matches injected now", () => {
    const batch = makeBatchContract().batch([]);
    expect(batch.createdAt).toBe(FIXED_NOW);
  });
});
