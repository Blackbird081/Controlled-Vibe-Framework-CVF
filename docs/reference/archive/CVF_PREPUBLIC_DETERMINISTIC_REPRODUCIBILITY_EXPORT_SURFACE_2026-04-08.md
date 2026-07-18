# CVF Pre-Public Deterministic Reproducibility Export Surface — 2026-04-08

Memory class: POINTER_RECORD
Status: canonical candidate-scoped implementation reference for `CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY` in the first-wave export lane.

## Purpose

- preserve the first explicit public-surface tightening for `CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY`
- keep the candidate aligned to the shortlist packaging boundary
- document what is in scope versus what stays deferred

## Canonical Entry Rule

Preferred entry:

- Types barrel:
  - `types/index.ts` — All type definitions
- Core modules:
  - `core/deterministic.hash.ts` — Deterministic hash computation
  - `core/execution.replay.ts` — Replay engine
  - `core/context.freezer.ts` — Context snapshot and freeze
  - `core/execution.snapshot.ts` — Execution record storage
  - `core/replay.validator.ts` — Replay validation

## Public API Surface

### Types Module (`types/index.ts`)

**Core Types**:
- `ExecutionRecord` — 9 immutable fields for forensic audit
- `ContextSnapshot` — Frozen context at ANALYSIS phase
- `ReplayStatus` — 'EXACT' | 'DRIFT' | 'FAILED'
- `ReplayResult` — Replay validation result

**Cross-Extension Types**:
- `LegacyResumeAuditContext` — Resume context from v1.8
- `LegacyExecutionAuditRecord` — Audit record from v1.8
- `CrossExtensionReplaySeed` — Replay seed for cross-extension replay
- `CrossExtensionReplayInput` — Input for cross-extension replay
- `CrossExtensionReplayResult` — Result of cross-extension replay
- `LegacyLifecycleCheckpoint` — Checkpoint from v1.8
- `CrossExtensionWorkflowResumeInput` — Input for workflow resume
- `CrossExtensionWorkflowResumeResult` — Result of workflow resume
- `LegacyRollbackRecord` — Rollback record from v1.8
- `CrossExtensionFailureKind` — Failure classification
- `CrossExtensionFailureSignal` — Failure signal
- `CrossExtensionRecoveryInput` — Input for recovery orchestration
- `CrossExtensionRecoveryResult` — Result of recovery orchestration
- `CrossExtensionRemediationPolicy` — Remediation policy
- `CrossExtensionRemediationExecution` — Remediation execution result
- `CrossExtensionRemediationReceipt` — Remediation receipt
- `CrossExtensionRemediationAdapter` — Remediation adapter interface

### Core Modules

**Deterministic Hash** (`core/deterministic.hash.ts`):
- `computeDeterministicHash(...parts: string[]): string` — Compute SHA-256 hash from parts
- `verifyHash(recordedHash, executionId, riskHash, mutationFingerprint, snapshotId): boolean` — Verify hash matches

**Execution Replay** (`core/execution.replay.ts`):
- `ReplayEngine` class — Replay engine for forensic audit
  - `replay(executionId: string, input: ReplayInput): ReplayResult` — Replay execution
- `ReplayInput` interface — Input for replay

**Context Freezer** (`core/context.freezer.ts`):
- `ContextFreezer` class — Context snapshot and freeze
  - `freeze(executionId: string, fileHashes: Record<string, string>, policyVersion: string, envMeta?: Record<string, string>): string` — Freeze context
  - `detectDrift(executionId: string, currentFileHashes: Record<string, string>): string[]` — Detect context drift

**Execution Snapshot** (`core/execution.snapshot.ts`):
- `ExecutionSnapshot` class — Execution record storage
  - `save(record: ExecutionRecord): void` — Save execution record
  - `get(executionId: string): ExecutionRecord` — Retrieve execution record
  - `list(): ExecutionRecord[]` — List all execution records

**Replay Validator** (`core/replay.validator.ts`):
- `ReplayValidator` class — Replay validation
  - `validate(replayResult: ReplayResult): boolean` — Validate replay result
  - `validateWithThreshold(replayResult: ReplayResult, maxDriftFiles: number, maxRiskDrift: number): boolean` — Validate with thresholds

## Explicitly Out Of Scope

- Internal implementation details beyond the core modules
- Test files (`tests/`)
- Development dependencies and build artifacts
- Cross-extension workflow coordinator (deferred to future)
- Cross-extension recovery orchestrator (deferred to future)

## Package Consequences

- package manifest exposes `types/index.ts` as types entry point
- package manifest exposes `core/*.ts` as core modules
- package README explains deterministic reproducibility concepts
- package boundary tests lock the exact allowed export surface

## Still Deferred

- `READY_FOR_EXPORT` uplift
- public package publication
- npm registry configuration
- public CI/CD setup
- version bumps (keep current 1.9.0)
- Full cross-extension orchestration (only types exposed for now)

## Related Artifacts

- `docs/reference/CVF_PREPUBLIC_EXPORT_SHORTLIST_2026-04-02.md`
- `docs/reference/CVF_PREPUBLIC_SHORTLIST_PACKAGING_BOUNDARY_2026-04-02.md`
- `docs/reference/CVF_PREPUBLIC_PUBLICATION_DECISION_MEMO_2026-04-02.md`
- `EXTENSIONS/CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/package.json`
- `EXTENSIONS/CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/README.md`
- `EXTENSIONS/CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/SPEC.md`

