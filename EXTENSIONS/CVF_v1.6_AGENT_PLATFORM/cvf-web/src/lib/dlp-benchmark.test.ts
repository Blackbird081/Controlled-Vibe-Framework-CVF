import { describe, it, expect } from 'vitest';
import { runDLPBenchmark, type DLPCorpus } from './dlp-benchmark';

function minCorpus(overrides: Partial<DLPCorpus['categories']> = {}): DLPCorpus {
    return {
        version: 'test',
        generated: '2026-05-13',
        categories: {
            true_pii: { cases: [] },
            false_pii: { cases: [] },
            adversarial: { cases: [] },
            ...overrides,
        },
    };
}

describe('runDLPBenchmark — true_pii detection', () => {
    it('detects email address in true_pii case', () => {
        const corpus = minCorpus({
            true_pii: {
                cases: [{
                    id: 'test-email',
                    patternId: 'preset-email',
                    input: 'Contact admin@example.com for help.',
                    expectRedacted: true,
                }],
            },
        });
        const metrics = runDLPBenchmark(corpus);
        expect(metrics.truePositive).toBe(1);
        expect(metrics.falseNegative).toBe(0);
        expect(metrics.recall).toBe(1);
        expect(metrics.caseResults[0].correct).toBe(true);
    });

    it('detects sk- API key in true_pii case', () => {
        const corpus = minCorpus({
            true_pii: {
                cases: [{
                    id: 'test-sk-key',
                    patternId: 'preset-api-key-sk',
                    input: 'Key: sk-fakekeyforbenchmarkabcdefghij1234',
                    expectRedacted: true,
                }],
            },
        });
        const metrics = runDLPBenchmark(corpus);
        expect(metrics.truePositive).toBe(1);
        expect(metrics.recall).toBe(1);
    });

    it('counts false negative when PII missed', () => {
        const corpus = minCorpus({
            true_pii: {
                cases: [{
                    id: 'test-miss',
                    patternId: 'preset-email',
                    input: 'No PII in this sentence at all.',
                    expectRedacted: true,
                }],
            },
        });
        const metrics = runDLPBenchmark(corpus);
        expect(metrics.falseNegative).toBe(1);
        expect(metrics.truePositive).toBe(0);
        expect(metrics.caseResults[0].correct).toBe(false);
    });
});

describe('runDLPBenchmark — false_pii precision', () => {
    it('does not redact model name (allowlisted)', () => {
        const corpus = minCorpus({
            false_pii: {
                cases: [{
                    id: 'test-model',
                    patternId: 'preset-api-key-sk',
                    input: 'Using qwen-turbo model.',
                    expectRedacted: false,
                }],
            },
        });
        const metrics = runDLPBenchmark(corpus);
        expect(metrics.trueNegative).toBe(1);
        expect(metrics.falsePositive).toBe(0);
        expect(metrics.precision).toBe(1);
    });

    it('counts false positive when safe content is redacted', () => {
        const corpus = minCorpus({
            false_pii: {
                cases: [{
                    id: 'test-fp',
                    patternId: 'preset-email',
                    input: 'Contact admin@example.com is safe (test FP).',
                    expectRedacted: false,
                }],
            },
        });
        const metrics = runDLPBenchmark(corpus);
        // email IS redacted — so this is a false positive
        expect(metrics.falsePositive).toBe(1);
        expect(metrics.trueNegative).toBe(0);
    });
});

describe('runDLPBenchmark — F1 and grade', () => {
    it('grade is PASS when F1 >= 0.80', () => {
        const corpus = minCorpus({
            true_pii: {
                cases: [
                    { id: 'tp1', patternId: 'preset-email', input: 'user@test.example.com', expectRedacted: true },
                    { id: 'tp2', patternId: 'preset-api-key-sk', input: 'sk-fakekeybenchmarktestABCDEFGHIJ', expectRedacted: true },
                ],
            },
            false_pii: {
                cases: [
                    { id: 'fp1', patternId: 'preset-api-key-sk', input: 'Model: qwen-turbo is fast.', expectRedacted: false },
                ],
            },
        });
        const metrics = runDLPBenchmark(corpus);
        expect(metrics.f1).toBeGreaterThanOrEqual(0.8);
        expect(metrics.grade).toBe('PASS');
    });

    it('grade is ADVISORY when F1 < 0.80', () => {
        // All true_pii missed → recall 0 → F1 0
        const corpus = minCorpus({
            true_pii: {
                cases: [
                    { id: 'tp1', patternId: 'preset-email', input: 'no pii here', expectRedacted: true },
                    { id: 'tp2', patternId: 'preset-email', input: 'still no pii', expectRedacted: true },
                ],
            },
        });
        const metrics = runDLPBenchmark(corpus);
        expect(metrics.grade).toBe('ADVISORY');
    });

    it('F1 is 1.0 when all cases correct and no false positives', () => {
        const corpus = minCorpus({
            true_pii: {
                cases: [
                    { id: 'tp1', patternId: 'preset-email', input: 'user@example.com', expectRedacted: true },
                ],
            },
            false_pii: {
                cases: [
                    { id: 'fp1', patternId: 'other', input: 'Normal text with no PII.', expectRedacted: false },
                ],
            },
        });
        const metrics = runDLPBenchmark(corpus);
        expect(metrics.precision).toBe(1);
        expect(metrics.recall).toBe(1);
        expect(metrics.f1).toBe(1);
    });
});

describe('runDLPBenchmark — adversarial (doc-only)', () => {
    it('counts adversarial cases separately, does not affect F1', () => {
        const corpus = minCorpus({
            true_pii: {
                cases: [
                    { id: 'tp1', patternId: 'preset-email', input: 'admin@example.com', expectRedacted: true },
                ],
            },
            adversarial: {
                cases: [
                    {
                        id: 'adv1',
                        patternId: 'preset-email',
                        input: 'user @ example . com (spaced)',
                        expectRedacted: false,
                        note: 'Engine expected to miss',
                    },
                ],
            },
        });
        const metrics = runDLPBenchmark(corpus);
        expect(metrics.adversarialTotal).toBe(1);
        // F1 computed only from true_pii + false_pii
        expect(metrics.f1).toBe(1);
    });
});

describe('runDLPBenchmark — full corpus smoke test', () => {
    it('loads and runs the v1 corpus without throwing', () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const corpus = require('../../../../../docs/benchmark/dlp/dlp-corpus-v1.json') as DLPCorpus;
        expect(() => runDLPBenchmark(corpus)).not.toThrow();
        const metrics = runDLPBenchmark(corpus);
        expect(metrics.truePositive + metrics.falseNegative).toBeGreaterThan(0);
        expect(metrics.f1).toBeGreaterThan(0);
    });
});
