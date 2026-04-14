/**
 * W87-T1 — HIGH_RISK Guided Response Registry
 * Pre-authored safe-path alternatives for HIGH_RISK non-coder task patterns.
 * Injected into BLOCK/ESCALATE execute route responses so non-coder users
 * receive actionable guidance instead of a bare rejection.
 *
 * Authorization: CVF_GC018_W87_T1_HIGH_RISK_GUIDED_RESPONSE_AUTHORIZATION_2026-04-14.md
 * Rules:
 *   - Guided responses are pre-authored text — no live AI inference on blocked paths.
 *   - No pattern here weakens or bypasses governance decisions.
 *   - NORMAL task patterns must NOT appear in this registry.
 */

export interface GuidedResponseEntry {
    patternId: string;
    detector: RegExp;
    guidedResponse: string;
}

export const HIGH_RISK_GUIDED_PATTERNS: GuidedResponseEntry[] = [
    {
        patternId: 'NC_003_PASSWORD_STORAGE',
        detector: /\b(?:stor(?:e|ing)|sav(?:e|ing)|hash(?:ing)?|bcrypt|database|db)\b.{0,100}\b(?:password|passphrase|credential)s?\b|\b(?:password|passphrase|credential)s?\b.{0,100}\b(?:stor(?:e|ing)|sav(?:e|ing)|hash(?:ing)?|bcrypt|database|db|field|column|plaintext|plain[\s-]text)\b/i,
        guidedResponse:
            'Storing passwords securely is a critical security concern. ' +
            'Safe approach: (1) Never store plaintext passwords. ' +
            '(2) Use a strong hashing library — bcrypt (cost factor ≥12) or Argon2id are recommended. ' +
            '(3) Store only the hash in your database, never the original password. ' +
            '(4) Keep any secret keys or salts in environment variables (e.g. a .env file), not in source code. ' +
            'Example pattern: import bcrypt from "bcryptjs"; const hash = await bcrypt.hash(password, 12); ' +
            'For further guidance, consult OWASP Password Storage Cheat Sheet.',
    },
    {
        patternId: 'NC_006_CODE_ATTRIBUTION',
        detector: /\b(stack.?overflow|stackoverflow|copy.{0,20}code|paste.{0,20}code|copy.{0,20}paste|snippet.{0,40}(use|reuse|include)|use.{0,40}snippet|from.{0,40}(SO|stack.?overflow))\b/i,
        guidedResponse:
            'Using code from external sources requires proper attribution and license compliance. ' +
            'Safe approach: (1) Check the license of the source — Stack Overflow content is under CC BY-SA 4.0, which requires attribution. ' +
            '(2) Add a comment in your code citing the source URL and author (e.g. // Source: https://stackoverflow.com/a/12345 by AuthorName). ' +
            '(3) If the snippet is substantial, consider whether the license is compatible with your project. ' +
            '(4) For production code, prefer writing your own implementation inspired by the concept rather than copy-pasting verbatim. ' +
            'Attribution template: // Adapted from: [URL] (License: CC BY-SA 4.0, Author: [name])',
    },
    {
        patternId: 'NC_007_API_KEY_FRONTEND',
        detector: /\b(api.?key|apikey|secret.?key|access.?token|auth.?token).{0,120}\b(frontend|client.?side|react|vue|angular|browser|javascript|html|component)\b|\b(frontend|client.?side|browser|react).{0,120}\b(api.?key|apikey|secret.?key|access.?token)\b/i,
        guidedResponse:
            'Placing API keys or secret tokens in frontend/client-side code is a critical security risk — they are visible to anyone who views the page source. ' +
            'Safe approach: (1) Store API keys exclusively in server-side environment variables (e.g. a .env file on your backend, never committed to git). ' +
            '(2) Create a thin server-side proxy endpoint (e.g. /api/data) that makes the API call server-side and returns only the data your frontend needs. ' +
            '(3) Your frontend calls your own proxy endpoint, never the third-party API directly. ' +
            '(4) Add .env to your .gitignore. ' +
            'Pattern: Frontend → POST /api/proxy → Server reads process.env.API_KEY → calls 3rd-party API → returns data to frontend. ' +
            'For guidance on secrets management, see: 12factor.net/config',
    },
];

/**
 * Look up a guided response for the given content.
 * Returns the first matching guided response string, or undefined if no pattern matches.
 * Called only when enforcement status is BLOCK or NEEDS_APPROVAL.
 */
export function lookupGuidedResponse(content: string): string | undefined {
    for (const entry of HIGH_RISK_GUIDED_PATTERNS) {
        if (entry.detector.test(content)) {
            return entry.guidedResponse;
        }
    }
    return undefined;
}
