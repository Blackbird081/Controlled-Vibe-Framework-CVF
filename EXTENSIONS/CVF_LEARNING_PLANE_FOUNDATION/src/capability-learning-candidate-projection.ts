/**
 * RSPB-AI-T6 - Capability Projection To Learning Candidate Intake Seam
 *
 * Pure in-memory seam. Accepts a T5 CapabilityCaseEvidenceProjection and an
 * explicit learning observation, validates both fail-closed, produces a
 * deterministic pending learning candidate, and composes it into the existing
 * LearningSignalIntakeBridge.
 *
 * Authority notice: PROJECTION_ONLY. This module cannot store, promote,
 * mutate, approve, deduplicate, resolve contradictions, or write anything.
 * Every output is non-authoritative pending independent review.
 */

import { createHash } from 'node:crypto';
import { isProxy } from 'node:util/types';
import {
  CAPABILITY_CASE_EVIDENCE_PROJECTION_CONTRACT_VERSION,
  CAPABILITY_CASE_PROJECTION_VERSION,
  DOMAIN_EVIDENCE_PROJECTION_VERSION,
  type CapabilityCaseEvidenceProjection,
} from '../../CVF_GUARD_CONTRACT/src/contracts/capability-case-evidence-projection.contract';
import {
  createLearningSignalIntakeBridge,
  type LearningSignalIntakeRecord,
} from './learning-signal-intake-bridge';

// ---  Version 

export const CAPABILITY_LEARNING_CANDIDATE_PROJECTION_VERSION =
  'cvf.capabilityLearningCandidateProjection.v1' as const;

// ---  Bounded constants 

const MAX_TEXT_LENGTH = 4096;
const MAX_SCOPE_ITEMS = 64;
const MAX_REF_ITEMS = 64;
const MAX_PROJECTION_ITEMS = 256;
const SAFE_ID = /^[A-Za-z0-9._:/-]{1,256}$/;
const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?Z$/;
const SECRET_SIGNAL =
  /(\bsk-[A-Za-z0-9_-]{8,}\b|\bbearer\s+[A-Za-z0-9._~+\/-]{4,}|(?:api[_-]?key|password|passwd|token|secret|credential|cookie|session[_-]?id)\s*[=:]\s*\S+|-----BEGIN [A-Z ]*PRIVATE KEY-----)/i;

// ---  Issue codes 

export type LearningCandidateIssueCode =
  | 'MALFORMED_INPUT'
  | 'INVALID_FIELD'
  | 'INVALID_PROJECTION'
  | 'STALE_PROJECTION'
  | 'AUTHORITY_MISMATCH'
  | 'SECRET_LIKE_VALUE_REJECTED'
  | 'UNBOUND_REFERENCE'
  | 'ATTEMPTED_SELF_PROMOTION';

export interface LearningCandidateIssue {
  readonly code: LearningCandidateIssueCode;
  readonly path: string;
  readonly message: string;
}

// ---  Input types 

export type LearningCandidateEnvironmentSpecificity =
  | 'UNIVERSAL'
  | 'ENVIRONMENT_SPECIFIC'
  | 'PACKAGE_SPECIFIC'
  | 'UNKNOWN';

export interface LearningObservationInput {
  /** Observed problem description. Must be bounded, non-secret plain text. */
  readonly observedProblem: string;
  /** Method used to investigate or reproduce. */
  readonly method: string;
  /** Observed result or outcome. */
  readonly result: string;
  /** Optional failure mode, if applicable. */
  readonly failureMode?: string | null;
  /** Reusable lesson derived from the observation. */
  readonly reusableLesson: string;
  /** Package scopes affected (e.g. package names). Bounded array of safe IDs. */
  readonly packageScope: readonly string[];
  /** Environment scopes affected. Bounded array of safe IDs. */
  readonly environmentScope: readonly string[];
  /**
   * Finding IDs from the T5 projection that this observation is linked to.
   * Must resolve to findingIds in the projection.findings array.
   */
  readonly linkedFindingRefs: readonly string[];
  /**
   * Evidence IDs from the T5 projection that this observation is linked to.
   * Must resolve to evidenceIds in the projection.evidence array.
   */
  readonly linkedEvidenceRefs: readonly string[];
  /** Environment specificity classification. */
  readonly environmentSpecificity: LearningCandidateEnvironmentSpecificity;
  /** Optional ISO-8601 UTC expiry timestamp for revalidation. */
  readonly expiresAt?: string | null;
  /** Optional revalidation condition description. */
  readonly revalidationCondition?: string | null;
}

