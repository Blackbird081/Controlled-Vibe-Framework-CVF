import { canonicalJson, envelopeSha256, parseEnvelope, type ControlledEvaluateRequest, type ControlledInvoker, type OperationEnvelope,
  type OperationOutcomeKind, type OperationReceipt, type OutcomeInput, type PresenceLookup } from '@/lib/artifacts-receipt-operation-contract';
import { boundBindingDigest, boundEnvelopeSha256, boundRequestSha256, parseBoundEnvelope, parseEvaluateResult,
  type BoundEnvelope, type BoundOutcomeInput, type BoundReceipt } from '../../../../lib/artifacts-bound-receipt-contract';
import { sha256, type DraftPrincipal } from '@/lib/html-draft-recovery-contract';
import { checkEvaluateResult, transportReason, type BoundInvoker } from '../../../../lib/server/bound-receipt-transport';
import { isReceiptOperationStore, type ExistingBoundOperation, type ExistingOperation, type HtmlDraftSnapshotStore } from '@/lib/server/html-draft-snapshot-store';

const GOVERNANCE_EVALUATE_URL = '/api/governance/evaluate';
const PROOF_TIMEOUT_MS = 4000;
const MAX_PROOF_TIMEOUT_MS = 30000;

export type GovernanceReceiptStatus = 'PRESENT' | 'NOT_CONFIGURED' | 'TIMED_OUT' | 'UNAVAILABLE' | 'INVALID_RESPONSE';

export interface GovernanceReceipt {
  receiptId: string;
  decision: string;
  evaluatedAt: string;
  riskLevel: string;
}

export interface GovernanceReceiptCheck {
  status: GovernanceReceiptStatus;
  receipt: GovernanceReceipt | null;
  requestId?: string;
}

function proofTimeoutMs(): number {
  const configured = Number(process.env.CVF_GOVERNANCE_RECEIPT_TIMEOUT_MS);
  return Number.isInteger(configured) && configured >= 1000 && configured <= MAX_PROOF_TIMEOUT_MS
    ? configured
    : PROOF_TIMEOUT_MS;
}

interface EvaluateResponseData {
  report?: {
    status?: string;
    risk_level?: string;
    cvf_enforcement?: { action?: string };
    request_summary?: { request_id?: string; artifact_id?: string };
    decision_analysis?: { final_decision?: string };
    report_metadata?: { generated_at?: string };
    cvf_risk_level?: string;
    integrity?: { has_ledger_reference?: boolean };
  };
  execution_record?: {
    request_id?: string;
    timestamp?: string;
    final_decision?: string;
    ledger_attached?: boolean;
  };
  [key: string]: unknown;
}

interface EvaluateResponse {
  success: boolean;
  data?: EvaluateResponseData;
}

function isAbsoluteUrl(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://');
}

function resolveEvaluateUrl(base: string): string {
  if (isAbsoluteUrl(base)) return base;
  if (typeof process !== 'undefined' && process.env.NEXTAUTH_URL) {
    return `${process.env.NEXTAUTH_URL.replace(/\/$/, '')}${base}`;
  }
  return base;
}

