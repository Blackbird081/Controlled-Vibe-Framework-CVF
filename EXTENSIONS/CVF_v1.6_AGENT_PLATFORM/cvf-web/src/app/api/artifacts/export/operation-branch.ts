/** Authenticated selector -> owner-scoped job and request hash -> operation admission -> one injected proof, for the actual export POST. */
import { BOUND_DISCLOSURE, BOUND_EFFECT, boundAttemptIdFor, boundOperationKey, boundRequestSha256, buildBoundEnvelope, type BoundReceipt } from '../../../../lib/artifacts-bound-receipt-contract';
import { SYNTHETIC_SOURCE_PREFIX, attemptIdFor, buildEnvelope, operationKey, type OperationReceipt } from '@/lib/artifacts-receipt-operation-contract';
import { SOURCE_ID, VERSION_ID, requestIdentity, sha256, type DraftPrincipal, type DraftRequest } from '@/lib/html-draft-recovery-contract';
import { HtmlDraftSnapshotStore } from '@/lib/server/html-draft-snapshot-store';
import { isIssuedBoundProfile, type BoundReceiptFixtureProfile } from '../../../../lib/server/bound-receipt-profile';
import type { ReceiptOperationFixtureProfile } from '@/lib/server/receipt-operation-profile';
import { buildControlledEvaluateRequest, controlledRequestSha256, runBoundReceipt, runControlledReceipt } from './proof';

export const JOB_ID_HEADER = 'x-cvf-job-id';
export const SOURCE_RECORD_HEADER = 'x-cvf-source-record-id';

export type JobSelectors = { kind: 'NONE' } | { kind: 'VALID'; jobId: string; sourceRecordId: string } | { kind: 'INVALID'; reason: string };
/** Bounded, untrusted selectors. They grant no effect; they only name a job the authenticated owner must already hold. */
export function parseJobSelectors(headers: Headers): JobSelectors {
  const jobId = headers.get(JOB_ID_HEADER);
  const sourceRecordId = headers.get(SOURCE_RECORD_HEADER);
  if (jobId === null && sourceRecordId === null) return { kind: 'NONE' };
  if (jobId === null || sourceRecordId === null) return { kind: 'INVALID', reason: 'PARTIAL_SELECTOR' };
  if (jobId.includes(',') || sourceRecordId.includes(',')) return { kind: 'INVALID', reason: 'CONFLICTING_SELECTOR' };
  if (!VERSION_ID.test(jobId) || !SOURCE_ID.test(sourceRecordId) || !sourceRecordId.startsWith(SYNTHETIC_SOURCE_PREFIX)) {
    return { kind: 'INVALID', reason: 'MALFORMED_SELECTOR' };
  }
  return { kind: 'VALID', jobId, sourceRecordId };
}

export type JobBinding = { ok: true } | { ok: false; status: 404 | 409; error: string };
/** Owner-scoped getJob plus the recomputed request hash. No getVersion: the version is absent until Save. */
export async function bindJobSelectors(store: HtmlDraftSnapshotStore, selectors: { jobId: string; sourceRecordId: string }, owner: DraftPrincipal, fields: DraftRequest): Promise<JobBinding> {
  const job = await store.getJob(selectors.jobId, selectors.sourceRecordId, owner);
  if (!job) return { ok: false, status: 404, error: 'JOB_NOT_FOUND' };
  if (job.requestSha256 !== sha256(requestIdentity(fields))) return { ok: false, status: 409, error: 'JOB_REQUEST_MISMATCH' };
  return { ok: true };
}

export interface RenderedExport {
  html: string;
  generatedAt: string;
  sourceHash: string;
  filename: string;
  receiptAnchor: string;
  verification: Array<{ label: string; passed: boolean; detail?: string }>;
}
export interface ReceiptProjection { status: 'PRESENT' | 'TIMED_OUT' | 'UNAVAILABLE' | 'INVALID_RESPONSE'; requestId: string; receipt: OperationReceipt | null }
/** Render and response seams are supplied by the route so the route needs no auxiliary exports. */
export interface BranchSeams {
  render: () => RenderedExport;
  compose: (rendered: RenderedExport, projection: ReceiptProjection) => Record<string, unknown>;
}
export interface BranchResponse { status: number; body: Record<string, unknown> }
export interface ControlledBranchArgs {
  headers: Headers;
  owner: DraftPrincipal;
  fields: DraftRequest;
  profile: ReceiptOperationFixtureProfile;
  seams: BranchSeams;
  clock?: () => number;
  signal?: AbortSignal;
}

