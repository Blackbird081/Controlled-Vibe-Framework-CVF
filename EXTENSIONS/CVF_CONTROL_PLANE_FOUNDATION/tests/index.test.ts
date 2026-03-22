import { describe, expect, it } from "vitest";
import {
  CONTROL_PLANE_FOUNDATION_COORDINATION,
  CONTROL_PLANE_SELECTED_INTELLIGENCE_ALIGNMENT,
  AgentRole,
  createControlPlaneIntakeContract,
  createRetrievalContract,
  mapDocument,
  resolveSource,
  matchesFilters,
  readStringFilter,
  readStringList,
  ReasoningMode,
  canAccessScope,
  createControlPlaneEvidenceSurface,
  createControlPlaneFoundationShell,
  formatRiskDisplay,
  getRiskLabel,
  normalizeRuntimeScore,
  resetDocCounter,
  resolveReasoningMode,
  riskLevelToScore,
  runtimeToCVFRisk,
  scoreToRiskLevel,
  segmentContext,
} from "../src/index";

describe("CVF_CONTROL_PLANE_FOUNDATION", () => {
  it("re-exports intent validation through the control-plane shell", () => {
    const shell = createControlPlaneFoundationShell();
    const result = shell.intent.validate(
      "Approve finance spend only after manager review and keep the limit below 500 dollars."
    );

    expect(result.intent.domain).toBe("finance");
    expect(result.rules.length).toBeGreaterThan(0);
    expect(result.constraints.length).toBeGreaterThan(0);
  });

  it("creates one usable intake contract baseline across intent, retrieval, and packaged context", () => {
    resetDocCounter();

    const shell = createControlPlaneFoundationShell();
    shell.knowledge.getStore().add({
      title: "Finance Review Policy",
      content:
        "Finance spend over 500 requires manager review and evidence before approval.",
      tier: "T2_POLICY",
      documentType: "policy",
      domain: "finance",
      tags: ["finance", "approval"],
      metadata: {
        source: "finance-policy",
        owner: "control-plane",
      },
    });

    const contract = createControlPlaneIntakeContract({
      shell,
      now: () => "2026-03-22T10:00:00.000Z",
    });
    const result = contract.execute({
      vibe:
        "Approve finance spend only after manager review and keep the limit below 500 dollars.",
      tokenBudget: 30,
      consumerId: "w1-t2-test-consumer",
      retrieval: {
        maxChunks: 3,
        sources: ["finance-policy"],
        filters: {
          owner: "control-plane",
        },
      },
    });

    expect(result.requestId).toHaveLength(32);
    expect(result.intent.valid).toBe(true);
    expect(result.intent.intent.domain).toBe("finance");
    expect(result.retrieval.chunkCount).toBe(1);
    expect(result.retrieval.query).toContain("finance");
    expect(result.packagedContext.truncated).toBe(false);
    expect(result.packagedContext.snapshotHash).toHaveLength(32);
    expect(result.packagedContext.chunks[0]?.source).toBe("finance-policy");
    expect(result.warnings).toEqual([]);
  });

  it("composes knowledge, reporting, and deterministic context services", () => {
    resetDocCounter();

    const shell = createControlPlaneFoundationShell();
    const store = shell.knowledge.getStore();

    store.add({
      title: "Finance Approval Policy",
      content: "Finance spend over 500 requires manager approval.",
      tier: "T2_POLICY",
      documentType: "policy",
      domain: "finance",
      tags: ["finance", "approval"],
      metadata: { source: "test" },
    });

    const result = shell.knowledge.querySimple("manager approval", "finance", 3);
    expect(result.documents).toHaveLength(1);
    expect(result.documents[0]?.title).toBe("Finance Approval Policy");

    const freezeHash = shell.context.freeze(
      "cp1-test",
      { "docs/policy.md": "abc123" },
      "policy-v1",
      { env: "test" }
    );
    expect(freezeHash).toHaveLength(16);

    shell.reporting.addSession({
      sessionId: "session-1",
      agentId: "agent-control",
      actionCount: 3,
      cumulativeRisk: 1.5,
      highestRisk: "R1",
      verdictCounts: {
        ALLOW: 2,
        WARN: 1,
        ESCALATE: 0,
        BLOCK: 0,
      },
      domainBreakdown: {
        finance: 3,
      },
      startedAt: Date.now() - 1000,
      endedAt: Date.now(),
    });

    const report = shell.reporting.generateReport();
    expect(report.metrics.totalSessions).toBe(1);
    expect(report.metrics.domainActivity.finance).toBe(3);
    expect(report.textReport).toContain("CVF Governance Canvas");

    shell.context._clearAll();
  });

  it("publishes lineage metadata and keeps controlled-intelligence out of scope", () => {
    expect(CONTROL_PLANE_FOUNDATION_COORDINATION.executionClass).toBe(
      "coordination package"
    );
    expect(CONTROL_PLANE_FOUNDATION_COORDINATION.intentValidation).toContain(
      "CVF_ECO_v1.0_INTENT_VALIDATION"
    );
    expect(
      CONTROL_PLANE_FOUNDATION_COORDINATION.selectedControlledIntelligenceReferences
    ).toContain("EXTENSIONS/CVF_v1.7_CONTROLLED_INTELLIGENCE");
    expect(
      CONTROL_PLANE_FOUNDATION_COORDINATION.initialPhysicalMoveExcluded
    ).toContain("EXTENSIONS/CVF_v1.7_CONTROLLED_INTELLIGENCE");
  });

  it("exports a reviewable governance-canvas evidence surface for the tranche", () => {
    const evidence = createControlPlaneEvidenceSurface(
      [
        {
          sessionId: "cp3-session-1",
          agentId: "agent-control",
          actionCount: 4,
          cumulativeRisk: 2.5,
          highestRisk: "R2",
          verdictCounts: {
            ALLOW: 2,
            WARN: 1,
            ESCALATE: 1,
            BLOCK: 0,
          },
          domainBreakdown: {
            finance: 2,
            governance: 2,
          },
          startedAt: Date.now() - 5000,
          endedAt: Date.now(),
        },
      ],
      {
        knowledgeSources: ["EXTENSIONS/CVF_ECO_v1.4_RAG_PIPELINE"],
        frozenContextHashes: ["freeze-abc123"],
        notes: ["CP3 keeps governance-core semantics unchanged."],
      }
    );

    expect(evidence.trancheId).toBe("W1-T1");
    expect(evidence.controlPointId).toBe("CP3");
    expect(evidence.report.metrics.totalSessions).toBe(1);
    expect(evidence.textSurface).toContain("CVF W1-T1 CP3 Control-Plane Review Surface");
    expect(evidence.textSurface).toContain("EXTENSIONS/CVF_ECO_v2.1_GOVERNANCE_CANVAS");
    expect(evidence.markdownSurface).toContain("## Governance Canvas Report");
    expect(evidence.markdownSurface).toContain("`freeze-abc123`");
    expect(evidence.markdownSurface).toContain("CP3 keeps governance-core semantics unchanged.");
  });

  it("exports selected controlled-intelligence risk surfaces through the shell", () => {
    expect(scoreToRiskLevel(0.72)).toBe("R2");
    expect(riskLevelToScore("R3")).toBe(0.92);
    expect(getRiskLabel("R2", "en").label).toBe("Review Required");
    expect(formatRiskDisplay("R1", "vi")).toContain("Cần chú ý");
    expect(runtimeToCVFRisk("HIGH")).toBe("R2");
    expect(normalizeRuntimeScore(120)).toBe(riskLevelToScore("R3"));
  });

  it("exports selected context-segmentation helpers through the shell", () => {
    const segmented = segmentContext(
      "cp4-session",
      "REVIEW",
      Array.from({ length: 24 }, (_, index) => ({
        content: `chunk-${index + 1}`,
        timestamp: index + 1,
        role: "RESEARCH",
      })),
      [],
      {
        role: "REVIEW",
        summary: "Latest review summary",
        timestamp: Date.now(),
      }
    );

    expect(segmented.prunedChunks).toHaveLength(20);
    expect(segmented.activeSummaries).toHaveLength(1);
    expect(segmented.currentFork?.parentSessionId).toBe("cp4-session");
    expect(
      canAccessScope(
        { forkId: "fork-1", allowedScopes: ["finance", "governance"] },
        "governance"
      )
    ).toBe(true);
  });

  it("keeps CP4 aligned to selected wrappers and defers runtime-critical reasoning execution", () => {
    expect(CONTROL_PLANE_SELECTED_INTELLIGENCE_ALIGNMENT.controlPointId).toBe("CP4");
    expect(CONTROL_PLANE_SELECTED_INTELLIGENCE_ALIGNMENT.executionClass).toBe(
      "wrapper/re-export"
    );
    expect(CONTROL_PLANE_SELECTED_INTELLIGENCE_ALIGNMENT.includedSurfaces).toContain(
      "core/governance/risk.mapping"
    );
    expect(CONTROL_PLANE_SELECTED_INTELLIGENCE_ALIGNMENT.includedSurfaces).toContain(
      "intelligence/context_segmentation/context.segmenter"
    );
    expect(CONTROL_PLANE_SELECTED_INTELLIGENCE_ALIGNMENT.deferredSurfaces).toContain(
      "intelligence/reasoning_gate/controlled.reasoning"
    );
    expect(resolveReasoningMode(AgentRole.REVIEW)).toBe(ReasoningMode.STRICT);
    expect(resolveReasoningMode(AgentRole.DESIGN)).toBe(ReasoningMode.CONTROLLED);
  });
});

