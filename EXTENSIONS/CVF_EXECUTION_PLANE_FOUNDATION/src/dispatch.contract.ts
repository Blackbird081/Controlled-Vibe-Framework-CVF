import type { TaskAssignment } from "../../CVF_CONTROL_PLANE_FOUNDATION/src/orchestration.contract";
import {
  GuardRuntimeEngine,
  createGuardEngine,
} from "../../CVF_ECO_v2.5_MCP_SERVER/src/sdk";
import type {
  GuardRequestContext,
  GuardPipelineResult,
  GuardDecision,
  CVFPhase,
  CVFRole,
} from "../../CVF_ECO_v2.5_MCP_SERVER/src/sdk";
import type { DesignTaskRisk, DesignTaskPhase, DesignAgentRole } from "../../CVF_CONTROL_PLANE_FOUNDATION/src/design.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Role Mapping ---

function mapAgentRoleToGuardRole(role: DesignAgentRole): CVFRole {
  if (role === "reviewer") return "REVIEWER";
  return "AI_AGENT";
}

// --- Phase Mapping ---

function mapDesignPhaseToGuardPhase(phase: DesignTaskPhase): CVFPhase {
  // DesignTaskPhase: DESIGN | BUILD | REVIEW — all are valid CVFPhase values
  return phase as CVFPhase;
}

// --- Types ---

export interface DispatchEntry {
  assignmentId: string;
  taskId: string;
  riskLevel: DesignTaskRisk;
  dispatchedAt: string;
  guardDecision: GuardDecision;
  pipelineResult: GuardPipelineResult;
  dispatchAuthorized: boolean;
  blockedBy?: string;
  escalatedBy?: string;
  agentGuidance?: string;
}

export interface DispatchResult {
  dispatchId: string;
  orchestrationId: string;
  dispatchedAt: string;
  entries: DispatchEntry[];
  totalDispatched: number;
  authorizedCount: number;
  blockedCount: number;
  escalatedCount: number;
  dispatchHash: string;
  warnings: string[];
}

export interface DispatchContractDependencies {
  engine?: GuardRuntimeEngine;
  now?: () => string;
}

// --- Contract ---

export class DispatchContract {
  private readonly engine: GuardRuntimeEngine;
  private readonly now: () => string;

  constructor(dependencies: DispatchContractDependencies = {}) {
    this.engine = dependencies.engine ?? createGuardEngine();
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  dispatch(orchestrationId: string, assignments: TaskAssignment[]): DispatchResult {
    const dispatchedAt = this.now();

    const entries: DispatchEntry[] = assignments.map((assignment) => {
      const context: GuardRequestContext = {
        requestId: assignment.assignmentId,
        phase: mapDesignPhaseToGuardPhase(assignment.targetPhase),
        riskLevel: assignment.riskLevel as DesignTaskRisk,
        role: mapAgentRoleToGuardRole(assignment.assignedRole),
        agentId: `dispatch-w2-t2:${assignment.assignedRole}`,
        action: assignment.title,
        scope: assignment.scopeConstraints.join("; "),
        traceHash: assignment.executionAuthorizationHash,
        metadata: {
          taskId: assignment.taskId,
          assignmentId: assignment.assignmentId,
          tranche: "W2-T2",
          dependencies: assignment.dependencies,
        },
      };

      const pipelineResult = this.engine.evaluate(context);

      return {
        assignmentId: assignment.assignmentId,
        taskId: assignment.taskId,
        riskLevel: assignment.riskLevel as DesignTaskRisk,
        dispatchedAt,
        guardDecision: pipelineResult.finalDecision,
        pipelineResult,
        dispatchAuthorized: pipelineResult.finalDecision === "ALLOW",
        blockedBy: pipelineResult.blockedBy,
        escalatedBy: pipelineResult.escalatedBy,
        agentGuidance: pipelineResult.agentGuidance,
      };
    });

    const authorizedCount = entries.filter((e) => e.dispatchAuthorized).length;
    const blockedCount = entries.filter((e) => e.guardDecision === "BLOCK").length;
    const escalatedCount = entries.filter((e) => e.guardDecision === "ESCALATE").length;

    const warnings = buildDispatchWarnings(entries);

    const dispatchHash = computeDeterministicHash(
      "w2-t2-cp1-dispatch",
      `${dispatchedAt}:${orchestrationId}`,
      `dispatched:${entries.length}`,
      entries.map((e) => `${e.assignmentId}:${e.guardDecision}`).join(":"),
    );

    return {
      dispatchId: dispatchHash,
      orchestrationId,
      dispatchedAt,
      entries,
      totalDispatched: entries.length,
      authorizedCount,
      blockedCount,
      escalatedCount,
      dispatchHash,
      warnings,
    };
  }
}

function buildDispatchWarnings(entries: DispatchEntry[]): string[] {
  const warnings: string[] = [];

  const blocked = entries.filter((e) => e.guardDecision === "BLOCK");
  if (blocked.length > 0) {
    warnings.push(
      `${blocked.length} assignment(s) BLOCKED by guard engine — review blockedBy field before retry.`,
    );
  }

  const escalated = entries.filter((e) => e.guardDecision === "ESCALATE");
  if (escalated.length > 0) {
    warnings.push(
      `${escalated.length} assignment(s) ESCALATED — human review required before dispatch.`,
    );
  }

  if (entries.length === 0) {
    warnings.push("Dispatch received zero assignments — orchestration result may be empty.");
  }

  return warnings;
}

export function createDispatchContract(
  dependencies?: DispatchContractDependencies,
): DispatchContract {
  return new DispatchContract(dependencies);
}
