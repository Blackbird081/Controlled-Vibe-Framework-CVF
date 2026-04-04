import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import {
  CommandRuntimeContract,
  createCommandRuntimeContract,
} from "./command.runtime.contract";
import type {
  CommandRuntimeResult,
  CommandRuntimeContractDependencies,
} from "./command.runtime.contract";
import type { PolicyGateResult } from "./policy.gate.contract";
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

const WARNING_FAILED =
  "[command-runtime] execution failures detected — review failed tasks";
const WARNING_SANDBOXED =
  "[command-runtime] sandbox delegation detected — R3 risk level tasks isolated";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CommandRuntimeConsumerPipelineRequest {
  policyGateResult: PolicyGateResult;
  candidateItems?: RankableKnowledgeItem[];
  scoringWeights?: ScoringWeights;
  segmentTypeConstraints?: SegmentTypeConstraints;
  consumerId?: string;
}

export interface CommandRuntimeConsumerPipelineResult {
  resultId: string;
  createdAt: string;
  runtimeResult: CommandRuntimeResult;
  consumerPackage: ControlPlaneConsumerPackage;
  pipelineHash: string;
  warnings: string[];
  consumerId: string | undefined;
}

export interface CommandRuntimeConsumerPipelineContractDependencies {
  now?: () => string;
  runtimeContractDeps?: CommandRuntimeContractDependencies;
  consumerPipelineDeps?: ControlPlaneConsumerPipelineContractDependencies;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * CommandRuntimeConsumerPipelineContract (W2-T25 CP1 — Full Lane GC-019)
 * -------------------------------------------------------------------------
 * Bridges CommandRuntimeContract into the CPF consumer pipeline.
 *
 * Chain:
 *   PolicyGateResult
 *     → CommandRuntimeContract.execute()
 *     → CommandRuntimeResult { runtimeId, executedCount, ... }
 *     → ControlPlaneConsumerPipelineContract.execute()
 *     → ControlPlaneConsumerPackage
 *     → CommandRuntimeConsumerPipelineResult
 *
 * Query: derived from runtimeResult.summary (max 120 chars)
 * contextId: runtimeResult.runtimeId
 *
 * Warnings:
 *   failedCount > 0    → WARNING_FAILED
 *   sandboxedCount > 0 → WARNING_SANDBOXED
 */
export class CommandRuntimeConsumerPipelineContract {
  private readonly now: () => string;
  private readonly runtimeContract: CommandRuntimeContract;
  private readonly consumerPipeline: ControlPlaneConsumerPipelineContract;

  constructor(
    dependencies: CommandRuntimeConsumerPipelineContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.runtimeContract = createCommandRuntimeContract({
      ...dependencies.runtimeContractDeps,
      now: this.now,
    });
    this.consumerPipeline = createControlPlaneConsumerPipelineContract({
      ...dependencies.consumerPipelineDeps,
      now: this.now,
    });
  }

  execute(
    request: CommandRuntimeConsumerPipelineRequest,
  ): CommandRuntimeConsumerPipelineResult {
    const createdAt = this.now();

    const runtimeResult: CommandRuntimeResult = this.runtimeContract.execute(
      request.policyGateResult,
    );

    const query = runtimeResult.summary.slice(0, 120);

    const contextId = runtimeResult.runtimeId;

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
    if (runtimeResult.failedCount > 0) {
      warnings.push(WARNING_FAILED);
    }
    if (runtimeResult.sandboxedCount > 0) {
      warnings.push(WARNING_SANDBOXED);
    }

    const pipelineHash = computeDeterministicHash(
      "w2-t25-cp1-command-runtime-consumer-pipeline",
      runtimeResult.runtimeHash,
      consumerPackage.pipelineHash,
      createdAt,
    );

    const resultId = computeDeterministicHash(
      "w2-t25-cp1-result-id",
      pipelineHash,
    );

    return {
      resultId,
      createdAt,
      runtimeResult,
      consumerPackage,
      pipelineHash,
      warnings,
      consumerId: request.consumerId,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createCommandRuntimeConsumerPipelineContract(
  dependencies?: CommandRuntimeConsumerPipelineContractDependencies,
): CommandRuntimeConsumerPipelineContract {
  return new CommandRuntimeConsumerPipelineContract(dependencies);
}
