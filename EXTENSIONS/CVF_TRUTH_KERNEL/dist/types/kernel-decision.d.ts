/**
 * Sole-producer contract owned by CVF Truth Kernel, per the T2 contract
 * chain section 4. verification_result_refs identifies the verification
 * results Kernel itself produced while evaluating this request; it is
 * never a restatement of a request-supplied field.
 */
export type KernelDecisionToken = "ACCEPT_EVIDENCE_CANDIDATE" | "REJECT" | "ESCALATE" | "REQUIRE_ADDITIONAL_EVIDENCE";
export interface KernelDecision {
    decision_id: string;
    request_id: string;
    packet_hash: string;
    decision: KernelDecisionToken;
    reasons: string[];
    failed_obligations: string[];
    verification_result_refs: string[];
    policy_version: string;
    rule_version: string;
    decided_at_utc: string;
}
