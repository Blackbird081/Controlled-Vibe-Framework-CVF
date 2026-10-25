/**
 * Pure assertion helpers for the signed HTML pilot proof. They inspect plain values only: no storage, no provider and
 * no network. A helper passing proves that the value it was handed is internally consistent, never that a live
 * governance run happened; every function throws a stable PILOT_PROOF_* code instead of returning a soft failure.
 */
import { createHash } from 'node:crypto';
import path from 'node:path';
import { TextDecoder } from 'node:util';

export class PilotProofError extends Error {
  constructor(readonly code: string, detail = '') {
    super(detail ? `${code}: ${detail}` : code);
    this.name = 'PilotProofError';
  }
}

const SHA256 = /^[a-f0-9]{64}$/;
const RUN_ID = /^[a-f0-9]{32}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export const PILOT_LIMITS = {
  initialGoalLength: 547, revisionGoalLength: 442, goalMaxLength: 2000, revisionMaxLength: 500,
  firstPreviewSeconds: 120, localGovernanceSeconds: 10, restoreSeconds: 600,
} as const;

export const sha256Utf8 = (text: string): string => createHash('sha256').update(text, 'utf8').digest('hex');
const fail = (code: string, detail?: string): never => { throw new PilotProofError(code, detail); };
const finite = (value: unknown, label: string): number => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return fail('PILOT_PROOF_MEASUREMENT_INVALID', label);
  return value;
};

/** The exact locked inputs: UTF-16 lengths as the form counts them, and the form limits still above them. */
export function assertFixtureGoals(goal: string, revision: string): { goalSha256: string; revisionSha256: string } {
  if (goal.length !== PILOT_LIMITS.initialGoalLength) fail('PILOT_PROOF_GOAL_LENGTH', `${goal.length}`);
  if (revision.length !== PILOT_LIMITS.revisionGoalLength) fail('PILOT_PROOF_REVISION_LENGTH', `${revision.length}`);
  if (goal.length > PILOT_LIMITS.goalMaxLength || revision.length > PILOT_LIMITS.revisionMaxLength) fail('PILOT_PROOF_LIMIT_EXCEEDED');
  return { goalSha256: sha256Utf8(goal), revisionSha256: sha256Utf8(revision) };
}

/** A serialized execute request must carry the exact goal in both places, byte for byte. */
export function assertSerializedGoal(body: unknown, goal: string): void {
  const value = body as { intent?: unknown; inputs?: { websiteGoal?: unknown } } | null;
  if (!value || typeof value.intent !== 'string' || typeof value.inputs?.websiteGoal !== 'string') fail('PILOT_PROOF_REQUEST_SHAPE');
  const expected = sha256Utf8(goal);
  if (sha256Utf8(value!.intent as string) !== expected) fail('PILOT_PROOF_INTENT_HASH_MISMATCH');
  if (sha256Utf8(value!.inputs!.websiteGoal as string) !== expected) fail('PILOT_PROOF_INPUT_HASH_MISMATCH');
}

export interface PilotIdentities {
  jobId: string; rootRunId: string; v1Id: string; v2Id: string; v1HtmlSha256: string; v2HtmlSha256: string;
  profileDigest: string; v1RunId: string; v2RunId: string; paidStarts: number;
}

/** Job, root, both versions, both hashes and both runs must be well formed and mutually distinct where required. */
export function assertIdentities(value: Partial<PilotIdentities>): PilotIdentities {
  const id = value as PilotIdentities;
  if (![id.jobId, id.v1Id, id.v2Id].every(x => typeof x === 'string' && UUID.test(x))) fail('PILOT_PROOF_IDENTITY_FORMAT');
  if (![id.rootRunId, id.v1RunId, id.v2RunId].every(x => typeof x === 'string' && RUN_ID.test(x))) fail('PILOT_PROOF_RUN_FORMAT');
  if (![id.v1HtmlSha256, id.v2HtmlSha256, id.profileDigest].every(x => typeof x === 'string' && SHA256.test(x))) fail('PILOT_PROOF_HASH_FORMAT');
  if (id.v1Id === id.v2Id) fail('PILOT_PROOF_VERSIONS_NOT_DISTINCT');
  if (id.v1RunId === id.v2RunId) fail('PILOT_PROOF_RUNS_NOT_DISTINCT');
  if (id.v1RunId !== id.rootRunId) fail('PILOT_PROOF_ROOT_IS_NOT_FIRST_RUN');
  if (id.paidStarts !== 2) fail('PILOT_PROOF_PAID_START_COUNT', `${id.paidStarts}`);
  return id;
}

