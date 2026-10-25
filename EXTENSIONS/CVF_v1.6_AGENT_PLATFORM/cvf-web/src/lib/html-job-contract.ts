import { DRAFT_TTL_MS, SOURCE_ID, VERSION_ID, requestIdentity, safeText, sha256,
  type DraftPrincipal, type DraftRequest, type DraftSnapshot } from './html-draft-recovery-contract';

export const JOB_SCHEMA = 'cvf.htmlJob.v1' as const;
export const VERSION_SCHEMA = 'cvf.htmlJobVersion.v1' as const;
export const DECISION_SCHEMA = 'cvf.htmlJobDecision.v1' as const;
export const PRODUCT_DECISION_SCHEMA = 'cvf.htmlPilotProductDecision.v1' as const;
export const MAX_JOB_METADATA_BYTES = 16_384;
export const MAX_JOB_BODY_BYTES = 280_000;
export const JOB_EFFECTS = ['LOCAL_HTML_BUILD', 'LOCAL_DRAFT_SAVE', 'LOCAL_SYNTHETIC_REVIEW'] as const;
export const PILOT_JOB_EFFECTS = ['REAL_PROVIDER_FICTIONAL_CONTENT', 'LOCAL_HTML_BUILD', 'LOCAL_DRAFT_SAVE'] as const;
export const CRITERION_ID = /^[a-z0-9][a-z0-9_-]{0,31}$/;
const HASH = /^[a-f0-9]{64}$/;
const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const exact = (v: Record<string, unknown>, keys: readonly string[]) => Object.keys(v).length === keys.length && keys.every(k => Object.hasOwn(v, k));
const utc = (v: unknown): v is string => typeof v === 'string' && Number.isFinite(Date.parse(v)) && new Date(v).toISOString() === v;
const ownerValid = (v: unknown): v is DraftPrincipal => record(v) && exact(v, ['userId', 'orgId', 'teamId'])
  && [v.userId, v.orgId, v.teamId].every(x => typeof x === 'string' && /^[A-Za-z0-9_-]{1,150}$/.test(x));
const sameOwner = (a: DraftPrincipal, b: DraftPrincipal) => a.userId === b.userId && a.orgId === b.orgId && a.teamId === b.teamId;
const sized = (v: unknown) => Buffer.byteLength(JSON.stringify(v), 'utf8') <= MAX_JOB_METADATA_BYTES;
const criteriaValid = (v: unknown): v is JobCriterion[] => Array.isArray(v) && v.length >= 1 && v.length <= 8
  && v.every(x => record(x) && exact(x, ['criterionId', 'text']) && typeof x.criterionId === 'string'
    && CRITERION_ID.test(x.criterionId) && safeText(x.text, 500))
  && new Set(v.map(x => x.criterionId)).size === v.length;
const requestValid = (v: unknown): v is DraftRequest => {
  if (!record(v) || !exact(v, ['title', 'sourcePath', 'sourceContent', 'memoryClass', 'status', 'claimBoundary', 'receiptAnchor'])) return false;
  const limits = { title: 200, sourcePath: 500, sourceContent: 100_000, memoryClass: 14, status: 100, claimBoundary: 2_000, receiptAnchor: 150 };
  return Object.entries(limits).every(([k, max]) => safeText(v[k], max)) && ['POINTER_RECORD', 'FULL_RECORD'].includes(v.memoryClass as string);
};
export interface JobCriterion { criterionId: string; text: string }
export interface CriteriaReview { criterionId: string; passed: true; reviewNote: string }
export interface CreateJobInput { jobId: string; sourceRecordId: string; goal: string; criteria: JobCriterion[];
  expectedOutput: 'HTML'; allowedEffects: typeof JOB_EFFECTS | typeof PILOT_JOB_EFFECTS; request: DraftRequest;
  pilotSource?: DraftSnapshot['pilotSource'] }
export interface HtmlJob { schema: typeof JOB_SCHEMA; jobId: string; owner: DraftPrincipal; sourceRecordId: string;
  goal: string; criteria: JobCriterion[]; expectedOutput: 'HTML'; allowedEffects: typeof JOB_EFFECTS | typeof PILOT_JOB_EFFECTS;
  requestSha256: string; createdAt: string; expiresAt: string;
  pilotRootRunId?: string; pilotRootOutputSha256?: string; pilotProfileDigest?: string }
export interface LinkVersionInput { jobId: string; sourceRecordId: string; versionId: string }
export interface HtmlJobVersion { schema: typeof VERSION_SCHEMA; jobId: string; owner: DraftPrincipal; sourceRecordId: string;
  versionId: string; requestSha256: string; htmlSha256: string; createdAt: string; expiresAt: string;
  pilotSourceRunId?: string; pilotOutputSha256?: string; pilotEvidenceSha256?: string }
