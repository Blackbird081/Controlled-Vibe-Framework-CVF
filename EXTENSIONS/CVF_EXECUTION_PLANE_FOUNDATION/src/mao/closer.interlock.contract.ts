// CVF MAO-T5 - Designated Closer And Commit/Session Interlock Contract
//
// Implements the exactly-one-closer invariant, integration decision,
// closure conversion, commit-steward interlock, no-auto-commit guard, and
// separate session-sync projection boundary defined by
// docs/reference/multi_agent_orchestration/CVF_MAO_RUNTIME_FOUNDATION_CONTRACT.md
// ("Task / Role / State Lifecycle" steps 9-10, "Closer And Commit
// Boundary", "No-auto-commit boundary") and the integrationReceipt shape
// in CVF_MAO_RUNTIME_FOUNDATION_SCHEMA.json. Only the AHB-designated
// closer may invoke commit steward after independent acceptance. No
// adapter, worker, specialist, or resolver receives commit authority.
// Session-sync remains a separate projection, never mixed into the
// material commit. Local execution-plane module only; no provider, queue,
// UI, git mutation, or runtime caller.

import { computeDeterministicHash } from "../../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { MaoReviewReceipt } from "./dissent.revision.contract";

// --- Types ---

/**
 * Integration decision on a completed task graph after all review
 * receipts have been collected. The closer alone authors this decision.
 */
export type MaoIntegrationDecision = "ACCEPT" | "REJECT" | "PARTIAL_ACCEPT";

/**
 * Integration receipt matching the integrationReceipt shape in
 * CVF_MAO_RUNTIME_FOUNDATION_SCHEMA.json. Authored only by the
 * AHB-designated closer after independent review acceptance.
 */
export interface MaoIntegrationReceipt {
  readonly receiptId: string;
  readonly taskGraphId: string;
  readonly closerActorId: string;
  readonly acceptedOutputs: readonly string[];
  readonly rejectedOutputs: readonly string[];
  readonly unresolvedDissent: readonly string[];
  readonly finalChangedSet: readonly string[];
  readonly commitStewardResult: string | null;
  readonly sessionSyncRequired: boolean;
  readonly decision: MaoIntegrationDecision;
  readonly recordedAt: string;
}

/** Input shape for buildIntegrationReceipt. */
export interface MaoIntegrationReceiptInput {
  taskGraphId: string;
  closerActorId: string;
  acceptedOutputs: readonly string[];
  rejectedOutputs: readonly string[];
  unresolvedDissent?: readonly string[];
  finalChangedSet: readonly string[];
  commitStewardResult?: string | null;
  sessionSyncRequired?: boolean;
  decision: MaoIntegrationDecision;
  recordedAt: string;
}

// --- Exactly-one closer validation ---

/**
 * Result of a closer-identity validation check.
 */
export type MaoCloserValidationResult =
  | { readonly ok: true; readonly closerActorId: string }
  | { readonly ok: false; readonly reason: string };

/**
 * Validate that the authority envelope carries exactly one designated
 * closer. Returns the closer identity on success, or a rejection reason
 * when the field is empty, missing, or otherwise invalid.
 */
export function validateExactlyOneCloser(closerActorId: string | null | undefined): MaoCloserValidationResult {
  if (!closerActorId || closerActorId.trim().length === 0) {
    return { ok: false, reason: "authority envelope must designate exactly one closer; closerActorId is empty or missing" };
  }
  return { ok: true, closerActorId: closerActorId.trim() };
}

/**
 * Check that the actor attempting a closer-authorized action is the
 * designated closer. Any other actor identity is rejected.
 */
export function checkCloserIdentity(actorId: string, designatedCloserId: string): MaoCloserValidationResult {
  const designated = validateExactlyOneCloser(designatedCloserId);
  if (!designated.ok) {
    return designated;
  }
  if (actorId.trim().length === 0) {
    return { ok: false, reason: "actor identity is empty; closer-only action rejected" };
  }
  if (actorId !== designatedCloserId) {
    return {
      ok: false,
      reason: `actor "${actorId}" is not the designated closer "${designatedCloserId}"; closer-only action rejected`,
    };
  }
  return { ok: true, closerActorId: designatedCloserId };
}

// --- Integration receipt ---

/**
 * Build a deterministic integration receipt from the closer's collected
 * review outputs and final changed-set evidence. The receiptId binds
 * every field so tampering with any output, closer identity, or decision
 * is detectable downstream.
 */
export function buildIntegrationReceipt(input: MaoIntegrationReceiptInput): MaoIntegrationReceipt {
  const receiptId = computeDeterministicHash(
    "mao-t5-integration-receipt",
    input.taskGraphId,
    input.closerActorId,
    [...input.acceptedOutputs].sort().join(","),
    [...input.rejectedOutputs].sort().join(","),
    [...(input.unresolvedDissent ?? [])].sort().join(","),
    [...input.finalChangedSet].sort().join(","),
    input.commitStewardResult ?? "no-steward-result",
    input.sessionSyncRequired ? "session-sync-required" : "session-sync-not-required",
    input.decision,
    input.recordedAt,
  );

  return Object.freeze({
    receiptId,
    taskGraphId: input.taskGraphId,
    closerActorId: input.closerActorId,
    acceptedOutputs: Object.freeze([...input.acceptedOutputs]),
    rejectedOutputs: Object.freeze([...input.rejectedOutputs]),
    unresolvedDissent: Object.freeze([...(input.unresolvedDissent ?? [])]),
    finalChangedSet: Object.freeze([...input.finalChangedSet]),
    commitStewardResult: input.commitStewardResult ?? null,
    sessionSyncRequired: input.sessionSyncRequired ?? false,
    decision: input.decision,
    recordedAt: input.recordedAt,
  }) as MaoIntegrationReceipt;
}

