import { describe, expect, it } from "vitest";

import {
  AIGatewayContract,
  BoardroomBatchContract,
  BoardroomContract,
  BoardroomMultiRoundBatchContract,
  BoardroomTransitionGateBatchContract,
  CONTROL_PLANE_FOUNDATION_COORDINATION,
  CONTROL_PLANE_SELECTED_INTELLIGENCE_ALIGNMENT,
  ClarificationRefinementContract,
  ControlledIntelligenceAgentRole,
  DesignBatchContract,
  DesignConsumerContract,
  DesignContract,
  ExternalAssetIntakeProfileContract,
  WindowsCompatibilityConsumerPipelineBatchContract,
  WindowsCompatibilityConsumerPipelineContract,
  WindowsCompatibilityEvaluationBatchContract,
  WindowsCompatibilityEvaluationContract,
  GatewayAuthBatchContract,
  GatewayAuthContract,
  GatewayConsumerContract,
  GatewayPIIDetectionBatchContract,
  GatewayPIIDetectionContract,
  KnowledgeQueryBatchContract,
  KnowledgeQueryContract,
  ModelGatewayBoundaryContract,
  OrchestrationBatchContract,
  OrchestrationContract,
  PlannerTriggerHeuristicsContract,
  ReasoningMode,
  ReversePromptingBatchContract,
  ReversePromptingContract,
  RouteMatchBatchContract,
  RouteMatchContract,
  TrustIsolationBoundaryContract,
  buildPipelineStages,
  canAccessScope,
  createAIGatewayContract,
  createBoardroomBatchContract,
  createBoardroomContract,
  createBoardroomMultiRoundBatchContract,
  createBoardroomTransitionGateBatchContract,
  createClarificationRefinementContract,
  createConsumerContract,
  createControlPlaneEvidenceSurface,
  createControlPlaneFoundationShell,
  createControlPlaneIntakeContract,
  createExternalAssetIntakeProfileContract,
  createWindowsCompatibilityConsumerPipelineBatchContract,
  createWindowsCompatibilityConsumerPipelineContract,
  createWindowsCompatibilityEvaluationBatchContract,
  createWindowsCompatibilityEvaluationContract,
  createDesignBatchContract,
  createDesignConsumerContract,
  createDesignContract,
  createGatewayAuthBatchContract,
  createGatewayAuthContract,
  createGatewayConsumerContract,
  createGatewayPIIDetectionBatchContract,
  createGatewayPIIDetectionContract,
  createKnowledgeQueryBatchContract,
  createKnowledgeQueryContract,
  createModelGatewayBoundaryContract,
  createOrchestrationBatchContract,
  createOrchestrationContract,
  createPackagingContract,
  createPlannerTriggerHeuristicsContract,
  createRetrievalContract,
  createReversePromptingBatchContract,
  createReversePromptingContract,
  createRouteMatchBatchContract,
  createRouteMatchContract,
  createTrustIsolationBoundaryContract,
  formatRiskDisplay,
  getRiskLabel,
  normalizeRuntimeScore,
  resetDocCounter,
  resolveReasoningMode,
  runtimeToCVFRisk,
  scoreToRiskLevel,
  segmentContext,
} from "../src/index";
import {
  FIXED_NOW,
  makeSessionSnapshot,
} from "./helpers/control.plane.foundation.fixtures";

describe("CVF_CONTROL_PLANE_FOUNDATION public surface", () => {
  it("creates one usable foundation shell", () => {
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

    const result = shell.intent.validate(
      "Approve finance spend only after manager review and keep the limit below 500 dollars.",
    );
    const query = shell.knowledge.querySimple("manager review", "finance", 3);
    const freezeHash = shell.context.freeze(
      "cp1-test",
      { "docs/policy.md": "abc123" },
      "policy-v1",
      { env: "test" },
    );

    expect(result.intent.domain).toBe("finance");
    expect(query.documents).toHaveLength(1);
    expect(freezeHash).toHaveLength(16);

    shell.context._clearAll();
  });

  it("publishes lineage metadata and evidence surface for tranche review", () => {
    const evidence = createControlPlaneEvidenceSurface(
      [
        makeSessionSnapshot({
          sessionId: "cp3-session-1",
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
        }),
      ],
      {
        knowledgeSources: ["EXTENSIONS/CVF_ECO_v1.4_RAG_PIPELINE"],
        frozenContextHashes: ["freeze-abc123"],
        notes: ["CP3 keeps governance-core semantics unchanged."],
      },
    );

    expect(CONTROL_PLANE_FOUNDATION_COORDINATION.executionClass).toBe(
      "coordination package",
    );
    expect(
      CONTROL_PLANE_FOUNDATION_COORDINATION.initialPhysicalMoveExcluded,
    ).toContain("EXTENSIONS/CVF_v1.7_CONTROLLED_INTELLIGENCE");
    expect(evidence.report.metrics.totalSessions).toBe(1);
    expect(evidence.markdownSurface).toContain("## Governance Canvas Report");
  });

  it("keeps selected intelligence wrappers aligned to the shell", () => {
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
      },
    );

    expect(scoreToRiskLevel(0.72)).toBe("R2");
    expect(getRiskLabel("R2", "en").label).toBe("Review Required");
    expect(formatRiskDisplay("R1", "vi")).toContain("Cần chú ý");
    expect(runtimeToCVFRisk("HIGH")).toBe("R2");
    expect(normalizeRuntimeScore(120)).toBeGreaterThan(0);
    expect(
      CONTROL_PLANE_SELECTED_INTELLIGENCE_ALIGNMENT.deferredSurfaces,
    ).toContain("intelligence/reasoning_gate/controlled.reasoning");
    expect(resolveReasoningMode(ControlledIntelligenceAgentRole.REVIEW)).toBe(
      ReasoningMode.STRICT,
    );
    expect(segmented.prunedChunks).toHaveLength(20);
    expect(
      canAccessScope(
        { forkId: "fork-1", allowedScopes: ["finance", "governance"] },
        "governance",
      ),
    ).toBe(true);
  });
});

