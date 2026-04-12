import { describe, expect, it } from "vitest";

import { createPlannerTriggerHeuristicsContract } from "../src/index";

describe("PlannerTriggerHeuristicsContract", () => {
  it("returns a single fast-path candidate for high-confidence R0 matches inside governance", () => {
    const contract = createPlannerTriggerHeuristicsContract();
    const result = contract.evaluate({
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

    expect(result.candidate_refs).toEqual(["asset.imagegen"]);
    expect(result.confidence).toBeGreaterThanOrEqual(0.95);
    expect(result.clarification_needed).toBe(false);
    expect(result.missing_inputs).toEqual([]);
  });

  it("prefers clarification when prerequisites are missing", () => {
    const contract = createPlannerTriggerHeuristicsContract();
    const result = contract.evaluate({
      text: "deploy azure openai model with custom sku",
      availableInputs: ["subscription id"],
      candidates: [
        {
          candidateRef: "foundry.customize",
          triggerPhrases: ["deploy azure openai model", "custom sku"],
          prerequisites: ["subscription id", "resource group", "capacity target"],
          riskLevel: "R1",
        },
      ],
    });

    expect(result.candidate_refs).toEqual(["foundry.customize"]);
    expect(result.clarification_needed).toBe(true);
    expect(result.missing_inputs).toEqual(["resource group", "capacity target"]);
  });

  it("surfaces negative matches instead of routing the blocked candidate", () => {
    const contract = createPlannerTriggerHeuristicsContract();
    const result = contract.evaluate({
      text: "delete the database schema now",
      candidates: [
        {
          candidateRef: "safe.readonly",
          triggerPhrases: ["database", "schema"],
          negativeMatches: ["delete"],
          riskLevel: "R1",
        },
      ],
    });

    expect(result.candidate_refs).toEqual([]);
    expect(result.negative_matches).toEqual(["delete"]);
    expect(result.clarification_needed).toBe(true);
  });

  it("returns ordered candidate refs when multiple matches exist without fast-path", () => {
    const contract = createPlannerTriggerHeuristicsContract();
    const result = contract.evaluate({
      text: "create a plugin and also document the command surface",
      candidates: [
        {
          candidateRef: "plugin.creator",
          triggerPhrases: ["create a plugin"],
          riskLevel: "R1",
        },
        {
          candidateRef: "docs.command-surface",
          triggerPhrases: ["document", "command surface"],
          riskLevel: "R1",
        },
      ],
    });

    expect(result.candidate_refs).toEqual([
      "docs.command-surface",
      "plugin.creator",
    ]);
    expect(result.confidence).toBeGreaterThan(0);
  });
});