// ---  Output types 

export type LearningCandidateReviewStatus = 'PENDING';
export type LearningCandidateDeduplicationStatus = 'PENDING';
export type LearningCandidateContradictionStatus = 'PENDING';

export interface CapabilityLearningCandidate {
  readonly schemaVersion: typeof CAPABILITY_LEARNING_CANDIDATE_PROJECTION_VERSION;
  readonly candidateId: string;
  /** Digest of the T5 projection this candidate is bound to. */
  readonly projectionDigest: string;
  /** caseId from the T5 projection. */
  readonly caseId: string;
  /** projectionId from the T5 projection. */
  readonly projectionId: string;
  /** T5 sourceRefs, preserved as binding evidence. */
  readonly sourceRefs: readonly string[];
  /** Finding IDs from the projection that are linked. */
  readonly linkedFindingRefs: readonly string[];
  /** Evidence IDs from the projection that are linked. */
  readonly linkedEvidenceRefs: readonly string[];
  readonly packageScope: readonly string[];
  readonly environmentScope: readonly string[];
  readonly observedProblem: string;
  readonly method: string;
  readonly result: string;
  readonly failureMode: string | null;
  readonly reusableLesson: string;
  readonly environmentSpecificity: LearningCandidateEnvironmentSpecificity;
  readonly expiresAt: string | null;
  readonly revalidationCondition: string | null;
  /** Digest of the normalized candidate content for determinism proof. */
  readonly candidateDigest: string;
  readonly generatedAt: string;
  /** Always 'PENDING': review is external and independent. */
  readonly reviewStatus: LearningCandidateReviewStatus;
  /** Always 'PENDING': deduplication is not performed here. */
  readonly deduplicationStatus: LearningCandidateDeduplicationStatus;
  /** Always 'PENDING': contradiction check is not performed here. */
  readonly contradictionStatus: LearningCandidateContradictionStatus;
  /** Always null: promotion target is set only by an independent reviewer. */
  readonly promotionTarget: null;
  /** Always false: no autonomous mutation is permitted. */
  readonly autonomousMutationAuthorized: false;
  /** Always true: independent review is mandatory before any use. */
  readonly independentReviewRequired: true;
  /** Always true: a governance work order is required for promotion. */
  readonly governanceWorkOrderRequired: true;
}

export type LearningCandidateProjectionStatus = 'VALID' | 'INVALID';

export interface LearningCandidateProjectionResult {
  readonly status: LearningCandidateProjectionStatus;
  readonly candidate: CapabilityLearningCandidate | null;
  readonly intakeRecord: LearningSignalIntakeRecord | null;
  readonly issues: readonly LearningCandidateIssue[];
}

// ---  Internal helpers 

function iss(
  code: LearningCandidateIssueCode,
  path: string,
  message: string,
): LearningCandidateIssue {
  return Object.freeze({ code, path, message });
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || isProxy(value)) return false;
  const proto = Object.getPrototypeOf(value);
  if (proto !== Object.prototype && proto !== null) return false;
  if (Object.getOwnPropertySymbols(value).length) return false;
  return Object.values(Object.getOwnPropertyDescriptors(value)).every(
    (d) => 'value' in d && d.get === undefined && d.set === undefined,
  );
}

function isPlainArray(value: unknown): value is readonly unknown[] {
  if (!Array.isArray(value) || isProxy(value) || Object.getOwnPropertySymbols(value).length) return false;
  return Object.values(Object.getOwnPropertyDescriptors(value)).every(
    (d) => 'value' in d && d.get === undefined && d.set === undefined,
  );
}

function isBoundedDenseArray(value: unknown, maximum: number): value is readonly unknown[] {
  if (!isPlainArray(value) || value.length > maximum) return false;
  for (let index = 0; index < value.length; index += 1) {
    if (!Object.prototype.hasOwnProperty.call(value, index)) return false;
  }
  return true;
}

function isSecretLike(value: string): boolean {
  return SECRET_SIGNAL.test(value);
}

