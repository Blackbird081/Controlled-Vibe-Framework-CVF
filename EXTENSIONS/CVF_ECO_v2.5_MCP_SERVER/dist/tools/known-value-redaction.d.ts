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
export declare const KNOWN_VALUE_REDACTION_CONTRACT: "cvf.delta.knownValueRedaction.v1";
/** A value shorter than this is not masked: too likely to cause false positives. */
export declare const MIN_MASKABLE_VALUE_LENGTH = 8;
export declare const MAX_KNOWN_VALUES = 32;
export declare const MAX_VALUE_LENGTH = 1024;
export declare const MAX_TOTAL_VALUE_LENGTH = 16384;
export declare const KNOWN_VALUE_PLACEHOLDER = "[REDACTED]";
export interface KnownValueSnapshotResult {
    ok: boolean;
    /** Present only when ok is true. Frozen; independent of caller-array mutation after this call. */
    variants?: readonly string[];
    /** Present only when ok is false. Never echoes any input value. */
    error?: {
        code: string;
        message: string;
    };
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
export declare function snapshotKnownValues(values: readonly string[] | undefined): KnownValueSnapshotResult;
/**
 * One replacement pass over the original text. The snapshot supplies
 * longest-first variants; every regex metacharacter is escaped as literal
 * data. Replacement output is never scanned again. No cross-call cache.
 */
export declare function maskKnownValues(text: string, variants: readonly string[]): string;
//# sourceMappingURL=known-value-redaction.d.ts.map