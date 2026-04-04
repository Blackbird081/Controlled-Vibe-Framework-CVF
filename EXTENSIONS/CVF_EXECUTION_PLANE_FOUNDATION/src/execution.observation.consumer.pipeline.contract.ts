import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import {
  ExecutionObserverContract,
  createExecutionObserverContract,
} from "./execution.observer.contract";
import type {
  ExecutionObservation,
  OutcomeClass,
  ExecutionObserverContractDependencies,
} from "./execution.observer.contract";
import type { ExecutionPipelineReceipt } from "./execution.pipeline.contract";
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

export interface ExecutionObservationConsumerPipelineRequest {
  receipt: ExecutionPipelineReceipt;
  candidateItems?: RankableKnowledgeItem[];
  scoringWeights?: ScoringWeights;
  segmentTypeConstraints?: SegmentTypeConstraints;
  consumerId?: string;
}

export interface ExecutionObservationConsumerPipelineResult {
  resultId: string;
  createdAt: string;
  consumerId?: string;
  observation: ExecutionObservation;
  consumerPackage: ControlPlaneConsumerPackage;
  pipelineHash: string;
  warnings: string[];
}

export interface ExecutionObservationConsumerPipelineContractDependencies {
  now?: () => string;
  observerContractDeps?: ExecutionObserverContractDependencies;
  consumerPipelineDeps?: ControlPlaneConsumerPipelineContractDependencies;
}

// ─── Warning Builder ──────────────────────────────────────────────────────────

function buildObservationWarnings(outcomeClass: OutcomeClass): string[] {
  switch (outcomeClass) {
    case "FAILED":
      return ["[observation] failed execution outcome — review execution pipeline"];
    case "GATED":
      return ["[observation] gated execution outcome — review policy gate"];
    case "SANDBOXED":
      return ["[observation] sandboxed execution outcome — review sandbox policy"];
    case "PARTIAL":
      return ["[observation] partial execution outcome — some entries did not complete"];
    default:
      return [];
  }
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * ExecutionObservationConsumerPipelineContract (W2-T20 CP1)
 * ----------------------------------------------------------
 * Cross-plane consumer bridge: EPF → CPF.
 *
 * Internal chain (single execute call):
 *   ExecutionObserverContract.observe(receipt) → ExecutionObservation
 *   query = `${outcomeClass}:observation:${totalEntries}:failed:${failedCount}`.slice(0, 120)
 *   contextId = observation.observationId
 *   ControlPlaneConsumerPipelineContract.execute({rankingRequest: {query, contextId, ...}})
 *   → ControlPlaneConsumerPackage
 *   → ExecutionObservationConsumerPipelineResult
 *
 * Warnings: FAILED → review pipeline; GATED → review gate; SANDBOXED → review sandbox; PARTIAL → partial.
 */
export class ExecutionObservationConsumerPipelineContract {
  private readonly now: () => string;
  private readonly observerContract: ExecutionObserverContract;
  private readonly consumerPipeline: ControlPlaneConsumerPipelineContract;

  constructor(
    dependencies: ExecutionObservationConsumerPipelineContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.observerContract = createExecutionObserverContract({
      ...dependencies.observerContractDeps,
      now: this.now,
    });
    this.consumerPipeline = createControlPlaneConsumerPipelineContract({
      ...dependencies.consumerPipelineDeps,
      now: this.now,
    });
  }

  execute(
    request: ExecutionObservationConsumerPipelineRequest,
  ): ExecutionObservationConsumerPipelineResult {
    const createdAt = this.now();

    // Step 1: observe → ExecutionObservation
    const observation: ExecutionObservation =
      this.observerContract.observe(request.receipt);

    // Step 2: derive query from outcomeClass + counts
    const query =
      `${observation.outcomeClass}:observation:${observation.totalEntries}:failed:${observation.failedCount}`.slice(0, 120);

    const consumerPackage: ControlPlaneConsumerPackage =
      this.consumerPipeline.execute({
        rankingRequest: {
          query,
          contextId: observation.observationId,
          candidateItems: request.candidateItems ?? [],
          scoringWeights: request.scoringWeights,
        },
        segmentTypeConstraints: request.segmentTypeConstraints,
      });

    // Step 3: build warnings based on outcomeClass
    const warnings = buildObservationWarnings(observation.outcomeClass);

    // Step 4: deterministic hash + resultId
    const pipelineHash = computeDeterministicHash(
      "w2-t20-cp1-execution-observation-consumer-pipeline",
      observation.observationHash,
      consumerPackage.pipelineHash,
      createdAt,
    );

    const resultId = computeDeterministicHash(
      "w2-t20-cp1-result-id",
      pipelineHash,
    );

    return {
      resultId,
      createdAt,
      consumerId: request.consumerId,
      observation,
      consumerPackage,
      pipelineHash,
      warnings,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createExecutionObservationConsumerPipelineContract(
  dependencies?: ExecutionObservationConsumerPipelineContractDependencies,
): ExecutionObservationConsumerPipelineContract {
  return new ExecutionObservationConsumerPipelineContract(dependencies);
}
