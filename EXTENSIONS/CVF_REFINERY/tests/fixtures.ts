import { createHash } from "node:crypto";
import type { SourceEnvelope } from "../src/types/source-envelope.js";
import type { RuleManifestRef } from "../src/types/refinery-packet.js";
import { DeterministicClock, SequentialIdFactory } from "../src/deps.js";

export function contentHashFor(records: Array<Record<string, unknown>>): string {
  const sorted = records.map((record) => {
    const keys = Object.keys(record).sort();
    return keys.map((key) => [key, record[key]]);
  });
  return `sha256:${createHash("sha256").update(JSON.stringify(sorted)).digest("hex")}`;
}

export function makeEnvelope(overrides: Partial<SourceEnvelope> = {}): SourceEnvelope {
  return {
    source_id: overrides.source_id ?? "SRC-001",
    source_type: overrides.source_type ?? "INTERNAL",
    owner: overrides.owner ?? "owner-team",
    captured_at_utc: overrides.captured_at_utc ?? "2026-07-12T00:00:00Z",
    scope: overrides.scope ?? { organization: "cvf" },
    purpose: overrides.purpose ?? ["evaluation"],
    confidentiality: overrides.confidentiality ?? "INTERNAL",
    content_hash: overrides.content_hash ?? "sha256:placeholder",
    raw_reference: overrides.raw_reference ?? { type: "file", location: "file://sample.json" },
    status: overrides.status ?? "CAPTURED",
    declared_version: overrides.declared_version ?? null,
    valid_from_utc: overrides.valid_from_utc ?? null,
    valid_until_utc: overrides.valid_until_utc ?? null,
    metadata: overrides.metadata,
  };
}

export function makeRuleManifest(overrides: Partial<RuleManifestRef> = {}): RuleManifestRef {
  return { manifest_id: overrides.manifest_id ?? "manifest-1", version: overrides.version ?? "v1" };
}

export function makeDeps(startUtcIso = "2026-07-12T00:00:00Z") {
  return {
    clock: new DeterministicClock(startUtcIso, 1000),
    ids: new SequentialIdFactory(),
  };
}
