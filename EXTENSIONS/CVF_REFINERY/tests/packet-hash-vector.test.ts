import { describe, it, expect } from "vitest";
import {
  buildRefineryPacketHashPreimage,
  computeRefineryPacketHash,
  REFINERY_PACKET_HASH_PROFILE,
  REFINERY_PACKET_HASH_DIGEST_ALGORITHM,
  UnsupportedPacketHashValueError,
} from "../src/packet-hash/packet-hash.js";
import type { RefineryPacket } from "../src/types/refinery-packet.js";
import type { RefineryPacketHashProjection } from "../src/packet-hash/packet-hash.js";

const PUBLISHED_PACKET: RefineryPacket = {
  refinery_packet_id: "RP-000001",
  source_envelopes: [
    {
      source_id: "SRC-000001",
      source_type: "INTERNAL",
      owner: "owner-internal",
      captured_at_utc: "2026-07-13T00:00:00Z",
      scope: { organization: "cvf" },
      purpose: ["sot3-t8-vector"],
      confidentiality: "INTERNAL",
      content_hash: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      raw_reference: { type: "object", location: "memory:sot3-t8" },
      status: "CAPTURED",
    },
  ],
  normalized_records: [
    {
      record_id: "NR-000001",
      source_id: "SRC-000001",
      source_record_id: null,
      canonical_fields: { title: "vector record" },
      original_fields: { title: "vector record" },
      normalization_steps: [],
      warnings: [],
    },
  ],
  duplicate_groups: [],
  conflict_sets: [],
  quality_findings: [],
  integrity_results: [
    {
      source_id: "SRC-000001",
      status: "PASS",
      expected_hash: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      actual_hash: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      failure_token: null,
    },
  ],
  transformation_lineage: [],
  declared_scope: { organization: "cvf" },
  declared_owner: "owner-internal",
  rule_manifest: { manifest_id: "RM-SOT3-T8", version: "v1" },
  status: "READY_FOR_KERNEL",
  failure_tokens: [],
  created_at_utc: "2026-07-13T00:00:05Z",
};

