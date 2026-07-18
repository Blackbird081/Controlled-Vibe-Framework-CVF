export type SourceType = "INTERNAL" | "PROJECT" | "PARTNER" | "POLICY" | "MARKET" | "PUBLIC" | "OTHER";
export type Confidentiality = "PUBLIC" | "INTERNAL" | "CONFIDENTIAL" | "RESTRICTED";
export type SourceEnvelopeStatus = "CAPTURED" | "REJECTED_AT_INTAKE";
export interface SourceScope {
    organization: string;
    country?: string | null;
    project?: string | null;
    customer?: string | null;
}
export interface RawReference {
    type: "file" | "api" | "object" | "message" | "extracted_record";
    location: string;
}
/**
 * Sole-producer contract owned by the governed intake adapter, per
 * docs/reference/sot_three_layer/CVF_SOT_THREE_LAYER_CONTRACT_CHAIN.md
 * section 1. Refinery is the only allowed consumer; Refinery must never
 * produce a second, competing SourceEnvelope for the same raw material.
 */
export interface SourceEnvelope {
    source_id: string;
    source_type: SourceType;
    owner: string;
    captured_at_utc: string;
    scope: SourceScope;
    purpose: string[];
    confidentiality: Confidentiality;
    content_hash: string;
    raw_reference: RawReference;
    status: SourceEnvelopeStatus;
    declared_version?: string | null;
    valid_from_utc?: string | null;
    valid_until_utc?: string | null;
    metadata?: Record<string, unknown>;
}
