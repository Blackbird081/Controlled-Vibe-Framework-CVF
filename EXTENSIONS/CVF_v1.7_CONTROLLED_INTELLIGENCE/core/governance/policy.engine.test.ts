import { describe, it, expect } from 'vitest'
import { evaluatePolicy } from './policy.engine'
import { GOVERNANCE_HARD_RISK_THRESHOLD, GOVERNANCE_ESCALATION_THRESHOLD } from './governance.constants'

const ctx = (riskScore: number) => ({
    sessionId: 'test-session',
    role: 'BUILD',
    riskScore
})

describe('policy.engine — evaluatePolicy', () => {
    it('ALLOW when risk is below escalation threshold', () => {
        const result = evaluatePolicy(ctx(0.3))
        expect(result.decision).toBe('ALLOW')
    })

    it('ALLOW at 0.0 (minimum risk)', () => {
        expect(evaluatePolicy(ctx(0)).decision).toBe('ALLOW')
    })

    it('ESCALATE when risk equals escalation threshold (0.7)', () => {
        const result = evaluatePolicy(ctx(GOVERNANCE_ESCALATION_THRESHOLD))
        expect(result.decision).toBe('ESCALATE')
        expect(result.reason).toBeDefined()
    })

    it('ESCALATE when risk is between thresholds', () => {
        expect(evaluatePolicy(ctx(0.85)).decision).toBe('ESCALATE')
    })

    it('BLOCK when risk equals hard threshold (0.9)', () => {
        const result = evaluatePolicy(ctx(GOVERNANCE_HARD_RISK_THRESHOLD))
        expect(result.decision).toBe('BLOCK')
        expect(result.reason).toBeDefined()
    })

    it('BLOCK when risk is 1.0 (maximum)', () => {
        expect(evaluatePolicy(ctx(1.0)).decision).toBe('BLOCK')
    })

    it('includes timestamp in every result', () => {
        const before = Date.now()
        const result = evaluatePolicy(ctx(0.5))
        expect(result.timestamp).toBeGreaterThanOrEqual(before)
    })

    // CVF Doctrine boundary test: exact threshold values
    it('boundary: 0.69 → ALLOW, 0.70 → ESCALATE', () => {
        expect(evaluatePolicy(ctx(0.69)).decision).toBe('ALLOW')
        expect(evaluatePolicy(ctx(0.70)).decision).toBe('ESCALATE')
    })

    it('boundary: 0.89 → ESCALATE, 0.90 → BLOCK', () => {
        expect(evaluatePolicy(ctx(0.89)).decision).toBe('ESCALATE')
        expect(evaluatePolicy(ctx(0.90)).decision).toBe('BLOCK')
    })
})
