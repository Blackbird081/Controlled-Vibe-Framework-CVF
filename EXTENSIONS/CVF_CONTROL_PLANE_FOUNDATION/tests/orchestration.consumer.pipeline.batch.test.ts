import { describe, it, expect } from "vitest";
import {
  OrchestrationConsumerPipelineBatchContract,
  createOrchestrationConsumerPipelineBatchContract,
} from "../src/orchestration.consumer.pipeline.batch.contract";
import {
  createOrchestrationConsumerPipelineContract,
} from "../src/orchestration.consumer.pipeline.contract";
import type { DesignPlan } from "../src/design.contract";

// ─── W1-T15 CP2: OrchestrationConsumerPipelineBatchContract ──────────────────

const FIXED_NOW = () => "2026-03-24T07:00:00.000Z";

const PLAN_A: DesignPlan = {
  planId: "plan-batch-a",
  createdAt: "2026-03-24T05:00:00.000Z",
  intakeRequestId: "intake-batch-a",
  consumerId: "consumer-batch-a",
  vibeOriginal: "Build a governance-first AI control plane",
  domainDetected: "code",
  tasks: [
    {
      taskId: "task-a-01",
      title: "Design intake contract",
      description: "Design the intake contract",
      assignedRole: "architect",
      riskLevel: "R1",
      targetPhase: "DESIGN",
      estimatedComplexity: "medium",
      dependencies: [],
    },
  ],
  totalTasks: 1,
  riskSummary: { R0: 0, R1: 1, R2: 0, R3: 0 },
  roleSummary: { orchestrator: 0, architect: 1, builder: 0, reviewer: 0 },
  planHash: "plan-hash-a",
  warnings: [],
};

const PLAN_B: DesignPlan = {
  planId: "plan-batch-b",
  createdAt: "2026-03-24T05:00:00.000Z",
  intakeRequestId: "intake-batch-b",
  consumerId: "consumer-batch-b",
  vibeOriginal: "Design an execution pipeline with MCP bridge",
  domainDetected: "code",
  tasks: [
    {
      taskId: "task-b-01",
      title: "Build MCP bridge",
      description: "Build the MCP bridge for the execution plane",
      assignedRole: "builder",
      riskLevel: "R2",
      targetPhase: "BUILD",
      estimatedComplexity: "high",
      dependencies: [],
    },
    {
      taskId: "task-b-02",
      title: "Review MCP integration",
      description: "Review the MCP integration artifacts",
      assignedRole: "reviewer",
      riskLevel: "R1",
      targetPhase: "REVIEW",
      estimatedComplexity: "low",
      dependencies: ["task-b-01"],
    },
  ],
  totalTasks: 2,
  riskSummary: { R0: 0, R1: 1, R2: 1, R3: 0 },
  roleSummary: { orchestrator: 0, architect: 0, builder: 1, reviewer: 1 },
  planHash: "plan-hash-b",
  warnings: [],
};

function buildResults() {
  const pipeline = createOrchestrationConsumerPipelineContract({
    now: FIXED_NOW,
  });
  return [
    pipeline.execute({ plan: PLAN_A }),
    pipeline.execute({ plan: PLAN_B }),
  ];
}

describe("W1-T15 CP2: OrchestrationConsumerPipelineBatchContract", () => {
  it("createOrchestrationConsumerPipelineBatchContract returns an instance", () => {
    expect(createOrchestrationConsumerPipelineBatchContract()).toBeInstanceOf(
      OrchestrationConsumerPipelineBatchContract,
    );
  });

  it("batch returns a result with all required fields", () => {
    const contract = createOrchestrationConsumerPipelineBatchContract({
      now: FIXED_NOW,
    });
    const results = buildResults();
    const batch = contract.batch(results);

    expect(batch.batchId).toBeDefined();
    expect(batch.createdAt).toBe("2026-03-24T07:00:00.000Z");
    expect(batch.totalResults).toBe(2);
    expect(Array.isArray(batch.results)).toBe(true);
    expect(typeof batch.dominantTokenBudget).toBe("number");
    expect(batch.batchHash).toBeDefined();
  });

  it("totalResults reflects the number of input results", () => {
    const contract = createOrchestrationConsumerPipelineBatchContract({
      now: FIXED_NOW,
    });
    const results = buildResults();
    const batch = contract.batch(results);
    expect(batch.totalResults).toBe(results.length);
    expect(batch.results).toHaveLength(results.length);
  });

  it("dominantTokenBudget is the max estimatedTokens across all consumer packages", () => {
    const contract = createOrchestrationConsumerPipelineBatchContract({
      now: FIXED_NOW,
    });
    const results = buildResults();
    const expected = Math.max(
      ...results.map(
        (r) => r.consumerPackage.typedContextPackage.estimatedTokens,
      ),
    );
    const batch = contract.batch(results);
    expect(batch.dominantTokenBudget).toBe(expected);
  });

  it("empty batch produces totalResults 0 and dominantTokenBudget 0", () => {
    const contract = createOrchestrationConsumerPipelineBatchContract({
      now: FIXED_NOW,
    });
    const batch = contract.batch([]);
    expect(batch.totalResults).toBe(0);
    expect(batch.dominantTokenBudget).toBe(0);
    expect(batch.results).toHaveLength(0);
    expect(batch.batchHash).toBeDefined();
    expect(batch.batchId).toBeDefined();
  });

  it("batchHash is deterministic for the same inputs", () => {
    const contract = createOrchestrationConsumerPipelineBatchContract({
      now: FIXED_NOW,
    });
    const results = buildResults();
    const b1 = contract.batch(results);
    const b2 = contract.batch(results);
    expect(b1.batchHash).toBe(b2.batchHash);
    expect(b1.batchId).toBe(b2.batchId);
  });

  it("batchHash changes when results change", () => {
    const contract = createOrchestrationConsumerPipelineBatchContract({
      now: FIXED_NOW,
    });
    const results = buildResults();
    const b1 = contract.batch([results[0]]);
    const b2 = contract.batch([results[1]]);
    expect(b1.batchHash).not.toBe(b2.batchHash);
  });

  it("batchId differs from batchHash", () => {
    const contract = createOrchestrationConsumerPipelineBatchContract({
      now: FIXED_NOW,
    });
    const results = buildResults();
    const batch = contract.batch(results);
    expect(batch.batchId).not.toBe(batch.batchHash);
  });

  it("results array in batch contains all input results in order", () => {
    const contract = createOrchestrationConsumerPipelineBatchContract({
      now: FIXED_NOW,
    });
    const results = buildResults();
    const batch = contract.batch(results);
    expect(batch.results[0].orchestrationResult.planId).toBe(PLAN_A.planId);
    expect(batch.results[1].orchestrationResult.planId).toBe(PLAN_B.planId);
  });

  it("single result batch has dominantTokenBudget equal to that result's estimatedTokens", () => {
    const contract = createOrchestrationConsumerPipelineBatchContract({
      now: FIXED_NOW,
    });
    const [singleResult] = buildResults();
    const batch = contract.batch([singleResult]);
    expect(batch.dominantTokenBudget).toBe(
      singleResult.consumerPackage.typedContextPackage.estimatedTokens,
    );
  });
});
