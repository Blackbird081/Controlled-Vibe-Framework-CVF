import type { RefinementFocus } from "./boardroom.round.contract";
import type { BoardroomRoundConsumerPipelineResult } from "./boardroom.round.consumer.pipeline.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

export type DominantRefinementFocus = RefinementFocus;

export interface BoardroomRoundFocusCounts {
  RISK_REVIEW: number;
  ESCALATION_REVIEW: number;
  TASK_AMENDMENT: number;
  CLARIFICATION: number;
}

export interface BoardroomRoundConsumerPipelineBatchResult {
  batchId: string;
  batchHash: string;
  createdAt: string;
  totalRounds: number;
  focusCounts: BoardroomRoundFocusCounts;
  dominantFocus: DominantRefinementFocus;
  results: BoardroomRoundConsumerPipelineResult[];
}

export interface BoardroomRoundConsumerPipelineBatchContractDependencies {
  now?: () => string;
}

// --- Severity order for dominant focus ---
// RISK_REVIEW > ESCALATION_REVIEW > TASK_AMENDMENT > CLARIFICATION

const FOCUS_SEVERITY: Record<RefinementFocus, number> = {
  RISK_REVIEW: 4,
  ESCALATION_REVIEW: 3,
  TASK_AMENDMENT: 2,
  CLARIFICATION: 1,
};

function deriveDominantFocus(results: BoardroomRoundConsumerPipelineResult[]): DominantRefinementFocus {
  if (results.length === 0) return "CLARIFICATION";
  return results.reduce<DominantRefinementFocus>((dominant, r) => {
    const focus = r.round.refinementFocus;
    return FOCUS_SEVERITY[focus] > FOCUS_SEVERITY[dominant] ? focus : dominant;
  }, "CLARIFICATION");
}

// --- Contract ---

export class BoardroomRoundConsumerPipelineBatchContract {
  private readonly now: () => string;

  constructor(dependencies: BoardroomRoundConsumerPipelineBatchContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(results: BoardroomRoundConsumerPipelineResult[]): BoardroomRoundConsumerPipelineBatchResult {
    const createdAt = this.now();

    const totalRounds = results.length;

    const focusCounts: BoardroomRoundFocusCounts = {
      RISK_REVIEW: 0,
      ESCALATION_REVIEW: 0,
      TASK_AMENDMENT: 0,
      CLARIFICATION: 0,
    };
    for (const r of results) {
      focusCounts[r.round.refinementFocus]++;
    }

    const dominantFocus = deriveDominantFocus(results);

    const batchHash = computeDeterministicHash(
      "w2-t33-cp2-boardroom-round-consumer-batch",
      `totalRounds=${totalRounds}`,
      `dominant=${dominantFocus}`,
      `risk=${focusCounts.RISK_REVIEW}`,
      `escalation=${focusCounts.ESCALATION_REVIEW}`,
      `amendment=${focusCounts.TASK_AMENDMENT}`,
      `clarification=${focusCounts.CLARIFICATION}`,
      ...results.map((r) => r.pipelineHash),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w2-t33-cp2-batch-id",
      batchHash,
    );

    return {
      batchId,
      batchHash,
      createdAt,
      totalRounds,
      focusCounts,
      dominantFocus,
      results,
    };
  }
}

export function createBoardroomRoundConsumerPipelineBatchContract(
  dependencies?: BoardroomRoundConsumerPipelineBatchContractDependencies,
): BoardroomRoundConsumerPipelineBatchContract {
  return new BoardroomRoundConsumerPipelineBatchContract(dependencies);
}
