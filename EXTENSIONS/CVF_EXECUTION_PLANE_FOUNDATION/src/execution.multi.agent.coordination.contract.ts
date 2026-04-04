import type { CommandRuntimeResult } from "./command.runtime.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

export type DistributionStrategy = "ROUND_ROBIN" | "BROADCAST" | "PRIORITY_FIRST";

export type CoordinationStatus = "COORDINATED" | "PARTIAL" | "FAILED";

export interface CoordinationPolicy {
  agentCount: number;
  distributionStrategy: DistributionStrategy;
  maxRetries?: number;
}

export interface AgentAssignment {
  agentId: string;
  assignedRuntimeId: string;
  taskIds: string[];
  assignmentHash: string;
}

export interface MultiAgentCoordinationResult {
  coordinationId: string;
  coordinatedAt: string;
  agents: AgentAssignment[];
  totalTasksDistributed: number;
  coordinationStatus: CoordinationStatus;
  coordinationHash: string;
}

export interface MultiAgentCoordinationContractDependencies {
  now?: () => string;
}

// --- Helpers ---

function deriveCoordinationStatus(
  agentCount: number,
  assignedCount: number,
): CoordinationStatus {
  if (assignedCount === 0) return "FAILED";
  if (assignedCount < agentCount) return "PARTIAL";
  return "COORDINATED";
}

function distributeRoundRobin(
  runtimeIds: string[],
  agentCount: number,
): string[][] {
  const buckets: string[][] = Array.from({ length: agentCount }, () => []);
  runtimeIds.forEach((id, idx) => {
    buckets[idx % agentCount].push(id);
  });
  return buckets;
}

function distributeBroadcast(
  runtimeIds: string[],
  agentCount: number,
): string[][] {
  return Array.from({ length: agentCount }, () => [...runtimeIds]);
}

function distributePriorityFirst(
  runtimeIds: string[],
  agentCount: number,
): string[][] {
  const buckets: string[][] = Array.from({ length: agentCount }, () => []);
  buckets[0] = [...runtimeIds];
  return buckets;
}

function distributeTaskIds(
  runtimeIds: string[],
  policy: CoordinationPolicy,
): string[][] {
  const { agentCount, distributionStrategy } = policy;
  if (agentCount <= 0) return [];
  switch (distributionStrategy) {
    case "ROUND_ROBIN":
      return distributeRoundRobin(runtimeIds, agentCount);
    case "BROADCAST":
      return distributeBroadcast(runtimeIds, agentCount);
    case "PRIORITY_FIRST":
      return distributePriorityFirst(runtimeIds, agentCount);
  }
}

// --- Contract ---

export class MultiAgentCoordinationContract {
  private readonly now: () => string;

  constructor(dependencies: MultiAgentCoordinationContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  coordinate(
    results: CommandRuntimeResult[],
    policy: CoordinationPolicy,
  ): MultiAgentCoordinationResult {
    const coordinatedAt = this.now();
    const agentCount = Math.max(0, policy.agentCount);

    const runtimeIds = results.map((r) => r.runtimeId);
    const taskBuckets = distributeTaskIds(runtimeIds, {
      ...policy,
      agentCount,
    });

    const agents: AgentAssignment[] = [];
    for (let i = 0; i < agentCount; i++) {
      const agentId = computeDeterministicHash(
        "w2-t9-cp1-agent-id",
        `agent:${i}`,
        coordinatedAt,
      );
      const taskIds = taskBuckets[i] ?? [];
      const assignedRuntimeId =
        taskIds.length > 0 ? taskIds[0] : `unassigned-agent-${i}`;
      const assignmentHash = computeDeterministicHash(
        "w2-t9-cp1-assignment",
        agentId,
        `tasks:${taskIds.join(",")}`,
      );
      agents.push({ agentId, assignedRuntimeId, taskIds, assignmentHash });
    }

    const assignedCount = agents.filter((a) => a.taskIds.length > 0).length;
    const coordinationStatus = deriveCoordinationStatus(agentCount, assignedCount);

    const totalTasksDistributed = agents.reduce(
      (sum, a) => sum + a.taskIds.length,
      0,
    );

    const coordinationHash = computeDeterministicHash(
      "w2-t9-cp1-coordination",
      `${coordinatedAt}:agents:${agentCount}`,
      `status:${coordinationStatus}:tasks:${totalTasksDistributed}`,
      `strategy:${policy.distributionStrategy}`,
    );

    const coordinationId = computeDeterministicHash(
      "w2-t9-cp1-coordination-id",
      coordinationHash,
      coordinatedAt,
    );

    return {
      coordinationId,
      coordinatedAt,
      agents,
      totalTasksDistributed,
      coordinationStatus,
      coordinationHash,
    };
  }
}

export function createMultiAgentCoordinationContract(
  dependencies?: MultiAgentCoordinationContractDependencies,
): MultiAgentCoordinationContract {
  return new MultiAgentCoordinationContract(dependencies);
}
