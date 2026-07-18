/**
 * MPI-T2 Scan Registry Episodic Read Projection
 *
 * Deterministic, read-only projection from GC-051 Corpus Scan Registry findings
 * into Memory readout candidate-compatible summary records.
 *
 * This helper is a rebuildable derived view of the registry per-entry sources.
 * It never writes the registry, never edits the Memory readout route, never
 * emits raw packet content, and never authorizes reinjection. Projected
 * candidates carry summary-only text plus source attribution (registry entry id
 * and finding id) so an internal agent can retrieve prior scan findings through
 * the existing summary-only Memory readout surface.
 *
 * Source authority is the registry per-entry sources and the GC-051 standard
 * (`docs/reference/CVF_CORPUS_SCAN_REGISTRY_STANDARD_2026-06-02.md`). The
 * projection itself is metadata, not source authority.
 */

/** Narrow subset of a GC-051 finding record consumed by this projection. */
export interface ScanRegistryFinding {
  id: string;
  summary: string;
  disposition?: string;
  nextAction?: string;
  defectClass?: string;
  learningLane?: string;
}

/** Narrow subset of a GC-051 registry entry consumed by this projection. */
export interface ScanRegistryEntry {
  id: string;
  displayName?: string;
  scopePaths?: readonly string[];
  semanticRegions?: readonly string[];
  findings?: readonly ScanRegistryFinding[];
}

/** A Memory readout candidate-compatible summary record (no raw content). */
export interface ScanRegistryMemoryCandidate {
  id: string;
  scope: string;
  summary: string;
  createdAt: number;
  auditTrust: number;
  lifecycleState: 'episodic';
  source: {
    kind: 'scan-registry-finding';
    entryId: string;
    findingId: string;
    matchedOn: 'semanticRegion' | 'findingSummary';
  };
}

export interface ScanRegistryProjectionOptions {
  /**
   * Deterministic createdAt stamp applied to every projected candidate.
   * Defaults to 0 so output is stable and testable without a clock.
   */
  createdAt?: number;
  /** Deterministic audit-trust default for projected episodic candidates. */
  auditTrust?: number;
  /** Optional cap on the number of projected candidates returned. */
  maxResults?: number;
}

const DEFAULT_AUDIT_TRUST = 0.5;
const DEFAULT_CREATED_AT = 0;
const MAX_SUMMARY_LENGTH = 280;

/**
 * Extract deterministic, lowercase, de-duplicated keyword tokens from a query.
 * Tokens shorter than 3 characters are dropped to avoid noise matches.
 */
export function extractQueryKeywords(query: string): string[] {
  if (typeof query !== 'string' || query.length === 0) return [];
  const seen = new Set<string>();
  const tokens: string[] = [];
  for (const rawToken of query.toLowerCase().split(/[^a-z0-9]+/)) {
    if (rawToken.length < 3) continue;
    if (seen.has(rawToken)) continue;
    seen.add(rawToken);
    tokens.push(rawToken);
  }
  return tokens;
}

function textMatchesAnyKeyword(text: string, keywords: readonly string[]): boolean {
  if (typeof text !== 'string' || text.length === 0) return false;
  const haystack = text.toLowerCase();
  return keywords.some((keyword) => haystack.includes(keyword));
}

function boundedSummary(text: string): string {
  if (text.length <= MAX_SUMMARY_LENGTH) return text;
  return `${text.slice(0, MAX_SUMMARY_LENGTH - 3)}...`;
}

function entryScope(entry: ScanRegistryEntry): string {
  if (Array.isArray(entry.scopePaths) && entry.scopePaths.length > 0) {
    return entry.scopePaths[0];
  }
  return entry.id;
}

/**
 * Project matching registry findings into Memory readout candidate-compatible
 * summary records.
 *
 * Behavior contract:
 * - matches query keywords against entry `semanticRegions` and
 *   `findings[].summary` (GC-051 Finding Discovery Rule);
 * - returns an empty list when there is no query, no entries, or no match;
 * - never mutates the input;
 * - emits one stable candidate per matched finding, de-duplicated by
 *   `entryId:findingId` so repeated matching does not create unstable
 *   duplicates;
 * - carries no raw packet content, only a bounded summary and attribution.
 */
export function projectScanRegistryFindings(
  entries: readonly ScanRegistryEntry[] | undefined,
  query: string,
  options: ScanRegistryProjectionOptions = {},
): ScanRegistryMemoryCandidate[] {
  if (!Array.isArray(entries) || entries.length === 0) return [];
  const keywords = extractQueryKeywords(query);
  if (keywords.length === 0) return [];

  const createdAt = options.createdAt ?? DEFAULT_CREATED_AT;
  const auditTrust = options.auditTrust ?? DEFAULT_AUDIT_TRUST;

  const emitted = new Set<string>();
  const candidates: ScanRegistryMemoryCandidate[] = [];

  for (const entry of entries) {
    if (!entry || typeof entry.id !== 'string' || entry.id.length === 0) continue;
    if (!Array.isArray(entry.findings)) continue;

    const semanticRegionsMatch = Array.isArray(entry.semanticRegions)
      ? entry.semanticRegions.some((region: string) => textMatchesAnyKeyword(region, keywords))
      : false;

    for (const finding of entry.findings) {
      if (!finding || typeof finding.id !== 'string' || finding.id.length === 0) continue;
      if (typeof finding.summary !== 'string' || finding.summary.length === 0) continue;

      const summaryMatch = textMatchesAnyKeyword(finding.summary, keywords);
      if (!semanticRegionsMatch && !summaryMatch) continue;

      const dedupeKey = `${entry.id}:${finding.id}`;
      if (emitted.has(dedupeKey)) continue;
      emitted.add(dedupeKey);

      candidates.push({
        id: `scan-registry:${dedupeKey}`,
        scope: entryScope(entry),
        summary: boundedSummary(finding.summary),
        createdAt,
        auditTrust,
        lifecycleState: 'episodic',
        source: {
          kind: 'scan-registry-finding',
          entryId: entry.id,
          findingId: finding.id,
          matchedOn: summaryMatch ? 'findingSummary' : 'semanticRegion',
        },
      });

      if (typeof options.maxResults === 'number' && candidates.length >= options.maxResults) {
        return candidates;
      }
    }
  }

  return candidates;
}
