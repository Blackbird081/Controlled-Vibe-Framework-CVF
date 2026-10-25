// Text Encoding Exception: invented Vietnamese fixture text proves UTF-16 length and UTF-8 hash handling.
import { createHash } from 'node:crypto';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  CLEAN_PREVIEW_PHASES, PILOT_LIMITS, PilotProofError, assertCleanPreviewTiming, assertDecisionAttribution, assertDecisionBinding,
  assertDecisionPersisted, assertDeniedEffectDelta, assertDownloadedBytes, assertFixtureGoals, assertGuardAdvance, assertGuardDelta,
  assertIdentities, assertLateOutcomeFenced, assertPinnedPrincipal, assertPreviewStructure, assertRedacted, assertRestoreSeconds,
  assertSerializedGoal, assertTimings, bindFixtureAttribution, guardManifestCandidates, parseGuardBinding, parseGuardReading, sha256Utf8,
  type EffectCounters, type GuardBinding, type PilotIdentities, type ProductDecisionReadback, type TimingPhase,
} from './ncr-html-pilot-proof-assertions';

const pad = (seed: string, length: number) => seed.repeat(Math.ceil(length / seed.length)).slice(0, length);
const goal = pad('Trang giới thiệu không gian đọc sách hư cấu Ánh Sao. ', PILOT_LIMITS.initialGoalLength);
const revision = pad('Đổi tên thành Ngày hội đọc Ánh Sao và giữ ba mục. ', PILOT_LIMITS.revisionGoalLength);
const codeOf = (run: () => unknown) => { try { run(); } catch (error) { return (error as PilotProofError).code; } return 'NO_ERROR'; };
const uuid = (n: number) => `${String(n).repeat(8).slice(0, 8)}-1111-4111-8111-${String(n).repeat(12).slice(0, 12)}`;
const hex = (c: string, n: number) => c.repeat(n);
const identities = (): PilotIdentities => ({ jobId: uuid(1), rootRunId: hex('a', 32), v1Id: uuid(2), v2Id: uuid(3),
  v1HtmlSha256: hex('b', 64), v2HtmlSha256: hex('c', 64), profileDigest: hex('d', 64), v1RunId: hex('a', 32), v2RunId: hex('e', 32), paidStarts: 2 });
const counters = (): EffectCounters => ({ operations: 3, claims: 2, outcomes: 2, browserExecuteStarts: 2, artifactWrites: 4, guardCallsUsed: 19, guardAttempts: 19 });
const digestOf = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');

describe('locked goals and serialization', () => {
  it('accepts the exact 547 and 442 character inputs and keeps the form limits above them', () => {
    expect(assertFixtureGoals(goal, revision)).toEqual({ goalSha256: sha256Utf8(goal), revisionSha256: sha256Utf8(revision) });
    expect(PILOT_LIMITS.goalMaxLength).toBeGreaterThan(goal.length);
    expect(PILOT_LIMITS.revisionMaxLength).toBeGreaterThan(revision.length);
  });
  it('rejects a clipped or padded goal rather than normalizing it', () => {
    expect(codeOf(() => assertFixtureGoals(goal.slice(0, 200), revision))).toBe('PILOT_PROOF_GOAL_LENGTH');
    expect(codeOf(() => assertFixtureGoals(`${goal} `, revision))).toBe('PILOT_PROOF_GOAL_LENGTH');
    expect(codeOf(() => assertFixtureGoals(goal, `${revision}x`))).toBe('PILOT_PROOF_REVISION_LENGTH');
  });
  it('requires intent and websiteGoal to hash to the exact goal', () => {
    expect(() => assertSerializedGoal({ intent: goal, inputs: { websiteGoal: goal } }, goal)).not.toThrow();
    expect(codeOf(() => assertSerializedGoal({ intent: goal.slice(0, 200), inputs: { websiteGoal: goal } }, goal))).toBe('PILOT_PROOF_INTENT_HASH_MISMATCH');
    expect(codeOf(() => assertSerializedGoal({ intent: goal, inputs: { websiteGoal: `${goal}.` } }, goal))).toBe('PILOT_PROOF_INPUT_HASH_MISMATCH');
    expect(codeOf(() => assertSerializedGoal({ intent: goal }, goal))).toBe('PILOT_PROOF_REQUEST_SHAPE');
    expect(codeOf(() => assertSerializedGoal(null, goal))).toBe('PILOT_PROOF_REQUEST_SHAPE');
  });
});