const fail = (status: number, error: string, extra: Record<string, unknown> = {}): BranchResponse => ({ status, body: { success: false, error, ...extra } });

export async function runControlledBranch(args: ControlledBranchArgs): Promise<BranchResponse> {
  const { owner, fields, profile, seams } = args;
  const selectors = parseJobSelectors(args.headers);
  if (selectors.kind !== 'VALID') return fail(400, selectors.kind === 'NONE' ? 'SELECTOR_REQUIRED' : selectors.reason);
  let store: HtmlDraftSnapshotStore;
  try { store = new HtmlDraftSnapshotStore(profile.store, args.clock); }
  catch { return fail(503, 'OPERATION_PROFILE_UNAVAILABLE'); }
  // Owner-scoped job and recomputed request hash come before rendering, preparation, admission or any injected send.
  const bound = await bindJobSelectors(store, selectors, owner, fields);
  if (!bound.ok) return fail(bound.status, bound.error);
  const requestSha256 = sha256(requestIdentity(fields));
  const key = operationKey({ owner, sourceRecordId: selectors.sourceRecordId, requestSha256 });
  if (key === null) return fail(422, 'OPERATION_KEY_INVALID');
  const rendered = seams.render();
  const attemptId = attemptIdFor(key);
  const evaluate = buildControlledEvaluateRequest(attemptId, rendered.receiptAnchor, fields.sourceContent);
  const envelope = buildEnvelope({ owner, sourceRecordId: selectors.sourceRecordId, requestSha256, jobId: selectors.jobId, versionId: null, attemptId,
    payloadSha256: controlledRequestSha256(evaluate), config: profile.config,
    output: { generatedAt: rendered.generatedAt, sourceHash: rendered.sourceHash, htmlSha256: sha256(Buffer.from(rendered.html, 'utf8')),
      artifactId: rendered.receiptAnchor, filename: rendered.filename } });
  if (!envelope) return fail(422, 'OPERATION_ENVELOPE_INVALID');
  const result = await runControlledReceipt({ store, owner, envelope, request: evaluate, invoker: profile.invoker, timeoutMs: profile.timeoutMs, signal: args.signal });
  if (result.kind === 'DENIED') return fail(result.reason === 'INVALID_PROOF_INPUT' ? 422 : 503, 'OPERATION_DENIED', { reason: result.reason });
  if (result.kind === 'ALREADY_PROCESSED') {
    // Reference only: no html, no receipt and no success.data for a different target, config, job or version.
    return fail(409, 'ALREADY_PROCESSED', { operation: { operationKey: result.operationKey, state: result.state, outcome: result.outcome } });
  }
  if (result.kind === 'REUSED') {
    return { status: 200, body: { success: true, data: seams.compose(rendered, { status: 'PRESENT', requestId: attemptId, receipt: result.receipt }),
      operation: { operationKey: result.operationKey, outcome: 'RECEIPT_VERIFIED', reused: true, sends: 0 } } };
  }
  const status: ReceiptProjection['status'] = result.receipt ? 'PRESENT'
    : result.reason === 'TIMED_OUT' || result.reason === 'ABORTED' ? 'TIMED_OUT'
      : result.reason === 'INVALID_RESPONSE' ? 'INVALID_RESPONSE' : 'UNAVAILABLE';
  return { status: 200, body: { success: true, data: seams.compose(rendered, { status, requestId: attemptId, receipt: result.receipt }),
    operation: { operationKey: result.operationKey, outcome: result.outcome, reused: false, sends: 1, persisted: result.persisted } } };
}

export interface BoundBranchArgs {
  headers: Headers;
  owner: DraftPrincipal;
  fields: DraftRequest;
  profile: BoundReceiptFixtureProfile;
  seams: BranchSeams;
  clock?: () => number;
  signal?: AbortSignal;
}

/** The engine risk is projected honestly to the existing risk field; the requested class stays in a separate verification detail. */
const boundVerification = (receipt: BoundReceipt) => ({ effect: BOUND_EFFECT, mode: BOUND_DISCLOSURE, requestedRiskLevel: receipt.riskLevel,
  engineRiskLevel: receipt.engineRiskLevel, bindingDigest: receipt.bindingDigest, ledgerReference: receipt.ledgerReference });
