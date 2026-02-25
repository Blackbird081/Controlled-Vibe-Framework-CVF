import { describe, it, expect } from 'vitest'
import { assessEntropy } from './entropy.guard'

describe('entropy.guard — assessEntropy', () => {
    describe('calculated from token probabilities', () => {
        it('uniform tokens → low entropy (stable)', () => {
            const result = assessEntropy({ tokenProbabilities: [0.5, 0.5, 0.5, 0.5] })
            expect(result.unstable).toBe(false)
            expect(result.source).toBe('calculated')
            expect(result.entropyScore).toBe(0)
        })

        it('varied tokens → high entropy (unstable)', () => {
            // variance of [0.1, 0.9, 0.1, 0.9] = 0.16, so use lower threshold
            const result = assessEntropy({ tokenProbabilities: [0.1, 0.9, 0.1, 0.9], threshold: 0.1 })
            expect(result.unstable).toBe(true)
            expect(result.source).toBe('calculated')
            expect(result.reason).toContain('exceeds threshold')
        })

        it('single token → 0 variance', () => {
            const result = assessEntropy({ tokenProbabilities: [0.7] })
            expect(result.entropyScore).toBe(0)
            expect(result.unstable).toBe(false)
        })

        it('empty array → falls through to no-data path', () => {
            const result = assessEntropy({ tokenProbabilities: [] })
            expect(result.entropyScore).toBe(0)
            expect(result.unstable).toBe(false)
        })
    })

    describe('caller-provided variance (fallback)', () => {
        it('low variance → stable', () => {
            const result = assessEntropy({ tokenVariance: 0.1 })
            expect(result.unstable).toBe(false)
            expect(result.source).toBe('caller-provided')
        })

        it('high variance → unstable', () => {
            const result = assessEntropy({ tokenVariance: 0.5 })
            expect(result.unstable).toBe(true)
            expect(result.source).toBe('caller-provided')
        })
    })

    describe('no data provided', () => {
        it('assumes stable (safe default)', () => {
            const result = assessEntropy({})
            expect(result.unstable).toBe(false)
            expect(result.entropyScore).toBe(0)
            expect(result.reason).toContain('assuming stable')
        })
    })

    describe('custom threshold', () => {
        it('lower threshold → more sensitive', () => {
            const result = assessEntropy({ tokenVariance: 0.2, threshold: 0.15 })
            expect(result.unstable).toBe(true)
        })

        it('higher threshold → less sensitive', () => {
            const result = assessEntropy({ tokenVariance: 0.2, threshold: 0.5 })
            expect(result.unstable).toBe(false)
        })
    })

    describe('tokenProbabilities takes priority over tokenVariance', () => {
        it('calculates from tokens even when variance is also provided', () => {
            const result = assessEntropy({
                tokenProbabilities: [0.5, 0.5],
                tokenVariance: 0.99
            })
            expect(result.source).toBe('calculated')
            expect(result.entropyScore).toBe(0) // uniform → 0 variance
        })
    })
})
