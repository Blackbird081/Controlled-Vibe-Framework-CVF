import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import {
  MultiAgentCoordinationContract,
  createMultiAgentCoordinationContract,
} from "./execution.multi.agent.coordination.contract";
import type {
  MultiAgentCoordinationResult,
  CoordinationPolicy,
  MultiAgentCoordinationContractDependencies,
} from "./execution.multi.agent.coordination.contract";
import type { CommandRuntimeResult } from "./command.runtime.contract";
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

export interface MultiAgentCoordinationConsumerPipelineRequest {
  runtimeResults: CommandRuntimeResult[];
  coordinationPolicy: CoordinationPolicy;
  candidateItems?: RankableKnowledgeItem[];
  scoringWeights?: ScoringWeights;
  segmentTypeConstraints?: SegmentTypeConstraints;
  consumerId?: string;
}

export interface MultiAgentCoordinationConsumerPipelineResult {
  resultId: string;
  createdAt: string;
  consumerId?: string;
  coordinationResult: MultiAgentCoordinationResult;
  consumerPackage: ControlPlaneConsumerPackage;
  pipelineHash: string;
  warnings: string[];
}

export interface MultiAgentCoordinationConsumerPipelineContractDependencies {
  now?: () => string;
  coordinationContractDeps?: MultiAgentCoordinationContractDependencies;
  consumerPipelineDeps?: ControlPlaneConsumerPipelineContractDependencies;
}

// ─── Warning Builder ──────────────────────────────────────────────────────────

function buildCoordinationWarnings(
  coordinationResult: MultiAgentCoordinationResult,
): string[] {
  if (coordinationResult.coordinationStatus === "FAILED") {
    return ["[coordination] coordination failed — no agents were successfully assigned tasks"];
  }
  if (coordinationResult.coordinationStatus === "PARTIAL") {
    return ["[coordination] partial agent assignment detected — some agents received no tasks"];
  }
  return [];
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * MultiAgentCoordinationConsumerPipelineContract (W2-T14)
 * --------------------------------------------------------
 * Cross-plane consumer bridge: EPF → CPF.
 *
 * Internal chain (single execute call):
 *   MultiAgentCoordinationContract.coordinate(runtimeResults, policy) → MultiAgentCoordinationResult
 *   query = `${coordinationStatus}:agents:${agents.length}:tasks:${totalTasksDistributed}`.slice(0, 120)
 *   contextId = coordinationResult.coordinationId
 *   ControlPlaneConsumerPipelineContract.execute({rankingRequest: {query, contextId, ...}})
 *   → ControlPlaneConsumerPackage
 *   → MultiAgentCoordinationConsumerPipelineResult
 *
 * Determinism: all sub-contracts share the same injected now().
 * Warnings: FAILED → coordination failed; PARTIAL → partial assignment detected.
 */
export class MultiAgentCoordinationConsumerPipelineContract {
  private readonly now: () => string;
  private readonly coordinationContract: MultiAgentCoordinationContract;
  private readonly consumerPipeline: ControlPlaneConsumerPipelineContract;

  constructor(
    dependencies: MultiAgentCoordinationConsumerPipelineContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.coordinationContract = createMultiAgentCoordinationContract({
      ...dependencies.coordinationContractDeps,
      now: this.now,
    });
    this.consumerPipeline = createControlPlaneConsumerPipelineContract({
      ...dependencies.consumerPipelineDeps,
      now: this.now,
    });
  }

  execute(
    request: MultiAgentCoordinationConsumerPipelineRequest,
  ): MultiAgentCoordinationConsumerPipelineResult {
    const createdAt = this.now();

    // Step 1: coordinate agents → MultiAgentCoordinationResult
    const coordinationResult: MultiAgentCoordinationResult =
      this.coordinationContract.coordinate(
        request.runtimeResults,
        request.coordinationPolicy,
      );

    // Step 2: derive query from status + agent count + tasks, contextId = coordinationId
    const query =
      `${coordinationResult.coordinationStatus}:agents:${coordinationResult.agents.length}:tasks:${coordinationResult.totalTasksDistributed}`.slice(0, 120);
    const consumerPackage: ControlPlaneConsumerPackage =
      this.consumerPipeline.execute({
        rankingRequest: {
          query,
          contextId: coordinationResult.coordinationId,
          candidateItems: request.candidateItems ?? [],
          scoringWeights: request.scoringWeights,
        },
        segmentTypeConstraints: request.segmentTypeConstraints,
      });

    // Step 3: build warnings based on coordination status
    const warnings = buildCoordinationWarnings(coordinationResult);

    // Step 4: deterministic hash + resultId
    const pipelineHash = computeDeterministicHash(
      "w2-t14-cp1-multi-agent-coordination-consumer-pipeline",
      coordinationResult.coordinationHash,
      consumerPackage.pipelineHash,
      createdAt,
    );

    const resultId = computeDeterministicHash(
      "w2-t14-cp1-result-id",
      pipelineHash,
    );

    return {
      resultId,
      createdAt,
      consumerId: request.consumerId,
      coordinationResult,
      consumerPackage,
      pipelineHash,
      warnings,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createMultiAgentCoordinationConsumerPipelineContract(
  dependencies?: MultiAgentCoordinationConsumerPipelineContractDependencies,
): MultiAgentCoordinationConsumerPipelineContract {
  return new MultiAgentCoordinationConsumerPipelineContract(dependencies);
}
