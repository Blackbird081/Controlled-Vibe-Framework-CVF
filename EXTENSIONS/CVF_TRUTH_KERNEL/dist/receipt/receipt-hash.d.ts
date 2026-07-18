/**
 * Implements the cvf.sotThreeLayer.receiptHash.v1 canonical preimage
 * profile defined in
 * docs/reference/sot_three_layer/CVF_SOT_THREE_LAYER_CONTRACT_CHAIN.md,
 * TruthReceipt section, Receipt Hash Canonical Preimage Profile
 * subsection. This module must reproduce the published 522-byte
 * illustrative preimage and its SHA-256 digest
 * (bc32424380bd483ca208edd8ee18bcaaa874b109584341e8febc01b5e46ab5a3)
 * exactly; see tests/receipt-hash-vector.test.ts.
 */
export declare const RECEIPT_HASH_PROFILE = "cvf.sotThreeLayer.receiptHash.v1";
export declare const RECEIPT_HASH_DIGEST_ALGORITHM = "sha256";
export interface ReceiptHashPreimageFields {
    receipt_id: string;
    decision_id: string;
    decision: string;
    evaluated_content_hash: string;
    evidence_refs: string[];
    obligation_refs: string[];
    verification_result_refs: string[];
    policy_version: string;
    rule_version: string;
    decided_at_utc: string;
    issued_at_utc: string;
    predecessor_receipt_hash: string | null;
}
/**
 * Builds the exact canonical preimage byte sequence: fixed named fields
 * in fixed order, receipt_hash_profile and digest_algorithm bound in,
 * receipt_hash itself excluded, [] for empty collections, null for
 * absent scalars, no insignificant whitespace.
 */
export declare function buildReceiptHashPreimage(fields: ReceiptHashPreimageFields): string;
export declare function computeReceiptHash(fields: ReceiptHashPreimageFields): string;
