import { describe, it, expect, vi, afterEach } from 'vitest';
import * as taxLogger from './governance-tax-logger';
import { _taxLogSink } from './governance-tax-logger';
import type { GovernanceTaxPhases } from './governance-tax-logger';

afterEach(() => {
    vi.restoreAllMocks();
});

// GREEN: tax = 20+30+10 = 60ms, provider = 600ms, total = 660ms, pct ≈ 9.09%
const PHASES_FAST: GovernanceTaxPhases = {
    pre_processing_ms: 20,
    policy_engine_ms: 30,
    provider_ms: 600,
    post_processing_ms: 10,
};

// AMBER: tax = 60+40+10 = 110ms, provider = 900ms, total = 1010ms, pct ≈ 10.9%
const PHASES_AMBER: GovernanceTaxPhases = {
    pre_processing_ms: 60,
    policy_engine_ms: 40,
    provider_ms: 900,
    post_processing_ms: 10,
};

const PHASES_RED: GovernanceTaxPhases = {
    pre_processing_ms: 100,
    policy_engine_ms: 150,
    provider_ms: 500,
    post_processing_ms: 50,
};

describe('evaluateFitness', () => {
    it('returns GREEN when tax_pct < 10', () => {
        expect(taxLogger.evaluateFitness(5)).toBe('GREEN');
        expect(taxLogger.evaluateFitness(0)).toBe('GREEN');
        expect(taxLogger.evaluateFitness(9.9)).toBe('GREEN');
    });

    it('returns AMBER when tax_pct is 10–19.9', () => {
        expect(taxLogger.evaluateFitness(10)).toBe('AMBER');
        expect(taxLogger.evaluateFitness(15)).toBe('AMBER');
        expect(taxLogger.evaluateFitness(19.9)).toBe('AMBER');
    });

    it('returns RED when tax_pct >= 20', () => {
        expect(taxLogger.evaluateFitness(20)).toBe('RED');
        expect(taxLogger.evaluateFitness(50)).toBe('RED');
        expect(taxLogger.evaluateFitness(100)).toBe('RED');
    });
});

describe('computeGovernanceTax', () => {
    it('excludes provider_ms from governance tax', () => {
        const result = taxLogger.computeGovernanceTax(PHASES_FAST);
        expect(result.governance_tax_ms).toBe(60);
        expect(result.total_ms).toBe(660);
    });

    it('computes correct tax percentage', () => {
        const result = taxLogger.computeGovernanceTax(PHASES_FAST);
        expect(result.governance_tax_pct).toBeCloseTo((60 / 660) * 100, 2);
    });

    it('returns 0 pct when total_ms is 0', () => {
        const result = taxLogger.computeGovernanceTax({
            pre_processing_ms: 0,
            policy_engine_ms: 0,
            provider_ms: 0,
            post_processing_ms: 0,
        });
        expect(result.governance_tax_pct).toBe(0);
    });
});

describe('buildGovernanceTaxEntry', () => {
    it('produces GREEN grade for fast phases', () => {
        const entry = taxLogger.buildGovernanceTaxEntry({
            request_id: 'test-id',
            phases: PHASES_FAST,
            decision: 'ALLOW',
            provider: 'alibaba',
            governance_family: null,
        });
        expect(entry.grade).toBe('GREEN');
        expect(entry.request_id).toBe('test-id');
        expect(entry.provider).toBe('alibaba');
        expect(entry.governance_family).toBeNull();
    });

    it('produces AMBER grade for moderate overhead', () => {
        const entry = taxLogger.buildGovernanceTaxEntry({
            request_id: 'r2',
            phases: PHASES_AMBER,
            decision: 'ALLOW',
            provider: 'openai',
            governance_family: 'negative_controls',
        });
        expect(entry.grade).toBe('AMBER');
        expect(entry.governance_family).toBe('negative_controls');
    });

    it('produces RED grade for high overhead', () => {
        const entry = taxLogger.buildGovernanceTaxEntry({
            request_id: 'r3',
            phases: PHASES_RED,
            decision: 'BLOCK',
            provider: 'deepseek',
            governance_family: 'cost_quota_provider_selection',
        });
        expect(entry.grade).toBe('RED');
        expect(entry.decision).toBe('BLOCK');
    });

    it('includes ISO timestamp', () => {
        const entry = taxLogger.buildGovernanceTaxEntry({
            request_id: 'r4',
            phases: PHASES_FAST,
            decision: 'ALLOW',
            provider: 'alibaba',
            governance_family: undefined,
        });
        expect(entry.ts).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
});

describe('logGovernanceTax', () => {
    it('calls _taxLogSink.write with JSONL line', () => {
        const spy = vi.spyOn(_taxLogSink, 'write').mockImplementation(() => {});
        const entry = taxLogger.buildGovernanceTaxEntry({
            request_id: 'log-test',
            phases: PHASES_FAST,
            decision: 'ALLOW',
            provider: 'alibaba',
            governance_family: null,
        });
        taxLogger.logGovernanceTax(entry);
        expect(spy).toHaveBeenCalledOnce();
        const line = spy.mock.calls[0][2] as string;
        expect(line.endsWith('\n')).toBe(true);
        const parsed = JSON.parse(line.trim());
        expect(parsed.request_id).toBe('log-test');
        expect(parsed.grade).toBe('GREEN');
    });

    it('does not throw when write throws', () => {
        vi.spyOn(_taxLogSink, 'write').mockImplementation(() => { throw new Error('disk full'); });
        const entry = taxLogger.buildGovernanceTaxEntry({
            request_id: 'fail-test',
            phases: PHASES_FAST,
            decision: 'ALLOW',
            provider: 'alibaba',
            governance_family: null,
        });
        expect(() => taxLogger.logGovernanceTax(entry)).not.toThrow();
    });
});