describe('identities and downloads', () => {
  it('accepts a consistent identity set and exactly two paid starts', () => {
    expect(assertIdentities(identities()).paidStarts).toBe(2);
  });
  it('rejects inconsistent identities', () => {
    expect(codeOf(() => assertIdentities({ ...identities(), v2Id: identities().v1Id }))).toBe('PILOT_PROOF_VERSIONS_NOT_DISTINCT');
    expect(codeOf(() => assertIdentities({ ...identities(), v2RunId: identities().v1RunId }))).toBe('PILOT_PROOF_RUNS_NOT_DISTINCT');
    expect(codeOf(() => assertIdentities({ ...identities(), rootRunId: hex('f', 32) }))).toBe('PILOT_PROOF_ROOT_IS_NOT_FIRST_RUN');
    expect(codeOf(() => assertIdentities({ ...identities(), v1HtmlSha256: 'short' }))).toBe('PILOT_PROOF_HASH_FORMAT');
    expect(codeOf(() => assertIdentities({ ...identities(), jobId: 'not-a-uuid' }))).toBe('PILOT_PROOF_IDENTITY_FORMAT');
    expect(codeOf(() => assertIdentities({ ...identities(), paidStarts: 3 }))).toBe('PILOT_PROOF_PAID_START_COUNT');
    expect(codeOf(() => assertIdentities({}))).toBe('PILOT_PROOF_IDENTITY_FORMAT');
  });
  it('hashes the original downloaded bytes and their length before any decoding', () => {
    const html = '<h1>Không gian đọc Ánh Sao</h1>';
    const bytes = Buffer.from(html, 'utf8');
    const expected = { sha256: sha256Utf8(html), byteLength: bytes.length };
    expect(assertDownloadedBytes(bytes, expected)).toBe(html);
    expect(assertDownloadedBytes(new Uint8Array(bytes), { ...expected, boundSha256: expected.sha256 })).toBe(html);
    expect(codeOf(() => assertDownloadedBytes(undefined, expected))).toBe('PILOT_PROOF_DOWNLOAD_BYTES_MISSING');
    expect(codeOf(() => assertDownloadedBytes(new Uint8Array(0), expected))).toBe('PILOT_PROOF_DOWNLOAD_BYTES_MISSING');
    expect(codeOf(() => assertDownloadedBytes(html as unknown as Uint8Array, expected))).toBe('PILOT_PROOF_DOWNLOAD_NOT_BYTES');
    expect(codeOf(() => assertDownloadedBytes(Buffer.from(`${html} `, 'utf8'), expected))).toBe('PILOT_PROOF_DOWNLOAD_HASH_MISMATCH');
    expect(codeOf(() => assertDownloadedBytes(bytes, { ...expected, sha256: 'not-a-hash' }))).toBe('PILOT_PROOF_HASH_FORMAT');
    expect(codeOf(() => assertDownloadedBytes(bytes, { ...expected, byteLength: 0 }))).toBe('PILOT_PROOF_DOWNLOAD_LENGTH_INVALID');
  });
  it('rejects a byte length that differs from the saved version even when the digest matches', () => {
    const bytes = Buffer.from('<h1>Ánh Sao</h1>', 'utf8');
    expect(codeOf(() => assertDownloadedBytes(bytes, { sha256: digestOf(bytes), byteLength: bytes.length - 1 }))).toBe('PILOT_PROOF_DOWNLOAD_LENGTH_MISMATCH');
    expect(codeOf(() => assertDownloadedBytes(bytes, { sha256: digestOf(bytes), byteLength: bytes.length + 1 }))).toBe('PILOT_PROOF_DOWNLOAD_LENGTH_MISMATCH');
  });
  it('rejects malformed UTF-8 that would decode to the same replacement text as a valid document', () => {
    const valid = '<h1>Ánh � Sao</h1>';
    const malformed = Buffer.concat([Buffer.from('<h1>Ánh ', 'utf8'), Buffer.from([0xff]), Buffer.from(' Sao</h1>', 'utf8')]);
    expect(malformed.toString('utf8')).toBe(valid);
    // The former decode-then-hash check accepted this pair; hashing the original bytes must not.
    expect(sha256Utf8(malformed.toString('utf8'))).toBe(sha256Utf8(valid));
    expect(codeOf(() => assertDownloadedBytes(malformed, { sha256: sha256Utf8(valid), byteLength: Buffer.byteLength(valid, 'utf8') }))).toBe('PILOT_PROOF_DOWNLOAD_HASH_MISMATCH');
    expect(codeOf(() => assertDownloadedBytes(malformed, { sha256: sha256Utf8(valid), byteLength: malformed.length }))).toBe('PILOT_PROOF_DOWNLOAD_HASH_MISMATCH');
    // Even a digest recorded from the malformed bytes themselves must fail the strict text decode.
    expect(codeOf(() => assertDownloadedBytes(malformed, { sha256: digestOf(malformed), byteLength: malformed.length }))).toBe('PILOT_PROOF_DOWNLOAD_NOT_UTF8');
  });
  it('rejects a digest that another record binds to a different version', () => {
    const bytes = Buffer.from('<h1>Ánh Sao</h1>', 'utf8');
    const expected = { sha256: digestOf(bytes), byteLength: bytes.length };
    expect(codeOf(() => assertDownloadedBytes(bytes, { ...expected, boundSha256: hex('a', 64) }))).toBe('PILOT_PROOF_DOWNLOAD_IDENTITY_MISMATCH');
    expect(codeOf(() => assertDownloadedBytes(bytes, { ...expected, boundSha256: 'short' }))).toBe('PILOT_PROOF_HASH_FORMAT');
  });
  it('checks the requested heading, three sections and same-page call to action', () => {
    const expected = { heading: 'Không gian đọc Ánh Sao', sections: ['Giới thiệu', 'Hoạt động', 'Liên hệ'], ctaText: 'Đăng ký tham gia' };
    const html = '<h1>Không gian đọc Ánh Sao</h1><h2>Giới thiệu</h2><h2>Hoạt động</h2><h2>Liên hệ</h2><a href="#lien-he">Đăng ký tham gia</a>';
    expect(() => assertPreviewStructure(html, expected)).not.toThrow();
    expect(codeOf(() => assertPreviewStructure(html.replace('Không gian', 'Phòng'), expected))).toBe('PILOT_PROOF_PREVIEW_HEADING');
    expect(codeOf(() => assertPreviewStructure(html.replace('<h2>Liên hệ</h2>', ''), expected))).toBe('PILOT_PROOF_PREVIEW_SECTIONS');
    expect(codeOf(() => assertPreviewStructure(html.replace('#lien-he', 'x'), expected))).toBe('PILOT_PROOF_PREVIEW_CTA');
    expect(codeOf(() => assertPreviewStructure(`${html}<script>1</script>`, expected))).toBe('PILOT_PROOF_PREVIEW_ACTIVE_CONTENT');
  });
});

