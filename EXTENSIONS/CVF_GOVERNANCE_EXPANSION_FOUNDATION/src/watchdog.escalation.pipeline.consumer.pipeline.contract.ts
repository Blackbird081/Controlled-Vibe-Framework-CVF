import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import {
  WatchdogEscalationPipelineContract,
  createWatchdogEscalationPipelineContract,
} from "./watchdog.escalation.pipeline.contract";
import type {
  WatchdogEscalationPipelineRequest,
  WatchdogEscalationPipelineResult,
  WatchdogEscalationPipelineContractDependencies,
} from "./watchdog.escalation.pipeline.contract";
import type { WatchdogEscalationAction } from "./watchdog.escalation.contract";
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

export interface WatchdogEscalationPipelineConsumerPipelineRequest {
  observabilityInput: WatchdogEscalationPipelineRequest["observabilityInput"];
  executionInput: WatchdogEscalationPipelineRequest["executionInput"];
  policy?: WatchdogEscalationPipelineRequest["policy"];
  candidateItems?: RankableKnowledgeItem[];
  scoringWeights?: ScoringWeights;
  segmentTypeConstraints?: SegmentTypeConstraints;
  consumerId?: string;
}

export interface WatchdogEscalationPipelineConsumerPipelineResult {
  resultId: string;
  createdAt: string;
  consumerId?: string;
  pipelineResult: WatchdogEscalationPipelineResult;
  consumerPackage: ControlPlaneConsumerPackage;
  pipelineHash: string;
  warnings: string[];
}

export interface WatchdogEscalationPipelineConsumerPipelineContractDependencies {
  now?: () => string;
  escalationPipelineDeps?: WatchdogEscalationPipelineContractDependencies;
  consumerPipelineDeps?: ControlPlaneConsumerPipelineContractDependencies;
}

// ─── Warning Builder ──────────────────────────────────────────────────────────

function buildPipelineWarnings(dominantAction: WatchdogEscalationAction): string[] {
  if (dominantAction === "ESCALATE") {
    return ["[watchdog-escalation-pipeline] active escalation — immediate pipeline intervention required"];
  }
  if (dominantAction === "MONITOR") {
    return ["[watchdog-escalation-pipeline] monitor active — pipeline monitoring in progress"];
  }
  return [];
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * WatchdogEscalationPipelineConsumerPipelineContract (W3-T12 CP1)
 * ---------------------------------------------------------------
 * Cross-plane consumer bridge: GEF → CPF (full pipeline).
 *
 * Internal chain (single execute call):
 *   WatchdogEscalationPipelineContract.execute(request)  → WatchdogEscalationPipelineResult
 *   query = pipelineResult.escalationLog.summary.slice(0, 120)
 *   contextId = pipelineResult.resultId
 *   ControlPlaneConsumerPipelineContract.execute({rankingRequest: {query, contextId, ...}})
 *   → ControlPlaneConsumerPackage
 *   → WatchdogEscalationPipelineConsumerPipelineResult
 *
 * Determinism: all sub-contracts share the same injected now().
 * Warnings: ESCALATE → immediate pipeline intervention; MONITOR → pipeline monitoring in progress.
 * Gap closed: W3-T5 implied — WatchdogEscalationPipelineResult had no governed consumer-visible enriched output path.
 */
export class WatchdogEscalationPipelineConsumerPipelineContract {
  private readonly now: () => string;
  private readonly escalationPipeline: WatchdogEscalationPipelineContract;
  private readonly consumerPipeline: ControlPlaneConsumerPipelineContract;

  constructor(
    dependencies: WatchdogEscalationPipelineConsumerPipelineContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.escalationPipeline = createWatchdogEscalationPipelineContract({
      ...dependencies.escalationPipelineDeps,
      now: this.now,
    });
    this.consumerPipeline = createControlPlaneConsumerPipelineContract({
      ...dependencies.consumerPipelineDeps,
      now: this.now,
    });
  }

  execute(
    request: WatchdogEscalationPipelineConsumerPipelineRequest,
  ): WatchdogEscalationPipelineConsumerPipelineResult {
    const createdAt = this.now();

    // Step 1: run full escalation pipeline
    const pipelineResult: WatchdogEscalationPipelineResult =
      this.escalationPipeline.execute({
        observabilityInput: request.observabilityInput,
        executionInput: request.executionInput,
        policy: request.policy,
      });

    // Step 2: derive query from escalation log summary
    const query = pipelineResult.escalationLog.summary.slice(0, 120);
    const consumerPackage: ControlPlaneConsumerPackage =
      this.consumerPipeline.execute({
        rankingRequest: {
          query,
          contextId: pipelineResult.resultId,
          candidateItems: request.candidateItems ?? [],
          scoringWeights: request.scoringWeights,
        },
        segmentTypeConstraints: request.segmentTypeConstraints,
      });

    // Step 3: build warnings based on dominant escalation action
    const warnings = buildPipelineWarnings(pipelineResult.dominantAction);

    // Step 4: deterministic hash + resultId
    const pipelineHash = computeDeterministicHash(
      "w3-t12-cp1-watchdog-escalation-pipeline-consumer-pipeline",
      pipelineResult.pipelineHash,
      consumerPackage.pipelineHash,
      createdAt,
    );

    const resultId = computeDeterministicHash(
      "w3-t12-cp1-result-id",
      pipelineHash,
    );

    return {
      resultId,
      createdAt,
      consumerId: request.consumerId,
      pipelineResult,
      consumerPackage,
      pipelineHash,
      warnings,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createWatchdogEscalationPipelineConsumerPipelineContract(
  dependencies?: WatchdogEscalationPipelineConsumerPipelineContractDependencies,
): WatchdogEscalationPipelineConsumerPipelineContract {
  return new WatchdogEscalationPipelineConsumerPipelineContract(dependencies);
}
