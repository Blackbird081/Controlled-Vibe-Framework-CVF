// cvf.config.ts
// CVF Toolkit Core — Centralized Configuration
// All configurable values in one place. No hardcoding elsewhere.

import { RiskLevel, CVFPhase } from "./interfaces"

// --- Environment Risk Caps ---

export const ENVIRONMENT_MAX_RISK: Readonly<Record<string, RiskLevel>> = {
    dev: "R3",
    staging: "R2",
    prod: "R1"
}

// --- Risk Level Ordering ---

export const RISK_ORDER: Readonly<Record<RiskLevel, number>> = {
    R0: 0, R1: 1, R2: 2, R3: 3, R4: 4
}

export const ORDER_TO_RISK: Readonly<Record<number, RiskLevel>> = {
    0: "R0", 1: "R1", 2: "R2", 3: "R3", 4: "R4"
}

// --- Capability → Max Risk ---

export const CAPABILITY_MAX_RISK: Readonly<Record<string, RiskLevel>> = {
    C1: "R1", C2: "R2", C3: "R3", C4: "R4"
}

// --- Phase Order ---

export const PHASE_ORDER: readonly CVFPhase[] = [
    "P0_DESIGN",
    "P1_BUILD",
    "P2_INTERNAL_VALIDATION",
    "P3_UAT",
    "P4_APPROVED",
    "P5_PRODUCTION",
    "P6_FROZEN"
] as const

// --- Financial Domain Thresholds ---

export const FINANCIAL_MIN_RISK: Readonly<Record<string, RiskLevel>> = {
    "data-fetch": "R1",
    "ratio-calculation": "R2",
    "forecast": "R3",
    "recommendation": "R4",
    "trade-automation": "R4"
}

export const FINANCIAL_DEFAULT_MIN_RISK: RiskLevel = "R2"

// --- Approval Requirements ---

export const RISK_REQUIRES_APPROVAL: Readonly<Record<RiskLevel, boolean>> = {
    R0: false,
    R1: false,
    R2: false,
    R3: true,
    R4: true  // multi-approval
}

export const RISK_REQUIRES_UAT: Readonly<Record<RiskLevel, boolean>> = {
    R0: false,
    R1: false,
    R2: true,
    R3: true,
    R4: true  // extended UAT
}

export const RISK_REQUIRES_FREEZE: Readonly<Record<RiskLevel, boolean>> = {
    R0: false,
    R1: false,
    R2: false,
    R3: true,
    R4: true
}

// --- R4 Special ---

export const R4_MIN_APPROVALS = 2

// --- Audit ---

export const AUDIT_CONFIG = {
    retentionDays: 365,
    maxRecordsInMemory: 10000,
    sensitiveFields: ["apiKey", "password", "token", "secret", "credential"]
} as const

// --- Governance SLA ---

export const GOVERNANCE_SLA_MS = 50  // max 50ms per decision

// --- Rate Limiting ---

export const RATE_LIMIT_CONFIG = {
    maxGovernanceChecksPerMinute: 100,
    maxFailedChecksBeforeAlert: 5,
    cooldownMinutes: 15
} as const

// --- Provider Defaults ---

export const PROVIDER_CONFIG = {
    defaultTimeout: 30000,       // 30s
    maxRetries: 3,
    healthCheckInterval: 60000,  // 60s
    maxTokensDefault: 4096
} as const
