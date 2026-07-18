/**
 * Deterministic information-dose validation (T2 DistributionPackage
 * `dose`/`expiry_utc` field minimums; T5 Required Invariant 6). Dose is a
 * scoped, TTL-bound content-quantity label; this module performs no trust
 * evaluation and holds no Kernel authority.
 */
export type DoseRejectionReason = "EMPTY_DOSE" | "INVALID_EXPIRY_UTC" | "EXPIRY_NOT_FUTURE";
export interface DoseValidationResult {
    valid: boolean;
    reasons: DoseRejectionReason[];
}
export declare function validateDose(dose: string, expiryUtc: string, actionTimeUtcIso: string): DoseValidationResult;
