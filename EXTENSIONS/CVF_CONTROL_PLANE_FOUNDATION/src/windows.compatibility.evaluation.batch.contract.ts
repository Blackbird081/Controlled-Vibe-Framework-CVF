import type {
  WindowsCompatibilityClassification,
  WindowsCompatibilityEvaluationResult,
} from "./windows.compatibility.evaluation.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

export interface WindowsCompatibilityEvaluationBatchResult {
  batchId: string;
  batchHash: string;
  createdAt: string;
  totalResults: number;
  classificationCounts: Record<WindowsCompatibilityClassification, number>;
  averageScore: number;
  dominantClassification: WindowsCompatibilityClassification | "NONE";
  results: WindowsCompatibilityEvaluationResult[];
}

export interface WindowsCompatibilityEvaluationBatchContractDependencies {
  now?: () => string;
}

function resolveDominantClassification(
  counts: Record<WindowsCompatibilityClassification, number>,
): WindowsCompatibilityClassification | "NONE" {
  const entries = Object.entries(counts) as Array<
    [WindowsCompatibilityClassification, number]
  >;
  const dominant = entries.sort((left, right) => right[1] - left[1])[0];
  return dominant === undefined || dominant[1] === 0 ? "NONE" : dominant[0];
}

export class WindowsCompatibilityEvaluationBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: WindowsCompatibilityEvaluationBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    results: WindowsCompatibilityEvaluationResult[],
  ): WindowsCompatibilityEvaluationBatchResult {
    const createdAt = this.now();
    const classificationCounts: Record<WindowsCompatibilityClassification, number> =
      {
        WINDOWS_NATIVE: 0,
        COMPATIBLE: 0,
        REQUIRES_REFACTOR: 0,
        REJECTED_FOR_WINDOWS_TARGET: 0,
      };

    for (const result of results) {
      classificationCounts[result.classification] += 1;
    }

    const averageScore =
      results.length === 0
        ? 0
        : Math.round(
            results.reduce((sum, result) => sum + result.score, 0) /
              results.length,
          );

    const batchHash = computeDeterministicHash(
      "windows-compatibility-evaluation-batch",
      ...results.map(
        (result) =>
          `${result.classification}:${result.score}:${result.blockers.join(",")}`,
      ),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "windows-compatibility-evaluation-batch-id",
      batchHash,
    );

    return {
      batchId,
      batchHash,
      createdAt,
      totalResults: results.length,
      classificationCounts,
      averageScore,
      dominantClassification: resolveDominantClassification(classificationCounts),
      results,
    };
  }
}

export function createWindowsCompatibilityEvaluationBatchContract(
  dependencies?: WindowsCompatibilityEvaluationBatchContractDependencies,
): WindowsCompatibilityEvaluationBatchContract {
  return new WindowsCompatibilityEvaluationBatchContract(dependencies);
}
