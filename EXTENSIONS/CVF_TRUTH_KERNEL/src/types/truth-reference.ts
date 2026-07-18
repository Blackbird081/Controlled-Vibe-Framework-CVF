/**
 * Sole-producer contract owned by CVF Truth Kernel, per the T2 contract
 * chain section 6. reference_state is the single lifecycle field; there
 * is no separate supersession_state/revocation_state.
 */
export type ReferenceState = "ACTIVE" | "SUPERSEDED" | "REVOKED" | "EXPIRED";

export interface TruthReference {
  reference_id: string;
  receipt_id: string;
  scope: string;
  version: string;
  valid_from_utc: string;
  valid_until_utc: string;
  reference_state: ReferenceState;
}
