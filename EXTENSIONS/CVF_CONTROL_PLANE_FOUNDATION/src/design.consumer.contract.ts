import type { ControlPlaneIntakeResult } from "./intake.contract";
import { DesignContract } from "./design.contract";
import type { DesignPlan } from "./design.contract";
import { BoardroomContract } from "./boardroom.contract";
import type { BoardroomSession, BoardroomRequest } from "./boardroom.contract";
import {
  BoardroomTransitionGateContract,
} from "./boardroom.transition.gate.contract";
import type {
  BoardroomTransitionGateResult,
} from "./boardroom.transition.gate.contract";
import { OrchestrationContract } from "./orchestration.contract";
import type { OrchestrationResult } from "./orchestration.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

export type DesignPipelineStage =
  | "INTAKE"
  | "DESIGN"
  | "BOARDROOM"
  | "ORCHESTRATION";

export interface DesignPipelineStageEntry {
  stage: DesignPipelineStage;
  completedAt: string;
  durationMs: number;
}

export interface DesignConsumptionReceipt {
  receiptId: string;
  createdAt: string;
  consumerId?: string;
  designPlan: DesignPlan;
  boardroomSession: BoardroomSession;
  boardroomTransition: BoardroomTransitionGateResult;
  orchestrationBlocked: boolean;
  orchestrationResult: OrchestrationResult;
  pipelineStages: DesignPipelineStageEntry[];
  evidenceHash: string;
  warnings: string[];
}

export interface DesignConsumerContractDependencies {
  now?: () => string;
  clarifications?: BoardroomRequest["clarifications"];
}

// --- Contract ---

export class DesignConsumerContract {
  private readonly now: () => string;
  private readonly clarifications?: BoardroomRequest["clarifications"];

  constructor(dependencies: DesignConsumerContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.clarifications = dependencies.clarifications;
  }

  consume(intake: ControlPlaneIntakeResult): DesignConsumptionReceipt {
    const createdAt = this.now();
    const stages: DesignPipelineStageEntry[] = [];
    const warnings: string[] = [];

    // Stage 1: INTAKE (already completed upstream)
    const intakeStageStart = Date.now();
    stages.push({
      stage: "INTAKE",
      completedAt: createdAt,
      durationMs: 0,
    });

    // Stage 2: DESIGN
    const designStart = Date.now();
    const designContract = new DesignContract({ now: this.now });
    const designPlan = designContract.design(intake);
    const designEnd = Date.now();
    stages.push({
      stage: "DESIGN",
      completedAt: this.now(),
      durationMs: designEnd - designStart,
    });

    // Stage 3: BOARDROOM
    const boardroomStart = Date.now();
    const boardroomContract = new BoardroomContract({ now: this.now });
    const boardroomSession = boardroomContract.review({
      plan: designPlan,
      clarifications: this.clarifications,
    });
    const boardroomTransition = new BoardroomTransitionGateContract({
      now: this.now,
    }).evaluate(boardroomSession);
    const boardroomEnd = Date.now();
    stages.push({
      stage: "BOARDROOM",
      completedAt: this.now(),
      durationMs: boardroomEnd - boardroomStart,
    });

    // Stage 4: ORCHESTRATION
    const orchestrationStart = Date.now();
    const orchestrationBlocked = !boardroomTransition.allowOrchestration;
    const orchestrationResult = orchestrationBlocked
      ? this.buildBlockedOrchestrationResult(
          boardroomSession.finalPlan,
          boardroomTransition,
        )
      : new OrchestrationContract({ now: this.now }).orchestrate(
          boardroomSession.finalPlan,
        );
    const orchestrationEnd = Date.now();
    stages.push({
      stage: "ORCHESTRATION",
      completedAt: this.now(),
      durationMs: orchestrationEnd - orchestrationStart,
    });

    // Aggregate warnings
    if (designPlan.warnings.length > 0) {
      warnings.push(
        `Design phase produced ${designPlan.warnings.length} warning(s).`,
      );
    }
    if (boardroomSession.warnings.length > 0) {
      warnings.push(
        `Boardroom phase produced ${boardroomSession.warnings.length} warning(s).`,
      );
    }
    if (boardroomTransition.blockingConditions.length > 0) {
      warnings.push(
        `Boardroom transition gate recorded ${boardroomTransition.blockingConditions.length} blocking condition(s).`,
      );
    }
    if (orchestrationResult.warnings.length > 0) {
      warnings.push(
        `Orchestration phase produced ${orchestrationResult.warnings.length} warning(s).`,
      );
    }

    if (boardroomSession.decision.decision !== "PROCEED") {
      warnings.push(
        `Boardroom did not PROCEED — decision was ${boardroomSession.decision.decision}. Transition action is ${boardroomTransition.action}.`,
      );
    }
    if (orchestrationBlocked) {
      warnings.push(
        `Downstream orchestration blocked by boardroom transition gate; next allowed stage is ${boardroomTransition.nextStage}.`,
      );
    }

    const evidenceHash = computeDeterministicHash(
      "w1-t3-cp4-design-consumer",
      `${createdAt}:${intake.requestId}`,
      `plan:${designPlan.planHash}:session:${boardroomSession.sessionHash}:gate:${boardroomTransition.gateHash}`,
      orchestrationResult.orchestrationHash,
    );

    return {
      receiptId: evidenceHash,
      createdAt,
      consumerId: intake.consumerId,
      designPlan,
      boardroomSession,
      boardroomTransition,
      orchestrationBlocked,
      orchestrationResult,
      pipelineStages: stages,
      evidenceHash,
      warnings,
    };
  }

  private buildBlockedOrchestrationResult(
    plan: DesignPlan,
    boardroomTransition: BoardroomTransitionGateResult,
  ): OrchestrationResult {
    const createdAt = this.now();
    const orchestrationHash = computeDeterministicHash(
      "gc028-orchestration-blocked",
      `${createdAt}:${plan.planId}`,
      boardroomTransition.gateHash,
      boardroomTransition.action,
    );

    return {
      orchestrationId: orchestrationHash,
      createdAt,
      planId: plan.planId,
      consumerId: plan.consumerId,
      assignments: [],
      totalAssignments: 0,
      phaseBreakdown: {
        DESIGN: 0,
        BUILD: 0,
        REVIEW: 0,
      },
      roleBreakdown: {
        orchestrator: 0,
        architect: 0,
        builder: 0,
        reviewer: 0,
      },
      riskBreakdown: {
        R0: 0,
        R1: 0,
        R2: 0,
        R3: 0,
      },
      orchestrationHash,
      warnings: [
        `Orchestration blocked by boardroom transition gate: ${boardroomTransition.action}.`,
        ...boardroomTransition.blockingConditions,
      ],
    };
  }
}

export function createDesignConsumerContract(
  dependencies?: DesignConsumerContractDependencies,
): DesignConsumerContract {
  return new DesignConsumerContract(dependencies);
}
