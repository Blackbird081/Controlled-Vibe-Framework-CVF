/**
 * CVF Trusted Form Router
 * =======================
 * W126-T1 CP1 — Explicit intent-to-form routing for the trusted form subset.
 *
 * Hard contracts:
 *   - The trusted subset started with 8 W126-audited forms and was expanded to
 *     the 40 non-wizard form corpus in W142-W147.
 *   - Corpus data lives in trusted-form-corpus.ts; this module preserves the
 *     routing API consumed by intent-router, execute route, tests, and W149 specs.
 *   - Activation is pattern-based; ambiguity boundaries are documented per form.
 *   - Any addition to TRUSTED_FORM_MAP requires a new audit entry + commit.
 *
 * @module lib/form-routing
 */

import { TRUSTED_FORM_MAP, type TrustedFormEntry } from './trusted-form-corpus';

export { TRUSTED_FORM_MAP };
export type { TrustedFormEntry };

export interface TrustedFormMatch {
  formKey: string;
  id: string;
  label: string;
}

/**
 * Attempt to match a plain-language input to a trusted form target.
 *
 * Returns the first matching TrustedFormMatch, or null if no trusted form
 * matches. The intent router calls this before wizard routing because form
 * patterns are narrower than wizard-family keywords.
 */
export function routeToTrustedForm(userInput: string): TrustedFormMatch | null {
  for (const [key, entry] of Object.entries(TRUSTED_FORM_MAP)) {
    for (const pattern of entry.activationPatterns) {
      if (pattern.test(userInput)) {
        return { formKey: key, id: entry.id, label: entry.label };
      }
    }
  }
  return null;
}

export function isTrustedFormTemplateId(templateId: string | null | undefined): boolean {
  return typeof templateId === 'string' && templateId in TRUSTED_FORM_MAP;
}

/**
 * Returns true when the trusted form front door flag is enabled.
 * W126 uses the same INTENT_FIRST flag — form routing is part of the same surface.
 */
export function isTrustedFormRoutingEnabled(): boolean {
  return process.env.NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR === 'true';
}
