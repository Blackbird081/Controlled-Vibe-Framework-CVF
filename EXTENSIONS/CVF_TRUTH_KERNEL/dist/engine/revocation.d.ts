import type { KernelStores } from "../stores/kernel-stores.js";
import type { TruthReceipt } from "../types/truth-receipt.js";
import type { TruthReference } from "../types/truth-reference.js";
export type RevocationRejectionReason = "RECEIPT_NOT_FOUND" | "RECEIPT_NOT_ISSUED";
export interface RevocationResult {
    revoked: boolean;
    reasons: RevocationRejectionReason[];
}
export type ReferenceRevocationRejectionReason = "REFERENCE_NOT_FOUND" | "REFERENCE_ALREADY_REVOKED";
export interface ReferenceRevocationResult {
    revoked: boolean;
    reasons: ReferenceRevocationRejectionReason[];
}
/**
 * Revokes an ISSUED receipt. The ImmutableStore is append-only and
 * forbids overwriting an existing key, so revocation is recorded as a
 * new entry in stores.revocations keyed by receipt_id rather than
 * mutating the original receipt snapshot. currentReceiptStatus()
 * consults this store to compute effective status.
 */
export declare function revokeReceipt(receiptId: string, stores: KernelStores): RevocationResult;
export declare function isReceiptRevoked(receiptId: string, stores: KernelStores): boolean;
export declare function currentReceiptStatus(receipt: TruthReceipt, stores: KernelStores): TruthReceipt["status"];
/**
 * Revokes a `TruthReference` directly, independent of its bound receipt's
 * own revocation status (T4R1 Required Invariant 2). Recorded as a new
 * append-only entry in stores.referenceRevocations keyed by reference_id.
 */
export declare function revokeReference(referenceId: string, stores: KernelStores): ReferenceRevocationResult;
export declare function isReferenceDirectlyRevoked(referenceId: string, stores: KernelStores): boolean;
/**
 * A `TruthReference` reads REVOKED if it was revoked directly or if its
 * bound receipt was revoked (T4R1 Required Invariant 2). Either cause is
 * authoritative; there is no precedence between the two revocation paths
 * because both resolve to the same REVOKED outcome.
 */
export declare function isReferenceEffectivelyRevoked(reference: TruthReference, receipt: TruthReceipt, stores: KernelStores): boolean;
