import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import {
  ExecutionAuditSummaryContract,
  createExecutionAuditSummaryContract,
} from "./execution.audit.summary.contract";
import type {
  ExecutionAuditSummary,
  ExecutionAuditRisk,
  ExecutionAuditSummaryContractDependencies,
} from "./execution.audit.summary.contract";
import type { ExecutionObservation } from "./execution.observer.contract";
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

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ExecutionAuditSummaryConsumerPipelineRequest {
  observations: ExecutionObservation[];
  candidateItems?: RankableKnowledgeItem[];
  scoringWeights?: ScoringWeights;
  segmentTypeConstraints?: SegmentTypeConstraints;
  consumerId?: string;
}

export interface ExecutionAuditSummaryConsumerPipelineResult {
  resultId: string;
  createdAt: string;
  consumerId?: string;
  auditSummary: ExecutionAuditSummary;
  consumerPackage: ControlPlaneConsumerPackage;
  pipelineHash: string;
  warnings: string[];
}

export interface ExecutionAuditSummaryConsumerPipelineContractDependencies {
  now?: () => string;
  auditSummaryContractDeps?: ExecutionAuditSummaryContractDependencies;
  consumerPipelineDeps?: ControlPlaneConsumerPipelineContractDependencies;
}

// ─── Warning Builder ──────────────────────────────────────────────────────────

function buildAuditWarnings(overallRisk: ExecutionAuditRisk): string[] {
  if (overallRisk === "HIGH") {
    return ["[audit] high execution risk — failed observations detected"];
  }
  if (overallRisk === "MEDIUM") {
    return ["[audit] medium execution risk — gated or sandboxed observations detected"];
  }
  return [];
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * ExecutionAuditSummaryConsumerPipelineContract (W2-T15)
 * -------------------------------------------------------
 * Cross-plane consumer bridge: EPF → CPF.
 *
 * Internal chain (single execute call):
 *   ExecutionAuditSummaryContract.summarize(observations)  → ExecutionAuditSummary
 *   query = `${dominantOutcome}:risk:${overallRisk}:observations:${totalObservations}`.slice(0, 120)
 *   contextId = auditSummary.summaryId
 *   ControlPlaneConsumerPipelineContract.execute({rankingRequest: {query, contextId, ...}})
 *   → ControlPlaneConsumerPackage
 *   → ExecutionAuditSummaryConsumerPipelineResult
 *
 * Determinism: all sub-contracts share the same injected now().
 * Warnings: HIGH → failed observations detected; MEDIUM → gated or sandboxed observations detected.
 */
export class ExecutionAuditSummaryConsumerPipelineContract {
  private readonly now: () => string;
  private readonly auditSummaryContract: ExecutionAuditSummaryContract;
  private readonly consumerPipeline: ControlPlaneConsumerPipelineContract;

  constructor(
    dependencies: ExecutionAuditSummaryConsumerPipelineContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.auditSummaryContract = createExecutionAuditSummaryContract({
      ...dependencies.auditSummaryContractDeps,
      now: this.now,
    });
    this.consumerPipeline = createControlPlaneConsumerPipelineContract({
      ...dependencies.consumerPipelineDeps,
      now: this.now,
    });
  }

  execute(
    request: ExecutionAuditSummaryConsumerPipelineRequest,
  ): ExecutionAuditSummaryConsumerPipelineResult {
    const createdAt = this.now();

    // Step 1: summarize observations → ExecutionAuditSummary
    const auditSummary: ExecutionAuditSummary = this.auditSummaryContract.summarize(
      request.observations,
    );

    // Step 2: derive query from dominantOutcome + overallRisk + totalObservations
    const query = `${auditSummary.dominantOutcome}:risk:${auditSummary.overallRisk}:observations:${auditSummary.totalObservations}`.slice(0, 120);
    const consumerPackage: ControlPlaneConsumerPackage =
      this.consumerPipeline.execute({
        rankingRequest: {
          query,
          contextId: auditSummary.summaryId,
          candidateItems: request.candidateItems ?? [],
          scoringWeights: request.scoringWeights,
        },
        segmentTypeConstraints: request.segmentTypeConstraints,
      });

    // Step 3: build warnings based on overallRisk
    const warnings = buildAuditWarnings(auditSummary.overallRisk);

    // Step 4: deterministic hash + resultId
    const pipelineHash = computeDeterministicHash(
      "w2-t15-cp1-execution-audit-summary-consumer-pipeline",
      auditSummary.auditHash,
      consumerPackage.pipelineHash,
      createdAt,
    );

    const resultId = computeDeterministicHash(
      "w2-t15-cp1-result-id",
      pipelineHash,
    );

    return {
      resultId,
      createdAt,
      consumerId: request.consumerId,
      auditSummary,
      consumerPackage,
      pipelineHash,
      warnings,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createExecutionAuditSummaryConsumerPipelineContract(
  dependencies?: ExecutionAuditSummaryConsumerPipelineContractDependencies,
): ExecutionAuditSummaryConsumerPipelineContract {
  return new ExecutionAuditSummaryConsumerPipelineContract(dependencies);
}
