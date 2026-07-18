// CVF MAO-LIVE-T1 - Live Provider Adapter Value Pilot Bridge
//
// Thin bridge mapping ONE existing Model Gateway live proof call
// (`runLiveProof` in `EXTENSIONS/CVF_MODEL_GATEWAY/src/p4b-b-live-proof-harness.ts`)
// into MAO invocation-receipt and representative-pilot-chain vocabulary, per
// `docs/roadmaps/CVF_MAO_LIVE_PROVIDER_ADAPTER_VALUE_PILOT_ROADMAP_2026-07-12.md`
// and the MAO-LIVE-T1 work order. This module does NOT implement a new
// provider HTTP client, a new credential resolver, or a new bridge; it
// reuses the existing Model Gateway harness for every network call and
// reuses existing MAO-T1/T4/T5/T7/T8 contracts for review/revision/closer
// mechanics. It adds only: (1) a fixed deterministic task/rubric shared by
// both lanes, (2) a local, deterministic, secret-safe scorer (no second
// live call is spent on "review" - the reviewer independently recomputes
// the score from the same received text, never a live judge call), and
// (3) a comparison structure between one direct call and one governed MAO
// chain. Secret safety: this module never accepts, stores, or returns a
// raw key; it only ever sees already-redacted receipt fields and response
// text/usage counts from the Model Gateway harness result.

import type { GatewayExecuteRequest } from "../../../CVF_MODEL_GATEWAY/src/unified-gateway-interface-contract";
import type { CredentialReference } from "../../../CVF_MODEL_GATEWAY/src/credential-boundary";
import type {
  LiveProofFetch,
  HarnessRunResult,
} from "../../../CVF_MODEL_GATEWAY/src/p4b-b-live-proof-harness";
import { runLiveProof } from "../../../CVF_MODEL_GATEWAY/src/p4b-b-live-proof-harness";
import {
  checkSelfApproval,
  buildIsolatedSourcePacket,
} from "./reviewer.isolation.contract";
import {
  buildReviewReceipt,
  checkRevisionCeiling,
  createRevisionLedger,
  recordReviewInLedger,
  terminalReviewDecision,
} from "./dissent.revision.contract";
import type { MaoReviewReceipt } from "./dissent.revision.contract";
import { checkCloserIdentity, makeIntegrationDecision } from "./closer.interlock.contract";
import type { MaoIntegrationReceipt } from "./closer.interlock.contract";
import { MaoEvidenceLedger, buildEvidenceReadout } from "./evidence.readout.contract";

// --- Shared task and identities ---

export const LIVE_PILOT_TASK_ID = "MAO-LIVE-T1-PROVIDER-VALUE-PILOT";
export const LIVE_PILOT_WORKER_IDENTITY = "mao-live-t1-worker";
export const LIVE_PILOT_REVIEWER_IDENTITY = "mao-live-t1-reviewer";
export const LIVE_PILOT_CLOSER_IDENTITY = "mao-live-t1-closer";
export const LIVE_PILOT_TASK_GRAPH_ID = "mao-live-t1-graph";
export const LIVE_PILOT_MAX_REVISION_DEPTH = 1;
export const LIVE_PILOT_MAX_LIVE_CALLS = 4;

/**
 * Fixed deterministic task shared by both the direct lane and the MAO lane.
 * The instruction is objectively gradable without a second (judge) live
 * call: the rubric checks for the exact required tokens and a length
 * ceiling, not subjective quality.
 */
export const LIVE_PILOT_TASK_PROMPT =
  "List exactly three prime numbers between 10 and 20, separated by commas, and output nothing else.";
export const LIVE_PILOT_EXPECTED_TOKENS: readonly string[] = ["11", "13", "17", "19"];
export const LIVE_PILOT_REQUIRED_MATCH_COUNT = 3;
export const LIVE_PILOT_MAX_RESPONSE_LENGTH = 120;

// --- Deterministic, secret-safe rubric ---

export interface MaoLiveRubricScore {
  readonly score: number;
  readonly maxScore: number;
  readonly matchedTokens: readonly string[];
  readonly withinLengthCeiling: boolean;
  readonly nonEmpty: boolean;
  readonly passed: boolean;
}

/**
 * Score response text against the fixed rubric. Deterministic and
 * secret-safe: operates only on already-received response text, never on
 * any credential or raw request/response payload. Used identically by the
 * direct-lane grader and the MAO-lane reviewer so both lanes are graded on
 * the same rubric, per the roadmap's "same task/rubric" acceptance
 * criterion.
 */
