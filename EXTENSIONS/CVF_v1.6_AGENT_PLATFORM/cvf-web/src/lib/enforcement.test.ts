import { describe, it, expect } from 'vitest';
import { evaluateEnforcement } from './enforcement';
import { SpecGateField } from './spec-gate';

describe('evaluateEnforcement', () => {
    it('blocks when budget exceeded', () => {
        const result = evaluateEnforcement({
            mode: 'simple',
            content: 'test',
            budgetOk: false,
        });
        expect(result.status).toBe('BLOCK');
        expect(result.reasons[0]).toContain('Budget');
    });

    it('requires approval for R3', () => {
        const result = evaluateEnforcement({
            mode: 'governance',
            content: 'Risk level: R3',
            budgetOk: true,
        });
        expect(result.status).toBe('NEEDS_APPROVAL');
    });

    it('blocks on spec FAIL', () => {
        const fields: SpecGateField[] = [
            { id: 'goal', label: 'Goal', required: true },
            { id: 'context', label: 'Context', required: true },
        ];
        const result = evaluateEnforcement({
            mode: 'simple',
            content: 'Risk level: R1',
            budgetOk: true,
            specFields: fields,
            specValues: {},
        });
        expect(result.status).toBe('BLOCK');
        expect(result.reasons.join(' ')).toContain('Spec');
    });

    it('allows when all gates pass', () => {
        const fields: SpecGateField[] = [
            { id: 'goal', label: 'Goal', required: true },
        ];
        const result = evaluateEnforcement({
            mode: 'simple',
            content: 'Risk level: R1',
            budgetOk: true,
            specFields: fields,
            specValues: { goal: 'Launch app' },
        });
        expect(result.status).toBe('ALLOW');
    });
});
