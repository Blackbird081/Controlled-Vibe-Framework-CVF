import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  HTML_ARTIFACT_CANDIDATE_STATE,
  computeHtmlBytesIdentity,
  createHtmlArtifactCandidate,
  verifyHtmlArtifactCandidate,
  withReceiptEvidence,
  type HtmlArtifactCandidate,
} from './html-artifact-acceptance-candidate';

// All fixtures are synthetic strings. Expected digests were computed independently with Python hashlib.
const ABC_SHA256 = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';
const VI_TEXT = 'Ti\u00eau \u0111\u1ec1 \u2014 \u65e5\u672c\u8a9e \u{1F680}';
const VI_TEXT_BYTES = 30;
const VI_TEXT_SHA256 = '972143231c80a7d6f04d5bdd544e5971e00bc8849b6876e7f3786c49a5a19a51';
const NFC_SHA256 = 'eabedf6ee233e905c3ddadab2d082fe5d6d4d426cbf34b954d20cd15e8047d1d';
const NFD_SHA256 = 'ea1d4d8d7dc4ec47fc6776820918cf91cf1c4cf7884241e43c3088f6eb6c992f';
const WHITESPACE_SHA256 = '8523349a709853eed8b50d51c5ed40d2bf8058eb98ce38709405c60389510895';
const SOURCE_HASH = '1'.repeat(64);

interface RenderFields {
  title: string;
  claimBoundary: string;
  generatedAt: string;
  sourceHash: string;
}

const BASE: RenderFields = {
  title: 'Synthetic Review Packet',
  claimBoundary: 'Synthetic boundary only.',
  generatedAt: '2026-09-30T01:02:03.000Z',
  sourceHash: SOURCE_HASH,
};

// Mirrors how the export route embeds rendered fields, including the source hash of source text only.
function renderHtml(fields: RenderFields): string {
  return [
    '<!doctype html><html lang="en"><body><main>',
    `<h1>${fields.title}</h1>`,
    `<div><span>Generated</span>${fields.generatedAt}</div>`,
    `<div><span>Source hash</span>${fields.sourceHash}</div>`,
    `<p>${fields.claimBoundary}</p>`,
    '</main></body></html>',
  ].join('\n');
}

const ATTEMPT = { attemptId: 'attempt-synthetic-1', buildNumber: 1 };

function candidateFor(html: string): HtmlArtifactCandidate {
  return createHtmlArtifactCandidate({ html, attempt: ATTEMPT, sourceHash: SOURCE_HASH });
}

