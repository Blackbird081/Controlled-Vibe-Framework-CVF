// CVF MAO-OA-T4 - Operational Review Convergence And Commit/Session Interlock
//
// Implements one bounded local composition owner that reuses the existing
// MAO-T4 reviewer isolation contract, MAO-T4 dissent/revision contract, and
// MAO-T5 closer interlock contract to run independent review collection,
// bounded repair, terminal closer convergence, and a commit/session
// interlock plan, per
// docs/reference/multi_agent_orchestration/CVF_MAO_RUNTIME_FOUNDATION_CONTRACT.md
// and
// docs/work_orders/CVF_AGENT_WORK_ORDER_MAO_OA_T4_OPERATIONAL_REVIEW_CONVERGENCE_AND_COMMIT_SESSION_INTERLOCK_2026-07-17.md.
//
// This module owns review/repair/closer/commit-session composition only. It
// never runs git, a commit steward, a session-state generator, an actual
// agent subprocess, or any provider/network/process/queue call. A returned
// commit-authorization or session-sync projection is a typed plan only; it
// is never evidence that a commit or session mutation actually occurred.
// Local execution-plane module only; no CLI/MCP/UI/runtime caller.

import {
  buildIsolatedSourcePacket,
  buildRecomputedEvidence,
} from "./reviewer.isolation.contract";
import type {
  MaoIsolatedSourcePacket,
  MaoRecomputedEvidence,
} from "./reviewer.isolation.contract";
import {
  buildDefectEntry,
  buildDissentRecord,
  buildReviewReceipt,
  checkRevisionCeiling,
  createRevisionLedger,
  recordReviewInLedger,
  terminalReviewDecision,
} from "./dissent.revision.contract";
import type {
  MaoDefectClass,
  MaoDefectEntry,
  MaoDissentRecord,
  MaoReviewDecision,
  MaoReviewReceipt,
  MaoRevisionLedger,
  MaoReviewTerminalDecision,
} from "./dissent.revision.contract";
import {
  buildSessionSyncProjection,
  checkCommitAuthorization,
  makeIntegrationDecision,
} from "./closer.interlock.contract";
import type {
  MaoIntegrationReceipt,
  MaoSessionSyncProjection,
} from "./closer.interlock.contract";

// --- Types ---

export interface MaoOperationalReviewRequest {
  taskId: string;
  sourceManifest: readonly string[];
  workerOutputPaths: readonly string[];
  workerIdentity: string;
  reviewerIdentity: string;
  evidenceItems: readonly string[];
  decision: MaoReviewDecision;
  defectClass?: MaoDefectClass;
  defectDetail?: string;
  repairOwner?: string | null;
  ledger: MaoRevisionLedger;
  builtAt: string;
}

export type MaoOperationalReviewFailureReason =
  | "ISOLATED_EVIDENCE_REJECTED"
  | "INVALID_REVIEW_INPUT"
  | "REVISION_LEDGER_REJECTED";

export interface MaoOperationalReviewFailure {
  ok: false;
  reason: MaoOperationalReviewFailureReason;
  detail: string;
}

export interface MaoOperationalReviewSuccess {
  ok: true;
  packet: MaoIsolatedSourcePacket;
  evidence: MaoRecomputedEvidence;
  defect: MaoDefectEntry | null;
  dissent: MaoDissentRecord | null;
  receipt: MaoReviewReceipt;
  terminal: MaoReviewTerminalDecision;
  ledger: MaoRevisionLedger;
}

export type MaoOperationalReviewResult = MaoOperationalReviewFailure | MaoOperationalReviewSuccess;

export interface MaoOperationalClosureRequest {
  taskGraphId: string;
  reviews: readonly MaoReviewReceipt[];
  designatedCloserIds: readonly string[];
  actingCloserId: string;
  acceptedOutputs: readonly string[];
  rejectedOutputs: readonly string[];
  finalChangedSet: readonly string[];
  recordedAt: string;
  /** Non-empty only after a real material commit has actually happened; this class never creates one. */
  materialCommitRef?: string | null;
  sessionSurfacePaths?: readonly string[];
}

