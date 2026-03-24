import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { BoardroomDecision } from "./boardroom.contract";
import type { BoardroomConsumerPipelineResult } from "./boardroom.consumer.pipeline.contract";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BoardroomConsumerPipelineBatch {
  batchId: string;
  createdAt: string;
  results: BoardroomConsumerPipelineResult[];
  totalResults: number;
  dominantTokenBudget: number;
  rejectCount: number;
  escalateCount: number;
  batchHash: string;
}

export interface BoardroomConsumerPipelineBatchContractDependencies {
  now?: () => string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function countDecision(
  results: BoardroomConsumerPipelineResult[],
  decision: BoardroomDecision,
): number {
  return results.filter(
    (r) => r.multiRoundSummary.dominantDecision === decision,
  ).length;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * BoardroomConsumerPipelineBatchContract (W1-T16 CP2 — Fast Lane)
 * ---------------------------------------------------------------
 * Aggregates BoardroomConsumerPipelineResult[] into a governed batch.
 *
 * Pattern:
 *   dominantTokenBudget = Math.max(...results.map(r => r.consumerPackage.typedContextPackage.estimatedTokens))
 *   empty batch → dominantTokenBudget = 0, valid hash
 *   batchId ≠ batchHash  (batchId = hash of batchHash only)
 *   rejectCount = count of REJECT dominant decisions
 *   escalateCount = count of ESCALATE dominant decisions
 */
export class BoardroomConsumerPipelineBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: BoardroomConsumerPipelineBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    results: BoardroomConsumerPipelineResult[],
  ): BoardroomConsumerPipelineBatch {
    const createdAt = this.now();

    const dominantTokenBudget =
      results.length === 0
        ? 0
        : Math.max(
            ...results.map(
              (r) => r.consumerPackage.typedContextPackage.estimatedTokens,
            ),
          );

    const rejectCount = countDecision(results, "REJECT");
    const escalateCount = countDecision(results, "ESCALATE");

    const batchHash = computeDeterministicHash(
      "w1-t16-cp2-boardroom-consumer-pipeline-batch",
      ...results.map((r) => r.pipelineHash),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w1-t16-cp2-batch-id",
      batchHash,
    );

    return {
      batchId,
      createdAt,
      results,
      totalResults: results.length,
      dominantTokenBudget,
      rejectCount,
      escalateCount,
      batchHash,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createBoardroomConsumerPipelineBatchContract(
  dependencies?: BoardroomConsumerPipelineBatchContractDependencies,
): BoardroomConsumerPipelineBatchContract {
  return new BoardroomConsumerPipelineBatchContract(dependencies);
}
