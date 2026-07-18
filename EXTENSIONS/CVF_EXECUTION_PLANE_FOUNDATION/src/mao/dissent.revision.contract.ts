// CVF MAO-T4 - Dissent And Revision Contract
//
// Implements the deterministic dissent/defect/repair-owner ledger, bounded
// revision ceiling, stop/escalation controls, and review receipt builder
// defined by
// docs/reference/multi_agent_orchestration/CVF_MAO_RUNTIME_FOUNDATION_CONTRACT.md
// ("Task / Role / State Lifecycle" steps 7-8, "Cost / Token / Latency
// Controls" revision depth, "Threat And Failure Model") and the
// reviewReceipt shape in CVF_MAO_RUNTIME_FOUNDATION_SCHEMA.json. Local
// execution-plane module only; no provider, queue, UI, or runtime caller.

import { computeDeterministicHash } from "../../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

/**
 * Classified defect category. Every dissent must be assigned exactly one
 * class so repair ownership and escalation decisions are machine-testable.
 */
export type MaoDefectClass =
  | "MISSING_EVIDENCE"
  | "WRONG_RESULT"
  | "PARTIAL_OUTPUT"
  | "SCOPE_BREACH"
  | "CONTRACT_VIOLATION"
  | "STALE_SOURCE"
  | "AUTHORITY_MISMATCH";

/**
 * Reviewer decision on a single piece of work.
 */
export type MaoReviewDecision = "ACCEPT" | "REQUEST_REPAIR" | "REJECT" | "ESCALATE";

/**
 * Immutable dissent record identifying a specific defect found by a
 * specific reviewer against a specific task. Dissent is never inferred;
 * it is always an explicit, classified decision.
 */
export interface MaoDissentRecord {
  readonly dissentId: string;
  readonly reviewerIdentity: string;
  readonly taskId: string;
  readonly defectClass: MaoDefectClass;
  readonly detail: string;
  readonly recordedAt: string;
}

/**
 * A single defect entry within a review receipt, including the assigned
 * repair owner when the decision is REQUEST_REPAIR.
 */
export interface MaoDefectEntry {
  readonly defectId: string;
  readonly defectClass: MaoDefectClass;
  readonly detail: string;
  readonly repairOwner: string | null;
}

/**
 * Full review receipt, matching the reviewReceipt shape in
 * CVF_MAO_RUNTIME_FOUNDATION_SCHEMA.json. The receipt binds reviewer
 * evidence to an immutable isolated source packet hash; it never
 * incorporates raw worker output.
 */
export interface MaoReviewReceipt {
  readonly receiptId: string;
  readonly taskId: string;
  readonly isolatedSourcePacketHash: string;
  readonly recomputedEvidence: readonly string[];
  readonly defects: readonly MaoDefectEntry[];
  readonly dissent: string | null;
  readonly decision: MaoReviewDecision;
  readonly repairOwner: string | null;
  readonly revisionNumber: number;
  readonly recordedAt: string;
}

/**
 * Mutable revision ledger that accumulates sequential review receipts for a
 * single task within one authority envelope. The ledger enforces the
 * contract's maxRevisionDepth ceiling.
 */
export interface MaoRevisionLedger {
  readonly receipts: readonly MaoReviewReceipt[];
  readonly currentRevision: number;
  readonly maxRevisionDepth: number;
}

/** Input shape for buildReviewReceipt. */
export interface MaoReviewReceiptInput {
  taskId: string;
  isolatedSourcePacketHash: string;
  recomputedEvidence: readonly string[];
  defects?: readonly MaoDefectEntry[];
  dissent?: string | null;
  decision: MaoReviewDecision;
  repairOwner?: string | null;
  revisionNumber: number;
  recordedAt: string;
}

/** Result of a revision ceiling check. */
export type MaoRevisionCeilingCheck =
  | { readonly ok: true; readonly nextRevision: number }
  | { readonly ok: false; readonly reason: string; readonly escalationRequired: true };

/** Result of recording a review receipt in a revision ledger. */
export type MaoRecordReviewResult =
  | { readonly ok: true; readonly ledger: MaoRevisionLedger }
  | { readonly ok: false; readonly reason: string; readonly escalationRequired: true };

/** Terminal decision produced after applying the revision ceiling. */
export type MaoReviewTerminalDecision =
  | { readonly decision: "ACCEPT"; readonly receipt: MaoReviewReceipt }
  | { readonly decision: "REQUEST_REPAIR"; readonly receipt: MaoReviewReceipt; readonly repairOwner: string }
  | { readonly decision: "REJECT"; readonly receipt: MaoReviewReceipt; readonly reason: string }
  | { readonly decision: "ESCALATE"; readonly receipt: MaoReviewReceipt; readonly reason: string };