export type MaoOperationalClosureFailureReason =
  | "CLOSER_COUNT_OR_IDENTITY_FAILURE"
  | "NON_TERMINAL_REVIEW"
  | "COMMIT_AUTHORIZATION_REJECTED"
  | "MATERIAL_SESSION_PATH_OVERLAP";

export interface MaoOperationalClosureFailure {
  ok: false;
  reason: MaoOperationalClosureFailureReason;
  detail: string;
}

export interface MaoOperationalClosureSuccess {
  ok: true;
  integration: MaoIntegrationReceipt;
  /** True only when the actor invoking this composition owner is the designated closer; never an actual commit-steward invocation. */
  commitAuthorized: boolean;
  /** null until a non-empty materialCommitRef is supplied by the caller; this class performs no session mutation either way. */
  sessionProjection: MaoSessionSyncProjection | null;
}

export type MaoOperationalClosureResult = MaoOperationalClosureFailure | MaoOperationalClosureSuccess;

// --- Review convergence ---

/**
 * Bounded local composition owner over the existing MAO-T4 reviewer
 * isolation, MAO-T4 dissent/revision, and MAO-T5 closer interlock
 * contracts. Holds no global/singleton state; every method is a pure
 * composition of its injected/caller-supplied inputs, so this class is
 * safe to reconstruct freely between calls.
 */
export class MaoOperationalReviewConvergence {
  /**
   * Build an isolated reviewer source packet (excluding worker outputs),
   * recompute independent evidence against it (failing closed on
   * self-approval, tainted evidence, or empty evidence), build a
   * deterministic defect/dissent/review receipt for the caller's decision,
   * record that receipt in the caller's revision ledger under the
   * ceiling, and return the terminal decision after ceiling escalation is
   * applied.
   */
  review(request: MaoOperationalReviewRequest): MaoOperationalReviewResult {
    const packet = buildIsolatedSourcePacket(request.sourceManifest, request.workerOutputPaths, request.builtAt);

    const evidenceResult = buildRecomputedEvidence(
      packet,
      request.reviewerIdentity,
      request.workerIdentity,
      request.evidenceItems,
      request.workerOutputPaths,
      request.builtAt,
    );
    if (!evidenceResult.evidence) {
      return {
        ok: false,
        reason: "ISOLATED_EVIDENCE_REJECTED",
        detail: evidenceResult.error ?? "reviewer evidence was rejected for an unspecified reason",
      };
    }
    const evidence = evidenceResult.evidence;

    if (request.decision === "REQUEST_REPAIR" && (!request.repairOwner || request.repairOwner.trim().length === 0)) {
      return {
        ok: false,
        reason: "INVALID_REVIEW_INPUT",
        detail: "REQUEST_REPAIR requires a non-empty repairOwner",
      };
    }

    let defect: MaoDefectEntry | null = null;
    let dissent: MaoDissentRecord | null = null;
    if (request.defectClass && request.defectDetail) {
      defect = buildDefectEntry(request.defectClass, request.defectDetail, request.repairOwner ?? null);
      dissent = buildDissentRecord(request.taskId, request.reviewerIdentity, request.defectClass, request.defectDetail, request.builtAt);
    }

    const nextRevision = request.ledger.receipts.length === 0 ? 0 : request.ledger.currentRevision + 1;

    const receipt = buildReviewReceipt({
      taskId: request.taskId,
      isolatedSourcePacketHash: evidence.packetHash,
      recomputedEvidence: evidence.evidenceItems,
      defects: defect ? [defect] : [],
      dissent: dissent ? dissent.dissentId : null,
      decision: request.decision,
      repairOwner: request.repairOwner ?? null,
      revisionNumber: nextRevision,
      recordedAt: request.builtAt,
    });

    const recordResult = recordReviewInLedger(request.ledger, receipt);
    if (!recordResult.ok) {
      return {
        ok: false,
        reason: "REVISION_LEDGER_REJECTED",
        detail: recordResult.reason,
      };
    }

    // Evaluate the ceiling against the ledger's post-record revision count
    // (how many revisions, including this one, have now been recorded),
    // not the pre-record count, so a repair recorded exactly at
    // maxRevisionDepth is the one that trips escalation rather than the
    // one after it.
    const ceilingCheck = checkRevisionCeiling(recordResult.ledger.currentRevision, request.ledger.maxRevisionDepth);
    const terminal = terminalReviewDecision(receipt, ceilingCheck);

    return {
      ok: true,
      packet,
      evidence,
      defect,
      dissent,
      receipt,
      terminal,
      ledger: recordResult.ledger,
    };
  }

