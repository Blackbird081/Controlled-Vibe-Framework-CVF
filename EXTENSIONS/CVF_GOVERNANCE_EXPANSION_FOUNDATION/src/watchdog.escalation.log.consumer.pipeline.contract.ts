import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import {
  WatchdogEscalationLogContract,
  createWatchdogEscalationLogContract,
} from "./watchdog.escalation.log.contract";
import type {
  WatchdogEscalationLog,
  WatchdogEscalationLogContractDependencies,
} from "./watchdog.escalation.log.contract";
import type {
  WatchdogEscalationDecision,
  WatchdogEscalationAction,
} from "./watchdog.escalation.contract";
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

export interface WatchdogEscalationLogConsumerPipelineRequest {
  decisions: WatchdogEscalationDecision[];
  candidateItems?: RankableKnowledgeItem[];
  scoringWeights?: ScoringWeights;
  segmentTypeConstraints?: SegmentTypeConstraints;
  consumerId?: string;
}

export interface WatchdogEscalationLogConsumerPipelineResult {
  resultId: string;
  createdAt: string;
  consumerId?: string;
  escalationLog: WatchdogEscalationLog;
  consumerPackage: ControlPlaneConsumerPackage;
  pipelineHash: string;
  warnings: string[];
}

export interface WatchdogEscalationLogConsumerPipelineContractDependencies {
  now?: () => string;
  escalationLogContractDeps?: WatchdogEscalationLogContractDependencies;
  consumerPipelineDeps?: ControlPlaneConsumerPipelineContractDependencies;
}

// ─── Warning Builder ──────────────────────────────────────────────────────────

function buildEscalationWarnings(dominantAction: WatchdogEscalationAction): string[] {
  if (dominantAction === "ESCALATE") {
    return ["[watchdog-escalation] active escalation — immediate watchdog intervention required"];
  }
  if (dominantAction === "MONITOR") {
    return ["[watchdog-escalation] monitor active — watchdog monitoring in progress"];
  }
  return [];
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * WatchdogEscalationLogConsumerPipelineContract (W3-T11)
 * -------------------------------------------------------
 * Cross-plane consumer bridge: GEF → CPF.
 *
 * Internal chain (single execute call):
 *   WatchdogEscalationLogContract.log(decisions)  → WatchdogEscalationLog
 *   query = escalationLog.summary.slice(0, 120)
 *   contextId = escalationLog.logId
 *   ControlPlaneConsumerPipelineContract.execute({rankingRequest: {query, contextId, ...}})
 *   → ControlPlaneConsumerPackage
 *   → WatchdogEscalationLogConsumerPipelineResult
 *
 * Determinism: all sub-contracts share the same injected now().
 * Warnings: ESCALATE → immediate intervention; MONITOR → monitoring in progress.
 */
export class WatchdogEscalationLogConsumerPipelineContract {
  private readonly now: () => string;
  private readonly escalationLogContract: WatchdogEscalationLogContract;
  private readonly consumerPipeline: ControlPlaneConsumerPipelineContract;

  constructor(
    dependencies: WatchdogEscalationLogConsumerPipelineContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.escalationLogContract = createWatchdogEscalationLogContract({
      ...dependencies.escalationLogContractDeps,
      now: this.now,
    });
    this.consumerPipeline = createControlPlaneConsumerPipelineContract({
      ...dependencies.consumerPipelineDeps,
      now: this.now,
    });
  }

  execute(
    request: WatchdogEscalationLogConsumerPipelineRequest,
  ): WatchdogEscalationLogConsumerPipelineResult {
    const createdAt = this.now();

    // Step 1: log decisions → WatchdogEscalationLog
    const escalationLog: WatchdogEscalationLog =
      this.escalationLogContract.log(request.decisions);

    // Step 2: derive query from escalation log summary text
    const query = escalationLog.summary.slice(0, 120);
    const consumerPackage: ControlPlaneConsumerPackage =
      this.consumerPipeline.execute({
        rankingRequest: {
          query,
          contextId: escalationLog.logId,
          candidateItems: request.candidateItems ?? [],
          scoringWeights: request.scoringWeights,
        },
        segmentTypeConstraints: request.segmentTypeConstraints,
      });

    // Step 3: build warnings based on dominantAction
    const warnings = buildEscalationWarnings(escalationLog.dominantAction);

    // Step 4: deterministic hash + resultId
    const pipelineHash = computeDeterministicHash(
      "w3-t11-cp1-watchdog-escalation-log-consumer-pipeline",
      escalationLog.logHash,
      consumerPackage.pipelineHash,
      createdAt,
    );

    const resultId = computeDeterministicHash(
      "w3-t11-cp1-result-id",
      pipelineHash,
    );

    return {
      resultId,
      createdAt,
      consumerId: request.consumerId,
      escalationLog,
      consumerPackage,
      pipelineHash,
      warnings,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createWatchdogEscalationLogConsumerPipelineContract(
  dependencies?: WatchdogEscalationLogConsumerPipelineContractDependencies,
): WatchdogEscalationLogConsumerPipelineContract {
  return new WatchdogEscalationLogConsumerPipelineContract(dependencies);
}