describe("CVF_CONTROL_PLANE_FOUNDATION public barrel workflow smoke", () => {
  it("keeps intake, retrieval, packaging, and consumer factories callable from src/index", () => {
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

    const intake = createControlPlaneIntakeContract({
      shell,
      now: () => FIXED_NOW,
    }).execute({
      vibe: "Verify security deployment review policy compliance.",
      tokenBudget: 100,
      consumerId: "barrel-smoke",
    });
    const retrieval = createRetrievalContract({ knowledge: shell.knowledge }).retrieve({
      query: intake.retrieval.query,
      options: { maxChunks: 5 },
    });
    const packaged = createPackagingContract().package({
      chunks: retrieval.chunks,
      tokenBudget: 100,
      executionId: "packaging-exec-1",
    });
    const receipt = createConsumerContract({ now: () => FIXED_NOW }).consume({
      vibe: "Verify security deployment review policy compliance.",
      consumerId: "barrel-smoke",
      executionId: "exec-1",
    });

    expect(intake.requestId).toHaveLength(32);
    expect(retrieval.chunkCount).toBeGreaterThan(0);
    expect(packaged.freeze?.executionId).toBe("packaging-exec-1");
    expect(buildPipelineStages(intake)).toContain("deterministic-hashing");
    expect(receipt.freeze?.executionId).toBe("exec-1");
  });

  it("keeps representative contract families constructible from the public barrel", () => {
    expect(createKnowledgeQueryContract()).toBeInstanceOf(KnowledgeQueryContract);
    expect(createKnowledgeQueryBatchContract()).toBeInstanceOf(
      KnowledgeQueryBatchContract,
    );
    expect(createAIGatewayContract()).toBeInstanceOf(AIGatewayContract);
    expect(createGatewayConsumerContract()).toBeInstanceOf(GatewayConsumerContract);
    expect(createGatewayAuthContract()).toBeInstanceOf(GatewayAuthContract);
    expect(createGatewayAuthBatchContract()).toBeInstanceOf(
      GatewayAuthBatchContract,
    );
    expect(createGatewayPIIDetectionContract()).toBeInstanceOf(
      GatewayPIIDetectionContract,
    );
    expect(createGatewayPIIDetectionBatchContract()).toBeInstanceOf(
      GatewayPIIDetectionBatchContract,
    );
    expect(createRouteMatchContract()).toBeInstanceOf(RouteMatchContract);
    expect(createRouteMatchBatchContract()).toBeInstanceOf(RouteMatchBatchContract);
    expect(createDesignContract()).toBeInstanceOf(DesignContract);
    expect(createBoardroomContract()).toBeInstanceOf(BoardroomContract);
    expect(createOrchestrationContract()).toBeInstanceOf(OrchestrationContract);
    expect(createDesignConsumerContract()).toBeInstanceOf(DesignConsumerContract);
    expect(createReversePromptingContract()).toBeInstanceOf(
      ReversePromptingContract,
    );
    expect(createClarificationRefinementContract()).toBeInstanceOf(
      ClarificationRefinementContract,
    );
    expect(createExternalAssetIntakeProfileContract()).toBeInstanceOf(
      ExternalAssetIntakeProfileContract,
    );
    expect(createWindowsCompatibilityEvaluationContract()).toBeInstanceOf(
      WindowsCompatibilityEvaluationContract,
    );
    expect(createWindowsCompatibilityEvaluationBatchContract()).toBeInstanceOf(
      WindowsCompatibilityEvaluationBatchContract,
    );
    expect(createWindowsCompatibilityConsumerPipelineContract()).toBeInstanceOf(
      WindowsCompatibilityConsumerPipelineContract,
    );
    expect(
      createWindowsCompatibilityConsumerPipelineBatchContract(),
    ).toBeInstanceOf(WindowsCompatibilityConsumerPipelineBatchContract);
    expect(createOrchestrationBatchContract()).toBeInstanceOf(
      OrchestrationBatchContract,
    );
    expect(createDesignBatchContract()).toBeInstanceOf(DesignBatchContract);
    expect(createPlannerTriggerHeuristicsContract()).toBeInstanceOf(
      PlannerTriggerHeuristicsContract,
    );
    expect(createReversePromptingBatchContract()).toBeInstanceOf(
      ReversePromptingBatchContract,
    );
    expect(createBoardroomBatchContract()).toBeInstanceOf(BoardroomBatchContract);
    expect(createBoardroomTransitionGateBatchContract()).toBeInstanceOf(
      BoardroomTransitionGateBatchContract,
    );
    expect(createBoardroomMultiRoundBatchContract()).toBeInstanceOf(
      BoardroomMultiRoundBatchContract,
    );
  });

  it("keeps continuation contracts constructible from the public barrel", () => {
    expect(createTrustIsolationBoundaryContract()).toBeInstanceOf(
      TrustIsolationBoundaryContract,
    );
    expect(createModelGatewayBoundaryContract()).toBeInstanceOf(
      ModelGatewayBoundaryContract,
    );
  });
});
