import { Blob as NodeBlob } from 'node:buffer';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  computeHtmlBytesIdentity,
  createHtmlArtifactCandidate,
  type HtmlArtifactCandidate,
} from './html-artifact-acceptance-candidate';
import { adoptHtmlBytes, createHtmlByteHandoff, verifyHtmlByteHandoff } from './html-artifact-byte-handoff';

// Test source stays ASCII: non-ASCII fixtures are written as escapes.
// Expected digests below were computed independently with Python hashlib, and bytes are produced
// by the hand-written encoder in this file, so no expected value comes from the code under test.
const VI_TEXT = 'Ti\u00eau \u0111\u1ec1 \u2014 \u65e5\u672c\u8a9e \u{1F680}';
const VI_SHA256 = '972143231c80a7d6f04d5bdd544e5971e00bc8849b6876e7f3786c49a5a19a51';
const NFC = 'Ti\u00eau';
const NFC_SHA256 = 'eabedf6ee233e905c3ddadab2d082fe5d6d4d426cbf34b954d20cd15e8047d1d';
const NFD = 'Tie\u0302u';
const NFD_SHA256 = 'ea1d4d8d7dc4ec47fc6776820918cf91cf1c4cf7884241e43c3088f6eb6c992f';
const CRLF = 'a\r\nb';
const CRLF_SHA256 = '18745f36a05e29072709042d6062ce54f1b08ff36c27ba80c39f81fb010c8ce2';
const LF = 'a\nb';
const LF_SHA256 = '7e18f737311b2dc3b2f269dd78396b0351f14fb66efa879f768cb23181883c78';
const BOM_TEXT = '\ufeffa';
const BOM_SHA256 = '1951c7860e968e742658b3af34e60741eb4aaf2a8d2ecc3993727016b12e81e8';
const CAFE_ACUTE = 'caf\u00e9';
const CAFE_ACUTE_SHA256 = '850f7dc43910ff890f8879c0ed26fe697c93a067ad93a7d50f466a7028a9bf4e';
const CAFE_AB = 'cafab';
const CAFE_AB_SHA256 = '196a3b33b94a4520b787250ea4a118e7bd4230cbb501b02f8cef0a816546f309';
const HTML_A = '<!doctype html><title>Title A</title><p>x</p>';
const HTML_A_SHA256 = 'b3f7af479c7d38d41c6ba9672e097878f15a8bbb161243d1795aa9ff88128eab';
const HTML_B = '<!doctype html><title>Title B</title><p>x</p>';
const HTML_B_SHA256 = 'ae0846975e61ea2020eb4867e44426b363a05ddb10528fbd5b8588041e91074e';

/** Independent UTF-8 oracle: code point by code point, no TextEncoder or Buffer. */
function oracleUtf8(text: string): Uint8Array {
  const out: number[] = [];
  for (const symbol of text) {
    const cp = symbol.codePointAt(0) as number;
    if (cp < 0x80) out.push(cp);
    else if (cp < 0x800) out.push(0xc0 | (cp >> 6), 0x80 | (cp & 0x3f));
    else if (cp < 0x10000) out.push(0xe0 | (cp >> 12), 0x80 | ((cp >> 6) & 0x3f), 0x80 | (cp & 0x3f));
    else out.push(0xf0 | (cp >> 18), 0x80 | ((cp >> 12) & 0x3f), 0x80 | ((cp >> 6) & 0x3f), 0x80 | (cp & 0x3f));
  }
  return Uint8Array.from(out);
}

const hex = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const ATTEMPT = { attemptId: 'attempt-synthetic-1', buildNumber: 1 };

