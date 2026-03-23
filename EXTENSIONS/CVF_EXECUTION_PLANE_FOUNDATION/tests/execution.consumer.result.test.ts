import { describe, it, expect } from "vitest";
import {
  ExecutionConsumerResultContract,
  createExecutionConsumerResultContract,
} from "../src/execution.consumer.result.contract";
import type { MultiAgentCoordinationResult } from "../src/execution.multi.agent.coordination.contract";

// ─── W2-T10 CP1: ExecutionConsumerResultContract ─────────────────────────────

const FIXED_NOW = () => "2026-03-24T06:00:00.000Z";

const CANDIDATE_ITEMS = [
  {
    itemId: "item-exec-1",
    title: "Multi-Agent Task Distribution",
    content: "Round-robin task distribution across agents ensures balanced load.",
    source: "docs",
    relevanceScore: 0.9,
    tier: "T1" as const,
    recencyScore: 0.85,
  },
  {
    itemId: "item-exec-2",
    title: "Coordination Status Semantics",
    content: "COORDINATED means all agents assigned; PARTIAL means some; FAILED means none.",
    source: "whitepaper",
    relevanceScore: 0.8,
    tier: "T2" as const,
    recencyScore: 0.75,
  },
];

function makeCoordinationResult(
  status: "COORDINATED" | "PARTIAL" | "FAILED" = "COORDINATED",
): MultiAgentCoordinationResult {
  return {
    coordinationId: "coord-abc-123",
    coordinatedAt: FIXED_NOW(),
    agents: [
      {
        agentId: "agent-1",
        assignedRuntimeId: "runtime-1",
        taskIds: ["task-a", "task-b"],
        assignmentHash: "hash-agent-1",
      },
    ],
    totalTasksDistributed: 2,
    coordinationStatus: status,
    coordinationHash: "coord-hash-abc",
  };
}

describe("W2-T10 CP1: ExecutionConsumerResultContract", () => {
  it("createExecutionConsumerResultContract returns an instance", () => {
    expect(createExecutionConsumerResultContract()).toBeInstanceOf(
      ExecutionConsumerResultContract,
    );
  });

  it("execute returns an ExecutionConsumerResult with all required fields", () => {
    const contract = createExecutionConsumerResultContract({ now: FIXED_NOW });
    const result = contract.execute({
      coordinationResult: makeCoordinationResult(),
      candidateItems: CANDIDATE_ITEMS,
    });
    expect(result.resultId).toBeTruthy();
    expect(result.createdAt).toBe(FIXED_NOW());
    expect(result.executionConsumerHash).toBeTruthy();
    expect(result.coordinationResult).toBeDefined();
    expect(result.consumerPackage).toBeDefined();
    expect(Array.isArray(result.warnings)).toBe(true);
  });

  it("consumerPackage contains rankedKnowledgeResult and typedContextPackage", () => {
    const contract = createExecutionConsumerResultContract({ now: FIXED_NOW });
    const result = contract.execute({
      coordinationResult: makeCoordinationResult(),
      candidateItems: CANDIDATE_ITEMS,
    });
    expect(result.consumerPackage.rankedKnowledgeResult).toBeDefined();
    expect(result.consumerPackage.typedContextPackage).toBeDefined();
    expect(result.consumerPackage.pipelineHash).toBeTruthy();
  });

  it("consumerPackage contextId matches coordinationId", () => {
    const contract = createExecutionConsumerResultContract({ now: FIXED_NOW });
    const coordination = makeCoordinationResult();
    const result = contract.execute({
      coordinationResult: coordination,
      candidateItems: CANDIDATE_ITEMS,
    });
    expect(result.consumerPackage.contextId).toBe(coordination.coordinationId);
  });

  it("executionConsumerHash is deterministic for the same inputs", () => {
    const contract = createExecutionConsumerResultContract({ now: FIXED_NOW });
    const coordination = makeCoordinationResult();
    const r1 = contract.execute({ coordinationResult: coordination, candidateItems: CANDIDATE_ITEMS });
    const r2 = contract.execute({ coordinationResult: coordination, candidateItems: CANDIDATE_ITEMS });
    expect(r1.executionConsumerHash).toBe(r2.executionConsumerHash);
    expect(r1.resultId).toBe(r2.resultId);
  });

  it("executionConsumerHash changes when coordinationHash changes", () => {
    const contract = createExecutionConsumerResultContract({ now: FIXED_NOW });
    const coord1 = makeCoordinationResult();
    const coord2 = { ...makeCoordinationResult(), coordinationHash: "different-hash" };
    const r1 = contract.execute({ coordinationResult: coord1, candidateItems: CANDIDATE_ITEMS });
    const r2 = contract.execute({ coordinationResult: coord2, candidateItems: CANDIDATE_ITEMS });
    expect(r1.executionConsumerHash).not.toBe(r2.executionConsumerHash);
  });

  it("FAILED coordination status emits a warning", () => {
    const contract = createExecutionConsumerResultContract({ now: FIXED_NOW });
    const result = contract.execute({
      coordinationResult: makeCoordinationResult("FAILED"),
      candidateItems: CANDIDATE_ITEMS,
    });
    expect(result.warnings.some((w) => w.includes("FAILED"))).toBe(true);
  });

  it("PARTIAL coordination status emits a warning", () => {
    const contract = createExecutionConsumerResultContract({ now: FIXED_NOW });
    const result = contract.execute({
      coordinationResult: makeCoordinationResult("PARTIAL"),
      candidateItems: CANDIDATE_ITEMS,
    });
    expect(result.warnings.some((w) => w.includes("PARTIAL"))).toBe(true);
  });

  it("COORDINATED status emits no warnings", () => {
    const contract = createExecutionConsumerResultContract({ now: FIXED_NOW });
    const result = contract.execute({
      coordinationResult: makeCoordinationResult("COORDINATED"),
      candidateItems: CANDIDATE_ITEMS,
    });
    expect(result.warnings).toHaveLength(0);
  });

  it("consumerId and sessionId are propagated to result", () => {
    const contract = createExecutionConsumerResultContract({ now: FIXED_NOW });
    const result = contract.execute({
      coordinationResult: makeCoordinationResult(),
      candidateItems: CANDIDATE_ITEMS,
      consumerId: "consumer-xyz",
      sessionId: "session-abc",
    });
    expect(result.consumerId).toBe("consumer-xyz");
    expect(result.sessionId).toBe("session-abc");
  });

  it("empty candidateItems produces valid result with zero ranked items", () => {
    const contract = createExecutionConsumerResultContract({ now: FIXED_NOW });
    const result = contract.execute({
      coordinationResult: makeCoordinationResult(),
      candidateItems: [],
    });
    expect(result.resultId).toBeTruthy();
    expect(result.consumerPackage.rankedKnowledgeResult.items).toHaveLength(0);
  });

  it("resultId differs from executionConsumerHash", () => {
    const contract = createExecutionConsumerResultContract({ now: FIXED_NOW });
    const result = contract.execute({
      coordinationResult: makeCoordinationResult(),
      candidateItems: CANDIDATE_ITEMS,
    });
    expect(result.resultId).not.toBe(result.executionConsumerHash);
  });
});
