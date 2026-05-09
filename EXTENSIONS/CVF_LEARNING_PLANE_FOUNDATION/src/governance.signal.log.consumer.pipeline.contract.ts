import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import {
  GovernanceSignalLogContract,
  createGovernanceSignalLogContract,
} from "./governance.signal.log.contract";
import type {
  GovernanceSignalLogContractDependencies,
  GovernanceSignalLog,
} from "./governance.signal.log.contract";
import type { GovernanceSignal, GovernanceUrgency } from "./governance.signal.contract";
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

const WARNING_CRITICAL_URGENCY_DOMINANT =
  "[governance-signal-log] critical urgency dominant — governance signals require immediate attention";
const WARNING_HIGH_ESCALATION_RATE =
  "[governance-signal-log] high escalation rate — >50% of signals are escalations";
const WARNING_NO_SIGNALS =
  "[governance-signal-log] no signals — log contains zero governance signals";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GovernanceSignalLogConsumerPipelineRequest {
  signals: GovernanceSignal[];
  candidateItems?: RankableKnowledgeItem[];
  scoringWeights?: ScoringWeights;
  segmentTypeConstraints?: SegmentTypeConstraints;
  consumerId?: string;
}

export interface GovernanceSignalLogConsumerPipelineResult {
  resultId: string;
  createdAt: string;
  log: GovernanceSignalLog;
  dominantUrgency: GovernanceUrgency;
  consumerPackage: ControlPlaneConsumerPackage;
  pipelineHash: string;
  warnings: string[];
  consumerId: string | undefined;
}

export interface GovernanceSignalLogConsumerPipelineContractDependencies {
  now?: () => string;
  logContractDeps?: GovernanceSignalLogContractDependencies;
  consumerPipelineDeps?: ControlPlaneConsumerPipelineContractDependencies;
}

// ─── Dominant Urgency Logic ───────────────────────────────────────────────────

// Severity-first: CRITICAL > HIGH > NORMAL > LOW
const URGENCY_PRIORITY: Record<GovernanceUrgency, number> = {
  CRITICAL: 4,
  HIGH: 3,
  NORMAL: 2,
  LOW: 1,
};

function computeDominantUrgency(signals: GovernanceSignal[]): GovernanceUrgency {
  if (signals.length === 0) return "LOW";
  return signals.reduce((dominant, s) =>
    URGENCY_PRIORITY[s.urgency] > URGENCY_PRIORITY[dominant.urgency]
      ? s
      : dominant,
  ).urgency;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * GovernanceSignalLogConsumerPipelineContract (W4-T22 CP1 — Full Lane GC-019)
 * ---------------------------------------------------------------------------
 * Bridges GovernanceSignalLogContract into the CPF consumer pipeline.
 *
 * Chain:
 *   signals: GovernanceSignal[]
 *     → GovernanceSignalLogContract.log()
 *     → GovernanceSignalLog
 *     → ControlPlaneConsumerPipelineContract.execute()
 *     → ControlPlaneConsumerPackage
 *     → GovernanceSignalLogConsumerPipelineResult
 *
 * Query: "SignalLog: {totalSignals} signals, urgency={dominantUrgency}, type={dominantType}" (max 120 chars)
 * contextId: log.logId
 *
 * Warnings:
 *   dominantUrgency === "CRITICAL" → WARNING_CRITICAL_URGENCY_DOMINANT
 *   escalateCount / totalSignals > 0.5 → WARNING_HIGH_ESCALATION_RATE
 *   totalSignals === 0 → WARNING_NO_SIGNALS
 */
export class GovernanceSignalLogConsumerPipelineContract {
  private readonly now: () => string;
  private readonly logContract: GovernanceSignalLogContract;
  private readonly consumerPipeline: ControlPlaneConsumerPipelineContract;

  constructor(
    dependencies: GovernanceSignalLogConsumerPipelineContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.logContract = createGovernanceSignalLogContract({
      ...dependencies.logContractDeps,
      now: this.now,
    });
    this.consumerPipeline = createControlPlaneConsumerPipelineContract({
      ...dependencies.consumerPipelineDeps,
      now: this.now,
    });
  }

  execute(
    request: GovernanceSignalLogConsumerPipelineRequest,
  ): GovernanceSignalLogConsumerPipelineResult {
    const createdAt = this.now();

    const log: GovernanceSignalLog = this.logContract.log(request.signals);
    const dominantUrgency = computeDominantUrgency(request.signals);

    const query = `SignalLog: ${log.totalSignals} signals, urgency=${dominantUrgency}, type=${log.dominantSignalType}`.slice(
      0,
      120,
    );

    const contextId = log.logId;

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
    if (dominantUrgency === "CRITICAL") {
      warnings.push(WARNING_CRITICAL_URGENCY_DOMINANT);
    }
    if (log.totalSignals > 0 && log.escalateCount / log.totalSignals > 0.5) {
      warnings.push(WARNING_HIGH_ESCALATION_RATE);
    }
    if (log.totalSignals === 0) {
      warnings.push(WARNING_NO_SIGNALS);
    }

    const pipelineHash = computeDeterministicHash(
      "w4-t22-cp1-governance-signal-log-consumer-pipeline",
      log.logHash,
      `urgency:${dominantUrgency}`,
      consumerPackage.pipelineHash,
      createdAt,
    );

    const resultId = computeDeterministicHash(
      "w4-t22-cp1-result-id",
      pipelineHash,
    );

    return {
      resultId,
      createdAt,
      log,
      dominantUrgency,
      consumerPackage,
      pipelineHash,
      warnings,
      consumerId: request.consumerId,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createGovernanceSignalLogConsumerPipelineContract(
  dependencies?: GovernanceSignalLogConsumerPipelineContractDependencies,
): GovernanceSignalLogConsumerPipelineContract {
  return new GovernanceSignalLogConsumerPipelineContract(dependencies);
}
