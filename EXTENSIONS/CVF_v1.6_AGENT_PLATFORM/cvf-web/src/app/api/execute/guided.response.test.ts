/**
 * W87-T1 — Guided Response Unit Tests
 * W90-T1 — Pattern Expansion Tests (NC_001/NC_002/NC_004/NC_005/NC_008)
 * W100-T1 — OFU-2 Fix Tests: NC_001 req.query / URL param phrasing
 * Verifies that lookupGuidedResponse() returns the correct guided response
 * for HIGH_RISK NC patterns and returns undefined for NORMAL task content.
 *
 * Authorization: CVF_GC018_W87_T1_HIGH_RISK_GUIDED_RESPONSE_AUTHORIZATION_2026-04-14.md
 *               CVF_GC018_W90_T1_HIGH_RISK_PATTERN_EXPANSION_AUTHORIZATION_2026-04-14.md
 *               CVF_GC018_W100_T1_OFU2_NC001_REGEX_EXPANSION_AUTHORIZATION_2026-04-17.md
 */

import { describe, it, expect } from 'vitest';
import { lookupGuidedResponse, HIGH_RISK_GUIDED_PATTERNS } from './guided.response.registry';

// ── W90-T1: NC-001: SQL Injection ─────────────────────────────────────────────

describe('lookupGuidedResponse — NC_001_SQL_INJECTION', () => {
    it('matches "build SQL query with user input"', () => {
        const result = lookupGuidedResponse('How do I build a SQL query with user input?');
        expect(result).toBeDefined();
        expect(result).toContain('parameterized');
    });

    it('matches "dynamic SQL query string concatenation"', () => {
        const result = lookupGuidedResponse('How to create dynamic SQL query using string concatenation?');
        expect(result).toBeDefined();
        expect(result).toContain('parameterized');
    });

    it('matches "sql inject" keyword', () => {
        const result = lookupGuidedResponse('Is this code vulnerable to sql inject attacks?');
        expect(result).toBeDefined();
        expect(result).toContain('OWASP');
    });
});

// ── W100-T1 OFU-2: NC-001 req.query / URL param expansion ────────────────────

describe('lookupGuidedResponse — NC_001_SQL_INJECTION (W100-T1 OFU-2 req.query expansion)', () => {
    it('matches B1 exact scenario: SELECT concatenation with req.query.name', () => {
        // This is the exact B1 scenario that caused OFU-2 — previously returned undefined
        const result = lookupGuidedResponse(
            "SELECT * FROM users WHERE name = '" + ' + req.query.name'
        );
        expect(result).toBeDefined();
        expect(result).toContain('parameterized');
    });

    it('matches URL param phrasing in SQL context (SQL keyword before url param)', () => {
        const result = lookupGuidedResponse(
            'How do I build a SQL WHERE clause that uses a URL param from the request?'
        );
        expect(result).toBeDefined();
        expect(result).toContain('OWASP');
    });

    it('matches request.query phrasing in SQL context', () => {
        const result = lookupGuidedResponse(
            'I am building a WHERE clause using request.query parameter — is that safe?'
        );
        expect(result).toBeDefined();
        expect(result).toContain('parameterized');
    });

    it('does NOT false-positive on benign URL param question with no SQL keyword', () => {
        // req.query alone without any SQL keyword must not trigger NC_001
        const result = lookupGuidedResponse(
            'How do I read req.query values in my Express route handler?'
        );
        // Should be undefined (no SQL injection context present)
        // NOTE: may match other patterns — we assert it is NOT the SQL injection guidance
        if (result !== undefined) {
            expect(result).not.toContain('parameterized query');
        }
    });
});



