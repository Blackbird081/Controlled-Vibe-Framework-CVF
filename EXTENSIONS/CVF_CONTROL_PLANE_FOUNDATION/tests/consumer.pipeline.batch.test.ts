import { describe, it, expect } from "vitest";
import {
  ControlPlaneConsumerPipelineBatchContract,
  createControlPlaneConsumerPipelineBatchContract,
} from "../src/consumer.pipeline.batch.contract";
import { createControlPlaneConsumerPipelineContract } from "../src/consumer.pipeline.contract";
import type { ControlPlaneConsumerPackage } from "../src";

// ─── W1-T13 CP2: ControlPlaneConsumerPipelineBatchContract ───────────────────

const FIXED_NOW = () => "2026-03-23T12:00:00.000Z";

function makePackage(contextId: string, query: string): ControlPlaneConsumerPackage {
  const pipeline = createControlPlaneConsumerPipelineContract({ now: FIXED_NOW });
  return pipeline.execute({
    rankingRequest: {
      query,
      contextId,
      candidateItems: [
        {
          itemId: `item-${contextId}`,
          title: "Test Item",
          content: `Content for ${query}`,
          source: "test",
          relevanceScore: 0.8,
          tier: "T1",
          recencyScore: 0.7,
        },
      ],
    },
  });
}

describe("W1-T13 CP2: ControlPlaneConsumerPipelineBatchContract", () => {
  it("createControlPlaneConsumerPipelineBatchContract returns an instance", () => {
    expect(createControlPlaneConsumerPipelineBatchContract()).toBeInstanceOf(
      ControlPlaneConsumerPipelineBatchContract,
    );
  });

  it("batch returns a ControlPlaneConsumerPipelineBatch with all required fields", () => {
    const contract = createControlPlaneConsumerPipelineBatchContract({ now: FIXED_NOW });
    const pkg1 = makePackage("ctx-a", "query alpha");
    const result = contract.batch([pkg1]);
    expect(result.batchId).toBeTruthy();
    expect(result.createdAt).toBe(FIXED_NOW());
    expect(result.totalPackages).toBe(1);
    expect(result.packages).toHaveLength(1);
    expect(result.dominantTokenBudget).toBeGreaterThanOrEqual(0);
    expect(result.batchHash).toBeTruthy();
  });

  it("totalPackages reflects the number of input packages", () => {
    const contract = createControlPlaneConsumerPipelineBatchContract({ now: FIXED_NOW });
    const p1 = makePackage("ctx-1", "query one");
    const p2 = makePackage("ctx-2", "query two");
    const p3 = makePackage("ctx-3", "query three");
    const result = contract.batch([p1, p2, p3]);
    expect(result.totalPackages).toBe(3);
  });

  it("dominantTokenBudget is the max estimatedTokens across packages", () => {
    const contract = createControlPlaneConsumerPipelineBatchContract({ now: FIXED_NOW });
    const p1 = makePackage("ctx-a", "query alpha");
    const p2 = makePackage("ctx-b", "query beta delta gamma epsilon");
    const result = contract.batch([p1, p2]);
    const expected = Math.max(
      p1.typedContextPackage.estimatedTokens,
      p2.typedContextPackage.estimatedTokens,
    );
    expect(result.dominantTokenBudget).toBe(expected);
  });

  it("batchHash is deterministic for the same inputs", () => {
    const contract = createControlPlaneConsumerPipelineBatchContract({ now: FIXED_NOW });
    const p1 = makePackage("ctx-a", "query alpha");
    const r1 = contract.batch([p1]);
    const r2 = contract.batch([p1]);
    expect(r1.batchHash).toBe(r2.batchHash);
    expect(r1.batchId).toBe(r2.batchId);
  });

  it("batchHash changes when packages change", () => {
    const contract = createControlPlaneConsumerPipelineBatchContract({ now: FIXED_NOW });
    const p1 = makePackage("ctx-a", "query alpha");
    const p2 = makePackage("ctx-b", "query beta");
    const r1 = contract.batch([p1]);
    const r2 = contract.batch([p2]);
    expect(r1.batchHash).not.toBe(r2.batchHash);
  });

  it("empty batch produces valid result with totalPackages 0 and dominantTokenBudget 0", () => {
    const contract = createControlPlaneConsumerPipelineBatchContract({ now: FIXED_NOW });
    const result = contract.batch([]);
    expect(result.totalPackages).toBe(0);
    expect(result.dominantTokenBudget).toBe(0);
    expect(result.batchHash).toBeTruthy();
  });

  it("packages array in result contains all input packages", () => {
    const contract = createControlPlaneConsumerPipelineBatchContract({ now: FIXED_NOW });
    const p1 = makePackage("ctx-a", "query alpha");
    const p2 = makePackage("ctx-b", "query beta");
    const result = contract.batch([p1, p2]);
    expect(result.packages[0].contextId).toBe("ctx-a");
    expect(result.packages[1].contextId).toBe("ctx-b");
  });

  it("batchId is non-empty and differs from batchHash", () => {
    const contract = createControlPlaneConsumerPipelineBatchContract({ now: FIXED_NOW });
    const p1 = makePackage("ctx-a", "query alpha");
    const result = contract.batch([p1]);
    expect(result.batchId).toBeTruthy();
    expect(result.batchId).not.toBe(result.batchHash);
  });
});
