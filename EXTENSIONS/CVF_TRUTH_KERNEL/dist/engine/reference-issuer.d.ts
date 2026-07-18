import type { KernelStores } from "../stores/kernel-stores.js";
import type { TruthReference } from "../types/truth-reference.js";
import type { StageDeps } from "./deps-context.js";
export type ReferenceRejectionReason = "RECEIPT_NOT_FOUND" | "RECEIPT_REVOKED" | "RECEIPT_HASH_INVALID" | "DECISION_NOT_FOUND" | "REQUEST_NOT_FOUND" | "DECISION_MISMATCH" | "VERIFICATION_RESULT_REFS_MISMATCH" | "EVIDENCE_REFS_MISMATCH" | "OBLIGATION_REFS_MISMATCH" | "CONTENT_HASH_MISMATCH" | "POLICY_VERSION_MISMATCH" | "RULE_VERSION_MISMATCH" | "NOT_ACCEPTANCE_DECISION" | "FAILED_OBLIGATIONS_NON_EMPTY" | "BLOCKING_VERIFICATION_RESULT" | "VERIFICATION_RESULT_NOT_FOUND" | "INVALID_VALIDITY_INTERVAL";
export interface ReferenceIssuanceResult {
    issued: boolean;
    reference?: TruthReference;
    reasons: ReferenceRejectionReason[];
}
/**
 * Implements the T2 contract chain's Decision-Resolution Model and
 * Eligible-Acceptance-Only Issuance Rule (TruthReference section) and
 * Invariant 6 in the invariants file: resolves receipt -> decision ->
 * request, verifies every binding/content/version equality, confirms
 * failed_obligations is empty and no blocking verification result
 * exists, and only then mints a TruthReference. Every missing record,
 * broken link, or mismatch fails closed (Negative Cases NC-04A, NC-04B).
 */
export declare function issueReference(receiptId: string, scope: string, version: string, validFromUtc: string, validUntilUtc: string, stores: KernelStores, deps: StageDeps): ReferenceIssuanceResult;
export type ReferenceStateResolutionReason = "REFERENCE_NOT_FOUND" | "BOUND_RECEIPT_NOT_FOUND" | "INVALID_READ_TIME";
export interface ReferenceStateResolutionResult {
    resolved: boolean;
    state?: TruthReference["reference_state"];
    reasons: ReferenceStateResolutionReason[];
}
export type SupersessionRejectionReason = "SUPERSEDED_REFERENCE_NOT_FOUND" | "SUPERSEDING_REFERENCE_NOT_FOUND" | "SUPERSESSION_SELF_LINK" | "SUPERSESSION_CROSS_SCOPE" | "SUPERSESSION_NOT_LATER" | "SUPERSESSION_ALREADY_RECORDED";
export interface SupersessionResult {
    superseded: boolean;
    reasons: SupersessionRejectionReason[];
}
/**
 * Resolves reference_state at read time per the T2 precedence rule:
 * REVOKED > SUPERSEDED > EXPIRED > ACTIVE (T4R1 Required Invariant 4).
 * Resolves the caller's reference_id to the immutable stored reference and
 * its bound receipt first (T4R1 Required Invariant 1); no caller-supplied
 * reference object, isRevoked, or isSuperseded parameter exists. Every
 * missing record or invalid read-time timestamp fails closed with a typed
 * reason instead of a default ACTIVE (T4R1 Required Invariant 7). Expiry is
 * derived from valid_until_utc, never a separately stored flag (T4R1
 * Required Invariant 5).
 */
export declare function computeCurrentReferenceState(referenceId: string, stores: KernelStores, nowUtcIso: string): ReferenceStateResolutionResult;
/**
 * Records that `newReferenceId` supersedes `oldReferenceId` (T4R1 Required
 * Invariant 3). Both references must already exist and be distinct, share
 * the same scope, and the superseding reference's valid_from_utc must be
 * strictly later than the superseded reference's valid_from_utc. Each
 * superseded reference may be recorded at most once, matching the
 * ImmutableStore's insert-rejects-overwrite contract.
 */
export declare function supersedeReference(oldReferenceId: string, newReferenceId: string, stores: KernelStores): SupersessionResult;
