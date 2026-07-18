import type { KernelStores } from "../stores/kernel-stores.js";
import type { KernelEvaluationRequest } from "../types/kernel-evaluation-request.js";
import type { KernelDecisionToken } from "../types/kernel-decision.js";
import type { VerificationResult } from "../types/verification-result.js";
import type { StageDeps } from "./deps-context.js";
import type { AdmissionResult } from "./admission.js";
/**
 * Kernel is the sole producer of verification results (T2
 * KernelEvaluationRequest Verification-result ownership and transport
 * model). Caller-supplied results are never read; this deterministic
 * method produces one result per bound evidence item (provenance-label
 * check) and one per bound obligation (status check). No caller-supplied
 * approval/result/authority boolean can substitute for this evaluation
 * (Required Invariant 10).
 */
export declare function produceVerificationResults(request: KernelEvaluationRequest, stores: KernelStores, deps: StageDeps): VerificationResult[];
export interface DecisionComputation {
    decision: KernelDecisionToken;
    reasons: string[];
    failedObligations: string[];
}
/**
 * Required Invariant 2: empty evidence or empty Kernel-produced
 * verification results never accepts. A blocking FAIL/BLOCKED
 * verification result or a failed hard obligation rejects.
 */
export declare function computeDecision(request: KernelEvaluationRequest, admission: AdmissionResult, verificationResults: VerificationResult[], stores: KernelStores): DecisionComputation;
