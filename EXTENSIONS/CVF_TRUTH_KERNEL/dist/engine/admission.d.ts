import type { KernelStores } from "../stores/kernel-stores.js";
import type { KernelEvaluationRequest } from "../types/kernel-evaluation-request.js";
export type AdmissionRejectionReason = "PACKET_NOT_FOUND" | "PACKET_HASH_MISMATCH" | "PACKET_NOT_READY_FOR_KERNEL" | "EVIDENCE_REFS_EMPTY" | "EVIDENCE_NOT_FOUND" | "EVIDENCE_CROSS_PACKET" | "OBLIGATION_NOT_FOUND" | "OBLIGATION_CROSS_PACKET" | "STALE_POLICY_VERSION" | "STALE_RULE_VERSION";
export interface AdmissionResult {
    admitted: boolean;
    reasons: AdmissionRejectionReason[];
}
/**
 * Enforces Required Invariants 1, 2, and 3: the request must bind a
 * hash-matching READY_FOR_KERNEL packet, evidence/obligations must
 * resolve to that same packet's lineage (T2 Negative Case NC-06), and
 * the request's policy/rule version must equal what Kernel currently
 * authorizes. This runs before any decision is produced; a rejected
 * admission never reaches evaluation.
 */
export declare function admitRequest(request: KernelEvaluationRequest, stores: KernelStores, authorizedPolicyVersion: string, authorizedRuleVersion: string): AdmissionResult;
