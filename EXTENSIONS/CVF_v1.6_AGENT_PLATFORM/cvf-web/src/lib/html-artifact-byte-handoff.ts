/** NCR HTML B2b isolated synthetic byte-handoff helper.
 *
 * Pure, unconnected helper. It turns one exact decoded HTML string into a
 * defensively owned UTF-8 byte snapshot, and later checks handed-off bytes
 * against the identity declared for that snapshot. Identity reuses the B2a
 * algorithm label and shape (SHA-256 over UTF-8 bytes plus byte length); it is
 * not a new identity algorithm.
 *
 * Custody rules: the string is encoded once, at creation. The owned bytes are
 * never exposed by reference; every read returns a fresh copy, and bytes handed
 * in are copied before use. Verification takes bytes as input and hashes those
 * bytes; it never re-encodes a string and never trusts a retained hash of some
 * other value. The JSON envelope, `sourceHash`, DOM output and clipboard text
 * are not the artifact bytes and are not accepted here.
 *
 * A carried B2a candidate stays `DRAFT_UNACCEPTED`. Nothing here can change
 * that state, interpret a receipt, or accept, persist or send anything.
 *
 * Claim boundary: in-memory synthetic handoff only. It is not network, saved
 * file, clipboard, real-browser, durability or operator-acceptance proof. See
 * docs/reference/CVF_NCR_HTML_B2B_SYNTHETIC_BYTE_BOUNDARY_2026-09-30.md.
 */

import { createHash } from 'node:crypto';

import {
  HTML_ARTIFACT_CANDIDATE_STATE,
  HTML_BYTES_IDENTITY_ALGORITHM,
  computeHtmlBytesIdentity,
  type HtmlArtifactCandidate,
  type HtmlBytesIdentity,
} from './html-artifact-acceptance-candidate';

export const HTML_BYTE_HANDOFF_SCHEMA = 'cvf.htmlByteHandoff.v1' as const;

export interface HtmlByteHandoff {
  readonly schema: typeof HTML_BYTE_HANDOFF_SCHEMA;
  readonly identity: HtmlBytesIdentity;
  /** Optional B2a candidate for the same bytes; always `DRAFT_UNACCEPTED`. */
  readonly candidate: HtmlArtifactCandidate | null;
  /** A fresh copy of the owned bytes on every call; mutating it never changes the handoff. */
  copyBytes(): Uint8Array;
}

export type HtmlByteHandoffVerificationReason =
  | 'MALFORMED_HANDOFF'
  | 'NOT_BYTES'
  | 'LENGTH_MISMATCH'
  | 'HASH_MISMATCH'
  | 'STATE_NOT_DRAFT_UNACCEPTED'
  | 'CANDIDATE_IDENTITY_MISMATCH';

export type HtmlByteHandoffVerification =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: HtmlByteHandoffVerificationReason };

const SHA256_HEX = /^[0-9a-f]{64}$/;
const ENCODER = new TextEncoder();

// Realm-independent: bytes made by Node internals (Buffer, TextEncoder) can come from another
// realm under a DOM test environment, where `instanceof Uint8Array` is false. Call the
// intrinsic typed-array tag getter so an own Symbol.toStringTag cannot disguise a DataView.
const typedArrayTag = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(Uint8Array.prototype), Symbol.toStringTag)?.get;
function isUint8Array(value: unknown): value is Uint8Array {
  return ArrayBuffer.isView(value) && typedArrayTag?.call(value) === 'Uint8Array';
}

