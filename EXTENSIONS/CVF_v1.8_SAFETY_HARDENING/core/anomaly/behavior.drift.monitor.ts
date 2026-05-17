// CVF v1.8 — Behavior Drift Monitor + Stability Index
// Tracks execution patterns over time and auto-regulates AI autonomy.

import type { ExecutionMetrics, StabilityReport } from '../../types/index.js'

const _history: ExecutionMetrics[] = []

/**
 * Compute the Stability Index from recent executions.
 * Formula from GOVERNANCE_MODEL.md:
 *   stabilityIndex = 100
 *     - (rollbackRate × 20)
 *     - (anomalyRate × 25)
 *     - (riskEscalationRate × 15)
 *     - (mutationVolatility × 20)
 *     - (driftScore × 20)
 */
export function computeStabilityIndex(metrics: ExecutionMetrics[]): number {
    if (metrics.length === 0) return 100

    const n = metrics.length
    const rollbackRate = metrics.filter(m => m.rollback).length / n
    const anomalyRate = metrics.filter(m => m.anomalyCount > 0).length / n
    const riskEscalationRate = metrics.filter(m => m.riskEscalated).length / n
    const avgMutationSize = metrics.reduce((sum, m) => sum + m.mutationSize, 0) / n
    const mutationVolatility = Math.min(1, avgMutationSize / 500) // normalize to 0-1
    const avgDrift = metrics.reduce((sum, m) => sum + m.driftScore, 0) / n

    const index =
        100 -
        rollbackRate * 20 -
        anomalyRate * 25 -
        riskEscalationRate * 15 -
        mutationVolatility * 20 -
        avgDrift * 20

    return Math.max(0, Math.round(index * 10) / 10)
}

export class DriftMonitor {
    /**
     * Record metrics for a completed execution.
     */
    record(metrics: ExecutionMetrics): void {
        _history.push(metrics)
        // Keep only last 20 executions for drift analysis
        if (_history.length > 20) _history.shift()
    }

    /**
     * Compute drift score for the current window.
     * Score 0–1: 0 = stable, 1 = high drift.
     */
    computeDriftScore(): number {
        if (_history.length < 2) return 0

        const recent = _history.slice(-5)
        const older = _history.slice(0, -5)

        if (older.length === 0) return 0

        const recentRollbackRate = recent.filter(m => m.rollback).length / recent.length
        const olderRollbackRate = older.filter(m => m.rollback).length / older.length

        const recentAnomalyRate = recent.filter(m => m.anomalyCount > 0).length / recent.length
        const olderAnomalyRate = older.filter(m => m.anomalyCount > 0).length / older.length

        const rollbackDrift = Math.max(0, recentRollbackRate - olderRollbackRate)
        const anomalyDrift = Math.max(0, recentAnomalyRate - olderAnomalyRate)

        return Math.min(1, (rollbackDrift + anomalyDrift) / 2)
    }

    /**
     * Get stability report with auto-regulation recommendations.
     */
    getStabilityReport(): StabilityReport {
        const drift = this.computeDriftScore()
        const metricsWithDrift = _history.map(m => ({ ...m, driftScore: drift }))
        const index = computeStabilityIndex(metricsWithDrift)

        return {
            index,
            forcedSafeMode: index < 70,
            creativeDisabled: index < 50,
        }
    }

    getHistory(): ExecutionMetrics[] {
        return [..._history]
    }

    /** For testing only */
    _clearAll(): void {
        _history.length = 0
    }
}