describe('decisions', () => {
  const owner = { userId: 'usr_3', orgId: 'org_cvf', teamId: 'team_eng' };
  const expected = { jobId: uuid(1), sourceRecordId: hex('a', 32), versionId: uuid(2), htmlSha256: hex('b', 64), sourceEvidenceSha256: hex('9', 64),
    decision: 'ACCEPTED' as const, owner };
  const readback = (): ProductDecisionReadback => ({ schema: 'cvf.htmlPilotProductDecision.v1', jobId: expected.jobId, sourceRecordId: expected.sourceRecordId,
    versionId: expected.versionId, decisionId: uuid(4), htmlSha256: expected.htmlSha256, sourceEvidenceSha256: expected.sourceEvidenceSha256,
    decision: 'ACCEPTED', reviewedVersionConfirmed: true, owner: { ...owner }, actor: { ...owner },
    decidedAt: '2026-10-21T08:00:00.000Z', expiresAt: '2026-10-22T08:00:00.000Z' });
  it('requires the pinned principal to be well formed rather than defaulted', () => {
    expect(assertPinnedPrincipal(owner)).toEqual(owner);
    expect(codeOf(() => assertPinnedPrincipal(null))).toBe('PILOT_PROOF_PRINCIPAL_INVALID');
    expect(codeOf(() => assertPinnedPrincipal({ userId: 'usr_3', orgId: 'org_cvf' }))).toBe('PILOT_PROOF_PRINCIPAL_INVALID');
    expect(codeOf(() => assertPinnedPrincipal({ ...owner, teamId: 'team eng' }))).toBe('PILOT_PROOF_PRINCIPAL_INVALID');
    expect(codeOf(() => assertPinnedPrincipal({ ...owner, extra: 'x' }))).toBe('PILOT_PROOF_PRINCIPAL_INVALID');
  });
  it('requires an actual non-null readback that names the pinned principal, a real decisionId and the exact reviewed version', () => {
    expect(assertDecisionBinding(readback(), expected).decisionId).toBe(uuid(4));
    expect(codeOf(() => assertDecisionBinding(null, expected))).toBe('PILOT_PROOF_DECISION_MISSING');
    expect(codeOf(() => assertDecisionBinding(undefined, expected))).toBe('PILOT_PROOF_DECISION_MISSING');
    expect(codeOf(() => assertDecisionBinding({ ...readback(), schema: 'other' }, expected))).toBe('PILOT_PROOF_DECISION_SCHEMA');
    expect(codeOf(() => assertDecisionBinding({ ...readback(), decisionId: 'decision-1' }, expected))).toBe('PILOT_PROOF_DECISION_ID_INVALID');
    expect(codeOf(() => assertDecisionBinding({ ...readback(), decisionId: undefined }, expected))).toBe('PILOT_PROOF_DECISION_ID_INVALID');
    expect(codeOf(() => assertDecisionBinding({ ...readback(), versionId: uuid(3) }, expected))).toBe('PILOT_PROOF_DECISION_MISMATCH');
    expect(codeOf(() => assertDecisionBinding({ ...readback(), htmlSha256: hex('c', 64) }, expected))).toBe('PILOT_PROOF_DECISION_MISMATCH');
    expect(codeOf(() => assertDecisionBinding({ ...readback(), sourceEvidenceSha256: hex('8', 64) }, expected))).toBe('PILOT_PROOF_DECISION_MISMATCH');
    expect(codeOf(() => assertDecisionBinding({ ...readback(), sourceRecordId: hex('f', 32) }, expected))).toBe('PILOT_PROOF_DECISION_MISMATCH');
    expect(codeOf(() => assertDecisionBinding({ ...readback(), decision: 'REJECTED' }, expected))).toBe('PILOT_PROOF_DECISION_MISMATCH');
    expect(codeOf(() => assertDecisionBinding({ ...readback(), owner: { ...owner, orgId: 'org_other' } }, expected))).toBe('PILOT_PROOF_DECISION_PRINCIPAL_MISMATCH');
    expect(codeOf(() => assertDecisionBinding({ ...readback(), actor: { ...owner, userId: 'usr_9' } }, expected))).toBe('PILOT_PROOF_DECISION_PRINCIPAL_MISMATCH');
    expect(codeOf(() => assertDecisionBinding({ ...readback(), actor: null as never }, expected))).toBe('PILOT_PROOF_PRINCIPAL_INVALID');
    expect(codeOf(() => assertDecisionBinding({ ...readback(), reviewedVersionConfirmed: false }, expected))).toBe('PILOT_PROOF_DECISION_UNCONFIRMED');
    expect(codeOf(() => assertDecisionBinding({ ...readback(), expiresAt: '2026-10-21T08:00:00.000Z' }, expected))).toBe('PILOT_PROOF_DECISION_TIMESTAMPS');
    expect(codeOf(() => assertDecisionBinding({ ...readback(), decidedAt: 'yesterday' }, expected))).toBe('PILOT_PROOF_DECISION_TIMESTAMPS');
  });
  it('requires the same stored ACCEPTED record after restart and restore', () => {
    const original = assertDecisionBinding(readback(), expected);
    expect(() => assertDecisionPersisted(original, readback(), 'restart')).not.toThrow();
    expect(codeOf(() => assertDecisionPersisted(original, null, 'restart'))).toBe('PILOT_PROOF_DECISION_NOT_PERSISTED');
    expect(codeOf(() => assertDecisionPersisted(original, { ...readback(), decisionId: uuid(5) }, 'restore'))).toBe('PILOT_PROOF_DECISION_CHANGED');
    expect(codeOf(() => assertDecisionPersisted(original, { ...readback(), decision: 'REJECTED' }, 'restore'))).toBe('PILOT_PROOF_DECISION_CHANGED');
    expect(codeOf(() => assertDecisionPersisted(original, { ...readback(), decidedAt: '2026-10-21T08:00:01.000Z' }, 'restore'))).toBe('PILOT_PROOF_DECISION_CHANGED');
    expect(codeOf(() => assertDecisionPersisted(original, { ...readback(), owner: { ...owner, teamId: 'team_x' } }, 'restore'))).toBe('PILOT_PROOF_DECISION_CHANGED');
    expect(codeOf(() => assertDecisionPersisted(original, { ...readback(), actor: undefined as never }, 'restore'))).toBe('PILOT_PROOF_DECISION_CHANGED');
  });
  it('binds the synthetic fixture attribution to the stored decisionId and keeps final v2 human-pending with no stored decision', () => {
    const v1 = readback();
    const fixture = bindFixtureAttribution(v1);
    const input = { v1Decision: v1, fixture, v2DecisionState: 'PENDING_OPERATOR_ACCEPTANCE', v2DecisionHttpStatus: 404 };
    expect(() => assertDecisionAttribution(input)).not.toThrow();
    expect(codeOf(() => bindFixtureAttribution({ ...v1, decision: 'REJECTED' }))).toBe('PILOT_PROOF_V1_NOT_ACCEPTED');
    expect(codeOf(() => assertDecisionAttribution({ ...input, v1Decision: null }))).toBe('PILOT_PROOF_DECISION_MISSING');
    expect(codeOf(() => assertDecisionAttribution({ ...input, v1Decision: { ...v1, decision: 'REJECTED' } }))).toBe('PILOT_PROOF_V1_NOT_ACCEPTED');
    expect(codeOf(() => assertDecisionAttribution({ ...input, fixture: null }))).toBe('PILOT_PROOF_FIXTURE_ATTRIBUTION_MISSING');
    expect(codeOf(() => assertDecisionAttribution({ ...input, fixture: { ...fixture, attribution: 'OPERATOR' as never } }))).toBe('PILOT_PROOF_V1_FIXTURE_UNATTRIBUTED');
    expect(codeOf(() => assertDecisionAttribution({ ...input, fixture: { ...fixture, automated: false as never } }))).toBe('PILOT_PROOF_V1_FIXTURE_UNATTRIBUTED');
    expect(codeOf(() => assertDecisionAttribution({ ...input, fixture: { ...fixture, decisionId: uuid(7) } }))).toBe('PILOT_PROOF_FIXTURE_ATTRIBUTION_UNBOUND');
    expect(codeOf(() => assertDecisionAttribution({ ...input, fixture: { ...fixture, versionId: uuid(7) } }))).toBe('PILOT_PROOF_FIXTURE_ATTRIBUTION_UNBOUND');
    expect(codeOf(() => assertDecisionAttribution({ ...input, fixture: { ...fixture, actor: { ...owner, userId: 'usr_9' } } }))).toBe('PILOT_PROOF_FIXTURE_ATTRIBUTION_UNBOUND');
    expect(codeOf(() => assertDecisionAttribution({ ...input, v2DecisionState: 'ACCEPTED' }))).toBe('PILOT_PROOF_V2_NOT_HUMAN_PENDING');
    expect(codeOf(() => assertDecisionAttribution({ ...input, v2DecisionState: null }))).toBe('PILOT_PROOF_V2_NOT_HUMAN_PENDING');
    expect(codeOf(() => assertDecisionAttribution({ ...input, v2DecisionHttpStatus: 200 }))).toBe('PILOT_PROOF_V2_DECISION_STORED');
    expect(codeOf(() => assertDecisionAttribution({ ...input, v2DecisionHttpStatus: null }))).toBe('PILOT_PROOF_V2_DECISION_STORED');
  });
});

