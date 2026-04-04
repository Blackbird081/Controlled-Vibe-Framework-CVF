import type { BoardroomMultiRoundSummary } from "./boardroom.multi.round.contract";
import type { BoardroomDecision } from "./boardroom.contract";
import {
  ControlPlaneConsumerPipelineContract,
  createControlPlaneConsumerPipelineContract,
} from "./consumer.pipeline.contract";
import type {
  ControlPlaneConsumerPackage,
  ControlPlaneConsumerPipelineContractDependencies,
} from "./consumer.pipeline.contract";
import type { RankableKnowledgeItem, ScoringWeights } from "./knowledge.ranking.contract";
import type { SegmentTypeConstraints } from "./context.packager.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

export interface BoardroomMultiRoundConsumerPipelineRequest {
  multiRoundSummary: BoardroomMultiRoundSummary;
  candidateItems?: RankableKnowledgeItem[];
  scoringWeights?: ScoringWeights;
  segmentTypeConstraints?: SegmentTypeConstraints;
  consumerId?: string;
}

export interface BoardroomMultiRoundConsumerPipelineResult {
  resultId: string;
  createdAt: string;
  multiRoundSummary: BoardroomMultiRoundSummary;
  consumerPackage: ControlPlaneConsumerPackage;
  query: string;
  contextId: string;
  warnings: string[];
  consumerId: string | undefined;
  pipelineHash: string;
}

export interface BoardroomMultiRoundConsumerPipelineContractDependencies {
  now?: () => string;
}

// --- Contract ---

export class BoardroomMultiRoundConsumerPipelineContract {
  private readonly consumerPipelineContract: ControlPlaneConsumerPipelineContract;
  private readonly now: () => string;

  constructor(
    dependencies: BoardroomMultiRoundConsumerPipelineContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    const consumerDeps: ControlPlaneConsumerPipelineContractDependencies = {
      now: this.now,
    };
    this.consumerPipelineContract = createControlPlaneConsumerPipelineContract(consumerDeps);
  }

  execute(
    request: BoardroomMultiRoundConsumerPipelineRequest,
  ): BoardroomMultiRoundConsumerPipelineResult {
    const createdAt = this.now();
    const { multiRoundSummary } = request;

    // Derive query from multi-round summary
    const query =
      `BoardroomMultiRound: rounds=${multiRoundSummary.totalRounds}, ` +
      `dominant=${multiRoundSummary.dominantDecision}, ` +
      `proceed=${multiRoundSummary.proceedCount}, ` +
      `reject=${multiRoundSummary.rejectCount}`;

    // Extract contextId
    const contextId = multiRoundSummary.summaryId;

    // Build warnings
    const warnings: string[] = [];
    if (multiRoundSummary.totalRounds === 0) {
      warnings.push("WARNING_NO_ROUNDS");
    }
    if (multiRoundSummary.rejectCount > 0) {
      warnings.push("WARNING_REJECTED");
    }
    if (multiRoundSummary.escalateCount > 0) {
      warnings.push("WARNING_ESCALATED");
    }
    if (multiRoundSummary.amendCount > 0) {
      warnings.push("WARNING_AMENDED");
    }

    // Build consumer package
    const consumerPackage = this.consumerPipelineContract.execute({
      rankingRequest: {
        query,
        contextId,
        candidateItems: request.candidateItems ?? [],
        scoringWeights: request.scoringWeights,
      },
      segmentTypeConstraints: request.segmentTypeConstraints,
    });

    // Compute pipeline hash
    const pipelineHash = computeDeterministicHash(
      "w2-t30-cp1-boardroom-multi-round-consumer-pipeline",
      multiRoundSummary.summaryHash,
      consumerPackage.pipelineHash,
      `dominant=${multiRoundSummary.dominantDecision}`,
      `rounds=${multiRoundSummary.totalRounds}`,
      `warnings=${warnings.length}`,
      createdAt,
    );

    const resultId = computeDeterministicHash(
      "w2-t30-cp1-result-id",
      pipelineHash,
    );

    return {
      resultId,
      createdAt,
      multiRoundSummary,
      consumerPackage,
      query,
      contextId,
      warnings,
      consumerId: request.consumerId,
      pipelineHash,
    };
  }
}

export function createBoardroomMultiRoundConsumerPipelineContract(
  dependencies?: BoardroomMultiRoundConsumerPipelineContractDependencies,
): BoardroomMultiRoundConsumerPipelineContract {
  return new BoardroomMultiRoundConsumerPipelineContract(dependencies);
}
