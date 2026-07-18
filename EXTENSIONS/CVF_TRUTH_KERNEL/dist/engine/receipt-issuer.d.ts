import type { KernelStores } from "../stores/kernel-stores.js";
import type { KernelDecision } from "../types/kernel-decision.js";
import type { KernelEvaluationRequest } from "../types/kernel-evaluation-request.js";
import type { TruthReceipt } from "../types/truth-receipt.js";
import type { StageDeps } from "./deps-context.js";
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
export declare function issueReceipt(decision: KernelDecision, request: KernelEvaluationRequest, stores: KernelStores, deps: StageDeps, predecessorReceiptHash?: string | null): ReceiptIssuanceResult;
