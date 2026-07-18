import type { RefineryPacket } from "../types/refinery-packet.js";
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
export declare const REFINERY_PACKET_HASH_PROFILE = "cvf.sotThreeLayer.refineryPacketHash.v1";
export declare const REFINERY_PACKET_HASH_DIGEST_ALGORITHM = "sha256";
/**
 * The explicit, named, stable projection of RefineryPacket included in the
 * canonical preimage. All fourteen RefineryPacket fields are included;
 * none are derived, computed, or omitted for convenience. Field order here
 * is documentation order only - the actual preimage sorts object keys
 * lexicographically at every level (see canonicalizeForHash below).
 */
export interface RefineryPacketHashProjection {
    refinery_packet_id: string;
    source_envelopes: unknown[];
    normalized_records: unknown[];
    duplicate_groups: unknown[];
    conflict_sets: unknown[];
    quality_findings: unknown[];
    integrity_results: unknown[];
    transformation_lineage: unknown[];
    declared_scope: unknown;
    declared_owner: string;
    rule_manifest: unknown;
    status: string;
    failure_tokens: string[];
    created_at_utc: string;
}
export declare class UnsupportedPacketHashValueError extends Error {
    constructor(path: string, reason: string);
}
/**
 * Builds the exact canonical preimage: profile and digest algorithm bound
 * in first, then the fourteen named RefineryPacket fields in fixed key
 * order (object-key sort makes the actual field order deterministic
 * regardless of the order written here).
 */
export declare function buildRefineryPacketHashPreimage(projection: RefineryPacketHashProjection): string;
/**
 * The canonical Refinery-owned packet-binding hash. Returns
 * sha256:<lowercase-hex>, matching the format already used by Refinery's
 * own integrity-stage content hash and by Kernel's RefineryPacketRef and
 * EvaluateInput fields this value is compared against.
 */
export declare function computeRefineryPacketHash(packet: RefineryPacket): string;
