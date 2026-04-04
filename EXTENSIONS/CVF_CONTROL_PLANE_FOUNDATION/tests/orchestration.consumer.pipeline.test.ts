import { describe, it, expect } from "vitest";
import {
  OrchestrationConsumerPipelineContract,
  createOrchestrationConsumerPipelineContract,
} from "../src/orchestration.consumer.pipeline.contract";
import type { DesignPlan } from "../src/design.contract";

// ─── W1-T15 CP1: OrchestrationConsumerPipelineContract ───────────────────────

const FIXED_NOW = () => "2026-03-24T06:00:00.000Z";

const SAMPLE_PLAN: DesignPlan = {
  planId: "plan-001",
  createdAt: "2026-03-24T05:00:00.000Z",
  intakeRequestId: "intake-001",
  consumerId: "consumer-001",
  vibeOriginal: "Build a governance-first AI control plane with strict audit trails",
  domainDetected: "code",
  tasks: [
    {
      taskId: "task-001",
      title: "Design intake contract",
      description: "Design the intake contract for the control plane",
      assignedRole: "architect",
      riskLevel: "R1",
      targetPhase: "DESIGN",
      estimatedComplexity: "medium",
      dependencies: [],
    },
    {
      taskId: "task-002",
      title: "Build orchestration contract",
      description: "Implement the orchestration contract",
      assignedRole: "builder",
      riskLevel: "R2",
      targetPhase: "BUILD",
      estimatedComplexity: "high",
      dependencies: ["task-001"],
    },
    {
      taskId: "task-003",
      title: "Review governance artifacts",
      description: "Review all governance artifacts for compliance",
      assignedRole: "reviewer",
      riskLevel: "R1",
      targetPhase: "REVIEW",
      estimatedComplexity: "low",
      dependencies: ["task-002"],
    },
  ],
  totalTasks: 3,
  riskSummary: { R0: 0, R1: 2, R2: 1, R3: 0 },
  roleSummary: { orchestrator: 0, architect: 1, builder: 1, reviewer: 1 },
  planHash: "plan-hash-001",
  warnings: [],
};

const CANDIDATE_ITEMS = [
  {
    itemId: "item-1",
    title: "CVF Orchestration Patterns",
    content: "Orchestration contracts bridge design plans to consumer pipelines.",
    source: "docs",
    relevanceScore: 0.9,
    tier: "T1" as const,
    recencyScore: 0.85,
  },
  {
    itemId: "item-2",
    title: "Control Plane Architecture",
    content: "The control plane governs intent, design, and orchestration flows.",
    source: "whitepaper",
    relevanceScore: 0.75,
    tier: "T2" as const,
    recencyScore: 0.7,
  },
];

