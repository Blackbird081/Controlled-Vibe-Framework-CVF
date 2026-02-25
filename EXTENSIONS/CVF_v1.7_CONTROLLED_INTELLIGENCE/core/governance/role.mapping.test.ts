import { describe, it, expect } from 'vitest'
import { AgentRole } from '../../intelligence/role_transition_guard/role.types'
import {
    CVF_PHASE_PRIMARY_ROLE,
    CVF_PHASE_ALLOWED_ROLES,
    getPrimaryRoleForPhase,
    isRoleAllowedInPhase,
    getPhaseForRole
} from './role.mapping'

describe('role.mapping — CVF Phase ↔ AgentRole', () => {
    describe('getPrimaryRoleForPhase', () => {
        it('Phase A → RESEARCH', () => expect(getPrimaryRoleForPhase('A')).toBe(AgentRole.RESEARCH))
        it('Phase B → DESIGN', () => expect(getPrimaryRoleForPhase('B')).toBe(AgentRole.DESIGN))
        it('Phase C → BUILD', () => expect(getPrimaryRoleForPhase('C')).toBe(AgentRole.BUILD))
        it('Phase D → REVIEW', () => expect(getPrimaryRoleForPhase('D')).toBe(AgentRole.REVIEW))
    })

    describe('isRoleAllowedInPhase — allowed', () => {
        it('PLAN allowed in Phase A', () => expect(isRoleAllowedInPhase(AgentRole.PLAN, 'A')).toBe(true))
        it('RESEARCH allowed in Phase A', () => expect(isRoleAllowedInPhase(AgentRole.RESEARCH, 'A')).toBe(true))
        it('DESIGN allowed in Phase B', () => expect(isRoleAllowedInPhase(AgentRole.DESIGN, 'B')).toBe(true))
        it('BUILD allowed in Phase C', () => expect(isRoleAllowedInPhase(AgentRole.BUILD, 'C')).toBe(true))
        it('TEST allowed in Phase C', () => expect(isRoleAllowedInPhase(AgentRole.TEST, 'C')).toBe(true))
        it('REVIEW allowed in Phase D', () => expect(isRoleAllowedInPhase(AgentRole.REVIEW, 'D')).toBe(true))
    })

    describe('isRoleAllowedInPhase — blocked (CVF safety)', () => {
        it('BUILD NOT allowed in Phase A (Discovery)', () => {
            expect(isRoleAllowedInPhase(AgentRole.BUILD, 'A')).toBe(false)
        })
        it('DEBUG NOT allowed in Phase A (Discovery)', () => {
            expect(isRoleAllowedInPhase(AgentRole.DEBUG, 'A')).toBe(false)
        })
        it('BUILD NOT allowed in Phase D (Review)', () => {
            expect(isRoleAllowedInPhase(AgentRole.BUILD, 'D')).toBe(false)
        })
        it('TEST NOT allowed in Phase A (Discovery)', () => {
            expect(isRoleAllowedInPhase(AgentRole.TEST, 'A')).toBe(false)
        })
    })

    describe('getPhaseForRole', () => {
        it('BUILD → Phase C', () => expect(getPhaseForRole(AgentRole.BUILD)).toBe('C'))
        it('REVIEW → Phase D', () => expect(getPhaseForRole(AgentRole.REVIEW)).toBe('D'))
        it('PLAN → Phase A (first match)', () => expect(getPhaseForRole(AgentRole.PLAN)).toBe('A'))
    })
})