export async function fetchGovernanceReceipt(
  artifactId: string,
  sourceContent: string,
  serviceToken?: string,
): Promise<GovernanceReceiptCheck> {
  const url = resolveEvaluateUrl(GOVERNANCE_EVALUATE_URL);

  if (!isAbsoluteUrl(url)) {
    return { status: 'NOT_CONFIGURED', receipt: null };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), proofTimeoutMs());
  const requestId = `artifact-proof-${artifactId}-${Date.now()}`;
  const failure = (status: GovernanceReceiptStatus): GovernanceReceiptCheck => ({ status, receipt: null, requestId });

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (serviceToken) headers['x-cvf-service-token'] = serviceToken;

    const response = await fetch(url, {
      method: 'POST',
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        request_id: requestId,
        artifact_id: artifactId,
        payload: { content: sourceContent.slice(0, 500) },
        cvf_phase: 'REVIEW',
        cvf_risk_level: 'R0',
      }),
    });

    if (!response.ok) return failure('UNAVAILABLE');

    let payload: EvaluateResponse;
    try {
      payload = await response.json() as EvaluateResponse;
    } catch {
      return failure('INVALID_RESPONSE');
    }
    if (payload.success !== true || !payload.data) return failure('INVALID_RESPONSE');

    const data = payload.data;
    // Current Governance Engine reports the request identity and decision in
    // nested report sections; its execution record does not repeat the ID.
    const report = data.report;
    const engineDecision = report?.decision_analysis?.final_decision;
    if (report?.request_summary) {
      const expectedAction: Record<string, string> = {
        ALLOW: 'ALLOW', DENY: 'BLOCK', REVIEW: 'NEEDS_APPROVAL',
        ESCALATE: 'ESCALATE', SANDBOX: 'LOG_ONLY',
      };
      if (report.request_summary.request_id !== requestId ||
        report.request_summary.artifact_id !== artifactId ||
        !engineDecision || !expectedAction[engineDecision] ||
        report.cvf_enforcement?.action !== expectedAction[engineDecision] ||
        data.execution_record?.final_decision !== engineDecision ||
        data.execution_record?.ledger_attached !== true ||
        report.integrity?.has_ledger_reference !== true ||
        typeof report.report_metadata?.generated_at !== 'string' || !report.report_metadata.generated_at ||
        typeof report.cvf_risk_level !== 'string' || !/^R[0-4]$/.test(report.cvf_risk_level)) return failure('INVALID_RESPONSE');
      return {
        status: 'PRESENT', requestId,
        receipt: {
          receiptId: requestId,
          decision: engineDecision,
          evaluatedAt: report.report_metadata.generated_at,
          riskLevel: report.cvf_risk_level,
        },
      };
    }

    // Retain the older explicit approval envelope for compatible callers.
    const status = data.report?.status;
    if (data.execution_record?.request_id !== requestId ||
      !['APPROVED', 'MANUAL_REVIEW', 'REJECTED', 'FROZEN'].includes(String(status)) ||
      typeof data.execution_record.timestamp !== 'string' || !data.execution_record.timestamp ||
      typeof data.report?.risk_level !== 'string' || !data.report.risk_level ||
      (status === 'APPROVED' && data.report.cvf_enforcement?.action !== 'ALLOW')) return failure('INVALID_RESPONSE');
    return {
      status: 'PRESENT', requestId,
      receipt: {
        receiptId: requestId,
        decision: status as string,
        evaluatedAt: data.execution_record.timestamp,
        riskLevel: data.report.risk_level,
      },
    };
  } catch (error) {
    return failure(controller.signal.aborted ||
      (error !== null && typeof error === 'object' && 'name' in error && error.name === 'AbortError')
      ? 'TIMED_OUT' : 'UNAVAILABLE');
  } finally {
    clearTimeout(timer);
  }
}

// ---- Controlled receipt operation: injected synthetic fixture only. fetchGovernanceReceipt above is retained as the separate legacy R0 path.
// This code never calls global fetch, reads credentials or imports an engine. Results establish protocol and invocation counters only. ----

export function buildControlledEvaluateRequest(attemptId: string, artifactId: string, sourceContent: string): ControlledEvaluateRequest {
  return { request_id: attemptId, artifact_id: artifactId, payload: { content: sourceContent.slice(0, 500) }, cvf_phase: 'REVIEW', cvf_risk_level: 'R1' };
}
export const controlledRequestSha256 = (request: ControlledEvaluateRequest): string => sha256(canonicalJson(request));

const EXPECTED_ACTION: Record<string, string> = { ALLOW: 'ALLOW', DENY: 'BLOCK', REVIEW: 'NEEDS_APPROVAL', ESCALATE: 'ESCALATE', SANDBOX: 'LOG_ONLY' };

