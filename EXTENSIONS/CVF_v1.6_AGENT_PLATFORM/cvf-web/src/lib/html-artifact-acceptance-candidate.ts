/** NCR HTML B2a isolated synthetic artifact-identity candidate.
 *
 * Pure, unconnected helper. It identifies the exact UTF-8 bytes of a rendered
 * HTML string that was returned by an export attempt, and keeps three things
 * distinct: the HTML byte hash (identity), the server `sourceHash` (a hash of
 * source text only) and the attempt/receipt identifiers (supporting evidence).
 *
 * A candidate is always `DRAFT_UNACCEPTED`. Nothing in this module can produce
 * any other state, and a governance receipt, whatever its decision, is only
 * recorded as evidence. No route, page, store, network, file or database is
 * imported or called; the only import is the Node hash primitive.
 *
 * Claim boundary: synthetic identity contract only. It is not durable storage,
 * an operator decision, artifact approval, or a runtime, live or production
 * claim. See docs/reference/CVF_NCR_HTML_B2A_SYNTHETIC_ACCEPTANCE_CONTRACT_2026-09-30.md.
 */

import { createHash } from 'node:crypto';

export const HTML_BYTES_IDENTITY_ALGORITHM = 'sha256-utf8-html-bytes/v1' as const;
export const HTML_ARTIFACT_CANDIDATE_SCHEMA = 'cvf.htmlArtifactCandidate.v1' as const;
export const HTML_ARTIFACT_CANDIDATE_STATE = 'DRAFT_UNACCEPTED' as const;

export interface HtmlBytesIdentity {
  readonly algorithm: typeof HTML_BYTES_IDENTITY_ALGORITHM;
  /** Lowercase hex SHA-256 over the UTF-8 bytes of the exact HTML string, no normalization. */
  readonly htmlSha256: string;
  readonly byteLength: number;
}

export interface HtmlArtifactAttempt {
  /** Local, explicit attempt identifier (not a receipt ID and not an artifact identity). */
  readonly attemptId: string;
  /** Local build/version number of the attempt, a positive integer. */
  readonly buildNumber: number;
}

/** Supporting evidence only. `decision` is opaque text and never influences candidate state. */
export interface HtmlArtifactReceiptEvidence {
  readonly receiptId?: string;
  readonly receiptAttemptId?: string;
  readonly decision?: string;
}

export interface HtmlArtifactCandidate {
  readonly schema: typeof HTML_ARTIFACT_CANDIDATE_SCHEMA;
  readonly state: typeof HTML_ARTIFACT_CANDIDATE_STATE;
  readonly identity: HtmlBytesIdentity;
  readonly attempt: HtmlArtifactAttempt;
  /** Hash of source text as reported by the export route. Not an artifact identity. */
  readonly sourceHash: string | null;
  readonly receiptEvidence: HtmlArtifactReceiptEvidence | null;
}

export interface CreateHtmlArtifactCandidateInput {
  readonly html: string;
  readonly attempt: HtmlArtifactAttempt;
  readonly sourceHash?: string | null;
  readonly receiptEvidence?: HtmlArtifactReceiptEvidence | null;
}

export type HtmlArtifactVerificationReason =
  | 'MALFORMED_CANDIDATE'
  | 'STATE_NOT_DRAFT_UNACCEPTED'
  | 'INVALID_HTML'
  | 'LENGTH_MISMATCH'
  | 'HASH_MISMATCH';

export type HtmlArtifactVerification =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: HtmlArtifactVerificationReason };

const SHA256_HEX = /^[0-9a-f]{64}$/;
// A lone surrogate cannot be represented in UTF-8; encoding would silently substitute U+FFFD
// and let two different strings share one identity, so such input is refused.
const LONE_SURROGATE = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/;

function utf8Bytes(html: string): Buffer {
  if (typeof html !== 'string' || html.length === 0) {
    throw new TypeError('HTML must be a non-empty string.');
  }
  if (LONE_SURROGATE.test(html)) {
    throw new TypeError('HTML contains a lone surrogate and has no exact UTF-8 encoding.');
  }
  return Buffer.from(html, 'utf8');
}

/** Identity of the exact string given, byte for byte: no trimming, newline or Unicode normalization. */
export function computeHtmlBytesIdentity(html: string): HtmlBytesIdentity {
  const bytes = utf8Bytes(html);
  return Object.freeze({
    algorithm: HTML_BYTES_IDENTITY_ALGORITHM,
    htmlSha256: createHash('sha256').update(bytes).digest('hex'),
    byteLength: bytes.length,
  });
}

