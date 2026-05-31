import { describe, expect, it } from "vitest";
import {
  packageMemoryContext,
  MEMORY_CONTEXT_PACKAGER_VERSION,
} from "../src/memory-context-packager";

describe("memory context packager phase 2a", () => {
  it("builds a governed memory context block without raw memory release", () => {
    const block = packageMemoryContext({
      purpose: "continue provider review",
      scope: "project-a",
      riskLevel: "R1",
      approvedMemory: [
        {
          id: "mem-1",
          summary: "Use R1-compatible Alibaba proof payload.",
          scope: "project-a",
          constraints: ["Do not print raw API keys."],
          tokenEstimate: 20,
        },
      ],
      excludedMemory: [{ id: "mem-2", reason: "out_of_scope" }],
      policyDecision: "allow_summary_only",
      tokenBudget: 100,
    });

    expect(block.contractVersion).toBe(MEMORY_CONTEXT_PACKAGER_VERSION);
    expect(block.rawMemoryReleased).toBe(false);
    expect(block.evidence).toMatchObject({
      policyDecision: "allow_summary_only",
      sourceMemoryIds: ["mem-1"],
      includedMemoryCount: 1,
      excludedMemoryCount: 1,
      tokenBudget: 100,
      tokenEstimate: 20,
      tokenBudgetExceeded: false,
      rawMemoryReleased: false,
      canReinject: false,
    });
    expect(block.sourceMemoryIds).toEqual(["mem-1"]);
    expect(block.text).toContain("[MEMORY_CONTEXT]");
    expect(block.text).toContain("Do not print raw API keys.");
    expect(block.text).toContain("mem-2: out_of_scope");
  });

  it("excludes memory that exceeds the token budget", () => {
    const block = packageMemoryContext({
      purpose: "bounded continuation",
      scope: "project-a",
      riskLevel: "R1",
      approvedMemory: [
        { id: "mem-1", summary: "small", scope: "project-a", tokenEstimate: 5 },
        { id: "mem-2", summary: "large", scope: "project-a", tokenEstimate: 90 },
      ],
      excludedMemory: [],
      policyDecision: "allow_summary_only",
      tokenBudget: 10,
    });

    expect(block.sourceMemoryIds).toEqual(["mem-1"]);
    expect(block.excludedMemory).toEqual([{ id: "mem-2", reason: "token_budget_exceeded" }]);
    expect(block.evidence).toMatchObject({
      includedMemoryCount: 1,
      excludedMemoryCount: 1,
      tokenBudgetExceeded: true,
      rawMemoryReleased: false,
      canReinject: false,
    });
  });
});
