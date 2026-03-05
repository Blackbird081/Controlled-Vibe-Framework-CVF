// CVF v1.8 — Escalation Controller (Governance Brain)
// Manages escalation tiers L0–L3 and enforces policy per risk level

import type { EscalationLevel, EscalationEvent, RiskLevel } from '../../types/index.js'
import { getSeverity } from '../risk/severity.matrix.js'

const _events: EscalationEvent[] = []

export class EscalationViolationError extends Error {
    constructor(
        public readonly executionId: string,
        public readonly level: EscalationLevel,
        public readonly reason: string
    ) {
        super(
            `[CVF v1.8] ESCALATION L${level}: executionId=${executionId} — ${reason}. ` +
            (level === 3 ? 'HARD STOP. Execution aborted.' : 'Human approval required.')
        )
        this.name = 'EscalationViolationError'
    }
}

export class EscalationController {
    /**
     * Evaluate a risk level and decide escalation action.
     * Throws EscalationViolationError for L2 (require approval) and L3 (hard stop).
     * Logs L0 and L1 silently.
     */
    evaluate(executionId: string, riskLevel: RiskLevel): EscalationLevel {
        const severity = getSeverity(riskLevel)
        const level = severity.escalation

        const event: EscalationEvent = {
            executionId,
            level,
            reason: severity.label,
            timestamp: Date.now(),
        }
        _events.push(event)

        if (severity.hardStop) {
            throw new EscalationViolationError(executionId, 3, `Risk ${riskLevel}: ${severity.label}`)
        }

        // requireHuman = true for R2 and R3 — ALWAYS throw to force human in loop
        if (severity.requireHuman) {
            throw new EscalationViolationError(
                executionId,
                level as EscalationLevel,
                `Risk ${riskLevel} requires human approval`
            )
        }

        return level
    }

    /**
     * Escalate due to anomaly (not risk level).
     * Anomaly always at least L1.
     */
    escalateAnomaly(executionId: string, reason: string): void {
        const event: EscalationEvent = {
            executionId,
            level: 2,
            reason: `ANOMALY: ${reason}`,
            timestamp: Date.now(),
        }
        _events.push(event)
        throw new EscalationViolationError(executionId, 2, reason)
    }

    getEvents(executionId?: string): EscalationEvent[] {
        if (executionId) return _events.filter(e => e.executionId === executionId)
        return [..._events]
    }

    /** For testing only */
    _clearAll(): void {
        _events.length = 0
    }
}
