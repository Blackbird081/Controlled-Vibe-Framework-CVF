// CVF MAO-T8 - Representative End-To-End Pilot Harness
//
// Implements the selected pilot task `MAO-T8-LOCAL-STALE-READOUT-REPAIR` per
// `docs/reviews/CVF_MAO_T8_REPRESENTATIVE_PILOT_SELECTION_CHECKPOINT_2026-07-11.md`:
// one worker produces an operator evidence readout from seeded receipts, an
// independent reviewer detects a deliberately stale readout, one classified
// revision regenerates the readout, and one designated closer accepts only a
// consistent terminal receipt chain. This module composes existing MAO-T1
// through T7 contracts (task graph, event ledger, reviewer isolation,
// dissent/revision, closer interlock, lifecycle controller, evidence/
// readout) without redefining their semantics. Local execution-plane
// module only; no provider, network, queue, UI, or workspace/session state
// mutation. Deterministic local contract proof only
// (`DETERMINISTIC_LOCAL_CONTRACT_PROOF`, `NO_PROVIDER_LOCAL_ONLY`).

import type { MaoTaskGraph, MaoTaskGraphInput, MaoGraphCompileResult } from "./task.graph.contract";
import { compileTaskGraph } from "./task.graph.contract";
import { checkSelfApproval, buildIsolatedSourcePacket, verifyIsolatedSourcePacket } from "./reviewer.isolation.contract";
import type { MaoSelfApprovalCheck, MaoIsolatedSourcePacket } from "./reviewer.isolation.contract";
import {
  buildReviewReceipt,
  checkRevisionCeiling,
  createRevisionLedger,
  recordReviewInLedger,
  terminalReviewDecision,
} from "./dissent.revision.contract";
import type { MaoReviewReceipt, MaoRevisionLedger, MaoReviewTerminalDecision } from "./dissent.revision.contract";
import {
  checkCloserIdentity,
  makeIntegrationDecision,
} from "./closer.interlock.contract";
import type { MaoIntegrationReceipt } from "./closer.interlock.contract";
import { createDeterministicClock, detectTimeout, createCancelTracker, requestCancel, acceptCancel, mayStartNewChild, createIdempotencyGuard } from "./lifecycle.controller.contract";
import type { MaoDeterministicClock, MaoCancelTracker } from "./lifecycle.controller.contract";
import {
  MaoEvidenceLedger,
  buildEvidenceReadout,
  classifyReadoutFreshness,
} from "./evidence.readout.contract";
import type { MaoEvidenceReadout } from "./evidence.readout.contract";

// --- Pilot identities and constants ---

export const PILOT_TASK_ID = "MAO-T8-LOCAL-STALE-READOUT-REPAIR";
export const PILOT_WORKER_IDENTITY = "mao-t8-pilot-worker";
export const PILOT_REVIEWER_IDENTITY = "mao-t8-pilot-reviewer";
export const PILOT_CLOSER_IDENTITY = "mao-t8-pilot-closer";
export const PILOT_TASK_GRAPH_ID = "mao-t8-pilot-graph";
export const PILOT_STALE_AFTER_MS = 60_000;
export const PILOT_MAX_REVISION_DEPTH = 1;

// --- Pilot task graph compilation ---

/**
 * Compile the pilot's two-task graph (worker, reviewer) with a budget whose
 * `maxConcurrentRoles` sits at the pilot ceiling. Callers that want the
 * negative budget-ceiling scenario should pass `maxConcurrentRoles` above
 * the ceiling instead; `compileTaskGraph` (MAO-T1) rejects it with
 * `BUDGET_CONCURRENCY_EXCEEDS_CEILING` before any task executes.
 */
