# AGT-027: Security & Auth Guard

Text Encoding Exception: preserves pre-existing Unicode punctuation and symbols during semantic-preserving structural normalization.

> **Version:** 1.0.0
> **Status:** Active
> **Category:** App Development — Security
> **Provenance:** claudekit-skills/better-auth + backend-security (mrgoonie/claudekit-skills)

---

## Source

- **Source:** [mrgoonie/claudekit-skills](https://github.com/mrgoonie/claudekit-skills) — better-auth (auth patterns), backend-development/security (OWASP)
- **Source:** [davila7/claude-code-templates](https://github.com/davila7/claude-code-templates) — security agents and hooks
- **Pattern Type:** Framework-level security methodology with auth decision engine
- **CVF Adaptation:** Added governance constraints, OWASP defense matrix, decision trees, audit checklists
- **License:** MIT (sources) → CC BY-NC-ND 4.0 (CVF adaptation)

---

## Capability

Security methodology that combines **OWASP Top 10 defense** with **authentication architecture design**. Guides agents through auth method selection, security hardening, and vulnerability prevention — not by listing vulnerabilities, but by providing decision frameworks and implementation checklists.

**Key Principle:** Security is not a feature — it's a constraint on every feature. Apply OWASP Top 10 as a checklist on every endpoint.

### Auth Method Selection Decision Tree

```
CHOOSING AUTH METHOD?
│
├─ Standard web app with user accounts?
│   └─ Email/Password + OAuth social login
│       └─ Add: Email verification, password reset, rate limiting
│
├─ Enterprise / B2B SaaS?
│   └─ SSO (SAML/OIDC) + Multi-tenant + RBAC
│       └─ Add: Organization support, role hierarchy, audit logs
│
├─ Security-critical (finance, health)?
│   └─ Email/Password + MFA (TOTP/SMS) + Passkeys
│       └─ Add: Session fingerprinting, suspicious login detection
│
├─ Mobile-first / Low friction?
│   └─ Magic Link + Social OAuth
│       └─ Add: Biometric (passkey), token refresh
│
├─ API / Machine-to-machine?
│   └─ API Keys + OAuth 2.1 Client Credentials
│       └─ Add: Key rotation, scope limiting, rate limiting
│
└─ Multiple user types?
    └─ Combine methods + Progressive enhancement
        └─ Start simple, add security layers as needed
```

### OWASP Top 10 (2025) Defense Matrix

| # | Vulnerability | Defense | Implementation |
|---|--------------|---------|---------------|
| A01 | Broken Access Control | RBAC + attribute-based checks | Check permissions on EVERY endpoint, not just UI |
| A02 | Cryptographic Failures | TLS 1.3, Argon2id, AES-256 | Never store plaintext passwords, rotate keys quarterly |
| A03 | Injection | Parameterized queries, input validation | Use ORM, validate ALL inputs (Zod/Joi), escape output |
| A04 | Insecure Design | Threat modeling, abuse cases | Model threats during Design phase, not after |
| A05 | Security Misconfiguration | Security headers, minimal exposure | CSP, X-Frame-Options, HSTS, hide server info |
| A06 | Vulnerable Components | Dependency scanning, updates | `npm audit` in CI, automated Dependabot, lockfile |
| A07 | Auth & Identification | OAuth 2.1 + PKCE, MFA | No custom crypto, use battle-tested libraries |
| A08 | Software & Data Integrity | Signing, SRI, verified pipelines | Hash verification, content security policy |
| A09 | Logging & Monitoring | Structured logging, alerting | Log auth events, failed attempts, unusual patterns |
| A10 | SSRF | URL validation, allowlists | Validate input URLs, block private IPs, use proxies |

### OAuth 2.1 + JWT Implementation

```typescript
// Server: Token issuance
const token = jwt.sign(
  {
    sub: user.id,          // Subject (user ID)
    iss: 'api.myapp.com',  // Issuer
    aud: 'myapp-client',   // Audience
    scope: 'read write',   // Permissions
    iat: now,              // Issued at
    exp: now + 900,        // 15 min expiry (short!)
  },
  privateKey,
  { algorithm: 'RS256' }   // Asymmetric signing
);

// Refresh token: separate, longer-lived, rotated on use
const refreshToken = crypto.randomBytes(64).toString('hex');
// Store hashed in DB, single-use, 7-day expiry

// Client: Token validation middleware
function authenticate(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Authentication required' });

  try {
    const payload = jwt.verify(token, publicKey, {
      algorithms: ['RS256'],
      issuer: 'api.myapp.com',
      audience: 'myapp-client',
    });
    req.user = payload;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}
```

### Security Headers Checklist

```
□ Content-Security-Policy: default-src 'self'; script-src 'self'
□ X-Content-Type-Options: nosniff
□ X-Frame-Options: DENY
□ Strict-Transport-Security: max-age=31536000; includeSubDomains
□ Referrer-Policy: strict-origin-when-cross-origin
□ Permissions-Policy: camera=(), microphone=(), geolocation=()
□ X-XSS-Protection: 0 (rely on CSP instead)
□ Cache-Control: no-store (for sensitive endpoints)
```

### Rate Limiting Strategy

| Endpoint Type | Limit | Window | Action on Exceed |
|--------------|-------|--------|------------------|
| Login | 5 attempts | 15 min | Lock + email alert |
| Password reset | 3 requests | 1 hour | Block + log |
| API (authenticated) | 1000 requests | 1 min | 429 + Retry-After |
| API (unauthenticated) | 100 requests | 1 min | 429 + captcha |
| Registration | 3 accounts | 1 hour/IP | Block IP |

### Password Security

```
Storage: Argon2id (recommended) or bcrypt (minimum 12 rounds)
  - NEVER: MD5, SHA-1, SHA-256, plain text
  - Argon2id params: memory 64MB, iterations 3, parallelism 4

Policy:
  □ Minimum 8 characters (NIST SP 800-63B)
  □ Check against breached passwords (HaveIBeenPwned API)
  □ No composition rules (they reduce entropy)
  □ No periodic rotation (NIST updated guidance)
  □ Allow paste in password fields
  □ Show password strength meter
```

### Security Audit Checklist

```
Authentication:
  □ OAuth 2.1 with PKCE (no implicit grant)
  □ JWT with RS256 (asymmetric), short expiry (15 min)
  □ Refresh token rotation (single-use)
  □ MFA for sensitive operations
  □ Session invalidation on password change

Authorization:
  □ RBAC or ABAC enforced server-side
  □ No client-side-only permission checks
  □ Principle of least privilege
  □ Resource-level authorization (not just route-level)

Data Protection:
  □ TLS 1.3 everywhere
  □ Encrypt sensitive data at rest (AES-256)
  □ PII handling compliant with GDPR/CCPA
  □ No secrets in code or logs

Infrastructure:
  □ Security headers configured
  □ Rate limiting active
  □ CORS properly restricted
  □ Dependency vulnerability scanning in CI
  □ Error messages don't leak internals
```

---

## Governance

| Field | Value |
|-------|-------|
| Risk Level | **R2 – Medium** |
| Autonomy | Supervised |
| Category | App Development — Security |

### Authority Mapping

| Role | Permission |
|------|-----------|
| Orchestrator | Full: define security architecture, approve auth strategy |
| Architect | Full: design auth flows, threat modeling |
| Builder | Execute: implement auth following approved patterns |
| Reviewer | Audit: security review, penetration testing |

### Phase Applicability

| Phase | Usage |
|-------|-------|
| A – Discovery | Identify security requirements, compliance needs |
| B – Design | Threat modeling, auth architecture (PRIMARY) |
| C – Build | Implement auth and security controls |
| D – Review | Security audit, vulnerability scanning |

---

## Risk Justification

- R2 classification: implements security controls, requires supervision
- MUST use battle-tested libraries (never custom crypto)
- MUST apply OWASP Top 10 checklist on every public endpoint
- MUST NOT store plaintext passwords or secrets in code
- MUST implement rate limiting on all auth endpoints
- MUST use parameterized queries (zero raw SQL with user input)
- MUST log all authentication events for audit trail

---

## Constraints

- MUST use battle-tested libraries (never custom crypto)
- MUST apply OWASP Top 10 checklist on every public endpoint
- MUST NOT store plaintext passwords or secrets in code
- MUST implement rate limiting on all auth endpoints
- MUST use parameterized queries (zero raw SQL with user input)
- MUST log all authentication events for audit trail
- R2 classification: implements security controls, requires supervision

---

## Dependencies

- **AGT-025** (API Architecture) — API endpoint security
- **AGT-023** (Systematic Debugging) — Debug auth issues
- **AGT-015** (Workflow Hook) — Pre-commit secret scanning
- **AGT-026** (Testing Engine) — Security testing

---

## Validation

### Success Criteria

| Criterion | Target |
|-----------|--------|
| OWASP Top 10 coverage | 100% vulnerabilities addressed |
| Auth endpoint rate limiting | All auth endpoints protected |
| Password storage | Argon2id or bcrypt (≥12 rounds) |
| JWT configuration | RS256, ≤15 min expiry, refresh rotation |
| Security header score | A+ on securityheaders.com |

---

## UAT Binding

**UAT Link:** `governance/skill-library/uat/results/UAT-AGT-027.md`

**PASS criteria:**
- [ ] 100% OWASP Top 10 vulnerabilities addressed
- [ ] All auth endpoints protected by rate limiting
- [ ] Passwords stored via Argon2id or bcrypt (≥12 rounds)
- [ ] JWT configured RS256, ≤15 min expiry, with refresh rotation

**FAIL criteria:**
- [ ] Plaintext password or secret found in code
- [ ] Custom/home-rolled cryptography used
- [ ] Auth endpoint missing rate limiting
- [ ] Raw SQL built from unvalidated user input

---

*Last Updated: February 17, 2026*
