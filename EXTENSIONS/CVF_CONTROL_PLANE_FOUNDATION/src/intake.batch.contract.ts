import {
  ControlPlaneIntakeContract,
  type ControlPlaneIntakeRequest,
  type ControlPlaneIntakeResult,
  type ControlPlaneIntakeContractDependencies,
} from "./intake.contract";
import { createDeterministicBatchIdentity } from "./batch.contract.shared";

// --- Types ---

export type IntakeBatchStatus = "COMPLETE" | "PARTIAL" | "DEGRADED";

export interface IntakeBatch {
  batchId: string;
  batchHash: string;
  createdAt: string;
  totalRequests: number;
  completeCount: number;
  partialCount: number;
  degradedCount: number;
  dominantStatus: IntakeBatchStatus | "NONE";
  results: ControlPlaneIntakeResult[];
}

export interface IntakeBatchContractDependencies {
  contractDependencies?: ControlPlaneIntakeContractDependencies;
  now?: () => string;
}

// --- Contract ---

export class IntakeBatchContract {
  private readonly contract: ControlPlaneIntakeContract;
  private readonly now: () => string;

  constructor(dependencies: IntakeBatchContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.contract = new ControlPlaneIntakeContract({
      ...(dependencies.contractDependencies ?? {}),
      now: dependencies.contractDependencies?.now ?? this.now,
    });
  }

  batch(requests: ControlPlaneIntakeRequest[]): IntakeBatch {
    const createdAt = this.now();
    const results: ControlPlaneIntakeResult[] = requests.map((req) =>
      this.contract.execute(req),
    );

    const totalRequests = results.length;
    let completeCount = 0;
    let partialCount = 0;
    let degradedCount = 0;

    for (const result of results) {
      if (!result.intent.valid) {
        degradedCount++;
      } else if (result.warnings.length > 0) {
        partialCount++;
      } else {
        completeCount++;
      }
    }

    const dominantStatus: IntakeBatchStatus | "NONE" =
      totalRequests === 0
        ? "NONE"
        : degradedCount > 0
          ? "DEGRADED"
          : partialCount > 0
            ? "PARTIAL"
            : "COMPLETE";

    const { batchHash, batchId } = createDeterministicBatchIdentity({
      batchSeed: "w35-t1-cp1-intake-batch",
      batchIdSeed: "w35-t1-cp1-intake-batch-id",
      hashParts: [
        `${createdAt}:total:${totalRequests}`,
        `complete:${completeCount}`,
        `partial:${partialCount}`,
        `degraded:${degradedCount}`,
      ],
    });

    return {
      batchId,
      batchHash,
      createdAt,
      totalRequests,
      completeCount,
      partialCount,
      degradedCount,
      dominantStatus,
      results,
    };
  }
}

export function createIntakeBatchContract(
  dependencies?: IntakeBatchContractDependencies,
): IntakeBatchContract {
  return new IntakeBatchContract(dependencies);
}
