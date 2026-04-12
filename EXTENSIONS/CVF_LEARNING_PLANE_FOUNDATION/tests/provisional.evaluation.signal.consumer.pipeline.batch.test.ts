import { describe, expect, it } from "vitest";

import {
  ProvisionalEvaluationSignalConsumerPipelineBatchContract,
  createProvisionalEvaluationSignalConsumerPipelineBatchContract,
} from "../src/provisional.evaluation.signal.consumer.pipeline.batch.contract";
import { createProvisionalEvaluationSignalConsumerPipelineContract } from "../src/provisional.evaluation.signal.consumer.pipeline.contract";

const FIXED_NOW = "2026-04-12T12:00:00.000Z";
const fixedNow = () => FIXED_NOW;

const pipeline = createProvisionalEvaluationSignalConsumerPipelineContract({
  now: fixedNow,
});

const mediumSignal = pipeline.execute({
  input: {
    sourceRef: "planner/trigger-test",
    textSample: "deploy azure openai model with custom sku",
    candidateRefs: ["foundry.customize"],
    confidence: 0.62,
    missingInputs: ["resource group"],
    clarificationNeeded: true,
    negativeMatches: [],
    phase: "DESIGN",
  },
});

const highSignal = pipeline.execute({
  input: {
    sourceRef: "planner/trigger-test",
    textSample: "help me with docs maybe",
    candidateRefs: [],
    confidence: 0.2,
    missingInputs: [],
    clarificationNeeded: true,
    negativeMatches: [],
    phase: "INTAKE",
  },
});

const noSignal = pipeline.execute({
  input: {
    sourceRef: "planner/trigger-test",
    textSample: "create transparent background raster image asset",
    candidateRefs: ["asset.imagegen"],
    confidence: 0.97,
    missingInputs: [],
    clarificationNeeded: false,
    negativeMatches: [],
    phase: "DESIGN",
  },
});

describe("ProvisionalEvaluationSignalConsumerPipelineBatchContract", () => {
  const contract = new ProvisionalEvaluationSignalConsumerPipelineBatchContract({
    now: fixedNow,
  });

  it("instantiates and factory works", () => {
    expect(() => new ProvisionalEvaluationSignalConsumerPipelineBatchContract()).not.toThrow();
    expect(
      createProvisionalEvaluationSignalConsumerPipelineBatchContract({
        now: fixedNow,
      }).batch([]),
    ).toBeDefined();
  });

  it("aggregates captured-signal and severity counts", () => {
    const batch = contract.batch([mediumSignal, highSignal, noSignal]);

    expect(batch.totalResults).toBe(3);
    expect(batch.capturedSignalCount).toBe(2);
    expect(batch.highSeverityCount).toBe(1);
    expect(batch.mediumSeverityCount).toBe(1);
    expect(batch.createdAt).toBe(FIXED_NOW);
  });

  it("keeps batchId distinct from batchHash", () => {
    const batch = contract.batch([mediumSignal]);
    expect(batch.batchId).not.toBe(batch.batchHash);
  });
});
