// Text Encoding Exception: Vietnamese fixture bytes verify exact UTF-8 and line-ending identity.
import { describe, expect, it } from 'vitest';
import { makeSnapshot, parseDraftInput, requestIdentity, validateSnapshot, type DraftInput } from './html-draft-recovery-contract';

const input: DraftInput = {
  versionId: '123e4567-e89b-42d3-a456-426614174000', sourceRecordId: 'evt_1',
  request: { title: 'One', sourcePath: 'a', sourceContent: 'a\r\nb', memoryClass: 'FULL_RECORD', status: 'DRAFT', claimBoundary: 'unaccepted', receiptAnchor: 'x' },
  html: '<p>Tiếng Việt\r\n</p>', filename: 'one.html', generatedAt: '2026-10-18T00:00:00.000Z', buildNumber: 1,
};
const owner = { userId: 'u1', orgId: 'o1', teamId: 't1' };
describe('draft contract', () => {
  it('keeps exact bytes and fixed request key order', () => {
    const parsed = parseDraftInput(input)!;
    const snapshot = makeSnapshot(parsed, owner, Date.parse('2026-10-18T00:01:00.000Z'));
    expect(snapshot.html).toBe(input.html);
    expect(snapshot.requestSha256).toHaveLength(64);
    expect(requestIdentity(input.request)).toContain('a\\r\\nb');
    expect(validateSnapshot(snapshot, owner, Date.parse('2026-10-18T00:02:00.000Z'))).toEqual(snapshot);
    expect(validateSnapshot({ ...snapshot, html: snapshot.html.replace('\r\n', '\n') }, owner, Date.now())).toBeNull();
  });
  it('refuses unknown fields, invalid unicode and secret-like text in every submitted string', () => {
    expect(parseDraftInput({ ...input, owner })).toBeNull();
    expect(parseDraftInput({ ...input, request: { ...input.request, extra: 'x' } })).toBeNull();
    expect(parseDraftInput({ ...input, html: '\ud800' })).toBeNull();
    expect(parseDraftInput({ ...input, filename: 'Bearer abcdefghijklmnop' })).toBeNull();
    expect(parseDraftInput({ ...input, request: { ...input.request, sourceContent: 'OPENAI_API_KEY=abc' } })).toBeNull();
  });
});
