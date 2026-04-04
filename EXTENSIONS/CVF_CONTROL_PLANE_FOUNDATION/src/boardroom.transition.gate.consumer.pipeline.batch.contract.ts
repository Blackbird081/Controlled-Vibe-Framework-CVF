import type { BoardroomTransitionGateConsumerPipelineResult } from "./boardroom.transition.gate.consumer.pipeline.contract";
import type { BoardroomTransitionAction } from "./boardroom.transition.gate.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

export interface BoardroomTransitionGateConsumerPipelineBatchResult {
  batchId: string;
  batchHash: string;
  createdAt: string;
  totalGates: number;
  allowedCount: number;
  blockedCount: number;
  escalationRequiredCount: number;
  dominantAction: BoardroomTransitionAction;
  dominantTokenBudget: number;
  results: BoardroomTransitionGateConsumerPipelineResult[];
}

export interface BoardroomTransitionGateConsumerPipelineBatchContractDependencies {
  now?: () => string;
}

// --- Action Priority (severity-first, worst action dominates) ---

const ACTION_PRIORITY: Record<BoardroomTransitionAction, number> = {
  STOP_EXECUTION: 4,
  ESCALATE_FOR_REVIEW: 3,
  RETURN_TO_DESIGN: 2,
  PROCEED_TO_ORCHESTRATION: 1,
};

function computeDominantAction(
  results: BoardroomTransitionGateConsumerPipelineResult[],
): BoardroomTransitionAction {
  if (results.length === 0) return "PROCEED_TO_ORCHESTRATION";

  let dominant: BoardroomTransitionAction = "PROCEED_TO_ORCHESTRATION";
  let maxPriority = ACTION_PRIORITY["PROCEED_TO_ORCHESTRATION"];

  for (const r of results) {
    const action = r.gateResult.action;
    const priority = ACTION_PRIORITY[action];
    if (priority > maxPriority) {
      dominant = action;
      maxPriority = priority;
    }
  }

  return dominant;
}

// --- Contract ---

export class BoardroomTransitionGateConsumerPipelineBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: BoardroomTransitionGateConsumerPipelineBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    results: BoardroomTransitionGateConsumerPipelineResult[],
  ): BoardroomTransitionGateConsumerPipelineBatchResult {
    const createdAt = this.now();

    const totalGates = results.length;
    const allowedCount = results.filter((r) => r.gateResult.allowOrchestration).length;
    const blockedCount = results.filter((r) => !r.gateResult.allowOrchestration).length;
    const escalationRequiredCount = results.filter((r) => r.gateResult.escalationRequired).length;
    const dominantAction = computeDominantAction(results);
    const dominantTokenBudget =
      results.length === 0
        ? 0
        : Math.max(
            ...results.map(
              (r) => r.consumerPackage.typedContextPackage.estimatedTokens,
            ),
          );

    const batchHash = computeDeterministicHash(
      "w2-t31-cp2-boardroom-transition-gate-consumer-batch",
      `totalGates=${totalGates}`,
      `allowed=${allowedCount}`,
      `blocked=${blockedCount}`,
      `escalation=${escalationRequiredCount}`,
      `dominantAction=${dominantAction}`,
      ...results.map((r) => r.pipelineHash),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w2-t31-cp2-batch-id",
      batchHash,
    );

    return {
      batchId,
      batchHash,
      createdAt,
      totalGates,
      allowedCount,
      blockedCount,
      escalationRequiredCount,
      dominantAction,
      dominantTokenBudget,
      results,
    };
  }
}

export function createBoardroomTransitionGateConsumerPipelineBatchContract(
  dependencies?: BoardroomTransitionGateConsumerPipelineBatchContractDependencies,
): BoardroomTransitionGateConsumerPipelineBatchContract {
  return new BoardroomTransitionGateConsumerPipelineBatchContract(dependencies);
}
