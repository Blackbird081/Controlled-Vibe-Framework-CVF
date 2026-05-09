import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import {
  WatchdogAlertLogContract,
  createWatchdogAlertLogContract,
} from "./watchdog.alert.log.contract";
import type {
  WatchdogAlertLog,
  WatchdogAlertLogContractDependencies,
} from "./watchdog.alert.log.contract";
import type { WatchdogPulse, WatchdogStatus } from "./watchdog.pulse.contract";
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

export interface WatchdogAlertLogConsumerPipelineRequest {
  pulses: WatchdogPulse[];
  candidateItems?: RankableKnowledgeItem[];
  scoringWeights?: ScoringWeights;
  segmentTypeConstraints?: SegmentTypeConstraints;
  consumerId?: string;
}

export interface WatchdogAlertLogConsumerPipelineResult {
  resultId: string;
  createdAt: string;
  consumerId?: string;
  alertLog: WatchdogAlertLog;
  consumerPackage: ControlPlaneConsumerPackage;
  pipelineHash: string;
  warnings: string[];
}

export interface WatchdogAlertLogConsumerPipelineContractDependencies {
  now?: () => string;
  alertLogContractDeps?: WatchdogAlertLogContractDependencies;
  consumerPipelineDeps?: ControlPlaneConsumerPipelineContractDependencies;
}

// ─── Query Derivation ─────────────────────────────────────────────────────────

function deriveAlertLogQuery(alertLog: WatchdogAlertLog): string {
  return `${alertLog.dominantStatus}:alert:${alertLog.alertActive}:pulses:${alertLog.totalPulses}`.slice(0, 120);
}

// ─── Warning Builder ──────────────────────────────────────────────────────────

function buildAlertLogWarnings(dominantStatus: WatchdogStatus): string[] {
  if (dominantStatus === "CRITICAL") {
    return ["[watchdog] critical alert — immediate escalation required"];
  }
  if (dominantStatus === "WARNING") {
    return ["[watchdog] warning alert — watchdog alert log review required"];
  }
  return [];
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * WatchdogAlertLogConsumerPipelineContract (W3-T10)
 * -------------------------------------------------
 * Cross-plane consumer bridge: GEF → CPF.
 *
 * Internal chain (single execute call):
 *   WatchdogAlertLogContract.log(pulses)           → WatchdogAlertLog
 *   ControlPlaneConsumerPipelineContract.execute()  → ControlPlaneConsumerPackage
 *   → WatchdogAlertLogConsumerPipelineResult
 *
 * Determinism: all sub-contracts share the same injected now().
 * Warnings: CRITICAL → immediate escalation required;
 *           WARNING  → watchdog alert log review required.
 */
export class WatchdogAlertLogConsumerPipelineContract {
  private readonly now: () => string;
  private readonly alertLogContract: WatchdogAlertLogContract;
  private readonly consumerPipeline: ControlPlaneConsumerPipelineContract;

  constructor(
    dependencies: WatchdogAlertLogConsumerPipelineContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.alertLogContract = createWatchdogAlertLogContract({
      ...dependencies.alertLogContractDeps,
      now: this.now,
    });
    this.consumerPipeline = createControlPlaneConsumerPipelineContract({
      ...dependencies.consumerPipelineDeps,
      now: this.now,
    });
  }

  execute(
    request: WatchdogAlertLogConsumerPipelineRequest,
  ): WatchdogAlertLogConsumerPipelineResult {
    const createdAt = this.now();

    // Step 1: aggregate pulses into alert log
    const alertLog: WatchdogAlertLog =
      this.alertLogContract.log(request.pulses);

    // Step 2: derive query and build consumer package
    const query = deriveAlertLogQuery(alertLog);
    const consumerPackage: ControlPlaneConsumerPackage =
      this.consumerPipeline.execute({
        rankingRequest: {
          query,
          contextId: alertLog.logId,
          candidateItems: request.candidateItems ?? [],
          scoringWeights: request.scoringWeights,
        },
        segmentTypeConstraints: request.segmentTypeConstraints,
      });

    // Step 3: build warnings based on dominant status
    const warnings = buildAlertLogWarnings(alertLog.dominantStatus);

    // Step 4: deterministic hash + resultId
    const pipelineHash = computeDeterministicHash(
      "w3-t10-cp1-watchdog-alert-log-consumer-pipeline",
      alertLog.logHash,
      consumerPackage.pipelineHash,
      createdAt,
    );

    const resultId = computeDeterministicHash(
      "w3-t10-cp1-result-id",
      pipelineHash,
    );

    return {
      resultId,
      createdAt,
      consumerId: request.consumerId,
      alertLog,
      consumerPackage,
      pipelineHash,
      warnings,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createWatchdogAlertLogConsumerPipelineContract(
  dependencies?: WatchdogAlertLogConsumerPipelineContractDependencies,
): WatchdogAlertLogConsumerPipelineContract {
  return new WatchdogAlertLogConsumerPipelineContract(dependencies);
}
