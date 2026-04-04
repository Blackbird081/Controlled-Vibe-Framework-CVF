import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { ExecutionConsumerResult } from "./execution.consumer.result.contract";

// --- Types ---

export interface ExecutionConsumerResultBatch {
  batchId: string;
  createdAt: string;
  totalResults: number;
  results: ExecutionConsumerResult[];
  dominantTokenBudget: number;
  batchHash: string;
}

export interface ExecutionConsumerResultBatchContractDependencies {
  now?: () => string;
}

// --- Helpers ---

function computeDominantTokenBudget(
  results: ExecutionConsumerResult[],
): number {
  if (results.length === 0) return 0;
  return Math.max(
    ...results.map(
      (r) => r.consumerPackage.typedContextPackage.estimatedTokens,
    ),
  );
}

// --- Contract ---

export class ExecutionConsumerResultBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: ExecutionConsumerResultBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(results: ExecutionConsumerResult[]): ExecutionConsumerResultBatch {
    const createdAt = this.now();
    const dominantTokenBudget = computeDominantTokenBudget(results);

    const batchHash = computeDeterministicHash(
      "w2-t10-cp2-execution-consumer-result-batch",
      ...results.map((r) => r.executionConsumerHash),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w2-t10-cp2-execution-consumer-result-batch-id",
      batchHash,
    );

    return {
      batchId,
      createdAt,
      totalResults: results.length,
      results,
      dominantTokenBudget,
      batchHash,
    };
  }
}

export function createExecutionConsumerResultBatchContract(
  dependencies?: ExecutionConsumerResultBatchContractDependencies,
): ExecutionConsumerResultBatchContract {
  return new ExecutionConsumerResultBatchContract(dependencies);
}
