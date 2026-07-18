import { createHash } from "node:crypto";
/**
 * Implements the cvf.sotThreeLayer.refineryPacketHash.v1 canonical
 * packet-binding profile. Refinery is the sole producer of RefineryPacket
 * (docs/reference/sot_three_layer/CVF_SOT_THREE_LAYER_CONTRACT_CHAIN.md,
 * section 2), so Refinery owns the binding identity Kernel compares at
 * admission (RefineryPacketRef.content_hash / EvaluateInput.packetHash).
 * This module hashes an explicit, named field projection of RefineryPacket,
 * not an arbitrary enumerable-property walk; unsupported/non-serializable
 * values fail closed with a thrown error rather than being silently
 * dropped or coerced, mirroring the sibling
 * cvf.sotThreeLayer.receiptHash.v1 profile's fail-closed canonicalization
 * discipline in EXTENSIONS/CVF_TRUTH_KERNEL/src/receipt/receipt-hash.ts.
 */
export const REFINERY_PACKET_HASH_PROFILE = "cvf.sotThreeLayer.refineryPacketHash.v1";
export const REFINERY_PACKET_HASH_DIGEST_ALGORITHM = "sha256";
export class UnsupportedPacketHashValueError extends Error {
    constructor(path, reason) {
        super(`REFINERY_PACKET_HASH_UNSUPPORTED_VALUE at ${path}: ${reason}`);
        this.name = "UnsupportedPacketHashValueError";
    }
}
/**
 * RFC 8785 (JCS)-style minimal-escaping string serialization, reused
 * verbatim from the receipt-hash profile's convention: control characters
 * U+0000-U+001F escaped as \\uXXXX (lowercase hex), double-quote and
 * backslash escaped, all other characters (including non-ASCII) emitted
 * as literal UTF-8 bytes with no \\u escaping and no Unicode
 * pre-normalization.
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
function jcsNumber(value, path) {
    if (!Number.isFinite(value)) {
        throw new UnsupportedPacketHashValueError(path, "non-finite number (NaN or Infinity) is not serializable");
    }
    return String(value);
}
/**
 * Recursively canonicalizes a value into a JSON string: object keys are
 * sorted lexicographically at every nesting level (construction-order
 * independence for objects); array element order is preserved exactly,
 * since RefineryPacket arrays (source_envelopes, normalized_records,
 * duplicate_groups, conflict_sets, quality_findings, integrity_results,
 * transformation_lineage) are semantically ordered record/event lists, not
 * unordered reference sets. Rejects undefined, function, symbol, bigint,
 * and non-finite number rather than silently dropping or coercing them.
 */
function canonicalizeToJson(value, path) {
    if (value === null)
        return "null";
    if (typeof value === "string")
        return jcsString(value);
    if (typeof value === "number")
        return jcsNumber(value, path);
    if (typeof value === "boolean")
        return value ? "true" : "false";
    if (typeof value === "undefined") {
        throw new UnsupportedPacketHashValueError(path, "undefined is not serializable");
    }
    if (typeof value === "function") {
        throw new UnsupportedPacketHashValueError(path, "function is not serializable");
    }
    if (typeof value === "symbol") {
        throw new UnsupportedPacketHashValueError(path, "symbol is not serializable");
    }
    if (typeof value === "bigint") {
        throw new UnsupportedPacketHashValueError(path, "bigint is not serializable");
    }
    if (Array.isArray(value)) {
        const items = value.map((item, index) => canonicalizeToJson(item, `${path}[${index}]`));
        return `[${items.join(",")}]`;
    }
    if (typeof value === "object") {
        const record = value;
        const sortedKeys = Object.keys(record).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
        const parts = sortedKeys.map((key) => `${jcsString(key)}:${canonicalizeToJson(record[key], `${path}.${key}`)}`);
        return `{${parts.join(",")}}`;
    }
    throw new UnsupportedPacketHashValueError(path, `unsupported value type ${typeof value}`);
}
/**
 * Builds the exact canonical preimage: profile and digest algorithm bound
 * in first, then the fourteen named RefineryPacket fields in fixed key
 * order (object-key sort makes the actual field order deterministic
 * regardless of the order written here).
 */
export function buildRefineryPacketHashPreimage(projection) {
    return canonicalizeToJson({
        refinery_packet_hash_profile: REFINERY_PACKET_HASH_PROFILE,
        digest_algorithm: REFINERY_PACKET_HASH_DIGEST_ALGORITHM,
        refinery_packet_id: projection.refinery_packet_id,
        source_envelopes: projection.source_envelopes,
        normalized_records: projection.normalized_records,
        duplicate_groups: projection.duplicate_groups,
        conflict_sets: projection.conflict_sets,
        quality_findings: projection.quality_findings,
        integrity_results: projection.integrity_results,
        transformation_lineage: projection.transformation_lineage,
        declared_scope: projection.declared_scope,
        declared_owner: projection.declared_owner,
        rule_manifest: projection.rule_manifest,
        status: projection.status,
        failure_tokens: projection.failure_tokens,
        created_at_utc: projection.created_at_utc,
    }, "$");
}
function toProjection(packet) {
    return {
        refinery_packet_id: packet.refinery_packet_id,
        source_envelopes: packet.source_envelopes,
        normalized_records: packet.normalized_records,
        duplicate_groups: packet.duplicate_groups,
        conflict_sets: packet.conflict_sets,
        quality_findings: packet.quality_findings,
        integrity_results: packet.integrity_results,
        transformation_lineage: packet.transformation_lineage,
        declared_scope: packet.declared_scope,
        declared_owner: packet.declared_owner,
        rule_manifest: packet.rule_manifest,
        status: packet.status,
        failure_tokens: packet.failure_tokens,
        created_at_utc: packet.created_at_utc,
    };
}
/**
 * The canonical Refinery-owned packet-binding hash. Returns
 * sha256:<lowercase-hex>, matching the format already used by Refinery's
 * own integrity-stage content hash and by Kernel's RefineryPacketRef and
 * EvaluateInput fields this value is compared against.
 */
export function computeRefineryPacketHash(packet) {
    const preimage = buildRefineryPacketHashPreimage(toProjection(packet));
    return `sha256:${createHash("sha256").update(preimage, "utf8").digest("hex")}`;
}
