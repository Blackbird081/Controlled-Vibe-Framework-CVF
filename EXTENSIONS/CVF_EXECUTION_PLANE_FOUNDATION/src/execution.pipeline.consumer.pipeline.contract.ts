import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import {
  ExecutionPipelineContract,
  createExecutionPipelineContract,
} from "./execution.pipeline.contract";
import type {
  ExecutionPipelineReceipt,
  ExecutionPipelineContractDependencies,
} from "./execution.pipeline.contract";
import type { ExecutionBridgeReceipt } from "./execution.bridge.consumer.contract";
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

export interface ExecutionPipelineConsumerPipelineRequest {
  bridgeReceipt: ExecutionBridgeReceipt;
  candidateItems?: RankableKnowledgeItem[];
  scoringWeights?: ScoringWeights;
  segmentTypeConstraints?: SegmentTypeConstraints;
  consumerId?: string;
}

export interface ExecutionPipelineConsumerPipelineResult {
  resultId: string;
  createdAt: string;
  consumerId?: string;
  pipelineReceipt: ExecutionPipelineReceipt;
  consumerPackage: ControlPlaneConsumerPackage;
  pipelineHash: string;
  warnings: string[];
}

export interface ExecutionPipelineConsumerPipelineContractDependencies {
  now?: () => string;
  pipelineContractDeps?: ExecutionPipelineContractDependencies;
  consumerPipelineDeps?: ControlPlaneConsumerPipelineContractDependencies;
}

// ─── Query Derivation ─────────────────────────────────────────────────────────

function derivePipelineQuery(receipt: ExecutionPipelineReceipt): string {
  const raw = `[pipeline] failed:${receipt.failedCount} sandboxed:${receipt.sandboxedCount} total:${receipt.totalEntries}`;
  return raw.slice(0, 120);
}

// ─── Warning Builder ──────────────────────────────────────────────────────────

function buildPipelineWarnings(receipt: ExecutionPipelineReceipt): string[] {
  const warnings: string[] = [];
  if (receipt.failedCount > 0) {
    warnings.push("[pipeline] execution failures detected — review pipeline receipt");
  }
  if (receipt.sandboxedCount > 0) {
    warnings.push("[pipeline] sandboxed executions present — review required");
  }
  return warnings;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * ExecutionPipelineConsumerPipelineContract (W2-T22 CP1)
 * -------------------------------------------------------
 * Cross-plane consumer bridge: EPF → CPF (full execution pipeline receipt).
 *
 * Internal chain (single execute call):
 *   ExecutionPipelineContract.run(bridgeReceipt)  → ExecutionPipelineReceipt
 *   query = `[pipeline] failed:${failedCount} sandboxed:${sandboxedCount} total:${totalEntries}`.slice(0, 120)
 *   contextId = receipt.pipelineReceiptId
 *   ControlPlaneConsumerPipelineContract.execute({rankingRequest: {query, contextId, ...}})
 *   → ControlPlaneConsumerPackage
 *   → ExecutionPipelineConsumerPipelineResult
 *
 * Determinism: all sub-contracts share the same injected now().
 * Warnings: failedCount > 0 → execution failures detected; sandboxedCount > 0 → sandboxed executions present.
 * Gap closed: ExecutionPipelineContract had no governed consumer-visible enriched output path.
 */
export class ExecutionPipelineConsumerPipelineContract {
  private readonly now: () => string;
  private readonly pipelineContract: ExecutionPipelineContract;
  private readonly consumerPipeline: ControlPlaneConsumerPipelineContract;

  constructor(
    dependencies: ExecutionPipelineConsumerPipelineContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.pipelineContract = createExecutionPipelineContract({
      ...dependencies.pipelineContractDeps,
      now: this.now,
      commandRuntimeDependencies: {
        ...dependencies.pipelineContractDeps?.commandRuntimeDependencies,
        now: this.now,
      },
    });
    this.consumerPipeline = createControlPlaneConsumerPipelineContract({
      ...dependencies.consumerPipelineDeps,
      now: this.now,
    });
  }

  execute(
    request: ExecutionPipelineConsumerPipelineRequest,
  ): ExecutionPipelineConsumerPipelineResult {
    const createdAt = this.now();

    // Step 1: run bridge receipt through pipeline → ExecutionPipelineReceipt
    const pipelineReceipt: ExecutionPipelineReceipt =
      this.pipelineContract.run(request.bridgeReceipt);

    // Step 2: derive query and build consumer package
    const query = derivePipelineQuery(pipelineReceipt);
    const consumerPackage: ControlPlaneConsumerPackage =
      this.consumerPipeline.execute({
        rankingRequest: {
          query,
          contextId: pipelineReceipt.pipelineReceiptId,
          candidateItems: request.candidateItems ?? [],
          scoringWeights: request.scoringWeights,
        },
        segmentTypeConstraints: request.segmentTypeConstraints,
      });

    // Step 3: build warnings based on failedCount and sandboxedCount
    const warnings = buildPipelineWarnings(pipelineReceipt);

    // Step 4: deterministic hash + resultId
    const pipelineHash = computeDeterministicHash(
      "w2-t22-cp1-execution-pipeline-consumer-pipeline",
      pipelineReceipt.pipelineHash,
      consumerPackage.pipelineHash,
      createdAt,
    );

    const resultId = computeDeterministicHash(
      "w2-t22-cp1-result-id",
      pipelineHash,
    );

    return {
      resultId,
      createdAt,
      consumerId: request.consumerId,
      pipelineReceipt,
      consumerPackage,
      pipelineHash,
      warnings,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createExecutionPipelineConsumerPipelineContract(
  dependencies?: ExecutionPipelineConsumerPipelineContractDependencies,
): ExecutionPipelineConsumerPipelineContract {
  return new ExecutionPipelineConsumerPipelineContract(dependencies);
}
