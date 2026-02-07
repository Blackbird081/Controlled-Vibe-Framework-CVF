import { describe, it, expect } from 'vitest';
import { validateContract, validateInputs } from '../validator';
import { makeContract } from './fixtures';

describe('validateContract', () => {
    it('returns errors for missing required fields', () => {
        const result = validateContract({ capability_id: 'BAD_v1' } as any);
        expect(result.valid).toBe(false);
        expect(result.errors.some(err => err.includes('Missing required field'))).toBe(true);
    });

    it('validates risk level and phases', () => {
        const contract = makeContract({
            risk_level: 'R9' as any,
            governance: {
                allowed_archetypes: ['Analysis'],
                allowed_phases: ['Z' as any],
                required_decisions: [],
                required_status: 'ACTIVE',
            },
        });

        const result = validateContract(contract);
        expect(result.valid).toBe(false);
        expect(result.errors.some(err => err.includes('Invalid risk_level'))).toBe(true);
        expect(result.errors.some(err => err.includes('Invalid phase'))).toBe(true);
    });

    it('warns on capability_id format', () => {
        const contract = makeContract({ capability_id: 'bad_id' });
        const result = validateContract(contract);
        expect(result.warnings.some(warn => warn.includes('capability_id'))).toBe(true);
    });
});

describe('validateInputs', () => {
    it('validates required and types', () => {
        const contract = makeContract();
        const result = validateInputs(contract, { language: 'python' });
        expect(result.valid).toBe(false);
        expect(result.errors.some(err => err.includes('Missing required input'))).toBe(true);
    });

    it('validates enums and range', () => {
        const contract = makeContract({
            input_spec: [
                { name: 'level', type: 'string', required: true, enum: ['low', 'high'] },
                { name: 'score', type: 'integer', required: true, range: [0, 10] },
            ],
        });

        const result = validateInputs(contract, { level: 'mid', score: 20 });
        expect(result.valid).toBe(false);
        expect(result.errors.some(err => err.includes('must be one of'))).toBe(true);
        expect(result.errors.some(err => err.includes('between 0 and 10'))).toBe(true);
    });
});