function sha256Hex(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

function identityOfBytes(bytes: Uint8Array): HtmlBytesIdentity {
  return Object.freeze({
    algorithm: HTML_BYTES_IDENTITY_ALGORITHM,
    htmlSha256: sha256Hex(bytes),
    byteLength: bytes.length,
  });
}

function sameIdentity(a: HtmlBytesIdentity, b: HtmlBytesIdentity): boolean {
  return a.algorithm === b.algorithm && a.htmlSha256 === b.htmlSha256 && a.byteLength === b.byteLength;
}

function checkCarriedCandidate(candidate: HtmlArtifactCandidate | null | undefined, identity: HtmlBytesIdentity): HtmlArtifactCandidate | null {
  if (candidate === undefined || candidate === null) return null;
  if (candidate.state !== HTML_ARTIFACT_CANDIDATE_STATE) {
    throw new TypeError('A carried candidate must be DRAFT_UNACCEPTED.');
  }
  if (!candidate.identity || !sameIdentity(candidate.identity, identity)) {
    throw new TypeError('The carried candidate identity does not match the handed-off bytes.');
  }
  return candidate;
}

// The owned bytes live here, not on the handoff object, so no property exposes them by reference.
const OWNED_BYTES = new WeakMap<object, Uint8Array>();

function buildHandoff(ownedBytes: Uint8Array, candidate: HtmlArtifactCandidate | null | undefined): HtmlByteHandoff {
  const identity = identityOfBytes(ownedBytes);
  const carried = checkCarriedCandidate(candidate, identity);
  const handoff: HtmlByteHandoff = Object.freeze({
    schema: HTML_BYTE_HANDOFF_SCHEMA,
    identity,
    candidate: carried,
    copyBytes(): Uint8Array {
      const held = OWNED_BYTES.get(handoff);
      if (!held) throw new TypeError('Not a handoff created by this module.');
      return new Uint8Array(held);
    },
  });
  OWNED_BYTES.set(handoff, ownedBytes);
  return handoff;
}

/**
 * Encodes the exact decoded HTML string to UTF-8 once and keeps a private copy.
 * Malformed Unicode is rejected (as B2a does) rather than replaced, and there is no trimming,
 * newline conversion, BOM change or Unicode normalization.
 */
export function createHtmlByteHandoff(
  html: string,
  options: { readonly candidate?: HtmlArtifactCandidate | null } = {},
): HtmlByteHandoff {
  // B2a throws on empty, non-string and lone-surrogate input before anything is encoded.
  const expected = computeHtmlBytesIdentity(html);
  const owned = ENCODER.encode(html);
  const handoff = buildHandoff(owned, options.candidate);
  if (!sameIdentity(handoff.identity, expected)) {
    throw new Error('B2A_IDENTITY_PARITY_MISMATCH: owned bytes disagree with the B2a identity.');
  }
  return handoff;
}

/**
 * Takes ownership of a copy of bytes received from elsewhere (for example a Blob read). The bytes
 * must be well-formed UTF-8; a leading BOM is kept as data. The caller's array is copied first, so
 * later caller mutation cannot change the handoff.
 */
export function adoptHtmlBytes(
  bytes: Uint8Array,
  options: { readonly candidate?: HtmlArtifactCandidate | null } = {},
): HtmlByteHandoff {
  if (!isUint8Array(bytes)) throw new TypeError('bytes must be a Uint8Array.');
  if (bytes.length === 0) throw new TypeError('bytes must not be empty.');
  const owned = new Uint8Array(bytes);
  try {
    new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(owned);
  } catch {
    throw new TypeError('bytes are not well-formed UTF-8.');
  }
  return buildHandoff(owned, options.candidate);
}

/**
 * Checks handed-off bytes against the identity declared by a handoff. It hashes the bytes it is
 * given: a string, or any array whose content differs from the declared bytes, is rejected.
 */
export function verifyHtmlByteHandoff(handoff: HtmlByteHandoff, bytes: Uint8Array): HtmlByteHandoffVerification {
  const identity = handoff?.identity;
  if (
    !handoff
    || handoff.schema !== HTML_BYTE_HANDOFF_SCHEMA
    || !identity
    || identity.algorithm !== HTML_BYTES_IDENTITY_ALGORITHM
    || typeof identity.htmlSha256 !== 'string'
    || !SHA256_HEX.test(identity.htmlSha256)
    || !Number.isInteger(identity.byteLength)
    || identity.byteLength < 1
  ) {
    return { ok: false, reason: 'MALFORMED_HANDOFF' };
  }
  if (!isUint8Array(bytes)) return { ok: false, reason: 'NOT_BYTES' };
  if (handoff.candidate) {
    if (handoff.candidate.state !== HTML_ARTIFACT_CANDIDATE_STATE) return { ok: false, reason: 'STATE_NOT_DRAFT_UNACCEPTED' };
    if (!handoff.candidate.identity || !sameIdentity(handoff.candidate.identity, identity)) {
      return { ok: false, reason: 'CANDIDATE_IDENTITY_MISMATCH' };
    }
  }
  if (bytes.length !== identity.byteLength) return { ok: false, reason: 'LENGTH_MISMATCH' };
  if (sha256Hex(bytes) !== identity.htmlSha256) return { ok: false, reason: 'HASH_MISMATCH' };
  return { ok: true };
}