describe('Root-authoritative guard accounting', () => {
  const runRoot = path.resolve('owned-root');
  const controlDir = path.join(runRoot, 'run-2', 'control');
  const head = 'd'.repeat(40);
  const manifestDigest = hex('7', 64);
  const manifest = () => ({ schemaVersion: 'cvf.sealedSyntheticLiveRun.v2', runId: 'ncr-html-run-0001', grantId: 'ncr-grant-run-0001', sourceHead: head,
    ownedRoot: runRoot, guardState: path.resolve('live-control', 'budget-state.json') });
  const guardState = (binding: GuardBinding) => ({ runId: binding.runId, grantId: binding.grantId, sourceHead: binding.sourceHead,
    manifestSha256: binding.manifestSha256, status: 'ARMED', callsUsed: 17, attempts: new Array(17).fill({}) });
  const bind = () => parseGuardBinding(manifest(), manifestDigest, { sourceHead: head, ownedRoot: runRoot });
  it('looks for the existing Root global manifest only beside the run root variable or the control directory', () => {
    expect(guardManifestCandidates(runRoot, controlDir)).toEqual([path.join(runRoot, 'global-manifest.json'), path.join(runRoot, 'run-2', 'global-manifest.json')]);
    expect(guardManifestCandidates(runRoot, path.join(runRoot, 'control'))).toEqual([path.join(runRoot, 'global-manifest.json')]);
    expect(codeOf(() => guardManifestCandidates(undefined, controlDir))).toBe('PILOT_PROOF_GUARD_ENV_MISSING');
    expect(codeOf(() => guardManifestCandidates(runRoot, 'control'))).toBe('PILOT_PROOF_GUARD_ENV_MISSING');
  });
  it('binds only a well formed manifest for this source head and owned root', () => {
    expect(bind()).toMatchObject({ runId: 'ncr-html-run-0001', grantId: 'ncr-grant-run-0001', sourceHead: head, manifestSha256: manifestDigest });
    const attempt = (m: unknown, expectedHead: string | undefined = head, root: string | undefined = runRoot) => codeOf(() => parseGuardBinding(m, manifestDigest, { sourceHead: expectedHead, ownedRoot: root }));
    expect(attempt(null)).toBe('PILOT_PROOF_GUARD_MANIFEST_INVALID');
    expect(attempt({ ...manifest(), schemaVersion: 'cvf.other' })).toBe('PILOT_PROOF_GUARD_MANIFEST_INVALID');
    expect(attempt({ ...manifest(), runId: undefined })).toBe('PILOT_PROOF_GUARD_MANIFEST_INVALID');
    expect(attempt({ ...manifest(), guardState: 'budget-state.json' })).toBe('PILOT_PROOF_GUARD_MANIFEST_INVALID');
    expect(attempt({ ...manifest(), guardState: undefined })).toBe('PILOT_PROOF_GUARD_MANIFEST_INVALID');
    expect(attempt(manifest(), 'e'.repeat(40))).toBe('PILOT_PROOF_GUARD_FOREIGN');
    expect(codeOf(() => parseGuardBinding(manifest(), manifestDigest, { sourceHead: undefined, ownedRoot: runRoot }))).toBe('PILOT_PROOF_GUARD_FOREIGN');
    expect(attempt(manifest(), head, path.resolve('another-root'))).toBe('PILOT_PROOF_GUARD_FOREIGN');
    expect(codeOf(() => parseGuardBinding(manifest(), 'short', { sourceHead: head, ownedRoot: runRoot }))).toBe('PILOT_PROOF_HASH_FORMAT');
  });
  it('accepts only a guard snapshot bound to the same run, grant, head and manifest with safe counters', () => {
    const binding = bind();
    expect(parseGuardReading(guardState(binding), binding)).toEqual({ callsUsed: 17, attempts: 17 });
    const attempt = (state: unknown) => codeOf(() => parseGuardReading(state, binding));
    expect(attempt(undefined)).toBe('PILOT_PROOF_GUARD_STATE_INVALID');
    expect(attempt([])).toBe('PILOT_PROOF_GUARD_STATE_INVALID');
    expect(attempt({ ...guardState(binding), runId: 'ncr-html-run-0002' })).toBe('PILOT_PROOF_GUARD_FOREIGN');
    expect(attempt({ ...guardState(binding), grantId: 'ncr-grant-run-0002' })).toBe('PILOT_PROOF_GUARD_FOREIGN');
    expect(attempt({ ...guardState(binding), sourceHead: 'e'.repeat(40) })).toBe('PILOT_PROOF_GUARD_FOREIGN');
    expect(attempt({ ...guardState(binding), manifestSha256: hex('6', 64) })).toBe('PILOT_PROOF_GUARD_FOREIGN');
    expect(attempt({ ...guardState(binding), status: 'EXPIRED' })).toBe('PILOT_PROOF_GUARD_STATUS');
    expect(attempt({ ...guardState(binding), callsUsed: -1 })).toBe('PILOT_PROOF_GUARD_STATE_INVALID');
    expect(attempt({ ...guardState(binding), callsUsed: 1.5 })).toBe('PILOT_PROOF_GUARD_STATE_INVALID');
    expect(attempt({ ...guardState(binding), callsUsed: '17' })).toBe('PILOT_PROOF_GUARD_STATE_INVALID');
    expect(attempt({ ...guardState(binding), attempts: 17 })).toBe('PILOT_PROOF_GUARD_STATE_INVALID');
    expect(attempt({ ...guardState(binding), attempts: undefined })).toBe('PILOT_PROOF_GUARD_STATE_INVALID');
  });
  it('rejects a reset or replaced guard and a paid start whose physical delta is not exactly one call and one attempt', () => {
    const before = { callsUsed: 17, attempts: 17 };
    expect(() => assertGuardAdvance(null, before, 'first')).not.toThrow();
    expect(() => assertGuardAdvance(before, { callsUsed: 18, attempts: 18 }, 'start')).not.toThrow();
    expect(codeOf(() => assertGuardAdvance(before, { callsUsed: 0, attempts: 0 }, 'reset'))).toBe('PILOT_PROOF_GUARD_RESET');
    expect(codeOf(() => assertGuardAdvance(before, { callsUsed: 17, attempts: 16 }, 'attempt-reset'))).toBe('PILOT_PROOF_GUARD_RESET');
    expect(() => assertGuardDelta(before, { callsUsed: 18, attempts: 18 }, { calls: 1, attempts: 1 }, 'first-start')).not.toThrow();
    expect(codeOf(() => assertGuardDelta(before, before, { calls: 1, attempts: 1 }, 'first-start'))).toBe('PILOT_PROOF_GUARD_DELTA');
    expect(codeOf(() => assertGuardDelta(before, { callsUsed: 19, attempts: 19 }, { calls: 1, attempts: 1 }, 'first-start'))).toBe('PILOT_PROOF_GUARD_DELTA');
    expect(codeOf(() => assertGuardDelta(before, { callsUsed: 18, attempts: 17 }, { calls: 1, attempts: 1 }, 'first-start'))).toBe('PILOT_PROOF_GUARD_DELTA');
    expect(codeOf(() => assertGuardDelta(before, { callsUsed: 16, attempts: 16 }, { calls: 0, attempts: 0 }, 'first-start'))).toBe('PILOT_PROOF_GUARD_RESET');
  });
});

