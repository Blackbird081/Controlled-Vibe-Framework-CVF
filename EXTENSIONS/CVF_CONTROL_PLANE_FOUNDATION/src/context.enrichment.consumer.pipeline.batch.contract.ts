import type { ContextValidationStatus } from "./context.enrichment.contract";
import type { ContextEnrichmentConsumerPipelineResult } from "./context.enrichment.consumer.pipeline.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

export interface ContextEnrichmentConsumerPipelineBatchResult {
  batchId: string;
  batchHash: string;
  createdAt: string;
  totalValidations: number;
  validCount: number;
  invalidCount: number;
  totalViolations: number;
  dominantStatus: ContextValidationStatus;
  results: ContextEnrichmentConsumerPipelineResult[];
}

export interface ContextEnrichmentConsumerPipelineBatchContractDependencies {
  now?: () => string;
}

// --- Contract ---

export class ContextEnrichmentConsumerPipelineBatchContract {
  private readonly now: () => string;

  constructor(dependencies: ContextEnrichmentConsumerPipelineBatchContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    results: ContextEnrichmentConsumerPipelineResult[],
  ): ContextEnrichmentConsumerPipelineBatchResult {
    const createdAt = this.now();

    const totalValidations = results.length;
    const validCount = results.filter((r) => r.validationResult.status === "VALID").length;
    const invalidCount = totalValidations - validCount;
    const totalViolations = results.reduce(
      (sum, r) => sum + r.validationResult.violations.length,
      0,
    );

    // Severity-first: INVALID dominates VALID
    const dominantStatus: ContextValidationStatus =
      invalidCount > 0 ? "INVALID" : "VALID";

    const batchHash = computeDeterministicHash(
      "w2-t34-cp2-context-enrichment-consumer-batch",
      `totalValidations=${totalValidations}`,
      `validCount=${validCount}`,
      `invalidCount=${invalidCount}`,
      `totalViolations=${totalViolations}`,
      `dominant=${dominantStatus}`,
      ...results.map((r) => r.pipelineHash),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w2-t34-cp2-batch-id",
      batchHash,
    );

    return {
      batchId,
      batchHash,
      createdAt,
      totalValidations,
      validCount,
      invalidCount,
      totalViolations,
      dominantStatus,
      results,
    };
  }
}

export function createContextEnrichmentConsumerPipelineBatchContract(
  dependencies?: ContextEnrichmentConsumerPipelineBatchContractDependencies,
): ContextEnrichmentConsumerPipelineBatchContract {
  return new ContextEnrichmentConsumerPipelineBatchContract(dependencies);
}
