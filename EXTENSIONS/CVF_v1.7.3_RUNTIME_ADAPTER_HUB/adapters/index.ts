// adapters/index.ts
// CVF v1.7.3 — Adapter barrel export

export { OpenClawAdapter } from './openclaw.adapter.js'
export { PicoClawAdapter } from './picoclaw.adapter.js'
export { ZeroClawAdapter } from './zeroclaw.adapter.js'
export { NanoAdapter } from './nano.adapter.js'
export { ReleaseEvidenceAdapter } from './release.evidence.adapter.js'
export {
    WorkerThreadSandboxAdapter,
    WORKER_THREAD_GUARANTEE_PROFILE,
} from './worker.thread.sandbox.adapter.js'
export { executeFilesystemAction, executeHttpAction } from './base.adapter.js'

// RFR-R5 / F9: isolation-dimension admission surface (sandbox.types.ts).
export {
    ISOLATION_DIMENSIONS,
    createDefaultIsolationRequirement,
    createDefaultSandboxConfig,
    evaluateIsolationAdmission,
    isCompleteIsolationGuaranteeProfile,
} from './sandbox.types.js'
export type {
    ContainmentViolation,
    ContainmentViolationType,
    IsolationAdmissionEvidence,
    IsolationAdmissionContext,
    IsolationAdmissionReasonCode,
    IsolationAdmissionVerdict,
    IsolationDimension,
    IsolationDimensionEvidence,
    IsolationGuaranteeProfile,
    IsolationRequirement,
    IsolationRequirementMode,
    SandboxCommand,
    SandboxConfig,
    SandboxExecutor,
    SandboxFilesystemPolicy,
    SandboxNetworkPolicy,
    SandboxPlatform,
    SandboxResourceLimits,
    SandboxResult,
    SandboxStatus,
} from './sandbox.types.js'
