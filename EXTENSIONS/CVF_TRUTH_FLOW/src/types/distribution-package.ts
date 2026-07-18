/**
 * Sole-producer contract owned by CVF Truth Flow, per
 * docs/reference/sot_three_layer/CVF_SOT_THREE_LAYER_CONTRACT_CHAIN.md
 * section 7. Distribution requires a valid, non-expired, non-revoked
 * Kernel-resolved reference; acknowledgement_state is Flow-local lifecycle
 * only and carries no Flow-local "VERIFIED"-equivalent token.
 */
export type AcknowledgementState =
  | "PENDING_ACKNOWLEDGEMENT"
  | "ACKNOWLEDGED"
  | "EXPIRED"
  | "WITHDRAWN";

export interface DistributionPackage {
  package_id: string;
  recipient: string;
  role: string;
  task: string;
  phase: string;
  truth_references: string[];
  dose: string;
  restrictions: string[];
  expiry_utc: string;
  routing_decision: string;
  acknowledgement_state: AcknowledgementState;
}