describe('html-artifact-byte-handoff (B2b synthetic byte boundary)', () => {
  it('owns UTF-8 bytes that match an independent oracle, independent vectors and the B2a identity', () => {
    const cases: Array<[string, string, number]> = [
      [VI_TEXT, VI_SHA256, 30],
      [NFC, NFC_SHA256, 5],
      [NFD, NFD_SHA256, 6],
      [CRLF, CRLF_SHA256, 4],
      [LF, LF_SHA256, 3],
      [BOM_TEXT, BOM_SHA256, 4],
      [CAFE_ACUTE, CAFE_ACUTE_SHA256, 5],
      [HTML_A, HTML_A_SHA256, 45],
    ];
    for (const [text, sha, length] of cases) {
      const handoff = createHtmlByteHandoff(text);
      expect(handoff.copyBytes()).toEqual(oracleUtf8(text));
      expect(handoff.identity.htmlSha256).toBe(sha);
      expect(handoff.identity.byteLength).toBe(length);
      expect(handoff.identity.algorithm).toBe('sha256-utf8-html-bytes/v1');
      expect(handoff.identity).toEqual(computeHtmlBytesIdentity(text));
      expect(hex(oracleUtf8(text))).toBe(sha);
      expect(verifyHtmlByteHandoff(handoff, oracleUtf8(text))).toEqual({ ok: true });
    }
  });

  it('keeps newline, BOM, normalization and same-byte-length differences visible in the identity', () => {
    const shas = [CRLF_SHA256, LF_SHA256, BOM_SHA256, NFC_SHA256, NFD_SHA256, CAFE_ACUTE_SHA256, CAFE_AB_SHA256];
    expect(new Set(shas).size).toBe(shas.length);
    expect(createHtmlByteHandoff(CRLF).identity.htmlSha256).not.toBe(createHtmlByteHandoff(LF).identity.htmlSha256);
    expect(createHtmlByteHandoff(BOM_TEXT).identity.byteLength).toBe(createHtmlByteHandoff('a').identity.byteLength + 3);
    expect(createHtmlByteHandoff(NFC).identity.htmlSha256).not.toBe(createHtmlByteHandoff(NFD).identity.htmlSha256);
    // "caf\u00e9" and "cafab" have different characters but the same UTF-8 byte length.
    const acute = createHtmlByteHandoff(CAFE_ACUTE);
    const ab = createHtmlByteHandoff(CAFE_AB);
    expect(acute.identity.byteLength).toBe(ab.identity.byteLength);
    expect(acute.identity.htmlSha256).toBe(CAFE_ACUTE_SHA256);
    expect(ab.identity.htmlSha256).toBe(CAFE_AB_SHA256);
    expect(verifyHtmlByteHandoff(acute, ab.copyBytes())).toEqual({ ok: false, reason: 'HASH_MISMATCH' });
  });

  it('rejects a same-length title mutation of the handed-off bytes', () => {
    const handoff = createHtmlByteHandoff(HTML_A);
    const other = createHtmlByteHandoff(HTML_B);
    expect(other.identity.byteLength).toBe(handoff.identity.byteLength);
    expect(other.identity.htmlSha256).toBe(HTML_B_SHA256);
    expect(verifyHtmlByteHandoff(handoff, other.copyBytes())).toEqual({ ok: false, reason: 'HASH_MISMATCH' });
    expect(verifyHtmlByteHandoff(handoff, oracleUtf8(HTML_B))).toEqual({ ok: false, reason: 'HASH_MISMATCH' });
  });

  it('rejects one flipped byte at every position and any length change', () => {
    const handoff = createHtmlByteHandoff(VI_TEXT);
    const original = oracleUtf8(VI_TEXT);
    for (let index = 0; index < original.length; index += 1) {
      const flipped = new Uint8Array(original);
      flipped[index] ^= 0x01;
      expect(verifyHtmlByteHandoff(handoff, flipped), `byte ${index}`).toEqual({ ok: false, reason: 'HASH_MISMATCH' });
    }
    expect(verifyHtmlByteHandoff(handoff, original.slice(0, -1))).toEqual({ ok: false, reason: 'LENGTH_MISMATCH' });
    expect(verifyHtmlByteHandoff(handoff, Uint8Array.from([...original, 0x0a]))).toEqual({ ok: false, reason: 'LENGTH_MISMATCH' });
  });

  it('verifies the bytes it is given, never a string or a retained hash', () => {
    const handoff = createHtmlByteHandoff(HTML_A);
    expect(verifyHtmlByteHandoff(handoff, HTML_A as unknown as Uint8Array)).toEqual({ ok: false, reason: 'NOT_BYTES' });
    expect(verifyHtmlByteHandoff(handoff, [1, 2, 3] as unknown as Uint8Array)).toEqual({ ok: false, reason: 'NOT_BYTES' });
    // A handoff that declares HTML_A's identity must fail on HTML_B bytes even though B is well-formed.
    const forgedToBIdentity = { ...handoff, identity: createHtmlByteHandoff(HTML_B).identity };
    expect(verifyHtmlByteHandoff(forgedToBIdentity, oracleUtf8(HTML_A))).toEqual({ ok: false, reason: 'HASH_MISMATCH' });
    expect(verifyHtmlByteHandoff({ ...handoff, schema: 'other' } as never, oracleUtf8(HTML_A))).toEqual({ ok: false, reason: 'MALFORMED_HANDOFF' });
    expect(verifyHtmlByteHandoff({ ...handoff, identity: { ...handoff.identity, htmlSha256: 'ABC' } }, oracleUtf8(HTML_A)))
      .toEqual({ ok: false, reason: 'MALFORMED_HANDOFF' });
  });

  it('accepts Uint8Array values from any realm, including Buffer and TextEncoder output, but not other types', () => {
    const handoff = createHtmlByteHandoff(VI_TEXT);
    expect(verifyHtmlByteHandoff(handoff, Buffer.from(VI_TEXT, 'utf8'))).toEqual({ ok: true });
    expect(verifyHtmlByteHandoff(handoff, new TextEncoder().encode(VI_TEXT))).toEqual({ ok: true });
    expect(adoptHtmlBytes(Buffer.from(VI_TEXT, 'utf8')).identity.htmlSha256).toBe(VI_SHA256);
    expect(adoptHtmlBytes(new TextEncoder().encode(VI_TEXT)).identity.htmlSha256).toBe(VI_SHA256);
    const wide = new Uint16Array(oracleUtf8(VI_TEXT));
    expect(verifyHtmlByteHandoff(handoff, wide as unknown as Uint8Array)).toEqual({ ok: false, reason: 'NOT_BYTES' });
    expect(verifyHtmlByteHandoff(handoff, new DataView(new ArrayBuffer(30)) as unknown as Uint8Array)).toEqual({ ok: false, reason: 'NOT_BYTES' });
    const disguised = new DataView(new ArrayBuffer(30));
    Object.defineProperty(disguised, Symbol.toStringTag, { value: 'Uint8Array' });
    Object.defineProperty(disguised, 'length', { value: 30 });
    expect(Object.prototype.toString.call(disguised)).toBe('[object Uint8Array]');
    expect(verifyHtmlByteHandoff(handoff, disguised as unknown as Uint8Array)).toEqual({ ok: false, reason: 'NOT_BYTES' });
    expect(() => adoptHtmlBytes(disguised as unknown as Uint8Array)).toThrow(TypeError);
    expect(verifyHtmlByteHandoff(handoff, oracleUtf8(VI_TEXT).buffer as unknown as Uint8Array)).toEqual({ ok: false, reason: 'NOT_BYTES' });
    expect(() => adoptHtmlBytes(wide as unknown as Uint8Array)).toThrow(TypeError);
  });

  it('never exposes owned bytes by reference and copies on every read', () => {
    const handoff = createHtmlByteHandoff(HTML_A);
    const first = handoff.copyBytes();
    const second = handoff.copyBytes();
    expect(first).not.toBe(second);
    expect(first.buffer).not.toBe(second.buffer);
    first.fill(0);
    expect(verifyHtmlByteHandoff(handoff, first)).toEqual({ ok: false, reason: 'HASH_MISMATCH' });
    expect(handoff.copyBytes()).toEqual(oracleUtf8(HTML_A));
    expect(verifyHtmlByteHandoff(handoff, handoff.copyBytes())).toEqual({ ok: true });
    expect(Object.values(handoff).filter(value => value instanceof Uint8Array || value instanceof ArrayBuffer)).toEqual([]);
    expect(Object.isFrozen(handoff)).toBe(true);
    expect(Object.isFrozen(handoff.identity)).toBe(true);
  });

  it('copies adopted bytes so later caller mutation, views and aliases cannot change the handoff', () => {
    const source = oracleUtf8(HTML_A);
    const handoff = adoptHtmlBytes(source);
    source.fill(0x7a);
    expect(handoff.copyBytes()).toEqual(oracleUtf8(HTML_A));
    expect(verifyHtmlByteHandoff(handoff, handoff.copyBytes())).toEqual({ ok: true });

    // Only the view region is taken from a larger buffer.
    const backing = new Uint8Array([0xff, 0xff, ...oracleUtf8(HTML_A), 0xff]);
    const view = backing.subarray(2, 2 + oracleUtf8(HTML_A).length);
    const fromView = adoptHtmlBytes(view);
    backing.fill(0);
    expect(fromView.identity.htmlSha256).toBe(HTML_A_SHA256);
    expect(fromView.identity.byteLength).toBe(45);
    expect(fromView.copyBytes().buffer.byteLength).toBe(45);
  });

  it('adopts only well-formed, non-empty UTF-8 and keeps a leading BOM as data', () => {
    expect(adoptHtmlBytes(Uint8Array.from([0xef, 0xbb, 0xbf, 0x61])).identity.htmlSha256).toBe(BOM_SHA256);
    const bad: Record<string, number[]> = {
      lone0xff: [0x61, 0xff],
      overlongNul: [0xc0, 0x80],
      truncatedTwoByte: [0x61, 0xc3],
      encodedSurrogate: [0xed, 0xa0, 0x80],
      lone0x80: [0x80],
    };
    for (const [name, bytes] of Object.entries(bad)) {
      expect(() => adoptHtmlBytes(Uint8Array.from(bytes)), name).toThrow(/UTF-8/);
    }
    expect(() => adoptHtmlBytes(new Uint8Array(0))).toThrow(/empty/);
    expect(() => adoptHtmlBytes('abc' as unknown as Uint8Array)).toThrow(TypeError);
  });

  it('rejects malformed Unicode instead of substituting a replacement character', () => {
    expect(() => createHtmlByteHandoff('abc\uD800')).toThrow(/lone surrogate/);
    expect(() => createHtmlByteHandoff('\uDC00abc')).toThrow(/lone surrogate/);
    expect(() => createHtmlByteHandoff('')).toThrow(TypeError);
    expect(() => createHtmlByteHandoff(undefined as unknown as string)).toThrow(TypeError);
    // A JSON escape that decodes to a lone surrogate is rejected after parsing, not repaired.
    const parsed = JSON.parse('{"html":"a\\ud800"}') as { html: string };
    expect(() => createHtmlByteHandoff(parsed.html)).toThrow(/lone surrogate/);
    // A valid escaped pair decodes to one supplementary character with a 4-byte encoding.
    const pair = JSON.parse('{"html":"\\ud83d\\ude80"}') as { html: string };
    expect(createHtmlByteHandoff(pair.html).copyBytes()).toEqual(Uint8Array.from([0xf0, 0x9f, 0x9a, 0x80]));
  });

  it('agrees with the decoded string after a JSON roundtrip while envelope bytes are not the identity', () => {
    const html = `<!doctype html><p class="q">${VI_TEXT}</p>\r\n\t<script>if (a < b && c > "d") {}</script>\n`;
    const envelope = JSON.stringify({ success: true, data: { html, filename: 'packet.html' } });
    const decoded = (JSON.parse(envelope) as { data: { html: string } }).data.html;
    expect(decoded).toBe(html);

    const handoff = createHtmlByteHandoff(decoded);
    expect(handoff.copyBytes()).toEqual(oracleUtf8(html));
    expect(handoff.identity).toEqual(createHtmlByteHandoff(html).identity);

    const envelopeBytes = oracleUtf8(envelope);
    expect(envelopeBytes.length).toBeGreaterThan(handoff.identity.byteLength);
    expect(hex(envelopeBytes)).not.toBe(handoff.identity.htmlSha256);
    expect(verifyHtmlByteHandoff(handoff, envelopeBytes)).toEqual({ ok: false, reason: 'LENGTH_MISMATCH' });
    // Escaping alone changes the bytes: the JSON string body of the HTML is longer than the HTML.
    expect(oracleUtf8(JSON.stringify(html)).length).toBeGreaterThan(oracleUtf8(html).length);
  });

  it('agrees with the bytes of an in-memory Blob built from the string', async () => {
    for (const text of [HTML_A, VI_TEXT, CRLF, BOM_TEXT, NFD]) {
      const blob = new NodeBlob([text], { type: 'text/html;charset=utf-8' });
      expect(blob.type).toBe('text/html;charset=utf-8');
      const blobBytes = new Uint8Array(await blob.arrayBuffer());
      const handoff = createHtmlByteHandoff(text);
      expect(blobBytes).toEqual(oracleUtf8(text));
      expect(blobBytes).toEqual(handoff.copyBytes());
      expect(verifyHtmlByteHandoff(handoff, blobBytes)).toEqual({ ok: true });
      expect(adoptHtmlBytes(blobBytes).identity).toEqual(handoff.identity);
      // Text readback is not the proof: UTF-8 text decoding drops a leading BOM that the bytes keep.
      const readBack = await blob.text();
      if (text === BOM_TEXT) {
        expect(readBack).toBe('a');
        expect(oracleUtf8(readBack)).not.toEqual(blobBytes);
      } else {
        expect(readBack).toBe(text);
      }
    }
    const original = createHtmlByteHandoff(HTML_A);
    const mutated = new Uint8Array(await new NodeBlob([HTML_B]).arrayBuffer());
    expect(verifyHtmlByteHandoff(original, mutated)).toEqual({ ok: false, reason: 'HASH_MISMATCH' });
  });

  it('agrees with the bytes of the global Blob read through FileReader, as the panel download builds it', async () => {
    const readBytes = (blob: Blob) => new Promise<Uint8Array>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(blob);
    });
    for (const text of [HTML_A, VI_TEXT, CRLF, BOM_TEXT]) {
      const bytes = await readBytes(new Blob([text], { type: 'text/html;charset=utf-8' }));
      expect(bytes).toEqual(oracleUtf8(text));
      expect(verifyHtmlByteHandoff(createHtmlByteHandoff(text), bytes)).toEqual({ ok: true });
    }
  });

  it('leaves a carried B2a candidate unaccepted and bound to the same bytes', () => {
    const candidate = createHtmlArtifactCandidate({
      html: HTML_A,
      attempt: ATTEMPT,
      sourceHash: '2'.repeat(64),
      receiptEvidence: { receiptId: 'receipt-synthetic-1', decision: 'ALLOW' },
    });
    const handoff = createHtmlByteHandoff(HTML_A, { candidate });
    expect(handoff.candidate).toBe(candidate);
    expect(handoff.candidate?.state).toBe('DRAFT_UNACCEPTED');
    expect(handoff.identity).toEqual(candidate.identity);
    expect(verifyHtmlByteHandoff(handoff, oracleUtf8(HTML_A))).toEqual({ ok: true });
    expect(createHtmlByteHandoff(HTML_A).candidate).toBeNull();

    const otherCandidate = createHtmlArtifactCandidate({ html: HTML_B, attempt: ATTEMPT });
    expect(() => createHtmlByteHandoff(HTML_A, { candidate: otherCandidate })).toThrow(/identity does not match/);
    const forged = { ...candidate, state: 'ACCEPTED' } as unknown as HtmlArtifactCandidate;
    expect(() => createHtmlByteHandoff(HTML_A, { candidate: forged })).toThrow(/DRAFT_UNACCEPTED/);
    expect(verifyHtmlByteHandoff({ ...handoff, candidate: forged }, oracleUtf8(HTML_A)))
      .toEqual({ ok: false, reason: 'STATE_NOT_DRAFT_UNACCEPTED' });
    expect(verifyHtmlByteHandoff({ ...handoff, candidate: otherCandidate }, oracleUtf8(HTML_A)))
      .toEqual({ ok: false, reason: 'CANDIDATE_IDENTITY_MISMATCH' });
  });

  it('adds no identity algorithm, acceptance operation, I/O or extra import', () => {
    const source = readFileSync(path.join(process.cwd(), 'src', 'lib', 'html-artifact-byte-handoff.ts'), 'utf8');
    const imports = [...source.matchAll(/from '([^']+)';$/gm)].map(match => match[1]);
    expect(imports).toEqual(['node:crypto', './html-artifact-acceptance-candidate']);
    expect(source).not.toMatch(/\b(fetch|XMLHttpRequest|better-sqlite3|writeFile|appendFile|localStorage|createWriteStream)\b/);
    expect(source).not.toMatch(/createHash\('(?!sha256')/);
    expect(source.match(/createHash\(/g)?.length).toBe(1);
    const exported = [...source.matchAll(/^export (?:async )?(?:function|const) (\w+)/gm)].map(match => match[1]);
    expect(exported.sort()).toEqual(['HTML_BYTE_HANDOFF_SCHEMA', 'adoptHtmlBytes', 'createHtmlByteHandoff', 'verifyHtmlByteHandoff']);
    expect(exported.filter(name => /accept(?!ance)|approve|commit|persist|save|store/i.test(name))).toEqual([]);
  });
});