export interface AcceptVersionInput extends LinkVersionInput { decisionId: string; requestSha256: string; htmlSha256: string;
  criteriaReview: CriteriaReview[]; reviewedVersionConfirmed: true }
export interface HtmlJobDecision { schema: typeof DECISION_SCHEMA; decisionId: string; jobId: string; owner: DraftPrincipal;
  actor: DraftPrincipal; sourceRecordId: string; versionId: string; requestSha256: string; htmlSha256: string;
  criteriaReview: CriteriaReview[]; evidence: { jobId: string; versionId: string; requestSha256: string; htmlSha256: string };
  decision: 'ACCEPT_FOR_LOCAL_SYNTHETIC_REVIEW'; decidedAt: string; expiresAt: string }
export interface ProductDecisionInput extends LinkVersionInput { decisionId: string; htmlSha256: string;
  sourceEvidenceSha256: string; decision: 'ACCEPTED' | 'REJECTED'; reviewedVersionConfirmed: true }
export interface HtmlPilotProductDecision extends ProductDecisionInput {
  schema: typeof PRODUCT_DECISION_SCHEMA; owner: DraftPrincipal; actor: DraftPrincipal; decidedAt: string; expiresAt: string;
}
export function parseProductDecision(value: unknown): ProductDecisionInput | null {
  if (!record(value) || !exact(value, ['jobId', 'sourceRecordId', 'versionId', 'decisionId', 'htmlSha256',
    'sourceEvidenceSha256', 'decision', 'reviewedVersionConfirmed'])
    || ![value.jobId, value.versionId, value.decisionId].every(x => typeof x === 'string' && VERSION_ID.test(x))
    || typeof value.sourceRecordId !== 'string' || !SOURCE_ID.test(value.sourceRecordId)
    || typeof value.htmlSha256 !== 'string' || !HASH.test(value.htmlSha256)
    || typeof value.sourceEvidenceSha256 !== 'string' || !HASH.test(value.sourceEvidenceSha256)
    || !['ACCEPTED', 'REJECTED'].includes(value.decision as string) || value.reviewedVersionConfirmed !== true) return null;
  return value as unknown as ProductDecisionInput;
}
export function validateProductDecision(value: unknown, owner: DraftPrincipal, now: number): HtmlPilotProductDecision | null {
  if (!record(value) || !exact(value, ['schema', 'jobId', 'sourceRecordId', 'versionId', 'decisionId', 'htmlSha256',
    'sourceEvidenceSha256', 'decision', 'reviewedVersionConfirmed', 'owner', 'actor', 'decidedAt', 'expiresAt'])
    || value.schema !== PRODUCT_DECISION_SCHEMA || !ownerValid(value.owner) || !sameOwner(value.owner, owner)
    || !ownerValid(value.actor) || !sameOwner(value.actor, owner) || !utc(value.decidedAt) || !utc(value.expiresAt)
    || now >= Date.parse(value.expiresAt) || !sized(value)) return null;
  return parseProductDecision(Object.fromEntries(['jobId', 'sourceRecordId', 'versionId', 'decisionId', 'htmlSha256',
    'sourceEvidenceSha256', 'decision', 'reviewedVersionConfirmed'].map(k => [k, value[k]])))
    ? value as unknown as HtmlPilotProductDecision : null;
}

