import { KernelStores } from "./stores/kernel-stores.js";
import { admitRequest } from "./engine/admission.js";
import { produceVerificationResults, computeDecision } from "./engine/evaluator.js";
import { issueReceipt } from "./engine/receipt-issuer.js";
import { revokeReceipt, currentReceiptStatus, revokeReference as revokeReferenceRecord, } from "./engine/revocation.js";
import { issueReference, computeCurrentReferenceState, supersedeReference, } from "./engine/reference-issuer.js";
/**
 * CVF Truth Kernel. Sole producer of KernelDecision, TruthReceipt, and
 * TruthReference (T2 Producer/Consumer Uniqueness Table). Accepts
 * injected clock, ID factory, and authorized policy/rule version at
 * construction; no wall clock or random global is read anywhere in
 * this package.
 */
export class TruthKernel {
    clock;
    ids;
    authorizedPolicyVersion;
    authorizedRuleVersion;
    stores = new KernelStores();
    constructor(clock, ids, authorizedPolicyVersion, authorizedRuleVersion) {
        this.clock = clock;
        this.ids = ids;
        this.authorizedPolicyVersion = authorizedPolicyVersion;
        this.authorizedRuleVersion = authorizedRuleVersion;
    }
    registerPacket(packet) {
        this.stores.registerPacket(packet);
    }
    registerEvidence(record) {
        this.stores.registerEvidence(record);
    }
    registerObligation(record) {
        this.stores.registerObligation(record);
    }
    /**
     * Runs the full admission -> evaluation -> decision -> receipt chain
     * for one request. Always returns a decision and a receipt: a
     * rejected admission still produces a REJECT decision and an ISSUED
     * receipt recording that outcome, per the All-outcomes recording rule.
     */
    evaluate(input) {
        const deps = { clock: this.clock, ids: this.ids };
        const request = {
            request_id: input.requestId,
            packet_hash: input.packetHash,
            packet_reference: input.packetReference,
            policy_version: input.policyVersion,
            rule_version: input.ruleVersion,
            evidence_refs: [...input.evidenceRefs],
            obligation_refs: [...input.obligationRefs],
            verification_mode: input.verificationMode,
            requested_decision_context: input.requestedDecisionContext,
            submitted_at_utc: deps.clock.nowUtcIso(),
            status: "SUBMITTED",
        };
        this.stores.requests.insert(request.request_id, request);
        const admission = admitRequest(request, this.stores, this.authorizedPolicyVersion, this.authorizedRuleVersion);
        const verificationResults = admission.admitted
            ? produceVerificationResults(request, this.stores, deps)
            : [];
        const computed = computeDecision(request, admission, verificationResults, this.stores);
        const decision = {
            decision_id: deps.ids.nextId("KD"),
            request_id: request.request_id,
            packet_hash: request.packet_hash,
            decision: computed.decision,
            reasons: computed.reasons,
            failed_obligations: computed.failedObligations,
            verification_result_refs: verificationResults.map((result) => result.verification_result_id),
            policy_version: request.policy_version,
            rule_version: request.rule_version,
            decided_at_utc: deps.clock.nowUtcIso(),
        };
        this.stores.decisions.insert(decision.decision_id, decision);
        const issuance = issueReceipt(decision, request, this.stores, deps);
        if (!issuance.issued || !issuance.receipt) {
            throw new Error(`KERNEL_RECEIPT_ISSUANCE_FAILED: ${issuance.reasons.join(",")}`);
        }
        return { request, decision, receipt: issuance.receipt };
    }
    revoke(receiptId) {
        return revokeReceipt(receiptId, this.stores);
    }
    receiptStatus(receipt) {
        return currentReceiptStatus(receipt, this.stores);
    }
    issueReference(receiptId, scope, version, validFromUtc, validUntilUtc) {
        const deps = { clock: this.clock, ids: this.ids };
        return issueReference(receiptId, scope, version, validFromUtc, validUntilUtc, this.stores, deps);
    }
    /**
     * Resolves current reference_state at read time. Accepts only a
     * reference_id and the read-time timestamp; no caller-supplied
     * reference object, isRevoked, or isSuperseded parameter exists
     * (T4R1 Required Invariant 1).
     */
    referenceState(referenceId, nowUtcIso) {
        return computeCurrentReferenceState(referenceId, this.stores, nowUtcIso);
    }
    /**
     * Revokes a TruthReference directly, independent of its bound
     * receipt's own revocation status (T4R1 Required Invariant 2).
     */
    revokeReference(referenceId) {
        return revokeReferenceRecord(referenceId, this.stores);
    }
    /**
     * Records that newReferenceId supersedes oldReferenceId under the
     * validation rules in T4R1 Required Invariant 3.
     */
    supersede(oldReferenceId, newReferenceId) {
        return supersedeReference(oldReferenceId, newReferenceId, this.stores);
    }
}
