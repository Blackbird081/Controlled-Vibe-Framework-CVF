import type { IntakeConsumerPipelineResult } from "./intake.consumer.pipeline.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

export interface IntakeConsumerPipelineBatchResult {
  batchId: string;
  batchHash: string;
  createdAt: string;
  totalIntakes: number;
  overallDominantDomain: string;
  totalChunks: number;
  totalTokens: number;
  dominantTokenBudget: number;
  results: IntakeConsumerPipelineResult[];
}

export interface IntakeConsumerPipelineBatchContractDependencies {
  now?: () => string;
}

// --- Dominant Domain Logic ---

function computeDominantDomain(results: IntakeConsumerPipelineResult[]): string {
  if (results.length === 0) return "unknown";

  const domainCounts: Record<string, number> = {};

  for (const result of results) {
    const domain = result.intakeResult.intent.intent.domain;
    domainCounts[domain] = (domainCounts[domain] ?? 0) + 1;
  }

  let maxCount = 0;
  let dominantDomain = "unknown";

  for (const [domain, count] of Object.entries(domainCounts)) {
    if (count > maxCount) {
      maxCount = count;
      dominantDomain = domain;
    }
  }

  return dominantDomain;
}

// --- Contract ---

export class IntakeConsumerPipelineBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: IntakeConsumerPipelineBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    results: IntakeConsumerPipelineResult[],
  ): IntakeConsumerPipelineBatchResult {
    const createdAt = this.now();

    const totalIntakes = results.length;
    const overallDominantDomain = computeDominantDomain(results);
    const totalChunks = results.reduce(
      (sum, r) => sum + r.intakeResult.retrieval.chunkCount,
      0,
    );
    const totalTokens = results.reduce(
      (sum, r) => sum + r.intakeResult.packagedContext.totalTokens,
      0,
    );

    const dominantTokenBudget =
      results.length === 0
        ? 0
        : Math.max(
            ...results.map(
              (r) => r.consumerPackage.typedContextPackage.estimatedTokens,
            ),
          );

    const batchHash = computeDeterministicHash(
      "w1-t29-cp2-intake-consumer-batch",
      `totalIntakes=${totalIntakes}`,
      `dominantDomain=${overallDominantDomain}`,
      `totalChunks=${totalChunks}`,
      `totalTokens=${totalTokens}`,
      `dominantTokenBudget=${dominantTokenBudget}`,
      ...results.map((r) => r.pipelineHash),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w1-t29-cp2-batch-id",
      batchHash,
    );

    return {
      batchId,
      batchHash,
      createdAt,
      totalIntakes,
      overallDominantDomain,
      totalChunks,
      totalTokens,
      dominantTokenBudget,
      results,
    };
  }
}

export function createIntakeConsumerPipelineBatchContract(
  dependencies?: IntakeConsumerPipelineBatchContractDependencies,
): IntakeConsumerPipelineBatchContract {
  return new IntakeConsumerPipelineBatchContract(dependencies);
}