// --- Review receipt builder ---

/**
 * Build a deterministic review receipt. The receiptId is a hash of every
 * field that distinguishes one review from another, so two receipts with
 * the same content always produce the same ID, and tampering with any field
 * (including defect or evidence content) is detectable via
 * verifyReviewReceiptConsistency.
 */
export function buildReviewReceipt(input: MaoReviewReceiptInput): MaoReviewReceipt {
  const defects = Object.freeze(
    (input.defects ?? []).map((d) => Object.freeze({ ...d })),
  );

  const receiptId = computeDeterministicHash(
    "mao-t4-review-receipt",
    input.taskId,
    input.isolatedSourcePacketHash,
    [...input.recomputedEvidence].sort().join(","),
    [...defects.map((d) => `${d.defectClass}:${d.detail}:${d.repairOwner ?? "unassigned"}`)].sort().join("|"),
    input.dissent ?? "no-dissent",
    input.decision,
    input.repairOwner ?? "no-repair-owner",
    String(input.revisionNumber),
    input.recordedAt,
  );

  return Object.freeze({
    receiptId,
    taskId: input.taskId,
    isolatedSourcePacketHash: input.isolatedSourcePacketHash,
    recomputedEvidence: Object.freeze([...input.recomputedEvidence]),
    defects,
    dissent: input.dissent ?? null,
    decision: input.decision,
    repairOwner: input.repairOwner ?? null,
    revisionNumber: input.revisionNumber,
    recordedAt: input.recordedAt,
  }) as MaoReviewReceipt;
}

// --- Defect entry builder ---

/**
 * Build a deterministic defect entry. Two entries with the same class,
 * detail, and repair owner always produce the same defectId.
 */
export function buildDefectEntry(
  defectClass: MaoDefectClass,
  detail: string,
  repairOwner: string | null,
): MaoDefectEntry {
  const defectId = computeDeterministicHash(
    "mao-t4-defect",
    defectClass,
    detail,
    repairOwner ?? "unassigned",
  );
  return Object.freeze({ defectId, defectClass, detail, repairOwner }) as MaoDefectEntry;
}

// --- Dissent record builder ---

/**
 * Build a deterministic dissent record. Two records with the same content
 * always produce the same dissentId, allowing downstream replay
 * verification.
 */
export function buildDissentRecord(
  taskId: string,
  reviewerIdentity: string,
  defectClass: MaoDefectClass,
  detail: string,
  recordedAt: string,
): MaoDissentRecord {
  const dissentId = computeDeterministicHash(
    "mao-t4-dissent",
    taskId,
    reviewerIdentity,
    defectClass,
    detail,
    recordedAt,
  );
  return Object.freeze({
    dissentId,
    reviewerIdentity,
    taskId,
    defectClass,
    detail,
    recordedAt,
  }) as MaoDissentRecord;
}

// --- Revision ceiling ---

/**
 * Check whether the current revision count has hit or exceeded the
 * authority envelope's maxRevisionDepth. When the ceiling is reached,
 * further repairs are blocked and operator escalation is required.
 *
 * Per the contract's Cost / Token / Latency Controls: the initial pilot
 * maximum is 1 worker repair cycle. A second repair requires operator
 * approval and is outside the default schema ceiling. Revision 0 is the
 * initial review; revision 1 is the first repair cycle. When
 * currentRevision >= maxRevisionDepth, no further repair may proceed
 * without escalation.
 */
export function checkRevisionCeiling(
  currentRevision: number,
  maxRevisionDepth: number,
  forceEscalate?: boolean,
): MaoRevisionCeilingCheck {
  if (forceEscalate) {
    return { ok: false, reason: "operator escalation flag is set", escalationRequired: true };
  }
  if (currentRevision >= maxRevisionDepth) {
    return {
      ok: false,
      reason: `revision ceiling reached: revision ${currentRevision} >= maxRevisionDepth ${maxRevisionDepth}`,
      escalationRequired: true,
    };
  }
  return { ok: true, nextRevision: currentRevision + 1 };
}

// --- Revision ledger ---

/**
 * Create an empty revision ledger bound to an authority envelope's
 * maxRevisionDepth. The ledger starts at revision 0 (initial review).
 */
export function createRevisionLedger(maxRevisionDepth: number): MaoRevisionLedger {
  return { receipts: Object.freeze([]), currentRevision: 0, maxRevisionDepth };
}

