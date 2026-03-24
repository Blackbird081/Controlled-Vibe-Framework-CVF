import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import {
  GovernanceAuditSignalContract,
  createGovernanceAuditSignalContract,
} from "./governance.audit.signal.contract";
import type {
  GovernanceAuditSignal,
  AuditTrigger,
  GovernanceAuditSignalContractDependencies,
} from "./governance.audit.signal.contract";
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

export interface GovernanceAuditSignalConsumerPipelineRequest {
  alertLog: WatchdogAlertLog;
  candidateItems?: RankableKnowledgeItem[];
  scoringWeights?: ScoringWeights;
  segmentTypeConstraints?: SegmentTypeConstraints;
  consumerId?: string;
}

export interface GovernanceAuditSignalConsumerPipelineResult {
  resultId: string;
  createdAt: string;
  consumerId?: string;
  auditSignal: GovernanceAuditSignal;
  consumerPackage: ControlPlaneConsumerPackage;
  pipelineHash: string;
  warnings: string[];
}

export interface GovernanceAuditSignalConsumerPipelineContractDependencies {
  now?: () => string;
  auditSignalContractDeps?: GovernanceAuditSignalContractDependencies;
  consumerPipelineDeps?: ControlPlaneConsumerPipelineContractDependencies;
}

// ─── Warning Builder ──────────────────────────────────────────────────────────

function buildAuditSignalWarnings(auditTrigger: AuditTrigger): string[] {
  if (auditTrigger === "CRITICAL_THRESHOLD") {
    return ["[audit-signal] critical threshold breached — immediate governance audit required"];
  }
  if (auditTrigger === "ALERT_ACTIVE") {
    return ["[audit-signal] alert active — governance audit recommended"];
  }
  return [];
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * GovernanceAuditSignalConsumerPipelineContract (W3-T16 CP1)
 * -----------------------------------------------------------
 * Cross-plane consumer bridge: GEF → CPF.
 *
 * Internal chain (single execute call):
 *   GovernanceAuditSignalContract.signal(alertLog) → GovernanceAuditSignal
 *   query = `${auditTrigger}:alert:${signal.sourceAlertLogId}`.slice(0, 120)
 *   contextId = signal.signalId
 *   ControlPlaneConsumerPipelineContract.execute({rankingRequest: {query, contextId, ...}})
 *   → ControlPlaneConsumerPackage
 *   → GovernanceAuditSignalConsumerPipelineResult
 *
 * Determinism: all sub-contracts share the same injected now().
 * Warnings: CRITICAL_THRESHOLD → immediate governance audit; ALERT_ACTIVE → audit recommended.
 */
export class GovernanceAuditSignalConsumerPipelineContract {
  private readonly now: () => string;
  private readonly auditSignalContract: GovernanceAuditSignalContract;
  private readonly consumerPipeline: ControlPlaneConsumerPipelineContract;

  constructor(
    dependencies: GovernanceAuditSignalConsumerPipelineContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.auditSignalContract = createGovernanceAuditSignalContract({
      ...dependencies.auditSignalContractDeps,
      now: this.now,
    });
    this.consumerPipeline = createControlPlaneConsumerPipelineContract({
      ...dependencies.consumerPipelineDeps,
      now: this.now,
    });
  }

  execute(
    request: GovernanceAuditSignalConsumerPipelineRequest,
  ): GovernanceAuditSignalConsumerPipelineResult {
    const createdAt = this.now();

    // Step 1: derive audit signal from alert log
    const auditSignal: GovernanceAuditSignal =
      this.auditSignalContract.signal(request.alertLog);

    // Step 2: derive query from auditTrigger + sourceAlertLogId
    const query =
      `${auditSignal.auditTrigger}:alert:${auditSignal.sourceAlertLogId}`.slice(0, 120);

    const consumerPackage: ControlPlaneConsumerPackage =
      this.consumerPipeline.execute({
        rankingRequest: {
          query,
          contextId: auditSignal.signalId,
          candidateItems: request.candidateItems ?? [],
          scoringWeights: request.scoringWeights,
        },
        segmentTypeConstraints: request.segmentTypeConstraints,
      });

    // Step 3: build warnings based on auditTrigger
    const warnings = buildAuditSignalWarnings(auditSignal.auditTrigger);

    // Step 4: deterministic hash + resultId
    const pipelineHash = computeDeterministicHash(
      "w3-t16-cp1-governance-audit-signal-consumer-pipeline",
      auditSignal.signalHash,
      consumerPackage.pipelineHash,
      createdAt,
    );

    const resultId = computeDeterministicHash(
      "w3-t16-cp1-result-id",
      pipelineHash,
    );

    return {
      resultId,
      createdAt,
      consumerId: request.consumerId,
      auditSignal,
      consumerPackage,
      pipelineHash,
      warnings,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createGovernanceAuditSignalConsumerPipelineContract(
  dependencies?: GovernanceAuditSignalConsumerPipelineContractDependencies,
): GovernanceAuditSignalConsumerPipelineContract {
  return new GovernanceAuditSignalConsumerPipelineContract(dependencies);
}