/** Strict current-engine shape only. The older explicit approval envelope is not accepted on the controlled path. */
export function parseControlledReceipt(payload: unknown, request: ControlledEvaluateRequest): OperationReceipt | null {
  const response = payload as EvaluateResponse | null | undefined;
  const report = response?.success === true ? response.data?.report : undefined;
  const execution = response?.data?.execution_record;
  const decision = report?.decision_analysis?.final_decision;
  if (!report?.request_summary || report.request_summary.request_id !== request.request_id || report.request_summary.artifact_id !== request.artifact_id
    || !decision || !Object.hasOwn(EXPECTED_ACTION, decision) || report.cvf_enforcement?.action !== EXPECTED_ACTION[decision]
    || execution?.final_decision !== decision || execution?.ledger_attached !== true || report.integrity?.has_ledger_reference !== true
    || report.cvf_risk_level !== request.cvf_risk_level || typeof report.report_metadata?.generated_at !== 'string'
    || !report.report_metadata.generated_at) return null;
  return { receiptId: request.request_id, decision, evaluatedAt: report.report_metadata.generated_at, riskLevel: request.cvf_risk_level };
}

export type ControlledReceiptResult =
  | { kind: 'DENIED'; reason: string; sends: 0 }
  | { kind: 'ALREADY_PROCESSED'; operationKey: string; state: string; outcome: OperationOutcomeKind | null; sends: 0 }
  | { kind: 'REUSED'; operationKey: string; receipt: OperationReceipt; sends: 0 }
  | { kind: 'EXECUTED'; operationKey: string; outcome: OperationOutcomeKind; receipt: OperationReceipt | null; reason: string | null; persisted: boolean; sends: 1 };
/** The production path accepts only a store constructed by the artifacts store module; a structural stand-in is never a trusted grant source. */
export type ReceiptOperationStore = HtmlDraftSnapshotStore;
export interface ControlledReceiptOptions {
  store: ReceiptOperationStore;
  owner: DraftPrincipal;
  envelope: unknown;
  request: ControlledEvaluateRequest;
  invoker: ControlledInvoker;
  timeoutMs: number;
  signal?: AbortSignal;
}

/** Bounded wait for local store work. A timeout or error yields null; it never proves the work did not happen. */
function bounded<T>(work: () => Promise<T>, ms: number): Promise<T | null> {
  return new Promise<T | null>(resolve => {
    const timer = setTimeout(() => resolve(null), ms);
    Promise.resolve().then(work).then(value => { clearTimeout(timer); resolve(value); }, () => { clearTimeout(timer); resolve(null); });
  });
}

/** Everything the proof reads from its caller, copied once and synchronously before the first await. Later caller mutation cannot change it. */
interface Prepared { store: ReceiptOperationStore; owner: DraftPrincipal; envelope: OperationEnvelope; request: ControlledEvaluateRequest;
  invoker: ControlledInvoker; timeoutMs: number; signal: AbortSignal | undefined }
const isRecord = (v: unknown): v is Record<string, unknown> => Object.prototype.toString.call(v) === '[object Object]';
const hasKeys = (v: Record<string, unknown>, keys: readonly string[]) => Object.keys(v).length === keys.length && keys.every(k => Object.hasOwn(v, k));
const isSignal = (v: unknown): v is AbortSignal => typeof v === 'object' && v !== null && typeof (v as AbortSignal).aborted === 'boolean'
  && typeof (v as AbortSignal).addEventListener === 'function' && typeof (v as AbortSignal).removeEventListener === 'function';

/** Strict exact-shape copy through a serialization round trip: accessors, proxies and aliases do not survive. Returns null, never throws. */
function snapshotRequest(value: unknown): ControlledEvaluateRequest | null {
  let copy: unknown;
  try { copy = JSON.parse(JSON.stringify(value)); } catch { return null; }
  if (!isRecord(copy) || !hasKeys(copy, ['request_id', 'artifact_id', 'payload', 'cvf_phase', 'cvf_risk_level'])) return null;
  const { request_id: id, artifact_id: artifact, payload, cvf_phase: phase, cvf_risk_level: risk } = copy;
  if (typeof id !== 'string' || typeof artifact !== 'string' || !isRecord(payload) || !hasKeys(payload, ['content']) || typeof payload.content !== 'string'
    || payload.content.length > 500 || phase !== 'REVIEW' || risk !== 'R1') return null;
  return Object.freeze({ request_id: id, artifact_id: artifact, payload: Object.freeze({ content: payload.content }), cvf_phase: phase, cvf_risk_level: risk });
}

