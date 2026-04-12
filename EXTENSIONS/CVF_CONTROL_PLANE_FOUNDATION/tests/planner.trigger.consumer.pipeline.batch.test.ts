import { describe, expect, it } from "vitest";

import {
  PlannerTriggerConsumerPipelineBatchContract,
  createPlannerTriggerConsumerPipelineBatchContract,
} from "../src/planner.trigger.consumer.pipeline.batch.contract";
import { createPlannerTriggerConsumerPipelineContract } from "../src/planner.trigger.consumer.pipeline.contract";

const FIXED_NOW = "2026-04-12T12:00:00.000Z";
const fixedNow = () => FIXED_NOW;

const pipeline = createPlannerTriggerConsumerPipelineContract({
  now: fixedNow,
});

const strongResult = pipeline.execute({
  text: "generate transparent background raster image asset",
  availableInputs: ["reference image"],
  governanceChainIntact: true,
  candidates: [
    {
      candidateRef: "asset.imagegen",
      triggerPhrases: ["transparent background", "raster image", "image asset"],
      prerequisites: ["reference image"],
      riskLevel: "R0",
    },
  ],
});

const clarifyResult = pipeline.execute({
  text: "deploy azure openai model with custom sku",
  availableInputs: ["subscription id"],
  candidates: [
    {
      candidateRef: "foundry.customize",
      triggerPhrases: ["deploy azure openai model", "custom sku"],
      prerequisites: ["subscription id", "resource group", "capacity target"],
    },
  ],
});

const negativeResult = pipeline.execute({
  text: "delete the database schema now",
  candidates: [
    {
      candidateRef: "safe.readonly",
      triggerPhrases: ["database", "schema"],
      negativeMatches: ["delete"],
    },
  ],
});

describe("PlannerTriggerConsumerPipelineBatchContract", () => {
  const contract = new PlannerTriggerConsumerPipelineBatchContract({
    now: fixedNow,
  });

  it("instantiates and factory works", () => {
    expect(() => new PlannerTriggerConsumerPipelineBatchContract()).not.toThrow();
    expect(
      createPlannerTriggerConsumerPipelineBatchContract({ now: fixedNow }).batch([]),
    ).toBeDefined();
  });

  it("aggregates clarification and negative-match counts", () => {
    const batch = contract.batch([strongResult, clarifyResult, negativeResult]);

    expect(batch.totalResults).toBe(3);
    expect(batch.clarificationCount).toBe(2);
    expect(batch.zeroCandidateCount).toBe(1);
    expect(batch.negativeMatchCount).toBe(1);
    expect(batch.createdAt).toBe(FIXED_NOW);
  });

  it("keeps batchId distinct from batchHash", () => {
    const batch = contract.batch([strongResult]);
    expect(batch.batchId).not.toBe(batch.batchHash);
  });
});