export function compilePilotGraph(maxConcurrentRoles: number): MaoGraphCompileResult {
  const input: MaoTaskGraphInput = {
    authority: {
      workOrderId: "MAO-T8-REPRESENTATIVE-PILOT",
      route: "MULTI_AGENT_MULTI_ROLE",
      riskLevel: "R1",
      budget: {
        maxInvocations: 4,
        maxConcurrentRoles,
        maxRevisionDepth: PILOT_MAX_REVISION_DEPTH,
        tokenCostCeiling: null,
        wallClockCeilingMs: null,
      },
      closerActorId: PILOT_CLOSER_IDENTITY,
      approvalCheckpoints: [],
    },
    tasks: [
      { taskId: "worker-task", role: "worker", riskLevel: "R1", fileScope: ["pilot/readout.json"] },
      { taskId: "reviewer-task", role: "reviewer", riskLevel: "R1", fileScope: ["pilot/review.json"] },
    ],
    dependencyManifest: [
      { taskId: "worker-task", dependsOn: [] },
      { taskId: "reviewer-task", dependsOn: ["worker-task"] },
    ],
  };
  return compileTaskGraph(input);
}

// --- Worker phase: seed receipts and produce a readout ---

export interface MaoPilotSeedReceipt {
  taskId: string | null;
  receiptKind: "GRAPH" | "ROLE_RESOLUTION" | "INVOCATION" | "OUTPUT" | "REVIEW" | "INTEGRATION";
  fields: Readonly<Record<string, string>>;
  recordedAt: string;
}

/**
 * Worker phase: seed a fresh evidence ledger from the given receipts, in
 * order, then build a readout at `generatedAt`. The pilot's stale scenario
 * is produced by the caller passing a `generatedAt` far past the last
 * receipt's `recordedAt`; this function performs no staleness judgment
 * itself, matching the read-model discipline that readout construction is a
 * pure fold, never a policy decision.
 */
export function runWorkerPhase(
  seedReceipts: readonly MaoPilotSeedReceipt[],
  generatedAt: string,
): { ledger: MaoEvidenceLedger; readout: MaoEvidenceReadout } {
  const ledger = new MaoEvidenceLedger(PILOT_TASK_GRAPH_ID);
  for (const receipt of seedReceipts) {
    ledger.ingest({
      taskGraphId: PILOT_TASK_GRAPH_ID,
      taskId: receipt.taskId,
      receiptKind: receipt.receiptKind,
      fields: receipt.fields,
      recordedAt: receipt.recordedAt,
    });
  }
  const readout = buildEvidenceReadout(ledger, generatedAt);
  return { ledger, readout };
}

// --- Reviewer phase: isolated recomputation and freshness verdict ---

export interface MaoPilotReviewOutcome {
  readonly isolatedPacket: MaoIsolatedSourcePacket;
  readonly selfApprovalCheck: MaoSelfApprovalCheck;
  readonly recomputedFreshness: "CURRENT" | "STALE" | "NO_EVIDENCE_YET";
  readonly receipt: MaoReviewReceipt;
  readonly terminal: MaoReviewTerminalDecision;
}

/**
 * Reviewer phase: build an isolated source packet excluding the worker's
 * readout output path, run the self-approval guard (MAO-T4), independently
 * recompute freshness from the ledger (MAO-T7's `classifyReadoutFreshness`,
 * never trusting the worker's readout content as a freshness claim), and
 * record a review receipt through the bounded revision ledger (MAO-T4's
 * `checkRevisionCeiling`). `workerOutputPath` is excluded from the reviewer
 * source manifest so worker output can never become reviewer authority, per
 * the Threat And Failure Model "Self-approval" row.
 */
