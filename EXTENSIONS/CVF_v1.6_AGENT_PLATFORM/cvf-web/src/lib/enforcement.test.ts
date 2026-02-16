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

    it('returns CLARIFY when spec has optional missing fields', () => {
        const fields: SpecGateField[] = [
            { id: 'goal', label: 'Goal', required: true },
            { id: 'context', label: 'Context', required: false },
        ];
        const result = evaluateEnforcement({
            mode: 'simple',
            content: 'Risk level: R0',
            budgetOk: true,
            specFields: fields,
            specValues: { goal: 'Done' },
        });
        // When all required fields present but optional missing, spec gate status is CLARIFY
        expect(result.status === 'ALLOW' || result.status === 'CLARIFY').toBe(true);
    });

    it('returns riskGate in result', () => {
        const result = evaluateEnforcement({
            mode: 'governance',
            content: 'Risk level: R2',
            budgetOk: true,
        });
        expect(result.riskGate).toBeDefined();
        expect(result.riskGate!.status).toBeDefined();
    });

    it('returns specGate in result when fields provided', () => {
        const fields: SpecGateField[] = [
            { id: 'goal', label: 'Goal', required: true },
        ];
        const result = evaluateEnforcement({
            mode: 'simple',
            content: 'test',
            budgetOk: true,
            specFields: fields,
            specValues: { goal: 'Build app' },
        });
        expect(result.specGate).toBeDefined();
    });

    it('handles empty specFields array', () => {
        const result = evaluateEnforcement({
            mode: 'simple',
            content: 'Risk level: R0',
            budgetOk: true,
            specFields: [],
            specValues: {},
        });
        expect(result.specGate).toBeUndefined();
    });

    it('budget block takes precedence over other checks', () => {
        const fields: SpecGateField[] = [
            { id: 'goal', label: 'Goal', required: true },
        ];
        const result = evaluateEnforcement({
            mode: 'governance',
            content: 'Risk level: R3',
            budgetOk: false,
            specFields: fields,
            specValues: {},
        });
        expect(result.status).toBe('BLOCK');
        expect(result.reasons).toContain('Budget exceeded');
    });

    it('returns CLARIFY when some required spec fields are missing', () => {
        const fields: SpecGateField[] = [
            { id: 'goal', label: 'Goal', required: true },
            { id: 'scope', label: 'Scope', required: true },
        ];
        const result = evaluateEnforcement({
            mode: 'simple',
            content: 'Risk level: R0',
            budgetOk: true,
            specFields: fields,
            specValues: { goal: 'Done' }, // scope is missing → CLARIFY
        });
        expect(result.status).toBe('CLARIFY');
        expect(result.reasons).toContain('Spec needs clarification');
    });

    it('returns NEEDS_APPROVAL for R3 risk in governance mode', () => {
        const result = evaluateEnforcement({
            mode: 'governance',
            content: 'This involves risk level R3 changes',
            budgetOk: true,
        });
        expect(result.status).toBe('NEEDS_APPROVAL');
        expect(result.reasons).toContain('R3 requires explicit human approval before execution.');
    });
});
