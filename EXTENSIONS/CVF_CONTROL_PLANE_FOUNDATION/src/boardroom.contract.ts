import type { DesignPlan, DesignTask } from "./design.contract";
import { GovernanceCanvas } from "../../CVF_ECO_v2.1_GOVERNANCE_CANVAS/src/canvas";
import type { GovernanceMetrics } from "../../CVF_ECO_v2.1_GOVERNANCE_CANVAS/src/types";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

export type ClarificationStatus = "pending" | "answered" | "skipped";

export interface ClarificationEntry {
  questionId: string;
  question: string;
  answer?: string;
  status: ClarificationStatus;
}

export type BoardroomDecision =
  | "PROCEED"
  | "AMEND_PLAN"
  | "ESCALATE"
  | "REJECT";

export interface BoardroomSessionDecision {
  decision: BoardroomDecision;
  rationale: string;
  amendedTasks?: string[];
}

export interface BoardroomSession {
  sessionId: string;
  createdAt: string;
  planId: string;
  consumerId?: string;
  clarifications: ClarificationEntry[];
  decision: BoardroomSessionDecision;
  governanceSnapshot: GovernanceMetrics;
  finalPlan: DesignPlan;
  sessionHash: string;
  warnings: string[];
}

export interface BoardroomRequest {
  plan: DesignPlan;
  clarifications?: Array<{ question: string; answer?: string }>;
}

export interface BoardroomContractDependencies {
  canvas?: GovernanceCanvas;
  now?: () => string;
}

// --- Decision Logic ---

function evaluatePlan(
  plan: DesignPlan,
  clarifications: ClarificationEntry[],
): BoardroomSessionDecision {
  const unanswered = clarifications.filter((c) => c.status === "pending");
  if (unanswered.length > 0) {
    return {
      decision: "AMEND_PLAN",
      rationale: `${unanswered.length} clarification(s) remain unanswered — plan may need revision.`,
      amendedTasks: [],
    };
  }

  const highRiskTasks = plan.tasks.filter((t) => t.riskLevel === "R3");
  if (highRiskTasks.length > 0 && plan.warnings.length > 0) {
    return {
      decision: "ESCALATE",
      rationale: `${highRiskTasks.length} R3 task(s) combined with ${plan.warnings.length} intake warning(s) — requires escalation review.`,
      amendedTasks: highRiskTasks.map((t) => t.taskId),
    };
  }

  if (!plan.planId || plan.tasks.length === 0) {
    return {
      decision: "REJECT",
      rationale: "Design plan is empty or has no valid plan ID.",
    };
  }

  return {
    decision: "PROCEED",
    rationale: `Plan ${plan.planId.slice(0, 8)}… approved with ${plan.totalTasks} task(s), all clarifications resolved.`,
  };
}

function buildClarifications(
  input?: Array<{ question: string; answer?: string }>,
): ClarificationEntry[] {
  if (!input || input.length === 0) return [];

  return input.map((c, i) => ({
    questionId: computeDeterministicHash(
      "boardroom-clarification",
      `q-${i}`,
      c.question,
      c.answer ?? "unanswered",
    ),
    question: c.question,
    answer: c.answer,
    status: (c.answer && c.answer.trim().length > 0
      ? "answered"
      : "pending") as ClarificationStatus,
  }));
}

function applyAmendments(
  plan: DesignPlan,
  decision: BoardroomSessionDecision,
  clarifications: ClarificationEntry[],
): DesignPlan {
  if (decision.decision !== "AMEND_PLAN" && decision.decision !== "ESCALATE") {
    return plan;
  }

  const answeredClarifications = clarifications.filter(
    (c) => c.status === "answered",
  );

  if (answeredClarifications.length === 0) {
    return plan;
  }

  const updatedTasks: DesignTask[] = plan.tasks.map((task) => {
    if (
      decision.amendedTasks &&
      decision.amendedTasks.includes(task.taskId)
    ) {
      return {
        ...task,
        description: `${task.description} [amended after boardroom review]`,
      };
    }
    return task;
  });

  return {
    ...plan,
    tasks: updatedTasks,
  };
}

// --- Contract ---

export class BoardroomContract {
  private readonly canvas: GovernanceCanvas;
  private readonly now: () => string;

  constructor(dependencies: BoardroomContractDependencies = {}) {
    this.canvas = dependencies.canvas ?? new GovernanceCanvas();
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  review(request: BoardroomRequest): BoardroomSession {
    const createdAt = this.now();
    const clarifications = buildClarifications(request.clarifications);
    const decision = evaluatePlan(request.plan, clarifications);
    const finalPlan = applyAmendments(
      request.plan,
      decision,
      clarifications,
    );

    this.canvas.addSession({
      sessionId: request.plan.planId,
      agentId: "boardroom",
      actionCount: request.plan.totalTasks,
      cumulativeRisk: Object.entries(request.plan.riskSummary).reduce(
        (acc, [level, count]) => {
          const weight =
            level === "R3" ? 4 : level === "R2" ? 3 : level === "R1" ? 2 : 1;
          return acc + weight * count;
        },
        0,
      ),
      highestRisk:
        request.plan.riskSummary.R3 > 0
          ? "R3"
          : request.plan.riskSummary.R2 > 0
            ? "R2"
            : request.plan.riskSummary.R1 > 0
              ? "R1"
              : "R0",
      verdictCounts: {
        ALLOW: decision.decision === "PROCEED" ? 1 : 0,
        WARN: decision.decision === "AMEND_PLAN" ? 1 : 0,
        ESCALATE: decision.decision === "ESCALATE" ? 1 : 0,
        BLOCK: decision.decision === "REJECT" ? 1 : 0,
      },
      domainBreakdown: { [request.plan.domainDetected]: 1 },
      startedAt: Date.now(),
      endedAt: Date.now(),
    });

    const governanceSnapshot = this.canvas.getMetrics();

    const warnings = this.buildWarnings(
      request.plan,
      clarifications,
      decision,
    );

    const sessionHash = computeDeterministicHash(
      "w1-t3-cp2-boardroom",
      `${createdAt}:${request.plan.planId}`,
      `decision:${decision.decision}:clarifications:${clarifications.length}`,
      finalPlan.planHash,
    );

    return {
      sessionId: sessionHash,
      createdAt,
      planId: request.plan.planId,
      consumerId: request.plan.consumerId,
      clarifications,
      decision,
      governanceSnapshot,
      finalPlan,
      sessionHash,
      warnings,
    };
  }

  private buildWarnings(
    plan: DesignPlan,
    clarifications: ClarificationEntry[],
    decision: BoardroomSessionDecision,
  ): string[] {
    const warnings: string[] = [];

    if (plan.warnings.length > 0) {
      warnings.push(
        `Design plan carried ${plan.warnings.length} warning(s) into the boardroom session.`,
      );
    }

    const pending = clarifications.filter((c) => c.status === "pending");
    if (pending.length > 0) {
      warnings.push(
        `${pending.length} clarification(s) remain unanswered.`,
      );
    }

    if (decision.decision === "ESCALATE") {
      warnings.push(
        "Boardroom escalated this plan — requires additional review before orchestration.",
      );
    }

    if (decision.decision === "REJECT") {
      warnings.push(
        "Boardroom rejected this plan — orchestration should not proceed.",
      );
    }

    return warnings;
  }
}

export function createBoardroomContract(
  dependencies?: BoardroomContractDependencies,
): BoardroomContract {
  return new BoardroomContract(dependencies);
}
