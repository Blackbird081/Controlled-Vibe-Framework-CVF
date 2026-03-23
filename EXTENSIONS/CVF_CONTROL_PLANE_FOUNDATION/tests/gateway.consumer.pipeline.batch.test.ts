import { describe, it, expect } from "vitest";
import {
  GatewayConsumerPipelineBatchContract,
  createGatewayConsumerPipelineBatchContract,
} from "../src/gateway.consumer.pipeline.batch.contract";
import { createGatewayConsumerPipelineContract } from "../src/gateway.consumer.pipeline.contract";
import type { GatewayConsumerPipelineResult } from "../src";

// ─── W1-T14 CP2: GatewayConsumerPipelineBatchContract ────────────────────────

const FIXED_NOW = () => "2026-03-24T05:00:00.000Z";

const CANDIDATE_ITEMS = [
  {
    itemId: "item-a",
    title: "CVF Control Plane",
    content: "The control plane manages routing and knowledge.",
    source: "docs",
    relevanceScore: 0.85,
    tier: "T1" as const,
    recencyScore: 0.8,
  },
];

function makeResult(rawSignal: string, consumerId?: string): GatewayConsumerPipelineResult {
  const pipeline = createGatewayConsumerPipelineContract({ now: FIXED_NOW });
  return pipeline.execute({ rawSignal, candidateItems: CANDIDATE_ITEMS, consumerId });
}

describe("W1-T14 CP2: GatewayConsumerPipelineBatchContract", () => {
  it("createGatewayConsumerPipelineBatchContract returns an instance", () => {
    expect(createGatewayConsumerPipelineBatchContract()).toBeInstanceOf(
      GatewayConsumerPipelineBatchContract,
    );
  });

  it("batch returns a GatewayConsumerPipelineBatch with all required fields", () => {
    const contract = createGatewayConsumerPipelineBatchContract({ now: FIXED_NOW });
    const r1 = makeResult("signal alpha");
    const result = contract.batch([r1]);
    expect(result.batchId).toBeTruthy();
    expect(result.createdAt).toBe(FIXED_NOW());
    expect(result.totalResults).toBe(1);
    expect(result.results).toHaveLength(1);
    expect(result.dominantTokenBudget).toBeGreaterThanOrEqual(0);
    expect(result.batchHash).toBeTruthy();
  });

  it("totalResults reflects the number of input results", () => {
    const contract = createGatewayConsumerPipelineBatchContract({ now: FIXED_NOW });
    const results = [
      makeResult("signal one"),
      makeResult("signal two"),
      makeResult("signal three"),
    ];
    const batch = contract.batch(results);
    expect(batch.totalResults).toBe(3);
  });

  it("dominantTokenBudget is the max estimatedTokens across all consumer packages", () => {
    const contract = createGatewayConsumerPipelineBatchContract({ now: FIXED_NOW });
    const r1 = makeResult("short");
    const r2 = makeResult("longer signal with more content to rank and package");
    const batch = contract.batch([r1, r2]);
    const expected = Math.max(
      r1.consumerPackage.typedContextPackage.estimatedTokens,
      r2.consumerPackage.typedContextPackage.estimatedTokens,
    );
    expect(batch.dominantTokenBudget).toBe(expected);
  });

  it("batchHash is deterministic for the same inputs", () => {
    const contract = createGatewayConsumerPipelineBatchContract({ now: FIXED_NOW });
    const r1 = makeResult("determinism signal");
    const b1 = contract.batch([r1]);
    const b2 = contract.batch([r1]);
    expect(b1.batchHash).toBe(b2.batchHash);
    expect(b1.batchId).toBe(b2.batchId);
  });

  it("batchHash changes when results change", () => {
    const contract = createGatewayConsumerPipelineBatchContract({ now: FIXED_NOW });
    const r1 = makeResult("signal alpha");
    const r2 = makeResult("signal beta");
    const b1 = contract.batch([r1]);
    const b2 = contract.batch([r2]);
    expect(b1.batchHash).not.toBe(b2.batchHash);
  });

  it("empty batch produces valid result with totalResults 0 and dominantTokenBudget 0", () => {
    const contract = createGatewayConsumerPipelineBatchContract({ now: FIXED_NOW });
    const batch = contract.batch([]);
    expect(batch.totalResults).toBe(0);
    expect(batch.dominantTokenBudget).toBe(0);
    expect(batch.batchHash).toBeTruthy();
  });

  it("results array in batch contains all input results in order", () => {
    const contract = createGatewayConsumerPipelineBatchContract({ now: FIXED_NOW });
    const r1 = makeResult("signal alpha", "consumer-1");
    const r2 = makeResult("signal beta", "consumer-2");
    const batch = contract.batch([r1, r2]);
    expect(batch.results[0].consumerId).toBe("consumer-1");
    expect(batch.results[1].consumerId).toBe("consumer-2");
  });

  it("batchId differs from batchHash", () => {
    const contract = createGatewayConsumerPipelineBatchContract({ now: FIXED_NOW });
    const r1 = makeResult("id difference check");
    const batch = contract.batch([r1]);
    expect(batch.batchId).not.toBe(batch.batchHash);
  });
});