/** Validates the whole invocation join: exact envelope, exact request, owner, attempt, artifact, payload digest, trusted store and bounded timeout. */
function prepare(options: unknown): Prepared | null {
  try {
    if (!isRecord(options)) return null;
    const { store, owner, envelope: rawEnvelope, request: rawRequest, invoker, timeoutMs, signal } = options;
    const envelope = parseEnvelope(rawEnvelope);
    const request = snapshotRequest(rawRequest);
    if (!envelope || !request || !isReceiptOperationStore(store) || typeof invoker !== 'function' || typeof timeoutMs !== 'number'
      || !Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > MAX_PROOF_TIMEOUT_MS || !(signal === undefined || isSignal(signal))
      || !isRecord(owner) || owner.userId !== envelope.owner.userId || owner.orgId !== envelope.owner.orgId || owner.teamId !== envelope.owner.teamId
      || request.request_id !== envelope.attemptId || request.artifact_id !== envelope.output.artifactId
      || controlledRequestSha256(request) !== envelope.payloadSha256) return null;
    return { store, owner: { ...envelope.owner }, envelope, request, invoker: invoker as ControlledInvoker, timeoutMs, signal };
  } catch { return null; }
}

function settleExisting(envelope: OperationEnvelope, existing: ExistingOperation): ControlledReceiptResult {
  if (!('intent' in existing)) return { kind: 'DENIED', reason: `OPERATION_${existing.state}`, sends: 0 };
  const outcome = existing.state === 'OUTCOME' ? existing.outcome : null;
  if (outcome?.outcome === 'RECEIPT_VERIFIED' && outcome.receipt && existing.intent.envelopeSha256 === envelopeSha256(envelope)) {
    return { kind: 'REUSED', operationKey: envelope.operationKey, receipt: outcome.receipt, sends: 0 };
  }
  return { kind: 'ALREADY_PROCESSED', operationKey: envelope.operationKey, state: existing.state, outcome: outcome?.outcome ?? null, sends: 0 };
}

type Settled = { kind: 'RESPONSE'; value: unknown } | { kind: 'UNKNOWN'; reason: string };
/** One invocation, bounded. A late response after settlement is dropped and cannot publish an outcome. */
function invokeOnce(invoker: ControlledInvoker, request: ControlledEvaluateRequest, timeoutMs: number, external?: AbortSignal,
  reasonOf: (error: unknown) => string = () => 'INVOKER_ERROR'): Promise<Settled> {
  return new Promise<Settled>(resolve => {
    const controller = new AbortController();
    let done = false;
    const timer = setTimeout(() => { controller.abort(); finish({ kind: 'UNKNOWN', reason: 'TIMED_OUT' }); }, timeoutMs);
    const onAbort = () => { controller.abort(); finish({ kind: 'UNKNOWN', reason: 'ABORTED' }); };
    const finish = (value: Settled) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      external?.removeEventListener('abort', onAbort);
      resolve(value);
    };
    external?.addEventListener('abort', onAbort, { once: true });
    const copy = JSON.parse(JSON.stringify(request)) as ControlledEvaluateRequest;
    Promise.resolve().then(() => invoker(copy, controller.signal)).then(
      value => finish({ kind: 'RESPONSE', value }),
      error => finish({ kind: 'UNKNOWN', reason: controller.signal.aborted ? 'ABORTED' : reasonOf(error) }),
    );
  });
}