export function runReviewerPhase(
  ledger: MaoEvidenceLedger,
  readout: MaoEvidenceReadout,
  reviewerEvaluatedAt: string,
  revisionLedger: MaoRevisionLedger,
  revisionNumber: number,
  recordedAt: string,
  workerIdentity: string = PILOT_WORKER_IDENTITY,
  reviewerIdentity: string = PILOT_REVIEWER_IDENTITY,
): { outcome: MaoPilotReviewOutcome | null; ledgerResult: ReturnType<typeof recordReviewInLedger> | null; error: string | null } {
  const selfApprovalCheck = checkSelfApproval(workerIdentity, reviewerIdentity);
  if (!selfApprovalCheck.ok) {
    return { outcome: null, ledgerResult: null, error: selfApprovalCheck.reason ?? "self-approval rejected" };
  }

  const workerOutputPath = "pilot/readout.json";
  const isolatedPacket = buildIsolatedSourcePacket(
    ["pilot/receipts.json", workerOutputPath],
    [workerOutputPath],
    reviewerEvaluatedAt,
  );
  if (!verifyIsolatedSourcePacket(isolatedPacket)) {
    return { outcome: null, ledgerResult: null, error: "isolated source packet failed self-verification" };
  }

  // Independent recomputation: the reviewer never reads `readout.generatedAt`
  // as a freshness claim; it recomputes freshness itself from the same
  // ledger the worker used, at the reviewer's own evaluation time.
  const recomputedReadout = buildEvidenceReadout(ledger, reviewerEvaluatedAt);
  const recomputedFreshness = classifyReadoutFreshness(recomputedReadout, PILOT_STALE_AFTER_MS, reviewerEvaluatedAt);

  const decision = recomputedFreshness === "CURRENT" ? "ACCEPT" : "REQUEST_REPAIR";
  const receipt = buildReviewReceipt({
    taskId: "worker-task",
    isolatedSourcePacketHash: isolatedPacket.packetHash,
    recomputedEvidence: [`recomputedFreshness=${recomputedFreshness}`, `totalReceipts=${recomputedReadout.totalReceipts}`],
    decision,
    repairOwner: decision === "REQUEST_REPAIR" ? workerIdentity : null,
    dissent: decision === "REQUEST_REPAIR" ? `readout classified ${recomputedFreshness} at reviewer evaluation time` : null,
    revisionNumber,
    recordedAt,
  });

  const ceilingCheck = checkRevisionCeiling(revisionLedger.currentRevision, revisionLedger.maxRevisionDepth);
  const terminal = terminalReviewDecision(receipt, ceilingCheck);
  const ledgerResult = recordReviewInLedger(revisionLedger, receipt);

  return {
    outcome: { isolatedPacket, selfApprovalCheck, recomputedFreshness, receipt, terminal },
    ledgerResult,
    error: null,
  };
}

// --- Closer phase ---

export interface MaoPilotCloseOutcome {
  readonly receipt: MaoIntegrationReceipt | null;
  readonly error: string | null;
}

/**
 * Closer phase: validate closer identity (MAO-T5) and build the terminal
 * integration receipt from the collected review receipts. Only reviews with
 * a terminal ACCEPT/REJECT decision may reach this phase; a lingering
 * REQUEST_REPAIR or ESCALATE is rejected by `makeIntegrationDecision`
 * itself (MAO-T5's non-terminal-review guard), so the closer can never
 * accept a chain with unresolved revision state.
 */
export function runCloserPhase(
  reviews: readonly MaoReviewReceipt[],
  closerActorId: string,
  designatedCloserId: string,
  recordedAt: string,
): MaoPilotCloseOutcome {
  const identityCheck = checkCloserIdentity(closerActorId, designatedCloserId);
  if (!identityCheck.ok) {
    return { receipt: null, error: identityCheck.reason };
  }

  const result = makeIntegrationDecision(
    reviews,
    closerActorId,
    designatedCloserId,
    PILOT_TASK_GRAPH_ID,
    ["pilot/readout.json"],
    [],
    ["pilot/readout.json", "pilot/review.json"],
    recordedAt,
  );
  return { receipt: result.receipt, error: result.error };
}

// --- Negative scenario: duplicate execution/admission ---

export interface MaoPilotDuplicateResult {
  readonly firstClaim: boolean;
  readonly secondClaim: boolean;
  readonly duplicateRejectedWithoutSideEffect: boolean;
}

/**
 * Prove duplicate admission is rejected without a duplicate side effect:
 * the same idempotency key can only be claimed once (MAO-T6's
 * `createIdempotencyGuard`). The pilot's "side effect" proxy is the guard's
 * internal claim set; a second claim attempt must return false and must not
 * grow that set a second time (verified by the caller reusing the same
 * guard instance and observing `seen` stays true after the rejected call).
 */
export function runDuplicateAdmissionNegative(idempotencyKey: string): MaoPilotDuplicateResult {
  const guard = createIdempotencyGuard();
  const firstClaim = guard.claim(idempotencyKey);
  const secondClaim = guard.claim(idempotencyKey);
  return {
    firstClaim,
    secondClaim,
    duplicateRejectedWithoutSideEffect: firstClaim === true && secondClaim === false && guard.seen(idempotencyKey),
  };
}

