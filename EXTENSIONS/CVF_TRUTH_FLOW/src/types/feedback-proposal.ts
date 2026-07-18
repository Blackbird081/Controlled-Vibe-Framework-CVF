/**
 * Sole-producer contract owned by CVF Truth Flow or a governed consumer
 * under policy, per
 * docs/reference/sot_three_layer/CVF_SOT_THREE_LAYER_CONTRACT_CHAIN.md
 * section 8. Proposal-only: no_direct_mutation_flag is always true and no
 * direct mutation function exists in this package (T2 Invariant 9, NC-12).
 */
export type FeedbackReviewStatus =
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "ACCEPTED"
  | "REJECTED";

export interface FeedbackProposal {
  proposal_id: string;
  observation: string;
  target_reference: string;
  proposed_change: string;
  evidence_refs: string[];
  proposer: string;
  review_status: FeedbackReviewStatus;
  no_direct_mutation_flag: true;
}
