/**
 * Enforces Required Invariants 1, 2, and 3: the request must bind a
 * hash-matching READY_FOR_KERNEL packet, evidence/obligations must
 * resolve to that same packet's lineage (T2 Negative Case NC-06), and
 * the request's policy/rule version must equal what Kernel currently
 * authorizes. This runs before any decision is produced; a rejected
 * admission never reaches evaluation.
 */
export function admitRequest(request, stores, authorizedPolicyVersion, authorizedRuleVersion) {
    const reasons = [];
    const packet = stores.packets.get(request.packet_reference);
    if (!packet) {
        reasons.push("PACKET_NOT_FOUND");
        return { admitted: false, reasons };
    }
    if (packet.content_hash !== request.packet_hash) {
        reasons.push("PACKET_HASH_MISMATCH");
    }
    if (packet.status !== "READY_FOR_KERNEL") {
        reasons.push("PACKET_NOT_READY_FOR_KERNEL");
    }
    if (request.evidence_refs.length === 0) {
        reasons.push("EVIDENCE_REFS_EMPTY");
    }
    for (const evidenceId of request.evidence_refs) {
        const evidence = stores.evidence.get(evidenceId);
        if (!evidence) {
            reasons.push("EVIDENCE_NOT_FOUND");
            continue;
        }
        if (evidence.bound_packet_id !== packet.refinery_packet_id) {
            reasons.push("EVIDENCE_CROSS_PACKET");
        }
    }
    for (const obligationId of request.obligation_refs) {
        const obligation = stores.obligations.get(obligationId);
        if (!obligation) {
            reasons.push("OBLIGATION_NOT_FOUND");
            continue;
        }
        if (obligation.bound_packet_id !== packet.refinery_packet_id) {
            reasons.push("OBLIGATION_CROSS_PACKET");
        }
    }
    if (request.policy_version !== authorizedPolicyVersion) {
        reasons.push("STALE_POLICY_VERSION");
    }
    if (request.rule_version !== authorizedRuleVersion) {
        reasons.push("STALE_RULE_VERSION");
    }
    return { admitted: reasons.length === 0, reasons: [...new Set(reasons)] };
}
