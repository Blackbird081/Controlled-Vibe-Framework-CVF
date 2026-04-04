import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import {
  GovernanceCheckpointLogContract,
  createGovernanceCheckpointLogContract,
} from "./governance.checkpoint.log.contract";
import type {
  GovernanceCheckpointLog,
  GovernanceCheckpointLogContractDependencies,
} from "./governance.checkpoint.log.contract";
import type { GovernanceCheckpointDecision, CheckpointAction } from "./governance.checkpoint.contract";
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

export interface GovernanceCheckpointLogConsumerPipelineRequest {
  decisions: GovernanceCheckpointDecision[];
  candidateItems?: RankableKnowledgeItem[];
  scoringWeights?: ScoringWeights;
  segmentTypeConstraints?: SegmentTypeConstraints;
  consumerId?: string;
}

export interface GovernanceCheckpointLogConsumerPipelineResult {
  resultId: string;
  createdAt: string;
  consumerId?: string;
  checkpointLog: GovernanceCheckpointLog;
  consumerPackage: ControlPlaneConsumerPackage;
  pipelineHash: string;
  warnings: string[];
}

export interface GovernanceCheckpointLogConsumerPipelineContractDependencies {
  now?: () => string;
  logContractDeps?: GovernanceCheckpointLogContractDependencies;
  consumerPipelineDeps?: ControlPlaneConsumerPipelineContractDependencies;
}

// ─── Query Derivation ─────────────────────────────────────────────────────────

function deriveCheckpointLogQuery(log: GovernanceCheckpointLog): string {
  const raw = `[checkpoint-log] ${log.dominantCheckpointAction} — ${log.totalCheckpoints} checkpoint(s)`;
  return raw.slice(0, 120);
}

// ─── Warning Builder ──────────────────────────────────────────────────────────

function buildCheckpointLogWarnings(dominantAction: CheckpointAction): string[] {
  if (dominantAction === "ESCALATE") {
    return ["[governance-checkpoint-log] dominant action ESCALATE — immediate checkpoint escalation required"];
  }
  if (dominantAction === "HALT") {
    return ["[governance-checkpoint-log] dominant action HALT — checkpoint halt required"];
  }
  return [];
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * GovernanceCheckpointLogConsumerPipelineContract (W3-T14 CP1)
 * -------------------------------------------------------------
 * Cross-plane consumer bridge: GEF → CPF (checkpoint log).
 *
 * Internal chain (single execute call):
 *   GovernanceCheckpointLogContract.log(decisions) → GovernanceCheckpointLog
 *   query = `[checkpoint-log] ${dominantCheckpointAction} — ${totalCheckpoints} checkpoint(s)`.slice(0, 120)
 *   contextId = log.logId
 *   ControlPlaneConsumerPipelineContract.execute({rankingRequest: {query, contextId, ...}})
 *   → ControlPlaneConsumerPackage
 *   → GovernanceCheckpointLogConsumerPipelineResult
 *
 * Determinism: all sub-contracts share the same injected now().
 * Warnings: ESCALATE → immediate checkpoint escalation; HALT → checkpoint halt required.
 * Gap closed: W6-T4 CP2 implied — GovernanceCheckpointLog had no governed consumer-visible enriched output path.
 */
export class GovernanceCheckpointLogConsumerPipelineContract {
  private readonly now: () => string;
  private readonly logContract: GovernanceCheckpointLogContract;
  private readonly consumerPipeline: ControlPlaneConsumerPipelineContract;

  constructor(
    dependencies: GovernanceCheckpointLogConsumerPipelineContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.logContract = createGovernanceCheckpointLogContract({
      ...dependencies.logContractDeps,
      now: this.now,
    });
    this.consumerPipeline = createControlPlaneConsumerPipelineContract({
      ...dependencies.consumerPipelineDeps,
      now: this.now,
    });
  }

  execute(
    request: GovernanceCheckpointLogConsumerPipelineRequest,
  ): GovernanceCheckpointLogConsumerPipelineResult {
    const createdAt = this.now();

    // Step 1: log decisions → GovernanceCheckpointLog
    const checkpointLog: GovernanceCheckpointLog =
      this.logContract.log(request.decisions);

    // Step 2: derive query and build consumer package
    const query = deriveCheckpointLogQuery(checkpointLog);
    const consumerPackage: ControlPlaneConsumerPackage =
      this.consumerPipeline.execute({
        rankingRequest: {
          query,
          contextId: checkpointLog.logId,
          candidateItems: request.candidateItems ?? [],
          scoringWeights: request.scoringWeights,
        },
        segmentTypeConstraints: request.segmentTypeConstraints,
      });

    // Step 3: build warnings based on dominantCheckpointAction
    const warnings = buildCheckpointLogWarnings(checkpointLog.dominantCheckpointAction);

    // Step 4: deterministic hash + resultId
    const pipelineHash = computeDeterministicHash(
      "w3-t14-cp1-checkpoint-log-consumer-pipeline",
      checkpointLog.logHash,
      consumerPackage.pipelineHash,
      createdAt,
    );

    const resultId = computeDeterministicHash(
      "w3-t14-cp1-result-id",
      pipelineHash,
    );

    return {
      resultId,
      createdAt,
      consumerId: request.consumerId,
      checkpointLog,
      consumerPackage,
      pipelineHash,
      warnings,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createGovernanceCheckpointLogConsumerPipelineContract(
  dependencies?: GovernanceCheckpointLogConsumerPipelineContractDependencies,
): GovernanceCheckpointLogConsumerPipelineContract {
  return new GovernanceCheckpointLogConsumerPipelineContract(dependencies);
}