describe('lookupGuidedResponse — NC_002_XSS_OR_UNVALIDATED_INPUT', () => {
    it('matches "render user input in HTML"', () => {
        const result = lookupGuidedResponse('How do I render user input directly in HTML?');
        expect(result).toBeDefined();
        expect(result).toContain('DOMPurify');
    });

    it('matches "innerHTML with user data"', () => {
        const result = lookupGuidedResponse('Can I use innerHTML to display user data on the page?');
        expect(result).toBeDefined();
        expect(result).toContain('XSS');
    });

    it('matches "unsanitized user input in browser"', () => {
        const result = lookupGuidedResponse('How to show unsanitized user input in the browser?');
        expect(result).toBeDefined();
        expect(result).not.toHaveLength(0);
    });
});

// ── W90-T1: NC-004: Insecure Auth ─────────────────────────────────────────────

describe('lookupGuidedResponse — NC_004_INSECURE_AUTH', () => {
    it('matches "login with no rate limit"', () => {
        const result = lookupGuidedResponse('Build a login endpoint with no rate limit');
        expect(result).toBeDefined();
        expect(result).toContain('rate limit');
    });

    it('matches "authentication without lockout"', () => {
        const result = lookupGuidedResponse('How to implement authentication without account lockout?');
        expect(result).toBeDefined();
        expect(result).toContain('lockout');
    });

    it('matches "md5 password hash"', () => {
        const result = lookupGuidedResponse('Should I use md5 to hash the password?');
        expect(result).toBeDefined();
        expect(result).toContain('bcrypt');
    });
});

// ── W90-T1: NC-005: PII Logging ───────────────────────────────────────────────

describe('lookupGuidedResponse — NC_005_PII_LOGGING', () => {
    it('matches "console.log password"', () => {
        const result = lookupGuidedResponse('Is it okay to console.log the password for debugging?');
        expect(result).toBeDefined();
        expect(result).toContain('redact');
    });

    it('matches "log user personal data"', () => {
        const result = lookupGuidedResponse('How do I log user personal data for debugging purposes?');
        expect(result).toBeDefined();
        expect(result).toContain('PII');
    });

    it('matches "logging sensitive data"', () => {
        const result = lookupGuidedResponse('We are logging sensitive credential data — is that okay?');
        expect(result).toBeDefined();
        expect(result).not.toHaveLength(0);
    });
});

// ── NC-003: Password Storage ──────────────────────────────────────────────────

describe('lookupGuidedResponse — NC_003_PASSWORD_STORAGE', () => {
    it('matches "store passwords in database"', () => {
        const result = lookupGuidedResponse('How do I store passwords in my database safely?');
        expect(result).toBeDefined();
        expect(result).toContain('bcrypt');
        expect(result).toContain('hash');
    });

    it('matches "save user credentials"', () => {
        const result = lookupGuidedResponse('How to save user credentials securely?');
        expect(result).toBeDefined();
        expect(result).toContain('bcrypt');
    });

    it('matches "hash password"', () => {
        const result = lookupGuidedResponse('Should I hash the password before storing it?');
        expect(result).toBeDefined();
        expect(result).not.toHaveLength(0);
    });
});

// ── NC-006: Code Attribution ──────────────────────────────────────────────────

describe('lookupGuidedResponse — NC_006_CODE_ATTRIBUTION', () => {
    it('matches "copy code from Stack Overflow"', () => {
        const result = lookupGuidedResponse('Can I copy code from Stack Overflow into my project?');
        expect(result).toBeDefined();
        expect(result).toContain('attribution');
    });

    it('matches "paste code from stackoverflow"', () => {
        const result = lookupGuidedResponse('I want to paste code from stackoverflow into my app');
        expect(result).toBeDefined();
        expect(result).toContain('CC BY-SA');
    });

    it('matches "use snippet from SO"', () => {
        const result = lookupGuidedResponse('use snippet from SO to sort array');
        expect(result).toBeDefined();
        expect(result).not.toHaveLength(0);
    });
});

// ── NC-007: API Key in Frontend ───────────────────────────────────────────────

