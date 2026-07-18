import { ImmutableStore } from "./immutable-store.js";
/**
 * Composes every immutable local store the Kernel resolves against.
 * Packets, evidence, and obligations are caller-registered inputs;
 * requests, decisions, receipts, and references are Kernel-produced
 * outputs. No store here is backed by a database, network call, or
 * external service.
 */
export class KernelStores {
    packets = new ImmutableStore();
    evidence = new ImmutableStore();
    obligations = new ImmutableStore();
    verificationResults = new ImmutableStore();
    requests = new ImmutableStore();
    decisions = new ImmutableStore();
    receipts = new ImmutableStore();
    references = new ImmutableStore();
    revocations = new ImmutableStore();
    referenceRevocations = new ImmutableStore();
    supersessions = new ImmutableStore();
    registerPacket(packet) {
        this.packets.insert(packet.refinery_packet_id, packet);
    }
    registerEvidence(record) {
        this.evidence.insert(record.evidence_id, record);
    }
    registerObligation(record) {
        this.obligations.insert(record.obligation_id, record);
    }
}
