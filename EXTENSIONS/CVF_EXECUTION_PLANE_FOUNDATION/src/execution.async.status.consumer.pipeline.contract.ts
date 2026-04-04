import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import {
  AsyncExecutionStatusContract,
  createAsyncExecutionStatusContract,
} from "./execution.async.status.contract";
import type {
  AsyncExecutionStatusSummary,
  AsyncExecutionStatusContractDependencies,
} from "./execution.async.status.contract";
import type { AsyncCommandRuntimeTicket, AsyncExecutionStatus } from "./execution.async.runtime.contract";
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

export interface AsyncExecutionStatusConsumerPipelineRequest {
  tickets: AsyncCommandRuntimeTicket[];
  candidateItems?: RankableKnowledgeItem[];
  scoringWeights?: ScoringWeights;
  segmentTypeConstraints?: SegmentTypeConstraints;
  consumerId?: string;
}

export interface AsyncExecutionStatusConsumerPipelineResult {
  resultId: string;
  createdAt: string;
  consumerId?: string;
  statusSummary: AsyncExecutionStatusSummary;
  consumerPackage: ControlPlaneConsumerPackage;
  pipelineHash: string;
  warnings: string[];
}

export interface AsyncExecutionStatusConsumerPipelineContractDependencies {
  now?: () => string;
  statusContractDeps?: AsyncExecutionStatusContractDependencies;
  consumerPipelineDeps?: ControlPlaneConsumerPipelineContractDependencies;
}

// ─── Query Derivation ─────────────────────────────────────────────────────────

function deriveAsyncStatusQuery(summary: AsyncExecutionStatusSummary): string {
  const raw = `[async-status] ${summary.dominantStatus} — ${summary.totalTickets} ticket(s)`;
  return raw.slice(0, 120);
}

// ─── Warning Builder ──────────────────────────────────────────────────────────

function buildAsyncStatusWarnings(dominantStatus: AsyncExecutionStatus): string[] {
  if (dominantStatus === "FAILED") {
    return ["[async-execution-status] dominant status FAILED — failed tickets require immediate intervention"];
  }
  if (dominantStatus === "RUNNING") {
    return ["[async-execution-status] dominant status RUNNING — execution in progress"];
  }
  return [];
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * AsyncExecutionStatusConsumerPipelineContract (W2-T21 CP1)
 * ----------------------------------------------------------
 * Cross-plane consumer bridge: EPF → CPF (async execution status).
 *
 * Internal chain (single execute call):
 *   AsyncExecutionStatusContract.assess(tickets)  → AsyncExecutionStatusSummary
 *   query = `[async-status] ${dominantStatus} — ${totalTickets} ticket(s)`.slice(0, 120)
 *   contextId = summary.summaryId
 *   ControlPlaneConsumerPipelineContract.execute({rankingRequest: {query, contextId, ...}})
 *   → ControlPlaneConsumerPackage
 *   → AsyncExecutionStatusConsumerPipelineResult
 *
 * Dominance: FAILED > RUNNING > PENDING > COMPLETED (severity-first).
 * Determinism: all sub-contracts share the same injected now().
 * Warnings: FAILED → immediate intervention required; RUNNING → execution in progress.
 * Gap closed: AsyncExecutionStatusContract had no governed consumer-visible enriched output path.
 */
export class AsyncExecutionStatusConsumerPipelineContract {
  private readonly now: () => string;
  private readonly statusContract: AsyncExecutionStatusContract;
  private readonly consumerPipeline: ControlPlaneConsumerPipelineContract;

  constructor(
    dependencies: AsyncExecutionStatusConsumerPipelineContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.statusContract = createAsyncExecutionStatusContract({
      ...dependencies.statusContractDeps,
      now: this.now,
    });
    this.consumerPipeline = createControlPlaneConsumerPipelineContract({
      ...dependencies.consumerPipelineDeps,
      now: this.now,
    });
  }

  execute(
    request: AsyncExecutionStatusConsumerPipelineRequest,
  ): AsyncExecutionStatusConsumerPipelineResult {
    const createdAt = this.now();

    // Step 1: assess tickets → AsyncExecutionStatusSummary
    const statusSummary: AsyncExecutionStatusSummary =
      this.statusContract.assess(request.tickets);

    // Step 2: derive query and build consumer package
    const query = deriveAsyncStatusQuery(statusSummary);
    const consumerPackage: ControlPlaneConsumerPackage =
      this.consumerPipeline.execute({
        rankingRequest: {
          query,
          contextId: statusSummary.summaryId,
          candidateItems: request.candidateItems ?? [],
          scoringWeights: request.scoringWeights,
        },
        segmentTypeConstraints: request.segmentTypeConstraints,
      });

    // Step 3: build warnings based on dominantStatus
    const warnings = buildAsyncStatusWarnings(statusSummary.dominantStatus);

    // Step 4: deterministic hash + resultId
    const pipelineHash = computeDeterministicHash(
      "w2-t21-cp1-async-execution-status-consumer-pipeline",
      statusSummary.summaryHash,
      consumerPackage.pipelineHash,
      createdAt,
    );

    const resultId = computeDeterministicHash(
      "w2-t21-cp1-result-id",
      pipelineHash,
    );

    return {
      resultId,
      createdAt,
      consumerId: request.consumerId,
      statusSummary,
      consumerPackage,
      pipelineHash,
      warnings,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createAsyncExecutionStatusConsumerPipelineContract(
  dependencies?: AsyncExecutionStatusConsumerPipelineContractDependencies,
): AsyncExecutionStatusConsumerPipelineContract {
  return new AsyncExecutionStatusConsumerPipelineContract(dependencies);
}