function normalizeAttempt(attempt: HtmlArtifactAttempt): HtmlArtifactAttempt {
  if (!attempt || typeof attempt.attemptId !== 'string' || attempt.attemptId.trim().length === 0) {
    throw new TypeError('attemptId must be a non-empty string.');
  }
  if (!Number.isInteger(attempt.buildNumber) || attempt.buildNumber < 1) {
    throw new TypeError('buildNumber must be a positive integer.');
  }
  return Object.freeze({ attemptId: attempt.attemptId, buildNumber: attempt.buildNumber });
}

function normalizeReceipt(receipt: HtmlArtifactReceiptEvidence | null | undefined): HtmlArtifactReceiptEvidence | null {
  if (!receipt) return null;
  const copy: { receiptId?: string; receiptAttemptId?: string; decision?: string } = {};
  for (const key of ['receiptId', 'receiptAttemptId', 'decision'] as const) {
    const value = receipt[key];
    if (value === undefined) continue;
    if (typeof value !== 'string') throw new TypeError(`${key} must be a string when present.`);
    copy[key] = value;
  }
  return Object.freeze(copy);
}

function normalizeSourceHash(sourceHash: string | null | undefined): string | null {
  if (sourceHash === undefined || sourceHash === null) return null;
  if (!SHA256_HEX.test(sourceHash)) throw new TypeError('sourceHash must be lowercase hex SHA-256.');
  return sourceHash;
}

/** Builds a candidate for exactly these HTML bytes. The state is always `DRAFT_UNACCEPTED`. */
export function createHtmlArtifactCandidate(input: CreateHtmlArtifactCandidateInput): HtmlArtifactCandidate {
  return Object.freeze({
    schema: HTML_ARTIFACT_CANDIDATE_SCHEMA,
    state: HTML_ARTIFACT_CANDIDATE_STATE,
    identity: computeHtmlBytesIdentity(input.html),
    attempt: normalizeAttempt(input.attempt),
    sourceHash: normalizeSourceHash(input.sourceHash),
    receiptEvidence: normalizeReceipt(input.receiptEvidence),
  });
}

/** Records receipt evidence on a copy. Identity, attempt and state are carried over unchanged. */
export function withReceiptEvidence(
  candidate: HtmlArtifactCandidate,
  receiptEvidence: HtmlArtifactReceiptEvidence | null,
): HtmlArtifactCandidate {
  return Object.freeze({
    ...candidate,
    state: HTML_ARTIFACT_CANDIDATE_STATE,
    receiptEvidence: normalizeReceipt(receiptEvidence),
  });
}

function isWellFormedCandidate(candidate: unknown): candidate is HtmlArtifactCandidate {
  if (!candidate || typeof candidate !== 'object') return false;
  const value = candidate as Partial<HtmlArtifactCandidate>;
  const identity = value.identity;
  return value.schema === HTML_ARTIFACT_CANDIDATE_SCHEMA
    && !!identity
    && identity.algorithm === HTML_BYTES_IDENTITY_ALGORITHM
    && typeof identity.htmlSha256 === 'string'
    && SHA256_HEX.test(identity.htmlSha256)
    && Number.isInteger(identity.byteLength)
    && identity.byteLength > 0;
}

/**
 * Checks the exact HTML string against the candidate identity. It never re-renders from
 * request fields and never consults `sourceHash`, attempt or receipt data.
 */
export function verifyHtmlArtifactCandidate(candidate: HtmlArtifactCandidate, html: string): HtmlArtifactVerification {
  if (!isWellFormedCandidate(candidate)) return { ok: false, reason: 'MALFORMED_CANDIDATE' };
  if (candidate.state !== HTML_ARTIFACT_CANDIDATE_STATE) return { ok: false, reason: 'STATE_NOT_DRAFT_UNACCEPTED' };
  let observed: HtmlBytesIdentity;
  try {
    observed = computeHtmlBytesIdentity(html);
  } catch {
    return { ok: false, reason: 'INVALID_HTML' };
  }
  if (observed.byteLength !== candidate.identity.byteLength) return { ok: false, reason: 'LENGTH_MISMATCH' };
  if (observed.htmlSha256 !== candidate.identity.htmlSha256) return { ok: false, reason: 'HASH_MISMATCH' };
  return { ok: true };
}
