import { describe, it, expect, beforeEach } from 'vitest'
import {
    checkTransition,
    isSessionLocked,
    getSessionHistory,
    resetSession
} from './recursion.guard'
import { AgentRole } from './role.types'

describe('recursion.guard', () => {
    beforeEach(() => {
        resetSession('test-session')
    })

    describe('normal transitions', () => {
        it('allows first transition', () => {
            const result = checkTransition('test-session', AgentRole.PLAN)
            expect(result.allowed).toBe(true)
            expect(result.currentDepth).toBe(1)
            expect(result.locked).toBe(false)
        })

        it('records transition history', () => {
            checkTransition('test-session', AgentRole.PLAN)
            checkTransition('test-session', AgentRole.RESEARCH)
            expect(getSessionHistory('test-session')).toEqual([AgentRole.PLAN, AgentRole.RESEARCH])
        })
    })

    describe('max transition depth', () => {
        it('locks session after exceeding maxTransitionDepth', () => {
            const cfg = { maxTransitionDepth: 3, maxSameRoleRepetition: 10, maxOscillationCount: 10 }
            checkTransition('test-session', AgentRole.PLAN, cfg)
            checkTransition('test-session', AgentRole.RESEARCH, cfg)
            checkTransition('test-session', AgentRole.DESIGN, cfg)
            // 3 transitions recorded, next should be blocked
            const result = checkTransition('test-session', AgentRole.BUILD, cfg)
            expect(result.allowed).toBe(false)
            expect(result.locked).toBe(true)
            expect(result.reason).toContain('Max transition depth')
        })
    })

    describe('same-role repetition', () => {
        it('blocks after maxSameRoleRepetition consecutive same roles', () => {
            checkTransition('test-session', AgentRole.BUILD, { maxSameRoleRepetition: 2 })
            checkTransition('test-session', AgentRole.BUILD, { maxSameRoleRepetition: 2 })
            const result = checkTransition('test-session', AgentRole.BUILD, { maxSameRoleRepetition: 2 })
            expect(result.allowed).toBe(false)
            expect(result.reason).toContain('repeated')
            expect(result.locked).toBe(false) // doesn't lock, just blocks
        })
    })

    describe('oscillation detection', () => {
        it('locks session on A→B→A→B→A pattern', () => {
            checkTransition('test-session', AgentRole.PLAN, { maxOscillationCount: 2, maxSameRoleRepetition: 10 })
            checkTransition('test-session', AgentRole.DEBUG, { maxOscillationCount: 2, maxSameRoleRepetition: 10 })
            checkTransition('test-session', AgentRole.PLAN, { maxOscillationCount: 2, maxSameRoleRepetition: 10 })
            checkTransition('test-session', AgentRole.DEBUG, { maxOscillationCount: 2, maxSameRoleRepetition: 10 })
            const result = checkTransition('test-session', AgentRole.PLAN, { maxOscillationCount: 2, maxSameRoleRepetition: 10 })
            expect(result.allowed).toBe(false)
            expect(result.locked).toBe(true)
            expect(result.reason).toContain('Oscillation')
        })
    })

    describe('locked session', () => {
        it('rejects all transitions once locked', () => {
            const cfg = { maxTransitionDepth: 2, maxSameRoleRepetition: 10, maxOscillationCount: 10 }
            checkTransition('test-session', AgentRole.PLAN, cfg)
            checkTransition('test-session', AgentRole.RESEARCH, cfg)
            // Now at depth 2, next should lock
            checkTransition('test-session', AgentRole.DESIGN, cfg)

            expect(isSessionLocked('test-session')).toBe(true)
            const result = checkTransition('test-session', AgentRole.BUILD)
            expect(result.allowed).toBe(false)
            expect(result.locked).toBe(true)
        })
    })

    describe('resetSession', () => {
        it('clears history and lock', () => {
            checkTransition('test-session', AgentRole.PLAN)
            resetSession('test-session')
            expect(getSessionHistory('test-session')).toEqual([])
            expect(isSessionLocked('test-session')).toBe(false)
        })
    })
})
