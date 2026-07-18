import { createHash } from "node:crypto";
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
export const RECEIPT_HASH_PROFILE = "cvf.sotThreeLayer.receiptHash.v1";
export const RECEIPT_HASH_DIGEST_ALGORITHM = "sha256";
/**
 * RFC 8785 (JCS) minimal-escaping string serialization: control
 * characters U+0000-U+001F escaped as \\uXXXX (lowercase hex),
 * double-quote and backslash escaped, all other characters (including
 * non-ASCII) emitted as literal UTF-8 bytes with no \\u escaping and no
 * Unicode pre-normalization.
 */
function jcsString(value) {
    let out = '"';
    for (const ch of value) {
        const code = ch.codePointAt(0);
        if (ch === '"') {
            out += '\\"';
        }
        else if (ch === "\\") {
            out += "\\\\";
        }
        else if (code <= 0x1f) {
            out += `\\u${code.toString(16).padStart(4, "0")}`;
        }
        else {
            out += ch;
        }
    }
    return out + '"';
}
function jcsStringArraySorted(values) {
    const sorted = [...values].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    return `[${sorted.map(jcsString).join(",")}]`;
}
function jcsNullableString(value) {
    return value === null ? "null" : jcsString(value);
}
/**
 * Builds the exact canonical preimage byte sequence: fixed named fields
 * in fixed order, receipt_hash_profile and digest_algorithm bound in,
 * receipt_hash itself excluded, [] for empty collections, null for
 * absent scalars, no insignificant whitespace.
 */
export function buildReceiptHashPreimage(fields) {
    const parts = [];
    parts.push(`"receipt_hash_profile":${jcsString(RECEIPT_HASH_PROFILE)}`);
    parts.push(`"digest_algorithm":${jcsString(RECEIPT_HASH_DIGEST_ALGORITHM)}`);
    parts.push(`"receipt_id":${jcsString(fields.receipt_id)}`);
    parts.push(`"decision_id":${jcsString(fields.decision_id)}`);
    parts.push(`"decision":${jcsString(fields.decision)}`);
    parts.push(`"evaluated_content_hash":${jcsString(fields.evaluated_content_hash)}`);
    parts.push(`"evidence_refs":${jcsStringArraySorted(fields.evidence_refs)}`);
    parts.push(`"obligation_refs":${jcsStringArraySorted(fields.obligation_refs)}`);
    parts.push(`"verification_result_refs":${jcsStringArraySorted(fields.verification_result_refs)}`);
    parts.push(`"policy_version":${jcsString(fields.policy_version)}`);
    parts.push(`"rule_version":${jcsString(fields.rule_version)}`);
    parts.push(`"decided_at_utc":${jcsString(fields.decided_at_utc)}`);
    parts.push(`"issued_at_utc":${jcsString(fields.issued_at_utc)}`);
    parts.push(`"predecessor_receipt_hash":${jcsNullableString(fields.predecessor_receipt_hash)}`);
    return `{${parts.join(",")}}`;
}
export function computeReceiptHash(fields) {
    const preimage = buildReceiptHashPreimage(fields);
    return createHash("sha256").update(preimage, "utf8").digest("hex");
}
