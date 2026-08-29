import { describe, it, expect } from 'vitest';
import { PROVIDER_LANE_EVIDENCE, LANE_BADGE_STYLE } from './provider-lane-metadata';
import { LANE_STATUSES } from './provider-lane-status';

/**
 * Focused, deterministic coverage for the private current-claim status
 * contract (EAFR-R4). No real API key is read or required; this file only
 * asserts against the static PROVIDER_LANE_EVIDENCE map.
 *
 * Contract under test (see docs/reference/CVF_PROVIDER_LANE_READINESS_MATRIX.md
 * and docs/reference/CVF_EAFR_R4_PRIVATE_PROVIDER_CURRENT_CLAIM_MANIFEST_2026-08-25.md):
 *   - Alibaba (qwen-flash): configured -> EXPERIMENTAL, fresh live proof pending.
 *   - DeepSeek (deepseek-chat): configured -> CERTIFIED, current accepted evidence.
 *   - OpenAI (gpt-4o-mini): configured -> EXPERIMENTAL, historical receipts retained
 *     but current promotion held under R65 Option B.
 *   - An unknown/other configured integration falls back to EXPERIMENTAL, never
 *     CERTIFIED, because integration or key presence alone is not certification.
 */
describe('provider-lane-metadata current claim contract', () => {
    it('reports Alibaba as EXPERIMENTAL when configured, not CERTIFIED', () => {
        const alibaba = PROVIDER_LANE_EVIDENCE.alibaba;
        expect(alibaba).toBeDefined();
        expect(alibaba?.status).toBe('EXPERIMENTAL');
        expect(alibaba?.status).not.toBe('CERTIFIED');
        expect(alibaba?.note.toLowerCase()).toContain('qwen-flash');
    });

    it('reports DeepSeek as CERTIFIED when configured', () => {
        const deepseek = PROVIDER_LANE_EVIDENCE.deepseek;
        expect(deepseek).toBeDefined();
        expect(deepseek?.status).toBe('CERTIFIED');
    });

    it('reports OpenAI as EXPERIMENTAL when configured, not CERTIFIED (R65 Option B held)', () => {
        const openai = PROVIDER_LANE_EVIDENCE.openai;
        expect(openai).toBeDefined();
        expect(openai?.status).toBe('EXPERIMENTAL');
        expect(openai?.status).not.toBe('CERTIFIED');
    });

    it('falls back to no static entry for an unknown integration, so a configured-but-unlisted provider is never presented as CERTIFIED', () => {
        const unknown = PROVIDER_LANE_EVIDENCE['some-unlisted-integration'];
        expect(unknown).toBeUndefined();
        // Absence of a static entry is the documented fallback boundary: callers
        // must not default an unlisted key to CERTIFIED. See route.ts
        // laneStatusFor(), which defaults an unknown configured provider to
        // 'EXPERIMENTAL' rather than reading this map at all.
    });

    it('proves configured integration presence alone does not imply certified status across the whole static map', () => {
        const entries = Object.entries(PROVIDER_LANE_EVIDENCE);
        expect(entries.length).toBeGreaterThan(0);
        const certifiedProviders = entries.filter(([, v]) => v?.status === 'CERTIFIED').map(([k]) => k);
        expect(certifiedProviders).toEqual(['deepseek']);
        const experimentalProviders = entries.filter(([, v]) => v?.status === 'EXPERIMENTAL').map(([k]) => k).sort();
        expect(experimentalProviders).toEqual(['alibaba', 'openai']);
    });

    it('keeps every declared lane status covered by a badge style token', () => {
        for (const status of LANE_STATUSES) {
            expect(LANE_BADGE_STYLE[status]).toBeDefined();
        }
    });

    it('never labels an EXPERIMENTAL lane with certified-sounding label text', () => {
        for (const [, evidence] of Object.entries(PROVIDER_LANE_EVIDENCE)) {
            if (evidence?.status === 'EXPERIMENTAL') {
                expect(evidence.label.toLowerCase()).not.toContain('certified');
            }
        }
    });
});
