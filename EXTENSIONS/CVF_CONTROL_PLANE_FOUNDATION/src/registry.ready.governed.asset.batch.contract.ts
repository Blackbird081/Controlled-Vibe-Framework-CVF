import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type {
  RegistryReadyGovernedAssetRequest,
  RegistryReadyGovernedAssetResult,
} from "./registry.ready.governed.asset.contract";
import { createRegistryReadyGovernedAssetContract } from "./registry.ready.governed.asset.contract";

export interface RegistryReadyGovernedAssetBatchItem {
  requestId: string;
  request: RegistryReadyGovernedAssetRequest;
}

export interface RegistryReadyGovernedAssetBatchEntry {
  requestId: string;
  result: RegistryReadyGovernedAssetResult;
}

export interface RegistryReadyGovernedAssetBatchResult {
  batchId: string;
  batchHash: string;
  createdAt: string;
  totalRequests: number;
  validCount: number;
  invalidCount: number;
  approvedCount: number;
  results: RegistryReadyGovernedAssetBatchEntry[];
}

export interface RegistryReadyGovernedAssetBatchContractDependencies {
  now?: () => string;
}

export class RegistryReadyGovernedAssetBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: RegistryReadyGovernedAssetBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    requests: RegistryReadyGovernedAssetBatchItem[],
  ): RegistryReadyGovernedAssetBatchResult {
    const contract = createRegistryReadyGovernedAssetContract();
    const createdAt = this.now();
    const results = requests.map((request) => ({
      requestId: request.requestId,
      result: contract.prepare(request.request),
    }));

    const validCount = results.filter((result) => result.result.valid).length;
    const invalidCount = results.length - validCount;
    const approvedCount = results.filter(
      (result) =>
        result.result.governedAsset?.governance.approval_state === "approved",
    ).length;

    const batchHash = computeDeterministicHash(
      "registry-ready-governed-asset-batch",
      ...results.map((result) =>
        computeDeterministicHash(
          result.requestId,
          JSON.stringify(result.result.governedAsset ?? null),
          JSON.stringify(result.result.issues),
        ),
      ),
      createdAt,
    );
    const batchId = computeDeterministicHash(
      "registry-ready-governed-asset-batch-id",
      batchHash,
    );

    return {
      batchId,
      batchHash,
      createdAt,
      totalRequests: results.length,
      validCount,
      invalidCount,
      approvedCount,
      results,
    };
  }
}

export function createRegistryReadyGovernedAssetBatchContract(
  dependencies?: RegistryReadyGovernedAssetBatchContractDependencies,
): RegistryReadyGovernedAssetBatchContract {
  return new RegistryReadyGovernedAssetBatchContract(dependencies);
}
