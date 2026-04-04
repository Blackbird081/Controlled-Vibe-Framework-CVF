import type { DesignPlan, DesignTask, DesignAgentRole, DesignTaskRisk, DesignTaskPhase } from "./design.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

export interface TaskAssignment {
  assignmentId: string;
  taskId: string;
  title: string;
  assignedRole: DesignAgentRole;
  targetPhase: DesignTaskPhase;
  riskLevel: DesignTaskRisk;
  scopeConstraints: string[];
  dependencies: string[];
  executionAuthorizationHash: string;
}

export interface OrchestrationResult {
  orchestrationId: string;
  createdAt: string;
  planId: string;
  consumerId?: string;
  assignments: TaskAssignment[];
  totalAssignments: number;
  phaseBreakdown: Record<DesignTaskPhase, number>;
  roleBreakdown: Record<DesignAgentRole, number>;
  riskBreakdown: Record<DesignTaskRisk, number>;
  orchestrationHash: string;
  warnings: string[];
}

export interface OrchestrationContractDependencies {
  now?: () => string;
}

// --- Scope Constraints ---

function buildScopeConstraints(task: DesignTask): string[] {
  const constraints: string[] = [];

  constraints.push(`phase:${task.targetPhase}`);
  constraints.push(`risk:${task.riskLevel}`);
  constraints.push(`role:${task.assignedRole}`);

  if (task.riskLevel === "R3") {
    constraints.push("requires:full-governance-review");
    constraints.push("requires:audit-trail");
  } else if (task.riskLevel === "R2") {
    constraints.push("requires:peer-review");
  }

  if (task.targetPhase === "BUILD") {
    constraints.push("requires:test-coverage");
  }

  if (task.targetPhase === "REVIEW") {
    constraints.push("requires:independent-reviewer");
  }

  if (task.dependencies.length > 0) {
    constraints.push(`blocked-by:${task.dependencies.length}-task(s)`);
  }

  return constraints;
}

function buildExecutionAuthHash(
  planId: string,
  task: DesignTask,
  createdAt: string,
): string {
  return computeDeterministicHash(
    "orchestration-auth",
    `${planId}:${task.taskId}`,
    `${task.assignedRole}:${task.riskLevel}:${task.targetPhase}`,
    createdAt,
  );
}

// --- Contract ---

export class OrchestrationContract {
  private readonly now: () => string;

  constructor(dependencies: OrchestrationContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  orchestrate(plan: DesignPlan): OrchestrationResult {
    const createdAt = this.now();

    const assignments: TaskAssignment[] = plan.tasks.map((task) => ({
      assignmentId: computeDeterministicHash(
        "orchestration-assignment",
        plan.planId,
        task.taskId,
        createdAt,
      ),
      taskId: task.taskId,
      title: task.title,
      assignedRole: task.assignedRole,
      targetPhase: task.targetPhase,
      riskLevel: task.riskLevel,
      scopeConstraints: buildScopeConstraints(task),
      dependencies: task.dependencies,
      executionAuthorizationHash: buildExecutionAuthHash(
        plan.planId,
        task,
        createdAt,
      ),
    }));

    const phaseBreakdown: Record<DesignTaskPhase, number> = {
      DESIGN: 0,
      BUILD: 0,
      REVIEW: 0,
    };
    const roleBreakdown: Record<DesignAgentRole, number> = {
      orchestrator: 0,
      architect: 0,
      builder: 0,
      reviewer: 0,
    };
    const riskBreakdown: Record<DesignTaskRisk, number> = {
      R0: 0,
      R1: 0,
      R2: 0,
      R3: 0,
    };

    for (const a of assignments) {
      phaseBreakdown[a.targetPhase]++;
      roleBreakdown[a.assignedRole]++;
      riskBreakdown[a.riskLevel]++;
    }

    const warnings = this.buildWarnings(plan, assignments);

    const orchestrationHash = computeDeterministicHash(
      "w1-t3-cp3-orchestration",
      `${createdAt}:${plan.planId}`,
      `assignments:${assignments.length}`,
      assignments.map((a) => a.assignmentId).join(":"),
    );

    return {
      orchestrationId: orchestrationHash,
      createdAt,
      planId: plan.planId,
      consumerId: plan.consumerId,
      assignments,
      totalAssignments: assignments.length,
      phaseBreakdown,
      roleBreakdown,
      riskBreakdown,
      orchestrationHash,
      warnings,
    };
  }

  private buildWarnings(
    plan: DesignPlan,
    assignments: TaskAssignment[],
  ): string[] {
    const warnings: string[] = [];

    if (plan.warnings.length > 0) {
      warnings.push(
        `Design plan carried ${plan.warnings.length} warning(s) into orchestration.`,
      );
    }

    const r3Assignments = assignments.filter((a) => a.riskLevel === "R3");
    if (r3Assignments.length > 0) {
      warnings.push(
        `${r3Assignments.length} assignment(s) at R3 — full governance review required before dispatch.`,
      );
    }

    if (assignments.length === 0) {
      warnings.push(
        "Orchestration produced zero assignments — plan may be empty or invalid.",
      );
    }

    const blockedAssignments = assignments.filter(
      (a) => a.dependencies.length > 0,
    );
    if (blockedAssignments.length > 0) {
      warnings.push(
        `${blockedAssignments.length} assignment(s) have unresolved dependencies — execution order matters.`,
      );
    }

    return warnings;
  }
}

export function createOrchestrationContract(
  dependencies?: OrchestrationContractDependencies,
): OrchestrationContract {
  return new OrchestrationContract(dependencies);
}
