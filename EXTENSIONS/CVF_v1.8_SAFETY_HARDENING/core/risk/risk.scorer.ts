// CVF v1.8 — Risk Scorer
// Implements formula: Risk Score = (Impact × Scope × Uncertainty) + Reversibility
// Maps to R-level per governance/compat/risk_level_mapping.md

import type { RiskDimensions, RiskLevel, RiskObject } from '../../types/index.js'
import { createHash } from 'crypto'

export function scoreToRiskLevel(score: number): RiskLevel {
    if (score <= 2) return 'R0'
    if (score <= 5) return 'R1'
    if (score <= 10) return 'R2'
    if (score <= 15) return 'R3'
    return 'R3+'
}

export function computeRiskScore(d: RiskDimensions): number {
    // Clamp all dimensions to valid ranges
    const impact = Math.min(5, Math.max(0, Math.round(d.impact)))
    const scope = Math.min(5, Math.max(0, Math.round(d.scope)))
    const uncertainty = Math.min(5, Math.max(0, Math.round(d.uncertainty)))
    const reversibility = Math.min(2, Math.max(-2, Math.round(d.reversibility)))

    return impact * scope * uncertainty + reversibility
}

export function hashRiskObject(score: number, level: RiskLevel, breakdown: RiskDimensions): string {
    const payload = JSON.stringify({ score, level, breakdown })
    return createHash('sha256').update(payload).digest('hex').slice(0, 16)
}

export class RiskScorer {
    /**
     * Scores a set of dimensions and returns an UNLOCKED RiskObject.
     * Caller must call RiskLock.lock() to freeze it.
     */
    score(executionId: string, dimensions: RiskDimensions): Omit<RiskObject, 'locked'> & { locked: false } {
        const score = computeRiskScore(dimensions)
        const level = scoreToRiskLevel(score)
        const hash = hashRiskObject(score, level, dimensions)

        return {
            executionId,
            score,
            level,
            breakdown: dimensions,
            hash,
            locked: false,
        }
    }
}
