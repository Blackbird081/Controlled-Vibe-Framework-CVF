/**
 * MEMCON-T4 Retrieval-Pack Boundary Helper
 *
 * Deterministic, pure helper that prepares a summary-only retrieval-pack input
 * from consolidated-memory summaries and enforces that disallowed memory
 * categories are excluded before any handoff toward the existing retrieval
 * policy or runtime workflow surfaces.
 *
 * Authority:
 *   docs/baselines/CVF_GC018_MEMCON_T4_RETRIEVAL_PACK_BOUNDARY_CONFORMANCE_2026-06-13.md
 *   docs/work_orders/CVF_AGENT_WORK_ORDER_MEMCON_T4_RETRIEVAL_PACK_BOUNDARY_CONFORMANCE_FOR_CLAUDE_2026-06-13.md
 *   docs/reference/CVF_MEMORY_CONSOLIDATION_SCHEMA_APPENDIX_2026-06-13.md
 *   EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/memory-retrieval-policy.ts
 *   EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/memory-runtime-workflow-chain.ts
 *
 * Boundary:
 *   - No route wiring, durable storage, provider/API call, Policy_Local mutation,
 *     public-sync, generated JSON aggregate edit, or session-state mutation.
 *   - Does NOT modify existing retrieval policy or runtime workflow chain files.
 *   - rawMemoryReleased is always false (literal invariant).
 *
 * rawMemoryReleased=false
 */

export const MEMCON_RETRIEVAL_PACK_BOUNDARY_VERSION =
  "cvf.memconRetrievalPackBoundary.t4.v1";

// ---------------------------------------------------------------------------
// Allowed retrieval eligibility values from T1b schema appendix
// ---------------------------------------------------------------------------
export type MemconRetrievalEligibility =
  | "ELIGIBLE"
  | "INELIGIBLE"
  | "BLOCKED_SOURCE_MISSING"
  | "BLOCKED_CONFLICT"
  | "BLOCKED_STALE"
  | "BLOCKED_TIME_AMBIGUOUS"
  | "BLOCKED_SENSITIVE";

// Lifecycle states inherited from existing retrieval-policy contract.
// "expired" and "disputed" are the BLOCKED_STATES in memory-retrieval-policy.ts.
export type MemconLifecycleState =
  | "working"
  | "episodic"
  | "semantic"
  | "procedural"
  | "expired"
  | "disputed";

export type MemconConsolidationDecision =
  | "CONSOLIDATED"
  | "MERGED"
  | "SUPERSEDED"
  | "PRUNED_LOW_VALUE"
  | "BLOCKED_CONFLICT"
  | "BLOCKED_STALE"
  | "BLOCKED_TIME_AMBIGUOUS"
  | "DEFERRED_NEEDS_OPERATOR";

export type MemconTemporalNormalizationStatus =
  | "ABSOLUTE_DATE_PRESENT"
  | "NORMALIZED_TO_ABSOLUTE_DATE"
  | "NO_TIME_REFERENCE"
  | "TIME_AMBIGUOUS_BLOCKED";

export type MemconConfidenceLevel = "HIGH" | "MEDIUM" | "LOW" | "UNVERIFIED";

// ---------------------------------------------------------------------------
// Input shape: narrow consolidated-memory summaries consumed by T4 helper
// ---------------------------------------------------------------------------

/**
 * Narrow input shape for a consolidated-memory summary accepted by T4.
 * Must NOT contain raw transcript dumps or raw memory content.
 * Schema authority: docs/reference/CVF_MEMORY_CONSOLIDATION_SCHEMA_APPENDIX_2026-06-13.md
 * ConsolidatedMemoryRecord fields: recordId, sourceAuthority, confidenceLevel,
 * retrievalEligibility, retrievalBoundary, temporalNormalizationStatus,
 * consolidationDecision, contradiction_flag, sensitiveDataFlag, summaryText.
 */
export interface MemconConsolidatedMemoryRecordInput {
  /** Stable unique ID for the consolidated record. */
  recordId: string;

  /**
   * Source authority: repo path, artifact hash, work-order ref, or operator ref.
   * Empty value is BLOCKED_SOURCE_MISSING.
   */
  sourceAuthority: string;

