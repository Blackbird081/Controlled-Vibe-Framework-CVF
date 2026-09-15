import { describe, expect, it } from 'vitest';
import {
  KNOWN_VALUE_PLACEHOLDER,
  MAX_KNOWN_VALUES,
  MAX_TOTAL_VALUE_LENGTH,
  MAX_VALUE_LENGTH,
  MIN_MASKABLE_VALUE_LENGTH,
  maskKnownValues,
  snapshotKnownValues,
} from './known-value-redaction.js';

describe('snapshotKnownValues', () => {
  it('treats a missing list as an empty, valid snapshot', () => {
    const snapshot = snapshotKnownValues(undefined);
    expect(snapshot.ok).toBe(true);
    expect(snapshot.variants).toEqual([]);
  });

  it('treats an empty list as a valid empty snapshot', () => {
    const snapshot = snapshotKnownValues([]);
    expect(snapshot.ok).toBe(true);
    expect(snapshot.variants).toEqual([]);
  });

  it('ignores empty-string entries without rejecting the list', () => {
    const snapshot = snapshotKnownValues(['', 'abcdefgh', '']);
    expect(snapshot.ok).toBe(true);
    expect(snapshot.variants).toContain('abcdefgh');
  });

  it('rejects a nonstring entry without echoing the list', () => {
    const snapshot = snapshotKnownValues(['abcdefgh', 123 as unknown as string]);
    expect(snapshot.ok).toBe(false);
    expect(snapshot.error?.code).toBe('KNOWN_VALUE_NOT_STRING');
    expect(JSON.stringify(snapshot)).not.toContain('abcdefgh');
  });

  it('rejects a non-array container', () => {
    const snapshot = snapshotKnownValues('not-an-array' as unknown as string[]);
    expect(snapshot.ok).toBe(false);
    expect(snapshot.error?.code).toBe('KNOWN_VALUES_NOT_ARRAY');
  });

  it('rejects a nonempty value shorter than the minimum length', () => {
    const snapshot = snapshotKnownValues(['short']);
    expect(snapshot.ok).toBe(false);
    expect(snapshot.error?.code).toBe('KNOWN_VALUE_TOO_SHORT');
  });

  it('rejects a value exceeding the per-entry length budget', () => {
    const snapshot = snapshotKnownValues(['a'.repeat(MAX_VALUE_LENGTH + 1)]);
    expect(snapshot.ok).toBe(false);
    expect(snapshot.error?.code).toBe('KNOWN_VALUE_TOO_LONG');
  });

  it('rejects a list exceeding the maximum entry count', () => {
    const values = Array.from({ length: MAX_KNOWN_VALUES + 1 }, (_, i) => `value-${i}-abcdefgh`);
    const snapshot = snapshotKnownValues(values);
    expect(snapshot.ok).toBe(false);
    expect(snapshot.error?.code).toBe('KNOWN_VALUES_TOO_MANY');
  });

  it('rejects a list exceeding the combined total length budget', () => {
    const values = Array.from({ length: MAX_KNOWN_VALUES }, () => 'x'.repeat(MAX_VALUE_LENGTH));
    const snapshot = snapshotKnownValues(values);
    expect(MAX_KNOWN_VALUES * MAX_VALUE_LENGTH).toBeGreaterThan(MAX_TOTAL_VALUE_LENGTH);
    expect(snapshot.ok).toBe(false);
    expect(snapshot.error?.code).toBe('KNOWN_VALUES_TOTAL_TOO_LARGE');
  });

  it('accepts exactly the minimum length and exactly the budget ceilings', () => {
    const atMin = 'a'.repeat(MIN_MASKABLE_VALUE_LENGTH);
    const snapshot = snapshotKnownValues([atMin]);
    expect(snapshot.ok).toBe(true);
    expect(snapshot.variants).toContain(atMin);
  });

  it('never mutates the caller-supplied array and snapshot is independent of later mutation', () => {
    const values = ['abcdefgh-one'];
    const snapshot = snapshotKnownValues(values);
    values.push('abcdefgh-two');
    values[0] = 'mutated';
    expect(snapshot.ok).toBe(true);
    expect(snapshot.variants).toContain('abcdefgh-one');
    expect(snapshot.variants).not.toContain('abcdefgh-two');
    expect(snapshot.variants).not.toContain('mutated');
  });

  it('returns a frozen variants array', () => {
    const snapshot = snapshotKnownValues(['abcdefgh-frozen']);
    expect(Object.isFrozen(snapshot.variants)).toBe(true);
  });

  it('derives raw, URL-encoded, base64 and base64url variants, sorted longest-first', () => {
    const snapshot = snapshotKnownValues(['secret value/with space']);
    expect(snapshot.ok).toBe(true);
    const variants = snapshot.variants!;
    expect(variants).toContain('secret value/with space');
    expect(variants).toContain(encodeURIComponent('secret value/with space'));
    expect(variants).toContain(
      Buffer.from('secret value/with space', 'utf-8').toString('base64').replace(/=+$/, '')
    );
    expect(variants).toContain(
      Buffer.from('secret value/with space', 'utf-8').toString('base64url').replace(/=+$/, '')
    );
    for (let i = 1; i < variants.length; i++) {
      expect(variants[i - 1].length).toBeGreaterThanOrEqual(variants[i].length);
    }
  });

  it('deduplicates identical variants across different input values', () => {
    const snapshot = snapshotKnownValues(['duplicate-value', 'duplicate-value']);
    expect(snapshot.ok).toBe(true);
    const occurrences = snapshot.variants!.filter((v) => v === 'duplicate-value');
    expect(occurrences).toHaveLength(1);
  });

  it('does not throw on malformed Unicode and omits only the URL variant for that value', () => {
    const lonelySurrogate = 'abcdefgh\uD800trailing';
    expect(() => snapshotKnownValues([lonelySurrogate])).not.toThrow();
    const snapshot = snapshotKnownValues([lonelySurrogate]);
    expect(snapshot.ok).toBe(true);
    expect(snapshot.variants).toContain(lonelySurrogate);
    let threwOnEncode = false;
    try {
      encodeURIComponent(lonelySurrogate);
    } catch {
      threwOnEncode = true;
    }
    expect(threwOnEncode).toBe(true);
  });
});

