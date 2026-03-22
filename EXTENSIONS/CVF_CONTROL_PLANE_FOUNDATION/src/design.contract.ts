import type { ControlPlaneIntakeResult } from "./intake.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

export type DesignAgentRole =
  | "orchestrator"
  | "architect"
  | "builder"
  | "reviewer";

export type DesignTaskRisk = "R0" | "R1" | "R2" | "R3";

export type DesignTaskPhase = "DESIGN" | "BUILD" | "REVIEW";

export interface DesignTask {
  taskId: string;
  title: string;
  description: string;
  assignedRole: DesignAgentRole;
  riskLevel: DesignTaskRisk;
  targetPhase: DesignTaskPhase;
  estimatedComplexity: "low" | "medium" | "high";
  dependencies: string[];
}

export interface DesignPlan {
  planId: string;
  createdAt: string;
  intakeRequestId: string;
  consumerId?: string;
  vibeOriginal: string;
  domainDetected: string;
  tasks: DesignTask[];
  totalTasks: number;
  riskSummary: Record<DesignTaskRisk, number>;
  roleSummary: Record<DesignAgentRole, number>;
  planHash: string;
  warnings: string[];
}

export interface DesignContractDependencies {
  now?: () => string;
}

// --- Risk Assessment ---

function assessIntakeRisk(
  intakeResult: ControlPlaneIntakeResult,
): DesignTaskRisk {
  const intent = intakeResult.intent;
  if (!intent.valid) return "R2";

  const domain = intent.intent.domain;
  if (domain === "finance" || domain === "infrastructure") return "R3";
  if (domain === "code_security" || domain === "data") return "R2";
  if (domain === "privacy" || domain === "communication") return "R1";
  return "R0";
}

function assessTaskRisk(
  baseRisk: DesignTaskRisk,
  phase: DesignTaskPhase,
): DesignTaskRisk {
  if (phase === "BUILD" && baseRisk === "R0") return "R1";
  return baseRisk;
}

// --- Task Decomposition ---

function decomposeIntake(
  intakeResult: ControlPlaneIntakeResult,
  baseRisk: DesignTaskRisk,
): DesignTask[] {
  const tasks: DesignTask[] = [];
  const intent = intakeResult.intent;
  const domain = intent.intent.domain;
  const action = intent.intent.action;
  let taskIndex = 0;

  const makeTaskId = (): string => {
    taskIndex++;
    return computeDeterministicHash(
      "design-task",
      intakeResult.requestId,
      `task-${taskIndex}`,
      `${domain}:${action}`,
    );
  };

  tasks.push({
    taskId: makeTaskId(),
    title: `Analyze requirements for ${domain}/${action}`,
    description: `Review intake context and validate design constraints for domain "${domain}" with action "${action}"`,
    assignedRole: "architect",
    riskLevel: baseRisk,
    targetPhase: "DESIGN",
    estimatedComplexity: intent.valid ? "low" : "medium",
    dependencies: [],
  });

  const hasContext =
    intakeResult.packagedContext.chunks.length > 0;
  if (hasContext) {
    tasks.push({
      taskId: makeTaskId(),
      title: `Design solution from ${intakeResult.packagedContext.chunks.length} context chunks`,
      description: `Synthesize ${intakeResult.packagedContext.totalTokens} tokens of retrieved context into an actionable design`,
      assignedRole: "architect",
      riskLevel: baseRisk,
      targetPhase: "DESIGN",
      estimatedComplexity:
        intakeResult.packagedContext.totalTokens > 128 ? "high" : "medium",
      dependencies: [tasks[0].taskId],
    });
  }

  tasks.push({
    taskId: makeTaskId(),
    title: `Implement ${action} for ${domain}`,
    description: `Execute the governed implementation based on the design plan`,
    assignedRole: "builder",
    riskLevel: assessTaskRisk(baseRisk, "BUILD"),
    targetPhase: "BUILD",
    estimatedComplexity: baseRisk === "R3" ? "high" : "medium",
    dependencies: hasContext
      ? [tasks[tasks.length - 1].taskId]
      : [tasks[0].taskId],
  });

  if (baseRisk === "R2" || baseRisk === "R3") {
    tasks.push({
      taskId: makeTaskId(),
      title: `Review ${action} implementation for ${domain}`,
      description: `Audit the implementation against governance constraints and risk level ${baseRisk}`,
      assignedRole: "reviewer",
      riskLevel: baseRisk,
      targetPhase: "REVIEW",
      estimatedComplexity: "medium",
      dependencies: [tasks[tasks.length - 1].taskId],
    });
  }

  return tasks;
}

// --- Contract ---

export class DesignContract {
  private readonly now: () => string;

  constructor(dependencies: DesignContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  design(intakeResult: ControlPlaneIntakeResult): DesignPlan {
    const createdAt = this.now();
    const baseRisk = assessIntakeRisk(intakeResult);
    const tasks = decomposeIntake(intakeResult, baseRisk);

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
      riskSummary[task.riskLevel]++;
      roleSummary[task.assignedRole]++;
    }

    const warnings = this.buildWarnings(intakeResult, tasks);

    const planHash = computeDeterministicHash(
      "w1-t3-cp1-design",
      `${createdAt}:${intakeResult.requestId}`,
      `tasks:${tasks.length}:risk:${baseRisk}`,
      tasks.map((t) => t.taskId).join(":"),
    );

    return {
      planId: planHash,
      createdAt,
      intakeRequestId: intakeResult.requestId,
      consumerId: intakeResult.consumerId,
      vibeOriginal: intakeResult.intent.intent.rawVibe,
      domainDetected: intakeResult.intent.intent.domain,
      tasks,
      totalTasks: tasks.length,
      riskSummary,
      roleSummary,
      planHash,
      warnings,
    };
  }

  private buildWarnings(
    intakeResult: ControlPlaneIntakeResult,
    tasks: DesignTask[],
  ): string[] {
    const warnings: string[] = [];

    if (!intakeResult.intent.valid) {
      warnings.push(
        "Design plan generated from a low-confidence or invalid intent result.",
      );
    }

    if (intakeResult.packagedContext.chunks.length === 0) {
      warnings.push(
        "Design plan has no retrieved context — tasks may lack sufficient information.",
      );
    }

    if (intakeResult.warnings.length > 0) {
      warnings.push(
        `Intake produced ${intakeResult.warnings.length} warning(s) that may affect design quality.`,
      );
    }

    const highRiskTasks = tasks.filter(
      (t) => t.riskLevel === "R3",
    );
    if (highRiskTasks.length > 0) {
      warnings.push(
        `${highRiskTasks.length} task(s) assessed at R3 — full governance review path required.`,
      );
    }

    return warnings;
  }
}

export function createDesignContract(
  dependencies?: DesignContractDependencies,
): DesignContract {
  return new DesignContract(dependencies);
}
