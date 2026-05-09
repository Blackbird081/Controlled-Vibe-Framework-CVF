import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import {
  WatchdogPulseContract,
  createWatchdogPulseContract,
} from "./watchdog.pulse.contract";
import type {
  WatchdogPulse,
  WatchdogPulseContractDependencies,
  WatchdogObservabilityInput,
  WatchdogExecutionInput,
} from "./watchdog.pulse.contract";
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

export interface WatchdogPulseConsumerPipelineRequest {
  observabilityInput: WatchdogObservabilityInput;
  executionInput: WatchdogExecutionInput;
  candidateItems?: RankableKnowledgeItem[];
  scoringWeights?: ScoringWeights;
  segmentTypeConstraints?: SegmentTypeConstraints;
  consumerId?: string;
}

export interface WatchdogPulseConsumerPipelineResult {
  resultId: string;
  createdAt: string;
  consumerId?: string;
  pulse: WatchdogPulse;
  consumerPackage: ControlPlaneConsumerPackage;
  pipelineHash: string;
  warnings: string[];
}

export interface WatchdogPulseConsumerPipelineContractDependencies {
  now?: () => string;
  pulseDeps?: WatchdogPulseContractDependencies;
  consumerPipelineDeps?: ControlPlaneConsumerPipelineContractDependencies;
}

// ─── Query Derivation ─────────────────────────────────────────────────────────

function derivePulseQuery(
  pulse: WatchdogPulse,
  obs: WatchdogObservabilityInput,
  exec: WatchdogExecutionInput,
): string {
  const raw = `[watchdog-pulse] status:${pulse.watchdogStatus} obs:${obs.dominantHealth} exec:${exec.dominantStatus}`;
  return raw.slice(0, 120);
}

// ─── Warning Builder ──────────────────────────────────────────────────────────

function buildPulseWarnings(pulse: WatchdogPulse): string[] {
  const warnings: string[] = [];
  if (pulse.watchdogStatus === "CRITICAL") {
    warnings.push(
      "[watchdog-pulse] critical pulse detected — immediate governance review required",
    );
  } else if (pulse.watchdogStatus === "WARNING") {
    warnings.push(
      "[watchdog-pulse] warning pulse detected — system health degraded",
    );
  }
  return warnings;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * WatchdogPulseConsumerPipelineContract (W3-T18 CP1)
 * --------------------------------------------------
 * Cross-plane consumer bridge: GEF → CPF (watchdog pulse signal).
 *
 * Internal chain (single execute call):
 *   WatchdogPulseContract.pulse(observabilityInput, executionInput) → WatchdogPulse
 *   query = `[watchdog-pulse] status:${pulse.watchdogStatus} obs:${obs.dominantHealth} exec:${exec.dominantStatus}`.slice(0, 120)
 *   contextId = pulse.pulseId
 *   ControlPlaneConsumerPipelineContract.execute({rankingRequest: {query, contextId, ...}})
 *   → ControlPlaneConsumerPackage
 *   → WatchdogPulseConsumerPipelineResult
 *
 * Determinism: all sub-contracts share the same injected now().
 * Warning CRITICAL → "[watchdog-pulse] critical pulse detected — immediate governance review required"
 * Warning WARNING  → "[watchdog-pulse] warning pulse detected — system health degraded"
 * Gap closed: WatchdogPulseContract (W3-T2 CP1) had no governed consumer-visible enriched output path.
 */
export class WatchdogPulseConsumerPipelineContract {
  private readonly now: () => string;
  private readonly pulseContract: WatchdogPulseContract;
  private readonly consumerPipeline: ControlPlaneConsumerPipelineContract;

  constructor(
    dependencies: WatchdogPulseConsumerPipelineContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.pulseContract = createWatchdogPulseContract({
      ...dependencies.pulseDeps,
      now: this.now,
    });
    this.consumerPipeline = createControlPlaneConsumerPipelineContract({
      ...dependencies.consumerPipelineDeps,
      now: this.now,
    });
  }

  execute(
    request: WatchdogPulseConsumerPipelineRequest,
  ): WatchdogPulseConsumerPipelineResult {
    const createdAt = this.now();

    // Step 1: synthesize pulse from observability + execution inputs
    const pulse: WatchdogPulse = this.pulseContract.pulse(
      request.observabilityInput,
      request.executionInput,
    );

    // Step 2: derive query and build consumer package
    const query = derivePulseQuery(pulse, request.observabilityInput, request.executionInput);
    const consumerPackage: ControlPlaneConsumerPackage =
      this.consumerPipeline.execute({
        rankingRequest: {
          query,
          contextId: pulse.pulseId,
          candidateItems: request.candidateItems ?? [],
          scoringWeights: request.scoringWeights,
        },
        segmentTypeConstraints: request.segmentTypeConstraints,
      });

    // Step 3: build warnings based on pulse status
    const warnings = buildPulseWarnings(pulse);

    // Step 4: deterministic hash + resultId
    const pipelineHash = computeDeterministicHash(
      "w3-t18-cp1-watchdog-pulse-consumer-pipeline",
      pulse.pulseHash,
      consumerPackage.pipelineHash,
      createdAt,
    );

    const resultId = computeDeterministicHash(
      "w3-t18-cp1-result-id",
      pipelineHash,
    );

    return {
      resultId,
      createdAt,
      consumerId: request.consumerId,
      pulse,
      consumerPackage,
      pipelineHash,
      warnings,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createWatchdogPulseConsumerPipelineContract(
  dependencies?: WatchdogPulseConsumerPipelineContractDependencies,
): WatchdogPulseConsumerPipelineContract {
  return new WatchdogPulseConsumerPipelineContract(dependencies);
}
