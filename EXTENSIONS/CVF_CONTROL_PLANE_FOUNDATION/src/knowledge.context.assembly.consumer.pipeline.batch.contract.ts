import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { KnowledgeContextAssemblyConsumerPipelineResult } from "./knowledge.context.assembly.consumer.pipeline.contract";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface KnowledgeContextAssemblyConsumerPipelineBatch {
  batchId: string;
  createdAt: string;
  results: KnowledgeContextAssemblyConsumerPipelineResult[];
  totalResults: number;
  dominantContextWindowEstimate: number;
  emptyAssemblyCount: number;
  batchHash: string;
}

export interface KnowledgeContextAssemblyConsumerPipelineBatchContractDependencies {
  now?: () => string;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * KnowledgeContextAssemblyConsumerPipelineBatchContract (W76-T1 — Fast Lane GC-021)
 * -------------------------------------------------------------------------------
 * Aggregates KnowledgeContextAssemblyConsumerPipelineResult[] into a governed batch.
 *
 * Pattern:
 *   dominantContextWindowEstimate = Math.max(...results.map(r => r.contextPacket.contextWindowEstimate))
 *   empty batch → dominantContextWindowEstimate = 0, valid hash
 *   batchId ≠ batchHash  (batchId = hash of batchHash only)
 *   emptyAssemblyCount = results where contextPacket.totalEntries === 0
 */
export class KnowledgeContextAssemblyConsumerPipelineBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: KnowledgeContextAssemblyConsumerPipelineBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    results: KnowledgeContextAssemblyConsumerPipelineResult[],
  ): KnowledgeContextAssemblyConsumerPipelineBatch {
    const createdAt = this.now();

    const dominantContextWindowEstimate =
      results.length === 0
        ? 0
        : Math.max(...results.map((r) => r.contextPacket.contextWindowEstimate));

    const emptyAssemblyCount = results.filter(
      (r) => r.contextPacket.totalEntries === 0,
    ).length;

    const batchHash = computeDeterministicHash(
      "w76-t1-knowledge-context-assembly-consumer-pipeline-batch",
      ...results.map((r) => r.pipelineHash),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w76-t1-knowledge-context-assembly-batch-id",
      batchHash,
    );

    return {
      batchId,
      createdAt,
      results,
      totalResults: results.length,
      dominantContextWindowEstimate,
      emptyAssemblyCount,
      batchHash,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createKnowledgeContextAssemblyConsumerPipelineBatchContract(
  dependencies?: KnowledgeContextAssemblyConsumerPipelineBatchContractDependencies,
): KnowledgeContextAssemblyConsumerPipelineBatchContract {
  return new KnowledgeContextAssemblyConsumerPipelineBatchContract(dependencies);
}
