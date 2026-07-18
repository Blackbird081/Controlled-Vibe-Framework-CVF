// LPCI1-T5: Five-stage filter pipeline per T3 Search Filter Index Spec
// Stage 4 (answerClass post-filter) is mandatory and non-overridable.

import type {
  AnswerClass,
  FilterParams,
  LpciIndexRecord,
  Phase1NegativeReceipt,
  RankedResultSet,
} from './types';

const EFFECTIVE_STATUSES = new Set(['effective', 'amended']);

// Stage 1: Sensitivity pre-filter — exclude classified records without clearance
function applySensitivityFilter(
  records: LpciIndexRecord[],
  sensitivityClearance: boolean,
): { filtered: LpciIndexRecord[]; applied: boolean } {
  const hasClassified = records.some((r) => r.sensitivityLevel === 'classified');
  if (!hasClassified) return { filtered: records, applied: false };
  if (!sensitivityClearance) {
    return {
      filtered: records.filter((r) => r.sensitivityLevel !== 'classified'),
      applied: true,
    };
  }
  return { filtered: records, applied: true };
}

// Stage 2: Status filter — default effective only; client may widen
function applyStatusFilter(
  records: LpciIndexRecord[],
  requestedStatuses?: string[],
): LpciIndexRecord[] {
  if (requestedStatuses && requestedStatuses.length > 0) {
    return records.filter((r) => requestedStatuses.includes(r.status));
  }
  return records.filter((r) => EFFECTIVE_STATUSES.has(r.status));
}

// Stage 3: Fulltext / semantic search (keyword match for prototype; semantic is T5 stretch)
function applySearch(records: LpciIndexRecord[], query: string): LpciIndexRecord[] {
  if (!query.trim()) return records;
  const lower = query.toLowerCase();
  return records.filter(
    (r) =>
      (r.titleSnippet && r.titleSnippet.toLowerCase().includes(lower)) ||
      (r.contentSnippet && r.contentSnippet.toLowerCase().includes(lower)) ||
      r.normalizedPath.toLowerCase().includes(lower) ||
      (r.documentType && r.documentType.toLowerCase().includes(lower)),
  );
}

// Stage 4: answerClass post-filter — MANDATORY, NON-OVERRIDABLE
// Records with answerClass=ESCALATE_OR_ABSTAIN are excluded from direct answer candidates.
// They may still be cited in an ESCALATED receipt if they are the only matches.
function applyAnswerClassFilter(records: LpciIndexRecord[]): {
  directCandidates: LpciIndexRecord[];
  escalateOnly: LpciIndexRecord[];
} {
  const directCandidates = records.filter((r) => r.answerClass !== 'ESCALATE_OR_ABSTAIN');
  const escalateOnly = records.filter((r) => r.answerClass === 'ESCALATE_OR_ABSTAIN');
  return { directCandidates, escalateOnly };
}

// Stage 5: Client facet filters
function applyFacetFilters(records: LpciIndexRecord[], filters: FilterParams): LpciIndexRecord[] {
  let result = records;
  if (filters.jurisdiction) {
    result = result.filter((r) => r.jurisdiction === filters.jurisdiction);
  }
  if (filters.documentType) {
    result = result.filter((r) => r.documentType === filters.documentType);
  }
  if (filters.authorityLevel) {
    result = result.filter((r) => r.authorityLevel === filters.authorityLevel);
  }
  return result;
}

// Rank by authorityLevel DESC, effectiveDate DESC (simple lexicographic for prototype)
const AUTHORITY_ORDER: Record<string, number> = {
  law: 0,
  decree: 1,
  circular: 2,
  policy: 3,
  notice: 4,
  decision: 5,
  sop: 6,
  contract: 7,
  other: 8,
};

function rankRecords(records: LpciIndexRecord[]): LpciIndexRecord[] {
  return [...records].sort((a, b) => {
    const aAuth = AUTHORITY_ORDER[a.authorityLevel?.toLowerCase() ?? 'other'] ?? 8;
    const bAuth = AUTHORITY_ORDER[b.authorityLevel?.toLowerCase() ?? 'other'] ?? 8;
    if (aAuth !== bAuth) return aAuth - bAuth;
    const aDate = a.effectiveDate ?? '';
    const bDate = b.effectiveDate ?? '';
    return bDate.localeCompare(aDate);
  });
}

export type FilterPipelineResult =
  | { type: 'RANKED'; result: RankedResultSet; sensitivityApplied: boolean; appliedFilters: FilterParams }
  | { type: 'NEGATIVE'; receipt: Phase1NegativeReceipt; sensitivityApplied: boolean; appliedFilters: FilterParams };

export function runFilterPipeline(
  corpus: LpciIndexRecord[],
  query: string,
  filters: FilterParams = {},
): FilterPipelineResult {
  const appliedFilters: FilterParams = { ...filters };

  // Stage 1 — Sensitivity pre-filter
  const { filtered: afterSensitivity, applied: sensitivityApplied } = applySensitivityFilter(
    corpus,
    filters.sensitivityClearance ?? false,
  );

  if (afterSensitivity.length === 0 && corpus.length > 0) {
    return {
      type: 'NEGATIVE',
      receipt: { receiptType: 'FILTERED_OUT', query, reason: 'all records excluded by sensitivity filter' },
      sensitivityApplied,
      appliedFilters,
    };
  }

  // Stage 2 — Status filter
  const afterStatus = applyStatusFilter(afterSensitivity, filters.status?.map(String));

  // Stage 3 — Fulltext search
  const afterSearch = applySearch(afterStatus, query);

  if (afterSearch.length === 0) {
    return {
      type: 'NEGATIVE',
      receipt: { receiptType: 'NO_RESULTS', query },
      sensitivityApplied,
      appliedFilters,
    };
  }

  // Stage 4 — answerClass post-filter (MANDATORY, NON-OVERRIDABLE)
  const { directCandidates, escalateOnly } = applyAnswerClassFilter(afterSearch);

  if (directCandidates.length === 0) {
    // All matched records are ESCALATE_OR_ABSTAIN
    return {
      type: 'NEGATIVE',
      receipt: { receiptType: 'ESCALATED', query, reason: 'all matched records require escalation or abstention' },
      sensitivityApplied,
      appliedFilters,
    };
  }

  // Stage 5 — Client facet filters (applied to direct candidates only)
  const afterFacet = applyFacetFilters(directCandidates, filters);
  // Also filter escalate-only through facets for context
  const escalateFiltered = applyFacetFilters(escalateOnly, filters);

  const ranked = rankRecords([...afterFacet, ...escalateFiltered]);

  if (ranked.length === 0) {
    return {
      type: 'NEGATIVE',
      receipt: { receiptType: 'NO_RESULTS', query, reason: 'no records matched facet filters' },
      sensitivityApplied,
      appliedFilters,
    };
  }

  return {
    type: 'RANKED',
    result: { records: ranked },
    sensitivityApplied,
    appliedFilters,
  };
}

// Downgrades superseded records to ESCALATE_OR_ABSTAIN before precedence rule (T4 freshness protocol)
export function applySupersededDowngrade(records: LpciIndexRecord[]): LpciIndexRecord[] {
  return records.map((r) => {
    if (r.status === 'superseded') {
      return { ...r, answerClass: 'ESCALATE_OR_ABSTAIN' as AnswerClass };
    }
    return r;
  });
}