  /**
   * Converge a collection of terminal review receipts into one closer
   * integration decision, then evaluate commit authorization and (only
   * when a real material commit ref is supplied) a session-sync
   * projection. Never invokes git, commit steward, or a session-state
   * generator; the returned authorization/projection are typed plans, not
   * proof that any external action occurred.
   */
  converge(request: MaoOperationalClosureRequest): MaoOperationalClosureResult {
    const nonTerminal = request.reviews.find(
      (review) => review.decision === "REQUEST_REPAIR" || review.decision === "ESCALATE",
    );
    if (nonTerminal) {
      return {
        ok: false,
        reason: "NON_TERMINAL_REVIEW",
        detail: `integration blocked by non-terminal review decision ${nonTerminal.decision} for task ${nonTerminal.taskId}`,
      };
    }

    if (request.designatedCloserIds.length !== 1 || request.designatedCloserIds[0].trim().length === 0) {
      return {
        ok: false,
        reason: "CLOSER_COUNT_OR_IDENTITY_FAILURE",
        detail: `authority envelope must designate exactly one non-empty closer; received ${request.designatedCloserIds.length}`,
      };
    }
    const designatedCloserId = request.designatedCloserIds[0];

    const integrationResult = makeIntegrationDecision(
      request.reviews,
      request.actingCloserId,
      designatedCloserId,
      request.taskGraphId,
      request.acceptedOutputs,
      request.rejectedOutputs,
      request.finalChangedSet,
      request.recordedAt,
    );
    if (!integrationResult.receipt) {
      return {
        ok: false,
        reason: "CLOSER_COUNT_OR_IDENTITY_FAILURE",
        detail: integrationResult.error ?? "closer identity or review-collection validation failed",
      };
    }

    const commitCheck = checkCommitAuthorization(request.actingCloserId, designatedCloserId);
    if (!commitCheck.authorized) {
      return {
        ok: false,
        reason: "COMMIT_AUTHORIZATION_REJECTED",
        detail: commitCheck.reason,
      };
    }

    const materialCommitRef = request.materialCommitRef ?? null;
    const sessionSurfacePaths = request.sessionSurfacePaths ?? [];

    if (materialCommitRef && materialCommitRef.trim().length > 0) {
      const overlap = request.finalChangedSet.find((path) => sessionSurfacePaths.includes(path));
      if (overlap) {
        return {
          ok: false,
          reason: "MATERIAL_SESSION_PATH_OVERLAP",
          detail: `material changed-set path "${overlap}" also appears in session surface paths; material and session changed sets must be disjoint`,
        };
      }
    }

    const sessionProjection =
      materialCommitRef && materialCommitRef.trim().length > 0
        ? buildSessionSyncProjection(materialCommitRef, sessionSurfacePaths)
        : null;

    return {
      ok: true,
      integration: integrationResult.receipt,
      commitAuthorized: true,
      sessionProjection,
    };
  }
}

export function createMaoOperationalReviewConvergence(): MaoOperationalReviewConvergence {
  return new MaoOperationalReviewConvergence();
}
