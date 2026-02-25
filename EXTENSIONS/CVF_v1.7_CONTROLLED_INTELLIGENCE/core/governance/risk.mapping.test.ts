import { describe, it, expect } from 'vitest'
import {
    CVF_RISK_SCORE_MAP,
    scoreToRiskLevel,
    riskLevelToScore,
    type CVFRiskLevel
} from './risk.mapping'

describe('risk.mapping — CVF R0-R3 ↔ riskScore', () => {
    describe('riskLevelToScore', () => {
        it('R0 → 0.1 (safe zone)', () => expect(riskLevelToScore('R0')).toBe(0.1))
        it('R1 → 0.45 (attention zone)', () => expect(riskLevelToScore('R1')).toBe(0.45))
        it('R2 → 0.72 (escalation zone)', () => expect(riskLevelToScore('R2')).toBe(0.72))
        it('R3 → 0.92 (block zone)', () => expect(riskLevelToScore('R3')).toBe(0.92))
    })

    describe('scoreToRiskLevel', () => {
        it('0.0 → R0', () => expect(scoreToRiskLevel(0)).toBe('R0'))
        it('0.34 → R0', () => expect(scoreToRiskLevel(0.34)).toBe('R0'))
        it('0.35 → R1 (boundary)', () => expect(scoreToRiskLevel(0.35)).toBe('R1'))
        it('0.5 → R1', () => expect(scoreToRiskLevel(0.5)).toBe('R1'))
        it('0.69 → R1', () => expect(scoreToRiskLevel(0.69)).toBe('R1'))
        it('0.70 → R2 (boundary)', () => expect(scoreToRiskLevel(0.70)).toBe('R2'))
        it('0.85 → R2', () => expect(scoreToRiskLevel(0.85)).toBe('R2'))
        it('0.89 → R2', () => expect(scoreToRiskLevel(0.89)).toBe('R2'))
        it('0.90 → R3 (boundary)', () => expect(scoreToRiskLevel(0.90)).toBe('R3'))
        it('1.0 → R3', () => expect(scoreToRiskLevel(1.0)).toBe('R3'))
    })

    describe('round-trip consistency', () => {
        it('R0 score maps back to R0', () => {
            expect(scoreToRiskLevel(riskLevelToScore('R0'))).toBe('R0')
        })
        it('R1 score maps back to R1', () => {
            expect(scoreToRiskLevel(riskLevelToScore('R1'))).toBe('R1')
        })
        it('R2 score maps back to R2', () => {
            expect(scoreToRiskLevel(riskLevelToScore('R2'))).toBe('R2')
        })
        it('R3 score maps back to R3', () => {
            expect(scoreToRiskLevel(riskLevelToScore('R3'))).toBe('R3')
        })
    })

    describe('CVF alignment: scores trigger correct governance actions', () => {
        it('R2 score (0.72) ≥ ESCALATION_THRESHOLD (0.70)', () => {
            expect(CVF_RISK_SCORE_MAP.R2).toBeGreaterThanOrEqual(0.7)
        })
        it('R3 score (0.92) ≥ HARD_RISK_THRESHOLD (0.90)', () => {
            expect(CVF_RISK_SCORE_MAP.R3).toBeGreaterThanOrEqual(0.9)
        })
        it('R1 score (0.45) < ESCALATION_THRESHOLD (0.70)', () => {
            expect(CVF_RISK_SCORE_MAP.R1).toBeLessThan(0.7)
        })
        it('R0 score (0.10) < ESCALATION_THRESHOLD (0.70)', () => {
            expect(CVF_RISK_SCORE_MAP.R0).toBeLessThan(0.7)
        })
    })
})
