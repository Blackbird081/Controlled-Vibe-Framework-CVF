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

// ─── Cross-Extension Audit Replay ───────────────────────────────────────────

export interface LegacyResumeAuditContext {
    sessionId?: string
    checkpointedAt: number
    lastResumedAt?: number
    resumeCount: number
    resumeAuthorized: boolean
}

export interface LegacyExecutionAuditRecord {
    proposalId: string
    policyVersion: string
    policyHash: string
    decision: string
    timestamp: number
    resumeContext?: LegacyResumeAuditContext
}

export interface CrossExtensionReplaySeed {
    executionId?: string
    role: string
    mode: 'SAFE' | 'BALANCED' | 'CREATIVE'
    fileHashes: Record<string, string>
    policyVersion: string
    envMeta?: Record<string, string>
    riskHash: string
    mutationFingerprint: string
    snapshotId: string
}

export interface CrossExtensionReplayInput {
    auditRecord: LegacyExecutionAuditRecord
    replaySeed: CrossExtensionReplaySeed
    currentFileHashes: Record<string, string>
    currentRiskScore?: number
}

export interface CrossExtensionReplayResult {
    executionId: string
    sourceProposalId: string
    replay: ReplayResult
}

export interface LegacyLifecycleCheckpoint {
    proposalId: string
    state: string
    policyVersion: string
    policyHash: string
    simulateOnly: boolean
    checkpointedAt: number
    sessionId?: string
    resumeToken: string
    resumeCount: number
    lastResumedAt?: number
}

export interface CrossExtensionWorkflowResumeInput extends CrossExtensionReplayInput {
    checkpoint: LegacyLifecycleCheckpoint
    sessionId?: string
    resumeToken?: string
}

export interface CrossExtensionWorkflowResumeResult extends CrossExtensionReplayResult {
    resumed: boolean
    resumeCount: number
    checkpointState: string
    sessionId?: string
}

export interface LegacyRollbackRecord {
    executionId: string
    snapshotId: string
    restoredAt: number
    stateHash: string
}

export type CrossExtensionFailureKind =
    | 'RUNTIME_INTERRUPTION'
    | 'POLICY_REFUSAL'
    | 'SYSTEM_ABORT'

export interface CrossExtensionFailureSignal {
    kind: CrossExtensionFailureKind
    reason: string
    phase?: string
}

export interface CrossExtensionRecoveryInput extends CrossExtensionWorkflowResumeInput {
    rollbackRecord?: LegacyRollbackRecord
    failureSignal?: CrossExtensionFailureSignal
}

export interface CrossExtensionRecoveryResult {
    action: 'RESUMED' | 'ROLLBACK_REQUIRED' | 'INTERRUPTED' | 'REFUSED' | 'ABORTED'
    sourceProposalId: string
    resumed: boolean
    workflow?: CrossExtensionWorkflowResumeResult
    rollbackRecord?: LegacyRollbackRecord
    failureSignal?: CrossExtensionFailureSignal
    remediation?: CrossExtensionRemediationPolicy
}

export interface CrossExtensionRemediationPolicy {
    severity: 'INFO' | 'WARN' | 'CRITICAL'
    requiresHumanApproval: boolean
    nextStep: string
    playbook: string[]
}

export interface CrossExtensionRemediationExecution {
    automated: boolean
    blocked: boolean
    executedSteps: string[]
    blockedReason?: string
    adapterReceipts?: string[]
}

export interface CrossExtensionRemediationReceipt {
    receiptId: string
    action: CrossExtensionRecoveryResult['action']
    sourceProposalId: string
    step: string
    recordedAt: number
}

export interface CrossExtensionRemediationAdapter {
    execute(step: string, context: {
        action: CrossExtensionRecoveryResult['action']
        sourceProposalId: string
    }): string
}