export function scoreAgainstRubric(responseText: string): MaoLiveRubricScore {
  const trimmed = responseText.trim();
  const nonEmpty = trimmed.length > 0;
  const withinLengthCeiling = trimmed.length <= LIVE_PILOT_MAX_RESPONSE_LENGTH;
  const matchedTokens = LIVE_PILOT_EXPECTED_TOKENS.filter((token) =>
    new RegExp(`\\b${token}\\b`).test(trimmed),
  );
  const maxScore = 100;
  let score = 0;
  if (nonEmpty) score += 10;
  if (withinLengthCeiling) score += 10;
  score += Math.round((matchedTokens.length / LIVE_PILOT_REQUIRED_MATCH_COUNT) * 80);
  score = Math.min(score, maxScore);
  const passed =
    nonEmpty && withinLengthCeiling && matchedTokens.length >= LIVE_PILOT_REQUIRED_MATCH_COUNT;
  return Object.freeze({
    score,
    maxScore,
    matchedTokens: Object.freeze([...matchedTokens]),
    withinLengthCeiling,
    nonEmpty,
    passed,
  });
}

// --- Live call diagnostics (secret-safe) ---

export type MaoLiveCallDiagnosticClass =
  | "CREDENTIAL_ABSENT"
  | "ENDPOINT_ABSENT"
  | "PROVIDER_ERROR"
  | "MALFORMED_OUTPUT"
  | "TRANSPORT_ERROR"
  | "DRY_RUN_NOT_AUTHORIZED";

export interface MaoLiveCallDiagnostic {
  readonly stage: "live_call";
  readonly class: MaoLiveCallDiagnosticClass;
  readonly retryable: boolean;
  readonly userAction: string;
  readonly message: string;
}

function classifyLiveCallError(error: unknown): MaoLiveCallDiagnostic {
  const message = error instanceof Error ? error.message.split(":")[0] ?? "live_call_error" : "live_call_unknown_error";
  if (message.includes("live_proof_credential_absent")) {
    return {
      stage: "live_call",
      class: "CREDENTIAL_ABSENT",
      retryable: false,
      userAction: "confirm an approved key alias is present before retrying",
      message,
    };
  }
  if (message.includes("live_proof_endpoint_absent")) {
    return {
      stage: "live_call",
      class: "ENDPOINT_ABSENT",
      retryable: false,
      userAction: "supply an endpoint or a supported providerId before retrying",
      message,
    };
  }
  if (message.includes("live_proof_provider_error")) {
    return {
      stage: "live_call",
      class: "PROVIDER_ERROR",
      retryable: true,
      userAction: "inspect provider status code before any retry",
      message,
    };
  }
  return {
    stage: "live_call",
    class: "TRANSPORT_ERROR",
    retryable: true,
    userAction: "diagnose transport failure before any retry",
    message,
  };
}

// --- Live call ledger (enforces the four-call ceiling) ---

/**
 * Tracks how many live calls have been spent across the whole comparative
 * run. Every call site in this module must claim a slot before invoking
 * `runLiveProof`; `claim()` throws once the ceiling is reached so the
 * ceiling is enforced at the call boundary, not only by external counting.
 */
export class MaoLiveCallLedger {
  private spent = 0;
  private readonly ceiling: number;

  constructor(ceiling: number = LIVE_PILOT_MAX_LIVE_CALLS) {
    this.ceiling = ceiling;
  }

  claim(label: string): void {
    if (this.spent >= this.ceiling) {
      throw new Error(
        `live_call_ceiling_exceeded: attempted call "${label}" after ${this.spent}/${this.ceiling} calls already spent`,
      );
    }
    this.spent += 1;
  }

  get spentCount(): number {
    return this.spent;
  }

  get remaining(): number {
    return this.ceiling - this.spent;
  }
}

// --- Direct lane ---

export interface MaoLiveDirectLaneResult {
  readonly ok: boolean;
  readonly latencyMs: number;
  readonly responseText: string | null;
  readonly usage: { inputTokens: number; outputTokens: number } | null;
  readonly rubric: MaoLiveRubricScore | null;
  readonly diagnostic: MaoLiveCallDiagnostic | null;
}

/**
 * Run the direct-lane baseline: exactly one live call through the existing
 * Model Gateway harness, graded by the same rubric used by the MAO lane.
 * Claims exactly one slot from `ledger`.
 */
