import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import {
  WatchdogEscalationContract,
  createWatchdogEscalationContract,
} from "./watchdog.escalation.contract";
import type {
  WatchdogEscalationDecision,
  WatchdogEscalationContractDependencies,
} from "./watchdog.escalation.contract";
import type { WatchdogAlertLog } from "./watchdog.alert.log.contract";
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

export interface WatchdogEscalationConsumerPipelineRequest {
  alertLog: WatchdogAlertLog;
  candidateItems?: RankableKnowledgeItem[];
  scoringWeights?: ScoringWeights;
  segmentTypeConstraints?: SegmentTypeConstraints;
  consumerId?: string;
}

export interface WatchdogEscalationConsumerPipelineResult {
  resultId: string;
  createdAt: string;
  consumerId?: string;
  escalationDecision: WatchdogEscalationDecision;
  consumerPackage: ControlPlaneConsumerPackage;
  pipelineHash: string;
  warnings: string[];
}

export interface WatchdogEscalationConsumerPipelineContractDependencies {
  now?: () => string;
  escalationDeps?: WatchdogEscalationContractDependencies;
  consumerPipelineDeps?: ControlPlaneConsumerPipelineContractDependencies;
}

// ─── Query Derivation ─────────────────────────────────────────────────────────

function deriveEscalationQuery(decision: WatchdogEscalationDecision): string {
  const raw = `[watchdog-escalation] action:${decision.action} dominant:${decision.dominantStatus}`;
  return raw.slice(0, 120);
}

// ─── Warning Builder ──────────────────────────────────────────────────────────

function buildEscalationWarnings(decision: WatchdogEscalationDecision): string[] {
  const warnings: string[] = [];
  if (decision.action === "ESCALATE") {
    warnings.push(
      "[watchdog] escalation triggered — immediate governance checkpoint required",
    );
  }
  return warnings;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * WatchdogEscalationConsumerPipelineContract (W3-T17 CP1)
 * -------------------------------------------------------
 * Cross-plane consumer bridge: GEF → CPF (watchdog escalation decision).
 *
 * Internal chain (single execute call):
 *   WatchdogEscalationContract.evaluate(alertLog)  → WatchdogEscalationDecision
 *   query = `[watchdog-escalation] action:${action} dominant:${dominantStatus}`.slice(0, 120)
 *   contextId = escalationDecision.decisionId
 *   ControlPlaneConsumerPipelineContract.execute({rankingRequest: {query, contextId, ...}})
 *   → ControlPlaneConsumerPackage
 *   → WatchdogEscalationConsumerPipelineResult
 *
 * Determinism: all sub-contracts share the same injected now().
 * Warning: action === "ESCALATE" → immediate governance checkpoint required.
 * Gap closed: WatchdogEscalationContract had no governed consumer-visible enriched output path.
 */
export class WatchdogEscalationConsumerPipelineContract {
  private readonly now: () => string;
  private readonly escalation: WatchdogEscalationContract;
  private readonly consumerPipeline: ControlPlaneConsumerPipelineContract;

  constructor(
    dependencies: WatchdogEscalationConsumerPipelineContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.escalation = createWatchdogEscalationContract({
      ...dependencies.escalationDeps,
      now: this.now,
    });
    this.consumerPipeline = createControlPlaneConsumerPipelineContract({
      ...dependencies.consumerPipelineDeps,
      now: this.now,
    });
  }

  execute(
    request: WatchdogEscalationConsumerPipelineRequest,
  ): WatchdogEscalationConsumerPipelineResult {
    const createdAt = this.now();

    // Step 1: evaluate alert log → WatchdogEscalationDecision
    const escalationDecision: WatchdogEscalationDecision =
      this.escalation.evaluate(request.alertLog);

    // Step 2: derive query and build consumer package
    const query = deriveEscalationQuery(escalationDecision);
    const consumerPackage: ControlPlaneConsumerPackage =
      this.consumerPipeline.execute({
        rankingRequest: {
          query,
          contextId: escalationDecision.decisionId,
          candidateItems: request.candidateItems ?? [],
          scoringWeights: request.scoringWeights,
        },
        segmentTypeConstraints: request.segmentTypeConstraints,
      });

    // Step 3: build warnings based on escalation action
    const warnings = buildEscalationWarnings(escalationDecision);

    // Step 4: deterministic hash + resultId
    const pipelineHash = computeDeterministicHash(
      "w3-t17-cp1-watchdog-escalation-consumer-pipeline",
      escalationDecision.decisionHash,
      consumerPackage.pipelineHash,
      createdAt,
    );

    const resultId = computeDeterministicHash(
      "w3-t17-cp1-result-id",
      pipelineHash,
    );

    return {
      resultId,
      createdAt,
      consumerId: request.consumerId,
      escalationDecision,
      consumerPackage,
      pipelineHash,
      warnings,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createWatchdogEscalationConsumerPipelineContract(
  dependencies?: WatchdogEscalationConsumerPipelineContractDependencies,
): WatchdogEscalationConsumerPipelineContract {
  return new WatchdogEscalationConsumerPipelineContract(dependencies);
}
