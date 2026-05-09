import { describe, expect, it } from "vitest";

import { createPlannerTriggerConsumerPipelineContract } from "../src/index";

const FIXED_NOW = "2026-04-12T11:00:00.000Z";

describe("PlannerTriggerConsumerPipelineContract", () => {
  it("creates a consumer-pipeline result for a high-confidence trigger match", () => {
    const contract = createPlannerTriggerConsumerPipelineContract({
      now: () => FIXED_NOW,
    });

    const result = contract.execute({
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

    expect(result.createdAt).toBe(FIXED_NOW);
    expect(result.heuristicResult.candidate_refs).toEqual(["asset.imagegen"]);
    expect(result.query).toContain("planner-trigger:candidates:1");
    expect(result.warnings).toEqual([]);
  });

  it("emits clarification warning when trigger inputs are insufficient", () => {
    const contract = createPlannerTriggerConsumerPipelineContract({
      now: () => FIXED_NOW,
    });

    const result = contract.execute({
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

    expect(result.heuristicResult.clarification_needed).toBe(true);
    expect(result.warnings).toContain("WARNING_CLARIFICATION_REQUIRED");
  });
});