async function invokePrepared(prepared: Prepared, grant: unknown): Promise<ControlledReceiptResult> {
  const { store, invoker, request, timeoutMs, signal, envelope } = prepared;
  // Immediately before the invoke the trusted grant must join this exact store, invoker, owner, key, attempt and full envelope, and the
  // isolated payload must still hash to the approved digest. A mismatch sends nothing and records nothing.
  if (controlledRequestSha256(request) !== envelope.payloadSha256) return { kind: 'DENIED', reason: 'INVALID_PROOF_INPUT', sends: 0 };
  const consumed = store.consumeGrant(grant, invoker, envelope);
  if (!consumed) return { kind: 'DENIED', reason: 'GRANT_REJECTED', sends: 0 };
  if (signal?.aborted) {
    await bounded(() => store.writeOutcome(consumed, { outcome: 'FAILED_BEFORE_SEND', receipt: null, reason: 'ABORTED_BEFORE_SEND' }), timeoutMs);
    return { kind: 'DENIED', reason: 'FAILED_BEFORE_SEND', sends: 0 };
  }
  const settled = await invokeOnce(invoker, request, timeoutMs, signal);
  let input: OutcomeInput;
  if (settled.kind === 'RESPONSE') {
    const receipt = parseControlledReceipt(settled.value, request);
    input = receipt
      ? { outcome: receipt.decision === 'DENY' ? 'DENIED' : 'RECEIPT_VERIFIED', receipt, reason: null }
      : { outcome: 'OUTCOME_UNKNOWN', receipt: null, reason: 'INVALID_RESPONSE' };
  } else {
    input = { outcome: 'OUTCOME_UNKNOWN', receipt: null, reason: settled.reason };
  }
  const saved = await bounded(() => store.writeOutcome(consumed, input), timeoutMs);
  if (saved?.kind === 'SAVED') {
    return { kind: 'EXECUTED', operationKey: envelope.operationKey, outcome: saved.outcome.outcome, receipt: saved.outcome.receipt,
      reason: saved.outcome.reason, persisted: true, sends: 1 };
  }
  return { kind: 'EXECUTED', operationKey: envelope.operationKey, outcome: 'OUTCOME_UNKNOWN', receipt: null,
    reason: `OUTCOME_WRITE_${saved ? saved.kind : 'UNCONFIRMED'}`, persisted: false, sends: 1 };
}

/** Consume the grant before invoking. A fabricated, copied, spent or mismatched grant, or any invalid input, denies with zero sends. */
export async function invokeWithGrant(options: ControlledReceiptOptions, grant: unknown): Promise<ControlledReceiptResult> {
  const prepared = prepare(options);
  return prepared ? invokePrepared(prepared, grant) : { kind: 'DENIED', reason: 'INVALID_PROOF_INPUT', sends: 0 };
}

/** Admit, start and invoke the injected callback at most once for one immutable logical operation. Never throws. */
export async function runControlledReceipt(options: ControlledReceiptOptions): Promise<ControlledReceiptResult> {
  const prepared = prepare(options);
  const denied = (reason: string): ControlledReceiptResult => ({ kind: 'DENIED', reason, sends: 0 });
  if (!prepared) return denied('INVALID_PROOF_INPUT');
  const { store, owner, envelope, invoker, timeoutMs } = prepared;
  const admitted = await bounded(() => store.admitOperation(envelope, owner), timeoutMs);
  if (!admitted) return denied('STORE_UNAVAILABLE');
  if (admitted.kind === 'DENIED') return denied(admitted.reason);
  if (admitted.kind === 'EXISTING') return settleExisting(envelope, admitted.operation);
  const admission = admitted.admission;
  const started = await bounded(() => store.startOperation(owner, envelope.operationKey, invoker, admission), timeoutMs);
  if (!started) return denied('STORE_UNAVAILABLE');
  if (started.kind === 'DENIED') return denied(started.reason);
  if (started.kind === 'EXISTING') return settleExisting(envelope, started.operation);
  return invokePrepared(prepared, started.grant);
}

export interface PresenceDiagnostic { status: 'REMOTE_PRESENCE_OBSERVED' | 'UNKNOWN'; releasesUnknown: false; grantsReplay: false }
/** Reconcile B: optional pure diagnostic over an injected lookup. It never writes, releases UNKNOWN or grants a replay. */
export async function diagnoseRemotePresence(lookup: PresenceLookup, envelope: OperationEnvelope, timeoutMs = PROOF_TIMEOUT_MS): Promise<PresenceDiagnostic> {
  const entry = await bounded(() => lookup({ requestId: envelope.attemptId }), timeoutMs);
  const present = !!entry && entry.requestId === envelope.attemptId && entry.actor === envelope.owner.userId
    && entry.configDigest === envelope.config.configDigest && entry.storeId === envelope.config.storeId;
  return { status: present ? 'REMOTE_PRESENCE_OBSERVED' : 'UNKNOWN', releasesUnknown: false, grantsReplay: false };
}

