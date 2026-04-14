/**
 * W87-T1 — Guided Response Unit Tests
 * Verifies that lookupGuidedResponse() returns the correct guided response
 * for HIGH_RISK NC patterns and returns undefined for NORMAL task content.
 *
 * Authorization: CVF_GC018_W87_T1_HIGH_RISK_GUIDED_RESPONSE_AUTHORIZATION_2026-04-14.md
 */

import { describe, it, expect } from 'vitest';
import { lookupGuidedResponse, HIGH_RISK_GUIDED_PATTERNS } from './guided.response.registry';

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
    it('contains exactly 3 entries', () => {
        expect(HIGH_RISK_GUIDED_PATTERNS).toHaveLength(3);
    });

    it('every entry has patternId, detector, guidedResponse', () => {
        for (const entry of HIGH_RISK_GUIDED_PATTERNS) {
            expect(typeof entry.patternId).toBe('string');
            expect(entry.detector).toBeInstanceOf(RegExp);
            expect(typeof entry.guidedResponse).toBe('string');
            expect(entry.guidedResponse.length).toBeGreaterThan(50);
        }
    });

    it('patternIds are the 3 authorized NC patterns', () => {
        const ids = HIGH_RISK_GUIDED_PATTERNS.map(e => e.patternId);
        expect(ids).toContain('NC_003_PASSWORD_STORAGE');
        expect(ids).toContain('NC_006_CODE_ATTRIBUTION');
        expect(ids).toContain('NC_007_API_KEY_FRONTEND');
    });
});