export interface DownloadExpectation { sha256: string; byteLength: number; boundSha256?: string }

/**
 * The original downloaded bytes are hashed and measured before anything is decoded: decoding first would let malformed
 * UTF-8 turn into replacement characters that hash like a valid document. Strict decoding comes last and only proves
 * the verified bytes are text. `boundSha256` is the digest another record (link, decision) names for the same version.
 */
export function assertDownloadedBytes(bytes: Uint8Array | null | undefined, expected: DownloadExpectation): string {
  if (bytes === null || bytes === undefined) return fail('PILOT_PROOF_DOWNLOAD_BYTES_MISSING');
  if (Object.prototype.toString.call(bytes) !== '[object Uint8Array]') return fail('PILOT_PROOF_DOWNLOAD_NOT_BYTES');
  if (bytes.length === 0) return fail('PILOT_PROOF_DOWNLOAD_BYTES_MISSING');
  if (!SHA256.test(expected.sha256) || (expected.boundSha256 !== undefined && !SHA256.test(expected.boundSha256))) fail('PILOT_PROOF_HASH_FORMAT');
  if (!Number.isSafeInteger(expected.byteLength) || expected.byteLength <= 0) fail('PILOT_PROOF_DOWNLOAD_LENGTH_INVALID');
  const digest = createHash('sha256').update(bytes).digest('hex');
  if (digest !== expected.sha256) fail('PILOT_PROOF_DOWNLOAD_HASH_MISMATCH');
  if (bytes.length !== expected.byteLength) fail('PILOT_PROOF_DOWNLOAD_LENGTH_MISMATCH', `${bytes.length}:${expected.byteLength}`);
  if (expected.boundSha256 !== undefined && digest !== expected.boundSha256) fail('PILOT_PROOF_DOWNLOAD_IDENTITY_MISMATCH');
  try { return new TextDecoder('utf-8', { fatal: true }).decode(bytes); } catch { return fail('PILOT_PROOF_DOWNLOAD_NOT_UTF8'); }
}