describe("CVF_CONTROL_PLANE_FOUNDATION — CP2 Unified Retrieval Contract", () => {
  it("retrieves chunks independently through the unified retrieval contract", () => {
    resetDocCounter();

    const shell = createControlPlaneFoundationShell();
    shell.knowledge.getStore().add({
      title: "Security Baseline Policy",
      content: "All deployments must pass security review before production release.",
      tier: "T1_DOCTRINE",
      documentType: "doctrine",
      domain: "security",
      tags: ["security", "deployment"],
      metadata: { source: "security-baseline", owner: "governance" },
    });

    const contract = createRetrievalContract({ knowledge: shell.knowledge });
    const result = contract.retrieve({
      query: "security deployment review",
      options: { maxChunks: 5, minRelevance: 0.01 },
    });

    expect(result.query).toBe("security deployment review");
    expect(result.chunkCount).toBe(1);
    expect(result.totalCandidates).toBeGreaterThan(0);
    expect(result.retrievalTimeMs).toBeGreaterThanOrEqual(0);
    expect(result.tiersSearched).toContain("T1_DOCTRINE");
    expect(result.chunks[0]?.source).toBe("security-baseline");
    expect(result.chunks[0]?.content).toContain("security review");
    expect(result.chunks[0]?.relevanceScore).toBeGreaterThan(0);
    expect(result.chunks[0]?.metadata?.title).toBe("Security Baseline Policy");
    expect(result.chunks[0]?.metadata?.tier).toBe("T1_DOCTRINE");
    expect(result.chunks[0]?.metadata?.domain).toBe("security");
  });

  it("applies source filters through the unified contract", () => {
    resetDocCounter();

    const shell = createControlPlaneFoundationShell();
    const store = shell.knowledge.getStore();
    store.add({
      title: "Policy A",
      content: "Policy A content about finance approval.",
      tier: "T2_POLICY",
      documentType: "policy",
      domain: "finance",
      tags: ["finance"],
      metadata: { source: "source-a" },
    });
    store.add({
      title: "Policy B",
      content: "Policy B content about finance review.",
      tier: "T2_POLICY",
      documentType: "policy",
      domain: "finance",
      tags: ["finance"],
      metadata: { source: "source-b" },
    });

    const contract = createRetrievalContract({ knowledge: shell.knowledge });
    const result = contract.retrieve({
      query: "finance",
      options: { sources: ["source-a"] },
    });

    expect(result.chunkCount).toBe(1);
    expect(result.chunks[0]?.source).toBe("source-a");
  });

  it("applies metadata filters through the unified contract", () => {
    resetDocCounter();

    const shell = createControlPlaneFoundationShell();
    shell.knowledge.getStore().add({
      title: "Ops Log",
      content: "Operational log for deployment pipeline verification.",
      tier: "T3_OPERATIONAL",
      documentType: "operational_log",
      domain: "devops",
      tags: ["ops"],
      metadata: { source: "ops-log", environment: "production" },
    });
    shell.knowledge.getStore().add({
      title: "Ops Log Staging",
      content: "Operational log for staging deployment pipeline.",
      tier: "T3_OPERATIONAL",
      documentType: "operational_log",
      domain: "devops",
      tags: ["ops"],
      metadata: { source: "ops-staging", environment: "staging" },
    });

    const contract = createRetrievalContract({ knowledge: shell.knowledge });
    const result = contract.retrieve({
      query: "deployment pipeline",
      options: { filters: { environment: "production" } },
    });

    expect(result.chunkCount).toBe(1);
    expect(result.chunks[0]?.source).toBe("ops-log");
  });

  it("returns empty chunks when no documents match", () => {
    const contract = createRetrievalContract();
    const result = contract.retrieve({
      query: "nonexistent topic",
    });

    expect(result.chunkCount).toBe(0);
    expect(result.chunks).toEqual([]);
    expect(result.totalCandidates).toBe(0);
  });

  it("exposes the underlying knowledge pipeline through getKnowledge()", () => {
    const shell = createControlPlaneFoundationShell();
    const contract = createRetrievalContract({ knowledge: shell.knowledge });
    expect(contract.getKnowledge()).toBe(shell.knowledge);
  });

  it("resolveSource falls back to title when metadata.source is absent", () => {
    const doc = {
      id: "doc-1",
      title: "Fallback Title",
      content: "content",
      tier: "T2_POLICY" as const,
      documentType: "policy" as const,
      domain: "general",
      tags: [],
      metadata: {},
    };
    expect(resolveSource(doc)).toBe("Fallback Title");
  });

  it("resolveSource uses metadata.source when present", () => {
    const doc = {
      id: "doc-2",
      title: "Title",
      content: "content",
      tier: "T2_POLICY" as const,
      documentType: "policy" as const,
      domain: "general",
      tags: [],
      metadata: { source: "explicit-source" },
    };
    expect(resolveSource(doc)).toBe("explicit-source");
  });

  it("mapDocument produces a correctly shaped RetrievalChunk", () => {
    const doc = {
      id: "doc-3",
      title: "Test Doc",
      content: "Test content",
      tier: "T1_DOCTRINE" as const,
      documentType: "doctrine" as const,
      domain: "governance",
      tags: ["gov"],
      score: 0.85,
      metadata: { source: "test-source", custom: "value" },
    };
    const chunk = mapDocument(doc);
    expect(chunk.id).toBe("doc-3");
    expect(chunk.source).toBe("test-source");
    expect(chunk.content).toBe("Test content");
    expect(chunk.relevanceScore).toBe(0.85);
    expect(chunk.metadata?.title).toBe("Test Doc");
    expect(chunk.metadata?.tier).toBe("T1_DOCTRINE");
    expect(chunk.metadata?.custom).toBe("value");
  });

  it("matchesFilters passes when no filters are set", () => {
    const chunk = { id: "c1", source: "s", content: "", relevanceScore: 0 };
    expect(matchesFilters(chunk)).toBe(true);
    expect(matchesFilters(chunk, {})).toBe(true);
  });

  it("matchesFilters rejects when source filter does not match", () => {
    const chunk = { id: "c1", source: "source-a", content: "", relevanceScore: 0 };
    expect(matchesFilters(chunk, { sources: ["source-b"] })).toBe(false);
  });

  it("matchesFilters handles array-valued metadata filters on non-reserved keys", () => {
    const chunk = {
      id: "c1",
      source: "s",
      content: "",
      relevanceScore: 0,
      metadata: { categories: ["a", "b"] },
    };
    expect(matchesFilters(chunk, { filters: { categories: ["b", "c"] } })).toBe(true);
    expect(matchesFilters(chunk, { filters: { categories: ["x", "y"] } })).toBe(false);
  });

  it("matchesFilters skips reserved keys (domain, tags) since they are handled by RAGPipeline", () => {
    const chunk = {
      id: "c1",
      source: "s",
      content: "",
      relevanceScore: 0,
      metadata: { tags: ["a"], domain: "finance" },
    };
    expect(matchesFilters(chunk, { filters: { tags: ["x"], domain: "other" } })).toBe(true);
  });

  it("readStringFilter returns undefined for non-strings", () => {
    expect(readStringFilter(undefined)).toBeUndefined();
    expect(readStringFilter(42)).toBeUndefined();
    expect(readStringFilter("")).toBeUndefined();
    expect(readStringFilter("valid")).toBe("valid");
  });

  it("readStringList returns undefined for non-arrays and empty arrays", () => {
    expect(readStringList(undefined)).toBeUndefined();
    expect(readStringList("not-array")).toBeUndefined();
    expect(readStringList([])).toBeUndefined();
    expect(readStringList(["a", "b"])).toEqual(["a", "b"]);
  });

  it("intake contract delegates retrieval to the unified contract producing identical results", () => {
    resetDocCounter();

    const shell = createControlPlaneFoundationShell();
    shell.knowledge.getStore().add({
      title: "Delegation Test Policy",
      content: "Policy content for verifying delegation through unified retrieval.",
      tier: "T2_POLICY",
      documentType: "policy",
      domain: "governance",
      tags: ["governance", "delegation"],
      metadata: { source: "delegation-test", owner: "cp2" },
    });

    const intakeContract = createControlPlaneIntakeContract({
      shell,
      now: () => "2026-03-22T14:00:00.000Z",
    });
    const intakeResult = intakeContract.execute({
      vibe: "Verify governance delegation policy compliance.",
      tokenBudget: 100,
      consumerId: "cp2-delegation-test",
      retrieval: {
        maxChunks: 5,
        sources: ["delegation-test"],
        filters: { owner: "cp2" },
      },
    });

    const retrievalContract = createRetrievalContract({ knowledge: shell.knowledge });
    const directResult = retrievalContract.retrieve({
      query: intakeResult.retrieval.query,
      options: {
        maxChunks: 5,
        sources: ["delegation-test"],
        filters: { owner: "cp2", domain: "governance" },
      },
    });

    expect(intakeResult.retrieval.chunkCount).toBe(directResult.chunkCount);
    expect(intakeResult.retrieval.chunks[0]?.source).toBe(directResult.chunks[0]?.source);
    expect(intakeResult.retrieval.chunks[0]?.content).toBe(directResult.chunks[0]?.content);
  });
});