// ---- Bound receipt operation: distinct schema, distinct store namespace, signed two-hop invoker. It never calls fetch or reads credentials. ----
// One invocation performs one signed challenge plus one signed evaluate; those hop sends are counted by the profile, not by `sends`.

export type BoundReceiptResult =
  | { kind: 'DENIED'; reason: string; sends: 0 }
  | { kind: 'ALREADY_PROCESSED'; operationKey: string; state: string; outcome: OperationOutcomeKind | null; sends: 0 }
  | { kind: 'REUSED'; operationKey: string; receipt: BoundReceipt; sends: 0 }
  | { kind: 'EXECUTED'; operationKey: string; outcome: OperationOutcomeKind; receipt: BoundReceipt | null; reason: string | null; persisted: boolean; sends: 1 };
export interface BoundReceiptOptions {
  store: ReceiptOperationStore;
  owner: DraftPrincipal;
  envelope: unknown;
  request: ControlledEvaluateRequest;
  invoker: BoundInvoker;
  timeoutMs: number;
  signal?: AbortSignal;
}
interface BoundPrepared { store: ReceiptOperationStore; owner: DraftPrincipal; envelope: BoundEnvelope; request: ControlledEvaluateRequest;
  invoker: BoundInvoker; timeoutMs: number; signal: AbortSignal | undefined }

/** Same isolation as prepare(), but the digest function is the bound canonicalAscii digest chosen from the validated bound envelope. */
function prepareBound(options: unknown): BoundPrepared | null {
  try {
    if (!isRecord(options)) return null;
    const { store, owner, envelope: rawEnvelope, request: rawRequest, invoker, timeoutMs, signal } = options;
    const envelope = parseBoundEnvelope(rawEnvelope);
    const request = snapshotRequest(rawRequest);
    if (!envelope || !request || !isReceiptOperationStore(store) || typeof invoker !== 'function' || typeof timeoutMs !== 'number'
      || !Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > MAX_PROOF_TIMEOUT_MS || !(signal === undefined || isSignal(signal))
      || !isRecord(owner) || owner.userId !== envelope.owner.userId || owner.orgId !== envelope.owner.orgId || owner.teamId !== envelope.owner.teamId
      || request.request_id !== envelope.attemptId || request.artifact_id !== envelope.output.artifactId
      || boundRequestSha256(request) !== envelope.payloadSha256) return null;
    return { store, owner: { ...envelope.owner }, envelope, request, invoker: invoker as BoundInvoker, timeoutMs, signal };
  } catch { return null; }
}

function settleExistingBound(envelope: BoundEnvelope, existing: ExistingBoundOperation): BoundReceiptResult {
  if (!('intent' in existing)) return { kind: 'DENIED', reason: `OPERATION_${existing.state}`, sends: 0 };
  const outcome = existing.state === 'OUTCOME' ? existing.outcome : null;
  if (outcome?.outcome === 'RECEIPT_VERIFIED' && outcome.receipt && existing.intent.envelopeSha256 === boundEnvelopeSha256(envelope)) {
    return { kind: 'REUSED', operationKey: envelope.operationKey, receipt: outcome.receipt, sends: 0 };
  }
  return { kind: 'ALREADY_PROCESSED', operationKey: envelope.operationKey, state: existing.state, outcome: outcome?.outcome ?? null, sends: 0 };
}

/** Joins the verified engine result to THIS envelope again (never trusting the transport alone) and builds the persisted receipt. */
export function boundReceiptFromResult(value: unknown, envelope: BoundEnvelope): BoundReceipt | null {
  const result = parseEvaluateResult(value);
  if (!result || checkEvaluateResult(result, { operationKey: envelope.operationKey, attemptId: envelope.attemptId, artifactId: envelope.output.artifactId,
    payloadSha256: envelope.payloadSha256, envelopeSha256: boundEnvelopeSha256(envelope), owner: envelope.owner }, envelope.config) !== null) return null;
  return { receiptId: envelope.attemptId, decision: result.report.decision_analysis.final_decision, evaluatedAt: result.report.report_metadata.generated_at,
    riskLevel: 'R1', engineRiskLevel: result.engineRiskLevel, bindingDigest: boundBindingDigest(envelope), ledgerReference: { ...result.ledgerReference } };
}

