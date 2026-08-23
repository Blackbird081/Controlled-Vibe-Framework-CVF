import { describe, expect, it } from 'vitest';

// Text Encoding Exception: explicit Unicode protocol cases verify scalar and UTF-8 behavior.

import {
  MAX_PROJECTION_BYTES,
  buildModelEvidenceProjection,
  hasOnlyUnicodeScalars,
  parseAndAdmitPublicIndex,
  serializeExactJson,
  utf8ByteLength,
  validateQueryRequest,
} from './query-conformance';
import type { LpciIndexRecord } from './types';

const record = (overrides: Partial<LpciIndexRecord> = {}): LpciIndexRecord => ({
  normalizedPath: 'public/doc.pdf', sourceHash: 'private-hash', documentType: 'policy',
  status: 'effective', answerClass: 'DIRECT_CITED_ANSWER', rawDisposition: 'ACCEPT',
  dispositionAlias: 'ACCEPT', sensitivityLevel: 'public', effectiveDate: '2026-01-02',
  authorityLevel: 'policy', contentSnippet: 'Public evidence.', titleSnippet: 'Public evidence',
  ...overrides,
});

describe('LPCI query conformance helper', () => {
  it('validates and normalizes the request while making clearance inert', () => {
    const result = validateQueryRequest({
      query: '  policy  ', corpusId: 'CORPUS_1',
      filters: { status: ['effective'], jurisdiction: ' Vietnam ', sensitivityClearance: true },
    });
    expect(result).toEqual({
      ok: true,
      value: {
        query: 'policy', corpusId: 'CORPUS_1',
        effectiveServerFilters: { status: ['effective'], jurisdiction: 'Vietnam', sensitivityClearance: false },
      },
    });
  });

  it.each([
    null, [], {}, { query: '', corpusId: 'x' }, { query: 'x', corpusId: '../x' },
    { query: 7, corpusId: 'x' }, { query: 'x'.repeat(4097), corpusId: 'x' },
    { query: 'x', corpusId: '' }, { query: 'x', corpusId: 'x'.repeat(129) },
    { query: 'x', corpusId: 'x', filters: [] },
    { query: 'x', corpusId: 'x', filters: { unknown: true } },
    { query: 'x', corpusId: 'x', filters: { status: ['effective', 'effective'] } },
    { query: 'x', corpusId: 'x', filters: { status: ['not-a-status'] } },
    { query: 'x', corpusId: 'x', filters: { jurisdiction: 7 } },
    { query: 'x', corpusId: 'x', filters: { documentType: 'x'.repeat(257) } },
    { query: 'x', corpusId: 'x', filters: { authorityLevel: ' ' } },
    { query: 'x', corpusId: 'x', filters: { sensitivityClearance: 'true' } },
  ])('rejects invalid request shapes %#', (input) => {
    expect(validateQueryRequest(input).ok).toBe(false);
  });

  it('rejects unpaired surrogates before trimming or byte counting', () => {
    expect(hasOnlyUnicodeScalars('\ud800')).toBe(false);
    expect(validateQueryRequest({ query: ` ok\ud800 `, corpusId: 'x' }).ok).toBe(false);
    expect(validateQueryRequest({ query: 'ok', corpusId: 'x', filters: { jurisdiction: '\udc00' } }).ok).toBe(false);
  });

  it('admits public rows without inspecting malformed denied-row fields', () => {
    const denied = { sensitivityLevel: 'restricted', normalizedPath: 7, status: null, contentSnippet: { secret: true } };
    const result = parseAndAdmitPublicIndex(JSON.stringify([record(), denied]));
    expect(result).toMatchObject({ ok: true, filteredOut: false });
    if (result.ok) expect(result.records).toHaveLength(1);
  });

  it.each(['restricted', 'confidential', 'classified', 'unknown', undefined])(
    'filters a canonical non-public sensitivity %s',
    (sensitivityLevel) => {
      const input = { sensitivityLevel, normalizedPath: 7 };
      const result = parseAndAdmitPublicIndex(JSON.stringify([input]));
      expect(result).toEqual({ ok: true, records: [], filteredOut: true });
    },
  );

  it.each([
    'not-json', '{}', '[1]', JSON.stringify([{ sensitivityLevel: 'Public' }]),
    JSON.stringify([{ sensitivityLevel: 1 }]), JSON.stringify([record({ normalizedPath: '../secret' })]),
    JSON.stringify([record({ effectiveDate: '2026-02-30' })]),
    JSON.stringify([record({ contentSnippet: ' ' })]),
  ])('fails closed for malformed index input %#', (input) => {
    expect(parseAndAdmitPublicIndex(input).ok).toBe(false);
  });

  it('serializes the exact projection allowlist and hides source metadata', () => {
    const result = buildModelEvidenceProjection([record({ contentSnippet: '  quoted " evidence / \\ \n  ' })]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.serialized).toBe(
      '{"schemaVersion":"cvf.lpci1Web.modelEvidence.v1","records":[{"normalizedPath":"public/doc.pdf","effectiveDate":"2026-01-02","status":"effective","answerClass":"DIRECT_CITED_ANSWER","contentSnippet":"quoted \\" evidence / \\\\"}]}',
    );
    expect(result.serialized).not.toContain('private-hash');
  });

  it('uses the byte-exact control escaping policy', () => {
    const value = '"\\\b\t\n\f\r\u0000\u0001/é';
    expect(serializeExactJson(value)).toBe('"\\"\\\\\\b\\t\\n\\f\\r\\u0000\\u0001/é"');
  });

  it('rejects an unpaired surrogate in the final model projection', () => {
    expect(buildModelEvidenceProjection([record({ contentSnippet: `evidence\ud800` })])).toEqual({ ok: false });
  });

  it('enforces four records and 512 Unicode code points without truncation', () => {
    const four = Array.from({ length: 4 }, (_, index) => record({ normalizedPath: `p/${index}`, contentSnippet: '😀'.repeat(512) }));
    expect(buildModelEvidenceProjection(four).ok).toBe(true);
    expect(buildModelEvidenceProjection([...four, record({ normalizedPath: 'p/5' })]).ok).toBe(false);
    expect(buildModelEvidenceProjection([record({ contentSnippet: '😀'.repeat(513) })]).ok).toBe(false);
  });

  it('accepts exactly 16384 bytes and rejects 16385 bytes', () => {
    const snippet = `A${'\u0000'.repeat(511)}`;
    const records = Array.from({ length: 4 }, (_, index) => record({
      normalizedPath: `p/${index}/${'x'.repeat(900)}`,
      contentSnippet: snippet,
    }));
    let exact: LpciIndexRecord[] | undefined;
    for (let length = 1; length <= 1020; length += 1) {
      const candidate = records.map((item, index) => index === 3
        ? { ...item, normalizedPath: `p/3/${'y'.repeat(length)}` }
        : item);
      const projection = buildModelEvidenceProjection(candidate);
      if (projection.ok && projection.utf8Bytes === MAX_PROJECTION_BYTES) {
        exact = candidate;
        break;
      }
    }
    expect(exact).toBeDefined();
    const atLimit = buildModelEvidenceProjection(exact!);
    expect(atLimit).toMatchObject({ ok: true, utf8Bytes: MAX_PROJECTION_BYTES });
    const over = exact!.map((item, index) => index === 3
      ? { ...item, normalizedPath: `${item.normalizedPath}z` }
      : item);
    expect(utf8ByteLength(serializeExactJson({
      schemaVersion: 'cvf.lpci1Web.modelEvidence.v1',
      records: over.map((item) => ({
        normalizedPath: item.normalizedPath, effectiveDate: item.effectiveDate!, status: item.status,
        answerClass: item.answerClass, contentSnippet: item.contentSnippet!,
      })),
    }))).toBe(MAX_PROJECTION_BYTES + 1);
    expect(buildModelEvidenceProjection(over).ok).toBe(false);
  });
});