export async function runDirectLane(params: {
  ledger: MaoLiveCallLedger;
  providerId: string;
  modelId: string;
  endpoint?: string;
  credentialReference: CredentialReference;
  env: Record<string, string | undefined>;
  fetchImpl?: LiveProofFetch;
  traceId: string;
}): Promise<MaoLiveDirectLaneResult> {
  params.ledger.claim("direct-lane-call");
  const request: GatewayExecuteRequest = {
    traceId: params.traceId,
    prompt: LIVE_PILOT_TASK_PROMPT,
    policy: {
      traceId: params.traceId,
      policyResult: "allow",
      reason: "mao_live_t1_direct_lane_allow",
      allowedProviderIds: [params.providerId],
    },
    routing: {
      traceId: params.traceId,
      preferredProviderId: params.providerId,
      requestedModelId: params.modelId,
      estimatedTokens: 32,
    },
  };
  const startedAt = Date.now();
  try {
    const result: HarnessRunResult = await runLiveProof(
      {
        providerId: params.providerId,
        modelId: params.modelId,
        method: "complete",
        credentialReference: params.credentialReference,
        env: params.env,
        endpoint: params.endpoint,
        fetchImpl: params.fetchImpl,
        liveAuthorized: true,
      },
      request,
    );
    const latencyMs = Date.now() - startedAt;
    if (!result.authorized) {
      return {
        ok: false,
        latencyMs,
        responseText: null,
        usage: null,
        rubric: null,
        diagnostic: {
          stage: "live_call",
          class: "DRY_RUN_NOT_AUTHORIZED",
          retryable: false,
          userAction: "set liveAuthorized=true before running the value pilot",
          message: result.diagnostic,
        },
      };
    }
    const text = result.bridgeResult.response?.text;
    if (typeof text !== "string" || text.length === 0) {
      const bridgeError = result.bridgeResult.error;
      return {
        ok: false,
        latencyMs,
        responseText: null,
        usage: result.bridgeResult.response?.usage ?? null,
        rubric: null,
        diagnostic: bridgeError
          ? {
              stage: "live_call",
              class: "PROVIDER_ERROR",
              retryable: bridgeError.retryable,
              userAction: "inspect governed bridge error class before any retry",
              message: bridgeError.errorClass,
            }
          : {
              stage: "live_call",
              class: "MALFORMED_OUTPUT",
              retryable: true,
              userAction: "inspect bridge error class before any retry",
              message: "empty_response_text",
            },
      };
    }
    return {
      ok: true,
      latencyMs,
      responseText: text,
      usage: result.bridgeResult.response?.usage ?? null,
      rubric: scoreAgainstRubric(text),
      diagnostic: null,
    };
  } catch (error: unknown) {
    return {
      ok: false,
      latencyMs: Date.now() - startedAt,
      responseText: null,
      usage: null,
      rubric: null,
      diagnostic: classifyLiveCallError(error),
    };
  }
}

// --- MAO lane (worker -> reviewer -> optional one revision -> closer) ---

export interface MaoLiveWorkerAttempt {
  readonly ok: boolean;
  readonly latencyMs: number;
  readonly responseText: string | null;
  readonly usage: { inputTokens: number; outputTokens: number } | null;
  readonly diagnostic: MaoLiveCallDiagnostic | null;
}