// --- No-auto-commit guard ---

/**
 * Result of a commit-authorization check. Only the AHB-designated closer
 * may be authorized to commit.
 */
export type MaoCommitAuthorizationResult =
  | { readonly authorized: true }
  | { readonly authorized: false; readonly reason: string };

/**
 * Reject any commit attempt from an actor that is not the designated
 * closer. Workers, adapters, specialists, and resolvers are always
 * denied. This is the execution-side enforcement check that the correct
 * actor is invoking commit steward; the AHB CF-07 remains the canonical
 * closer-identity source.
 */
export function checkCommitAuthorization(
  actorId: string,
  designatedCloserId: string,
): MaoCommitAuthorizationResult {
  if (actorId.trim().length === 0 || designatedCloserId.trim().length === 0) {
    return {
      authorized: false,
      reason: "commit authorization requires non-empty actor and designated closer identities",
    };
  }
  if (actorId !== designatedCloserId) {
    return {
      authorized: false,
      reason: `actor "${actorId}" is not authorized to commit; only the designated closer "${designatedCloserId}" may invoke commit steward`,
    };
  }
  return { authorized: true };
}

// --- Session-sync projection ---

/**
 * Session-sync projection signal. The closer records that a separate
 * session-sync commit must follow the material commit. The projection
 * does not perform the sync itself; it only asserts the requirement and
 * names the surfaces that must be updated by the session-sync steward.
 */
export interface MaoSessionSyncProjection {
  readonly required: boolean;
  readonly materialCommitRef: string;
  readonly surfacePaths: readonly string[];
}

/**
 * Build a session-sync projection that signals the need for a separate
 * continuity commit without performing it. The material commit ref is an
 * opaque identifier (typically a short commit SHA) that the session-sync
 * steward uses to verify the material commit exists before updating
 * continuity surfaces.
 */
export function buildSessionSyncProjection(
  materialCommitRef: string,
  surfacePaths: readonly string[],
): MaoSessionSyncProjection {
  return Object.freeze({
    required: true,
    materialCommitRef,
    surfacePaths: Object.freeze([...surfacePaths]),
  });
}

// --- Integration decision ---

/**
 * Make the closer's integration decision based on collected review
 * receipts. The decision is:
 *
 * - ACCEPT when every review receipt is ACCEPT and no dissent remains;
 * - REJECT when every review receipt is REJECT;
 * - PARTIAL_ACCEPT when some reviews are ACCEPT and others are REJECT,
 *   or when unresolved dissent exists but the closer still proceeds.
 *
 * The closer identity is validated before the receipt is built.
 */
export function makeIntegrationDecision(
  reviews: readonly MaoReviewReceipt[],
  closerActorId: string,
  designatedCloserId: string,
  taskGraphId: string,
  acceptedOutputs: readonly string[],
  rejectedOutputs: readonly string[],
  finalChangedSet: readonly string[],
  recordedAt: string,
): { receipt: MaoIntegrationReceipt | null; error: string | null } {
  const identityCheck = checkCloserIdentity(closerActorId, designatedCloserId);
  if (!identityCheck.ok) {
    return { receipt: null, error: identityCheck.reason };
  }

  if (reviews.length === 0) {
    return { receipt: null, error: "integration decision requires at least one review receipt" };
  }

  const nonTerminalReview = reviews.find(
    (review) => review.decision === "REQUEST_REPAIR" || review.decision === "ESCALATE",
  );
  if (nonTerminalReview) {
    return {
      receipt: null,
      error: `integration decision blocked by non-terminal review decision ${nonTerminalReview.decision}`,
    };
  }

  const allAccepted = reviews.every((r) => r.decision === "ACCEPT");
  const allRejected = reviews.every((r) => r.decision === "REJECT");

  let decision: MaoIntegrationDecision;
  if (allAccepted) {
    decision = "ACCEPT";
  } else if (allRejected) {
    decision = "REJECT";
  } else {
    decision = "PARTIAL_ACCEPT";
  }

  const unresolvedDissent = reviews
    .filter((r) => r.dissent !== null && r.decision !== "ACCEPT")
    .map((r) => r.dissent!);

  const receipt = buildIntegrationReceipt({
    taskGraphId,
    closerActorId,
    acceptedOutputs,
    rejectedOutputs,
    unresolvedDissent,
    finalChangedSet,
    decision,
    recordedAt,
    sessionSyncRequired: true,
  });

  return { receipt, error: null };
}

// --- Receipt consistency verification ---

/**
 * Verify an integration receipt has consistent internal state by
 * rebuilding its receiptId and comparing. Returns false when any field
 * diverges.
 */
export function verifyIntegrationReceiptConsistency(
  receipt: MaoIntegrationReceipt,
): { ok: boolean; reason?: string } {
  const rebuilt = buildIntegrationReceipt({
    taskGraphId: receipt.taskGraphId,
    closerActorId: receipt.closerActorId,
    acceptedOutputs: receipt.acceptedOutputs,
    rejectedOutputs: receipt.rejectedOutputs,
    unresolvedDissent: receipt.unresolvedDissent,
    finalChangedSet: receipt.finalChangedSet,
    commitStewardResult: receipt.commitStewardResult,
    sessionSyncRequired: receipt.sessionSyncRequired,
    decision: receipt.decision,
    recordedAt: receipt.recordedAt,
  });

  if (rebuilt.receiptId !== receipt.receiptId) {
    return {
      ok: false,
      reason: `receiptId mismatch: expected ${rebuilt.receiptId}, got ${receipt.receiptId}`,
    };
  }

  return { ok: true };
}
