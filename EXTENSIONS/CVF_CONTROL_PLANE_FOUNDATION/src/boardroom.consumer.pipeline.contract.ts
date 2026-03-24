import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import {
  BoardroomMultiRoundContract,
  createBoardroomMultiRoundContract,
} from "./boardroom.multi.round.contract";
import type {
  BoardroomMultiRoundSummary,
  BoardroomMultiRoundContractDependencies,
} from "./boardroom.multi.round.contract";
import type { BoardroomRound } from "./boardroom.round.contract";
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

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BoardroomConsumerPipelineRequest {
  rounds: BoardroomRound[];
  candidateItems?: RankableKnowledgeItem[];
  scoringWeights?: ScoringWeights;
  segmentTypeConstraints?: SegmentTypeConstraints;
  consumerId?: string;
}

export interface BoardroomConsumerPipelineResult {
  resultId: string;
  createdAt: string;
  consumerId?: string;
  multiRoundSummary: BoardroomMultiRoundSummary;
  consumerPackage: ControlPlaneConsumerPackage;
  pipelineHash: string;
  warnings: string[];
}

export interface BoardroomConsumerPipelineContractDependencies {
  now?: () => string;
  multiRoundContractDeps?: BoardroomMultiRoundContractDependencies;
  consumerPipelineDeps?: ControlPlaneConsumerPipelineContractDependencies;
}

// ─── Warning Builder ──────────────────────────────────────────────────────────

function buildBoardroomWarnings(decision: BoardroomDecision): string[] {
  if (decision === "REJECT") {
    return ["[boardroom] reject verdict — risk review required"];
  }
  if (decision === "ESCALATE") {
    return ["[boardroom] escalation verdict — governance review required"];
  }
  if (decision === "AMEND_PLAN") {
    return ["[boardroom] amend verdict — plan amendment required"];
  }
  return [];
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * BoardroomConsumerPipelineContract (W1-T16)
 * ------------------------------------------
 * CPF-internal consumer bridge.
 *
 * Internal chain (single execute call):
 *   BoardroomMultiRoundContract.summarize(rounds)       → BoardroomMultiRoundSummary
 *   ControlPlaneConsumerPipelineContract.execute(...)   → ControlPlaneConsumerPackage
 *   → BoardroomConsumerPipelineResult
 *
 * Determinism: all sub-contracts share the same injected now().
 * Warnings: REJECT → risk review; ESCALATE → governance review; AMEND_PLAN → plan amendment.
 */
export class BoardroomConsumerPipelineContract {
  private readonly now: () => string;
  private readonly multiRoundContract: BoardroomMultiRoundContract;
  private readonly consumerPipeline: ControlPlaneConsumerPipelineContract;

  constructor(
    dependencies: BoardroomConsumerPipelineContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.multiRoundContract = createBoardroomMultiRoundContract({
      ...dependencies.multiRoundContractDeps,
      now: this.now,
    });
    this.consumerPipeline = createControlPlaneConsumerPipelineContract({
      ...dependencies.consumerPipelineDeps,
      now: this.now,
    });
  }

  execute(
    request: BoardroomConsumerPipelineRequest,
  ): BoardroomConsumerPipelineResult {
    const createdAt = this.now();

    // Step 1: summarize boardroom rounds
    const multiRoundSummary: BoardroomMultiRoundSummary =
      this.multiRoundContract.summarize(request.rounds);

    // Step 2: derive query from summary text and build consumer package
    const query = multiRoundSummary.summary.slice(0, 120);
    const consumerPackage: ControlPlaneConsumerPackage =
      this.consumerPipeline.execute({
        rankingRequest: {
          query,
          contextId: multiRoundSummary.summaryId,
          candidateItems: request.candidateItems ?? [],
          scoringWeights: request.scoringWeights,
        },
        segmentTypeConstraints: request.segmentTypeConstraints,
      });

    // Step 3: build warnings based on dominant decision
    const warnings = buildBoardroomWarnings(multiRoundSummary.dominantDecision);

    // Step 4: deterministic hash + resultId
    const pipelineHash = computeDeterministicHash(
      "w1-t16-cp1-boardroom-consumer-pipeline",
      multiRoundSummary.summaryHash,
      consumerPackage.pipelineHash,
      createdAt,
    );

    const resultId = computeDeterministicHash(
      "w1-t16-cp1-result-id",
      pipelineHash,
    );

    return {
      resultId,
      createdAt,
      consumerId: request.consumerId,
      multiRoundSummary,
      consumerPackage,
      pipelineHash,
      warnings,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createBoardroomConsumerPipelineContract(
  dependencies?: BoardroomConsumerPipelineContractDependencies,
): BoardroomConsumerPipelineContract {
  return new BoardroomConsumerPipelineContract(dependencies);
}
