/**
 * Opt-in known-value output masking for trusted in-process callers.
 *
 * Complements the existing credential-SHAPE matcher in
 * governance-action-preflight.ts (which recognizes patterns like
 * `API_KEY=...` or `Bearer ...` without knowing any actual secret value).
 * This module instead masks caller-supplied EXACT values -- useful when a
 * trusted caller already holds concrete secret strings and wants them
 * stripped from launcher output regardless of shape.
 *
 * Design mirrors the accepted external QM secret-masking pattern (see R3 M9,
 * source pin 59cf6554faadcd06494782190c3ecae1829dd381): derive raw/URL/
 * base64/base64url variants per value, sort all variants longest-first
 * across the whole set, and substitute in one pass using escaped literal alternatives. Secret
 * content never supplies regex syntax. This is a from-scratch CVF-native implementation; no upstream
 * source is copied.
 */

export const KNOWN_VALUE_REDACTION_CONTRACT =
  'cvf.delta.knownValueRedaction.v1' as const;

/** A value shorter than this is not masked: too likely to cause false positives. */
export const MIN_MASKABLE_VALUE_LENGTH = 8;
export const MAX_KNOWN_VALUES = 32;
export const MAX_VALUE_LENGTH = 1024;
export const MAX_TOTAL_VALUE_LENGTH = 16384;

export const KNOWN_VALUE_PLACEHOLDER = '[REDACTED]';

export interface KnownValueSnapshotResult {
  ok: boolean;
  /** Present only when ok is true. Frozen; independent of caller-array mutation after this call. */
  variants?: readonly string[];
  /** Present only when ok is false. Never echoes any input value. */
  error?: { code: string; message: string };
}

/**
 * Validates and snapshots a caller-supplied known-value list into a flat,
 * deduplicated, longest-first list of literal substrings to mask.
 *
 * Called once at invocation entry, before any side effect or runner
 * execution. Never throws; a rejection returns `{ ok: false, error }`
 * without echoing any supplied value (per the launcher's constant
 * configuration-error contract).
 */
export function snapshotKnownValues(
  values: readonly string[] | undefined
): KnownValueSnapshotResult {
  if (values === undefined) {
    return { ok: true, variants: [] };
  }
  if (!Array.isArray(values)) {
    return {
      ok: false,
      error: { code: 'KNOWN_VALUES_NOT_ARRAY', message: 'knownSecretValues must be an array.' },
    };
  }
  if (values.length > MAX_KNOWN_VALUES) {
    return {
      ok: false,
      error: {
        code: 'KNOWN_VALUES_TOO_MANY',
        message: `knownSecretValues must not exceed ${MAX_KNOWN_VALUES} entries.`,
      },
    };
  }

  let totalLength = 0;
  const nonEmpty: string[] = [];
  for (const value of values) {
    if (typeof value !== 'string') {
      return {
        ok: false,
        error: { code: 'KNOWN_VALUE_NOT_STRING', message: 'Every knownSecretValues entry must be a string.' },
      };
    }
    if (value.length === 0) continue; // empty strings ignored
    if (value.length < MIN_MASKABLE_VALUE_LENGTH) {
      return {
        ok: false,
        error: {
          code: 'KNOWN_VALUE_TOO_SHORT',
          message: `Every nonempty knownSecretValues entry must be at least ${MIN_MASKABLE_VALUE_LENGTH} characters.`,
        },
      };
    }
    if (value.length > MAX_VALUE_LENGTH) {
      return {
        ok: false,
        error: {
          code: 'KNOWN_VALUE_TOO_LONG',
          message: `Every knownSecretValues entry must not exceed ${MAX_VALUE_LENGTH} UTF-16 code units.`,
        },
      };
    }
    totalLength += value.length;
    if (totalLength > MAX_TOTAL_VALUE_LENGTH) {
      return {
        ok: false,
        error: {
          code: 'KNOWN_VALUES_TOTAL_TOO_LARGE',
          message: `The combined knownSecretValues length must not exceed ${MAX_TOTAL_VALUE_LENGTH} UTF-16 code units.`,
        },
      };
    }
    nonEmpty.push(value);
  }

  const variantSet = new Set<string>();
  for (const value of nonEmpty) {
    for (const variant of deriveVariants(value)) {
      if (variant.length >= MIN_MASKABLE_VALUE_LENGTH) variantSet.add(variant);
    }
  }
  const variants = [...variantSet].sort((a, b) => b.length - a.length);
  return { ok: true, variants: Object.freeze(variants) };
}

/**
 * Derives the raw, URL-encoded, unpadded-base64 and unpadded-base64url
 * forms of a single value. Never throws: an invalid-Unicode value (e.g. a
 * lone UTF-16 surrogate) makes `encodeURIComponent` throw `URIError`, which
 * is caught here so the raw/base64 variants are still returned and only the
 * URL variant is omitted for that value.
 */
function deriveVariants(value: string): string[] {
  const variants = [value];
  try {
    const url = encodeURIComponent(value);
    if (url !== value) variants.push(url);
  } catch {
    // Invalid Unicode (e.g. an unpaired surrogate): URL variant is
    // undefined for this value: raw/base64 variants are still masked below.
  }
  const base64 = Buffer.from(value, 'utf-8').toString('base64').replace(/=+$/, '');
  if (base64.length >= MIN_MASKABLE_VALUE_LENGTH) variants.push(base64);
  const base64url = Buffer.from(value, 'utf-8').toString('base64url').replace(/=+$/, '');
  if (base64url.length >= MIN_MASKABLE_VALUE_LENGTH && base64url !== base64) {
    variants.push(base64url);
  }
  return variants;
}

/**
 * One replacement pass over the original text. The snapshot supplies
 * longest-first variants; every regex metacharacter is escaped as literal
 * data. Replacement output is never scanned again. No cross-call cache.
 */
export function maskKnownValues(text: string, variants: readonly string[]): string {
  if (!text || variants.length === 0) return text;
  const literals = variants.filter(value => value.length > 0)
    .map(value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (literals.length === 0) return text;
  return text.replace(new RegExp(literals.join('|'), 'g'), () => KNOWN_VALUE_PLACEHOLDER);
}
