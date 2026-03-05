// CVF v1.9 — Type Definitions
// Extends v1.8 types with determinism and reproducibility concepts

// ─── Execution Record (9 immutable fields) ───────────────────────────────────

/**
 * ExecutionRecord — produced at COMMIT phase, immutable forever.
 * per SPEC.md: all 9 fields are immutable after COMMIT.
 */
export interface ExecutionRecord {
    /** From v1.8 LifecycleController */
    executionId: string
    /** UTC ms — locked at record creation */
    timestamp: number
    /** Role locked at INTENT phase */
    role: string
    /** Mode locked at INTENT phase */
    mode: 'SAFE' | 'BALANCED' | 'CREATIVE'
    /** SHA-256 of frozen context (files + env + policy version) */
    frozenContextHash: string
    /** From v1.8 RiskObject.hash — locked at RISK_ASSESSMENT */
    riskHash: string
    /** Deterministic fingerprint of applied mutation */
    mutationFingerprint: string
    /** Snapshot taken before MUTATION_SANDBOX */
    snapshotId: string
    /** Deterministic: hash(executionId+riskHash+mutationFingerprint+snapshotId) */
    commitHash: string
}

// ─── Context Snapshot (for freezing) ────────────────────────────────────────

export interface ContextSnapshot {
    /** Files in scope: path → content hash */
    fileHashes: Record<string, string>
    /** Policy version active at time of freeze */
    policyVersion: string
    /** Environment metadata */
    envMeta: Record<string, string>
    /** Timestamp of freeze */
    frozenAt: number
}

// ─── Replay ─────────────────────────────────────────────────────────────────

export type ReplayStatus = 'EXACT' | 'DRIFT' | 'FAILED'

export interface ReplayResult {
    originalExecutionId: string
    replayedAt: number
    status: ReplayStatus
    /** True if commitHash matches original exactly */
    matches: boolean
    /** Files that changed between original and replay */
    contextDrift: string[]
    /** Absolute difference in risk score */
    riskDrift: number
    /** Original commitHash */
    originalCommitHash: string
    /** Recomputed commitHash from current context */
    replayCommitHash: string
}
