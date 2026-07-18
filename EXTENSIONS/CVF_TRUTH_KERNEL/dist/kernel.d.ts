import type { Clock, IdFactory } from "./deps.js";
import type { RefineryPacketRef } from "./types/refinery-packet.js";
import type { EvidenceRecord } from "./types/evidence.js";
import type { ObligationRecord } from "./types/obligation.js";
import type { KernelEvaluationRequest } from "./types/kernel-evaluation-request.js";
import type { KernelDecision } from "./types/kernel-decision.js";
import type { TruthReceipt } from "./types/truth-receipt.js";
import type { RevocationResult, ReferenceRevocationResult } from "./engine/revocation.js";
import type { ReferenceIssuanceResult, ReferenceStateResolutionResult, SupersessionResult } from "./engine/reference-issuer.js";
export interface EvaluateInput {
    requestId: string;
    packetHash: string;
    packetReference: string;
    policyVersion: string;
    ruleVersion: string;
    evidenceRefs: string[];
    obligationRefs: string[];
    verificationMode: string;
    requestedDecisionContext: string;
}
export interface EvaluateResult {
    request: KernelEvaluationRequest;
    decision: KernelDecision;
    receipt: TruthReceipt;
}
/**
 * CVF Truth Kernel. Sole producer of KernelDecision, TruthReceipt, and
 * TruthReference (T2 Producer/Consumer Uniqueness Table). Accepts
 * injected clock, ID factory, and authorized policy/rule version at
 * construction; no wall clock or random global is read anywhere in
 * this package.
 */
export declare class TruthKernel {
    private readonly clock;
    private readonly ids;
    private readonly authorizedPolicyVersion;
    private readonly authorizedRuleVersion;
    private readonly stores;
    constructor(clock: Clock, ids: IdFactory, authorizedPolicyVersion: string, authorizedRuleVersion: string);
    registerPacket(packet: RefineryPacketRef): void;
    registerEvidence(record: EvidenceRecord): void;
    registerObligation(record: ObligationRecord): void;
    /**
     * Runs the full admission -> evaluation -> decision -> receipt chain
     * for one request. Always returns a decision and a receipt: a
     * rejected admission still produces a REJECT decision and an ISSUED
     * receipt recording that outcome, per the All-outcomes recording rule.
     */
    evaluate(input: EvaluateInput): EvaluateResult;
    revoke(receiptId: string): RevocationResult;
    receiptStatus(receipt: TruthReceipt): TruthReceipt["status"];
    issueReference(receiptId: string, scope: string, version: string, validFromUtc: string, validUntilUtc: string): ReferenceIssuanceResult;
    /**
     * Resolves current reference_state at read time. Accepts only a
     * reference_id and the read-time timestamp; no caller-supplied
     * reference object, isRevoked, or isSuperseded parameter exists
     * (T4R1 Required Invariant 1).
     */
    referenceState(referenceId: string, nowUtcIso: string): ReferenceStateResolutionResult;
    /**
     * Revokes a TruthReference directly, independent of its bound
     * receipt's own revocation status (T4R1 Required Invariant 2).
     */
    revokeReference(referenceId: string): ReferenceRevocationResult;
    /**
     * Records that newReferenceId supersedes oldReferenceId under the
     * validation rules in T4R1 Required Invariant 3.
     */
    supersede(oldReferenceId: string, newReferenceId: string): SupersessionResult;
}
