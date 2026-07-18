import { describe, it, expect } from 'vitest';
import { evaluateEnforcement } from './enforcement';
import { SpecGateField } from './spec-gate';
import {
    MEMORY_READOUT_ELIGIBILITY_POLICY_VERSION,
    type MemoryReadoutEligibilityResult,
    type MemoryReadoutEligibilityState,
} from 'cvf-learning-plane-foundation/memory-runtime';

describe('evaluateEnforcement', () => {
    const memoryEligibility = (state: MemoryReadoutEligibilityState): MemoryReadoutEligibilityResult => ({
        contractVersion: MEMORY_READOUT_ELIGIBILITY_POLICY_VERSION,
        state,
        reason: `test:${state}`,
        rawMemoryReleased: false,
        canReinject: false,
    });

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
        expect(result.governanceStateSnapshot.approval.status).toBe('PENDING');
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
        expect(result.governanceStateSnapshot.approval.status).toBe('NOT_REQUIRED');
    });

    it('blocks revoked memory eligibility before execution', () => {
        const result = evaluateEnforcement({
            mode: 'simple',
            content: 'Risk level: R0',
            budgetOk: true,
            memoryEligibility: memoryEligibility('REVOKED'),
        });
        expect(result.status).toBe('BLOCK');
        expect(result.reasons).toContain('memory_access_revoked');
    });

    it('blocks denied memory eligibility before execution', () => {
        const result = evaluateEnforcement({
            mode: 'simple',
            content: 'Risk level: R0',
            budgetOk: true,
            memoryEligibility: memoryEligibility('READOUT_DENIED'),
        });
        expect(result.status).toBe('BLOCK');
        expect(result.reasons).toContain('memory_readout_denied');
    });

    it.each(['NO_AUTHORITY_SOURCE', 'OUT_OF_SCOPE_FOR_ACTOR', 'STALE_NEEDS_REFRESH'] as const)('keeps %s memory eligibility advisory-only', (state) => {
        const result = evaluateEnforcement({
            mode: 'simple',
            content: 'Risk level: R0',
            budgetOk: true,
            memoryEligibility: memoryEligibility(state),
        });
        expect(result.status).toBe('ALLOW');
        expect(result.reasons).not.toContain('memory_access_revoked');
        expect(result.reasons).not.toContain('memory_readout_denied');
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

    it('blocks build actions when skill preflight is missing', () => {
        const result = evaluateEnforcement({
            mode: 'governance',
            content: 'Implement API endpoints and write code.',
            budgetOk: true,
            cvfPhase: 'BUILD',
            requiresSkillPreflight: true,
        });
        expect(result.status).toBe('BLOCK');
        expect(result.reasons.join(' ')).toContain('Skill Preflight declaration is required');
        expect(result.skillPreflight?.required).toBe(true);
        expect(result.skillPreflight?.declared).toBe(false);
    });

    it('allows build actions with explicit skill preflight declaration', () => {
        const result = evaluateEnforcement({
            mode: 'governance',
            content: 'Implement API endpoints and write code.',
            budgetOk: true,
            cvfPhase: 'BUILD',
            registryBinding: {
                agentId: 'AI_ASSISTANT_V1',
                certificationStatus: 'ACTIVE',
                approvedPhases: ['BUILD', 'REVIEW'],
                approvedSkills: ['CVF_CORE_SKILL_PREFLIGHT_GOVERNANCE'],
                lastSelfUatDate: new Date(Date.now() - (7 * 24 * 60 * 60 * 1000)).toISOString(),
            },
            requiresSkillPreflight: true,
            skillPreflight: {
                passed: true,
                recordRef: 'governance/toolkit/03_CONTROL/SKILL_PREFLIGHT_RECORD.md',
                skillIds: ['CVF_CORE_SKILL_PREFLIGHT_GOVERNANCE'],
            },
        });
        expect(result.status).toBe('ALLOW');
        expect(result.skillPreflight?.declared).toBe(true);
        expect(result.skillPreflight?.source).toBe('explicit');
        expect(result.governanceStateSnapshot.skillPreflight.declared).toBe(true);
        expect(result.governanceStateSnapshot.phase).toBe('BUILD');
        expect(result.governanceStateSnapshot.registry.source).toBe('registry');
        expect(result.governanceStateSnapshot.uat.status).toBe('VALIDATED');
    });

    it('allows build actions when declaration appears in content', () => {
        const result = evaluateEnforcement({
            mode: 'governance',
            content: 'Skill Preflight PASS. SKILL_PREFLIGHT_RECORD: XD_App/DOCUMENTS/SKILL_PREFLIGHT_RECORD.md',
            budgetOk: true,
            cvfPhase: 'BUILD',
            requiresSkillPreflight: true,
        });
        expect(result.status).toBe('ALLOW');
        expect(result.skillPreflight?.declared).toBe(true);
        expect(result.skillPreflight?.source).toBe('content');
    });
});