async function runMaoWorkerCall(params: {
  ledger: MaoLiveCallLedger;
  providerId: string;
  modelId: string;
  endpoint?: string;
  credentialReference: CredentialReference;
  env: Record<string, string | undefined>;
  fetchImpl?: LiveProofFetch;
  traceId: string;
  prompt: string;
  callLabel: string;
}): Promise<MaoLiveWorkerAttempt> {
  params.ledger.claim(params.callLabel);
  const request: GatewayExecuteRequest = {
    traceId: params.traceId,
    prompt: params.prompt,
    policy: {
      traceId: params.traceId,
      policyResult: "allow",
      reason: "mao_live_t1_worker_lane_allow",
      allowedProviderIds: [params.providerId],
    },
    routing: {
      traceId: params.traceId,
      preferredProviderId: params.providerId,
      requestedModelId: params.modelId,
      estimatedTokens: 32,
    },
  };
  const startedAt = Date.now();
  try {
    const result: HarnessRunResult = await runLiveProof(
      {
        providerId: params.providerId,
        modelId: params.modelId,
        method: "complete",
        credentialReference: params.credentialReference,
        env: params.env,
        endpoint: params.endpoint,
        fetchImpl: params.fetchImpl,
        liveAuthorized: true,
      },
      request,
    );
    const latencyMs = Date.now() - startedAt;
    if (!result.authorized) {
      return {
        ok: false,
        latencyMs,
        responseText: null,
        usage: null,
        diagnostic: {
          stage: "live_call",
          class: "DRY_RUN_NOT_AUTHORIZED",
          retryable: false,
          userAction: "set liveAuthorized=true before running the value pilot",
          message: result.diagnostic,
        },
      };
    }
    const text = result.bridgeResult.response?.text;
    if (typeof text !== "string" || text.length === 0) {
      const bridgeError = result.bridgeResult.error;
      return {
        ok: false,
        latencyMs,
        responseText: null,
        usage: result.bridgeResult.response?.usage ?? null,
        diagnostic: bridgeError
          ? {
              stage: "live_call",
              class: "PROVIDER_ERROR",
              retryable: bridgeError.retryable,
              userAction: "inspect governed bridge error class before any retry",
              message: bridgeError.errorClass,
            }
          : {
              stage: "live_call",
              class: "MALFORMED_OUTPUT",
              retryable: true,
              userAction: "inspect bridge error class before any retry",
              message: "empty_response_text",
            },
      };
    }
    return {
      ok: true,
      latencyMs,
      responseText: text,
      usage: result.bridgeResult.response?.usage ?? null,
      diagnostic: null,
    };
  } catch (error: unknown) {
    return {
      ok: false,
      latencyMs: Date.now() - startedAt,
      responseText: null,
      usage: null,
      diagnostic: classifyLiveCallError(error),
    };
  }
}

export interface MaoLiveReviewOutcome {
  readonly rubric: MaoLiveRubricScore;
  readonly receipt: MaoReviewReceipt;
  readonly decision: "ACCEPT" | "REQUEST_REPAIR" | "REJECT" | "ESCALATE";
}

/**
 * Independent reviewer: recomputes the rubric score from the worker's
 * received response text (never trusting a worker self-report), then
 * records a bounded review receipt. Performs no live call itself.
 */
function runMaoReviewPhase(
  responseText: string,
  revisionNumber: number,
  recordedAt: string,
  revisionLedgerState: ReturnType<typeof createRevisionLedger>,
): { outcome: MaoLiveReviewOutcome; ledgerResult: ReturnType<typeof recordReviewInLedger> } {
  const selfCheck = checkSelfApproval(LIVE_PILOT_WORKER_IDENTITY, LIVE_PILOT_REVIEWER_IDENTITY);
  if (!selfCheck.ok) {
    throw new Error(`mao_live_self_approval_rejected: ${selfCheck.reason}`);
  }
  const rubric = scoreAgainstRubric(responseText);
  const decision = rubric.passed ? "ACCEPT" : "REQUEST_REPAIR";
  const receipt = buildReviewReceipt({
    taskId: LIVE_PILOT_TASK_ID,
    isolatedSourcePacketHash: buildIsolatedSourcePacket(
      ["live-response-text"],
      [],
      recordedAt,
    ).packetHash,
    recomputedEvidence: [
      `rubricScore=${rubric.score}/${rubric.maxScore}`,
      `matchedTokens=${rubric.matchedTokens.join(",")}`,
    ],
    decision,
    repairOwner: decision === "REQUEST_REPAIR" ? LIVE_PILOT_WORKER_IDENTITY : null,
    dissent: decision === "REQUEST_REPAIR" ? `rubric score ${rubric.score}/${rubric.maxScore} below pass threshold` : null,
    revisionNumber,
    recordedAt,
  });
  const ceilingCheck = checkRevisionCeiling(revisionLedgerState.currentRevision, revisionLedgerState.maxRevisionDepth);
  const terminal = terminalReviewDecision(receipt, ceilingCheck);
  const ledgerResult = recordReviewInLedger(revisionLedgerState, receipt);
  return {
    outcome: { rubric, receipt, decision: terminal.decision },
    ledgerResult,
  };
}

export interface MaoLiveLaneResult {
  readonly ok: boolean;
  readonly totalLatencyMs: number;
  readonly callsSpent: number;
  readonly revisionUsed: boolean;
  readonly finalResponseText: string | null;
  readonly finalRubric: MaoLiveRubricScore | null;
  readonly reviews: readonly MaoLiveReviewOutcome[];
  readonly integrationReceipt: MaoIntegrationReceipt | null;
  readonly diagnostic: MaoLiveCallDiagnostic | null;
  readonly usage?: { inputTokens: number; outputTokens: number } | null;
}

