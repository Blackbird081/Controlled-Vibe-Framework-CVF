import type {
  BoardroomConsumerPipelineResult,
} from "./boardroom.consumer.pipeline.contract";
import type { BoardroomDecision } from "./boardroom.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

export interface BoardroomConsumerPipelineBatchResult {
  batchId: string;
  batchHash: string;
  createdAt: string;
  totalSessions: number;
  totalRounds: number;
  overallDominantDecision: BoardroomDecision;
  totalClarifications: number;
  dominantTokenBudget: number;
  results: BoardroomConsumerPipelineResult[];
}

export interface BoardroomConsumerPipelineBatchContractDependencies {
  now?: () => string;
}

// --- Helpers ---

const DECISION_PRIORITY: Record<BoardroomDecision, number> = {
  PROCEED: 4,
  REJECT: 3,
  AMEND_PLAN: 2,
  ESCALATE: 1,
};

function selectDominantDecision(
  decisionCounts: Map<BoardroomDecision, number>,
): BoardroomDecision {
  if (decisionCounts.size === 0) return "PROCEED";

  let maxCount = 0;
  let dominantDecision: BoardroomDecision = "PROCEED";

  for (const [decision, count] of decisionCounts.entries()) {
    if (
      count > maxCount ||
      (count === maxCount &&
        DECISION_PRIORITY[decision] > DECISION_PRIORITY[dominantDecision])
    ) {
      maxCount = count;
      dominantDecision = decision;
    }
  }

  return dominantDecision;
}

// --- Contract ---

export class BoardroomConsumerPipelineBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: BoardroomConsumerPipelineBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    results: BoardroomConsumerPipelineResult[],
  ): BoardroomConsumerPipelineBatchResult {
    const createdAt = this.now();

    // Aggregate metrics
    const totalSessions = results.length;
    const totalRounds = results.length; // Each session = 1 round
    const totalClarifications = results.reduce(
      (sum, r) => sum + r.boardroomSession.clarifications.length,
      0,
    );

    // Compute dominant decision (frequency-based with tie-break)
    const decisionCounts = new Map<BoardroomDecision, number>();
    results.forEach((r) => {
      const decision = r.boardroomSession.decision.decision;
      decisionCounts.set(decision, (decisionCounts.get(decision) ?? 0) + 1);
    });
    const overallDominantDecision = selectDominantDecision(decisionCounts);

    // Compute dominant token budget
    const dominantTokenBudget =
      results.length === 0
        ? 0
        : Math.max(
            ...results.map(
              (r) => r.consumerPackage.typedContextPackage.estimatedTokens,
            ),
          );

    // Compute batch hash
    const batchHash = computeDeterministicHash(
      "w1-t27-cp2-boardroom-batch",
      totalSessions.toString(),
      totalRounds.toString(),
      overallDominantDecision,
      totalClarifications.toString(),
      dominantTokenBudget.toString(),
      createdAt,
    );

    // Compute batch ID
    const batchId = computeDeterministicHash(
      "w1-t27-cp2-boardroom-batch-id",
      batchHash,
    );

    return {
      batchId,
      batchHash,
      createdAt,
      totalSessions,
      totalRounds,
      overallDominantDecision,
      totalClarifications,
      dominantTokenBudget,
      results,
    };
  }
}

export function createBoardroomConsumerPipelineBatchContract(
  dependencies?: BoardroomConsumerPipelineBatchContractDependencies,
): BoardroomConsumerPipelineBatchContract {
  return new BoardroomConsumerPipelineBatchContract(dependencies);
}