// --- Negative scenario: timeout ---

export interface MaoPilotTimeoutResult {
  readonly clock: MaoDeterministicClock;
  readonly timedOut: boolean;
  readonly inferredSuccess: false;
}

/**
 * Prove timeout is a classified terminal result, never an inferred success
 * (MAO-T6's `detectTimeout`). `inferredSuccess` is always the literal
 * `false`: this function never derives a success state from the timeout
 * check, matching the Idempotency/Retry/Cancel/Recovery rule that orphan
 * and timeout handling "never infers success from silence."
 */
export function runTimeoutNegative(startIso: string, ceilingMs: number, advanceMs: number): MaoPilotTimeoutResult {
  const clock = createDeterministicClock(startIso);
  clock.advance(advanceMs);
  const result = detectTimeout(startIso, ceilingMs, clock);
  return { clock, timedOut: result.timedOut, inferredSuccess: false };
}

// --- Negative scenario: cancel blocks new children ---

export interface MaoPilotCancelResult {
  readonly tracker: MaoCancelTracker;
  readonly mayStartAfterAccept: boolean;
}

/**
 * Prove cooperative cancel blocks further child admission once accepted
 * (MAO-T6's cancel lifecycle). After `acceptCancel`, `mayStartNewChild`
 * must be false.
 */
export function runCancelNegative(taskId: string, startIso: string): MaoPilotCancelResult {
  const clock = createDeterministicClock(startIso);
  let tracker = createCancelTracker(taskId);
  tracker = requestCancel(tracker, clock);
  tracker = acceptCancel(tracker, clock);
  return { tracker, mayStartAfterAccept: mayStartNewChild(tracker) };
}

// --- Negative scenario: budget ceiling ---

export interface MaoPilotBudgetResult {
  readonly compileResult: MaoGraphCompileResult;
  readonly rejectedBeforeExecution: boolean;
}

/**
 * Prove a graph whose `maxConcurrentRoles` exceeds the pilot ceiling is
 * rejected at compile time, before any task executes (MAO-T1's
 * `compileTaskGraph` `BUDGET_CONCURRENCY_EXCEEDS_CEILING` reason).
 */
export function runBudgetCeilingNegative(overCeilingMaxConcurrentRoles: number): MaoPilotBudgetResult {
  const compileResult = compilePilotGraph(overCeilingMaxConcurrentRoles);
  const rejectedBeforeExecution =
    !compileResult.ok && compileResult.reason === "BUDGET_CONCURRENCY_EXCEEDS_CEILING";
  return { compileResult, rejectedBeforeExecution };
}

// --- Full pilot chain orchestration ---

export interface MaoPilotChainResult {
  readonly graph: MaoTaskGraph | null;
  readonly compileResult: MaoGraphCompileResult;
  readonly initialReadout: MaoEvidenceReadout;
  readonly initialFreshness: "CURRENT" | "STALE" | "NO_EVIDENCE_YET";
  readonly firstReview: MaoPilotReviewOutcome;
  readonly revisedReadout: MaoEvidenceReadout | null;
  readonly revisedFreshness: "CURRENT" | "STALE" | "NO_EVIDENCE_YET" | null;
  readonly secondReview: MaoPilotReviewOutcome | null;
  readonly closeOutcome: MaoPilotCloseOutcome | null;
  readonly revisionCount: number;
}

/**
 * Run the full representative pilot chain: compile the graph, seed
 * receipts, produce a deliberately stale initial readout, run an
 * independent review that detects the staleness and requests exactly one
 * repair, regenerate the readout fresh, run a second independent review
 * that accepts it, then close. Returns every intermediate artifact so
 * tests can assert on each phase without re-deriving pilot state.
 */
