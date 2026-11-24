// Text Encoding Exception: Vietnamese user-facing refusal copy requires UTF-8.
import { describe, expect, it } from 'vitest';
import { readWordLimitRefusal, wordLimitRefusalMessage } from './output-validation-refusal';

describe('word-limit refusal reason', () => {
  const refusal = { issues: ['WORD_LIMIT_EXCEEDED'], wordLimit: { observed: 114, limit: 99, countingMethod: 'visible_whitespace_units_v1' } };

  it('reads the measured count and limit of a real over-limit refusal', () => {
    expect(readWordLimitRefusal(refusal)).toEqual({ observed: 114, limit: 99 });
  });

  it.each([
    ['no validation', undefined],
    ['not an object', 'WORD_LIMIT_EXCEEDED'],
    ['issue missing', { ...refusal, issues: ['TOO_SHORT'] }],
    ['accepted count within the limit', { ...refusal, wordLimit: { observed: 99, limit: 99 } }],
    ['no wordLimit', { issues: ['WORD_LIMIT_EXCEEDED'] }],
    ['non-integer count', { ...refusal, wordLimit: { observed: 114.5, limit: 99 } }],
    ['zero limit', { ...refusal, wordLimit: { observed: 114, limit: 0 } }],
    ['string numbers', { ...refusal, wordLimit: { observed: '114', limit: '99' } }],
  ])('does not invent a refusal reason for %s', (_label, value) => {
    expect(readWordLimitRefusal(value)).toBeNull();
  });

  it('states the count, the limit, that the result is withheld and the next step in both languages', () => {
    const en = wordLimitRefusalMessage({ observed: 114, limit: 99 }, false);
    expect(en).toContain('114 words'); expect(en).toContain('99-word limit');
    expect(en).toContain('does not show this result'); expect(en).toContain('does not retry automatically');
    const vi = wordLimitRefusalMessage({ observed: 114, limit: 99 }, true);
    expect(vi).toContain('114 từ'); expect(vi).toContain('giới hạn 99 từ');
    expect(vi).toContain('không hiển thị kết quả này'); expect(vi).toContain('không tự chạy lại');
  });
});
