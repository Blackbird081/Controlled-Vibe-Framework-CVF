import { describe, it, expect } from "vitest";
import {
  MultiAgentCoordinationContract,
  createMultiAgentCoordinationContract,
} from "../src/execution.multi.agent.coordination.contract";
import type {
  CoordinationPolicy,
  CommandRuntimeResult,
} from "../src";

// ─── W2-T9 CP1: MultiAgentCoordinationContract ───────────────────────────────

const FIXED_NOW = () => "2026-03-23T10:00:00.000Z";

function makeResult(runtimeId: string): CommandRuntimeResult {
  return {
    runtimeId,
    gateId: "gate-1",
    executedAt: "2026-03-23T09:00:00.000Z",
    records: [],
    executedCount: 1,
    sandboxedCount: 0,
    skippedCount: 0,
    failedCount: 0,
    runtimeHash: "hash-" + runtimeId,
    summary: "ok",
  };
}

function makePolicy(
  agentCount: number,
  distributionStrategy: CoordinationPolicy["distributionStrategy"],
): CoordinationPolicy {
  return { agentCount, distributionStrategy };
}

describe("W2-T9 CP1: MultiAgentCoordinationContract", () => {
  it("createMultiAgentCoordinationContract returns a MultiAgentCoordinationContract instance", () => {
    expect(createMultiAgentCoordinationContract()).toBeInstanceOf(
      MultiAgentCoordinationContract,
    );
  });

  it("ROUND_ROBIN — distributes tasks evenly across agents", () => {
    const contract = createMultiAgentCoordinationContract({ now: FIXED_NOW });
    const results = [makeResult("r1"), makeResult("r2"), makeResult("r3")];
    const result = contract.coordinate(results, makePolicy(3, "ROUND_ROBIN"));
    expect(result.agents).toHaveLength(3);
    expect(result.agents[0].taskIds).toContain("r1");
    expect(result.agents[1].taskIds).toContain("r2");
    expect(result.agents[2].taskIds).toContain("r3");
  });

  it("BROADCAST — all agents receive all task ids", () => {
    const contract = createMultiAgentCoordinationContract({ now: FIXED_NOW });
    const results = [makeResult("r1"), makeResult("r2")];
    const result = contract.coordinate(results, makePolicy(2, "BROADCAST"));
    result.agents.forEach((a) => {
      expect(a.taskIds).toContain("r1");
      expect(a.taskIds).toContain("r2");
    });
  });

  it("PRIORITY_FIRST — first agent gets all tasks, rest get none", () => {
    const contract = createMultiAgentCoordinationContract({ now: FIXED_NOW });
    const results = [makeResult("r1"), makeResult("r2")];
    const result = contract.coordinate(results, makePolicy(3, "PRIORITY_FIRST"));
    expect(result.agents[0].taskIds).toHaveLength(2);
    expect(result.agents[1].taskIds).toHaveLength(0);
    expect(result.agents[2].taskIds).toHaveLength(0);
  });

  it("coordinationStatus is COORDINATED when all agents have assignments", () => {
    const contract = createMultiAgentCoordinationContract({ now: FIXED_NOW });
    const results = [makeResult("r1"), makeResult("r2")];
    const result = contract.coordinate(results, makePolicy(2, "ROUND_ROBIN"));
    expect(result.coordinationStatus).toBe("COORDINATED");
  });

  it("coordinationStatus is PARTIAL when some agents have no assignments (ROUND_ROBIN with fewer tasks)", () => {
    const contract = createMultiAgentCoordinationContract({ now: FIXED_NOW });
    const results = [makeResult("r1")]; // 1 task, 3 agents
    const result = contract.coordinate(results, makePolicy(3, "ROUND_ROBIN"));
    expect(result.coordinationStatus).toBe("PARTIAL");
  });

  it("coordinationStatus is FAILED when no results are provided", () => {
    const contract = createMultiAgentCoordinationContract({ now: FIXED_NOW });
    const result = contract.coordinate([], makePolicy(2, "ROUND_ROBIN"));
    expect(result.coordinationStatus).toBe("FAILED");
  });

  it("totalTasksDistributed reflects actual distribution (ROUND_ROBIN)", () => {
    const contract = createMultiAgentCoordinationContract({ now: FIXED_NOW });
    const results = [makeResult("r1"), makeResult("r2"), makeResult("r3")];
    const result = contract.coordinate(results, makePolicy(2, "ROUND_ROBIN"));
    expect(result.totalTasksDistributed).toBe(3);
  });

  it("totalTasksDistributed reflects actual distribution (BROADCAST)", () => {
    const contract = createMultiAgentCoordinationContract({ now: FIXED_NOW });
    const results = [makeResult("r1"), makeResult("r2")];
    const result = contract.coordinate(results, makePolicy(3, "BROADCAST"));
    expect(result.totalTasksDistributed).toBe(6); // 2 tasks × 3 agents
  });

  it("each AgentAssignment has a deterministic assignmentHash", () => {
    const contract = createMultiAgentCoordinationContract({ now: FIXED_NOW });
    const results = [makeResult("r1")];
    const r1 = contract.coordinate(results, makePolicy(1, "ROUND_ROBIN"));
    const r2 = contract.coordinate(results, makePolicy(1, "ROUND_ROBIN"));
    expect(r1.agents[0].assignmentHash).toBe(r2.agents[0].assignmentHash);
  });

  it("coordinationHash is deterministic for same inputs", () => {
    const contract = createMultiAgentCoordinationContract({ now: FIXED_NOW });
    const results = [makeResult("r1"), makeResult("r2")];
    const r1 = contract.coordinate(results, makePolicy(2, "ROUND_ROBIN"));
    const r2 = contract.coordinate(results, makePolicy(2, "ROUND_ROBIN"));
    expect(r1.coordinationHash).toBe(r2.coordinationHash);
    expect(r1.coordinationId).toBe(r2.coordinationId);
  });

  it("agentCount 0 returns empty agents list with FAILED status", () => {
    const contract = createMultiAgentCoordinationContract({ now: FIXED_NOW });
    const results = [makeResult("r1")];
    const result = contract.coordinate(results, makePolicy(0, "ROUND_ROBIN"));
    expect(result.agents).toHaveLength(0);
    expect(result.coordinationStatus).toBe("FAILED");
  });
});