export function runPilotChain(
  seedReceipts: readonly MaoPilotSeedReceipt[],
  staleGeneratedAt: string,
  reviewerEvaluatedAt: string,
  revisedGeneratedAt: string,
  secondReviewerEvaluatedAt: string,
  closeRecordedAt: string,
): MaoPilotChainResult {
  const compileResult = compilePilotGraph(3);
  const graph = compileResult.ok ? compileResult.graph : null;

  const { ledger, readout: initialReadout } = runWorkerPhase(seedReceipts, staleGeneratedAt);
  const initialFreshness = classifyReadoutFreshness(initialReadout, PILOT_STALE_AFTER_MS, staleGeneratedAt);

  let revisionLedger = createRevisionLedger(PILOT_MAX_REVISION_DEPTH);
  const firstReviewResult = runReviewerPhase(ledger, initialReadout, reviewerEvaluatedAt, revisionLedger, 0, reviewerEvaluatedAt);
  if (!firstReviewResult.outcome || !firstReviewResult.ledgerResult) {
    throw new Error(firstReviewResult.error ?? "pilot chain: first review phase failed unexpectedly");
  }
  const firstReview = firstReviewResult.outcome;
  if (firstReviewResult.ledgerResult.ok) {
    revisionLedger = firstReviewResult.ledgerResult.ledger;
  }

  let revisedReadout: MaoEvidenceReadout | null = null;
  let revisedFreshness: "CURRENT" | "STALE" | "NO_EVIDENCE_YET" | null = null;
  let secondReview: MaoPilotReviewOutcome | null = null;
  let closeOutcome: MaoPilotCloseOutcome | null = null;

  if (firstReview.terminal.decision === "REQUEST_REPAIR") {
    const firstReviewMs = new Date(reviewerEvaluatedAt).getTime();
    const revisedAtMs = new Date(revisedGeneratedAt).getTime();
    const secondReviewMs = new Date(secondReviewerEvaluatedAt).getTime();
    if (!Number.isFinite(firstReviewMs) || !Number.isFinite(revisedAtMs) || !Number.isFinite(secondReviewMs)) {
      throw new Error("pilot chain: revision timestamps must be valid ISO timestamps");
    }
    if (revisedAtMs < firstReviewMs || secondReviewMs < revisedAtMs) {
      throw new Error("pilot chain: revision and second review timestamps must be monotonic");
    }

    // Exactly one classified revision: record the worker's repaired output as
    // new evidence, regenerate the readout, then re-review. Merely moving the
    // evaluation clock backwards would create a false freshness proof.
    const revisionEvidence = ledger.ingest({
      taskGraphId: PILOT_TASK_GRAPH_ID,
      taskId: "worker-task",
      receiptKind: "OUTPUT",
      fields: { revision: "1", repair: "fresh-readout-regenerated" },
      recordedAt: revisedGeneratedAt,
    });
    if (!revisionEvidence.ok) {
      throw new Error(`pilot chain: revision evidence rejected: ${revisionEvidence.reason}`);
    }
    revisedReadout = buildEvidenceReadout(ledger, revisedGeneratedAt);
    revisedFreshness = classifyReadoutFreshness(revisedReadout, PILOT_STALE_AFTER_MS, secondReviewerEvaluatedAt);

    const secondReviewResult = runReviewerPhase(
      ledger,
      revisedReadout,
      secondReviewerEvaluatedAt,
      revisionLedger,
      1,
      secondReviewerEvaluatedAt,
    );
    if (!secondReviewResult.outcome) {
      throw new Error(secondReviewResult.error ?? "pilot chain: second review phase failed unexpectedly");
    }
    secondReview = secondReviewResult.outcome;

    if (secondReview.terminal.decision === "ACCEPT") {
      closeOutcome = runCloserPhase([secondReview.receipt], PILOT_CLOSER_IDENTITY, PILOT_CLOSER_IDENTITY, closeRecordedAt);
    }
  } else if (firstReview.terminal.decision === "ACCEPT") {
    closeOutcome = runCloserPhase([firstReview.receipt], PILOT_CLOSER_IDENTITY, PILOT_CLOSER_IDENTITY, closeRecordedAt);
  }

  return {
    graph,
    compileResult,
    initialReadout,
    initialFreshness,
    firstReview,
    revisedReadout,
    revisedFreshness,
    secondReview,
    closeOutcome,
    revisionCount: secondReview ? 1 : 0,
  };
}
