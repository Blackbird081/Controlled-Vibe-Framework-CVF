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
export declare class KernelStores {
    readonly packets: ImmutableStore<RefineryPacketRef>;
    readonly evidence: ImmutableStore<EvidenceRecord>;
    readonly obligations: ImmutableStore<ObligationRecord>;
    readonly verificationResults: ImmutableStore<VerificationResult>;
    readonly requests: ImmutableStore<KernelEvaluationRequest>;
    readonly decisions: ImmutableStore<KernelDecision>;
    readonly receipts: ImmutableStore<TruthReceipt>;
    readonly references: ImmutableStore<TruthReference>;
    readonly revocations: ImmutableStore<{
        receipt_id: string;
    }>;
    readonly referenceRevocations: ImmutableStore<ReferenceRevocationRecord>;
    readonly supersessions: ImmutableStore<ReferenceSupersessionRecord>;
    registerPacket(packet: RefineryPacketRef): void;
    registerEvidence(record: EvidenceRecord): void;
    registerObligation(record: ObligationRecord): void;
}