  /**
   * Confidence level inherited from MemoryCandidate.
   * UNVERIFIED is not durable-ready without review.
   */
  confidenceLevel: MemconConfidenceLevel;

  /**
   * Retrieval eligibility as determined by consolidation gates.
   * Only ELIGIBLE records enter the selected pack.
   */
  retrievalEligibility: MemconRetrievalEligibility;

  /**
   * Lifecycle state aligned with existing memory-retrieval-policy.ts BLOCKED_STATES.
   * "expired" and "disputed" are blocked.
   */
  lifecycleState: MemconLifecycleState;

  /**
   * Temporal normalization status.
   * TIME_AMBIGUOUS_BLOCKED is excluded from the retrieval pack.
   */
  temporalNormalizationStatus: MemconTemporalNormalizationStatus;

  /**
   * Consolidation decision.
   * Any BLOCKED_* or DEFERRED_* decision is not retrieval-ready.
   */
  consolidationDecision: MemconConsolidationDecision;

  /**
   * Whether the record has an unresolved contradiction flag (W7 field).
   * true blocks the record from the retrieval pack.
   */
  contradiction_flag: boolean;

  /**
   * Whether the record bears sensitive data.
   * true blocks raw content release; summary-only output is still permitted.
   */
  sensitiveDataFlag: boolean;

  /**
   * Summary text for the record.
   * Must not be raw transcript content.
   */
  summaryText: string;

  /** Whether staleness blocks this record. */
  stalenessBlocked?: boolean;
}

// ---------------------------------------------------------------------------
// Result shape
// ---------------------------------------------------------------------------

/**
 * A single selected-pack entry with source authority and confidence included.
 * rawMemoryReleased is always false (literal).
 */
export interface MemconRetrievalPackEntry {
  recordId: string;
  summaryText: string;
  sourceAuthority: string;
  confidenceLevel: MemconConfidenceLevel;
  /** Always false -- raw memory content is never released by this helper. */
  rawMemoryReleased: false;
}

/**
 * Result of buildMemconRetrievalPackBoundary.
 *
 * rawMemoryReleased=false (literal invariant -- controlled memory gateway
 * and retrieval policy boundary inherited).
 */
export interface MemconRetrievalPackBoundaryResult {
  packVersion: typeof MEMCON_RETRIEVAL_PACK_BOUNDARY_VERSION;
  /** IDs of records selected into the retrieval pack. */
  selectedRecordIds: readonly string[];
  /** IDs of records excluded from the retrieval pack, with reasons. */
  excludedRecordIds: readonly string[];
  /** Reasons keyed by record ID. */
  exclusionReasons: Readonly<Record<string, string>>;
  /** Selected entries with source authority and confidence included. */
  selectedEntries: readonly MemconRetrievalPackEntry[];
  /** Always true -- this helper emits summary-only output. */
  summaryOnly: true;
  /** Always false -- raw memory content is never released. */
  rawMemoryReleased: false;
  /** Retrieval consumer identifier (target agent, route, or review packet). */
  retrievalConsumer: string;
}

// ---------------------------------------------------------------------------
// Exclusion-reason tokens (mirrors schema appendix blocking rules)
// ---------------------------------------------------------------------------

const EXCLUDED_LIFECYCLE_STATES = new Set<MemconLifecycleState>([
  "expired",
  "disputed",
]);

const BLOCKED_CONSOLIDATION_DECISIONS = new Set<MemconConsolidationDecision>([
  "BLOCKED_CONFLICT",
  "BLOCKED_STALE",
  "BLOCKED_TIME_AMBIGUOUS",
  "DEFERRED_NEEDS_OPERATOR",
  "PRUNED_LOW_VALUE",
  "SUPERSEDED",
]);

// ---------------------------------------------------------------------------
// Main helper
// ---------------------------------------------------------------------------

