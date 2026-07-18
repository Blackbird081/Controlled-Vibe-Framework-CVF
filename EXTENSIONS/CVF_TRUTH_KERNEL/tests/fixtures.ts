import { createHash } from "node:crypto";
import { DeterministicClock, SequentialIdFactory, TruthKernel } from "../src/index.js";
import type { RefineryPacketRef } from "../src/types/refinery-packet.js";
import type { EvidenceRecord } from "../src/types/evidence.js";
import type { ObligationRecord } from "../src/types/obligation.js";

export const POLICY_VERSION = "policy-2026-07-12";
export const RULE_VERSION = "rule-2026-07-12";

export function contentHashFor(seed: string): string {
  return `sha256:${createHash("sha256").update(seed).digest("hex")}`;
}

export function makeKernel(startUtcIso = "2026-07-12T00:00:00Z"): TruthKernel {
  return new TruthKernel(
    new DeterministicClock(startUtcIso, 1000),
    new SequentialIdFactory(),
    POLICY_VERSION,
    RULE_VERSION,
  );
}

export function makePacket(overrides: Partial<RefineryPacketRef> = {}): RefineryPacketRef {
  return {
    refinery_packet_id: overrides.refinery_packet_id ?? "RP-000001",
    content_hash: overrides.content_hash ?? contentHashFor("packet-1"),
    declared_scope: overrides.declared_scope ?? { organization: "cvf" },
    status: overrides.status ?? "READY_FOR_KERNEL",
  };
}

export function makeEvidence(overrides: Partial<EvidenceRecord> = {}): EvidenceRecord {
  return {
    evidence_id: overrides.evidence_id ?? "EV-000001",
    bound_packet_id: overrides.bound_packet_id ?? "RP-000001",
    bound_source_id: overrides.bound_source_id ?? "SRC-000001",
    provenance_label: overrides.provenance_label ?? "SOURCE_BACKED",
    captured_at_utc: overrides.captured_at_utc ?? "2026-07-12T00:00:00Z",
    valid_until_utc: overrides.valid_until_utc ?? null,
  };
}

export function makeObligation(overrides: Partial<ObligationRecord> = {}): ObligationRecord {
  return {
    obligation_id: overrides.obligation_id ?? "OB-000001",
    bound_packet_id: overrides.bound_packet_id ?? "RP-000001",
    bound_source_id: overrides.bound_source_id ?? "SRC-000001",
    hard_or_soft: overrides.hard_or_soft ?? "SOFT",
    status: overrides.status ?? "ACTIVE",
  };
}
