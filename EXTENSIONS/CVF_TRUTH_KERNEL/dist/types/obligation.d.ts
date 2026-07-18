/**
 * Adapted from TKG-T1's Obligation Record Minimum, bound to a specific
 * RefineryPacket for the same cross-packet-binding reason as EvidenceRecord.
 */
export type ObligationHardOrSoft = "HARD" | "SOFT";
export type ObligationStatus = "ACTIVE" | "SATISFIED" | "FAILED";
export interface ObligationRecord {
    obligation_id: string;
    bound_packet_id: string;
    bound_source_id: string;
    hard_or_soft: ObligationHardOrSoft;
    status: ObligationStatus;
}
