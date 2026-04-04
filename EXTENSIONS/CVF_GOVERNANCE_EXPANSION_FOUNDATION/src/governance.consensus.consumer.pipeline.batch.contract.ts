import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { ConsensusVerdict } from "./governance.consensus.contract";
import type { GovernanceConsensusConsumerPipelineResult } from "./governance.consensus.consumer.pipeline.contract";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GovernanceConsensusConsumerPipelineBatch {
  batchId: string;
  createdAt: string;
  results: GovernanceConsensusConsumerPipelineResult[];
  totalResults: number;
  dominantTokenBudget: number;
  escalationCount: number;
  pauseCount: number;
  batchHash: string;
}

export interface GovernanceConsensusConsumerPipelineBatchContractDependencies {
  now?: () => string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function countVerdict(
  results: GovernanceConsensusConsumerPipelineResult[],
  verdict: ConsensusVerdict,
): number {
  return results.filter((r) => r.consensusDecision.verdict === verdict).length;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * GovernanceConsensusConsumerPipelineBatchContract (W3-T6 CP2 — Fast Lane)
 * -------------------------------------------------------------------------
 * Aggregates GovernanceConsensusConsumerPipelineResult[] into a governed batch.
 *
 * Pattern:
 *   dominantTokenBudget = Math.max(...results.map(r => r.consumerPackage.typedContextPackage.estimatedTokens))
 *   empty batch → dominantTokenBudget = 0, valid hash
 *   batchId ≠ batchHash  (batchId = hash of batchHash only)
 *   escalationCount = count of ESCALATE verdicts
 *   pauseCount = count of PAUSE verdicts
 */
export class GovernanceConsensusConsumerPipelineBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: GovernanceConsensusConsumerPipelineBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    results: GovernanceConsensusConsumerPipelineResult[],
  ): GovernanceConsensusConsumerPipelineBatch {
    const createdAt = this.now();

    const dominantTokenBudget =
      results.length === 0
        ? 0
        : Math.max(
            ...results.map(
              (r) => r.consumerPackage.typedContextPackage.estimatedTokens,
            ),
          );

    const escalationCount = countVerdict(results, "ESCALATE");
    const pauseCount = countVerdict(results, "PAUSE");

    const batchHash = computeDeterministicHash(
      "w3-t6-cp2-consensus-consumer-pipeline-batch",
      ...results.map((r) => r.pipelineHash),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w3-t6-cp2-batch-id",
      batchHash,
    );

    return {
      batchId,
      createdAt,
      results,
      totalResults: results.length,
      dominantTokenBudget,
      escalationCount,
      pauseCount,
      batchHash,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createGovernanceConsensusConsumerPipelineBatchContract(
  dependencies?: GovernanceConsensusConsumerPipelineBatchContractDependencies,
): GovernanceConsensusConsumerPipelineBatchContract {
  return new GovernanceConsensusConsumerPipelineBatchContract(dependencies);
}
