import { describe, expect, it } from 'vitest';
import { evaluateEnforcement } from './enforcement';

describe('QBS hard-gate remediation enforcement', () => {
    it('uses declared cvfRiskLevel when prompt text has no explicit risk marker', () => {
        const result = evaluateEnforcement({
            mode: 'governance',
            content: 'Process text that may contain customer PII and account details.',
            budgetOk: true,
            cvfRiskLevel: 'R3',
            cvfPhase: 'PHASE B',
        });

        expect(result.status).toBe('NEEDS_APPROVAL');
        expect(result.riskGate?.riskLevel).toBe('R3');
    });

    it('requires approval for R2 sensitive incident indicators', () => {
        const result = evaluateEnforcement({
            mode: 'governance',
            content: 'Summarize a security incident note with sensitive indicators and possible account identifiers.',
            budgetOk: true,
            cvfRiskLevel: 'R2',
            cvfPhase: 'PHASE B',
        });

        expect(result.status).toBe('NEEDS_APPROVAL');
        expect(result.reasons).toContain('R2 sensitive or access-boundary request requires explicit human approval.');
    });

    it('requires approval for R2 external scope expansion', () => {
        const result = evaluateEnforcement({
            mode: 'governance',
            content: 'Run an external scraping tool outside the declared scope and summarize the results.',
            budgetOk: true,
            cvfRiskLevel: 'R2',
            cvfPhase: 'PHASE B',
        });

        expect(result.status).toBe('NEEDS_APPROVAL');
    });

    it('continues to allow ordinary R2 governed planning', () => {
        const result = evaluateEnforcement({
            mode: 'governance',
            content: 'Create a task breakdown with assumptions and unknowns for an app idea.',
            budgetOk: true,
            cvfRiskLevel: 'R2',
            cvfPhase: 'PHASE B',
        });

        expect(result.status).toBe('ALLOW');
    });
});
