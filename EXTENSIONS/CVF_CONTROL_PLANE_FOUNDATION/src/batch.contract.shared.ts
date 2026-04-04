import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

export interface DeterministicBatchIdentityRequest {
  batchSeed: string;
  batchIdSeed: string;
  hashParts: ReadonlyArray<string | number | boolean>;
  batchIdParts?: ReadonlyArray<string | number | boolean>;
}

function normalizeHashParts(
  parts: ReadonlyArray<string | number | boolean>,
): string[] {
  return parts.map((part) => String(part));
}

export function createDeterministicBatchIdentity(
  request: DeterministicBatchIdentityRequest,
): { batchHash: string; batchId: string } {
  const batchHash = computeDeterministicHash(
    request.batchSeed,
    ...normalizeHashParts(request.hashParts),
  );
  const batchId = computeDeterministicHash(
    request.batchIdSeed,
    batchHash,
    ...normalizeHashParts(request.batchIdParts ?? []),
  );

  return { batchHash, batchId };
}

export function resolveDominantByCount<
  T extends string,
  Empty extends string,
>(
  counts: Record<T, number>,
  precedence: readonly T[],
  emptyValue: Empty,
): T | Empty {
  const total = Object.values(counts).reduce<number>(
    (sum, count) => sum + Number(count),
    0,
  );
  if (total === 0) return emptyValue;

  let dominant = precedence[precedence.length - 1];
  let maxCount = -1;

  for (const candidate of precedence) {
    const count = counts[candidate];
    if (count > maxCount) {
      maxCount = count;
      dominant = candidate;
    }
  }

  return dominant;
}

export function resolveDominantBySeverity<
  T extends string,
  Empty extends string,
>(
  values: readonly T[],
  severity: Record<T, number>,
  emptyValue: Empty,
  fallback: T,
): T | Empty {
  if (values.length === 0) return emptyValue;

  let dominant = fallback;
  for (const value of values) {
    if (severity[value] > severity[dominant]) {
      dominant = value;
    }
  }

  return dominant;
}
