/**
 * Revokes an ISSUED receipt. The ImmutableStore is append-only and
 * forbids overwriting an existing key, so revocation is recorded as a
 * new entry in stores.revocations keyed by receipt_id rather than
 * mutating the original receipt snapshot. currentReceiptStatus()
 * consults this store to compute effective status.
 */
export function revokeReceipt(receiptId, stores) {
    const receipt = stores.receipts.get(receiptId);
    if (!receipt) {
        return { revoked: false, reasons: ["RECEIPT_NOT_FOUND"] };
    }
    if (receipt.status !== "ISSUED") {
        return { revoked: false, reasons: ["RECEIPT_NOT_ISSUED"] };
    }
    stores.revocations.insert(receiptId, { receipt_id: receiptId });
    return { revoked: true, reasons: [] };
}
export function isReceiptRevoked(receiptId, stores) {
    return stores.revocations.has(receiptId);
}
export function currentReceiptStatus(receipt, stores) {
    if (isReceiptRevoked(receipt.receipt_id, stores))
        return "REVOKED";
    return receipt.status;
}
/**
 * Revokes a `TruthReference` directly, independent of its bound receipt's
 * own revocation status (T4R1 Required Invariant 2). Recorded as a new
 * append-only entry in stores.referenceRevocations keyed by reference_id.
 */
export function revokeReference(referenceId, stores) {
    const reference = stores.references.get(referenceId);
    if (!reference) {
        return { revoked: false, reasons: ["REFERENCE_NOT_FOUND"] };
    }
    if (isReferenceDirectlyRevoked(referenceId, stores)) {
        return { revoked: false, reasons: ["REFERENCE_ALREADY_REVOKED"] };
    }
    stores.referenceRevocations.insert(referenceId, { reference_id: referenceId });
    return { revoked: true, reasons: [] };
}
export function isReferenceDirectlyRevoked(referenceId, stores) {
    return stores.referenceRevocations.has(referenceId);
}
/**
 * A `TruthReference` reads REVOKED if it was revoked directly or if its
 * bound receipt was revoked (T4R1 Required Invariant 2). Either cause is
 * authoritative; there is no precedence between the two revocation paths
 * because both resolve to the same REVOKED outcome.
 */
export function isReferenceEffectivelyRevoked(reference, receipt, stores) {
    return (isReferenceDirectlyRevoked(reference.reference_id, stores) ||
        currentReceiptStatus(receipt, stores) === "REVOKED");
}
