// CVF v1.8 — Core Type Definitions
// All types are derived from SPEC.md, OPERATIONAL_SPEC.md, and GOVERNANCE_MODEL.md

// ─── Execution Phases ───────────────────────────────────────────────────────

export type ExecutionPhase =
    | 'INTENT'
    | 'ANALYSIS'
    | 'RISK_ASSESSMENT'
    | 'PLANNING'
    | 'MUTATION_SANDBOX'
    | 'VERIFICATION'
    | 'COMMIT'
    | 'ROLLBACK'
    | 'ABORTED'

// Allowed transitions — all others are HARD ABORT
export const ALLOWED_TRANSITIONS: Record<ExecutionPhase, ExecutionPhase[]> = {
    INTENT: ['ANALYSIS'],
    ANALYSIS: ['RISK_ASSESSMENT'],
    RISK_ASSESSMENT: ['PLANNING'],
    PLANNING: ['MUTATION_SANDBOX'],
    MUTATION_SANDBOX: ['VERIFICATION'],
    VERIFICATION: ['COMMIT', 'ROLLBACK'],
    COMMIT: [],
    ROLLBACK: [],
    ABORTED: [],
}

// ─── Execution Mode ──────────────────────────────────────────────────────────

export type ExecutionMode = 'SAFE' | 'BALANCED' | 'CREATIVE'

// ─── Risk ────────────────────────────────────────────────────────────────────

export type RiskLevel = 'R0' | 'R1' | 'R2' | 'R3' | 'R3+'

export interface RiskDimensions {
    /** 0–5 | 0=cosmetic → 5=core system behavior change */
    impact: number
    /** 0–5 | 0=1 file → 5=global/system-wide */
    scope: number
    /** 0–5 | 0=deterministic → 5=speculative redesign */
    uncertainty: number
    /** -2 to +2 | -2=trivial rollback → +2=irreversible */
    reversibility: number
}

export interface RiskObject {
    /** Numeric score = (impact × scope × uncertainty) + reversibility */
    score: number
    /** Canonical R-level mapped from score */
    level: RiskLevel
    /** Breakdown of all 4 dimensions */
    breakdown: RiskDimensions
    /** Deterministic hash of (score+level+breakdown) — immutable after lock */
    hash: string
    /** Bound to this execution only */
    executionId: string
    /** Set to true once locked at RISK_ASSESSMENT phase */
    locked: boolean
}

// ─── Mutation Budget ─────────────────────────────────────────────────────────

export interface MutationBudget {
    maxFiles: number
    maxLines: number
    mode: ExecutionMode
    /** Tracks current usage */
    usedFiles: number
    usedLines: number
}

// ─── ExecutionContext ─────────────────────────────────────────────────────────

export interface ExecutionContext {
    executionId: string
    role: string
    mode: ExecutionMode
    currentPhase: ExecutionPhase
    riskObject: RiskObject | null    // null until RISK_ASSESSMENT
    mutationBudget: MutationBudget
    snapshotId: string | null        // null until MUTATION_SANDBOX
    anomalyFlags: string[]
    escalationLevel: 0 | 1 | 2 | 3
}

// ─── Escalation ──────────────────────────────────────────────────────────────

/** L0=log, L1=warn, L2=require-approval, L3=hard-stop */
export type EscalationLevel = 0 | 1 | 2 | 3

export interface EscalationEvent {
    executionId: string
    level: EscalationLevel
    reason: string
    timestamp: number
}

// ─── Anomaly ─────────────────────────────────────────────────────────────────

export interface AnomalyFlag {
    code: string
    message: string
    phase: ExecutionPhase
    timestamp: number
}

// ─── Commit ──────────────────────────────────────────────────────────────────

export interface CommitRecord {
    executionId: string
    commitHash: string
    riskHash: string
    mutationFingerprint: string
    snapshotId: string
    timestamp: number
}

// ─── Mutation ────────────────────────────────────────────────────────────────

export interface MutationPlan {
    files: string[]
    estimatedLines: number
    diff: string
}

export interface MutationResult {
    applied: boolean
    fingerprint: string
    snapshotId: string
}

// ─── Drift & Stability ───────────────────────────────────────────────────────

export interface ExecutionMetrics {
    executionId: string
    rollback: boolean
    anomalyCount: number
    riskEscalated: boolean
    mutationSize: number  // LOC changed
    driftScore: number
}

export interface StabilityReport {
    index: number  // 0–100
    forcedSafeMode: boolean
    creativeDisabled: boolean
}
