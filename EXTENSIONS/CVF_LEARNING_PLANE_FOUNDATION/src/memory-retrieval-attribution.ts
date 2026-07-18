import type {
  MemoryRetrievalCandidate,
  MemoryRetrievalResult,
} from "./memory-retrieval-policy";

export type MemoryRetrievalRankReason = "high_trust" | "medium_trust" | "low_trust";

export interface MemoryRetrievalAttribution {
  sourceId: string;
  scope?: string;
  freshnessMs?: number;
  rankReason?: MemoryRetrievalRankReason;
  exclusionReason?: string;
  isStale: boolean;
  rawContentBoundary: "content_stripped";
  rawMemoryReleased: false;
}

export interface BuildRetrievalAttributionOptions {
  currentTimeMs?: number;
  staleThresholdMs?: number;
}

export const DEFAULT_STALE_THRESHOLD_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

function deriveRankReason(auditTrust: MemoryRetrievalCandidate["auditTrust"]): MemoryRetrievalRankReason {
  if (auditTrust >= 0.9) return "high_trust";
  if (auditTrust >= 0.75) return "medium_trust";
  return "low_trust";
}

function deriveFreshnessMs(createdAt: number, currentTimeMs: number): number {
  return Math.max(0, currentTimeMs - createdAt);
}

function deriveIsStale(freshnessMs: number, staleThresholdMs: number): boolean {
  return freshnessMs > staleThresholdMs;
}

function candidateToAttribution(
  candidate: MemoryRetrievalCandidate,
  currentTimeMs: number,
  staleThresholdMs: number,
): MemoryRetrievalAttribution {
  const freshnessMs = deriveFreshnessMs(candidate.createdAt, currentTimeMs);
  return {
    sourceId: candidate.id,
    scope: candidate.scope,
    freshnessMs,
    rankReason: deriveRankReason(candidate.auditTrust),
    exclusionReason: undefined,
    isStale: deriveIsStale(freshnessMs, staleThresholdMs),
    rawContentBoundary: "content_stripped",
    rawMemoryReleased: false,
  };
}

function excludedToAttribution(excluded: MemoryRetrievalResult["excluded"][number]): MemoryRetrievalAttribution {
  return {
    sourceId: excluded.id,
    scope: undefined,
    freshnessMs: undefined,
    rankReason: undefined,
    exclusionReason: excluded.reason,
    isStale: true,
    rawContentBoundary: "content_stripped",
    rawMemoryReleased: false,
  };
}

export function buildRetrievalAttribution(
  result: MemoryRetrievalResult,
  options: BuildRetrievalAttributionOptions = {},
): MemoryRetrievalAttribution[] {
  const currentTimeMs = options.currentTimeMs ?? Date.now();
  const staleThresholdMs = options.staleThresholdMs ?? DEFAULT_STALE_THRESHOLD_MS;

  const selectedAttribution = result.selected.map((candidate) =>
    candidateToAttribution(candidate, currentTimeMs, staleThresholdMs),
  );

  const excludedAttribution = result.excluded.map((excluded) =>
    excludedToAttribution(excluded),
  );

  return [...selectedAttribution, ...excludedAttribution];
}
