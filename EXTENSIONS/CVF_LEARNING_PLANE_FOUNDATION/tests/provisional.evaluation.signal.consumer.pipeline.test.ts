import { describe, expect, it } from "vitest";

import { createProvisionalEvaluationSignalConsumerPipelineContract } from "../src/index";

const FIXED_NOW = "2026-04-12T11:00:00.000Z";

describe("ProvisionalEvaluationSignalConsumerPipelineContract", () => {
  it("packages a captured weak_trigger_definition signal into a consumer result", () => {
    const contract = createProvisionalEvaluationSignalConsumerPipelineContract({
      now: () => FIXED_NOW,
    });

    const result = contract.execute({
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

    expect(result.createdAt).toBe(FIXED_NOW);
    expect(result.signalResult?.name).toBe("weak_trigger_definition");
    expect(result.query).toContain("provisional-signal:weak_trigger_definition");
    expect(result.warnings).toContain("WARNING_PROVISIONAL_SIGNAL_MEDIUM");
  });

  it("returns a no-signal package when planner evidence is already strong", () => {
    const contract = createProvisionalEvaluationSignalConsumerPipelineContract({
      now: () => FIXED_NOW,
    });

    const result = contract.execute({
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

    expect(result.signalResult).toBeNull();
    expect(result.query).toBe("provisional-signal:none:weak-trigger-definition");
    expect(result.warnings).toEqual([]);
  });
});