const projectReceipt = (receipt: BoundReceipt): OperationReceipt => ({ receiptId: receipt.receiptId, decision: receipt.decision,
  evaluatedAt: receipt.evaluatedAt, riskLevel: receipt.engineRiskLevel });

/** Bound counterpart of runControlledBranch: owner-scoped job and recomputed request hash first, then one admitted two-hop operation. */
export async function runBoundBranch(args: BoundBranchArgs): Promise<BranchResponse> {
  const { owner, fields, profile, seams } = args;
  if (!isIssuedBoundProfile(profile)) return fail(503, 'BOUND_PROFILE_UNISSUED');
  const selectors = parseJobSelectors(args.headers);
  if (selectors.kind !== 'VALID') return fail(400, selectors.kind === 'NONE' ? 'SELECTOR_REQUIRED' : selectors.reason);
  let store: HtmlDraftSnapshotStore;
  try { store = new HtmlDraftSnapshotStore(profile.store, args.clock); }
  catch { return fail(503, 'OPERATION_PROFILE_UNAVAILABLE'); }
  const bound = await bindJobSelectors(store, selectors, owner, fields);
  if (!bound.ok) return fail(bound.status, bound.error);
  const requestSha256 = sha256(requestIdentity(fields));
  const key = boundOperationKey({ owner, sourceRecordId: selectors.sourceRecordId, requestSha256 });
  if (key === null) return fail(422, 'OPERATION_KEY_INVALID');
  const rendered = seams.render();
  const attemptId = boundAttemptIdFor(key);
  const evaluate = buildControlledEvaluateRequest(attemptId, rendered.receiptAnchor, fields.sourceContent);
  const envelope = buildBoundEnvelope({ owner, sourceRecordId: selectors.sourceRecordId, requestSha256, jobId: selectors.jobId, versionId: null, attemptId,
    payloadSha256: boundRequestSha256(evaluate), config: profile.config,
    output: { generatedAt: rendered.generatedAt, sourceHash: rendered.sourceHash, htmlSha256: sha256(Buffer.from(rendered.html, 'utf8')),
      artifactId: rendered.receiptAnchor, filename: rendered.filename } });
  if (!envelope) return fail(422, 'OPERATION_ENVELOPE_INVALID');
  const result = await runBoundReceipt({ store, owner, envelope, request: evaluate, invoker: profile.createInvoker(envelope), timeoutMs: profile.timeoutMs, signal: args.signal });
  if (result.kind === 'DENIED') return fail(result.reason === 'INVALID_PROOF_INPUT' ? 422 : 503, 'OPERATION_DENIED', { reason: result.reason });
  if (result.kind === 'ALREADY_PROCESSED') {
    // Reference only: no html, no receipt and no success.data for a different target, config, job or version.
    return fail(409, 'ALREADY_PROCESSED', { operation: { operationKey: result.operationKey, state: result.state, outcome: result.outcome } });
  }
  if (result.kind === 'REUSED') {
    return { status: 200, body: { success: true,
      data: { ...seams.compose(rendered, { status: 'PRESENT', requestId: attemptId, receipt: projectReceipt(result.receipt) }), boundVerification: boundVerification(result.receipt) },
      operation: { operationKey: result.operationKey, outcome: 'RECEIPT_VERIFIED', reused: true, sends: 0 } } };
  }
  const status: ReceiptProjection['status'] = result.receipt ? 'PRESENT'
    : result.reason === 'TIMED_OUT' || result.reason === 'ABORTED' ? 'TIMED_OUT'
      : result.reason === 'INVALID_RESPONSE' ? 'INVALID_RESPONSE' : 'UNAVAILABLE';
  const data = seams.compose(rendered, { status, requestId: attemptId, receipt: result.receipt ? projectReceipt(result.receipt) : null });
  return { status: 200, body: { success: true, data: result.receipt ? { ...data, boundVerification: boundVerification(result.receipt) } : data,
    operation: { operationKey: result.operationKey, outcome: result.outcome, reused: false, sends: 1, persisted: result.persisted,
      ...(result.reason ? { reason: result.reason } : {}) } } };
}
