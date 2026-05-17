import { describe, it, expect } from 'vitest';
import { evaluateSpecGate, SpecGateField } from './spec-gate';

describe('evaluateSpecGate', () => {
    const fields: SpecGateField[] = [
        { id: 'goal', label: 'Goal', required: true },
        { id: 'context', label: 'Context', required: false },
        { id: 'constraints', label: 'Constraints', required: true },
    ];

    it('fails when all required fields are missing', () => {
        const result = evaluateSpecGate(fields, {});
        expect(result.status).toBe('FAIL');
        expect(result.missing).toHaveLength(2);
        expect(result.requiredCount).toBe(2);
        expect(result.providedCount).toBe(0);
    });

    it('returns pass when all required fields are provided', () => {
        const result = evaluateSpecGate(fields, {
            goal: 'Build a dashboard',
            constraints: 'No new dependencies',
        });
        expect(result.status).toBe('PASS');
        expect(result.missing).toHaveLength(0);
        expect(result.providedCount).toBe(2);
    });

    it('returns clarify when some required fields are missing', () => {
        const result = evaluateSpecGate(fields, {
            goal: 'Build a dashboard',
            constraints: '',
        });
        expect(result.status).toBe('CLARIFY');
        expect(result.missing).toHaveLength(1);
    });

    it('treats N/A as missing for required fields', () => {
        const result = evaluateSpecGate(fields, {
            goal: 'Build a dashboard',
            constraints: 'N/A',
        });
        expect(result.status).toBe('CLARIFY');
        expect(result.missing).toHaveLength(1);
        expect(result.missing[0].id).toBe('constraints');
    });

    it('returns clarify when no required fields exist but no values provided', () => {
        const result = evaluateSpecGate([], {});
        expect(result.status).toBe('CLARIFY');
        expect(result.requiredCount).toBe(0);
    });

    it('returns pass when no required fields exist but values are provided', () => {
        const result = evaluateSpecGate([], { note: 'some context' });
        expect(result.status).toBe('PASS');
        expect(result.providedCount).toBe(1);
    });
});
