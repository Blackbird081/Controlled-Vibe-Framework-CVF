// integration/risk.bridge.ts
// Bridge between Safety Runtime (v1.7.1) and Intelligence (v1.7) risk models.
// CVF Doctrine: Both modules MUST agree on risk semantics.
//
// Safety Runtime: LOW / MEDIUM / HIGH / CRITICAL (score 0-200+)
// Intelligence:   R0 / R1 / R2 / R3 (normalized 0.0-1.0)
//
// This bridge converts between the two systems.

import { type RiskLevel } from '../../CVF_v1.7.1_SAFETY_RUNTIME/policy/risk.engine'
import { type CVFRiskLevel, scoreToRiskLevel, riskLevelToScore } from '../core/governance/risk.mapping'
import { getRiskLabel, formatRiskDisplay, type SupportedLocale } from '../core/governance/risk.labels'

// ═══════════════════════════════════════
// Safety Runtime → Intelligence mapping
// ═══════════════════════════════════════

const RUNTIME_TO_CVF: Record<RiskLevel, CVFRiskLevel> = {
    LOW: 'R0',
    MEDIUM: 'R1',
    HIGH: 'R2',
    CRITICAL: 'R3'
}

const CVF_TO_RUNTIME: Record<CVFRiskLevel, RiskLevel> = {
    R0: 'LOW',
    R1: 'MEDIUM',
    R2: 'HIGH',
    R3: 'CRITICAL'
}

/**
 * Convert Safety Runtime risk level to CVF Intelligence risk level.
 */
export function runtimeToCVFRisk(level: RiskLevel): CVFRiskLevel {
    return RUNTIME_TO_CVF[level]
}

/**
 * Convert CVF Intelligence risk level to Safety Runtime risk level.
 */
export function cvfToRuntimeRisk(level: CVFRiskLevel): RiskLevel {
    return CVF_TO_RUNTIME[level]
}

/**
 * Normalize a Safety Runtime raw score (0-200+) to Intelligence normalized score (0.0-1.0).
 * Uses the same thresholds as RiskEngine.assess():
 *   < 35 → LOW → R0 score
 *   35-69 → MEDIUM → R1 score
 *   70-119 → HIGH → R2 score
 *   >= 120 → CRITICAL → R3 score
 */
export function normalizeRuntimeScore(rawScore: number): number {
    if (rawScore >= 120) return riskLevelToScore('R3') // 0.92
    if (rawScore >= 70) return riskLevelToScore('R2') // 0.72
    if (rawScore >= 35) return riskLevelToScore('R1') // 0.45
    return riskLevelToScore('R0') // 0.1
}

/**
 * Full bridge: Safety Runtime assessment → Non-coder display string.
 * Example: CRITICAL → R3 → "🔴 Nguy hiểm"
 */
export function runtimeRiskToDisplay(
    level: RiskLevel,
    locale: SupportedLocale = 'vi'
): string {
    const cvfLevel = runtimeToCVFRisk(level)
    return formatRiskDisplay(cvfLevel, locale)
}
