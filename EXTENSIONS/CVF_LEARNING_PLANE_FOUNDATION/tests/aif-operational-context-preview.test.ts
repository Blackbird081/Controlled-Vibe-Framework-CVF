import { describe, expect, it } from "vitest";
import {
  AIF_OPERATIONAL_CONTEXT_PREVIEW_VERSION,
  buildAifOperationalContextPreview,
} from "../src/aif-operational-context-preview";
import { createInMemoryGraphKnowledgeService } from "../src/knowledge/graph/index/symbol-index";
import type { MemoryRetrievalCandidate } from "../src/memory-retrieval-policy";

const candidates: MemoryRetrievalCandidate[] = [
  {
    id: "mem-provider",
    scope: "cvf-post-aif",
    summary: "OpenAI routeWebProvider gpt-4o has one bounded live governed receipt.",
    content: "raw provider note that must not be copied into preview",
    createdAt: 300,
    auditTrust: 0.95,
    lifecycleState: "semantic",
  },
  {
    id: "mem-secret",
    scope: "cvf-post-aif",
    summary: "secret material",
    content: "sk-do-not-copy",
    createdAt: 400,
    auditTrust: 1,
    lifecycleState: "semantic",
    containsSecret: true,
  },
  {
    id: "mem-other",
    scope: "other",
    summary: "unrelated scope",
    createdAt: 500,
    auditTrust: 0.5,
    lifecycleState: "semantic",
  },
];

describe("AIF operational context preview", () => {
  it("builds a summary-only preview from memory and advisory graph results", () => {
    const graphKnowledgeService = createInMemoryGraphKnowledgeService([
      {
        filePath: "src/provider-router-adapter.ts",
        source: "export function routeWebProvider() { return true; }",
      },
    ]);

    const preview = buildAifOperationalContextPreview({
      purpose: "post-AIF operationalization",
      scope: "cvf-post-aif",
      riskLevel: "R1",
      query: "OpenAI routeWebProvider",
      actorAuthorized: true,
      candidates,
      tokenBudget: 200,
      maxResults: 3,
    }, { graphKnowledgeService });

    expect(preview.contractVersion).toBe(AIF_OPERATIONAL_CONTEXT_PREVIEW_VERSION);
    expect(preview.status).toBe("ready");
    expect(preview.evidence).toEqual({
      rawMemoryReleased: false,
      liveRouteInjected: false,
      canReinject: false,
      graphAdvisoryOnly: true,
    });
    expect(preview.contextBlock.rawMemoryReleased).toBe(false);
    expect(preview.contextBlock.sourceMemoryIds).toContain("mem-provider");
    expect(preview.contextBlock.sourceMemoryIds.some((id) => id.startsWith("graph:"))).toBe(true);
    expect(preview.contextBlock.text).toContain("Graph evidence is advisory only");
    expect(preview.contextBlock.text).not.toContain("sk-do-not-copy");
    expect(preview.contextBlock.excludedMemory).toEqual(expect.arrayContaining([
      { id: "mem-secret", reason: "privacy_filtered" },
      { id: "mem-other", reason: "out_of_scope" },
    ]));
  });

  it("returns partial when graph_search is requested without an injected service", () => {
    const preview = buildAifOperationalContextPreview({
      purpose: "post-AIF operationalization",
      scope: "cvf-post-aif",
      riskLevel: "R1",
      query: "OpenAI",
      actorAuthorized: true,
      candidates,
      tokenBudget: 200,
    });

    expect(preview.status).toBe("partial");
    expect(preview.reason).toBe("aif_operational_context_preview_partial");
    expect(preview.retrievalResults.map((result) => result.status)).toEqual([
      "allowed",
      "deferred",
    ]);
    expect(preview.contextBlock.sourceMemoryIds).toEqual(["mem-provider"]);
  });

  it("denies unauthorized actors without packaging approved memory", () => {
    const preview = buildAifOperationalContextPreview({
      purpose: "post-AIF operationalization",
      scope: "cvf-post-aif",
      riskLevel: "R1",
      query: "OpenAI",
      actorAuthorized: false,
      candidates,
      tokenBudget: 200,
    });

    expect(preview.status).toBe("denied");
    expect(preview.contextBlock.sourceMemoryIds).toEqual([]);
    expect(preview.contextBlock.text).toContain("policy_decision: deny");
  });

  it("preserves package token-budget exclusions", () => {
    const preview = buildAifOperationalContextPreview({
      purpose: "post-AIF operationalization",
      scope: "cvf-post-aif",
      riskLevel: "R1",
      query: "OpenAI",
      actorAuthorized: true,
      candidates,
      tokenBudget: 1,
      retrievalMethods: ["keyword"],
    });

    expect(preview.status).toBe("ready");
    expect(preview.contextBlock.sourceMemoryIds).toEqual([]);
    expect(preview.contextBlock.excludedMemory).toEqual(expect.arrayContaining([
      { id: "mem-provider", reason: "token_budget_exceeded" },
    ]));
  });
});
