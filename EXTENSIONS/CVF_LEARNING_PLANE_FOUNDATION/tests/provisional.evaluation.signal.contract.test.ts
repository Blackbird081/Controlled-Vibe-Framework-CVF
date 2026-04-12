import { describe, expect, it } from "vitest";

import { createProvisionalEvaluationSignalContract } from "../src/index";

describe("ProvisionalEvaluationSignalContract", () => {
  it("does not capture weak_trigger_definition when planner evidence is already strong", () => {
    const contract = createProvisionalEvaluationSignalContract({
      now: () => "2026-04-12T10:00:00.000Z",
    });

    const signal = contract.captureWeakTriggerDefinition({
      sourceRef: "planner/trigger-test",
      textSample: "create transparent background raster image asset",
      candidateRefs: ["asset.imagegen"],
      confidence: 0.97,
      missingInputs: [],
      clarificationNeeded: false,
      negativeMatches: [],
      phase: "DESIGN",
    });

    expect(signal).toBeNull();
  });

  it("captures a high-severity signal when no candidate is stable enough to route", () => {
    const contract = createProvisionalEvaluationSignalContract({
      now: () => "2026-04-12T10:00:00.000Z",
    });

    const signal = contract.captureWeakTriggerDefinition({
      sourceRef: "planner/trigger-test",
      textSample: "help me with something maybe related to docs",
      candidateRefs: [],
      confidence: 0.22,
      missingInputs: [],
      clarificationNeeded: true,
      negativeMatches: [],
      phase: "INTAKE",
    });

    expect(signal).not.toBeNull();
    expect(signal?.severity).toBe("high");
    expect(signal?.name).toBe("weak_trigger_definition");
    expect(signal?.phase).toEqual(["INTAKE"]);
  });

  it("captures a medium-severity signal when missing inputs are the main blocker", () => {
    const contract = createProvisionalEvaluationSignalContract({
      now: () => "2026-04-12T10:00:00.000Z",
    });

    const signal = contract.captureWeakTriggerDefinition({
      sourceRef: "planner/trigger-test",
      textSample: "deploy azure openai model with custom sku",
      candidateRefs: ["foundry.customize"],
      confidence: 0.62,
      missingInputs: ["resource group", "capacity target"],
      clarificationNeeded: true,
      negativeMatches: [],
      phase: "DESIGN",
    });

    expect(signal).not.toBeNull();
    expect(signal?.severity).toBe("medium");
    expect(signal?.recommendedRemediation).toContain("resource group");
  });
});