/**
 * Run the governed MAO lane: one worker live call, one independent local
 * review (recomputes the rubric, never trusts the worker's self-report),
 * at most one revision live call if the first attempt fails the rubric,
 * one final review, and one designated-closer integration decision. Spends
 * at most 2 of the ledger's live-call slots (worker + optional revision).
 */
export async function runMaoLane(params: {
  ledger: MaoLiveCallLedger;
  providerId: string;
  modelId: string;
  endpoint?: string;
  credentialReference: CredentialReference;
  env: Record<string, string | undefined>;
  fetchImpl?: LiveProofFetch;
  traceId: string;
  recordedAt: string;
}): Promise<MaoLiveLaneResult> {
  const evidenceLedger = new MaoEvidenceLedger(LIVE_PILOT_TASK_GRAPH_ID);
  let revisionLedgerState = createRevisionLedger(LIVE_PILOT_MAX_REVISION_DEPTH);
  const reviews: MaoLiveReviewOutcome[] = [];
  let totalLatencyMs = 0;
  let totalUsage = { inputTokens: 0, outputTokens: 0 };

  const firstAttempt = await runMaoWorkerCall({
    ledger: params.ledger,
    providerId: params.providerId,
    modelId: params.modelId,
    endpoint: params.endpoint,
    credentialReference: params.credentialReference,
    env: params.env,
    fetchImpl: params.fetchImpl,
    traceId: `${params.traceId}-worker`,
    prompt: LIVE_PILOT_TASK_PROMPT,
    callLabel: "mao-worker-call",
  });
  totalLatencyMs += firstAttempt.latencyMs;
  if (firstAttempt.usage) {
    totalUsage.inputTokens += firstAttempt.usage.inputTokens;
    totalUsage.outputTokens += firstAttempt.usage.outputTokens;
  }
  if (!firstAttempt.ok || !firstAttempt.responseText) {
    return {
      ok: false,
      totalLatencyMs,
      callsSpent: 1,
      revisionUsed: false,
      finalResponseText: null,
      finalRubric: null,
      reviews: [],
      integrationReceipt: null,
      diagnostic: firstAttempt.diagnostic,
      usage: firstAttempt.usage,
    };
  }
  evidenceLedger.ingest({
    taskGraphId: LIVE_PILOT_TASK_GRAPH_ID,
    taskId: LIVE_PILOT_TASK_ID,
    receiptKind: "OUTPUT",
    fields: { attempt: "1", latencyMs: String(firstAttempt.latencyMs) },
    recordedAt: params.recordedAt,
  });

  const firstReview = runMaoReviewPhase(firstAttempt.responseText, 0, params.recordedAt, revisionLedgerState);
  reviews.push(firstReview.outcome);
  if (firstReview.ledgerResult.ok) {
    revisionLedgerState = firstReview.ledgerResult.ledger;
  }

  let finalResponseText = firstAttempt.responseText;
  let finalRubric = firstReview.outcome.rubric;
  let revisionUsed = false;
  let callsSpent = 1;

  if (firstReview.outcome.decision === "REQUEST_REPAIR") {
    revisionUsed = true;
    const repairPrompt = `${LIVE_PILOT_TASK_PROMPT} Your previous answer did not satisfy the requirement; return exactly three matching numbers separated by commas and nothing else.`;
    const secondAttempt = await runMaoWorkerCall({
      ledger: params.ledger,
      providerId: params.providerId,
      modelId: params.modelId,
      endpoint: params.endpoint,
      credentialReference: params.credentialReference,
      env: params.env,
      fetchImpl: params.fetchImpl,
      traceId: `${params.traceId}-revision`,
      prompt: repairPrompt,
      callLabel: "mao-revision-call",
    });
    totalLatencyMs += secondAttempt.latencyMs;
    if (secondAttempt.usage) {
      totalUsage.inputTokens += secondAttempt.usage.inputTokens;
      totalUsage.outputTokens += secondAttempt.usage.outputTokens;
    }
    callsSpent = 2;
    if (!secondAttempt.ok || !secondAttempt.responseText) {
      return {
        ok: false,
        totalLatencyMs,
        callsSpent,
        revisionUsed,
        finalResponseText: null,
        finalRubric: null,
        reviews,
        integrationReceipt: null,
        diagnostic: secondAttempt.diagnostic,
        usage: totalUsage,
      };
    }
    evidenceLedger.ingest({
      taskGraphId: LIVE_PILOT_TASK_GRAPH_ID,
      taskId: LIVE_PILOT_TASK_ID,
      receiptKind: "OUTPUT",
      fields: { attempt: "2", latencyMs: String(secondAttempt.latencyMs) },
      recordedAt: params.recordedAt,
    });
    const secondReview = runMaoReviewPhase(secondAttempt.responseText, 1, params.recordedAt, revisionLedgerState);
    reviews.push(secondReview.outcome);
    finalResponseText = secondAttempt.responseText;
    finalRubric = secondReview.outcome.rubric;
  }

  buildEvidenceReadout(evidenceLedger, params.recordedAt);

  const lastReview = reviews[reviews.length - 1];
  const closerCheck = checkCloserIdentity(LIVE_PILOT_CLOSER_IDENTITY, LIVE_PILOT_CLOSER_IDENTITY);
  if (!closerCheck.ok) {
    throw new Error(`mao_live_closer_identity_rejected: ${closerCheck.reason}`);
  }
  const integrationResult = makeIntegrationDecision(
    [lastReview.receipt],
    LIVE_PILOT_CLOSER_IDENTITY,
    LIVE_PILOT_CLOSER_IDENTITY,
    LIVE_PILOT_TASK_GRAPH_ID,
    lastReview.decision === "ACCEPT" ? ["live-response-text"] : [],
    lastReview.decision === "ACCEPT" ? [] : ["live-response-text"],
    ["live-response-text"],
    params.recordedAt,
  );

  return {
    ok: lastReview.decision === "ACCEPT",
    totalLatencyMs,
    callsSpent,
    revisionUsed,
    finalResponseText,
    finalRubric,
    reviews,
    integrationReceipt: integrationResult.receipt,
    diagnostic: null,
    usage: totalUsage,
  };
}

