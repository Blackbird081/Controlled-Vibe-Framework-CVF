import { describe, it, expect } from 'vitest';
import {
    buildGovernanceSpecBlock,
    getAllowedActions,
    isRiskAllowed,
    RISK_OPTIONS,
    type GovernanceState,
} from './governance-context';
import { getRiskSeverityColor } from './risk-check';
import { AUTHORITY_MATRIX } from 'cvf-guard-contract/guards/authority-gate.guard';
import { PHASE_ROLE_MATRIX } from 'cvf-guard-contract/guards/phase-gate.guard';
import { PHASE_ORDER, RISK_NUMERIC } from 'cvf-guard-contract/types';
import { GENERATED_GOVERNANCE_MODEL } from './generated/governance-model.generated';
import { isBuildPhase, normalizeWebPhaseInput } from './governance-model';
import { buildUnifiedGovernanceState } from './governance-state-contract';

describe('Web role and phase guidance', () => {
    it('projects the phase, risk, role, and authority declarations from Local', () => {
        const model = GENERATED_GOVERNANCE_MODEL;
        expect(model.phaseOrder).toEqual(PHASE_ORDER);
        expect(model.riskOrder).toEqual(Object.keys(RISK_NUMERIC));
        expect(model.riskLabels.R0).toBe('Passive');
        expect(model.roles).toEqual(Object.keys(AUTHORITY_MATRIX));
        expect(model.authorityMatrix).toEqual(AUTHORITY_MATRIX);
        expect(model.phaseRoleMatrix).toEqual(PHASE_ROLE_MATRIX);
    });

    it('caps the Builder role at R2 in BUILD without adding approval authority', () => {
        expect(isRiskAllowed('R2', 'BUILD', 'BUILDER')).toBe(true);
        expect(isRiskAllowed('R3', 'BUILD', 'BUILDER')).toBe(false);
        expect(getAllowedActions('BUILD', 'BUILDER')).toContain('build');
        expect(getAllowedActions('BUILD', 'BUILDER')).not.toContain('approve');
    });

    it('shows the Governor can override only in REVIEW', () => {
        expect(getAllowedActions('REVIEW', 'GOVERNOR')).toContain('override');
        expect(isRiskAllowed('R3', 'REVIEW', 'GOVERNOR')).toBe(true);
        expect(getAllowedActions('FREEZE', 'GOVERNOR')).toEqual(['lock', 'enforce', 'freeze', 'read']);
        expect(isRiskAllowed('R3', 'FREEZE', 'GOVERNOR')).toBe(true);
    });

    it('rejects a forbidden phase and role cell even at R0', () => {
        expect(getAllowedActions('BUILD', 'OBSERVER')).toEqual([]);
        expect(isRiskAllowed('R0', 'BUILD', 'OBSERVER')).toBe(false);
    });

    it('respects the phase allowlist when a role also has an authority cell', () => {
        expect(AUTHORITY_MATRIX.SERVICE_AGENT.BUILD.allowed).toBe(true);
        expect(getAllowedActions('BUILD', 'SERVICE_AGENT')).toEqual([]);
        expect(isRiskAllowed('R0', 'BUILD', 'SERVICE_AGENT')).toBe(false);
    });

    it('excludes R4 from risk choices and marks a saved R4 value blocked in spec guidance', () => {
        const state: GovernanceState = {
            phase: 'FREEZE',
            role: 'GOVERNOR',
            riskLevel: 'R4',
            toolkitEnabled: true,
        };
        expect(RISK_OPTIONS.map(option => option.value)).toEqual(['R0', 'R1', 'R2', 'R3']);
        expect(RISK_OPTIONS.map(option => option.labelEn)).toEqual(['Minimal', 'Controlled', 'Elevated', 'Critical']);
        expect(isRiskAllowed('R4', 'FREEZE', 'GOVERNOR')).toBe(false);
        expect(buildGovernanceSpecBlock(state, 'en')).toContain('R4 (Blocked)');
        expect(buildGovernanceSpecBlock(state, 'vi')).toContain('R4 (B\u1ecb ch\u1eb7n)');
        expect(getRiskSeverityColor('R4')).toBe('red-900');
    });

    it.each(['BUILD', '  build  ', 'PHASE C', 'phase c', 'C'])('recognizes the BUILD input %s', input => {
        expect(isBuildPhase(input)).toBe(true);
    });

    it('normalizes legacy input without extending the runtime phase order', () => {
        expect(normalizeWebPhaseInput('Discovery')).toBe('INTAKE');
        expect(normalizeWebPhaseInput('B')).toBe('DESIGN');
        expect(normalizeWebPhaseInput(' Phase d ')).toBe('REVIEW');
        expect(normalizeWebPhaseInput('phase E')).toBe('FREEZE');
        expect(normalizeWebPhaseInput('WORK ORDER')).toBeUndefined();
        expect(isBuildPhase({ phase: 'BUILD' })).toBe(false);
        expect(isBuildPhase('SPEC')).toBe(false);
    });

    it('preserves authority fields in the legacy execute response snapshot', () => {
        const snapshot = buildUnifiedGovernanceState({
            enforcementStatus: 'BLOCK',
            reasons: [],
            source: 'client',
            cvfPhase: 'Phase E',
            cvfRiskLevel: 'R4',
        });
        expect(snapshot).toMatchObject({
            phase: 'FREEZE',
            riskLevel: 'R4',
            authority: { can_approve: true, can_override: true, max_risk: 'R4' },
        });
    });
});
