import { ImmutableStore } from "./immutable-store.js";
import type { RefineryPacketRef } from "../types/refinery-packet.js";
import type { EvidenceRecord } from "../types/evidence.js";
import type { ObligationRecord } from "../types/obligation.js";
import type { VerificationResult } from "../types/verification-result.js";
import type { KernelEvaluationRequest } from "../types/kernel-evaluation-request.js";
import type { KernelDecision } from "../types/kernel-decision.js";
import type { TruthReceipt } from "../types/truth-receipt.js";
import type { TruthReference } from "../types/truth-reference.js";

/**
 * Kernel-owned record of a direct `TruthReference` revocation, independent
 * of the underlying receipt's own revocation status (T4R1).
 */
export interface ReferenceRevocationRecord {
  reference_id: string;
}

/**
 * Kernel-owned record binding a superseded `TruthReference` to the
 * reference that supersedes it (T4R1). Keyed by `superseded_reference_id`
 * so each reference can be superseded at most once.
 */
export interface ReferenceSupersessionRecord {
  superseded_reference_id: string;
  superseding_reference_id: string;
}

/**
 * Composes every immutable local store the Kernel resolves against.
 * Packets, evidence, and obligations are caller-registered inputs;
 * requests, decisions, receipts, and references are Kernel-produced
 * outputs. No store here is backed by a database, network call, or
 * external service.
 */
export class KernelStores {
  readonly packets = new ImmutableStore<RefineryPacketRef>();
  readonly evidence = new ImmutableStore<EvidenceRecord>();
  readonly obligations = new ImmutableStore<ObligationRecord>();
  readonly verificationResults = new ImmutableStore<VerificationResult>();
  readonly requests = new ImmutableStore<KernelEvaluationRequest>();
  readonly decisions = new ImmutableStore<KernelDecision>();
  readonly receipts = new ImmutableStore<TruthReceipt>();
  readonly references = new ImmutableStore<TruthReference>();
  readonly revocations = new ImmutableStore<{ receipt_id: string }>();
  readonly referenceRevocations = new ImmutableStore<ReferenceRevocationRecord>();
  readonly supersessions = new ImmutableStore<ReferenceSupersessionRecord>();

  registerPacket(packet: RefineryPacketRef): void {
    this.packets.insert(packet.refinery_packet_id, packet);
  }

  registerEvidence(record: EvidenceRecord): void {
    this.evidence.insert(record.evidence_id, record);
  }

  registerObligation(record: ObligationRecord): void {
    this.obligations.insert(record.obligation_id, record);
  }
}
