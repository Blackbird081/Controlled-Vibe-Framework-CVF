import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type {
  W7NormalizedAssetCandidateCompileRequest,
  W7NormalizedAssetCandidateCompileResult,
} from "./w7.normalized.asset.candidate.contract";
import { createW7NormalizedAssetCandidateContract } from "./w7.normalized.asset.candidate.contract";

export interface W7NormalizedAssetCandidateBatchItem {
  requestId: string;
  request: W7NormalizedAssetCandidateCompileRequest;
}

export interface W7NormalizedAssetCandidateBatchEntry {
  requestId: string;
  result: W7NormalizedAssetCandidateCompileResult;
}

export interface W7NormalizedAssetCandidateBatchResult {
  batchId: string;
  batchHash: string;
  createdAt: string;
  totalRequests: number;
  validCount: number;
  invalidCount: number;
  generatedCandidateCount: number;
  results: W7NormalizedAssetCandidateBatchEntry[];
}

export interface W7NormalizedAssetCandidateBatchContractDependencies {
  now?: () => string;
}

export class W7NormalizedAssetCandidateBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: W7NormalizedAssetCandidateBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    requests: W7NormalizedAssetCandidateBatchItem[],
  ): W7NormalizedAssetCandidateBatchResult {
    const compiler = createW7NormalizedAssetCandidateContract();
    const createdAt = this.now();
    const results = requests.map((request) => ({
      requestId: request.requestId,
      result: compiler.compile(request.request),
    }));

    const validCount = results.filter((result) => result.result.valid).length;
    const invalidCount = results.length - validCount;
    const generatedCandidateCount = results.filter(
      (result) => result.result.normalizedCandidate !== undefined,
    ).length;

    const batchHash = computeDeterministicHash(
      "w7-normalized-asset-candidate-batch",
      ...results.map((result) =>
        computeDeterministicHash(
          result.requestId,
          JSON.stringify(result.result.normalizedCandidate ?? null),
          JSON.stringify(result.result.issues),
        ),
      ),
      createdAt,
    );
    const batchId = computeDeterministicHash(
      "w7-normalized-asset-candidate-batch-id",
      batchHash,
    );

    return {
      batchId,
      batchHash,
      createdAt,
      totalRequests: results.length,
      validCount,
      invalidCount,
      generatedCandidateCount,
      results,
    };
  }
}

export function createW7NormalizedAssetCandidateBatchContract(
  dependencies?: W7NormalizedAssetCandidateBatchContractDependencies,
): W7NormalizedAssetCandidateBatchContract {
  return new W7NormalizedAssetCandidateBatchContract(dependencies);
}
