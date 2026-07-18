import { createHash } from "node:crypto";
import {
  TruthKernel,
  DeterministicClock as KernelClock,
  SequentialIdFactory as KernelIds,
} from "cvf-truth-kernel";
import type { RefineryPacketRef, EvidenceRecord, TruthReference } from "cvf-truth-kernel";

export const POLICY_VERSION = "policy-2026-07-12";
export const RULE_VERSION = "rule-2026-07-12";

export function contentHashFor(seed: string): string {
  return `sha256:${createHash("sha256").update(seed).digest("hex")}`;
}

export function makeRealKernel(startUtcIso = "2026-07-12T00:00:00Z"): TruthKernel {
  return new TruthKernel(new KernelClock(startUtcIso, 1000), new KernelIds(), POLICY_VERSION, RULE_VERSION);
}

let callCounter = 0;

/**
 * Registers a packet/evidence pair on the real TruthKernel instance,
 * evaluates it to ACCEPT_EVIDENCE_CANDIDATE, and issues an ACTIVE
 * TruthReference. Returns the reference_id for Flow to consume by ID
 * only, per T5's Kernel authority boundary contract.
 */
export function issueActiveReferenceId(
  kernel: TruthKernel,
  scope = "scope-1",
  validFromUtc = "2026-07-12T00:00:00Z",
  validUntilUtc = "2026-08-12T00:00:00Z",
): string {
  callCounter += 1;
  const packetId = `RP-${String(callCounter).padStart(6, "0")}`;
  const evidenceId = `EV-${String(callCounter).padStart(6, "0")}`;
  const requestId = `REQ-${String(callCounter).padStart(6, "0")}`;
  const packetSeed = `packet-${callCounter}`;

  const packet: RefineryPacketRef = {
    refinery_packet_id: packetId,
    content_hash: contentHashFor(packetSeed),
    declared_scope: { organization: "cvf" },
    status: "READY_FOR_KERNEL",
  };
  const evidence: EvidenceRecord = {
    evidence_id: evidenceId,
    bound_packet_id: packetId,
    bound_source_id: `SRC-${String(callCounter).padStart(6, "0")}`,
    provenance_label: "SOURCE_BACKED",
    captured_at_utc: "2026-07-12T00:00:00Z",
    valid_until_utc: null,
  };
  kernel.registerPacket(packet);
  kernel.registerEvidence(evidence);

  const { receipt } = kernel.evaluate({
    requestId,
    packetHash: contentHashFor(packetSeed),
    packetReference: packetId,
    policyVersion: POLICY_VERSION,
    ruleVersion: RULE_VERSION,
    evidenceRefs: [evidenceId],
    obligationRefs: [],
    verificationMode: "STRICT",
    requestedDecisionContext: "test",
  });
  if (receipt.decision !== "ACCEPT_EVIDENCE_CANDIDATE") {
    throw new Error(`FIXTURE_SETUP_FAILED: unexpected decision ${receipt.decision}`);
  }

  const issuance = kernel.issueReference(receipt.receipt_id, scope, "v1", validFromUtc, validUntilUtc);
  if (!issuance.issued || !issuance.reference) {
    throw new Error(`FIXTURE_SETUP_FAILED: reference not issued: ${issuance.reasons.join(",")}`);
  }
  return (issuance.reference as TruthReference).reference_id;
}
