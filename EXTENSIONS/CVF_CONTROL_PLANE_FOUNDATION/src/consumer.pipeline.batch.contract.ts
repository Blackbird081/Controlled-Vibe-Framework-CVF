import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { ControlPlaneConsumerPackage } from "./consumer.pipeline.contract";

// --- Types ---

export interface ControlPlaneConsumerPipelineBatch {
  batchId: string;
  createdAt: string;
  totalPackages: number;
  packages: ControlPlaneConsumerPackage[];
  dominantTokenBudget: number;
  batchHash: string;
}

export interface ControlPlaneConsumerPipelineBatchContractDependencies {
  now?: () => string;
}

// --- Helpers ---

function computeDominantTokenBudget(
  packages: ControlPlaneConsumerPackage[],
): number {
  if (packages.length === 0) return 0;
  return Math.max(
    ...packages.map((p) => p.typedContextPackage.estimatedTokens),
  );
}

// --- Contract ---

export class ControlPlaneConsumerPipelineBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: ControlPlaneConsumerPipelineBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    packages: ControlPlaneConsumerPackage[],
  ): ControlPlaneConsumerPipelineBatch {
    const createdAt = this.now();
    const dominantTokenBudget = computeDominantTokenBudget(packages);

    const batchHash = computeDeterministicHash(
      "w1-t13-cp2-consumer-pipeline-batch",
      ...packages.map((p) => p.pipelineHash),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w1-t13-cp2-consumer-pipeline-batch-id",
      batchHash,
    );

    return {
      batchId,
      createdAt,
      totalPackages: packages.length,
      packages,
      dominantTokenBudget,
      batchHash,
    };
  }
}

export function createControlPlaneConsumerPipelineBatchContract(
  dependencies?: ControlPlaneConsumerPipelineBatchContractDependencies,
): ControlPlaneConsumerPipelineBatchContract {
  return new ControlPlaneConsumerPipelineBatchContract(dependencies);
}
