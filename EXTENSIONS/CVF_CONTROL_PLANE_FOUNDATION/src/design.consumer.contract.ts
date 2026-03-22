import type { ControlPlaneIntakeResult } from "./intake.contract";
import { DesignContract } from "./design.contract";
import type { DesignPlan } from "./design.contract";
import { BoardroomContract } from "./boardroom.contract";
import type { BoardroomSession, BoardroomRequest } from "./boardroom.contract";
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
    const boardroomEnd = Date.now();
    stages.push({
      stage: "BOARDROOM",
      completedAt: this.now(),
      durationMs: boardroomEnd - boardroomStart,
    });

    // Stage 4: ORCHESTRATION
    const orchestrationStart = Date.now();
    const orchestrationContract = new OrchestrationContract({ now: this.now });
    const orchestrationResult = orchestrationContract.orchestrate(
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
    if (orchestrationResult.warnings.length > 0) {
      warnings.push(
        `Orchestration phase produced ${orchestrationResult.warnings.length} warning(s).`,
      );
    }

    if (boardroomSession.decision.decision !== "PROCEED") {
      warnings.push(
        `Boardroom did not PROCEED — decision was ${boardroomSession.decision.decision}. Orchestration ran on potentially amended plan.`,
      );
    }

    const evidenceHash = computeDeterministicHash(
      "w1-t3-cp4-design-consumer",
      `${createdAt}:${intake.requestId}`,
      `plan:${designPlan.planHash}:session:${boardroomSession.sessionHash}`,
      orchestrationResult.orchestrationHash,
    );

    return {
      receiptId: evidenceHash,
      createdAt,
      consumerId: intake.consumerId,
      designPlan,
      boardroomSession,
      orchestrationResult,
      pipelineStages: stages,
      evidenceHash,
      warnings,
    };
  }
}

export function createDesignConsumerContract(
  dependencies?: DesignConsumerContractDependencies,
): DesignConsumerContract {
  return new DesignConsumerContract(dependencies);
}
