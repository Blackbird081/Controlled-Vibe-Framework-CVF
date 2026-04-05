import type { DispatchResult } from "./dispatch.contract";
import type { PolicyGateResult } from "./policy.gate.contract";
import { PolicyGateContract } from "./policy.gate.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

export type PolicyGateBatchStatus =
  | "FULLY_ALLOWED"
  | "PARTIALLY_ALLOWED"
  | "FULLY_BLOCKED"
  | "NONE";

export interface PolicyGateBatchInput {
  dispatchResult: DispatchResult;
}

export interface PolicyGateBatchResult {
  batchId: string;
  batchHash: string;
  evaluatedAt: string;
  results: PolicyGateResult[];
  totalAllowed: number;
  totalDenied: number;
  totalReviewRequired: number;
  totalSandboxed: number;
  totalPending: number;
  totalEntries: number;
  warnedCount: number;
  dominantDecision: PolicyGateBatchStatus;
}

export interface PolicyGateBatchContractDependencies {
  policyGateContract?: PolicyGateContract;
  now?: () => string;
}

// --- Status Resolution ---

function resolveDominantDecision(
  totalAllowed: number,
  totalDenied: number,
  totalReviewRequired: number,
  totalSandboxed: number,
  totalPending: number,
  isEmpty: boolean,
): PolicyGateBatchStatus {
  if (isEmpty) return "NONE";
  if (totalAllowed === 0) return "FULLY_BLOCKED";
  const hasRestrictions =
    totalDenied > 0 || totalReviewRequired > 0 || totalSandboxed > 0 || totalPending > 0;
  if (hasRestrictions) return "PARTIALLY_ALLOWED";
  return "FULLY_ALLOWED";
}

// --- Contract ---

export class PolicyGateBatchContract {
  private readonly gate: PolicyGateContract;
  private readonly now: () => string;

  constructor(dependencies: PolicyGateBatchContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.gate = dependencies.policyGateContract ?? new PolicyGateContract({ now: this.now });
  }

  batch(inputs: PolicyGateBatchInput[]): PolicyGateBatchResult {
    const evaluatedAt = this.now();

    const results: PolicyGateResult[] = inputs.map((input) =>
      this.gate.evaluate(input.dispatchResult),
    );

    const totalAllowed = results.reduce((s, r) => s + r.allowedCount, 0);
    const totalDenied = results.reduce((s, r) => s + r.deniedCount, 0);
    const totalReviewRequired = results.reduce((s, r) => s + r.reviewRequiredCount, 0);
    const totalSandboxed = results.reduce((s, r) => s + r.sandboxedCount, 0);
    const totalPending = results.reduce((s, r) => s + r.pendingCount, 0);
    const totalEntries = results.reduce((s, r) => s + r.entries.length, 0);
    const warnedCount = results.filter(
      (r) => r.deniedCount > 0 || r.reviewRequiredCount > 0 || r.sandboxedCount > 0,
    ).length;

    const dominantDecision = resolveDominantDecision(
      totalAllowed,
      totalDenied,
      totalReviewRequired,
      totalSandboxed,
      totalPending,
      inputs.length === 0,
    );

    const batchHash = computeDeterministicHash(
      "w50-t1-cp1-policy-gate-batch",
      `${evaluatedAt}:${inputs.length}`,
      `allowed:${totalAllowed}:denied:${totalDenied}:review:${totalReviewRequired}:sandbox:${totalSandboxed}`,
      results.map((r) => r.gateId).join(":"),
    );

    const batchId = computeDeterministicHash(
      "w50-t1-cp1-policy-gate-batch-id",
      batchHash,
    );

    return {
      batchId,
      batchHash,
      evaluatedAt,
      results,
      totalAllowed,
      totalDenied,
      totalReviewRequired,
      totalSandboxed,
      totalPending,
      totalEntries,
      warnedCount,
      dominantDecision,
    };
  }
}

export function createPolicyGateBatchContract(
  dependencies?: PolicyGateBatchContractDependencies,
): PolicyGateBatchContract {
  return new PolicyGateBatchContract(dependencies);
}