function validId(value: unknown): value is string {
  return typeof value === 'string' && SAFE_ID.test(value) && !isSecretLike(value);
}

function validUtc(value: unknown): value is string {
  return typeof value === 'string' && ISO_UTC.test(value) && Number.isFinite(Date.parse(value));
}

function safeText(value: unknown, maxLength = MAX_TEXT_LENGTH): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= maxLength &&
    !isSecretLike(value)
  );
}

function safeNullableText(value: unknown): boolean {
  return value === null || value === undefined || safeText(value);
}

function normalizeNullableText(
  value: unknown,
  path: string,
  issues: LearningCandidateIssue[],
): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') {
    issues.push(iss('INVALID_FIELD', path, 'Expected a string or null.'));
    return null;
  }
  if (isSecretLike(value)) {
    issues.push(iss('SECRET_LIKE_VALUE_REJECTED', path, 'Value resembles a secret and was rejected.'));
    return null;
  }
  if (value.length > MAX_TEXT_LENGTH) {
    issues.push(iss('INVALID_FIELD', path, 'Value exceeds the bounded length.'));
    return null;
  }
  return value || null;
}

function normalizeNullableUtc(
  value: unknown,
  path: string,
  issues: LearningCandidateIssue[],
): string | null {
  if (value === null || value === undefined) return null;
  if (!validUtc(value)) {
    issues.push(iss('INVALID_FIELD', path, 'Expected an ISO-8601 UTC timestamp or null.'));
    return null;
  }
  return value;
}

function normalizeScopeArray(
  value: unknown,
  path: string,
  issues: LearningCandidateIssue[],
): readonly string[] {
  if (!isPlainArray(value)) {
    issues.push(iss('MALFORMED_INPUT', path, 'Expected a plain array.'));
    return Object.freeze([]);
  }
  if (value.length > MAX_SCOPE_ITEMS) {
    issues.push(iss('INVALID_FIELD', path, `Array exceeds maximum of ${MAX_SCOPE_ITEMS} items.`));
    return Object.freeze([]);
  }
  const result: string[] = [];
  let rejected = false;
  for (let i = 0; i < value.length; i++) {
    const item = value[i];
    if (!validId(item)) {
      issues.push(iss(
        typeof item === 'string' && isSecretLike(item) ? 'SECRET_LIKE_VALUE_REJECTED' : 'INVALID_FIELD',
        `${path}[${i}]`,
        'Scope item must be a bounded safe identifier.',
      ));
      rejected = true;
      continue;
    }
    result.push(item as string);
  }
  if (rejected) return Object.freeze([]);
  // Normalize: deduplicate and sort for determinism
  const unique = [...new Set(result)].sort();
  return Object.freeze(unique);
}

function normalizeRefArray(
  value: unknown,
  path: string,
  issues: LearningCandidateIssue[],
): readonly string[] {
  if (!isPlainArray(value)) {
    issues.push(iss('MALFORMED_INPUT', path, 'Expected a plain array.'));
    return Object.freeze([]);
  }
  if (value.length > MAX_REF_ITEMS) {
    issues.push(iss('INVALID_FIELD', path, `Array exceeds maximum of ${MAX_REF_ITEMS} items.`));
    return Object.freeze([]);
  }
  const result: string[] = [];
  let rejected = false;
  for (let i = 0; i < value.length; i++) {
    const item = value[i];
    if (!validId(item)) {
      issues.push(iss(
        typeof item === 'string' && isSecretLike(item) ? 'SECRET_LIKE_VALUE_REJECTED' : 'INVALID_FIELD',
        `${path}[${i}]`,
        'Reference item must be a bounded safe identifier.',
      ));
      rejected = true;
      continue;
    }
    result.push(item as string);
  }
  if (rejected) return Object.freeze([]);
  // Normalize: deduplicate and sort for determinism (reordered equivalent refs -> same output)
  const unique = [...new Set(result)].sort();
  return Object.freeze(unique);
}

