// LPCI1-T5: Phase 1 / Phase 2 retrieval pipeline per T4 Retrieval Boundary Spec
// Phase 2 invoked only when Phase 1 returns non-empty result set with ≥1 non-ESCALATE record.

import type {
  AnswerClass,
  ConflictRecord,
  FilterParams,
  LpciIndexRecord,
  Phase1NegativeReceipt,
  RetrievalReceipt,
  StaleRecord,
} from './types';
import { applySupersededDowngrade, runFilterPipeline } from './filter-pipeline';

// T4 answerClass precedence rule:
// ESCALATE_OR_ABSTAIN > PROCEDURAL_GUIDANCE > SUMMARY_WITH_SOURCE > DIRECT_CITED_ANSWER
const ANSWER_CLASS_RANK: Record<AnswerClass, number> = {
  DIRECT_CITED_ANSWER: 0,
  SUMMARY_WITH_SOURCE: 1,
  PROCEDURAL_GUIDANCE: 2,
  ESCALATE_OR_ABSTAIN: 3,
};

export function mostRestrictiveAnswerClass(records: LpciIndexRecord[]): AnswerClass {
  let max: AnswerClass = 'DIRECT_CITED_ANSWER';
  for (const r of records) {
    if (ANSWER_CLASS_RANK[r.answerClass] > ANSWER_CLASS_RANK[max]) {
      max = r.answerClass;
    }
  }
  return max;
}

function detectFreshness(records: LpciIndexRecord[]): { flag: boolean; staleRecords: StaleRecord[] } {
  const staleRecords: StaleRecord[] = [];
  for (const r of records) {
    if (r.status === 'amended' || r.status === 'superseded') {
      staleRecords.push({
        normalizedPath: r.normalizedPath,
        status: r.status,
        effectiveDate: r.effectiveDate,
      });
    }
  }
  return { flag: staleRecords.length > 0, staleRecords };
}

// Two records conflict when they match the same query topic AND differ on effectiveDate OR authorityLevel.
// For prototype: conflict if ≥2 records have different effectiveDate or different authorityLevel.
function detectConflict(records: LpciIndexRecord[]): { flag: boolean; conflictRecords: ConflictRecord[] } {
  if (records.length < 2) return { flag: false, conflictRecords: [] };

  const dates = new Set(records.map((r) => r.effectiveDate ?? ''));
  const levels = new Set(records.map((r) => r.authorityLevel ?? ''));

  const hasConflict = dates.size > 1 || levels.size > 1;
  if (!hasConflict) return { flag: false, conflictRecords: [] };

  return {
    flag: true,
    conflictRecords: records.map((r) => ({
      normalizedPath: r.normalizedPath,
      authorityLevel: r.authorityLevel,
      effectiveDate: r.effectiveDate,
    })),
  };
}

export type RetrievalPipelineResult =
  | { phase: 1; negative: Phase1NegativeReceipt; sensitivityApplied: boolean; appliedFilters: FilterParams }
  | { phase: 2; receipt: RetrievalReceipt };

export function runRetrievalPipeline(
  corpus: LpciIndexRecord[],
  query: string,
  filters: FilterParams = {},
): RetrievalPipelineResult {
  // Apply superseded downgrade before pipeline (T4 freshness protocol)
  const preparedCorpus = applySupersededDowngrade(corpus);

  // Phase 1: five-stage filter pipeline
  const phase1 = runFilterPipeline(preparedCorpus, query, filters);

  if (phase1.type === 'NEGATIVE') {
    return {
      phase: 1,
      negative: phase1.receipt,
      sensitivityApplied: phase1.sensitivityApplied,
      appliedFilters: phase1.appliedFilters,
    };
  }

  // Phase 2: answer assembly
  const rankedRecords = phase1.result.records;

  // Phase 2 only invoked when ≥1 non-ESCALATE record exists
  const nonEscalate = rankedRecords.filter((r) => r.answerClass !== 'ESCALATE_OR_ABSTAIN');
  if (nonEscalate.length === 0) {
    // All records are escalate — treat as negative receipt
    return {
      phase: 1,
      negative: { receiptType: 'ESCALATED', query },
      sensitivityApplied: phase1.sensitivityApplied,
      appliedFilters: phase1.appliedFilters,
    };
  }

  const answer_class = mostRestrictiveAnswerClass(rankedRecords);
  const { flag: freshness_flag } = detectFreshness(rankedRecords);
  const { flag: conflict_flag } = detectConflict(rankedRecords);

  const receipt: RetrievalReceipt = {
    matched_paths: rankedRecords.map((r) => r.normalizedPath),
    answer_class,
    freshness_flag,
    conflict_flag,
    matched_records: rankedRecords,
    query,
    query_timestamp: new Date().toISOString(),
  };

  return { phase: 2, receipt };
}

// Export helpers for route use
export { detectFreshness, detectConflict };
export type { StaleRecord, ConflictRecord };
