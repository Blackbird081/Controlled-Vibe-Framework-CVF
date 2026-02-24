// risk.mapping.ts
// Maps CVF base risk levels (R0-R3) to agent riskScore (0.0-1.0).
// CVF gốc là chuẩn tuyệt đối — mapping này đảm bảo extension tuân theo.
//
// CVF Risk Levels (from governance/):
//   R0 = Low        → "standard tasks, no special approval"
//   R1 = Medium     → "requires lead review"
//   R2 = High       → "requires senior approval"
//   R3 = Critical   → "requires governance board sign-off"

export type CVFRiskLevel = "R0" | "R1" | "R2" | "R3"

/**
 * Map CVF risk level (R0-R3) → normalized riskScore (0.0-1.0)
 * Used when converting human governance decisions into agent parameters.
 */
export const CVF_RISK_SCORE_MAP: Record<CVFRiskLevel, number> = {
    R0: 0.1,   // Low — allow freely
    R1: 0.45,  // Medium — allow, log warning
    R2: 0.72,  // High — trigger ESCALATE threshold (>= 0.7 per constants)
    R3: 0.92   // Critical — trigger BLOCK threshold (>= 0.9 per constants)
}

/**
 * Map normalized riskScore (0.0-1.0) → CVF risk level (R0-R3)
 * Used when surfacing agent results back to human reviewers in CVF terms.
 */
export function scoreToRiskLevel(score: number): CVFRiskLevel {
    if (score >= 0.9) return "R3"
    if (score >= 0.7) return "R2"
    if (score >= 0.35) return "R1"
    return "R0"
}

export function riskLevelToScore(level: CVFRiskLevel): number {
    return CVF_RISK_SCORE_MAP[level]
}