/** A preview is structurally acceptable only with the requested heading, the three sections and the same-page call to action. */
export function assertPreviewStructure(html: string, expected: { heading: string; sections: string[]; ctaText: string }): void {
  const headings = [...html.matchAll(/<h1[^>]*>([^<]*)<\/h1>/gi)].map(m => m[1].trim());
  const sections = [...html.matchAll(/<h2[^>]*>([^<]*)<\/h2>/gi)].map(m => m[1].trim());
  if (headings.length !== 1 || headings[0] !== expected.heading) fail('PILOT_PROOF_PREVIEW_HEADING');
  if (JSON.stringify(sections) !== JSON.stringify(expected.sections)) fail('PILOT_PROOF_PREVIEW_SECTIONS');
  if (!new RegExp(`<a[^>]*href="#[^"]+"[^>]*>\\s*${expected.ctaText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*</a>`).test(html)) fail('PILOT_PROOF_PREVIEW_CTA');
  if (/<script|<form|https?:\/\//i.test(html)) fail('PILOT_PROOF_PREVIEW_ACTIVE_CONTENT');
}

export interface Principal { userId: string; orgId: string; teamId: string }
const PRINCIPAL_PART = /^[A-Za-z0-9_-]{1,150}$/;
const PRODUCT_DECISION_SCHEMA = 'cvf.htmlPilotProductDecision.v1';
export const FIXTURE_ATTRIBUTION_SCHEMA = 'cvf.htmlPilotConsumerFixtureAttribution.v1';

/** The pinned owner comes from Root's effect profile; it is validated, never defaulted or filled in from the readback. */
export function assertPinnedPrincipal(value: unknown, label = 'owner'): Principal {
  const v = value as Record<string, unknown> | null | undefined;
  if (!v || typeof v !== 'object' || Array.isArray(v) || Object.keys(v).sort().join() !== 'orgId,teamId,userId'
    || !['userId', 'orgId', 'teamId'].every(k => typeof v[k] === 'string' && PRINCIPAL_PART.test(v[k] as string))) return fail('PILOT_PROOF_PRINCIPAL_INVALID', label);
  return { userId: v.userId as string, orgId: v.orgId as string, teamId: v.teamId as string };
}
const samePrincipal = (a: Principal, b: Principal) => a.userId === b.userId && a.orgId === b.orgId && a.teamId === b.teamId;

export interface ProductDecisionReadback {
  schema: string; jobId: string; sourceRecordId: string; versionId: string; decisionId: string; htmlSha256: string;
  sourceEvidenceSha256: string; decision: string; reviewedVersionConfirmed: boolean; owner: Principal; actor: Principal;
  decidedAt: string; expiresAt: string;
}
export interface ExpectedProductDecision {
  jobId: string; sourceRecordId: string; versionId: string; htmlSha256: string; sourceEvidenceSha256: string;
  decision: 'ACCEPTED' | 'REJECTED'; owner: Principal;
}
const utcTime = (value: unknown): number => {
  const parsed = typeof value === 'string' ? Date.parse(value) : Number.NaN;
  return Number.isFinite(parsed) && new Date(parsed).toISOString() === value ? parsed : Number.NaN;
};

/**
 * An account decision read back from the product route must be a real, non-null record: the pinned owner and actor,
 * a real decisionId and the exact version, hash and evidence that were reviewed. Nothing here is constructed.
 */
export function assertDecisionBinding(decision: unknown, expected: ExpectedProductDecision): ProductDecisionReadback {
  if (decision === null || decision === undefined) return fail('PILOT_PROOF_DECISION_MISSING');
  const d = decision as Partial<ProductDecisionReadback>;
  if (typeof d !== 'object' || d.schema !== PRODUCT_DECISION_SCHEMA) return fail('PILOT_PROOF_DECISION_SCHEMA');
  if (typeof d.decisionId !== 'string' || !UUID.test(d.decisionId)) return fail('PILOT_PROOF_DECISION_ID_INVALID');
  for (const key of ['jobId', 'sourceRecordId', 'versionId', 'htmlSha256', 'sourceEvidenceSha256', 'decision'] as const) {
    if (d[key] !== expected[key]) fail('PILOT_PROOF_DECISION_MISMATCH', key);
  }
  const pinned = assertPinnedPrincipal(expected.owner, 'expected-owner');
  for (const role of ['owner', 'actor'] as const) {
    if (!samePrincipal(assertPinnedPrincipal(d[role], role), pinned)) fail('PILOT_PROOF_DECISION_PRINCIPAL_MISMATCH', role);
  }
  if (d.reviewedVersionConfirmed !== true) fail('PILOT_PROOF_DECISION_UNCONFIRMED');
  const decidedAt = utcTime(d.decidedAt); const expiresAt = utcTime(d.expiresAt);
  if (!Number.isFinite(decidedAt) || !Number.isFinite(expiresAt) || decidedAt >= expiresAt) fail('PILOT_PROOF_DECISION_TIMESTAMPS');
  return d as ProductDecisionReadback;
}

/** A later readback (after restart or restore) must be the same stored record, field for field. */
export function assertDecisionPersisted(original: ProductDecisionReadback, reread: unknown, label: string): void {
  if (reread === null || reread === undefined) fail('PILOT_PROOF_DECISION_NOT_PERSISTED', label);
  const r = reread as Partial<ProductDecisionReadback>;
  for (const key of ['schema', 'jobId', 'sourceRecordId', 'versionId', 'decisionId', 'htmlSha256', 'sourceEvidenceSha256', 'decision',
    'reviewedVersionConfirmed', 'decidedAt', 'expiresAt'] as const) {
    if (r[key] !== original[key]) fail('PILOT_PROOF_DECISION_CHANGED', `${label}:${key}`);
  }
  for (const role of ['owner', 'actor'] as const) {
    if (!r[role] || !samePrincipal(r[role] as Principal, original[role])) fail('PILOT_PROOF_DECISION_CHANGED', `${label}:${role}`);
  }
}

export interface FixtureAttribution {
  schema: typeof FIXTURE_ATTRIBUTION_SCHEMA; attribution: 'SYNTHETIC_TEST_FIXTURE'; automated: true;
  decisionId: string; jobId: string; versionId: string; decision: 'ACCEPTED'; actor: Principal;
}

/** Test-side record only, bound to the decisionId the product actually stored. It adds no production schema or session field. */
export function bindFixtureAttribution(readback: ProductDecisionReadback): FixtureAttribution {
  if (readback.decision !== 'ACCEPTED') fail('PILOT_PROOF_V1_NOT_ACCEPTED');
  return { schema: FIXTURE_ATTRIBUTION_SCHEMA, attribution: 'SYNTHETIC_TEST_FIXTURE', automated: true, decisionId: readback.decisionId,
    jobId: readback.jobId, versionId: readback.versionId, decision: 'ACCEPTED', actor: { ...readback.actor } };
}

/** v1 is an accepted automated fixture bound to its real decisionId; final v2 has no stored decision and stays human-pending. */
export function assertDecisionAttribution(input: { v1Decision: ProductDecisionReadback | null | undefined; fixture: Partial<FixtureAttribution> | null | undefined;
  v2DecisionState: string | null | undefined; v2DecisionHttpStatus: number | null | undefined }): void {
  const { v1Decision, fixture } = input;
  if (!v1Decision) fail('PILOT_PROOF_DECISION_MISSING');
  if (v1Decision!.decision !== 'ACCEPTED') fail('PILOT_PROOF_V1_NOT_ACCEPTED');
  if (!fixture) fail('PILOT_PROOF_FIXTURE_ATTRIBUTION_MISSING');
  if (fixture!.schema !== FIXTURE_ATTRIBUTION_SCHEMA || fixture!.attribution !== 'SYNTHETIC_TEST_FIXTURE' || fixture!.automated !== true) fail('PILOT_PROOF_V1_FIXTURE_UNATTRIBUTED');
  for (const key of ['decisionId', 'jobId', 'versionId', 'decision'] as const) {
    if (fixture![key] !== v1Decision![key]) fail('PILOT_PROOF_FIXTURE_ATTRIBUTION_UNBOUND', key);
  }
  if (!fixture!.actor || !samePrincipal(fixture!.actor, v1Decision!.actor)) fail('PILOT_PROOF_FIXTURE_ATTRIBUTION_UNBOUND', 'actor');
  if (input.v2DecisionState !== 'PENDING_OPERATOR_ACCEPTANCE') fail('PILOT_PROOF_V2_NOT_HUMAN_PENDING', `${input.v2DecisionState}`);
  if (input.v2DecisionHttpStatus !== 404) fail('PILOT_PROOF_V2_DECISION_STORED', `${input.v2DecisionHttpStatus}`);
}

/** Effect counters. Browser execute starts are page events only; guard values are the Root-authoritative provider accounting. */
export interface EffectCounters { operations: number; claims: number; outcomes: number; browserExecuteStarts: number; artifactWrites: number;
  guardCallsUsed: number; guardAttempts: number }
const COUNTER_KEYS: ReadonlyArray<keyof EffectCounters> = ['operations', 'claims', 'outcomes', 'browserExecuteStarts', 'artifactWrites',
  'guardCallsUsed', 'guardAttempts'];

export interface GuardBinding { runId: string; grantId: string; sourceHead: string; manifestSha256: string; guardStatePath: string }
export interface GuardReading { callsUsed: number; attempts: number }
const GUARD_MANIFEST_SCHEMA = 'cvf.sealedSyntheticLiveRun.v2';
const SOURCE_HEAD = /^[a-f0-9]{40}$/i;
const sameFile = (a: string, b: string) => process.platform === 'win32' ? path.resolve(a).toLowerCase() === path.resolve(b).toLowerCase() : path.resolve(a) === path.resolve(b);

/** Where the existing Root global manifest may be: the run root variable itself, or the run directory that holds the control directory. */
export function guardManifestCandidates(runRoot: string | undefined, controlDir: string | undefined): string[] {
  if (!runRoot || !controlDir || !path.isAbsolute(runRoot) || !path.isAbsolute(controlDir)) return fail('PILOT_PROOF_GUARD_ENV_MISSING');
  const candidates = [path.join(runRoot, 'global-manifest.json'), path.join(path.dirname(controlDir), 'global-manifest.json')];
  return candidates.filter((file, index) => candidates.findIndex(other => sameFile(other, file)) === index);
}

/** The Root global manifest binds run, grant, head and the guard state file; a missing, malformed or foreign one fails closed. */
export function parseGuardBinding(manifest: unknown, manifestSha256: string, expected: { sourceHead: string | undefined; ownedRoot: string | undefined }): GuardBinding {
  const m = manifest as Record<string, unknown> | null | undefined;
  if (!m || typeof m !== 'object' || Array.isArray(m) || m.schemaVersion !== GUARD_MANIFEST_SCHEMA) return fail('PILOT_PROOF_GUARD_MANIFEST_INVALID');
  if (!SHA256.test(manifestSha256)) return fail('PILOT_PROOF_HASH_FORMAT');
  if (![m.runId, m.grantId].every(x => typeof x === 'string' && /^[A-Za-z0-9_-]{8,128}$/.test(x))) return fail('PILOT_PROOF_GUARD_MANIFEST_INVALID', 'identity');
  if (typeof m.sourceHead !== 'string' || !SOURCE_HEAD.test(m.sourceHead) || !expected.sourceHead || m.sourceHead.toLowerCase() !== expected.sourceHead.toLowerCase()) return fail('PILOT_PROOF_GUARD_FOREIGN', 'sourceHead');
  if (typeof m.ownedRoot !== 'string' || !expected.ownedRoot || !sameFile(m.ownedRoot, expected.ownedRoot)) return fail('PILOT_PROOF_GUARD_FOREIGN', 'ownedRoot');
  if (typeof m.guardState !== 'string' || !path.isAbsolute(m.guardState)) return fail('PILOT_PROOF_GUARD_MANIFEST_INVALID', 'guardState');
  return { runId: m.runId as string, grantId: m.grantId as string, sourceHead: m.sourceHead, manifestSha256, guardStatePath: m.guardState };
}

/** A guard snapshot counts only when it names the same run, grant, head and manifest digest and carries safe integer counters. */
export function parseGuardReading(state: unknown, binding: GuardBinding): GuardReading {
  const s = state as Record<string, unknown> | null | undefined;
  if (!s || typeof s !== 'object' || Array.isArray(s)) return fail('PILOT_PROOF_GUARD_STATE_INVALID');
  if (s.runId !== binding.runId || s.grantId !== binding.grantId || typeof s.sourceHead !== 'string'
    || s.sourceHead.toLowerCase() !== binding.sourceHead.toLowerCase() || s.manifestSha256 !== binding.manifestSha256) return fail('PILOT_PROOF_GUARD_FOREIGN', 'binding');
  if (s.status !== 'ARMED' && s.status !== 'REVOKED') return fail('PILOT_PROOF_GUARD_STATUS', `${String(s.status)}`);
  const calls = s.callsUsed;
  if (!Number.isSafeInteger(calls) || (calls as number) < 0 || !Array.isArray(s.attempts)) return fail('PILOT_PROOF_GUARD_STATE_INVALID', 'counters');
  return { callsUsed: calls as number, attempts: s.attempts.length };
}

/** Provider accounting never moves backwards; a smaller value means the guard was reset or replaced. */
export function assertGuardAdvance(previous: GuardReading | null, next: GuardReading, label: string): void {
  if (previous && (next.callsUsed < previous.callsUsed || next.attempts < previous.attempts)) fail('PILOT_PROOF_GUARD_RESET', label);
}

/** A paid start moves the authoritative guard by exactly the stated amounts, never by a page-event count. */
export function assertGuardDelta(before: GuardReading, after: GuardReading, expected: { calls: number; attempts: number }, label: string): void {
  assertGuardAdvance(before, after, label);
  if (after.callsUsed - before.callsUsed !== expected.calls || after.attempts - before.attempts !== expected.attempts) {
    fail('PILOT_PROOF_GUARD_DELTA', `${label}:${after.callsUsed - before.callsUsed}:${after.attempts - before.attempts}`);
  }
}

/** A denied attempt must leave every owned counter unchanged; a missing counter is an unproved zero, not a zero. */
export function assertDeniedEffectDelta(before: Partial<EffectCounters> | null | undefined, after: Partial<EffectCounters> | null | undefined, label: string): void {
  if (!before || !after) fail('PILOT_PROOF_COUNTERS_MISSING', label);
  for (const key of COUNTER_KEYS) {
    const b = before![key]; const a = after![key];
    if (typeof b !== 'number' || typeof a !== 'number' || !Number.isInteger(b) || !Number.isInteger(a)) fail('PILOT_PROOF_COUNTER_INVALID', `${label}:${key}`);
    if (a !== b) fail('PILOT_PROOF_DENIED_EFFECT_DELTA', `${label}:${key}:${(a as number) - (b as number)}`);
  }
}

/**
 * A response that arrives after a local Stop of a separate, unsaved render must not have produced a save, an enabled save
 * control or a request, and must leave the saved, accepted version it ran beside exactly as it was.
 */
export function assertLateOutcomeFenced(input: { draftsBefore: number; draftsAfter: number; enabledSaveControlCount: number; startsBefore: number; startsAfter: number;
  savedVersionBefore: string | null; savedVersionAfter: string | null; decisionAfter: string | null }): void {
  if (input.draftsAfter !== input.draftsBefore) fail('PILOT_PROOF_LATE_OUTCOME_SAVED');
  if (input.enabledSaveControlCount !== 0) fail('PILOT_PROOF_LATE_OUTCOME_CONTROL');
  if (input.startsAfter !== input.startsBefore) fail('PILOT_PROOF_STOP_STARTED_REQUEST');
  if (!input.savedVersionBefore || input.savedVersionAfter !== input.savedVersionBefore) fail('PILOT_PROOF_STOP_REPLACED_SAVED_VERSION');
  if (input.decisionAfter !== 'ACCEPTED') fail('PILOT_PROOF_STOP_OVERWROTE_ACCEPTED', `${input.decisionAfter}`);
}

export interface Timings { providerAwaitSeconds: number; localGovernanceSeconds: number; previewSeconds: number }
export interface TimingPhase { name: string; startMs: number; endMs: number }
export interface FaultInterval { label: string; startMs: number; endMs: number }
export const CLEAN_PREVIEW_PHASES = ['provider-response', 'transfer-and-create', 'render-and-save', 'preview-visible'] as const;

/**
 * The first-preview figure is the ordered, non-overlapping span of the ordinary path. No denial, Stop or other fault
 * interval may touch it, and the reported seconds must equal that span rather than any wider wall-clock measure.
 */
export function assertCleanPreviewTiming(input: { phases: TimingPhase[] | null | undefined; faults: FaultInterval[] | null | undefined; previewSeconds: number }, label: string): void {
  const { phases, faults } = input;
  if (!Array.isArray(phases) || !Array.isArray(faults)) return fail('PILOT_PROOF_TIMING_PHASES_MISSING', label);
  if (phases.length !== CLEAN_PREVIEW_PHASES.length || phases.some((phase, i) => phase?.name !== CLEAN_PREVIEW_PHASES[i])) fail('PILOT_PROOF_TIMING_PHASES_UNORDERED', label);
  for (const phase of phases) {
    if (!Number.isFinite(phase.startMs) || !Number.isFinite(phase.endMs) || phase.endMs < phase.startMs) fail('PILOT_PROOF_TIMING_PHASE_INVALID', `${label}:${phase.name}`);
  }
  for (let i = 1; i < phases.length; i += 1) {
    if (phases[i].startMs < phases[i - 1].endMs) fail('PILOT_PROOF_TIMING_PHASES_OVERLAP', `${label}:${phases[i].name}`);
  }
  const start = phases[0].startMs; const end = phases[phases.length - 1].endMs;
  for (const fault of faults) {
    if (!fault || !Number.isFinite(fault.startMs) || !Number.isFinite(fault.endMs) || fault.endMs < fault.startMs) fail('PILOT_PROOF_TIMING_FAULT_INVALID', label);
    if (fault.startMs < end && fault.endMs > start) fail('PILOT_PROOF_TIMING_FAULT_IN_CLEAN_WINDOW', `${label}:${fault.label}`);
  }
  if (Math.abs(input.previewSeconds - (end - start) / 1000) > 0.05) fail('PILOT_PROOF_TIMING_SPAN_MISMATCH', label);
}

/** Measured values are separate and finite; the first-preview and local-governance limits apply to their own measure only. */
export function assertTimings(value: Partial<Timings> | null | undefined, label: string): Timings {
  if (!value) return fail('PILOT_PROOF_TIMINGS_MISSING', label);
  const timings = { providerAwaitSeconds: finite(value.providerAwaitSeconds, `${label}:providerAwait`),
    localGovernanceSeconds: finite(value.localGovernanceSeconds, `${label}:localGovernance`),
    previewSeconds: finite(value.previewSeconds, `${label}:preview`) };
  if (timings.providerAwaitSeconds <= 0) fail('PILOT_PROOF_PROVIDER_AWAIT_NOT_MEASURED', label);
  if (timings.localGovernanceSeconds > PILOT_LIMITS.localGovernanceSeconds) fail('PILOT_PROOF_GOVERNANCE_OVER_LIMIT', label);
  if (timings.previewSeconds > PILOT_LIMITS.firstPreviewSeconds) fail('PILOT_PROOF_PREVIEW_OVER_LIMIT', label);
  return timings;
}

export function assertRestoreSeconds(seconds: unknown, label: string): number {
  const value = finite(seconds, label);
  if (value > PILOT_LIMITS.restoreSeconds) fail('PILOT_PROOF_RESTORE_OVER_LIMIT', label);
  return value;
}

/** Exported evidence and console output must not contain any forbidden fragment (credentials, signed headers, request bodies). */
export function assertRedacted(serialized: string, forbidden: ReadonlyArray<string>): void {
  for (const fragment of forbidden) {
    if (fragment.length >= 6 && serialized.includes(fragment)) fail('PILOT_PROOF_UNREDACTED_FRAGMENT');
  }
  if (/api[_-]?key["':= ]+[A-Za-z0-9._-]{8,}|bearer\s+[A-Za-z0-9._-]{8,}|sk-[A-Za-z0-9]{8,}|x-cvf-service-signature/i.test(serialized)) fail('PILOT_PROOF_SECRET_PATTERN');
}
