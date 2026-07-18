/**
 * Adapted from TKG-T1's Evidence Record Minimum
 * (docs/reference/truth_foundation/CVF_TRUTH_FOUNDATION_SOURCE_PROVENANCE_AND_VERIFICATION_CONTRACT.md)
 * and bound to a specific RefineryPacket so cross-packet evidence can be
 * detected and rejected (T2 Negative Case NC-06).
 */
export type ProvenanceLabel =
  | "SOURCE_BACKED"
  | "COMPUTED"
  | "RECEIPT_BACKED"
  | "LLM_INFERRED"
  | "HUMAN_APPROVED"
  | "EXTERNAL_INPUT"
  | "MISSING_EVIDENCE"
  | "STALE_SOURCE"
  | "CONFLICTED_SOURCE";

export interface EvidenceRecord {
  evidence_id: string;
  bound_packet_id: string;
  bound_source_id: string;
  provenance_label: ProvenanceLabel;
  captured_at_utc: string;
  valid_until_utc: string | null;
}
