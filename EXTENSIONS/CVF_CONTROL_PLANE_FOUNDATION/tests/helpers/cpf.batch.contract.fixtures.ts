import type {
  AgentDefinitionInput,
  CapabilityValidationResult,
} from "../../src/agent.definition.boundary.contract";
import type { GatewayProcessedRequest } from "../../src/ai.gateway.contract";
import type { RouteDefinition } from "../../src/route.match.contract";
import type {
  DesignAgentRole,
  DesignPlan,
  DesignTask,
  DesignTaskPhase,
  DesignTaskRisk,
} from "../../src/design.contract";
import type {
  BoardroomRequest,
  BoardroomSession,
} from "../../src/boardroom.contract";
import { BoardroomContract } from "../../src/boardroom.contract";
import type { BoardroomRound } from "../../src/boardroom.round.contract";
import { BoardroomRoundContract } from "../../src/boardroom.round.contract";
import { GovernanceCanvas } from "../../../CVF_ECO_v2.1_GOVERNANCE_CANVAS/src/canvas";

export const FIXED_BATCH_NOW = "2026-04-01T00:00:00.000Z";

export function makeCapabilityValidationResult(
  status: CapabilityValidationResult["status"],
  overrides: Partial<CapabilityValidationResult> = {},
): CapabilityValidationResult {
  const base =
    status === "WITHIN_SCOPE"
      ? "within"
      : status === "OUT_OF_SCOPE"
        ? "out"
        : "undeclared";

  return {
    resultId: `id-${base}`,
    evaluatedAt: FIXED_BATCH_NOW,
    agentId: "agent-001",
    capability: "read:knowledge",
    status,
    reason: `reason for ${status}`,
    resultHash: `hash-${base}`,
    ...overrides,
  };
}

export function makeAgentDefinitionInput(
  overrides: Partial<AgentDefinitionInput> = {},
): AgentDefinitionInput {
  return {
    name: "agent-alpha",
    role: "executor",
    declaredCapabilities: ["read:knowledge"],
    declaredDomains: ["operations"],
    ...overrides,
  };
}

export function makeDesignTask(
  id: string,
  riskLevel: DesignTaskRisk,
  role: DesignAgentRole = "builder",
  phase: DesignTaskPhase = "BUILD",
): DesignTask {
  return {
    taskId: id,
    title: `Task ${id}`,
    description: `Test task ${id}`,
    assignedRole: role,
    riskLevel,
    targetPhase: phase,
    estimatedComplexity: "low",
    dependencies: [],
  };
}

export function makeDesignPlan(
  planId: string,
  tasks: DesignTask[],
  overrides: Partial<DesignPlan> = {},
): DesignPlan {
  const riskSummary: Record<DesignTaskRisk, number> = {
    R0: 0,
    R1: 0,
    R2: 0,
    R3: 0,
  };
  const roleSummary: Record<DesignAgentRole, number> = {
    orchestrator: 0,
    architect: 0,
    builder: 0,
    reviewer: 0,
  };

  for (const task of tasks) {
    riskSummary[task.riskLevel] += 1;
    roleSummary[task.assignedRole] += 1;
  }

  return {
    planId,
    createdAt: FIXED_BATCH_NOW,
    intakeRequestId: `intake-${planId}`,
    consumerId: "test-consumer",
    vibeOriginal: `vibe for ${planId}`,
    tasks,
    totalTasks: tasks.length,
    riskSummary,
    roleSummary,
    domainDetected: "general",
    planHash: `hash-${planId}`,
    warnings: [],
    ...overrides,
  };
}