// --- Comparative verdict ---

export type MaoLiveValueVerdict = "VALUE_PROVEN" | "VALUE_NOT_PROVEN" | "BLOCKED_LIVE_PROVIDER";

export interface MaoLiveComparativeResult {
  readonly verdict: MaoLiveValueVerdict;
  readonly direct: MaoLiveDirectLaneResult;
  readonly mao: MaoLiveLaneResult;
  readonly totalCallsSpent: number;
  readonly reason: string;
}

/**
 * Decide the terminal value verdict from both lanes' results. `BLOCKED_LIVE_PROVIDER`
 * when either lane could not complete due to a credential/provider/transport
 * failure. `VALUE_PROVEN` only when the MAO lane's final rubric score is
 * strictly higher than the direct lane's, since a tie or a loss does not
 * justify the added latency/call cost per the roadmap's acceptance
 * criterion. Otherwise `VALUE_NOT_PROVEN`.
 */
export function decideValueVerdict(
  direct: MaoLiveDirectLaneResult,
  mao: MaoLiveLaneResult,
  ledger: MaoLiveCallLedger,
): MaoLiveComparativeResult {
  if (!direct.ok || !direct.rubric) {
    return {
      verdict: "BLOCKED_LIVE_PROVIDER",
      direct,
      mao,
      totalCallsSpent: ledger.spentCount,
      reason: `direct lane failed: ${direct.diagnostic?.class ?? "unknown"}`,
    };
  }
  if (!mao.ok || !mao.finalRubric) {
    return {
      verdict: "BLOCKED_LIVE_PROVIDER",
      direct,
      mao,
      totalCallsSpent: ledger.spentCount,
      reason: `MAO lane failed: ${mao.diagnostic?.class ?? "unknown"}`,
    };
  }
  if (mao.finalRubric.score > direct.rubric.score) {
    return {
      verdict: "VALUE_PROVEN",
      direct,
      mao,
      totalCallsSpent: ledger.spentCount,
      reason: `MAO lane rubric score ${mao.finalRubric.score} exceeds direct lane score ${direct.rubric.score}`,
    };
  }
  return {
    verdict: "VALUE_NOT_PROVEN",
    direct,
    mao,
    totalCallsSpent: ledger.spentCount,
    reason: `MAO lane rubric score ${mao.finalRubric.score} does not exceed direct lane score ${direct.rubric.score} (call cost ${mao.callsSpent} vs 1)`,
  };
}