async function invokeBoundPrepared(prepared: BoundPrepared, grant: unknown): Promise<BoundReceiptResult> {
  const { store, invoker, request, timeoutMs, signal, envelope } = prepared;
  if (boundRequestSha256(request) !== envelope.payloadSha256) return { kind: 'DENIED', reason: 'INVALID_PROOF_INPUT', sends: 0 };
  const consumed = store.consumeBoundGrant(grant, invoker, envelope);
  if (!consumed) return { kind: 'DENIED', reason: 'GRANT_REJECTED', sends: 0 };
  if (signal?.aborted) {
    await bounded(() => store.writeBoundOutcome(consumed, { outcome: 'FAILED_BEFORE_SEND', receipt: null, reason: 'ABORTED_BEFORE_SEND' }), timeoutMs);
    return { kind: 'DENIED', reason: 'FAILED_BEFORE_SEND', sends: 0 };
  }
  const settled = await invokeOnce(invoker, request, timeoutMs, signal, transportReason);
  let input: BoundOutcomeInput;
  if (settled.kind === 'RESPONSE') {
    const receipt = boundReceiptFromResult(settled.value, envelope);
    input = receipt
      ? { outcome: receipt.decision === 'DENY' ? 'DENIED' : 'RECEIPT_VERIFIED', receipt, reason: null }
      : { outcome: 'OUTCOME_UNKNOWN', receipt: null, reason: 'INVALID_RESPONSE' };
  } else {
    input = { outcome: 'OUTCOME_UNKNOWN', receipt: null, reason: settled.reason };
  }
  const saved = await bounded(() => store.writeBoundOutcome(consumed, input), timeoutMs);
  if (saved?.kind === 'SAVED') {
    return { kind: 'EXECUTED', operationKey: envelope.operationKey, outcome: saved.outcome.outcome, receipt: saved.outcome.receipt,
      reason: saved.outcome.reason, persisted: true, sends: 1 };
  }
  return { kind: 'EXECUTED', operationKey: envelope.operationKey, outcome: 'OUTCOME_UNKNOWN', receipt: null,
    reason: `OUTCOME_WRITE_${saved ? saved.kind : 'UNCONFIRMED'}`, persisted: false, sends: 1 };
}

/** Consume the grant before invoking. A fabricated, copied, spent, v1 or mismatched grant, or any invalid input, denies with zero sends. */
export async function invokeBoundWithGrant(options: BoundReceiptOptions, grant: unknown): Promise<BoundReceiptResult> {
  const prepared = prepareBound(options);
  return prepared ? invokeBoundPrepared(prepared, grant) : { kind: 'DENIED', reason: 'INVALID_PROOF_INPUT', sends: 0 };
}

/** Admit, start and invoke the injected two-hop invoker at most once for one immutable logical operation. Never throws. */
export async function runBoundReceipt(options: BoundReceiptOptions): Promise<BoundReceiptResult> {
  const prepared = prepareBound(options);
  const denied = (reason: string): BoundReceiptResult => ({ kind: 'DENIED', reason, sends: 0 });
  if (!prepared) return denied('INVALID_PROOF_INPUT');
  const { store, owner, envelope, invoker, timeoutMs } = prepared;
  const admitted = await bounded(() => store.admitBoundOperation(envelope, owner), timeoutMs);
  if (!admitted) return denied('STORE_UNAVAILABLE');
  if (admitted.kind === 'DENIED') return denied(admitted.reason);
  if (admitted.kind === 'EXISTING') return settleExistingBound(envelope, admitted.operation);
  const admission = admitted.admission;
  const started = await bounded(() => store.startBoundOperation(owner, envelope.operationKey, invoker, admission), timeoutMs);
  if (!started) return denied('STORE_UNAVAILABLE');
  if (started.kind === 'DENIED') return denied(started.reason);
  if (started.kind === 'EXISTING') return settleExistingBound(envelope, started.operation);
  return invokeBoundPrepared(prepared, started.grant);
}
