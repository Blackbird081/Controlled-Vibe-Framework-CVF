// CVF v1.8 — Severity Matrix
// Maps RiskLevel to escalation tier and required controls

import type { RiskLevel, EscalationLevel } from '../../types/index.js'

export interface SeverityEntry {
    level: RiskLevel
    escalation: EscalationLevel
    label: string
    autoApprove: boolean
    requireHuman: boolean
    hardStop: boolean
}

export const SEVERITY_MATRIX: Record<RiskLevel, SeverityEntry> = {
    R0: {
        level: 'R0',
        escalation: 0,
        label: 'Passive — no side effects',
        autoApprove: true,
        requireHuman: false,
        hardStop: false,
    },
    R1: {
        level: 'R1',
        escalation: 0,
        label: 'Controlled — small bounded change',
        autoApprove: true,
        requireHuman: false,
        hardStop: false,
    },
    R2: {
        level: 'R2',
        escalation: 1,
        label: 'Elevated — has authority, may chain',
        autoApprove: false,
        requireHuman: true,
        hardStop: false,
    },
    R3: {
        level: 'R3',
        escalation: 2,
        label: 'Critical — cross-module/architecture change',
        autoApprove: false,
        requireHuman: true,
        hardStop: false,
    },
    'R3+': {
        level: 'R3+',
        escalation: 3,
        label: 'Hard Stop — irreversible or undefined risk',
        autoApprove: false,
        requireHuman: true,
        hardStop: true,
    },
}

export function getSeverity(level: RiskLevel): SeverityEntry {
    return SEVERITY_MATRIX[level]
}
