import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type {
  SemanticPolicyIntentRegistryRequest,
  SemanticPolicyIntentRegistryResult,
} from "./semantic.policy.intent.registry.contract";
import { createSemanticPolicyIntentRegistryContract } from "./semantic.policy.intent.registry.contract";

export interface SemanticPolicyIntentRegistryBatchItem {
  requestId: string;
  request: SemanticPolicyIntentRegistryRequest;
}

export interface SemanticPolicyIntentRegistryBatchEntry {
  requestId: string;
  result: SemanticPolicyIntentRegistryResult;
}

export interface SemanticPolicyIntentRegistryBatchResult {
  batchId: string;
  batchHash: string;
  createdAt: string;
  totalRequests: number;
  validCount: number;
  invalidCount: number;
  unknownItemCount: number;
  mismatchCount: number;
  duplicateItemCount: number;
  results: SemanticPolicyIntentRegistryBatchEntry[];
}

export interface SemanticPolicyIntentRegistryBatchContractDependencies {
  now?: () => string;
}

export class SemanticPolicyIntentRegistryBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: SemanticPolicyIntentRegistryBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    requests: SemanticPolicyIntentRegistryBatchItem[],
  ): SemanticPolicyIntentRegistryBatchResult {
    const registry = createSemanticPolicyIntentRegistryContract();
    const createdAt = this.now();
    const results = requests.map((request) => ({
      requestId: request.requestId,
      result: registry.classify(request.request),
    }));

    const validCount = results.filter((result) => result.result.valid).length;
    const invalidCount = results.length - validCount;
    const unknownItemCount = results.reduce(
      (total, result) => total + result.result.unknownItems.length,
      0,
    );
    const mismatchCount = results.reduce(
      (total, result) => total + result.result.classMismatches.length,
      0,
    );
    const duplicateItemCount = results.reduce(
      (total, result) => total + result.result.duplicateItems.length,
      0,
    );

    const batchHash = computeDeterministicHash(
      "semantic-policy-intent-registry-batch",
      ...results.map((result) =>
        computeDeterministicHash(
          result.requestId,
          JSON.stringify(result.result.classifiedItems),
          JSON.stringify(result.result.unknownItems),
          JSON.stringify(result.result.duplicateItems),
          JSON.stringify(result.result.classMismatches),
        ),
      ),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "semantic-policy-intent-registry-batch-id",
      batchHash,
    );

    return {
      batchId,
      batchHash,
      createdAt,
      totalRequests: requests.length,
      validCount,
      invalidCount,
      unknownItemCount,
      mismatchCount,
      duplicateItemCount,
      results,
    };
  }
}

export function createSemanticPolicyIntentRegistryBatchContract(
  dependencies?: SemanticPolicyIntentRegistryBatchContractDependencies,
): SemanticPolicyIntentRegistryBatchContract {
  return new SemanticPolicyIntentRegistryBatchContract(dependencies);
}