function projectionOf(packet: RefineryPacket): RefineryPacketHashProjection {
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

const PUBLISHED_PREIMAGE =
  '{"conflict_sets":[],"created_at_utc":"2026-07-13T00:00:05Z","declared_owner":"owner-internal","declared_scope":{"organization":"cvf"},"digest_algorithm":"sha256","duplicate_groups":[],"failure_tokens":[],"integrity_results":[{"actual_hash":"sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","expected_hash":"sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","failure_token":null,"source_id":"SRC-000001","status":"PASS"}],"normalized_records":[{"canonical_fields":{"title":"vector record"},"normalization_steps":[],"original_fields":{"title":"vector record"},"record_id":"NR-000001","source_id":"SRC-000001","source_record_id":null,"warnings":[]}],"quality_findings":[],"refinery_packet_hash_profile":"cvf.sotThreeLayer.refineryPacketHash.v1","refinery_packet_id":"RP-000001","rule_manifest":{"manifest_id":"RM-SOT3-T8","version":"v1"},"source_envelopes":[{"captured_at_utc":"2026-07-13T00:00:00Z","confidentiality":"INTERNAL","content_hash":"sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","owner":"owner-internal","purpose":["sot3-t8-vector"],"raw_reference":{"location":"memory:sot3-t8","type":"object"},"scope":{"organization":"cvf"},"source_id":"SRC-000001","source_type":"INTERNAL","status":"CAPTURED"}],"status":"READY_FOR_KERNEL","transformation_lineage":[]}';

const PUBLISHED_DIGEST = "sha256:3854d51f58485b3672032dfdc478cfb2ad41402f2a6255aff36932bf19888ee9";

describe("canonical Refinery packet-binding hash profile (cvf.sotThreeLayer.refineryPacketHash.v1)", () => {
  it("reproduces the published 1337-byte preimage byte-for-byte", () => {
    const preimage = buildRefineryPacketHashPreimage(projectionOf(PUBLISHED_PACKET));
    expect(preimage).toBe(PUBLISHED_PREIMAGE);
    expect(Buffer.byteLength(preimage, "utf8")).toBe(1337);
  });

  it("reproduces the published SHA-256 digest with the sha256: prefix", () => {
    expect(computeRefineryPacketHash(PUBLISHED_PACKET)).toBe(PUBLISHED_DIGEST);
  });

  it("binds the profile identifier and digest algorithm literally", () => {
    expect(REFINERY_PACKET_HASH_PROFILE).toBe("cvf.sotThreeLayer.refineryPacketHash.v1");
    expect(REFINERY_PACKET_HASH_DIGEST_ALGORITHM).toBe("sha256");
  });

  it("same packet and profile repeated produces an identical digest", () => {
    const first = computeRefineryPacketHash(PUBLISHED_PACKET);
    const second = computeRefineryPacketHash(structuredClone(PUBLISHED_PACKET));
    expect(first).toBe(second);
    expect(first).toBe(PUBLISHED_DIGEST);
  });

  it("object insertion order changes without semantic change leave the digest unchanged", () => {
    const reordered: RefineryPacket = {
      ...PUBLISHED_PACKET,
      declared_scope: { organization: "cvf" },
      rule_manifest: { version: "v1", manifest_id: "RM-SOT3-T8" },
    };
    expect(computeRefineryPacketHash(reordered)).toBe(PUBLISHED_DIGEST);
  });

  it("a changed top-level scalar field changes the digest", () => {
    const mutated: RefineryPacket = { ...PUBLISHED_PACKET, status: "BLOCKED" };
    expect(computeRefineryPacketHash(mutated)).not.toBe(PUBLISHED_DIGEST);
  });

  it("a changed nested field inside an array element changes the digest", () => {
    const mutated: RefineryPacket = {
      ...PUBLISHED_PACKET,
      source_envelopes: [{ ...PUBLISHED_PACKET.source_envelopes[0], owner: "owner-mutated" }],
    };
    expect(computeRefineryPacketHash(mutated)).not.toBe(PUBLISHED_DIGEST);
  });

  it("array element reordering (semantic order change) changes the digest", () => {
    const secondEnvelope = {
      ...PUBLISHED_PACKET.source_envelopes[0],
      source_id: "SRC-000002",
    };
    const forward: RefineryPacket = {
      ...PUBLISHED_PACKET,
      source_envelopes: [PUBLISHED_PACKET.source_envelopes[0], secondEnvelope],
    };
    const reversed: RefineryPacket = {
      ...PUBLISHED_PACKET,
      source_envelopes: [secondEnvelope, PUBLISHED_PACKET.source_envelopes[0]],
    };
    expect(computeRefineryPacketHash(forward)).not.toBe(computeRefineryPacketHash(reversed));
  });

  it("rejects an unsupported value (function) rather than silently dropping it", () => {
    const projection = projectionOf(PUBLISHED_PACKET);
    const withFunction = {
      ...projection,
      rule_manifest: { ...(projection.rule_manifest as Record<string, unknown>), bad: () => 1 },
    };
    expect(() => buildRefineryPacketHashPreimage(withFunction)).toThrow(UnsupportedPacketHashValueError);
  });

  it("rejects an unsupported value (undefined) rather than silently dropping it", () => {
    const projection = projectionOf(PUBLISHED_PACKET);
    const withUndefined = {
      ...projection,
      declared_owner: undefined as unknown as string,
    };
    expect(() => buildRefineryPacketHashPreimage(withUndefined)).toThrow(UnsupportedPacketHashValueError);
  });

  it("rejects a non-finite number (NaN/Infinity) rather than silently coercing it", () => {
    const projection = projectionOf(PUBLISHED_PACKET);
    const withNaN = {
      ...projection,
      normalized_records: [{ ...(projection.normalized_records[0] as Record<string, unknown>), bad: Number.NaN }],
    };
    expect(() => buildRefineryPacketHashPreimage(withNaN)).toThrow(UnsupportedPacketHashValueError);
  });
});
