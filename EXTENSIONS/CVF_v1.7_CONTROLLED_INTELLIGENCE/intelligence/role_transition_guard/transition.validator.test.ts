import { describe, it, expect } from 'vitest'
import { validateTransition } from './transition.validator'
import { AgentRole } from './role.types'

describe('transition.validator — validateTransition', () => {
    describe('allowed transitions', () => {
        it('PLAN → RESEARCH', () => expect(validateTransition(AgentRole.PLAN, AgentRole.RESEARCH)).toBe(true))
        it('PLAN → DESIGN', () => expect(validateTransition(AgentRole.PLAN, AgentRole.DESIGN)).toBe(true))
        it('RESEARCH → PLAN', () => expect(validateTransition(AgentRole.RESEARCH, AgentRole.PLAN)).toBe(true))
        it('DESIGN → BUILD', () => expect(validateTransition(AgentRole.DESIGN, AgentRole.BUILD)).toBe(true))
        it('BUILD → TEST', () => expect(validateTransition(AgentRole.BUILD, AgentRole.TEST)).toBe(true))
        it('BUILD → DEBUG', () => expect(validateTransition(AgentRole.BUILD, AgentRole.DEBUG)).toBe(true))
        it('TEST → REVIEW', () => expect(validateTransition(AgentRole.TEST, AgentRole.REVIEW)).toBe(true))
        it('TEST → DEBUG', () => expect(validateTransition(AgentRole.TEST, AgentRole.DEBUG)).toBe(true))
        it('DEBUG → BUILD', () => expect(validateTransition(AgentRole.DEBUG, AgentRole.BUILD)).toBe(true))
        it('REVIEW → PLAN', () => expect(validateTransition(AgentRole.REVIEW, AgentRole.PLAN)).toBe(true))
        it('RISK → PLAN', () => expect(validateTransition(AgentRole.RISK, AgentRole.PLAN)).toBe(true))
    })

    describe('blocked transitions (CVF safety)', () => {
        it('PLAN → BUILD (skip Design)', () => expect(validateTransition(AgentRole.PLAN, AgentRole.BUILD)).toBe(false))
        it('PLAN → TEST', () => expect(validateTransition(AgentRole.PLAN, AgentRole.TEST)).toBe(false))
        it('RESEARCH → BUILD', () => expect(validateTransition(AgentRole.RESEARCH, AgentRole.BUILD)).toBe(false))
        it('BUILD → REVIEW (skip Test)', () => expect(validateTransition(AgentRole.BUILD, AgentRole.REVIEW)).toBe(false))
        it('REVIEW → BUILD (must re-plan)', () => expect(validateTransition(AgentRole.REVIEW, AgentRole.BUILD)).toBe(false))
        it('DESIGN → REVIEW', () => expect(validateTransition(AgentRole.DESIGN, AgentRole.REVIEW)).toBe(false))
    })
})