describe('denied effects, late outcomes and timing', () => {
  it('accepts an unchanged counter set and rejects any delta or missing counter', () => {
    expect(() => assertDeniedEffectDelta(counters(), counters(), 'wrong-goal')).not.toThrow();
    expect(codeOf(() => assertDeniedEffectDelta(counters(), { ...counters(), browserExecuteStarts: 3 }, 'wrong-model'))).toBe('PILOT_PROOF_DENIED_EFFECT_DELTA');
    expect(codeOf(() => assertDeniedEffectDelta(counters(), { ...counters(), artifactWrites: 5 }, 'wrong-goal'))).toBe('PILOT_PROOF_DENIED_EFFECT_DELTA');
    expect(codeOf(() => assertDeniedEffectDelta(counters(), { operations: 3 }, 'wrong-goal'))).toBe('PILOT_PROOF_COUNTER_INVALID');
    expect(codeOf(() => assertDeniedEffectDelta(undefined, counters(), 'wrong-goal'))).toBe('PILOT_PROOF_COUNTERS_MISSING');
  });
  it('treats an unchanged browser count as no proof when the physical guard counters moved or are absent', () => {
    // APIRequestContext denial traffic never reaches page events, so the browser count alone is not provider accounting.
    expect(codeOf(() => assertDeniedEffectDelta(counters(), { ...counters(), guardCallsUsed: 20 }, 'api-denial'))).toBe('PILOT_PROOF_DENIED_EFFECT_DELTA');
    expect(codeOf(() => assertDeniedEffectDelta(counters(), { ...counters(), guardAttempts: 20 }, 'api-denial'))).toBe('PILOT_PROOF_DENIED_EFFECT_DELTA');
    const browserOnly: Partial<EffectCounters> = counters();
    delete browserOnly.guardCallsUsed;
    delete browserOnly.guardAttempts;
    expect(codeOf(() => assertDeniedEffectDelta(browserOnly, browserOnly, 'api-denial'))).toBe('PILOT_PROOF_COUNTER_INVALID');
    expect(codeOf(() => assertDeniedEffectDelta(counters(), { ...counters(), guardCallsUsed: Number.NaN }, 'api-denial'))).toBe('PILOT_PROOF_COUNTER_INVALID');
  });
  it('requires a local Stop on a separate unsaved render to leave no save, no enabled control, no start and the accepted v1 intact', () => {
    const fenced = { draftsBefore: 1, draftsAfter: 1, enabledSaveControlCount: 0, startsBefore: 1, startsAfter: 1,
      savedVersionBefore: uuid(2), savedVersionAfter: uuid(2), decisionAfter: 'ACCEPTED' };
    expect(() => assertLateOutcomeFenced(fenced)).not.toThrow();
    expect(codeOf(() => assertLateOutcomeFenced({ ...fenced, draftsAfter: 2 }))).toBe('PILOT_PROOF_LATE_OUTCOME_SAVED');
    expect(codeOf(() => assertLateOutcomeFenced({ ...fenced, enabledSaveControlCount: 1 }))).toBe('PILOT_PROOF_LATE_OUTCOME_CONTROL');
    expect(codeOf(() => assertLateOutcomeFenced({ ...fenced, startsAfter: 2 }))).toBe('PILOT_PROOF_STOP_STARTED_REQUEST');
    expect(codeOf(() => assertLateOutcomeFenced({ ...fenced, savedVersionAfter: uuid(3) }))).toBe('PILOT_PROOF_STOP_REPLACED_SAVED_VERSION');
    expect(codeOf(() => assertLateOutcomeFenced({ ...fenced, savedVersionBefore: null, savedVersionAfter: null }))).toBe('PILOT_PROOF_STOP_REPLACED_SAVED_VERSION');
    expect(codeOf(() => assertLateOutcomeFenced({ ...fenced, decisionAfter: 'PENDING_OPERATOR_ACCEPTANCE' }))).toBe('PILOT_PROOF_STOP_OVERWROTE_ACCEPTED');
  });
  it('keeps provider, governance and preview measures separate and bounded', () => {
    const ok = { providerAwaitSeconds: 41.2, localGovernanceSeconds: 2.4, previewSeconds: 55 };
    expect(assertTimings(ok, 'first')).toEqual(ok);
    expect(codeOf(() => assertTimings({ ...ok, providerAwaitSeconds: 0 }, 'first'))).toBe('PILOT_PROOF_PROVIDER_AWAIT_NOT_MEASURED');
    expect(codeOf(() => assertTimings({ ...ok, localGovernanceSeconds: 10.5 }, 'first'))).toBe('PILOT_PROOF_GOVERNANCE_OVER_LIMIT');
    expect(codeOf(() => assertTimings({ ...ok, previewSeconds: 120.5 }, 'first'))).toBe('PILOT_PROOF_PREVIEW_OVER_LIMIT');
    expect(codeOf(() => assertTimings({ ...ok, previewSeconds: Number.NaN }, 'first'))).toBe('PILOT_PROOF_MEASUREMENT_INVALID');
    expect(codeOf(() => assertTimings({ providerAwaitSeconds: 3 }, 'first'))).toBe('PILOT_PROOF_MEASUREMENT_INVALID');
    expect(codeOf(() => assertTimings(null, 'first'))).toBe('PILOT_PROOF_TIMINGS_MISSING');
    expect(assertRestoreSeconds(599.9, 'restore')).toBe(599.9);
    expect(codeOf(() => assertRestoreSeconds(601, 'restore'))).toBe('PILOT_PROOF_RESTORE_OVER_LIMIT');
    expect(codeOf(() => assertRestoreSeconds(undefined, 'restore'))).toBe('PILOT_PROOF_MEASUREMENT_INVALID');
  });
  describe('clean first-preview phases', () => {
    const phases = (): TimingPhase[] => CLEAN_PREVIEW_PHASES.map((name, i) => ({ name, startMs: 1000 + i * 2000, endMs: 3000 + i * 2000 }));
    const faultsOutside = [{ label: 'decline-before-consent', startMs: 100, endMs: 900 }, { label: 'local-stop', startMs: 9000, endMs: 12_000 }];
    const clean = () => ({ phases: phases(), faults: faultsOutside, previewSeconds: 8 });
    it('accepts ordered non-overlapping phases whose span is the reported preview time, with faults outside the window', () => {
      expect(() => assertCleanPreviewTiming(clean(), 'v1')).not.toThrow();
      expect(() => assertCleanPreviewTiming({ ...clean(), faults: [] }, 'v1')).not.toThrow();
      expect(() => assertCleanPreviewTiming({ ...clean(), faults: [{ label: 'touching', startMs: 9000, endMs: 9500 }] }, 'v1')).not.toThrow();
    });
    it('rejects any denial or Stop interval inside the clean window', () => {
      const attempt = (faults: Array<{ label: string; startMs: number; endMs: number }>) => codeOf(() => assertCleanPreviewTiming({ ...clean(), faults }, 'v1'));
      expect(attempt([{ label: 'held-export-stop', startMs: 4000, endMs: 5000 }])).toBe('PILOT_PROOF_TIMING_FAULT_IN_CLEAN_WINDOW');
      expect(attempt([{ label: 'straddles-start', startMs: 500, endMs: 1500 }])).toBe('PILOT_PROOF_TIMING_FAULT_IN_CLEAN_WINDOW');
      expect(attempt([{ label: 'straddles-end', startMs: 8500, endMs: 9500 }])).toBe('PILOT_PROOF_TIMING_FAULT_IN_CLEAN_WINDOW');
      expect(attempt([{ label: 'covers-window', startMs: 0, endMs: 20_000 }])).toBe('PILOT_PROOF_TIMING_FAULT_IN_CLEAN_WINDOW');
      expect(attempt([{ label: 'backwards', startMs: 5000, endMs: 4000 }])).toBe('PILOT_PROOF_TIMING_FAULT_INVALID');
      expect(attempt([{ label: 'nan', startMs: Number.NaN, endMs: 4000 }])).toBe('PILOT_PROOF_TIMING_FAULT_INVALID');
    });
    it('rejects missing, unordered, overlapping or invalid phases and a span that differs from the reported seconds', () => {
      const attempt = (input: Parameters<typeof assertCleanPreviewTiming>[0]) => codeOf(() => assertCleanPreviewTiming(input, 'v1'));
      expect(attempt({ ...clean(), phases: null })).toBe('PILOT_PROOF_TIMING_PHASES_MISSING');
      expect(attempt({ ...clean(), faults: undefined })).toBe('PILOT_PROOF_TIMING_PHASES_MISSING');
      expect(attempt({ ...clean(), phases: phases().slice(0, 3) })).toBe('PILOT_PROOF_TIMING_PHASES_UNORDERED');
      expect(attempt({ ...clean(), phases: [...phases()].reverse() })).toBe('PILOT_PROOF_TIMING_PHASES_UNORDERED');
      expect(attempt({ ...clean(), phases: phases().map((p, i) => i === 1 ? { ...p, name: 'render-and-save' } : p) })).toBe('PILOT_PROOF_TIMING_PHASES_UNORDERED');
      expect(attempt({ ...clean(), phases: phases().map((p, i) => i === 2 ? { ...p, startMs: p.startMs - 500 } : p) })).toBe('PILOT_PROOF_TIMING_PHASES_OVERLAP');
      expect(attempt({ ...clean(), phases: phases().map((p, i) => i === 0 ? { ...p, endMs: p.startMs - 1 } : p) })).toBe('PILOT_PROOF_TIMING_PHASE_INVALID');
      expect(attempt({ ...clean(), phases: phases().map((p, i) => i === 3 ? { ...p, endMs: Number.NaN } : p) })).toBe('PILOT_PROOF_TIMING_PHASE_INVALID');
      expect(attempt({ ...clean(), previewSeconds: 20 })).toBe('PILOT_PROOF_TIMING_SPAN_MISMATCH');
      expect(attempt({ ...clean(), previewSeconds: 7.9 })).toBe('PILOT_PROOF_TIMING_SPAN_MISMATCH');
    });
  });
});

describe('redaction', () => {
  it('rejects exported text that contains a forbidden fragment or a secret-shaped value', () => {
    expect(() => assertRedacted('status=ok jobId present', ['synthetic-fixture-secret'])).not.toThrow();
    expect(codeOf(() => assertRedacted('log synthetic-fixture-secret end', ['synthetic-fixture-secret']))).toBe('PILOT_PROOF_UNREDACTED_FRAGMENT');
    expect(codeOf(() => assertRedacted('Authorization: Bearer abcdefghijkl', []))).toBe('PILOT_PROOF_SECRET_PATTERN');
    expect(codeOf(() => assertRedacted('x-cvf-service-signature: 00', []))).toBe('PILOT_PROOF_SECRET_PATTERN');
  });
});