describe('html-artifact-acceptance-candidate (B2a synthetic identity)', () => {
  it('matches independently computed SHA-256 vectors over UTF-8 bytes', () => {
    expect(computeHtmlBytesIdentity('abc')).toEqual({
      algorithm: 'sha256-utf8-html-bytes/v1',
      htmlSha256: ABC_SHA256,
      byteLength: 3,
    });
    const identity = computeHtmlBytesIdentity(VI_TEXT);
    expect(identity.htmlSha256).toBe(VI_TEXT_SHA256);
    expect(identity.byteLength).toBe(VI_TEXT_BYTES);
    expect(VI_TEXT.length).not.toBe(VI_TEXT_BYTES);
    // Whitespace is part of the bytes: no trimming or collapsing.
    expect(computeHtmlBytesIdentity('a  b\t\n')).toEqual({ algorithm: 'sha256-utf8-html-bytes/v1', htmlSha256: WHITESPACE_SHA256, byteLength: 6 });
  });

  it('gives identical bytes one stable identity across calls and candidates', () => {
    const html = renderHtml(BASE);
    const first = candidateFor(html);
    const second = candidateFor(renderHtml({ ...BASE }));
    expect(first.identity).toEqual(second.identity);
    expect(computeHtmlBytesIdentity(html)).toEqual(first.identity);
    expect(verifyHtmlArtifactCandidate(first, html)).toEqual({ ok: true });
  });

  it('is deterministic for non-ASCII text and does not Unicode-normalize', () => {
    const composed = computeHtmlBytesIdentity('Ti\u00eau');
    const decomposed = computeHtmlBytesIdentity('Tie\u0302u');
    expect(composed.htmlSha256).toBe(NFC_SHA256);
    expect(decomposed.htmlSha256).toBe(NFD_SHA256);
    expect(composed.htmlSha256).not.toBe(decomposed.htmlSha256);
    expect(composed.byteLength).toBe(5);
    expect(decomposed.byteLength).toBe(6);
    expect(computeHtmlBytesIdentity(VI_TEXT)).toEqual(computeHtmlBytesIdentity(VI_TEXT));
  });

  it('changes identity when only a rendered field changes and the source hash is unchanged', () => {
    const baseline = candidateFor(renderHtml(BASE));
    const variants: Array<Partial<RenderFields>> = [
      { title: 'Synthetic Review Packet v2' },
      { claimBoundary: 'A different synthetic boundary.' },
      { generatedAt: '2026-09-30T01:02:04.000Z' },
    ];
    const seen = new Set([baseline.identity.htmlSha256]);
    for (const change of variants) {
      const html = renderHtml({ ...BASE, ...change });
      const candidate = candidateFor(html);
      expect(candidate.sourceHash).toBe(baseline.sourceHash);
      expect(candidate.identity.htmlSha256).not.toBe(baseline.identity.htmlSha256);
      expect(verifyHtmlArtifactCandidate(baseline, html)).toEqual({ ok: false, reason: expect.stringMatching(/HASH_MISMATCH|LENGTH_MISMATCH/) });
      seen.add(candidate.identity.htmlSha256);
    }
    expect(seen.size).toBe(4);
  });

  it('keeps the source hash, HTML hash, attempt ID and receipt ID as separate values', () => {
    const html = renderHtml(BASE);
    const candidate = createHtmlArtifactCandidate({
      html,
      attempt: ATTEMPT,
      sourceHash: SOURCE_HASH,
      receiptEvidence: { receiptId: 'receipt-synthetic-1', receiptAttemptId: 'receipt-attempt-synthetic-1', decision: 'ALLOW' },
    });
    const values = [
      candidate.identity.htmlSha256,
      candidate.sourceHash,
      candidate.attempt.attemptId,
      candidate.receiptEvidence?.receiptId,
      candidate.receiptEvidence?.receiptAttemptId,
    ];
    expect(new Set(values).size).toBe(values.length);
    // Verification must not fall back to the source hash as identity.
    expect(candidate.identity.htmlSha256).not.toBe(SOURCE_HASH);
    const sourceHashOnly = { ...candidate, identity: { ...candidate.identity, htmlSha256: SOURCE_HASH } };
    expect(verifyHtmlArtifactCandidate(sourceHashOnly, html)).toEqual({ ok: false, reason: 'HASH_MISMATCH' });
  });

  it('rejects a one-byte mutation, a trailing newline, a line-ending change and a BOM', () => {
    const html = renderHtml(BASE);
    const candidate = candidateFor(html);
    const mutations: Record<string, string> = {
      oneCharacterSubstitution: html.replace('Synthetic Review', 'Synthetic Reviex'),
      trailingNewline: `${html}\n`,
      crlf: html.replace(/\n/g, '\r\n'),
      byteOrderMark: `\ufeff${html}`,
      truncatedByOneByte: html.slice(0, -1),
      sameLengthSpaceToTab: html.replace('Synthetic Review', 'Synthetic\tReview'),
      sameLengthNewlineToSpace: html.replace('\n', ' '),
    };
    for (const [name, mutated] of Object.entries(mutations)) {
      expect(mutated, name).not.toBe(html);
      const result = verifyHtmlArtifactCandidate(candidate, mutated);
      expect(result.ok, name).toBe(false);
    }
    // A same-length substitution is caught by the hash, not only by the length check.
    expect(verifyHtmlArtifactCandidate(candidate, mutations.oneCharacterSubstitution)).toEqual({ ok: false, reason: 'HASH_MISMATCH' });
    expect(verifyHtmlArtifactCandidate(candidate, mutations.sameLengthSpaceToTab)).toEqual({ ok: false, reason: 'HASH_MISMATCH' });
    expect(verifyHtmlArtifactCandidate(candidate, mutations.sameLengthNewlineToSpace)).toEqual({ ok: false, reason: 'HASH_MISMATCH' });
  });

  it('detects tampering with the stored identity', () => {
    const html = renderHtml(BASE);
    const candidate = candidateFor(html);
    const flippedHash = `${candidate.identity.htmlSha256.slice(0, -1)}${candidate.identity.htmlSha256.endsWith('0') ? '1' : '0'}`;
    expect(verifyHtmlArtifactCandidate({ ...candidate, identity: { ...candidate.identity, htmlSha256: flippedHash } }, html))
      .toEqual({ ok: false, reason: 'HASH_MISMATCH' });
    expect(verifyHtmlArtifactCandidate({ ...candidate, identity: { ...candidate.identity, byteLength: candidate.identity.byteLength + 1 } }, html))
      .toEqual({ ok: false, reason: 'LENGTH_MISMATCH' });
    expect(verifyHtmlArtifactCandidate({ ...candidate, identity: { ...candidate.identity, htmlSha256: 'ABC' } }, html))
      .toEqual({ ok: false, reason: 'MALFORMED_CANDIDATE' });
    expect(verifyHtmlArtifactCandidate({ ...candidate, schema: 'other' } as unknown as HtmlArtifactCandidate, html))
      .toEqual({ ok: false, reason: 'MALFORMED_CANDIDATE' });
  });

  it('refuses input that has no exact UTF-8 encoding or no content', () => {
    expect(() => computeHtmlBytesIdentity('')).toThrow(TypeError);
    expect(() => computeHtmlBytesIdentity('abc\uD800')).toThrow(/lone surrogate/);
    expect(() => computeHtmlBytesIdentity('\uDC00abc')).toThrow(/lone surrogate/);
    expect(() => computeHtmlBytesIdentity(undefined as unknown as string)).toThrow(TypeError);
    expect(computeHtmlBytesIdentity('a\u{1F680}b').byteLength).toBe(6);
    const candidate = candidateFor(renderHtml(BASE));
    expect(verifyHtmlArtifactCandidate(candidate, 'abc\uD800')).toEqual({ ok: false, reason: 'INVALID_HTML' });
    expect(verifyHtmlArtifactCandidate(candidate, '')).toEqual({ ok: false, reason: 'INVALID_HTML' });
  });

  it('validates attempt and source-hash metadata explicitly', () => {
    const html = renderHtml(BASE);
    expect(() => createHtmlArtifactCandidate({ html, attempt: { attemptId: ' ', buildNumber: 1 } })).toThrow(/attemptId/);
    expect(() => createHtmlArtifactCandidate({ html, attempt: { attemptId: 'a', buildNumber: 0 } })).toThrow(/buildNumber/);
    expect(() => createHtmlArtifactCandidate({ html, attempt: { attemptId: 'a', buildNumber: 1.5 } })).toThrow(/buildNumber/);
    expect(() => createHtmlArtifactCandidate({ html, attempt: ATTEMPT, sourceHash: 'not-a-hash' })).toThrow(/sourceHash/);
    expect(createHtmlArtifactCandidate({ html, attempt: ATTEMPT }).sourceHash).toBeNull();
    expect(createHtmlArtifactCandidate({ html, attempt: ATTEMPT }).receiptEvidence).toBeNull();
  });

  it('leaves the candidate unaccepted whatever the receipt decision says', () => {
    const html = renderHtml(BASE);
    for (const decision of ['ALLOW', 'APPROVED', 'allow', 'ACCEPTED', 'DENY', 'DRAFT_ACCEPTED', '']) {
      const created = createHtmlArtifactCandidate({
        html,
        attempt: ATTEMPT,
        receiptEvidence: { receiptId: 'receipt-synthetic-1', decision },
      });
      expect(created.state, decision).toBe(HTML_ARTIFACT_CANDIDATE_STATE);
      const attached = withReceiptEvidence(candidateFor(html), { receiptId: 'receipt-synthetic-2', decision });
      expect(attached.state, decision).toBe('DRAFT_UNACCEPTED');
      expect(attached.identity).toEqual(candidateFor(html).identity);
      expect(attached.attempt).toEqual(ATTEMPT);
      expect(verifyHtmlArtifactCandidate(attached, html)).toEqual({ ok: true });
    }
  });

  it('rejects a candidate that claims any state other than DRAFT_UNACCEPTED', () => {
    const html = renderHtml(BASE);
    const candidate = candidateFor(html);
    for (const state of ['ACCEPTED', 'RECEIPT_ALLOW_REVIEW_REQUIRED', 'ALLOW']) {
      const forged = { ...candidate, state } as unknown as HtmlArtifactCandidate;
      expect(verifyHtmlArtifactCandidate(forged, html)).toEqual({ ok: false, reason: 'STATE_NOT_DRAFT_UNACCEPTED' });
    }
    // Even a fresh withReceiptEvidence over a forged input carries the fixed state.
    const forged = { ...candidate, state: 'ACCEPTED' } as unknown as HtmlArtifactCandidate;
    expect(withReceiptEvidence(forged, { decision: 'ALLOW' }).state).toBe('DRAFT_UNACCEPTED');
  });

  it('returns frozen candidates that do not alias caller receipt input', () => {
    const receipt = { receiptId: 'receipt-synthetic-1', decision: 'ALLOW' };
    const candidate = createHtmlArtifactCandidate({ html: renderHtml(BASE), attempt: ATTEMPT, receiptEvidence: receipt });
    receipt.decision = 'ACCEPTED';
    expect(candidate.receiptEvidence?.decision).toBe('ALLOW');
    expect(Object.isFrozen(candidate)).toBe(true);
    expect(Object.isFrozen(candidate.identity)).toBe(true);
    expect(Object.isFrozen(candidate.attempt)).toBe(true);
    expect(Object.isFrozen(candidate.receiptEvidence)).toBe(true);
  });

  it('exposes no acceptance operation and imports only the hash primitive', () => {
    const source = readFileSync(path.join(process.cwd(), 'src', 'lib', 'html-artifact-acceptance-candidate.ts'), 'utf8');
    const imports = [...source.matchAll(/^import .* from '([^']+)';$/gm)].map(match => match[1]);
    expect(imports).toEqual(['node:crypto']);
    expect(source).not.toMatch(/\b(fetch|XMLHttpRequest|better-sqlite3|writeFile|appendFile|localStorage)\b/);
    const exported = [...source.matchAll(/^export (?:async )?(?:function|const) (\w+)/gm)].map(match => match[1]);
    expect(exported.filter(name => /accept(?!ance)|approve|commit|persist|save|store/i.test(name))).toEqual([]);
  });
});
