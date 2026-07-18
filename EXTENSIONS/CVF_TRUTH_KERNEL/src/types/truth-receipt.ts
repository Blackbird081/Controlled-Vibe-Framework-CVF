/**
 * Sole-producer contract owned by CVF Truth Kernel, per the T2 contract
 * chain section 5. A receipt is issued for every decision outcome, not
 * only ACCEPT_EVIDENCE_CANDIDATE (the All-outcomes recording rule).
 */
export type ReceiptDecisionToken =
  | "ACCEPT_EVIDENCE_CANDIDATE"
  | "REJECT"
  | "ESCALATE"
  | "REQUIRE_ADDITIONAL_EVIDENCE";

export type ReceiptStatus = "ISSUED" | "SUPERSEDED" | "REVOKED";

export interface TruthReceipt {
  receipt_id: string;
  evaluated_content_hash: string;
  decision_id: string;
  decision: ReceiptDecisionToken;
  evidence_refs: string[];
  obligation_refs: string[];
  verification_result_refs: string[];
  policy_version: string;
  rule_version: string;
  decided_at_utc: string;
  issued_at_utc: string;
  predecessor_receipt_hash: string | null;
  receipt_hash: string;
  status: ReceiptStatus;
}