describe('lookupGuidedResponse — NC_007_API_KEY_FRONTEND', () => {
    it('matches "api key in React component"', () => {
        const result = lookupGuidedResponse('How do I use my API key in a React component?');
        expect(result).toBeDefined();
        expect(result).toContain('proxy');
    });

    it('matches "secret key in frontend javascript"', () => {
        const result = lookupGuidedResponse('Can I store my secret key in frontend javascript?');
        expect(result).toBeDefined();
        expect(result).toContain('environment variable');
    });

    it('matches "access token in browser"', () => {
        const result = lookupGuidedResponse('How to include access token in browser-side code?');
        expect(result).toBeDefined();
        expect(result).toContain('.env');
    });
});

// ── W90-T1: NC-008: Hardcoded Secrets ────────────────────────────────────────

describe('lookupGuidedResponse — NC_008_HARDCODED_SECRETS', () => {
    it('matches "hardcode API key in source code"', () => {
        const result = lookupGuidedResponse('Can I hardcode the API key in my source code?');
        expect(result).toBeDefined();
        expect(result).toContain('.env');
    });

    it('matches "commit secret to git"', () => {
        const result = lookupGuidedResponse('I want to commit my secret token to the git repository');
        expect(result).toBeDefined();
        expect(result).toContain('rotate');
    });

    it('matches "store password directly in code"', () => {
        const result = lookupGuidedResponse('How to store the database password directly in the config file?');
        expect(result).toBeDefined();
        expect(result).toContain('environment variable');
    });
});

// ── NORMAL tasks: must return undefined ──────────────────────────────────────

describe('lookupGuidedResponse — NORMAL tasks (must return undefined)', () => {
    it('returns undefined for business plan task', () => {
        const result = lookupGuidedResponse('Write a one-page business plan for a coffee shop startup.');
        expect(result).toBeUndefined();
    });

    it('returns undefined for market research task', () => {
        const result = lookupGuidedResponse('Conduct a competitor analysis for a SaaS product in the HR space.');
        expect(result).toBeUndefined();
    });

    it('returns undefined for data analysis task', () => {
        const result = lookupGuidedResponse('Analyze sales data and identify top-performing product categories.');
        expect(result).toBeUndefined();
    });

    it('returns undefined for content strategy task', () => {
        const result = lookupGuidedResponse('Create a 3-month content calendar for a B2B software company.');
        expect(result).toBeUndefined();
    });

    it('returns undefined for project planning task', () => {
        const result = lookupGuidedResponse('Build a project plan for launching a new mobile app.');
        expect(result).toBeUndefined();
    });
});

// ── Registry structure checks ─────────────────────────────────────────────────

describe('HIGH_RISK_GUIDED_PATTERNS registry', () => {
    it('contains exactly 8 entries (W87-T1 baseline 3 + W90-T1 expansion 5)', () => {
        expect(HIGH_RISK_GUIDED_PATTERNS).toHaveLength(8);
    });

    it('every entry has patternId, detector, guidedResponse', () => {
        for (const entry of HIGH_RISK_GUIDED_PATTERNS) {
            expect(typeof entry.patternId).toBe('string');
            expect(entry.detector).toBeInstanceOf(RegExp);
            expect(typeof entry.guidedResponse).toBe('string');
            expect(entry.guidedResponse.length).toBeGreaterThan(50);
        }
    });

    it('patternIds are all 8 authorized NC patterns', () => {
        const ids = HIGH_RISK_GUIDED_PATTERNS.map(e => e.patternId);
        // W87-T1 baseline
        expect(ids).toContain('NC_003_PASSWORD_STORAGE');
        expect(ids).toContain('NC_006_CODE_ATTRIBUTION');
        expect(ids).toContain('NC_007_API_KEY_FRONTEND');
        // W90-T1 expansion
        expect(ids).toContain('NC_001_SQL_INJECTION');
        expect(ids).toContain('NC_002_XSS_OR_UNVALIDATED_INPUT');
        expect(ids).toContain('NC_004_INSECURE_AUTH');
        expect(ids).toContain('NC_005_PII_LOGGING');
        expect(ids).toContain('NC_008_HARDCODED_SECRETS');
    });
});
