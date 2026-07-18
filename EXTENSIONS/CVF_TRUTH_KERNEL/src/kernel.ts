import type { Clock, IdFactory } from "./deps.js";
import { KernelStores } from "./stores/kernel-stores.js";
import type { RefineryPacketRef } from "./types/refinery-packet.js";
import type { EvidenceRecord } from "./types/evidence.js";
import type { ObligationRecord } from "./types/obligation.js";
import type { KernelEvaluationRequest } from "./types/kernel-evaluation-request.js";
import type { KernelDecision } from "./types/kernel-decision.js";
import type { TruthReceipt } from "./types/truth-receipt.js";
import type { TruthReference } from "./types/truth-reference.js";
import { admitRequest } from "./engine/admission.js";
import { produceVerificationResults, computeDecision } from "./engine/evaluator.js";
import { issueReceipt } from "./engine/receipt-issuer.js";
import {
  revokeReceipt,
  currentReceiptStatus,
  revokeReference as revokeReferenceRecord,
} from "./engine/revocation.js";
import type { RevocationResult, ReferenceRevocationResult } from "./engine/revocation.js";
import {
  issueReference,
  computeCurrentReferenceState,
  supersedeReference,
} from "./engine/reference-issuer.js";
import type {
  ReferenceIssuanceResult,
  ReferenceStateResolutionResult,
  SupersessionResult,
} from "./engine/reference-issuer.js";

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
export class TruthKernel {
  private readonly stores = new KernelStores();

  constructor(
    private readonly clock: Clock,
    private readonly ids: IdFactory,
    private readonly authorizedPolicyVersion: string,
    private readonly authorizedRuleVersion: string,
  ) {}

  registerPacket(packet: RefineryPacketRef): void {
    this.stores.registerPacket(packet);
  }

  registerEvidence(record: EvidenceRecord): void {
    this.stores.registerEvidence(record);
  }

  registerObligation(record: ObligationRecord): void {
    this.stores.registerObligation(record);
  }

  /**
   * Runs the full admission -> evaluation -> decision -> receipt chain
   * for one request. Always returns a decision and a receipt: a
   * rejected admission still produces a REJECT decision and an ISSUED
   * receipt recording that outcome, per the All-outcomes recording rule.
   */
  evaluate(input: EvaluateInput): EvaluateResult {
    const deps = { clock: this.clock, ids: this.ids };

    const request: KernelEvaluationRequest = {
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

    const admission = admitRequest(
      request,
      this.stores,
      this.authorizedPolicyVersion,
      this.authorizedRuleVersion,
    );

    const verificationResults = admission.admitted
      ? produceVerificationResults(request, this.stores, deps)
      : [];

    const computed = computeDecision(request, admission, verificationResults, this.stores);

    const decision: KernelDecision = {
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

  revoke(receiptId: string): RevocationResult {
    return revokeReceipt(receiptId, this.stores);
  }

  receiptStatus(receipt: TruthReceipt): TruthReceipt["status"] {
    return currentReceiptStatus(receipt, this.stores);
  }

  issueReference(
    receiptId: string,
    scope: string,
    version: string,
    validFromUtc: string,
    validUntilUtc: string,
  ): ReferenceIssuanceResult {
    const deps = { clock: this.clock, ids: this.ids };
    return issueReference(receiptId, scope, version, validFromUtc, validUntilUtc, this.stores, deps);
  }

  /**
   * Resolves current reference_state at read time. Accepts only a
   * reference_id and the read-time timestamp; no caller-supplied
   * reference object, isRevoked, or isSuperseded parameter exists
   * (T4R1 Required Invariant 1).
   */
  referenceState(referenceId: string, nowUtcIso: string): ReferenceStateResolutionResult {
    return computeCurrentReferenceState(referenceId, this.stores, nowUtcIso);
  }

  /**
   * Revokes a TruthReference directly, independent of its bound
   * receipt's own revocation status (T4R1 Required Invariant 2).
   */
  revokeReference(referenceId: string): ReferenceRevocationResult {
    return revokeReferenceRecord(referenceId, this.stores);
  }

  /**
   * Records that newReferenceId supersedes oldReferenceId under the
   * validation rules in T4R1 Required Invariant 3.
   */
  supersede(oldReferenceId: string, newReferenceId: string): SupersessionResult {
    return supersedeReference(oldReferenceId, newReferenceId, this.stores);
  }
}