export function makeDesignPlanFromRiskCounts(
  id: string,
  opts: {
    r3Count?: number;
    r2Count?: number;
    r1Count?: number;
    r0Count?: number;
    warnings?: string[];
    domain?: string;
    empty?: boolean;
  } = {},
): DesignPlan {
  const r3 = opts.r3Count ?? 0;
  const r2 = opts.r2Count ?? 0;
  const r1 = opts.r1Count ?? 0;
  const r0 = opts.r0Count ?? 0;
  const empty = opts.empty ?? false;

  const tasks = empty
    ? []
    : [
        ...Array.from({ length: r3 }, (_, index) =>
          makeDesignTask(`task-r3-${index}`, "R3", "architect", "DESIGN"),
        ),
        ...Array.from({ length: r2 }, (_, index) =>
          makeDesignTask(`task-r2-${index}`, "R2", "builder", "BUILD"),
        ),
        ...Array.from({ length: r1 }, (_, index) =>
          makeDesignTask(`task-r1-${index}`, "R1", "builder", "BUILD"),
        ),
        ...Array.from({ length: r0 }, (_, index) =>
          makeDesignTask(`task-r0-${index}`, "R0", "reviewer", "REVIEW"),
        ),
      ];

  return makeDesignPlan(id, tasks, {
    planId: empty ? "" : id,
    warnings: opts.warnings ?? [],
    domainDetected: opts.domain ?? "general",
  });
}

export function makeBoardroomRequest(
  decision: "PROCEED" | "AMEND_PLAN" | "ESCALATE" | "REJECT",
): BoardroomRequest {
  if (decision === "PROCEED") {
    return {
      plan: makeDesignPlanFromRiskCounts("plan-proceed", { r0Count: 2 }),
      clarifications: [],
    };
  }

  if (decision === "AMEND_PLAN") {
    return {
      plan: makeDesignPlanFromRiskCounts("plan-amend", { r1Count: 1 }),
      clarifications: [{ question: "What is the timeline?", answer: undefined }],
    };
  }

  if (decision === "ESCALATE") {
    return {
      plan: makeDesignPlanFromRiskCounts("plan-escalate", {
        r3Count: 1,
        warnings: ["Intake had low confidence."],
      }),
      clarifications: [],
    };
  }

  return {
    plan: makeDesignPlanFromRiskCounts("plan-reject", { empty: true }),
    clarifications: [],
  };
}

export function makeBoardroomSession(
  decision: "PROCEED" | "AMEND_PLAN" | "ESCALATE" | "REJECT",
): BoardroomSession {
  return new BoardroomContract({
    canvas: new GovernanceCanvas(),
    now: () => FIXED_BATCH_NOW,
  }).review(makeBoardroomRequest(decision));
}

export function makeBoardroomRound(
  decision: "PROCEED" | "AMEND_PLAN" | "ESCALATE" | "REJECT",
  roundNumber = 1,
): BoardroomRound {
  return new BoardroomRoundContract({
    now: () => FIXED_BATCH_NOW,
  }).openRound(makeBoardroomSession(decision), roundNumber);
}

export function makeGatewayProcessedRequest(
  id: string,
  signal: string,
): GatewayProcessedRequest {
  return {
    gatewayId: `gw-${id}`,
    processedAt: FIXED_BATCH_NOW,
    rawSignal: signal,
    normalizedSignal: signal,
    signalType: "command",
    envMetadata: {
      platform: "test",
      phase: "test",
      riskLevel: "low",
      locale: "en",
      tags: [],
    },
    privacyReport: {
      filtered: false,
      maskedTokenCount: 0,
      appliedPatterns: [],
    },
    gatewayHash: `hash-${id}`,
    warnings: [],
  };
}

export const MIXED_ROUTE_DEFINITIONS: RouteDefinition[] = [
  { routeId: "r-reject", pathPattern: "reject*", gatewayAction: "REJECT", priority: 1 },
  { routeId: "r-reroute", pathPattern: "reroute*", gatewayAction: "REROUTE", priority: 2 },
  { routeId: "r-forward", pathPattern: "forward*", gatewayAction: "FORWARD", priority: 3 },
  { routeId: "r-pass", pathPattern: "pass*", gatewayAction: "PASSTHROUGH", priority: 4 },
];
