/**
 * Adapted from TKG-T1's Verification Result Minimum. Kernel is the sole
 * producer: verification results are never caller-supplied (T2
 * KernelEvaluationRequest Verification-result ownership and transport
 * model; Invariant 10 in the T4 baseline).
 */
export type VerificationStatus = "PASS" | "WARN" | "FAIL" | "BLOCKED";

export interface VerificationResult {
  verification_result_id: string;
  method: string;
  status: VerificationStatus;
  checked_at_utc: string;
}
