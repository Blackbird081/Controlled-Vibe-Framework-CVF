import type { BoardroomMultiRoundConsumerPipelineResult } from "./boardroom.multi.round.consumer.pipeline.contract";
import type { BoardroomDecision } from "./boardroom.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

export interface BoardroomMultiRoundConsumerPipelineBatchResult {
  batchId: string;
  batchHash: string;
  createdAt: string;
  totalSummaries: number;
  totalRounds: number;
  dominantDecision: BoardroomDecision;
  dominantTokenBudget: number;
  results: BoardroomMultiRoundConsumerPipelineResult[];
}

export interface BoardroomMultiRoundConsumerPipelineBatchContractDependencies {
  now?: () => string;
}

// --- Decision Priority ---

const DECISION_PRIORITY: Record<BoardroomDecision, number> = {
  REJECT: 4,
  ESCALATE: 3,
  AMEND_PLAN: 2,
  PROCEED: 1,
};

function computeDominantDecision(
  results: BoardroomMultiRoundConsumerPipelineResult[],
): BoardroomDecision {
  if (results.length === 0) return "PROCEED";

  let dominant: BoardroomDecision = "PROCEED";
  let maxPriority = DECISION_PRIORITY["PROCEED"];

  for (const r of results) {
    const d = r.multiRoundSummary.dominantDecision;
    const priority = DECISION_PRIORITY[d];
    if (priority > maxPriority) {
      dominant = d;
      maxPriority = priority;
    }
  }

  return dominant;
}

// --- Contract ---

export class BoardroomMultiRoundConsumerPipelineBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: BoardroomMultiRoundConsumerPipelineBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    results: BoardroomMultiRoundConsumerPipelineResult[],
  ): BoardroomMultiRoundConsumerPipelineBatchResult {
    const createdAt = this.now();

    const totalSummaries = results.length;
    const totalRounds = results.reduce(
      (sum, r) => sum + r.multiRoundSummary.totalRounds,
      0,
    );
    const dominantDecision = computeDominantDecision(results);
    const dominantTokenBudget =
      results.length === 0
        ? 0
        : Math.max(
            ...results.map(
              (r) => r.consumerPackage.typedContextPackage.estimatedTokens,
            ),
          );

    const batchHash = computeDeterministicHash(
      "w2-t30-cp2-boardroom-multi-round-consumer-batch",
      `totalSummaries=${totalSummaries}`,
      `totalRounds=${totalRounds}`,
      `dominantDecision=${dominantDecision}`,
      `dominantTokenBudget=${dominantTokenBudget}`,
      ...results.map((r) => r.pipelineHash),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w2-t30-cp2-batch-id",
      batchHash,
    );

    return {
      batchId,
      batchHash,
      createdAt,
      totalSummaries,
      totalRounds,
      dominantDecision,
      dominantTokenBudget,
      results,
    };
  }
}

export function createBoardroomMultiRoundConsumerPipelineBatchContract(
  dependencies?: BoardroomMultiRoundConsumerPipelineBatchContractDependencies,
): BoardroomMultiRoundConsumerPipelineBatchContract {
  return new BoardroomMultiRoundConsumerPipelineBatchContract(dependencies);
}
