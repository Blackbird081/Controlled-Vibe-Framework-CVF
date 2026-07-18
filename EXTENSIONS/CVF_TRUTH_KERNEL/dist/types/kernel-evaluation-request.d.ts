/**
 * Sole-producer contract owned by the Kernel adapter at the
 * Refinery-to-Kernel submission boundary, per
 * docs/reference/sot_three_layer/CVF_SOT_THREE_LAYER_CONTRACT_CHAIN.md
 * section 3. Never carries a verification_results field: Kernel produces
 * verification results itself during evaluation of this request.
 */
export type RequestStatus = "SUBMITTED" | "WITHDRAWN";
export interface KernelEvaluationRequest {
    request_id: string;
    packet_hash: string;
    packet_reference: string;
    policy_version: string;
    rule_version: string;
    evidence_refs: string[];
    obligation_refs: string[];
    verification_mode: string;
    requested_decision_context: string;
    submitted_at_utc: string;
    status: RequestStatus;
}
