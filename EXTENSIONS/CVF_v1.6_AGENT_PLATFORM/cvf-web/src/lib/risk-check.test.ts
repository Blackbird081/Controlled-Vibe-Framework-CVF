/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { normalizeRiskLevel, inferRiskLevelFromText, evaluateRiskGate } from './risk-check';

describe('risk-check', () => {
    describe('normalizeRiskLevel', () => {
        it('returns R1 for undefined/null', () => {
            expect(normalizeRiskLevel(undefined)).toBe('R1');
            expect(normalizeRiskLevel(null)).toBe('R1');
        });

        it('returns R1 for empty string', () => {
            expect(normalizeRiskLevel('')).toBe('R1');
        });

        it('normalizes standard Rx strings', () => {
            expect(normalizeRiskLevel('R0')).toBe('R0');
            expect(normalizeRiskLevel('R1')).toBe('R1');
            expect(normalizeRiskLevel('R2')).toBe('R2');
            expect(normalizeRiskLevel('R3')).toBe('R3');
            expect(normalizeRiskLevel('R4')).toBe('R4');
        });

        it('normalizes with spaces and case variations', () => {
            expect(normalizeRiskLevel('r 2')).toBe('R2');
            expect(normalizeRiskLevel('  R 3  ')).toBe('R3');
            expect(normalizeRiskLevel('r0')).toBe('R0');
        });

        it('returns R1 for invalid input', () => {
            expect(normalizeRiskLevel('R5')).toBe('R1');
            expect(normalizeRiskLevel('high')).toBe('R1');
            expect(normalizeRiskLevel('abc')).toBe('R1');
        });
    });

    describe('inferRiskLevelFromText', () => {
        it('returns null for empty input', () => {
            expect(inferRiskLevelFromText('')).toBe(null);
        });

        it('matches "Risk Level: Rx"', () => {
            expect(inferRiskLevelFromText('This has Risk Level: R3 in it')).toBe('R3');
        });

        it('matches "risk: Rx"', () => {
            expect(inferRiskLevelFromText('risk: R2')).toBe('R2');
        });

        it('matches standalone R0-R4', () => {
            expect(inferRiskLevelFromText('Classified as R4 threat')).toBe('R4');
        });

        it('returns null when no risk pattern found', () => {
            expect(inferRiskLevelFromText('This is a simple message with no risk')).toBe(null);
        });
    });

    describe('evaluateRiskGate', () => {
        it('blocks R4 in any mode', () => {
            const r1 = evaluateRiskGate('R4', 'simple');
            expect(r1.status).toBe('BLOCK');
            const r2 = evaluateRiskGate('R4', 'governance');
            expect(r2.status).toBe('BLOCK');
            const r3 = evaluateRiskGate('R4', 'full');
            expect(r3.status).toBe('BLOCK');
        });

        it('blocks R2+ in simple mode', () => {
            expect(evaluateRiskGate('R2', 'simple').status).toBe('BLOCK');
            expect(evaluateRiskGate('R3', 'simple').status).toBe('BLOCK');
        });

        it('requires approval for R3 in governance mode', () => {
            const res = evaluateRiskGate('R3', 'governance');
            expect(res.status).toBe('NEEDS_APPROVAL');
            expect(res.reason).toContain('human approval');
        });

        it('requires approval for R3 in full mode', () => {
            const res = evaluateRiskGate('R3', 'full');
            expect(res.status).toBe('NEEDS_APPROVAL');
        });

        it('allows R0 and R1 in all modes', () => {
            for (const mode of ['simple', 'governance', 'full'] as const) {
                expect(evaluateRiskGate('R0', mode).status).toBe('ALLOW');
                expect(evaluateRiskGate('R1', mode).status).toBe('ALLOW');
            }
        });

        it('allows R2 in governance and full modes', () => {
            expect(evaluateRiskGate('R2', 'governance').status).toBe('ALLOW');
            expect(evaluateRiskGate('R2', 'full').status).toBe('ALLOW');
        });

        it('returns correct riskLevel in result', () => {
            const res = evaluateRiskGate('R2', 'governance');
            expect(res.riskLevel).toBe('R2');
        });

        it('normalizes null/undefined input to R1', () => {
            expect(evaluateRiskGate(null, 'simple').riskLevel).toBe('R1');
            expect(evaluateRiskGate(undefined, 'simple').riskLevel).toBe('R1');
        });
    });
});
