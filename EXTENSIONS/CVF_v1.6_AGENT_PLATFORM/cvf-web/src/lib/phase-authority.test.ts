import { describe, it, expect } from 'vitest';
import {
    PHASE_AUTHORITY_MATRIX,
    isRiskAllowed,
    RISK_OPTIONS,
    type CVFRiskLevel,
    type CVFPhaseToolkit,
} from './governance-context';
import {
    evaluateRiskGate,
    getRiskSeverityColor,
} from './risk-check';

describe('Phase Authority + R4 Support', () => {
    // Phase Authority Matrix
    describe('PHASE_AUTHORITY_MATRIX', () => {
        it('INTAKE cannot approve or override', () => {
            const a = PHASE_AUTHORITY_MATRIX.INTAKE;
            expect(a.can_approve).toBe(false);
            expect(a.can_override).toBe(false);
            expect(a.max_risk).toBe('R1');
        });

        it('BUILD can approve but not override', () => {
            const a = PHASE_AUTHORITY_MATRIX.BUILD;
            expect(a.can_approve).toBe(true);
            expect(a.can_override).toBe(false);
            expect(a.max_risk).toBe('R3');
        });

        it('FREEZE can approve and override, max R4', () => {
            const a = PHASE_AUTHORITY_MATRIX.FREEZE;
            expect(a.can_approve).toBe(true);
            expect(a.can_override).toBe(true);
            expect(a.max_risk).toBe('R4');
        });
    });

    // R4 in RISK_OPTIONS
    describe('RISK_OPTIONS includes R4', () => {
        it('has R4 option', () => {
            expect(RISK_OPTIONS.find(o => o.value === 'R4')).toBeDefined();
            expect(RISK_OPTIONS.find(o => o.value === 'R4')?.labelEn).toBe('Critical');
        });
    });

    // isRiskAllowed with R4
    describe('isRiskAllowed with R4', () => {
        it('R4 is blocked in INTAKE', () => {
            expect(isRiskAllowed('R4' as CVFRiskLevel, 'INTAKE')).toBe(false);
        });

        it('R4 is allowed in FREEZE', () => {
            expect(isRiskAllowed('R4' as CVFRiskLevel, 'FREEZE')).toBe(true);
        });

        it('R4 is blocked in BUILD', () => {
            expect(isRiskAllowed('R4' as CVFRiskLevel, 'BUILD')).toBe(false);
        });
    });

    // Phase-aware risk gate
    describe('evaluateRiskGate phase-aware R4', () => {
        it('R4 without phase returns BLOCK', () => {
            const result = evaluateRiskGate('R4', 'full');
            expect(result.status).toBe('BLOCK');
        });

        it('R4 with phase FREEZE returns NEEDS_APPROVAL', () => {
            const result = evaluateRiskGate('R4', 'full', 'FREEZE');
            expect(result.status).toBe('NEEDS_APPROVAL');
            expect(result.reason).toContain('executive approval');
        });

        it('R4 with phase BUILD returns BLOCK', () => {
            const result = evaluateRiskGate('R4', 'full', 'BUILD');
            expect(result.status).toBe('BLOCK');
        });
    });

    // getRiskSeverityColor
    describe('getRiskSeverityColor', () => {
        it('returns correct colors', () => {
            expect(getRiskSeverityColor('R0')).toBe('gray-400');
            expect(getRiskSeverityColor('R1')).toBe('green-500');
            expect(getRiskSeverityColor('R4')).toBe('red-900');
        });
    });
});