describe("W1-T15 CP1: OrchestrationConsumerPipelineContract", () => {
  it("createOrchestrationConsumerPipelineContract returns an instance", () => {
    expect(createOrchestrationConsumerPipelineContract()).toBeInstanceOf(
      OrchestrationConsumerPipelineContract,
    );
  });

  it("execute returns a result with all required fields", () => {
    const contract = createOrchestrationConsumerPipelineContract({
      now: FIXED_NOW,
    });
    const result = contract.execute({ plan: SAMPLE_PLAN });

    expect(result.resultId).toBeDefined();
    expect(typeof result.resultId).toBe("string");
    expect(result.createdAt).toBe("2026-03-24T06:00:00.000Z");
    expect(result.orchestrationResult).toBeDefined();
    expect(result.consumerPackage).toBeDefined();
    expect(result.pipelineHash).toBeDefined();
    expect(Array.isArray(result.warnings)).toBe(true);
  });

  it("execute propagates consumerId from request when provided", () => {
    const contract = createOrchestrationConsumerPipelineContract({
      now: FIXED_NOW,
    });
    const result = contract.execute({
      plan: SAMPLE_PLAN,
      consumerId: "override-consumer",
    });
    expect(result.consumerId).toBe("override-consumer");
  });

  it("execute falls back to plan.consumerId when request consumerId is absent", () => {
    const contract = createOrchestrationConsumerPipelineContract({
      now: FIXED_NOW,
    });
    const result = contract.execute({ plan: SAMPLE_PLAN });
    expect(result.consumerId).toBe("consumer-001");
  });

  it("execute propagates plan tasks to orchestrationResult.assignments", () => {
    const contract = createOrchestrationConsumerPipelineContract({
      now: FIXED_NOW,
    });
    const result = contract.execute({ plan: SAMPLE_PLAN });
    expect(result.orchestrationResult.totalAssignments).toBe(3);
    expect(result.orchestrationResult.assignments).toHaveLength(3);
  });

  it("execute uses orchestrationId as contextId in consumerPackage", () => {
    const contract = createOrchestrationConsumerPipelineContract({
      now: FIXED_NOW,
    });
    const result = contract.execute({ plan: SAMPLE_PLAN });
    expect(result.consumerPackage.contextId).toBe(
      result.orchestrationResult.orchestrationId,
    );
  });

  it("execute derives query from plan.vibeOriginal (max 120 chars)", () => {
    const longVibeOriginal = "A".repeat(200);
    const plan = { ...SAMPLE_PLAN, vibeOriginal: longVibeOriginal };
    const contract = createOrchestrationConsumerPipelineContract({
      now: FIXED_NOW,
    });
    const result = contract.execute({ plan });
    expect(result.consumerPackage.query.length).toBeLessThanOrEqual(120);
  });

  it("execute uses planId as query fallback when vibeOriginal is empty", () => {
    const plan = { ...SAMPLE_PLAN, vibeOriginal: "" };
    const contract = createOrchestrationConsumerPipelineContract({
      now: FIXED_NOW,
    });
    const result = contract.execute({ plan });
    expect(result.consumerPackage.query).toBe(plan.planId);
  });

  it("execute accepts candidateItems and passes them to consumerPackage", () => {
    const contract = createOrchestrationConsumerPipelineContract({
      now: FIXED_NOW,
    });
    const result = contract.execute({
      plan: SAMPLE_PLAN,
      candidateItems: CANDIDATE_ITEMS,
    });
    expect(result.consumerPackage).toBeDefined();
    expect(result.consumerPackage.rankedKnowledgeResult.totalRanked).toBe(2);
  });

  it("execute produces deterministic pipelineHash given fixed now", () => {
    const contract = createOrchestrationConsumerPipelineContract({
      now: FIXED_NOW,
    });
    const r1 = contract.execute({ plan: SAMPLE_PLAN });
    const r2 = contract.execute({ plan: SAMPLE_PLAN });
    expect(r1.pipelineHash).toBe(r2.pipelineHash);
    expect(r1.resultId).toBe(r2.resultId);
  });

  it("execute prefixes orchestration warnings with [orchestration]", () => {
    const planWithWarning: DesignPlan = {
      ...SAMPLE_PLAN,
      tasks: [
        {
          ...SAMPLE_PLAN.tasks[1],
          riskLevel: "R3",
        },
      ],
      totalTasks: 1,
      riskSummary: { R0: 0, R1: 0, R2: 0, R3: 1 },
      roleSummary: { orchestrator: 0, architect: 0, builder: 1, reviewer: 0 },
    };
    const contract = createOrchestrationConsumerPipelineContract({
      now: FIXED_NOW,
    });
    const result = contract.execute({ plan: planWithWarning });
    const r3Warning = result.warnings.find((w) =>
      w.includes("[orchestration]"),
    );
    expect(r3Warning).toBeDefined();
  });

  it("execute with empty tasks plan produces zero assignments and no warnings about R3", () => {
    const emptyPlan: DesignPlan = {
      ...SAMPLE_PLAN,
      tasks: [],
      totalTasks: 0,
      riskSummary: { R0: 0, R1: 0, R2: 0, R3: 0 },
      roleSummary: { orchestrator: 0, architect: 0, builder: 0, reviewer: 0 },
    };
    const contract = createOrchestrationConsumerPipelineContract({
      now: FIXED_NOW,
    });
    const result = contract.execute({ plan: emptyPlan });
    expect(result.orchestrationResult.totalAssignments).toBe(0);
    const r3Warning = result.warnings.find((w) => w.includes("R3"));
    expect(r3Warning).toBeUndefined();
  });

  it("pipelineHash differs from orchestrationHash and consumerPackage.pipelineHash", () => {
    const contract = createOrchestrationConsumerPipelineContract({
      now: FIXED_NOW,
    });
    const result = contract.execute({ plan: SAMPLE_PLAN });
    expect(result.pipelineHash).not.toBe(
      result.orchestrationResult.orchestrationHash,
    );
    expect(result.pipelineHash).not.toBe(result.consumerPackage.pipelineHash);
  });

  it("resultId is derived from pipelineHash and differs from pipelineHash", () => {
    const contract = createOrchestrationConsumerPipelineContract({
      now: FIXED_NOW,
    });
    const result = contract.execute({ plan: SAMPLE_PLAN });
    expect(result.resultId).not.toBe(result.pipelineHash);
    expect(typeof result.resultId).toBe("string");
    expect(result.resultId.length).toBeGreaterThan(0);
  });

  it("different plans produce different resultIds", () => {
    const planB: DesignPlan = {
      ...SAMPLE_PLAN,
      planId: "plan-002",
      vibeOriginal: "Different vibe for plan B",
    };
    const contract = createOrchestrationConsumerPipelineContract({
      now: FIXED_NOW,
    });
    const r1 = contract.execute({ plan: SAMPLE_PLAN });
    const r2 = contract.execute({ plan: planB });
    expect(r1.resultId).not.toBe(r2.resultId);
  });

  it("consumerPackage has typedContextPackage with estimatedTokens >= 0", () => {
    const contract = createOrchestrationConsumerPipelineContract({
      now: FIXED_NOW,
    });
    const result = contract.execute({ plan: SAMPLE_PLAN });
    expect(
      result.consumerPackage.typedContextPackage.estimatedTokens,
    ).toBeGreaterThanOrEqual(0);
  });
});
