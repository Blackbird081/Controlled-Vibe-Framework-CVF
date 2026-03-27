import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import {
  FeedbackLedgerContract,
  createFeedbackLedgerContract,
} from "./feedback.ledger.contract";
import type {
  LearningFeedbackInput,
  FeedbackLedger,
  FeedbackLedgerContractDependencies,
} from "./feedback.ledger.contract";
import {
  ControlPlaneConsumerPipelineContract,
  createControlPlaneConsumerPipelineContract,
} from "../../CVF_CONTROL_PLANE_FOUNDATION/src/consumer.pipeline.contract";
import type {
  ControlPlaneConsumerPackage,
  ControlPlaneConsumerPipelineContractDependencies,
} from "../../CVF_CONTROL_PLANE_FOUNDATION/src/consumer.pipeline.contract";
import type { RankableKnowledgeItem, ScoringWeights } from "../../CVF_CONTROL_PLANE_FOUNDATION/src/knowledge.ranking.contract";
import type { SegmentTypeConstraints } from "../../CVF_CONTROL_PLANE_FOUNDATION/src/context.packager.contract";

// ─── Warning constants ────────────────────────────────────────────────────────

const WARNING_FEEDBACK_REJECTED =
  "[feedback-ledger] rejected feedback detected — signals contain rejected feedback";

const WARNING_HIGH_ESCALATION_RATE =
  "[feedback-ledger] high escalation rate — escalated signals exceed 30% threshold";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FeedbackLedgerConsumerPipelineRequest {
  signals: LearningFeedbackInput[];
  candidateItems?: RankableKnowledgeItem[];
  scoringWeights?: ScoringWeights;
  segmentTypeConstraints?: SegmentTypeConstraints;
  consumerId?: string;
}

export interface FeedbackLedgerConsumerPipelineResult {
  resultId: string;
  createdAt: string;
  feedbackLedger: FeedbackLedger;
  consumerPackage: ControlPlaneConsumerPackage;
  pipelineHash: string;
  warnings: string[];
  consumerId: string | undefined;
}

export interface FeedbackLedgerConsumerPipelineContractDependencies {
  now?: () => string;
  ledgerContractDeps?: FeedbackLedgerContractDependencies;
  consumerPipelineDeps?: ControlPlaneConsumerPipelineContractDependencies;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * FeedbackLedgerConsumerPipelineContract (W4-T17 CP1 — Full Lane GC-019)
 * -----------------------------------------------------------------------
 * Bridges FeedbackLedgerContract into the CPF consumer pipeline.
 *
 * Chain:
 *   signals: LearningFeedbackInput[]
 *     → FeedbackLedgerContract.compile()
 *     → FeedbackLedger { ledgerId, records, counts, ... }
 *     → ControlPlaneConsumerPipelineContract.execute()
 *     → ControlPlaneConsumerPackage
 *     → FeedbackLedgerConsumerPipelineResult
 *
 * Query: "Ledger: {totalRecords} feedback ({acceptCount}A/{retryCount}R/{escalateCount}E/{rejectCount}X)" (max 120 chars)
 * contextId: feedbackLedger.ledgerId
 *
 * Warnings:
 *   rejectCount > 0 → WARNING_FEEDBACK_REJECTED
 *   escalateCount > totalRecords * 0.3 → WARNING_HIGH_ESCALATION_RATE
 */
export class FeedbackLedgerConsumerPipelineContract {
  private readonly now: () => string;
  private readonly ledgerContract: FeedbackLedgerContract;
  private readonly consumerPipeline: ControlPlaneConsumerPipelineContract;

  constructor(
    dependencies: FeedbackLedgerConsumerPipelineContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.ledgerContract = createFeedbackLedgerContract({
      ...dependencies.ledgerContractDeps,
      now: this.now,
    });
    this.consumerPipeline = createControlPlaneConsumerPipelineContract({
      ...dependencies.consumerPipelineDeps,
      now: this.now,
    });
  }

  execute(
    request: FeedbackLedgerConsumerPipelineRequest,
  ): FeedbackLedgerConsumerPipelineResult {
    const createdAt = this.now();

    const feedbackLedger: FeedbackLedger = this.ledgerContract.compile(
      request.signals,
    );

    const query = `Ledger: ${feedbackLedger.totalRecords} feedback (${feedbackLedger.acceptCount}A/${feedbackLedger.retryCount}R/${feedbackLedger.escalateCount}E/${feedbackLedger.rejectCount}X)`.slice(
      0,
      120,
    );

    const contextId = feedbackLedger.ledgerId;

    const consumerPackage: ControlPlaneConsumerPackage =
      this.consumerPipeline.execute({
        rankingRequest: {
          query,
          contextId,
          candidateItems: request.candidateItems ?? [],
          scoringWeights: request.scoringWeights,
        },
        segmentTypeConstraints: request.segmentTypeConstraints,
      });

    const warnings: string[] = [];
    if (feedbackLedger.rejectCount > 0) {
      warnings.push(WARNING_FEEDBACK_REJECTED);
    }
    if (feedbackLedger.escalateCount > feedbackLedger.totalRecords * 0.3) {
      warnings.push(WARNING_HIGH_ESCALATION_RATE);
    }

    const pipelineHash = computeDeterministicHash(
      "w4-t17-cp1-feedback-ledger-consumer-pipeline",
      feedbackLedger.ledgerHash,
      consumerPackage.pipelineHash,
      createdAt,
    );

    const resultId = computeDeterministicHash(
      "w4-t17-cp1-result-id",
      pipelineHash,
    );

    return {
      resultId,
      createdAt,
      feedbackLedger,
      consumerPackage,
      pipelineHash,
      warnings,
      consumerId: request.consumerId,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createFeedbackLedgerConsumerPipelineContract(
  dependencies?: FeedbackLedgerConsumerPipelineContractDependencies,
): FeedbackLedgerConsumerPipelineContract {
  return new FeedbackLedgerConsumerPipelineContract(dependencies);
}