export function parseCreateJob(v: unknown): CreateJobInput | null {
  if (!record(v) || !(exact(v, ['jobId', 'sourceRecordId', 'goal', 'criteria', 'expectedOutput', 'allowedEffects', 'request'])
    || exact(v, ['jobId', 'sourceRecordId', 'goal', 'criteria', 'expectedOutput', 'allowedEffects', 'request', 'pilotSource']))
    || typeof v.jobId !== 'string' || !VERSION_ID.test(v.jobId) || typeof v.sourceRecordId !== 'string' || !SOURCE_ID.test(v.sourceRecordId)
    || !safeText(v.goal, 2000) || !criteriaValid(v.criteria) || v.expectedOutput !== 'HTML'
    || !Array.isArray(v.allowedEffects) || JSON.stringify(v.allowedEffects) !== JSON.stringify(Object.hasOwn(v, 'pilotSource') ? PILOT_JOB_EFFECTS : JOB_EFFECTS)
    || !requestValid(v.request) || (Object.hasOwn(v, 'pilotSource') && (!record(v.pilotSource)
      || !record(v.pilotSource.receipt) || !record(v.pilotSource.receipt.htmlPilotEvidence)
      || v.pilotSource.receipt.htmlPilotEvidence.rootRunId !== v.sourceRecordId
      || v.pilotSource.receipt.htmlPilotEvidence.parentRunId !== null))) return null;
  return v as unknown as CreateJobInput;
}
export function parseLinkVersion(v: unknown): LinkVersionInput | null {
  return record(v) && exact(v, ['jobId', 'sourceRecordId', 'versionId'])
    && [v.jobId, v.versionId].every(x => typeof x === 'string' && VERSION_ID.test(x))
    && typeof v.sourceRecordId === 'string' && SOURCE_ID.test(v.sourceRecordId) ? v as unknown as LinkVersionInput : null;
}
export function parseAcceptVersion(v: unknown): AcceptVersionInput | null {
  if (!record(v) || !exact(v, ['decisionId', 'jobId', 'sourceRecordId', 'versionId', 'requestSha256', 'htmlSha256', 'criteriaReview', 'reviewedVersionConfirmed'])
    || [v.decisionId, v.jobId, v.versionId].some(x => typeof x !== 'string' || !VERSION_ID.test(x))
    || typeof v.sourceRecordId !== 'string' || !SOURCE_ID.test(v.sourceRecordId)
    || [v.requestSha256, v.htmlSha256].some(x => typeof x !== 'string' || !HASH.test(x))
    || v.reviewedVersionConfirmed !== true || !Array.isArray(v.criteriaReview) || v.criteriaReview.length < 1 || v.criteriaReview.length > 8
    || !v.criteriaReview.every(x => record(x) && exact(x, ['criterionId', 'passed', 'reviewNote'])
      && typeof x.criterionId === 'string' && CRITERION_ID.test(x.criterionId) && x.passed === true && safeText(x.reviewNote, 1000))
    || new Set(v.criteriaReview.map(x => x.criterionId)).size !== v.criteriaReview.length) return null;
  return v as unknown as AcceptVersionInput;
}
export function makeJob(v: CreateJobInput, owner: DraftPrincipal, now: number): HtmlJob {
  const pilot = v.pilotSource?.receipt.htmlPilotEvidence;
  return { schema: JOB_SCHEMA, jobId: v.jobId, owner: { ...owner }, sourceRecordId: v.sourceRecordId,
    goal: v.goal, criteria: v.criteria, expectedOutput: 'HTML', allowedEffects: v.pilotSource ? PILOT_JOB_EFFECTS : JOB_EFFECTS,
    requestSha256: sha256(requestIdentity(v.request)), createdAt: new Date(now).toISOString(), expiresAt: new Date(now + DRAFT_TTL_MS).toISOString(),
    ...(pilot ? { pilotRootRunId: pilot.rootRunId, pilotRootOutputSha256: pilot.outputSha256,
      pilotProfileDigest: pilot.profileDigest } : {}) };
}
export function validateJob(v: unknown, owner: DraftPrincipal, now: number): HtmlJob | null {
  const baseKeys = ['schema', 'jobId', 'owner', 'sourceRecordId', 'goal', 'criteria', 'expectedOutput', 'allowedEffects', 'requestSha256', 'createdAt', 'expiresAt'];
  if (!record(v) || !(exact(v, baseKeys) || exact(v, [...baseKeys, 'pilotRootRunId', 'pilotRootOutputSha256', 'pilotProfileDigest']))
    || v.schema !== JOB_SCHEMA || typeof v.jobId !== 'string' || !VERSION_ID.test(v.jobId)
    || typeof v.sourceRecordId !== 'string' || !SOURCE_ID.test(v.sourceRecordId) || !ownerValid(v.owner) || !sameOwner(v.owner, owner)
    || !safeText(v.goal, 2000) || !criteriaValid(v.criteria) || v.expectedOutput !== 'HTML'
    || JSON.stringify(v.allowedEffects) !== JSON.stringify(Object.hasOwn(v, 'pilotRootRunId') ? PILOT_JOB_EFFECTS : JOB_EFFECTS)
    || typeof v.requestSha256 !== 'string' || !HASH.test(v.requestSha256)
    || !utc(v.createdAt) || !utc(v.expiresAt) || now >= Date.parse(v.expiresAt)
    || Date.parse(v.expiresAt) - Date.parse(v.createdAt) !== DRAFT_TTL_MS || !sized(v)
    || (Object.hasOwn(v, 'pilotRootRunId') && (v.pilotRootRunId !== v.sourceRecordId
      || typeof v.pilotRootOutputSha256 !== 'string' || !HASH.test(v.pilotRootOutputSha256)
      || typeof v.pilotProfileDigest !== 'string' || !HASH.test(v.pilotProfileDigest)))) return null;
  return v as unknown as HtmlJob;
}
export function makeVersion(job: HtmlJob, snapshot: DraftSnapshot, now: number): HtmlJobVersion {
  const pilot = snapshot.pilotSource?.receipt.htmlPilotEvidence;
  return { schema: VERSION_SCHEMA, jobId: job.jobId, owner: { ...job.owner }, sourceRecordId: job.sourceRecordId,
    versionId: snapshot.versionId, requestSha256: snapshot.requestSha256, htmlSha256: snapshot.htmlSha256,
    createdAt: new Date(now).toISOString(), expiresAt: new Date(Math.min(Date.parse(job.expiresAt), Date.parse(snapshot.expiresAt))).toISOString(),
    ...(pilot ? { pilotSourceRunId: pilot.runId, pilotOutputSha256: pilot.outputSha256,
      pilotEvidenceSha256: sha256(JSON.stringify(pilot)) } : {}) };
}
export function validateVersion(v: unknown, owner: DraftPrincipal, now: number): HtmlJobVersion | null {
  const baseKeys = ['schema', 'jobId', 'owner', 'sourceRecordId', 'versionId', 'requestSha256', 'htmlSha256', 'createdAt', 'expiresAt'];
  if (!record(v) || !(exact(v, baseKeys) || exact(v, [...baseKeys, 'pilotSourceRunId', 'pilotOutputSha256', 'pilotEvidenceSha256']))
    || v.schema !== VERSION_SCHEMA || [v.jobId, v.versionId].some(x => typeof x !== 'string' || !VERSION_ID.test(x))
    || typeof v.sourceRecordId !== 'string' || !SOURCE_ID.test(v.sourceRecordId) || !ownerValid(v.owner) || !sameOwner(v.owner, owner)
    || [v.requestSha256, v.htmlSha256].some(x => typeof x !== 'string' || !HASH.test(x))
    || !utc(v.createdAt) || !utc(v.expiresAt) || now >= Date.parse(v.expiresAt)
    || Date.parse(v.expiresAt) < Date.parse(v.createdAt) || !sized(v)
    || (Object.hasOwn(v, 'pilotSourceRunId') && (![v.pilotOutputSha256, v.pilotEvidenceSha256].every(x => typeof x === 'string' && HASH.test(x))
      || typeof v.pilotSourceRunId !== 'string' || !SOURCE_ID.test(v.pilotSourceRunId)))) return null;
  return v as unknown as HtmlJobVersion;
}
export function reviewMatches(criteria: JobCriterion[], reviews: CriteriaReview[]) {
  return criteria.length === reviews.length && criteria.every(c => reviews.some(r => r.criterionId === c.criterionId));
}
export function makeDecision(input: AcceptVersionInput, owner: DraftPrincipal, expiresAt: string, now: number): HtmlJobDecision {
  return { schema: DECISION_SCHEMA, decisionId: input.decisionId, jobId: input.jobId, owner: { ...owner }, actor: { ...owner },
    sourceRecordId: input.sourceRecordId, versionId: input.versionId, requestSha256: input.requestSha256, htmlSha256: input.htmlSha256,
    criteriaReview: input.criteriaReview, evidence: { jobId: input.jobId, versionId: input.versionId,
      requestSha256: input.requestSha256, htmlSha256: input.htmlSha256 }, decision: 'ACCEPT_FOR_LOCAL_SYNTHETIC_REVIEW',
    decidedAt: new Date(now).toISOString(), expiresAt };
}
export function validateDecision(v: unknown, owner: DraftPrincipal, now: number): HtmlJobDecision | null {
  if (!record(v) || !exact(v, ['schema', 'decisionId', 'jobId', 'owner', 'actor', 'sourceRecordId', 'versionId', 'requestSha256', 'htmlSha256', 'criteriaReview', 'evidence', 'decision', 'decidedAt', 'expiresAt'])
    || v.schema !== DECISION_SCHEMA || !ownerValid(v.owner) || !sameOwner(v.owner, owner) || !ownerValid(v.actor) || !sameOwner(v.actor, owner)
    || v.decision !== 'ACCEPT_FOR_LOCAL_SYNTHETIC_REVIEW' || !utc(v.decidedAt) || !utc(v.expiresAt) || now >= Date.parse(v.expiresAt)
    || !record(v.evidence) || !exact(v.evidence, ['jobId', 'versionId', 'requestSha256', 'htmlSha256']) || !sized(v)) return null;
  const input = parseAcceptVersion({ decisionId: v.decisionId, jobId: v.jobId, sourceRecordId: v.sourceRecordId,
    versionId: v.versionId, requestSha256: v.requestSha256, htmlSha256: v.htmlSha256,
    criteriaReview: v.criteriaReview, reviewedVersionConfirmed: true });
  if (!input || v.evidence.jobId !== input.jobId || v.evidence.versionId !== input.versionId
    || v.evidence.requestSha256 !== input.requestSha256 || v.evidence.htmlSha256 !== input.htmlSha256) return null;
  return v as unknown as HtmlJobDecision;
}
