import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type {
  TrustDomainCriteria,
  TrustDomainDeclaration,
  TrustDomainClass,
} from "./trust.isolation.boundary.contract";
import { TrustIsolationBoundaryContract } from "./trust.isolation.boundary.contract";

// ─── Types ────────────────────────────────────────────────────────────────────

export type DeclareTrustDomainBatchDominantDomain = TrustDomainClass | "EMPTY";

export interface DeclareTrustDomainBatch {
  batchId: string;
  batchHash: string;
  createdAt: string;
  totalDeclarations: number;
  fullRuntimeCount: number;
  lightweightSdkCount: number;
  dominantResolvedDomain: DeclareTrustDomainBatchDominantDomain;
  declarations: TrustDomainDeclaration[];
}

export interface DeclareTrustDomainBatchContractDependencies {
  now?: () => string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DOMAIN_PRECEDENCE: Record<TrustDomainClass, number> = {
  FULL_RUNTIME: 2,
  LIGHTWEIGHT_SDK: 1,
};

function resolveDominantResolvedDomain(
  fullRuntimeCount: number,
  lightweightSdkCount: number,
): DeclareTrustDomainBatchDominantDomain {
  const total = fullRuntimeCount + lightweightSdkCount;
  if (total === 0) return "EMPTY";

  const candidates: Array<{ domain: TrustDomainClass; count: number }> = [
    { domain: "FULL_RUNTIME", count: fullRuntimeCount },
    { domain: "LIGHTWEIGHT_SDK", count: lightweightSdkCount },
  ];

  return candidates.reduce((best, candidate) => {
    if (candidate.count > best.count) return candidate;
    if (
      candidate.count === best.count &&
      DOMAIN_PRECEDENCE[candidate.domain] > DOMAIN_PRECEDENCE[best.domain]
    )
      return candidate;
    return best;
  }).domain;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * DeclareTrustDomainBatchContract (W21-T1 CP1 — Full Lane GC-019)
 * ----------------------------------------------------------------
 * Batches TrustDomainCriteria[] through declareTrustDomain() into a
 * governed batch summary.
 *
 * Fields:
 *   fullRuntimeCount          = count of declarations where resolvedDomain === "FULL_RUNTIME"
 *   lightweightSdkCount       = count of declarations where resolvedDomain === "LIGHTWEIGHT_SDK"
 *   dominantResolvedDomain    = domain with highest count; tie-broken by precedence
 *                               (FULL_RUNTIME > LIGHTWEIGHT_SDK)
 *                               "EMPTY" when batch is empty
 *   batchHash                 = hash of all declarationHashes + createdAt
 *   batchId                   = hash(batchHash) — distinct from batchHash
 *   declarations              = full TrustDomainDeclaration[] in input order
 */
export class DeclareTrustDomainBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: DeclareTrustDomainBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    criteriaList: TrustDomainCriteria[],
    boundary: TrustIsolationBoundaryContract,
  ): DeclareTrustDomainBatch {
    const createdAt = this.now();
    const declarations: TrustDomainDeclaration[] = [];

    for (const criteria of criteriaList) {
      declarations.push(boundary.declareTrustDomain(criteria));
    }

    const fullRuntimeCount = declarations.filter(
      (d) => d.resolvedDomain === "FULL_RUNTIME",
    ).length;
    const lightweightSdkCount = declarations.filter(
      (d) => d.resolvedDomain === "LIGHTWEIGHT_SDK",
    ).length;

    const dominantResolvedDomain = resolveDominantResolvedDomain(
      fullRuntimeCount,
      lightweightSdkCount,
    );

    const batchHash = computeDeterministicHash(
      "w21-t1-cp1-declare-trust-domain-batch",
      ...declarations.map((d) => d.declarationHash),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w21-t1-cp1-declare-trust-domain-batch-id",
      batchHash,
    );

    return {
      batchId,
      batchHash,
      createdAt,
      totalDeclarations: declarations.length,
      fullRuntimeCount,
      lightweightSdkCount,
      dominantResolvedDomain,
      declarations,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createDeclareTrustDomainBatchContract(
  dependencies?: DeclareTrustDomainBatchContractDependencies,
): DeclareTrustDomainBatchContract {
  return new DeclareTrustDomainBatchContract(dependencies);
}
