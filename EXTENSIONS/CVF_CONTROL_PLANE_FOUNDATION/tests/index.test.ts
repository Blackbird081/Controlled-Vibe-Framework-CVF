import { describe, expect, it } from "vitest";
import {
  CONTROL_PLANE_FOUNDATION_COORDINATION,
  CONTROL_PLANE_SELECTED_INTELLIGENCE_ALIGNMENT,
  AgentRole,
  createControlPlaneIntakeContract,
  createRetrievalContract,
  createPackagingContract,
  PackagingContract,
  estimateTokenCount,
  serializeChunks,
  sortValue,
  createConsumerContract,
  ConsumerContract,
  buildPipelineStages,
  createDesignContract,
  DesignContract,
  createBoardroomContract,
  BoardroomContract,
  createOrchestrationContract,
  OrchestrationContract,
  createDesignConsumerContract,
  DesignConsumerContract,
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
  // W1-T4
  AIGatewayContract,
  createAIGatewayContract,
  GatewayConsumerContract,
  createGatewayConsumerContract,
  // W1-T5
  ReversePromptingContract,
  createReversePromptingContract,
  ClarificationRefinementContract,
  createClarificationRefinementContract,
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

describe("CVF_CONTROL_PLANE_FOUNDATION — CP3 Deterministic Context Packaging", () => {
  const makeChunks = (count: number, contentLength = 20) =>
    Array.from({ length: count }, (_, i) => ({
      id: `chunk-${i}`,
      source: `source-${i}`,
      content: "x".repeat(contentLength),
      relevanceScore: 1 - i * 0.1,
      metadata: { tier: "T1_CORE" },
    }));

  it("packages chunks within a token budget using the packaging contract", () => {
    const contract = createPackagingContract();
    const chunks = makeChunks(3, 40);
    const result = contract.package({ chunks, tokenBudget: 20 });

    expect(result.totalTokens).toBeLessThanOrEqual(20);
    expect(result.tokenBudget).toBe(20);
    expect(result.chunks.length).toBeLessThanOrEqual(3);
    expect(result.snapshotHash).toHaveLength(32);
  });

  it("marks result as truncated when not all chunks fit the budget", () => {
    const contract = createPackagingContract();
    const chunks = makeChunks(5, 40);
    const result = contract.package({ chunks, tokenBudget: 15 });

    expect(result.truncated).toBe(true);
    expect(result.chunks.length).toBeLessThan(5);
  });

  it("marks result as not truncated when all chunks fit", () => {
    const contract = createPackagingContract();
    const chunks = makeChunks(2, 8);
    const result = contract.package({ chunks, tokenBudget: 1000 });

    expect(result.truncated).toBe(false);
    expect(result.chunks.length).toBe(2);
  });

  it("returns empty result for empty chunks", () => {
    const contract = createPackagingContract();
    const result = contract.package({ chunks: [], tokenBudget: 100 });

    expect(result.chunks).toEqual([]);
    expect(result.totalTokens).toBe(0);
    expect(result.truncated).toBe(false);
    expect(result.snapshotHash).toHaveLength(32);
  });

  it("produces deterministic snapshot hash for identical inputs", () => {
    const chunks = makeChunks(2, 20);
    const result1 = createPackagingContract().package({ chunks, tokenBudget: 100 });
    const result2 = createPackagingContract().package({ chunks, tokenBudget: 100 });

    expect(result1.snapshotHash).toBe(result2.snapshotHash);
  });

  it("produces different snapshot hash when budget changes", () => {
    const chunks = makeChunks(2, 20);
    const result1 = createPackagingContract().package({ chunks, tokenBudget: 100 });
    const result2 = createPackagingContract().package({ chunks, tokenBudget: 200 });

    expect(result1.snapshotHash).not.toBe(result2.snapshotHash);
  });

  it("integrates with ContextFreezer when executionId is provided", () => {
    const contract = createPackagingContract();
    const chunks = makeChunks(2, 20);
    const result = contract.package({
      chunks,
      tokenBudget: 100,
      executionId: "cp3-test-exec-001",
    });

    expect(result.freeze).toBeDefined();
    expect(result.freeze!.executionId).toBe("cp3-test-exec-001");
    expect(result.freeze!.frozenContextHash).toBeTruthy();
    expect(contract.getContext().has("cp3-test-exec-001")).toBe(true);
  });

  it("does not freeze context when executionId is absent", () => {
    const contract = createPackagingContract();
    const chunks = makeChunks(2, 20);
    const result = contract.package({ chunks, tokenBudget: 100 });

    expect(result.freeze).toBeUndefined();
  });

  it("does not freeze context when executionId is empty string", () => {
    const contract = createPackagingContract();
    const chunks = makeChunks(2, 20);
    const result = contract.package({ chunks, tokenBudget: 100, executionId: "" });

    expect(result.freeze).toBeUndefined();
  });

  it("estimateTokenCount approximates content.length / 4", () => {
    expect(estimateTokenCount("abcdefgh")).toBe(2);
    expect(estimateTokenCount("a")).toBe(1);
    expect(estimateTokenCount("")).toBe(0);
    expect(estimateTokenCount("x".repeat(100))).toBe(25);
  });

  it("serializeChunks returns 'empty' for zero chunks", () => {
    expect(serializeChunks([])).toBe("empty");
  });

  it("serializeChunks produces deterministic output regardless of metadata key order", () => {
    const chunk1 = {
      id: "c1", source: "s1", content: "text", relevanceScore: 0.9,
      metadata: { alpha: "a", beta: "b" },
    };
    const chunk2 = {
      id: "c1", source: "s1", content: "text", relevanceScore: 0.9,
      metadata: { beta: "b", alpha: "a" },
    };

    expect(serializeChunks([chunk1])).toBe(serializeChunks([chunk2]));
  });

  it("sortValue sorts nested objects deterministically", () => {
    const input = { z: 1, a: { y: 2, b: 3 } };
    const result = sortValue(input) as Record<string, unknown>;

    const keys = Object.keys(result);
    expect(keys[0]).toBe("a");
    expect(keys[1]).toBe("z");
  });

  it("PackagingContract is independently instantiable via factory function", () => {
    const contract = createPackagingContract();
    expect(contract).toBeInstanceOf(PackagingContract);
  });

  it("intake contract delegates packaging to the PackagingContract producing identical hash", () => {
    resetDocCounter();
    const shell = createControlPlaneFoundationShell();
    shell.knowledge.getStore().add({
      title: "CP3 Packaging Test",
      content: "Short test content for packaging verification.",
      tier: "T1_DOCTRINE",
      documentType: "policy",
      domain: "governance",
      tags: ["test"],
      metadata: { source: "cp3-test" },
    });

    const intakeContract = createControlPlaneIntakeContract({
      shell,
      now: () => "2026-03-22T12:00:00.000Z",
    });
    const intakeResult = intakeContract.execute({
      vibe: "verify packaging delegation for CP3 governance test",
      tokenBudget: 256,
      retrieval: { sources: ["cp3-test"] },
    });

    const packagingContract = createPackagingContract();
    const directResult = packagingContract.package({
      chunks: intakeResult.retrieval.chunks,
      tokenBudget: 256,
    });

    expect(intakeResult.packagedContext.snapshotHash).toBe(directResult.snapshotHash);
    expect(intakeResult.packagedContext.totalTokens).toBe(directResult.totalTokens);
    expect(intakeResult.packagedContext.truncated).toBe(directResult.truncated);
  });
});

describe("CVF_CONTROL_PLANE_FOUNDATION — CP4 Real Consumer Path Proof", () => {
  function seedShell() {
    resetDocCounter();
    const shell = createControlPlaneFoundationShell();
    shell.knowledge.getStore().add({
      title: "Consumer Path Test Doc",
      content: "This document proves the intake pipeline is operationally meaningful.",
      tier: "T2_POLICY",
      documentType: "policy",
      domain: "governance",
      tags: ["cp4"],
      metadata: { source: "cp4-test" },
    });
    return shell;
  }

  it("consumes the full intake pipeline and produces a governed receipt", () => {
    const shell = seedShell();
    const contract = createConsumerContract({
      shell,
      now: () => "2026-03-22T15:00:00.000Z",
    });
    const receipt = contract.consume({
      vibe: "prove consumer path for governance test",
      consumerId: "cp4-test-consumer",
      tokenBudget: 256,
      retrieval: { sources: ["cp4-test"] },
    });

    expect(receipt.consumerId).toBe("cp4-test-consumer");
    expect(receipt.consumedAt).toBe("2026-03-22T15:00:00.000Z");
    expect(receipt.requestId).toHaveLength(32);
    expect(receipt.evidenceHash).toHaveLength(32);
    expect(receipt.intake.intent).toBeDefined();
    expect(receipt.intake.retrieval.chunkCount).toBeGreaterThanOrEqual(0);
    expect(receipt.intake.packagedContext.snapshotHash).toHaveLength(32);
  });

  it("includes all pipeline stages in the receipt", () => {
    const shell = seedShell();
    const contract = createConsumerContract({
      shell,
      now: () => "2026-03-22T15:00:00.000Z",
    });
    const receipt = contract.consume({
      vibe: "verify pipeline stages",
      consumerId: "stage-test",
      retrieval: { sources: ["cp4-test"] },
    });

    expect(receipt.pipelineStages).toContain("intent-validation");
    expect(receipt.pipelineStages).toContain("knowledge-retrieval");
    expect(receipt.pipelineStages).toContain("context-packaging");
    expect(receipt.pipelineStages).toContain("deterministic-hashing");
  });

  it("omits knowledge-retrieval stage when no chunks match", () => {
    const shell = seedShell();
    const contract = createConsumerContract({
      shell,
      now: () => "2026-03-22T15:00:00.000Z",
    });
    const receipt = contract.consume({
      vibe: "no matching docs",
      consumerId: "empty-test",
      retrieval: { sources: ["nonexistent-source"] },
    });

    expect(receipt.pipelineStages).toContain("intent-validation");
    expect(receipt.pipelineStages).not.toContain("knowledge-retrieval");
    expect(receipt.pipelineStages).toContain("context-packaging");
  });

  it("produces deterministic evidence hash for identical inputs", () => {
    const shell = seedShell();
    const now = () => "2026-03-22T15:00:00.000Z";
    const request = {
      vibe: "determinism test",
      consumerId: "hash-test",
      tokenBudget: 256,
      retrieval: { sources: ["cp4-test"] },
    };

    const r1 = createConsumerContract({ shell, now }).consume(request);
    const r2 = createConsumerContract({ shell, now }).consume(request);

    expect(r1.evidenceHash).toBe(r2.evidenceHash);
  });

  it("freezes context when executionId is provided", () => {
    const shell = seedShell();
    const contract = createConsumerContract({
      shell,
      now: () => "2026-03-22T15:00:00.000Z",
    });
    const receipt = contract.consume({
      vibe: "freeze test",
      consumerId: "freeze-consumer",
      tokenBudget: 256,
      retrieval: { sources: ["cp4-test"] },
      executionId: "cp4-exec-001",
    });

    expect(receipt.freeze).toBeDefined();
    expect(receipt.freeze!.executionId).toBe("cp4-exec-001");
    expect(receipt.freeze!.frozenContextHash).toBeTruthy();
    expect(contract.getContext().has("cp4-exec-001")).toBe(true);
  });

  it("does not freeze context when executionId is absent", () => {
    const shell = seedShell();
    const contract = createConsumerContract({
      shell,
      now: () => "2026-03-22T15:00:00.000Z",
    });
    const receipt = contract.consume({
      vibe: "no freeze",
      consumerId: "no-freeze-consumer",
    });

    expect(receipt.freeze).toBeUndefined();
  });

  it("ConsumerContract is independently instantiable via factory", () => {
    const contract = createConsumerContract();
    expect(contract).toBeInstanceOf(ConsumerContract);
  });

  it("buildPipelineStages returns correct stages for a full intake result", () => {
    const shell = seedShell();
    const intakeContract = createControlPlaneIntakeContract({
      shell,
      now: () => "2026-03-22T15:00:00.000Z",
    });
    const intake = intakeContract.execute({
      vibe: "stages test",
      tokenBudget: 256,
      retrieval: { sources: ["cp4-test"] },
    });

    const stages = buildPipelineStages(intake);
    expect(stages).toEqual([
      "intent-validation",
      "knowledge-retrieval",
      "context-packaging",
      "deterministic-hashing",
    ]);
  });

  it("receipt includes the full intake result for downstream consumers", () => {
    const shell = seedShell();
    const contract = createConsumerContract({
      shell,
      now: () => "2026-03-22T15:00:00.000Z",
    });
    const receipt = contract.consume({
      vibe: "downstream consumer test",
      consumerId: "downstream-test",
      tokenBudget: 256,
      retrieval: { sources: ["cp4-test"] },
    });

    expect(receipt.intake).toBeDefined();
    expect(receipt.intake.requestId).toHaveLength(32);
    expect(receipt.intake.intent).toBeDefined();
    expect(receipt.intake.retrieval).toBeDefined();
    expect(receipt.intake.packagedContext).toBeDefined();
    expect(receipt.intake.warnings).toBeDefined();
  });
});

// ─── W1-T3 CP1: Design Contract Baseline ─────────────────────────────────────

describe("W1-T3 CP1: DesignContract", () => {
  function seedShell() {
    resetDocCounter();
    const shell = createControlPlaneFoundationShell();
    shell.knowledge.getStore().add({
      title: "Design Contract Test Doc",
      content: "This document supports design contract testing with relevant context.",
      tier: "T2_POLICY",
      documentType: "policy",
      domain: "code_security",
      tags: ["cp1-design"],
      metadata: { source: "design-test" },
    });
    return shell;
  }

  function makeIntakeResult(overrides: Record<string, unknown> = {}) {
    const shell = seedShell();
    const intakeContract = createControlPlaneIntakeContract({
      shell,
      now: () => "2026-03-22T16:00:00.000Z",
    });
    return intakeContract.execute({
      vibe: (overrides.vibe as string) ?? "analyze security vulnerabilities in backend code",
      consumerId: (overrides.consumerId as string) ?? "design-test-consumer",
      tokenBudget: (overrides.tokenBudget as number) ?? 256,
    });
  }

  it("createDesignContract returns a DesignContract instance", () => {
    const contract = createDesignContract();
    expect(contract).toBeInstanceOf(DesignContract);
  });

  it("produces a DesignPlan from a valid intake result", () => {
    const intake = makeIntakeResult();
    const contract = createDesignContract({
      now: () => "2026-03-22T16:01:00.000Z",
    });
    const plan = contract.design(intake);

    expect(plan.planId).toHaveLength(32);
    expect(plan.createdAt).toBe("2026-03-22T16:01:00.000Z");
    expect(plan.intakeRequestId).toBe(intake.requestId);
    expect(plan.consumerId).toBe("design-test-consumer");
    expect(plan.vibeOriginal).toBe(intake.intent.intent.rawVibe);
    expect(plan.domainDetected).toBe(intake.intent.intent.domain);
    expect(plan.tasks.length).toBeGreaterThanOrEqual(2);
    expect(plan.totalTasks).toBe(plan.tasks.length);
    expect(plan.planHash).toHaveLength(32);
  });

  it("decomposes tasks with correct agent role assignments", () => {
    const intake = makeIntakeResult();
    const contract = createDesignContract({
      now: () => "2026-03-22T16:02:00.000Z",
    });
    const plan = contract.design(intake);

    const roles = plan.tasks.map((t) => t.assignedRole);
    expect(roles).toContain("architect");
    expect(roles).toContain("builder");

    expect(plan.roleSummary.architect).toBeGreaterThanOrEqual(1);
    expect(plan.roleSummary.builder).toBeGreaterThanOrEqual(1);
  });

  it("assigns risk levels based on intake domain", () => {
    const intake = makeIntakeResult({
      vibe: "deploy production database migration",
    });
    const contract = createDesignContract({
      now: () => "2026-03-22T16:03:00.000Z",
    });
    const plan = contract.design(intake);

    for (const task of plan.tasks) {
      expect(["R0", "R1", "R2", "R3"]).toContain(task.riskLevel);
    }

    const totalRiskTasks = Object.values(plan.riskSummary).reduce(
      (a, b) => a + b,
      0,
    );
    expect(totalRiskTasks).toBe(plan.totalTasks);
  });

  it("includes review task for R2+ domains", () => {
    const intake = makeIntakeResult({
      vibe: "refactor authentication module for code security",
    });
    const contract = createDesignContract({
      now: () => "2026-03-22T16:04:00.000Z",
    });
    const plan = contract.design(intake);

    const reviewTasks = plan.tasks.filter(
      (t) => t.assignedRole === "reviewer",
    );
    if (
      plan.tasks.some(
        (t) => t.riskLevel === "R2" || t.riskLevel === "R3",
      )
    ) {
      expect(reviewTasks.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("task dependencies form a valid chain", () => {
    const intake = makeIntakeResult();
    const contract = createDesignContract({
      now: () => "2026-03-22T16:05:00.000Z",
    });
    const plan = contract.design(intake);

    const taskIds = new Set(plan.tasks.map((t) => t.taskId));
    for (const task of plan.tasks) {
      for (const dep of task.dependencies) {
        expect(taskIds.has(dep)).toBe(true);
      }
    }
  });

  it("produces deterministic plan hash for same input", () => {
    const intake = makeIntakeResult();
    const fixedNow = () => "2026-03-22T16:06:00.000Z";
    const plan1 = createDesignContract({ now: fixedNow }).design(intake);
    const plan2 = createDesignContract({ now: fixedNow }).design(intake);

    expect(plan1.planHash).toBe(plan2.planHash);
    expect(plan1.planId).toBe(plan2.planId);
  });

  it("generates warnings for invalid or low-confidence intake", () => {
    const shell = seedShell();
    const intakeContract = createControlPlaneIntakeContract({
      shell,
      now: () => "2026-03-22T16:07:00.000Z",
    });
    const intake = intakeContract.execute({
      vibe: "x",
      consumerId: "low-conf",
      tokenBudget: 256,
    });
    const contract = createDesignContract({
      now: () => "2026-03-22T16:07:01.000Z",
    });
    const plan = contract.design(intake);

    expect(plan.warnings.length).toBeGreaterThanOrEqual(1);
    expect(
      plan.warnings.some((w) =>
        w.includes("low-confidence") || w.includes("invalid"),
      ),
    ).toBe(true);
  });

  it("each task has all required fields", () => {
    const intake = makeIntakeResult();
    const contract = createDesignContract({
      now: () => "2026-03-22T16:08:00.000Z",
    });
    const plan = contract.design(intake);

    for (const task of plan.tasks) {
      expect(task.taskId).toHaveLength(32);
      expect(task.title).toBeTruthy();
      expect(task.description).toBeTruthy();
      expect(["orchestrator", "architect", "builder", "reviewer"]).toContain(
        task.assignedRole,
      );
      expect(["R0", "R1", "R2", "R3"]).toContain(task.riskLevel);
      expect(["DESIGN", "BUILD", "REVIEW"]).toContain(task.targetPhase);
      expect(["low", "medium", "high"]).toContain(task.estimatedComplexity);
      expect(Array.isArray(task.dependencies)).toBe(true);
    }
  });

  it("design plan with no context chunks produces a warning", () => {
    const shell = seedShell();
    const intakeContract = createControlPlaneIntakeContract({
      shell,
      now: () => "2026-03-22T16:09:00.000Z",
    });
    const intake = intakeContract.execute({
      vibe: "analyze general topic with no specific retrieval match",
      consumerId: "no-context",
      tokenBudget: 0,
    });
    const contract = createDesignContract({
      now: () => "2026-03-22T16:09:01.000Z",
    });
    const plan = contract.design(intake);

    if (intake.packagedContext.chunks.length === 0) {
      expect(
        plan.warnings.some((w) => w.includes("no retrieved context")),
      ).toBe(true);
    }
  });
});

// ─── W1-T3 CP2: Boardroom Session Contract ────────────────────────────────────

describe("W1-T3 CP2: BoardroomContract", () => {
  function seedShell() {
    resetDocCounter();
    const shell = createControlPlaneFoundationShell();
    shell.knowledge.getStore().add({
      title: "Boardroom Test Doc",
      content: "This document supports boardroom session testing.",
      tier: "T2_POLICY",
      documentType: "policy",
      domain: "code_security",
      tags: ["cp2-boardroom"],
      metadata: { source: "boardroom-test" },
    });
    return shell;
  }

  function makeDesignPlan(overrides: Record<string, unknown> = {}) {
    const shell = seedShell();
    const intake = createControlPlaneIntakeContract({
      shell,
      now: () => "2026-03-22T17:00:00.000Z",
    }).execute({
      vibe: (overrides.vibe as string) ?? "analyze code security patterns",
      consumerId: (overrides.consumerId as string) ?? "boardroom-test",
      tokenBudget: 256,
    });
    return createDesignContract({
      now: () => "2026-03-22T17:01:00.000Z",
    }).design(intake);
  }

  it("createBoardroomContract returns a BoardroomContract instance", () => {
    const contract = createBoardroomContract();
    expect(contract).toBeInstanceOf(BoardroomContract);
  });

  it("produces a BoardroomSession with PROCEED for a clean plan", () => {
    const plan = makeDesignPlan();
    const contract = createBoardroomContract({
      now: () => "2026-03-22T17:02:00.000Z",
    });
    const session = contract.review({ plan });

    expect(session.sessionId).toHaveLength(32);
    expect(session.createdAt).toBe("2026-03-22T17:02:00.000Z");
    expect(session.planId).toBe(plan.planId);
    expect(session.decision.decision).toBe("PROCEED");
    expect(session.finalPlan).toBeDefined();
    expect(session.sessionHash).toHaveLength(32);
  });

  it("processes clarifications and marks answered vs pending", () => {
    const plan = makeDesignPlan();
    const contract = createBoardroomContract({
      now: () => "2026-03-22T17:03:00.000Z",
    });
    const session = contract.review({
      plan,
      clarifications: [
        { question: "What is the target architecture?", answer: "Microservices" },
        { question: "What about scalability?" },
      ],
    });

    expect(session.clarifications).toHaveLength(2);
    expect(session.clarifications[0].status).toBe("answered");
    expect(session.clarifications[1].status).toBe("pending");
  });

  it("amends plan when clarifications are pending", () => {
    const plan = makeDesignPlan();
    const contract = createBoardroomContract({
      now: () => "2026-03-22T17:04:00.000Z",
    });
    const session = contract.review({
      plan,
      clarifications: [{ question: "Unresolved question" }],
    });

    expect(session.decision.decision).toBe("AMEND_PLAN");
    expect(session.warnings.some((w) => w.includes("unanswered"))).toBe(true);
  });

  it("includes governance snapshot from canvas", () => {
    const plan = makeDesignPlan();
    const contract = createBoardroomContract({
      now: () => "2026-03-22T17:05:00.000Z",
    });
    const session = contract.review({ plan });

    expect(session.governanceSnapshot).toBeDefined();
    expect(session.governanceSnapshot.totalSessions).toBeGreaterThanOrEqual(1);
  });

  it("produces deterministic session hash for same input", () => {
    const plan = makeDesignPlan();
    const fixedNow = () => "2026-03-22T17:06:00.000Z";
    const s1 = createBoardroomContract({ now: fixedNow }).review({ plan });
    const s2 = createBoardroomContract({ now: fixedNow }).review({ plan });

    expect(s1.sessionHash).toBe(s2.sessionHash);
  });

  it("carries design plan warnings into session warnings", () => {
    const shell = seedShell();
    const intake = createControlPlaneIntakeContract({
      shell,
      now: () => "2026-03-22T17:07:00.000Z",
    }).execute({
      vibe: "x",
      consumerId: "warn-test",
      tokenBudget: 256,
    });
    const plan = createDesignContract({
      now: () => "2026-03-22T17:07:01.000Z",
    }).design(intake);

    const contract = createBoardroomContract({
      now: () => "2026-03-22T17:07:02.000Z",
    });
    const session = contract.review({ plan });

    expect(session.warnings.some((w) => w.includes("warning(s)"))).toBe(true);
  });

  it("session with no clarifications has empty clarifications array", () => {
    const plan = makeDesignPlan();
    const contract = createBoardroomContract({
      now: () => "2026-03-22T17:08:00.000Z",
    });
    const session = contract.review({ plan });

    expect(session.clarifications).toHaveLength(0);
  });
});

// ─── W1-T3 CP3: Orchestration Contract ────────────────────────────────────────

describe("W1-T3 CP3: OrchestrationContract", () => {
  function seedShell() {
    resetDocCounter();
    const shell = createControlPlaneFoundationShell();
    shell.knowledge.getStore().add({
      title: "Orchestration Test Doc",
      content: "This document supports orchestration contract testing.",
      tier: "T2_POLICY",
      documentType: "policy",
      domain: "code_security",
      tags: ["cp3-orchestration"],
      metadata: { source: "orchestration-test" },
    });
    return shell;
  }

  function makeDesignPlan(overrides: Record<string, unknown> = {}) {
    const shell = seedShell();
    const intake = createControlPlaneIntakeContract({
      shell,
      now: () => "2026-03-22T18:00:00.000Z",
    }).execute({
      vibe: (overrides.vibe as string) ?? "analyze code security patterns",
      consumerId: (overrides.consumerId as string) ?? "orchestration-test",
      tokenBudget: 256,
    });
    return createDesignContract({
      now: () => "2026-03-22T18:01:00.000Z",
    }).design(intake);
  }

  it("createOrchestrationContract returns an OrchestrationContract instance", () => {
    const contract = createOrchestrationContract();
    expect(contract).toBeInstanceOf(OrchestrationContract);
  });

  it("produces task assignments from a design plan", () => {
    const plan = makeDesignPlan();
    const contract = createOrchestrationContract({
      now: () => "2026-03-22T18:02:00.000Z",
    });
    const result = contract.orchestrate(plan);

    expect(result.orchestrationId).toHaveLength(32);
    expect(result.createdAt).toBe("2026-03-22T18:02:00.000Z");
    expect(result.planId).toBe(plan.planId);
    expect(result.assignments.length).toBe(plan.totalTasks);
    expect(result.totalAssignments).toBe(plan.totalTasks);
    expect(result.orchestrationHash).toHaveLength(32);
  });

  it("each assignment has correct fields and execution auth hash", () => {
    const plan = makeDesignPlan();
    const contract = createOrchestrationContract({
      now: () => "2026-03-22T18:03:00.000Z",
    });
    const result = contract.orchestrate(plan);

    for (const a of result.assignments) {
      expect(a.assignmentId).toHaveLength(32);
      expect(a.taskId).toHaveLength(32);
      expect(a.title).toBeTruthy();
      expect(["orchestrator", "architect", "builder", "reviewer"]).toContain(a.assignedRole);
      expect(["DESIGN", "BUILD", "REVIEW"]).toContain(a.targetPhase);
      expect(["R0", "R1", "R2", "R3"]).toContain(a.riskLevel);
      expect(Array.isArray(a.scopeConstraints)).toBe(true);
      expect(a.scopeConstraints.length).toBeGreaterThanOrEqual(3);
      expect(a.executionAuthorizationHash).toHaveLength(32);
    }
  });

  it("scope constraints include phase, risk, and role", () => {
    const plan = makeDesignPlan();
    const contract = createOrchestrationContract({
      now: () => "2026-03-22T18:04:00.000Z",
    });
    const result = contract.orchestrate(plan);

    for (const a of result.assignments) {
      expect(a.scopeConstraints.some((c) => c.startsWith("phase:"))).toBe(true);
      expect(a.scopeConstraints.some((c) => c.startsWith("risk:"))).toBe(true);
      expect(a.scopeConstraints.some((c) => c.startsWith("role:"))).toBe(true);
    }
  });

  it("phase/role/risk breakdowns sum to total assignments", () => {
    const plan = makeDesignPlan();
    const contract = createOrchestrationContract({
      now: () => "2026-03-22T18:05:00.000Z",
    });
    const result = contract.orchestrate(plan);

    const phaseSum = Object.values(result.phaseBreakdown).reduce((a, b) => a + b, 0);
    const roleSum = Object.values(result.roleBreakdown).reduce((a, b) => a + b, 0);
    const riskSum = Object.values(result.riskBreakdown).reduce((a, b) => a + b, 0);
    expect(phaseSum).toBe(result.totalAssignments);
    expect(roleSum).toBe(result.totalAssignments);
    expect(riskSum).toBe(result.totalAssignments);
  });

  it("produces deterministic orchestration hash for same input", () => {
    const plan = makeDesignPlan();
    const fixedNow = () => "2026-03-22T18:06:00.000Z";
    const r1 = createOrchestrationContract({ now: fixedNow }).orchestrate(plan);
    const r2 = createOrchestrationContract({ now: fixedNow }).orchestrate(plan);

    expect(r1.orchestrationHash).toBe(r2.orchestrationHash);
    expect(r1.orchestrationId).toBe(r2.orchestrationId);
  });

  it("carries design plan warnings into orchestration warnings", () => {
    const shell = seedShell();
    const intake = createControlPlaneIntakeContract({
      shell,
      now: () => "2026-03-22T18:07:00.000Z",
    }).execute({
      vibe: "x",
      consumerId: "warn-test",
      tokenBudget: 256,
    });
    const plan = createDesignContract({
      now: () => "2026-03-22T18:07:01.000Z",
    }).design(intake);

    const result = createOrchestrationContract({
      now: () => "2026-03-22T18:07:02.000Z",
    }).orchestrate(plan);

    expect(result.warnings.some((w) => w.includes("warning(s)"))).toBe(true);
  });

  it("warns about blocked assignments with dependencies", () => {
    const plan = makeDesignPlan();
    const result = createOrchestrationContract({
      now: () => "2026-03-22T18:08:00.000Z",
    }).orchestrate(plan);

    const blocked = result.assignments.filter((a) => a.dependencies.length > 0);
    if (blocked.length > 0) {
      expect(result.warnings.some((w) => w.includes("dependencies"))).toBe(true);
    }
  });
});

// ─── W1-T3 CP4: Design-to-Orchestration Consumer Path Proof ───────────────────

describe("W1-T3 CP4: DesignConsumerContract", () => {
  function seedShell() {
    resetDocCounter();
    const shell = createControlPlaneFoundationShell();
    shell.knowledge.getStore().add({
      title: "Consumer Path Doc",
      content: "This document supports design consumer path proof testing.",
      tier: "T2_POLICY",
      documentType: "policy",
      domain: "code_security",
      tags: ["cp4-consumer"],
      metadata: { source: "consumer-test" },
    });
    return shell;
  }

  function makeIntake(overrides: Record<string, unknown> = {}) {
    const shell = seedShell();
    return createControlPlaneIntakeContract({
      shell,
      now: () => "2026-03-22T19:00:00.000Z",
    }).execute({
      vibe: (overrides.vibe as string) ?? "analyze code security patterns",
      consumerId: (overrides.consumerId as string) ?? "consumer-path-test",
      tokenBudget: 256,
    });
  }

  it("createDesignConsumerContract returns a DesignConsumerContract instance", () => {
    const contract = createDesignConsumerContract();
    expect(contract).toBeInstanceOf(DesignConsumerContract);
  });

  it("consumes intake and produces a full design consumption receipt", () => {
    const intake = makeIntake();
    const contract = createDesignConsumerContract({
      now: () => "2026-03-22T19:01:00.000Z",
    });
    const receipt = contract.consume(intake);

    expect(receipt.receiptId).toHaveLength(32);
    expect(receipt.createdAt).toBe("2026-03-22T19:01:00.000Z");
    expect(receipt.consumerId).toBe("consumer-path-test");
    expect(receipt.designPlan).toBeDefined();
    expect(receipt.boardroomSession).toBeDefined();
    expect(receipt.orchestrationResult).toBeDefined();
    expect(receipt.evidenceHash).toHaveLength(32);
  });

  it("pipeline stages cover all four phases in order", () => {
    const intake = makeIntake();
    const contract = createDesignConsumerContract({
      now: () => "2026-03-22T19:02:00.000Z",
    });
    const receipt = contract.consume(intake);

    expect(receipt.pipelineStages).toHaveLength(4);
    expect(receipt.pipelineStages[0].stage).toBe("INTAKE");
    expect(receipt.pipelineStages[1].stage).toBe("DESIGN");
    expect(receipt.pipelineStages[2].stage).toBe("BOARDROOM");
    expect(receipt.pipelineStages[3].stage).toBe("ORCHESTRATION");
  });

  it("orchestration assignments match the design plan task count", () => {
    const intake = makeIntake();
    const contract = createDesignConsumerContract({
      now: () => "2026-03-22T19:03:00.000Z",
    });
    const receipt = contract.consume(intake);

    expect(receipt.orchestrationResult.totalAssignments).toBe(
      receipt.designPlan.totalTasks,
    );
  });

  it("boardroom session references the design plan ID", () => {
    const intake = makeIntake();
    const contract = createDesignConsumerContract({
      now: () => "2026-03-22T19:04:00.000Z",
    });
    const receipt = contract.consume(intake);

    expect(receipt.boardroomSession.planId).toBe(receipt.designPlan.planId);
  });

  it("produces deterministic evidence hash for same input", () => {
    const intake = makeIntake();
    const fixedNow = () => "2026-03-22T19:05:00.000Z";
    const r1 = createDesignConsumerContract({ now: fixedNow }).consume(intake);
    const r2 = createDesignConsumerContract({ now: fixedNow }).consume(intake);

    expect(r1.evidenceHash).toBe(r2.evidenceHash);
    expect(r1.receiptId).toBe(r2.receiptId);
  });

  it("passes clarifications through to boardroom", () => {
    const intake = makeIntake();
    const contract = createDesignConsumerContract({
      now: () => "2026-03-22T19:06:00.000Z",
      clarifications: [
        { question: "What is the deployment target?", answer: "Cloud" },
      ],
    });
    const receipt = contract.consume(intake);

    expect(receipt.boardroomSession.clarifications).toHaveLength(1);
    expect(receipt.boardroomSession.clarifications[0].status).toBe("answered");
  });

  it("aggregates warnings from all pipeline phases", () => {
    const shell = seedShell();
    const intake = createControlPlaneIntakeContract({
      shell,
      now: () => "2026-03-22T19:07:00.000Z",
    }).execute({
      vibe: "x",
      consumerId: "warn-test",
      tokenBudget: 256,
    });

    const receipt = createDesignConsumerContract({
      now: () => "2026-03-22T19:07:01.000Z",
    }).consume(intake);

    expect(receipt.warnings.length).toBeGreaterThanOrEqual(1);
  });

  it("warns when boardroom decision is not PROCEED", () => {
    const intake = makeIntake();
    const contract = createDesignConsumerContract({
      now: () => "2026-03-22T19:08:00.000Z",
      clarifications: [{ question: "Unanswered" }],
    });
    const receipt = contract.consume(intake);

    expect(
      receipt.warnings.some((w) => w.includes("did not PROCEED")),
    ).toBe(true);
  });
});

describe("W1-T4 CP1 — AIGatewayContract", () => {
  it("processes a clean signal and returns a GatewayProcessedRequest", () => {
    const gateway = createAIGatewayContract();
    const result = gateway.process({ rawSignal: "Build a governed AI platform for document review" });

    expect(result.gatewayId).toBeTruthy();
    expect(result.normalizedSignal).toBe("Build a governed AI platform for document review");
    expect(result.signalType).toBe("vibe");
    expect(result.gatewayHash).toBeTruthy();
    expect(result.privacyReport.filtered).toBe(false);
    expect(result.privacyReport.maskedTokenCount).toBe(0);
  });

  it("masks email addresses when maskPII is true (default)", () => {
    const gateway = createAIGatewayContract();
    const result = gateway.process({
      rawSignal: "Contact user@example.com to confirm deployment",
    });

    expect(result.normalizedSignal).toContain("[PII_EMAIL]");
    expect(result.normalizedSignal).not.toContain("user@example.com");
    expect(result.privacyReport.filtered).toBe(true);
    expect(result.privacyReport.maskedTokenCount).toBeGreaterThan(0);
  });

  it("masks secret tokens when maskSecrets is true (default)", () => {
    const gateway = createAIGatewayContract();
    const result = gateway.process({
      rawSignal: "Use skTESTtoken123abcXYZ789012345 for the API call",
    });

    expect(result.normalizedSignal).toContain("[SECRET_MASKED]");
    expect(result.privacyReport.filtered).toBe(true);
  });

  it("applies custom redactPatterns", () => {
    const gateway = createAIGatewayContract();
    const result = gateway.process({
      rawSignal: "Order ID: ORD-12345 needs processing",
      privacyConfig: { maskPII: false, maskSecrets: false, redactPatterns: ["ORD-\\d+"] },
    });

    expect(result.normalizedSignal).toContain("[REDACTED]");
    expect(result.normalizedSignal).not.toContain("ORD-12345");
  });

  it("enriches with env metadata defaults when no context provided", () => {
    const gateway = createAIGatewayContract();
    const result = gateway.process({ rawSignal: "Design a new intake flow" });

    expect(result.envMetadata.platform).toBe("cvf");
    expect(result.envMetadata.phase).toBe("INTAKE");
    expect(result.envMetadata.riskLevel).toBe("R1");
    expect(result.envMetadata.locale).toBe("en");
  });

  it("uses provided env context when supplied", () => {
    const gateway = createAIGatewayContract();
    const result = gateway.process({
      rawSignal: "Deploy to staging",
      envContext: { platform: "production", phase: "BUILD", riskLevel: "R3", locale: "vi" },
    });

    expect(result.envMetadata.platform).toBe("production");
    expect(result.envMetadata.phase).toBe("BUILD");
    expect(result.envMetadata.riskLevel).toBe("R3");
    expect(result.envMetadata.locale).toBe("vi");
  });

  it("handles empty signal with warning", () => {
    const gateway = createAIGatewayContract();
    const result = gateway.process({ rawSignal: "" });

    expect(result.normalizedSignal).toBe("");
    expect(result.warnings.some((w) => w.includes("empty signal"))).toBe(true);
  });

  it("produces stable gatewayHash for identical inputs", () => {
    const fixedTime = "2026-03-22T10:00:00.000Z";
    const g1 = createAIGatewayContract({ now: () => fixedTime });
    const g2 = createAIGatewayContract({ now: () => fixedTime });

    const r1 = g1.process({ rawSignal: "Build a deployment pipeline", consumerId: "test" });
    const r2 = g2.process({ rawSignal: "Build a deployment pipeline", consumerId: "test" });

    expect(r1.gatewayHash).toBe(r2.gatewayHash);
  });

  it("accepts injectable privacy filter", () => {
    let called = false;
    const customFilter = (signal: string) => {
      called = true;
      return { filtered: signal.replace("SECRET", "[CUSTOM_MASKED]"), report: { filtered: true, maskedTokenCount: 1, appliedPatterns: ["[CUSTOM_MASKED]"] } };
    };
    const gateway = createAIGatewayContract({ applyPrivacyFilter: customFilter });
    gateway.process({ rawSignal: "Use SECRET key here" });

    expect(called).toBe(true);
  });

  it("creates AIGatewayContract via class constructor", () => {
    const contract = new AIGatewayContract();
    expect(contract).toBeInstanceOf(AIGatewayContract);
    const result = contract.process({ rawSignal: "Test signal" });
    expect(result.gatewayId).toBeTruthy();
  });

  it("preserves sessionId and agentId in processed request", () => {
    const gateway = createAIGatewayContract();
    const result = gateway.process({
      rawSignal: "Analyze project risk",
      sessionId: "session-001",
      agentId: "agent-planner",
      consumerId: "w1-t4-test",
    });

    expect(result.sessionId).toBe("session-001");
    expect(result.agentId).toBe("agent-planner");
    expect(result.consumerId).toBe("w1-t4-test");
  });
});

describe("W1-T4 CP2 — GatewayConsumerContract", () => {
  it("produces a GatewayConsumptionReceipt from a signal", () => {
    const consumer = createGatewayConsumerContract();
    const receipt = consumer.consume({ rawSignal: "Build a governed AI intake flow", consumerId: "w1-t4-cp2-test" });

    expect(receipt.receiptId).toBeTruthy();
    expect(receipt.consumerId).toBe("w1-t4-cp2-test");
    expect(receipt.consumptionHash).toBeTruthy();
    expect(receipt.gatewayRequest).toBeTruthy();
    expect(receipt.intakeResult).toBeTruthy();
  });

  it("tracks 3 pipeline stages", () => {
    const consumer = createGatewayConsumerContract();
    const receipt = consumer.consume({ rawSignal: "Govern the deployment process end to end" });

    expect(receipt.stages).toHaveLength(3);
    const stageNames = receipt.stages.map((s) => s.stage);
    expect(stageNames).toContain("SIGNAL_PROCESSED");
    expect(stageNames).toContain("INTAKE_EXECUTED");
    expect(stageNames).toContain("RECEIPT_ISSUED");
  });

  it("gateway request inside receipt has correct normalized signal", () => {
    const consumer = createGatewayConsumerContract();
    const receipt = consumer.consume({ rawSignal: "Create a review workflow for contracts" });

    expect(receipt.gatewayRequest.normalizedSignal).toBe("Create a review workflow for contracts");
    expect(receipt.intakeResult.intent).toBeTruthy();
  });

  it("gateway portion of receipt has stable hash for identical inputs", () => {
    const fixedTime = "2026-03-22T10:00:00.000Z";
    const c1 = createGatewayConsumerContract({ now: () => fixedTime });
    const c2 = createGatewayConsumerContract({ now: () => fixedTime });

    const r1 = c1.consume({ rawSignal: "Build a review engine", consumerId: "stable-test" });
    const r2 = c2.consume({ rawSignal: "Build a review engine", consumerId: "stable-test" });

    // gatewayHash is fully deterministic; consumptionHash includes RAG-pipeline state
    expect(r1.gatewayRequest.gatewayHash).toBe(r2.gatewayRequest.gatewayHash);
    expect(r1.consumptionHash).toBeTruthy();
    expect(r2.consumptionHash).toBeTruthy();
  });

  it("propagates gateway warnings into receipt warnings", () => {
    const consumer = createGatewayConsumerContract();
    const receipt = consumer.consume({
      rawSignal: "Contact admin@corp.example.com for approval",
    });

    expect(receipt.warnings.some((w) => w.includes("[gateway]"))).toBe(true);
  });

  it("creates GatewayConsumerContract via class constructor", () => {
    const contract = new GatewayConsumerContract();
    expect(contract).toBeInstanceOf(GatewayConsumerContract);
    const receipt = contract.consume({ rawSignal: "Test gateway consumer" });
    expect(receipt.receiptId).toBeTruthy();
  });

  // ─── W1-T5 CP1 — ReversePromptingContract ───────────────────────────────

  describe("W1-T5 CP1 — ReversePromptingContract", () => {
    function makeIntakeResult(overrides: Partial<{
      valid: boolean;
      domain: string;
      chunkCount: number;
      truncated: boolean;
      warnings: string[];
    }> = {}) {
      const valid = overrides.valid ?? true;
      const domain = overrides.domain ?? "finance";
      const chunkCount = overrides.chunkCount ?? 3;
      const truncated = overrides.truncated ?? false;
      const warnings = overrides.warnings ?? [];
      return {
        requestId: "req-test-001",
        createdAt: "2026-03-22T10:00:00.000Z",
        intent: {
          valid,
          intent: { domain, action: "create", object: "report", rawVibe: "create finance report" },
          rules: [],
          constraints: [],
          errors: [],
        },
        retrieval: {
          query: "finance report",
          chunkCount,
          totalCandidates: chunkCount,
          retrievalTimeMs: 5,
          tiersSearched: ["T1_EXACT"] as const,
          chunks: [],
        },
        packagedContext: {
          chunks: [],
          totalTokens: 100,
          tokenBudget: 256,
          truncated,
          snapshotHash: "hash-001",
        },
        warnings,
      };
    }

    it("generates no questions for a clean intake result", () => {
      const contract = createReversePromptingContract();
      const result = makeIntakeResult();
      const packet = contract.generate(result as any);

      expect(packet.totalQuestions).toBe(0);
      expect(packet.questions).toHaveLength(0);
      expect(packet.highPriorityCount).toBe(0);
    });

    it("generates intent_clarity question when intent is invalid", () => {
      const contract = createReversePromptingContract();
      const result = makeIntakeResult({ valid: false });
      const packet = contract.generate(result as any);

      expect(packet.questions.some((q) => q.category === "intent_clarity")).toBe(true);
      expect(packet.questions.find((q) => q.category === "intent_clarity")!.priority).toBe("high");
    });

    it("generates domain_specificity question for general domain", () => {
      const contract = createReversePromptingContract();
      const result = makeIntakeResult({ domain: "general" });
      const packet = contract.generate(result as any);

      expect(packet.questions.some((q) => q.category === "domain_specificity")).toBe(true);
    });

    it("generates context_gap question when retrieval is empty", () => {
      const contract = createReversePromptingContract();
      const result = makeIntakeResult({ chunkCount: 0 });
      const packet = contract.generate(result as any);

      expect(packet.questions.some((q) => q.category === "context_gap")).toBe(true);
      expect(packet.questions.find((q) => q.category === "context_gap")!.priority).toBe("high");
    });

    it("generates scope_boundary question when context is truncated", () => {
      const contract = createReversePromptingContract();
      const result = makeIntakeResult({ truncated: true });
      const packet = contract.generate(result as any);

      expect(packet.questions.some((q) => q.category === "scope_boundary")).toBe(true);
      expect(packet.questions.find((q) => q.category === "scope_boundary")!.priority).toBe("medium");
    });

    it("generates risk_acknowledgement question when warnings are present", () => {
      const contract = createReversePromptingContract();
      const result = makeIntakeResult({ warnings: ["Low confidence intent.", "No chunks found."] });
      const packet = contract.generate(result as any);

      expect(packet.questions.some((q) => q.category === "risk_acknowledgement")).toBe(true);
    });

    it("generates multiple questions for multiple signals", () => {
      const contract = createReversePromptingContract();
      const result = makeIntakeResult({ valid: false, chunkCount: 0, warnings: ["Some warning."] });
      const packet = contract.generate(result as any);

      expect(packet.totalQuestions).toBeGreaterThanOrEqual(3);
      expect(packet.highPriorityCount).toBeGreaterThanOrEqual(2);
    });

    it("packet has stable packetId for identical inputs with fixed time", () => {
      const fixedTime = "2026-03-22T10:00:00.000Z";
      const c1 = createReversePromptingContract({ now: () => fixedTime });
      const c2 = createReversePromptingContract({ now: () => fixedTime });
      const result = makeIntakeResult({ valid: false });

      const p1 = c1.generate(result as any);
      const p2 = c2.generate(result as any);

      expect(p1.packetId).toBe(p2.packetId);
    });

    it("each question has a non-empty questionId", () => {
      const contract = createReversePromptingContract();
      const result = makeIntakeResult({ valid: false, chunkCount: 0, truncated: true });
      const packet = contract.generate(result as any);

      for (const q of packet.questions) {
        expect(q.questionId.length).toBeGreaterThan(0);
        expect(q.signal.length).toBeGreaterThan(0);
      }
    });

    it("accepts injectable analyzeSignals override", () => {
      const contract = createReversePromptingContract({
        analyzeSignals: () => ({
          intentValid: false,
          domainDetected: "general",
          retrievalEmpty: true,
          contextTruncated: true,
          hasWarnings: true,
          warningCount: 2,
        }),
      });
      const result = makeIntakeResult();
      const packet = contract.generate(result as any);

      // All 5 signal types triggered
      expect(packet.totalQuestions).toBe(5);
    });

    it("creates ReversePromptingContract via class constructor", () => {
      const contract = new ReversePromptingContract();
      expect(contract).toBeInstanceOf(ReversePromptingContract);
    });
  });

  // ─── W1-T5 CP2 — ClarificationRefinementContract ────────────────────────

  describe("W1-T5 CP2 — ClarificationRefinementContract", () => {
    function makePacket(questionCount: number) {
      const questions = Array.from({ length: questionCount }, (_, i) => ({
        questionId: `q-${i}`,
        category: "intent_clarity" as const,
        priority: "high" as const,
        question: `Question ${i}?`,
        signal: `signal-${i}`,
      }));
      return {
        packetId: "packet-001",
        createdAt: "2026-03-22T10:00:00.000Z",
        sourceRequestId: "req-001",
        questions,
        totalQuestions: questionCount,
        highPriorityCount: questionCount,
        signalAnalysis: {
          intentValid: false,
          domainDetected: "general",
          retrievalEmpty: true,
          contextTruncated: false,
          hasWarnings: false,
          warningCount: 0,
        },
      };
    }

    it("returns a RefinedIntakeRequest with correct counts when all answered", () => {
      const contract = createClarificationRefinementContract();
      const packet = makePacket(3);
      const answers = [
        { questionId: "q-0", answer: "I want to create a deployment plan." },
        { questionId: "q-1", answer: "The domain is DevOps." },
        { questionId: "q-2", answer: "Focus on the rollback steps." },
      ];
      const refined = contract.refine(packet, answers);

      expect(refined.answeredCount).toBe(3);
      expect(refined.skippedCount).toBe(0);
      expect(refined.confidenceBoost).toBeCloseTo(1.0);
    });

    it("counts partially answered questions correctly", () => {
      const contract = createClarificationRefinementContract();
      const packet = makePacket(4);
      const answers = [
        { questionId: "q-0", answer: "Answer to first." },
        { questionId: "q-1", answer: "" }, // empty → skipped
      ];
      const refined = contract.refine(packet, answers);

      expect(refined.answeredCount).toBe(1);
      expect(refined.skippedCount).toBe(3); // q-1 empty + q-2 + q-3 not provided
      expect(refined.confidenceBoost).toBeCloseTo(0.25);
    });

    it("returns zero confidence boost when no answers provided", () => {
      const contract = createClarificationRefinementContract();
      const packet = makePacket(2);
      const refined = contract.refine(packet, []);

      expect(refined.confidenceBoost).toBe(0);
      expect(refined.answeredCount).toBe(0);
    });

    it("enrichments carry correct category from packet questions", () => {
      const contract = createClarificationRefinementContract();
      const packet = makePacket(1);
      const refined = contract.refine(packet, [{ questionId: "q-0", answer: "My answer." }]);

      expect(refined.enrichments[0].category).toBe("intent_clarity");
      expect(refined.enrichments[0].applied).toBe(true);
    });

    it("refinedId is stable for identical inputs with fixed time", () => {
      const fixedTime = "2026-03-22T10:00:00.000Z";
      const c1 = createClarificationRefinementContract({ now: () => fixedTime });
      const c2 = createClarificationRefinementContract({ now: () => fixedTime });
      const packet = makePacket(2);
      const answers = [{ questionId: "q-0", answer: "Same answer." }];

      const r1 = c1.refine(packet, answers);
      const r2 = c2.refine(packet, answers);

      expect(r1.refinedId).toBe(r2.refinedId);
    });

    it("creates ClarificationRefinementContract via class constructor", () => {
      const contract = new ClarificationRefinementContract();
      expect(contract).toBeInstanceOf(ClarificationRefinementContract);
    });
  });
});
