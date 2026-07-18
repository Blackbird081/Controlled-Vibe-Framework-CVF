import type { KernelStores } from "../stores/kernel-stores.js";
import type { KernelDecision } from "../types/kernel-decision.js";
import type { KernelEvaluationRequest } from "../types/kernel-evaluation-request.js";
import type { TruthReceipt } from "../types/truth-receipt.js";
import type { StageDeps } from "./deps-context.js";
import { computeReceiptHash } from "../receipt/receipt-hash.js";

export type ReceiptIssuanceRejectionReason = "DUPLICATE_RECEIPT_IDENTITY";

export interface ReceiptIssuanceResult {
  issued: boolean;
  receipt?: TruthReceipt;
  reasons: ReceiptIssuanceRejectionReason[];
}

/**
 * A receipt is issued for every decision outcome (the All-outcomes
 * recording rule), not only ACCEPT_EVIDENCE_CANDIDATE. Required
 * Invariant 8: replay (an already-ISSUED receipt_id reused for the same
 * decision_id) is rejected; supersession requires a new receipt_id with
 * predecessor_receipt_hash set instead. evidence_refs/obligation_refs are
 * copied from the originating request per the T2 contract chain's
 * TruthReceipt field-source note (not derived from the decision, which
 * does not define evidence_refs/obligation_refs).
 */
export function issueReceipt(
  decision: KernelDecision,
  request: KernelEvaluationRequest,
  stores: KernelStores,
  deps: StageDeps,
  predecessorReceiptHash: string | null = null,
): ReceiptIssuanceResult {
  const existingForDecision = stores.receipts
    .all()
    .find((receipt) => receipt.decision_id === decision.decision_id);
  if (existingForDecision) {
    return { issued: false, reasons: ["DUPLICATE_RECEIPT_IDENTITY"] };
  }

  const receiptId = deps.ids.nextId("RCPT");
  const issuedAtUtc = deps.clock.nowUtcIso();

  const receiptHash = computeReceiptHash({
    receipt_id: receiptId,
    decision_id: decision.decision_id,
    decision: decision.decision,
    evaluated_content_hash: decision.packet_hash,
    evidence_refs: request.evidence_refs,
    obligation_refs: request.obligation_refs,
    verification_result_refs: decision.verification_result_refs,
    policy_version: decision.policy_version,
    rule_version: decision.rule_version,
    decided_at_utc: decision.decided_at_utc,
    issued_at_utc: issuedAtUtc,
    predecessor_receipt_hash: predecessorReceiptHash,
  });

  const receipt: TruthReceipt = {
    receipt_id: receiptId,
    evaluated_content_hash: decision.packet_hash,
    decision_id: decision.decision_id,
    decision: decision.decision,
    evidence_refs: [...request.evidence_refs],
    obligation_refs: [...request.obligation_refs],
    verification_result_refs: decision.verification_result_refs,
    policy_version: decision.policy_version,
    rule_version: decision.rule_version,
    decided_at_utc: decision.decided_at_utc,
    issued_at_utc: issuedAtUtc,
    predecessor_receipt_hash: predecessorReceiptHash,
    receipt_hash: receiptHash,
    status: "ISSUED",
  };

  stores.receipts.insert(receipt.receipt_id, receipt);
  return { issued: true, receipt, reasons: [] };
}
