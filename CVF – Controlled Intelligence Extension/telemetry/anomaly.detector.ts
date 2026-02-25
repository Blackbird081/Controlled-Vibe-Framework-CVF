// anomaly.detector.ts
// Telemetry anomaly detection — monitors metrics and triggers governance lock.
// Passive telemetry becomes protective: detect anomalies → restrict reasoning.

import { getMistakeRateInWindow } from "./mistake_rate_tracker"
import { getEleganceTrend } from "./elegance_score_tracker"
import { getVerificationScoreInWindow } from "./verification_metrics"
import { logGovernanceEvent } from "./governance_audit_log"

export interface AnomalyReport {
    anomalies: AnomalyItem[]
    governanceLockTriggered: boolean
    recommendedMode: "NORMAL" | "STRICT" | "LOCKDOWN"
}

export interface AnomalyItem {
    metric: string
    currentValue: number
    threshold: number
    severity: "WARNING" | "CRITICAL"
    description: string
}

export interface AnomalyThresholds {
    mistakeRateWarning: number     // default 0.15 (15%)
    mistakeRateCritical: number    // default 0.30 (30%)
    eleganceDegradation: number    // default -0.2 (recent 20% worse than overall)
    verificationDropWarning: number // default 0.7 (70%)
    verificationDropCritical: number // default 0.5 (50%)
    windowMs: number               // default 30 minutes
}

const DEFAULT_THRESHOLDS: AnomalyThresholds = {
    mistakeRateWarning: 0.15,
    mistakeRateCritical: 0.30,
    eleganceDegradation: -0.2,
    verificationDropWarning: 0.70,
    verificationDropCritical: 0.50,
    windowMs: 30 * 60 * 1000  // 30 minutes
}

/**
 * Run anomaly detection across all telemetry metrics.
 * Returns anomaly report with recommended governance mode.
 */
export function detectAnomalies(
    thresholds: Partial<AnomalyThresholds> = {}
): AnomalyReport {

    const cfg = { ...DEFAULT_THRESHOLDS, ...thresholds }
    const anomalies: AnomalyItem[] = []

    // 1. Mistake rate spike
    const mistakeRate = getMistakeRateInWindow(cfg.windowMs)
    if (mistakeRate >= cfg.mistakeRateCritical) {
        anomalies.push({
            metric: "mistake_rate",
            currentValue: mistakeRate,
            threshold: cfg.mistakeRateCritical,
            severity: "CRITICAL",
            description: `Mistake rate ${(mistakeRate * 100).toFixed(1)}% exceeds critical threshold`
        })
    } else if (mistakeRate >= cfg.mistakeRateWarning) {
        anomalies.push({
            metric: "mistake_rate",
            currentValue: mistakeRate,
            threshold: cfg.mistakeRateWarning,
            severity: "WARNING",
            description: `Mistake rate ${(mistakeRate * 100).toFixed(1)}% exceeds warning threshold`
        })
    }

    // 2. Elegance degradation
    const eleganceTrend = getEleganceTrend()
    const eleganceDelta = eleganceTrend.recent - eleganceTrend.overall
    if (eleganceDelta <= cfg.eleganceDegradation) {
        anomalies.push({
            metric: "elegance_degradation",
            currentValue: eleganceDelta,
            threshold: cfg.eleganceDegradation,
            severity: "WARNING",
            description: `Elegance dropping: recent ${eleganceTrend.recent.toFixed(2)} vs overall ${eleganceTrend.overall.toFixed(2)}`
        })
    }

    // 3. Verification score drop
    const verificationScore = getVerificationScoreInWindow(cfg.windowMs)
    if (verificationScore > 0 && verificationScore <= cfg.verificationDropCritical) {
        anomalies.push({
            metric: "verification_score",
            currentValue: verificationScore,
            threshold: cfg.verificationDropCritical,
            severity: "CRITICAL",
            description: `Verification score ${(verificationScore * 100).toFixed(1)}% below critical threshold`
        })
    } else if (verificationScore > 0 && verificationScore <= cfg.verificationDropWarning) {
        anomalies.push({
            metric: "verification_score",
            currentValue: verificationScore,
            threshold: cfg.verificationDropWarning,
            severity: "WARNING",
            description: `Verification score ${(verificationScore * 100).toFixed(1)}% below warning threshold`
        })
    }

    // Determine governance response
    const criticalCount = anomalies.filter(a => a.severity === "CRITICAL").length
    const warningCount = anomalies.filter(a => a.severity === "WARNING").length

    let recommendedMode: AnomalyReport["recommendedMode"] = "NORMAL"
    let governanceLockTriggered = false

    if (criticalCount >= 2) {
        recommendedMode = "LOCKDOWN"
        governanceLockTriggered = true
        logGovernanceEvent("ANOMALY_LOCKDOWN", `${criticalCount} critical anomalies → LOCKDOWN mode`)
    } else if (criticalCount >= 1 || warningCount >= 2) {
        recommendedMode = "STRICT"
        logGovernanceEvent("ANOMALY_STRICT", `${criticalCount} critical + ${warningCount} warnings → STRICT mode`)
    }

    return { anomalies, governanceLockTriggered, recommendedMode }
}