/**
 * Deterministic retrieval-pack boundary helper for MEMCON-T4.
 *
 * Accepts bounded consolidated-memory summary inputs, applies all required
 * blocking rules from the T1b schema appendix, and returns a
 * MemconRetrievalPackBoundaryResult with:
 *   - selected records (ELIGIBLE, non-blocked, with source authority + confidence)
 *   - excluded records with named reasons
 *   - summaryOnly=true
 *   - rawMemoryReleased=false (literal)
 *
 * Does NOT call providers, modify storage, wire routes, or mutate existing
 * retrieval policy or runtime workflow files.
 *
 * rawMemoryReleased=false
 */
export function buildMemconRetrievalPackBoundary(
  records: readonly MemconConsolidatedMemoryRecordInput[],
  retrievalConsumer: string,
): MemconRetrievalPackBoundaryResult {
  const selectedRecordIds: string[] = [];
  const excludedRecordIds: string[] = [];
  const exclusionReasons: Record<string, string> = {};
  const selectedEntries: MemconRetrievalPackEntry[] = [];

  for (const record of records) {
    const exclusionReason = _determineExclusionReason(record);

    if (exclusionReason !== null) {
      excludedRecordIds.push(record.recordId);
      exclusionReasons[record.recordId] = exclusionReason;
      continue;
    }

    // Record passes all gates: include in selected pack with source + confidence.
    selectedRecordIds.push(record.recordId);
    selectedEntries.push({
      recordId: record.recordId,
      summaryText: record.summaryText,
      sourceAuthority: record.sourceAuthority,
      confidenceLevel: record.confidenceLevel,
      rawMemoryReleased: false,
    });
  }

  return {
    packVersion: MEMCON_RETRIEVAL_PACK_BOUNDARY_VERSION,
    selectedRecordIds,
    excludedRecordIds,
    exclusionReasons,
    selectedEntries,
    summaryOnly: true,
    rawMemoryReleased: false,
    retrievalConsumer,
  };
}

// ---------------------------------------------------------------------------
// Internal gate: determine exclusion reason (null = record passes)
// ---------------------------------------------------------------------------

function _determineExclusionReason(
  record: MemconConsolidatedMemoryRecordInput,
): string | null {
  // Gate 1: Source authority must be non-empty.
  if (!record.sourceAuthority || record.sourceAuthority.trim().length === 0) {
    return "BLOCKED_SOURCE_MISSING";
  }

  // Gate 2: Confidence must not be UNVERIFIED.
  if (record.confidenceLevel === "UNVERIFIED") {
    return "BLOCKED_UNVERIFIED_CONFIDENCE";
  }

  // Gate 3: retrievalEligibility must be ELIGIBLE.
  if (record.retrievalEligibility !== "ELIGIBLE") {
    return record.retrievalEligibility;
  }

  // Gate 4: Lifecycle state -- expired and disputed are blocked (mirrors BLOCKED_STATES).
  if (EXCLUDED_LIFECYCLE_STATES.has(record.lifecycleState)) {
    return record.lifecycleState === "expired"
      ? "BLOCKED_LIFECYCLE_EXPIRED"
      : "BLOCKED_LIFECYCLE_DISPUTED";
  }

  // Gate 5: Temporal normalization -- TIME_AMBIGUOUS_BLOCKED is excluded.
  if (record.temporalNormalizationStatus === "TIME_AMBIGUOUS_BLOCKED") {
    return "BLOCKED_TIME_AMBIGUOUS";
  }

  // Gate 6: Consolidation decision -- any BLOCKED_* or DEFERRED_* decision is not retrieval-ready.
  if (BLOCKED_CONSOLIDATION_DECISIONS.has(record.consolidationDecision)) {
    return `BLOCKED_CONSOLIDATION_${record.consolidationDecision}`;
  }

  // Gate 7: Staleness block.
  if (record.stalenessBlocked === true) {
    return "BLOCKED_STALE";
  }

  // Gate 8: Contradiction flag -- unresolved contradictions block the record.
  if (record.contradiction_flag === true) {
    return "BLOCKED_CONTRADICTION";
  }

  // Gate 9: Sensitive data -- sensitive records are excluded from the pack entirely
  // (summary-only output does not release raw content, but sensitive records must
  // not propagate to retrieval without a separate operator authorization path).
  if (record.sensitiveDataFlag === true) {
    return "BLOCKED_SENSITIVE";
  }

  return null;
}
