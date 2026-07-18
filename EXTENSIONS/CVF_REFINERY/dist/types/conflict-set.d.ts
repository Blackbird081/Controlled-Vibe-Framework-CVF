export type ConflictResolutionStatus = "UNRESOLVED" | "REVIEW_REQUIRED" | "RESOLVED_BY_POLICY" | "RESOLVED_BY_AUTHORITY";
export interface ConflictCandidate {
    record_id: string;
    source_id: string;
    value: unknown;
    valid_from_utc: string | null;
    valid_until_utc: string | null;
}
/**
 * Refinery never auto-selects an authoritative value from a conflict set:
 * resolution_status starts UNRESOLVED and only a governed downstream
 * decision (outside Refinery) can move it to a RESOLVED_* state.
 */
export interface ConflictSet {
    conflict_set_id: string;
    field: string;
    scope_key: string;
    candidates: ConflictCandidate[];
    resolution_status: ConflictResolutionStatus;
    resolution_reference: string | null;
}
