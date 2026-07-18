import { describe, expect, it } from "vitest";
import {
  AGENT_DEFINITION_ADAPTER_VERSION,
  AgentDefinitionBoundaryContract,
  CONTINUITY_CHECKPOINT_ADAPTER_VERSION,
  CONTROL_PLANE_COORDINATION_ADAPTER_VERSION,
  DESIGN_PLAN_ADAPTER_VERSION,
  DesignContract,
  ORCHESTRATION_ADAPTER_VERSION,
  OrchestrationContract,
  buildControlPlaneCoordinationAdapterSnapshot,
  buildContinuityCheckpointAdapterSnapshot,
  buildDesignPlanAdapterSnapshot,
  buildOrchestrationAdapterSnapshot,
  validateCheckpointWithAdapter,
  type ContinuityCheckpoint,
} from "../src";
import type { ControlPlaneIntakeResult } from "../src/intake.contract";
import type { Domain, ValidatedIntent } from "../../CVF_ECO_v1.0_INTENT_VALIDATION/src/types";

const FIXED_NOW = "2026-05-21T00:00:00.000Z";

function makeIntent(domain: Domain): ValidatedIntent {
  return {
    intent: {
      domain,
      action: "compose",
      object: "handoff",
      limits: {},
      requireApproval: false,
      confidence: 0.9,
      rawVibe: `compose governed ${domain} handoff`,
    },
    rules: [],
    constraints: [],
    timestamp: 0,
    pipelineVersion: "1.0",
    valid: true,
    errors: [],
  };
}

function makeIntakeResult(): ControlPlaneIntakeResult {
  const chunks = [
    {
      id: "chunk-001",
      source: "test",
      content: "Governed design context",
      relevanceScore: 0.9,
    },
  ];

  return {
    requestId: "intake-001",
    createdAt: FIXED_NOW,
    consumerId: "consumer-001",
    intent: makeIntent("general"),
    retrieval: {
      query: "governed handoff",
      chunkCount: chunks.length,
      totalCandidates: chunks.length,
      retrievalTimeMs: 3,
      tiersSearched: [],
      chunks,
    },
    packagedContext: {
      chunks,
      totalTokens: 64,
      tokenBudget: 256,
      truncated: false,
      snapshotHash: "snapshot-001",
    },
    warnings: [],
  };
}

function makeCheckpoint(
  overrides: Partial<ContinuityCheckpoint> = {},
): ContinuityCheckpoint {
  return {
    checkpointId: "checkpoint-001",
    taskId: "task-001",
    agentId: "agent-001",
    phaseBoundary: "DESIGN_TO_BUILD",
    closedDecisions: [
      {
        decisionId: "decision-001",
        decision: "Use additive adapter snapshots.",
        reasoning: "Runtime execution is out of scope.",
        irrevocable: true,
      },
    ],
    openItems: [],
    artifactMemory: [
      {
        path: "docs/reviews/example.md",
        hash: "hash-001",
        role: "evidence",
      },
    ],
    reinjectionPolicy: "on-request",
    evidenceReceiptIds: ["receipt-001"],
    ...overrides,
  };
}

describe("Phase 2.B identity/control-plane adapter snapshots", () => {
  it("builds an I-01 agent definition adapter without changing registration", () => {
    const contract = new AgentDefinitionBoundaryContract({ now: () => FIXED_NOW });
    const { record, adapter } = contract.registerDefinitionWithAdapter({
      name: "Identity Adapter Agent",
      role: "orchestrator",
      declaredCapabilities: ["design:plan", "orchestrate:assign"],
      declaredDomains: ["governance"],
    });

    expect(adapter.version).toBe(AGENT_DEFINITION_ADAPTER_VERSION);
    expect(adapter.source).toBe("control-plane:agent-definition-boundary");
    expect(adapter.agentId).toBe(record.agentId);
    expect(adapter.role).toBe("orchestrator");
    expect(adapter.declaredCapabilityCount).toBe(2);
  });

  it("builds I-02 design and I-03 orchestration adapters from existing outputs", () => {
    const design = new DesignContract({ now: () => FIXED_NOW });
    const orchestration = new OrchestrationContract({ now: () => FIXED_NOW });

    const { plan, adapter: designAdapter } = design.designWithAdapter(makeIntakeResult());
    const { result, adapter: orchestrationAdapter } =
      orchestration.orchestrateWithAdapter(plan);

    expect(designAdapter.version).toBe(DESIGN_PLAN_ADAPTER_VERSION);
    expect(designAdapter.planId).toBe(plan.planId);
    expect(designAdapter.totalTasks).toBe(plan.totalTasks);
    expect(buildDesignPlanAdapterSnapshot(plan)).toEqual(designAdapter);

    expect(orchestrationAdapter.version).toBe(ORCHESTRATION_ADAPTER_VERSION);
    expect(orchestrationAdapter.orchestrationId).toBe(result.orchestrationId);
    expect(orchestrationAdapter.totalAssignments).toBe(result.totalAssignments);
    expect(buildOrchestrationAdapterSnapshot(result)).toEqual(orchestrationAdapter);
  });

  it("builds I-04 continuity and I-05 continuation-barrel adapters", () => {
    const checkpoint = makeCheckpoint();
    const { validation, adapter } = validateCheckpointWithAdapter(checkpoint);

    expect(validation.valid).toBe(true);
    expect(adapter.version).toBe(CONTINUITY_CHECKPOINT_ADAPTER_VERSION);
    expect(adapter.source).toBe("control-plane:continuity-checkpoint");
    expect(adapter.checkpointId).toBe(checkpoint.checkpointId);
    expect(adapter.closedDecisionCount).toBe(1);
    expect(buildContinuityCheckpointAdapterSnapshot(checkpoint)).toEqual(adapter);
  });

  it("builds I-06 coordination-barrel adapter linked to orchestration adapter evidence", () => {
    const design = new DesignContract({ now: () => FIXED_NOW });
    const orchestration = new OrchestrationContract({ now: () => FIXED_NOW });
    const orchestrationAdapter = orchestration.orchestrateWithAdapter(
      design.design(makeIntakeResult()),
    ).adapter;

    const coordinationAdapter =
      buildControlPlaneCoordinationAdapterSnapshot(orchestrationAdapter);

    expect(coordinationAdapter.version).toBe(CONTROL_PLANE_COORDINATION_ADAPTER_VERSION);
    expect(coordinationAdapter.source).toBe("control-plane:coordination-barrel");
    expect(coordinationAdapter.preservesLineage).toBe(true);
    expect(coordinationAdapter.orchestrationAdapterVersion).toBe(
      ORCHESTRATION_ADAPTER_VERSION,
    );
    expect(coordinationAdapter.deferredSurfaceCount).toBeGreaterThan(0);
  });

  it("marks invalid continuity checkpoints in the adapter without changing validation", () => {
    const checkpoint = makeCheckpoint({
      checkpointId: "",
      reinjectionPolicy: "expired",
      evidenceReceiptIds: [],
    });

    const { validation, adapter } = validateCheckpointWithAdapter(checkpoint);

    expect(validation.valid).toBe(false);
    expect(adapter.valid).toBe(false);
    expect(adapter.violationCount).toBe(validation.violations.length);
  });
});
