/**
 * W87-T1 — HIGH_RISK Guided Response Registry
 * W90-T1 — Pattern Expansion (NC_001/NC_002/NC_004/NC_005/NC_008 added)
 * Pre-authored safe-path alternatives for HIGH_RISK non-coder task patterns.
 * Injected into BLOCK/ESCALATE execute route responses so non-coder users
 * receive actionable guidance instead of a bare rejection.
 *
 * Authorization: CVF_GC018_W87_T1_HIGH_RISK_GUIDED_RESPONSE_AUTHORIZATION_2026-04-14.md
 *               CVF_GC018_W90_T1_HIGH_RISK_PATTERN_EXPANSION_AUTHORIZATION_2026-04-14.md
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
    // ── W90-T1: NC_001 — SQL Injection ──────────────────────────────────────────
    {
        patternId: 'NC_001_SQL_INJECTION',
        detector: /\b(?:sql|query|select|insert|update|delete|where)\b.{0,150}\b(?:user.?input|concat(?:enat)?|string.?build|dynamic|variable)\b|\b(?:string.?concat|dynamic.?(?:sql|query)|sql.?inject)\b/i,
        guidedResponse:
            'Building SQL queries by concatenating user input creates SQL injection vulnerabilities — ' +
            'attackers can manipulate your query to read, modify, or delete all database data. ' +
            'Safe approach: (1) Always use parameterized queries or prepared statements — never string concatenation or template literals with user data. ' +
            '(2) Node.js/pg example: db.query(\'SELECT * FROM users WHERE email = $1\', [userEmail]) — the $1 placeholder escapes input automatically. ' +
            '(3) Use an ORM (Prisma, TypeORM, Sequelize) that parameterizes queries by default. ' +
            '(4) Validate and sanitize all inputs at the API boundary using a schema library (Zod, Joi). ' +
            '(5) Apply the principle of least privilege — database users should only have the permissions they need. ' +
            'See: OWASP SQL Injection Prevention Cheat Sheet.',
    },
    // ── W90-T1: NC_002 — XSS / Unvalidated Input ────────────────────────────────
    {
        patternId: 'NC_002_XSS_OR_UNVALIDATED_INPUT',
        detector: /\b(?:inner\.?html|document\.write|dangerously.?set.?inner.?html|v-html|render|display|output|show)\b.{0,120}\b(?:user.?input|user.?data|form.?input|request\.body|req\.body|req\.query|request\.query|user.?supplied|untrusted)\b|\b(?:user.?input|user.?data|unvalidated|unsanitized)\b.{0,120}\b(?:html|dom|render|display|page|inner.?html|browser)\b/i,
        guidedResponse:
            'Rendering user-supplied input directly into HTML creates Cross-Site Scripting (XSS) vulnerabilities — ' +
            'attackers can inject malicious scripts that run in other users\' browsers and steal sessions or data. ' +
            'Safe approach: (1) Never use innerHTML, document.write(), or dangerouslySetInnerHTML with unescaped user input. ' +
            '(2) Use textContent or innerText instead of innerHTML when inserting plain text. ' +
            '(3) If HTML rendering is required, sanitize first: import DOMPurify from \'dompurify\'; el.innerHTML = DOMPurify.sanitize(userHtml). ' +
            '(4) On the backend, validate all inputs with a schema library (Zod, Joi, Yup) before processing or storing. ' +
            '(5) Apply output encoding appropriate to the context — HTML-encode when inserting into HTML, URL-encode in URLs. ' +
            'See: OWASP XSS Prevention Cheat Sheet.',
    },
    // ── W90-T1: NC_004 — Insecure Auth ──────────────────────────────────────────
    {
        patternId: 'NC_004_INSECURE_AUTH',
        detector: /\b(?:no.?rate.?limit|without.?rate|no.?throttl|no.?lockout|without.{0,20}lock.?out|no.?brute.?force|no.?captcha)\b.{0,200}\b(?:login|auth|sign.?in|password)\b|\b(?:login|auth(?:entication)?|sign.?in)\b.{0,200}\b(?:no.?rate.?limit|no.?lockout|without.{0,20}lock.?out|no.?throttl|unlimited.?attempt|brute.?force|without.{0,20}(?:rate|lockout|throttl))\b|\b(?:md5|sha1|sha-1)\b.{0,80}\b(?:password|passwd|hash)\b|\b(?:password|passwd)\b.{0,80}\b(?:md5|sha1|sha-1)\b/i,
        guidedResponse:
            'Authentication without rate limiting, account lockouts, or secure password hashing is vulnerable to brute-force and credential stuffing attacks. ' +
            'Safe approach: (1) Always implement rate limiting on login endpoints — e.g. 5 failed attempts triggers a 15-minute lockout. ' +
            '(2) Never hash passwords with MD5 or SHA-1 — they are cryptographically broken for this use; use bcrypt (cost ≥12) or Argon2id. ' +
            '(3) Use secure, HttpOnly, SameSite=Strict cookies for session tokens — never localStorage or sessionStorage for sensitive tokens. ' +
            '(4) Alert users of repeated failed login attempts and allow them to terminate active sessions. ' +
            '(5) Use a battle-tested auth library (NextAuth.js, Passport.js, Auth0) rather than rolling your own. ' +
            'See: OWASP Authentication Cheat Sheet.',
    },
    // ── W90-T1: NC_005 — PII Logging ────────────────────────────────────────────
    {
        patternId: 'NC_005_PII_LOGGING',
        detector: /\b(?:console\.log|logger?|logging|log\.info|log\.debug|log\.error|print|winston|pino)\b.{0,150}\b(?:password|passwd|credential|ssn|social.?security|credit.?card|card.?number|cvv|bank.?account|pii|personal.?data|private.?data|sensitive|email|phone|address|req\.body|request\.body)\b|\b(?:password|credential|sensitive|pii|personal.?data)\b.{0,150}\b(?:log|logging|logged|record|audit|stored.?in.?log)\b|\b(?:log)\b.{0,30}\b(?:user.{0,20}(?:personal|private|sensitive|pii)|personal.{0,20}data|sensitive.{0,20}data)\b/i,
        guidedResponse:
            'Logging passwords, credentials, or personally identifiable information (PII) creates data-breach and compliance risks — ' +
            'log files are often stored insecurely and accessible to more people than intended. ' +
            'Safe approach: (1) Never log passwords, session tokens, credit card numbers, SSNs, or full email addresses. ' +
            '(2) Mask or redact PII in logs — log only partial data (e.g. first 3 chars of email, last 4 digits of phone). ' +
            '(3) Use a logging library that supports field-level redaction: pino example: pino({ redact: [\'req.body.password\', \'req.body.email\'] }). ' +
            '(4) Audit all log statements before deploying — check that req.body and user objects are filtered, not logged raw. ' +
            '(5) Apply data-retention policies to logs and restrict log access to authorized personnel only. ' +
            'See: OWASP Logging Cheat Sheet.',
    },
    // ── W87-T1: NC_003 — Password Storage ───────────────────────────────────────
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
    // ── W90-T1: NC_008 — Hardcoded Secrets ──────────────────────────────────────
    {
        patternId: 'NC_008_HARDCODED_SECRETS',
        detector: /\b(?:hardcode|hard.?code|embed|put|write|include|store)\b.{0,120}\b(?:secret|api.?key|password|passwd|credential|token|private.?key|access.?key)\b.{0,120}\b(?:code|source|file|script|config|class|function|const|let|var)\b|\b(?:commit|check.?in|push.{0,30}git|git.{0,30}push)\b.{0,120}\b(?:secret|api.?key|password|credential|token|\.env)\b|\b(?:secret|password|credential)\b.{0,80}\b(?:in.{0,20}source.?code|in.{0,20}repository|in.{0,20}git|directly.{0,20}in)\b/i,
        guidedResponse:
            'Hardcoding secrets, API keys, passwords, or credentials in source code or committing them to a git repository ' +
            'exposes them permanently — git history is very difficult to fully clean and may already be public. ' +
            'Safe approach: (1) Store all secrets in environment variables, loaded at runtime from a .env file that is never committed. ' +
            '(2) Add .env, .env.local, and any secrets files to .gitignore immediately. ' +
            '(3) If a secret was ever committed to git, treat it as compromised: rotate it immediately and audit access logs. ' +
            '(4) Use a secrets manager for production environments (HashiCorp Vault, AWS Secrets Manager, Doppler, Infisical). ' +
            '(5) Add a pre-commit hook to prevent accidental commits: npm install --save-dev detect-secrets or git-secrets. ' +
            'Example .env pattern: DATABASE_URL=postgres://... then in code: process.env.DATABASE_URL. ' +
            'See: OWASP Secrets Management Cheat Sheet.',
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