const VALID_ENV_SPECIFICITY: readonly LearningCandidateEnvironmentSpecificity[] = [
  'UNIVERSAL',
  'ENVIRONMENT_SPECIFIC',
  'PACKAGE_SPECIFIC',
  'UNKNOWN',
];

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (isPlainRecord(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonicalJson(value[k])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}

function computeCandidateDigest(
  normalized: Omit<CapabilityLearningCandidate, 'candidateDigest' | 'candidateId' | 'generatedAt'>,
): string {
  return createHash('sha256').update(canonicalJson(normalized)).digest('hex');
}

function computeCandidateId(digest: string, projectionDigest: string, generatedAt: string): string {
  return createHash('sha256')
    .update(`cvf.learningCandidate.id:${digest}:${projectionDigest}:${generatedAt}`)
    .digest('hex');
}

// ---  Projection validation 

/**
 * Validates that a projection is a structurally correct, current, non-mutating
 * T5 output. Returns the projection if valid or null + issues.
 */
function validateProjection(
  projection: unknown,
  issues: LearningCandidateIssue[],
): CapabilityCaseEvidenceProjection | null {
  if (!isPlainRecord(projection)) {
    issues.push(iss('MALFORMED_INPUT', '$.projection', 'Projection must be a plain non-Proxy object.'));
    return null;
  }

  const p = projection as Record<string, unknown>;

  // Authority invariants: must be literal PROJECTION_ONLY and false
  if (p['authorityNotice'] !== 'PROJECTION_ONLY') {
    issues.push(iss('AUTHORITY_MISMATCH', '$.projection.authorityNotice', "authorityNotice must be literal 'PROJECTION_ONLY'."));
    return null;
  }
  if (p['authorityMutation'] !== false) {
    issues.push(iss('AUTHORITY_MISMATCH', '$.projection.authorityMutation', 'authorityMutation must be literal false.'));
    return null;
  }

  if (
    p['schemaVersion'] !== CAPABILITY_CASE_EVIDENCE_PROJECTION_CONTRACT_VERSION ||
    p['caseProjectionVersion'] !== CAPABILITY_CASE_PROJECTION_VERSION ||
    p['domainEvidenceProjectionVersion'] !== DOMAIN_EVIDENCE_PROJECTION_VERSION
  ) {
    issues.push(iss('INVALID_PROJECTION', '$.projection.schemaVersion', 'Projection version literals must match the T5 contract.'));
    return null;
  }

  // Core IDs
  if (!validId(p['caseId'])) {
    issues.push(iss('INVALID_PROJECTION', '$.projection.caseId', 'caseId must be a bounded safe identifier.'));
    return null;
  }
  if (!validId(p['projectionId'])) {
    issues.push(iss('INVALID_PROJECTION', '$.projection.projectionId', 'projectionId must be a bounded safe identifier.'));
    return null;
  }

  if (typeof p['projectionDigest'] !== 'string' || !/^[a-f0-9]{64}$/.test(p['projectionDigest'])) {
    issues.push(iss('INVALID_PROJECTION', '$.projection.projectionDigest', 'projectionDigest must be a lowercase SHA-256 digest.'));
    return null;
  }

  if (
    !isBoundedDenseArray(p['sourceRefs'], MAX_PROJECTION_ITEMS) ||
    p['sourceRefs'].length === 0 ||
    p['sourceRefs'].some((ref) => !validId(ref))
  ) {
    issues.push(iss('INVALID_PROJECTION', '$.projection.sourceRefs', 'sourceRefs must be a non-empty bounded dense array of secret-safe identifiers.'));
    return null;
  }

  // Staleness must be CURRENT - stale projections are not admitted
  if (p['staleness'] !== 'CURRENT') {
    issues.push(iss('STALE_PROJECTION', '$.projection.staleness', `Projection staleness is '${String(p['staleness'])}'; only CURRENT projections are admitted.`));
    return null;
  }

  // generatedAt must be valid UTC
  if (!validUtc(p['generatedAt'])) {
    issues.push(iss('INVALID_PROJECTION', '$.projection.generatedAt', 'generatedAt must be ISO-8601 UTC.'));
    return null;
  }

  if (!safeText(p['currentDisposition']) || p['currentDisposition'] === 'INVALID' || p['currentDisposition'] === 'STALE') {
    issues.push(iss('INVALID_PROJECTION', '$.projection.currentDisposition', 'currentDisposition must be a valid non-stale disposition.'));
    return null;
  }

  if (!isBoundedDenseArray(p['issues'], MAX_PROJECTION_ITEMS) || p['issues'].length !== 0) {
    issues.push(iss('INVALID_PROJECTION', '$.projection.issues', 'Only an issue-free T5 projection may be admitted.'));
    return null;
  }

  if (!isBoundedDenseArray(p['evidence'], MAX_PROJECTION_ITEMS)) {
    issues.push(iss('INVALID_PROJECTION', '$.projection.evidence', 'evidence must be a bounded dense plain array.'));
    return null;
  }
  const evidenceIds = new Set<string>();
  for (let index = 0; index < p['evidence'].length; index += 1) {
    const value = p['evidence'][index];
    if (
      !isPlainRecord(value) || !validId(value['evidenceId']) || !validId(value['sourceRef']) ||
      !safeText(value['observation']) || !validUtc(value['observedAt']) ||
      !safeNullableText(value['digest']) || !safeNullableText(value['reproductionBoundary']) ||
      evidenceIds.has(value['evidenceId'] as string)
    ) {
      issues.push(iss('INVALID_PROJECTION', `$.projection.evidence[${index}]`, 'Evidence entry is malformed, unsafe, or duplicated.'));
      return null;
    }
    evidenceIds.add(value['evidenceId'] as string);
  }

  if (!isBoundedDenseArray(p['findings'], MAX_PROJECTION_ITEMS)) {
    issues.push(iss('INVALID_PROJECTION', '$.projection.findings', 'findings must be a bounded dense plain array.'));
    return null;
  }
  const findingIds = new Set<string>();
  const severities = ['INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  const verificationStates = ['VERIFIED', 'UNVERIFIED', 'INCOMPLETE', 'BLOCKED'];
  for (let index = 0; index < p['findings'].length; index += 1) {
    const value = p['findings'][index];
    if (
      !isPlainRecord(value) || !validId(value['findingId']) || !safeText(value['claim']) ||
      typeof value['severity'] !== 'string' || !severities.includes(value['severity']) ||
      typeof value['confidence'] !== 'number' || !Number.isFinite(value['confidence']) ||
      value['confidence'] < 0 || value['confidence'] > 1 ||
      typeof value['verificationState'] !== 'string' || !verificationStates.includes(value['verificationState']) ||
      !isBoundedDenseArray(value['evidenceRefs'], MAX_PROJECTION_ITEMS) ||
      value['evidenceRefs'].some((ref) => !validId(ref) || !evidenceIds.has(ref)) ||
      !safeNullableText(value['remediation']) || findingIds.has(value['findingId'] as string)
    ) {
      issues.push(iss('INVALID_PROJECTION', `$.projection.findings[${index}]`, 'Finding entry is malformed, unsafe, duplicated, or unbound.'));
      return null;
    }
    findingIds.add(value['findingId'] as string);
  }

  if (!isBoundedDenseArray(p['paths'], MAX_PROJECTION_ITEMS)) {
    issues.push(iss('INVALID_PROJECTION', '$.projection.paths', 'paths must be a bounded dense plain array.'));
    return null;
  }

  return projection as unknown as CapabilityCaseEvidenceProjection;
}

// ---  Main function 

/**
 * Build a deterministic, review-pending learning candidate from a validated T5
 * projection and an explicit learning observation.
 *
 * @param projection - A CapabilityCaseEvidenceProjection from T5. Must have
 *   authorityNotice 'PROJECTION_ONLY', authorityMutation false, staleness
 *   'CURRENT', and non-empty sourceRefs and projectionDigest.
 * @param observation - The explicit learning observation. Validated
 *   fail-closed; secrets, oversized text, and malformed input are rejected.
 * @param now - An explicit ISO-8601 UTC timestamp. Never uses wall-clock time.
 * @returns A LearningCandidateProjectionResult with status 'VALID' and the
 *   candidate + intake record when all invariants pass, or 'INVALID' with
 *   issues and null outputs on any failure.
 */
export function projectCapabilityLearningCandidate(
  projection: unknown,
  observation: unknown,
  now: string,
): LearningCandidateProjectionResult {
  const issues: LearningCandidateIssue[] = [];

  // Validate now timestamp first - required for deterministic output
  if (!validUtc(now)) {
    issues.push(iss('INVALID_FIELD', '$.now', 'now must be an ISO-8601 UTC timestamp.'));
    return Object.freeze({
      status: 'INVALID' as const,
      candidate: null,
      intakeRecord: null,
      issues: Object.freeze([...issues]),
    });
  }

  // Validate projection
  const validProjection = validateProjection(projection, issues);

  // Validate observation object
  if (!isPlainRecord(observation)) {
    issues.push(iss('MALFORMED_INPUT', '$.observation', 'Observation must be a plain non-Proxy object.'));
    return Object.freeze({
      status: 'INVALID' as const,
      candidate: null,
      intakeRecord: null,
      issues: Object.freeze([...issues]),
    });
  }

  const obs = observation as Record<string, unknown>;

  // Reject attempted self-promotion: any attempt to set non-PENDING review
  // status, accepted deduplication, resolved contradiction, or a promotion
  // target in the input must be rejected
  const selfPromotionFields = ['reviewStatus', 'deduplicationStatus', 'contradictionStatus', 'promotionTarget'];
  for (const field of selfPromotionFields) {
    if (field in obs && obs[field] !== undefined && obs[field] !== null) {
      issues.push(iss('ATTEMPTED_SELF_PROMOTION', `$.observation.${field}`, `Input must not supply '${field}'; it is always controlled by this seam.`));
    }
  }
  if (issues.some((i) => i.code === 'ATTEMPTED_SELF_PROMOTION')) {
    return Object.freeze({
      status: 'INVALID' as const,
      candidate: null,
      intakeRecord: null,
      issues: Object.freeze([...issues]),
    });
  }

  // Validate text fields
  let textOk = true;
  for (const [field, path] of [
    ['observedProblem', '$.observation.observedProblem'],
    ['method', '$.observation.method'],
    ['result', '$.observation.result'],
    ['reusableLesson', '$.observation.reusableLesson'],
  ] as const) {
    if (!safeText(obs[field])) {
      issues.push(iss(
        typeof obs[field] === 'string' && isSecretLike(obs[field] as string)
          ? 'SECRET_LIKE_VALUE_REJECTED'
          : 'INVALID_FIELD',
        path,
        `${field} must be a bounded non-empty non-secret string.`,
      ));
      textOk = false;
    }
  }

  const failureMode = normalizeNullableText(obs['failureMode'], '$.observation.failureMode', issues);
  const revalidationCondition = normalizeNullableText(obs['revalidationCondition'], '$.observation.revalidationCondition', issues);
  const expiresAt = normalizeNullableUtc(obs['expiresAt'], '$.observation.expiresAt', issues);

  // Validate scope arrays
  const packageScope = normalizeScopeArray(obs['packageScope'], '$.observation.packageScope', issues);
  const environmentScope = normalizeScopeArray(obs['environmentScope'], '$.observation.environmentScope', issues);

  // Validate ref arrays
  const linkedFindingRefs = normalizeRefArray(obs['linkedFindingRefs'], '$.observation.linkedFindingRefs', issues);
  const linkedEvidenceRefs = normalizeRefArray(obs['linkedEvidenceRefs'], '$.observation.linkedEvidenceRefs', issues);

  // Validate environmentSpecificity
  if (
    typeof obs['environmentSpecificity'] !== 'string' ||
    !VALID_ENV_SPECIFICITY.includes(obs['environmentSpecificity'] as LearningCandidateEnvironmentSpecificity)
  ) {
    issues.push(iss('INVALID_FIELD', '$.observation.environmentSpecificity', `environmentSpecificity must be one of: ${VALID_ENV_SPECIFICITY.join(', ')}.`));
    textOk = false;
  }

  // If projection validation failed or text validation failed, return INVALID
  if (!validProjection || !textOk || issues.length > 0) {
    return Object.freeze({
      status: 'INVALID' as const,
      candidate: null,
      intakeRecord: null,
      issues: Object.freeze([...issues].sort((a, b) =>
        `${a.path}\0${a.code}\0${a.message}` < `${b.path}\0${b.code}\0${b.message}` ? -1 : 1,
      )),
    });
  }

  // At this point, all fields are validated. Build deterministic candidate.

  const proj = validProjection;
  const envSpec = obs['environmentSpecificity'] as LearningCandidateEnvironmentSpecificity;

  // Validate that linkedFindingRefs resolve to projection.findings
  const projectionFindingIds = new Set<string>(
    (proj.findings as unknown as Array<{ findingId: string }>).map((f) => f.findingId),
  );
  const unboundFindingRefs = linkedFindingRefs.filter((r) => !projectionFindingIds.has(r));
  if (unboundFindingRefs.length > 0) {
    for (const ref of unboundFindingRefs) {
      issues.push(iss('UNBOUND_REFERENCE', '$.observation.linkedFindingRefs', `Finding reference '${ref}' does not resolve to any finding in the projection.`));
    }
  }

  // Validate that linkedEvidenceRefs resolve to projection.evidence
  const projectionEvidenceIds = new Set<string>(
    (proj.evidence as unknown as Array<{ evidenceId: string }>).map((e) => e.evidenceId),
  );
  const unboundEvidenceRefs = linkedEvidenceRefs.filter((r) => !projectionEvidenceIds.has(r));
  if (unboundEvidenceRefs.length > 0) {
    for (const ref of unboundEvidenceRefs) {
      issues.push(iss('UNBOUND_REFERENCE', '$.observation.linkedEvidenceRefs', `Evidence reference '${ref}' does not resolve to any evidence in the projection.`));
    }
  }

  if (issues.length > 0) {
    return Object.freeze({
      status: 'INVALID' as const,
      candidate: null,
      intakeRecord: null,
      issues: Object.freeze([...issues].sort((a, b) =>
        `${a.path}\0${a.code}\0${a.message}` < `${b.path}\0${b.code}\0${b.message}` ? -1 : 1,
      )),
    });
  }

  // Build normalized content for digest (all mutable fields excluded: candidateId, generatedAt, candidateDigest)
  const normalizedForDigest: Omit<CapabilityLearningCandidate, 'candidateDigest' | 'candidateId' | 'generatedAt'> = {
    schemaVersion: CAPABILITY_LEARNING_CANDIDATE_PROJECTION_VERSION,
    projectionDigest: proj.projectionDigest,
    caseId: proj.caseId,
    projectionId: proj.projectionId,
    sourceRefs: Object.freeze([...proj.sourceRefs].sort()),
    linkedFindingRefs,
    linkedEvidenceRefs,
    packageScope,
    environmentScope,
    observedProblem: obs['observedProblem'] as string,
    method: obs['method'] as string,
    result: obs['result'] as string,
    failureMode: failureMode,
    reusableLesson: obs['reusableLesson'] as string,
    environmentSpecificity: envSpec,
    expiresAt: expiresAt,
    revalidationCondition: revalidationCondition,
    reviewStatus: 'PENDING' as const,
    deduplicationStatus: 'PENDING' as const,
    contradictionStatus: 'PENDING' as const,
    promotionTarget: null,
    autonomousMutationAuthorized: false as const,
    independentReviewRequired: true as const,
    governanceWorkOrderRequired: true as const,
  };

  const candidateDigest = computeCandidateDigest(normalizedForDigest);
  const candidateId = computeCandidateId(candidateDigest, proj.projectionDigest, now);

  const candidate: CapabilityLearningCandidate = Object.freeze({
    ...normalizedForDigest,
    candidateId,
    candidateDigest,
    generatedAt: now,
  });

  // Compose into the existing LearningSignalIntakeBridge with the required
  // lane, defect class, and disposition. The bridge's autonomousMutationAuthorized
  // is always false and requiresGovernanceWorkOrder is true for RUNTIME_LEARNING_CANDIDATE.
  const bridge = createLearningSignalIntakeBridge({ now: () => now });
  const intakeRecord = bridge.intake({
    sourceId: candidateId,
    sourceArtifact: `cvf.capabilityLearningCandidate:${proj.caseId}:${proj.projectionId}`,
    sourceSummary: `Capability learning candidate from T5 projection ${proj.projectionId} for case ${proj.caseId}: ${(obs['observedProblem'] as string).slice(0, 120)}`,
    lane: 'RUNTIME_BEHAVIOR_LEARNING',
    defectClass: 'RUNTIME_SIGNAL_GAP',
    severity: 'medium',
    disposition: 'RUNTIME_LEARNING_CANDIDATE',
    nextControlAction: 'Await independent review and governed work order before any promotion or mutation.',
    evidenceBasis: `projection:${proj.projectionDigest}:candidate:${candidateDigest}`,
  });

  return Object.freeze({
    status: 'VALID' as const,
    candidate,
    intakeRecord,
    issues: Object.freeze([] as LearningCandidateIssue[]),
  });
}