/**
 * Record a review receipt in the ledger after checking the revision
 * ceiling. Returns the updated ledger on success, or a ceiling/escalation
 * rejection when further repairs are blocked.
 */
export function recordReviewInLedger(
  ledger: MaoRevisionLedger,
  receipt: MaoReviewReceipt,
): MaoRecordReviewResult {
  const expectedRevision = ledger.receipts.length === 0 ? 0 : ledger.currentRevision + 1;
  if (receipt.revisionNumber !== expectedRevision) {
    return {
      ok: false,
      reason: `non-sequential revision: expected ${expectedRevision}, received ${receipt.revisionNumber}`,
      escalationRequired: true,
    };
  }
  if (receipt.revisionNumber > ledger.maxRevisionDepth) {
    return {
      ok: false,
      reason: `revision ${receipt.revisionNumber} exceeds maxRevisionDepth ${ledger.maxRevisionDepth}`,
      escalationRequired: true,
    };
  }

  const newReceipts = Object.freeze([...ledger.receipts, receipt]);
  return {
    ok: true,
    ledger: {
      receipts: newReceipts,
      currentRevision: receipt.revisionNumber,
      maxRevisionDepth: ledger.maxRevisionDepth,
    },
  };
}

// --- Terminal decision ---

/**
 * Apply the revision ceiling to a review receipt's decision. When the
 * ceiling is not yet reached, the raw decision passes through. When the
 * ceiling is hit (or forceEscalate is set), ACCEPT and REJECT still pass
 * through (they are terminal, not repair-requests), while REQUEST_REPAIR
 * and ESCALATE are both promoted to ESCALATE with a ceiling reason.
 */
export function terminalReviewDecision(
  receipt: MaoReviewReceipt,
  ceilingCheck: MaoRevisionCeilingCheck,
): MaoReviewTerminalDecision {
  if (!ceilingCheck.ok) {
    if (receipt.decision === "ACCEPT" || receipt.decision === "REJECT") {
      return receipt.decision === "ACCEPT"
        ? { decision: "ACCEPT", receipt }
        : { decision: "REJECT", receipt, reason: receipt.dissent ?? "reviewer rejected output" };
    }
    return { decision: "ESCALATE", receipt, reason: ceilingCheck.reason };
  }

  if (receipt.decision === "ACCEPT") {
    return { decision: "ACCEPT", receipt };
  }

  if (receipt.decision === "REQUEST_REPAIR") {
    if (!receipt.repairOwner) {
      return { decision: "ESCALATE", receipt, reason: "repair request has no assigned repair owner" };
    }
    const repairOwner = receipt.repairOwner;
    return { decision: "REQUEST_REPAIR", receipt, repairOwner };
  }

  if (receipt.decision === "REJECT") {
    return { decision: "REJECT", receipt, reason: receipt.dissent ?? "reviewer rejected output" };
  }

  return { decision: "ESCALATE", receipt, reason: receipt.dissent ?? "reviewer escalated for operator decision" };
}

// --- Replay verification ---

/**
 * Replay a dissent record and verify it produces the same dissentId. Used
 * to prove determinism: given the same inputs, two independent calls always
 * produce identical records.
 */
export function verifyDissentDeterminism(
  taskId: string,
  reviewerIdentity: string,
  defectClass: MaoDefectClass,
  detail: string,
  recordedAt: string,
  expectedDissentId: string,
): boolean {
  const replayed = buildDissentRecord(taskId, reviewerIdentity, defectClass, detail, recordedAt);
  return replayed.dissentId === expectedDissentId;
}

/**
 * Verify a review receipt has consistent internal state by rebuilding its
 * receiptId from the receipt's own fields and comparing. Returns false when
 * any field diverges from the receipt's original content.
 */
export function verifyReviewReceiptConsistency(receipt: MaoReviewReceipt): { ok: boolean; reason?: string } {
  const rebuilt = buildReviewReceipt({
    taskId: receipt.taskId,
    isolatedSourcePacketHash: receipt.isolatedSourcePacketHash,
    recomputedEvidence: receipt.recomputedEvidence,
    defects: receipt.defects,
    dissent: receipt.dissent,
    decision: receipt.decision,
    repairOwner: receipt.repairOwner,
    revisionNumber: receipt.revisionNumber,
    recordedAt: receipt.recordedAt,
  });

  if (rebuilt.receiptId !== receipt.receiptId) {
    return { ok: false, reason: `receiptId mismatch: expected ${rebuilt.receiptId}, got ${receipt.receiptId}` };
  }

  return { ok: true };
}
