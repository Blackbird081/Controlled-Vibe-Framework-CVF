import type { KernelStores } from "../stores/kernel-stores.js";
import type { KernelEvaluationRequest } from "../types/kernel-evaluation-request.js";
import type { KernelDecision, KernelDecisionToken } from "../types/kernel-decision.js";
import type { VerificationResult } from "../types/verification-result.js";
import type { StageDeps } from "./deps-context.js";
import type { AdmissionResult } from "./admission.js";

/**
 * Kernel is the sole producer of verification results (T2
 * KernelEvaluationRequest Verification-result ownership and transport
 * model). Caller-supplied results are never read; this deterministic
 * method produces one result per bound evidence item (provenance-label
 * check) and one per bound obligation (status check). No caller-supplied
 * approval/result/authority boolean can substitute for this evaluation
 * (Required Invariant 10).
 */
export function produceVerificationResults(
  request: KernelEvaluationRequest,
  stores: KernelStores,
  deps: StageDeps,
): VerificationResult[] {
  const results: VerificationResult[] = [];

  for (const evidenceId of request.evidence_refs) {
    const evidence = stores.evidence.get(evidenceId);
    if (!evidence) continue;
    const status = evidence.provenance_label === "MISSING_EVIDENCE" ? "FAIL" : "PASS";
    const result: VerificationResult = {
      verification_result_id: deps.ids.nextId("VR"),
      method: "evidence-provenance-check",
      status,
      checked_at_utc: deps.clock.nowUtcIso(),
    };
    stores.verificationResults.insert(result.verification_result_id, result);
    results.push(result);
  }

  for (const obligationId of request.obligation_refs) {
    const obligation = stores.obligations.get(obligationId);
    if (!obligation) continue;
    const status = obligation.status === "FAILED" ? "FAIL" : "PASS";
    const result: VerificationResult = {
      verification_result_id: deps.ids.nextId("VR"),
      method: "obligation-status-check",
      status,
      checked_at_utc: deps.clock.nowUtcIso(),
    };
    stores.verificationResults.insert(result.verification_result_id, result);
    results.push(result);
  }

  return results;
}

export interface DecisionComputation {
  decision: KernelDecisionToken;
  reasons: string[];
  failedObligations: string[];
}

/**
 * Required Invariant 2: empty evidence or empty Kernel-produced
 * verification results never accepts. A blocking FAIL/BLOCKED
 * verification result or a failed hard obligation rejects.
 */
export function computeDecision(
  request: KernelEvaluationRequest,
  admission: AdmissionResult,
  verificationResults: VerificationResult[],
  stores: KernelStores,
): DecisionComputation {
  if (!admission.admitted) {
    return {
      decision: "REJECT",
      reasons: admission.reasons,
      failedObligations: [],
    };
  }

  if (request.evidence_refs.length === 0 || verificationResults.length === 0) {
    return {
      decision: "REQUIRE_ADDITIONAL_EVIDENCE",
      reasons: ["EVIDENCE_OR_VERIFICATION_RESULTS_EMPTY"],
      failedObligations: [],
    };
  }

  const failedObligations: string[] = [];
  for (const obligationId of request.obligation_refs) {
    const obligation = stores.obligations.get(obligationId);
    if (obligation && obligation.hard_or_soft === "HARD" && obligation.status === "FAILED") {
      failedObligations.push(obligationId);
    }
  }

  const blockingVerification = verificationResults.some(
    (result) => result.status === "FAIL" || result.status === "BLOCKED",
  );

  if (failedObligations.length > 0 || blockingVerification) {
    return {
      decision: "REJECT",
      reasons: blockingVerification
        ? ["BLOCKING_VERIFICATION_RESULT"]
        : ["FAILED_HARD_OBLIGATION"],
      failedObligations,
    };
  }

  return {
    decision: "ACCEPT_EVIDENCE_CANDIDATE",
    reasons: [],
    failedObligations: [],
  };
}
