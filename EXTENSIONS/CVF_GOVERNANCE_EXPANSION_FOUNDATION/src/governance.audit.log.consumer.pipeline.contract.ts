import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import {
  GovernanceAuditLogContract,
  createGovernanceAuditLogContract,
} from "./governance.audit.log.contract";
import type {
  GovernanceAuditLog,
  GovernanceAuditLogContractDependencies,
} from "./governance.audit.log.contract";
import type { GovernanceAuditSignal, AuditTrigger } from "./governance.audit.signal.contract";
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

export interface GovernanceAuditLogConsumerPipelineRequest {
  signals: GovernanceAuditSignal[];
  candidateItems?: RankableKnowledgeItem[];
  scoringWeights?: ScoringWeights;
  segmentTypeConstraints?: SegmentTypeConstraints;
  consumerId?: string;
}

export interface GovernanceAuditLogConsumerPipelineResult {
  resultId: string;
  createdAt: string;
  consumerId?: string;
  auditLog: GovernanceAuditLog;
  consumerPackage: ControlPlaneConsumerPackage;
  pipelineHash: string;
  warnings: string[];
}

export interface GovernanceAuditLogConsumerPipelineContractDependencies {
  now?: () => string;
  auditLogContractDeps?: GovernanceAuditLogContractDependencies;
  consumerPipelineDeps?: ControlPlaneConsumerPipelineContractDependencies;
}

// ─── Query Derivation ─────────────────────────────────────────────────────────

function deriveAuditLogQuery(auditLog: GovernanceAuditLog): string {
  return `${auditLog.dominantTrigger}:audit:${auditLog.auditRequired}:signals:${auditLog.totalSignals}`.slice(0, 120);
}

// ─── Warning Builder ──────────────────────────────────────────────────────────

function buildAuditLogWarnings(dominantTrigger: AuditTrigger): string[] {
  if (dominantTrigger === "CRITICAL_THRESHOLD") {
    return ["[audit] critical threshold — immediate audit required"];
  }
  if (dominantTrigger === "ALERT_ACTIVE") {
    return ["[audit] alert active — audit log review required"];
  }
  return [];
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * GovernanceAuditLogConsumerPipelineContract (W3-T9)
 * --------------------------------------------------
 * Cross-plane consumer bridge: GEF → CPF.
 *
 * Internal chain (single execute call):
 *   GovernanceAuditLogContract.log(signals)       → GovernanceAuditLog
 *   ControlPlaneConsumerPipelineContract.execute() → ControlPlaneConsumerPackage
 *   → GovernanceAuditLogConsumerPipelineResult
 *
 * Determinism: all sub-contracts share the same injected now().
 * Warnings: CRITICAL_THRESHOLD → immediate audit required;
 *           ALERT_ACTIVE → audit log review required.
 */
export class GovernanceAuditLogConsumerPipelineContract {
  private readonly now: () => string;
  private readonly auditLogContract: GovernanceAuditLogContract;
  private readonly consumerPipeline: ControlPlaneConsumerPipelineContract;

  constructor(
    dependencies: GovernanceAuditLogConsumerPipelineContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.auditLogContract = createGovernanceAuditLogContract({
      ...dependencies.auditLogContractDeps,
      now: this.now,
    });
    this.consumerPipeline = createControlPlaneConsumerPipelineContract({
      ...dependencies.consumerPipelineDeps,
      now: this.now,
    });
  }

  execute(
    request: GovernanceAuditLogConsumerPipelineRequest,
  ): GovernanceAuditLogConsumerPipelineResult {
    const createdAt = this.now();

    // Step 1: aggregate signals into audit log
    const auditLog: GovernanceAuditLog =
      this.auditLogContract.log(request.signals);

    // Step 2: derive query and build consumer package
    const query = deriveAuditLogQuery(auditLog);
    const consumerPackage: ControlPlaneConsumerPackage =
      this.consumerPipeline.execute({
        rankingRequest: {
          query,
          contextId: auditLog.logId,
          candidateItems: request.candidateItems ?? [],
          scoringWeights: request.scoringWeights,
        },
        segmentTypeConstraints: request.segmentTypeConstraints,
      });

    // Step 3: build warnings based on dominant trigger
    const warnings = buildAuditLogWarnings(auditLog.dominantTrigger);

    // Step 4: deterministic hash + resultId
    const pipelineHash = computeDeterministicHash(
      "w3-t9-cp1-audit-log-consumer-pipeline",
      auditLog.logHash,
      consumerPackage.pipelineHash,
      createdAt,
    );

    const resultId = computeDeterministicHash(
      "w3-t9-cp1-result-id",
      pipelineHash,
    );

    return {
      resultId,
      createdAt,
      consumerId: request.consumerId,
      auditLog,
      consumerPackage,
      pipelineHash,
      warnings,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createGovernanceAuditLogConsumerPipelineContract(
  dependencies?: GovernanceAuditLogConsumerPipelineContractDependencies,
): GovernanceAuditLogConsumerPipelineContract {
  return new GovernanceAuditLogConsumerPipelineContract(dependencies);
}