describe('maskKnownValues', () => {
  it('returns text unchanged when there are no variants', () => {
    expect(maskKnownValues('hello world', [])).toBe('hello world');
  });

  it('returns empty/falsy text unchanged', () => {
    expect(maskKnownValues('', ['abcdefgh'])).toBe('');
  });

  it('masks a single known value in raw form', () => {
    const result = maskKnownValues('token is abcdefgh12 here', ['abcdefgh12']);
    expect(result).toBe(`token is ${KNOWN_VALUE_PLACEHOLDER} here`);
    expect(result).not.toContain('abcdefgh12');
  });

  it('masks repeated occurrences of the same value', () => {
    const result = maskKnownValues('abcdefgh once, abcdefgh twice', ['abcdefgh']);
    expect(result.split(KNOWN_VALUE_PLACEHOLDER).length - 1).toBe(2);
    expect(result).not.toContain('abcdefgh');
  });

  it('masks overlapping/duplicate variants deterministically, longest-first', () => {
    const snapshot = snapshotKnownValues(['abcdefghijk']);
    const variants = snapshot.variants!;
    const result = maskKnownValues('value=abcdefghijk end', variants);
    expect(result).toBe(`value=${KNOWN_VALUE_PLACEHOLDER} end`);
  });

  it('does not remask an inserted placeholder (single-variant, placeholder text pre-existing in input)', () => {
    // A value crafted so the placeholder text itself could coincidentally
    // reappear in the input is masked once; the placeholder is never
    // re-scanned against a shorter later variant.
    const result = maskKnownValues('abcdefgh[REDACTED]abcdefgh', ['abcdefgh']);
    expect(result).toBe(`${KNOWN_VALUE_PLACEHOLDER}[REDACTED]${KNOWN_VALUE_PLACEHOLDER}`);
  });

  it('does not remask a placeholder INSERTED by an earlier variant match against a later, shorter variant (regression)', () => {
    // Regression for a real defect in a prior sequential split/join-per-
    // variant implementation: masking 'abcdefghijkl' with variants
    // ['abcdefghijkl', '[REDACTED'] used to produce '[REDACTED]]' because
    // the second pass re-scanned the placeholder text the FIRST pass had
    // just inserted and found '[REDACTED' as a literal prefix match inside
    // it. The single-pass-over-original-text algorithm must never do this:
    // the placeholder is only ever appended to output, never fed back in
    // as scan input, regardless of variant order or count.
    const result = maskKnownValues('abcdefghijkl', ['abcdefghijkl', '[REDACTED']);
    expect(result).toBe(KNOWN_VALUE_PLACEHOLDER);
    expect(result).not.toBe(`${KNOWN_VALUE_PLACEHOLDER}]`);
  });

  it('does not remask a placeholder when the shorter variant is sorted and tried first at that position', () => {
    // Same property from the opposite variant order: even when a shorter
    // variant that happens to match placeholder text is evaluated before a
    // longer one at the same scan position, the source text (not any
    // already-emitted placeholder) is what is being scanned.
    const result = maskKnownValues('xyz-longervalue-abc', ['REDACT', 'longervalue']);
    expect(result).toBe(`xyz-${KNOWN_VALUE_PLACEHOLDER}-abc`);
    expect(result).not.toContain('longervalue');
  });

  it('masks values containing regex metacharacters as literal text, not a pattern', () => {
    const value = 'a.b*c+d(e)f[g]h$';
    const result = maskKnownValues(`prefix ${value} suffix`, [value]);
    expect(result).toBe(`prefix ${KNOWN_VALUE_PLACEHOLDER} suffix`);
  });

  it('masks a URL-encoded occurrence via the derived URL variant', () => {
    const raw = 'secret value/with space';
    const snapshot = snapshotKnownValues([raw]);
    const encoded = encodeURIComponent(raw);
    const result = maskKnownValues(`q=${encoded}`, snapshot.variants!);
    expect(result).not.toContain(encoded);
    expect(result).toContain(KNOWN_VALUE_PLACEHOLDER);
  });

  it('masks a base64 occurrence via the derived base64 variant', () => {
    const raw = 'base64securevalue1';
    const snapshot = snapshotKnownValues([raw]);
    const b64 = Buffer.from(raw, 'utf-8').toString('base64').replace(/=+$/, '');
    const result = maskKnownValues(`payload:${b64}`, snapshot.variants!);
    expect(result).not.toContain(b64);
    expect(result).toContain(KNOWN_VALUE_PLACEHOLDER);
  });

  it('masks a base64url occurrence via the derived base64url variant', () => {
    const raw = 'jwt-shaped~secret+value/1';
    const snapshot = snapshotKnownValues([raw]);
    const b64url = Buffer.from(raw, 'utf-8').toString('base64url').replace(/=+$/, '');
    const result = maskKnownValues(`Authorization: Bearer ${b64url}`, snapshot.variants!);
    expect(result).not.toContain(b64url);
    expect(result).toContain(KNOWN_VALUE_PLACEHOLDER);
  });

  it('preserves benign control characters and unrelated text', () => {
    const text = 'line one\nline two\ttabbed\r\nvalue=abcdefgh';
    const result = maskKnownValues(text, ['abcdefgh']);
    expect(result).toContain('line one\nline two\ttabbed\r\n');
    expect(result).toContain(KNOWN_VALUE_PLACEHOLDER);
  });

  it('preserves placeholder-shaped text that is not an actual match', () => {
    const result = maskKnownValues('this looks like [REDACTED] already', ['abcdefgh']);
    expect(result).toBe('this looks like [REDACTED] already');
  });
});
