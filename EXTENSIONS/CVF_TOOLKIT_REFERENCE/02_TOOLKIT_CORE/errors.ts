// errors.ts
// CVF Toolkit Core — Centralized Error Definitions
// All governance errors in one place with error codes for tracking.

// --- Base Error ---

export class BaseGovernanceError extends Error {
    code: string
    timestamp: string

    constructor(code: string, message: string) {
        super(message)
        this.name = "BaseGovernanceError"
        this.code = code
        this.timestamp = new Date().toISOString()
    }
}

// --- Governance Errors ---

export class GovernanceViolationError extends BaseGovernanceError {
    reasons: string[]
    constructor(reasons: string[]) {
        super("CVF_ERR_001", `Governance violation: ${reasons.join("; ")}`)
        this.name = "GovernanceViolationError"
        this.reasons = reasons
    }
}

export class PhaseViolationError extends BaseGovernanceError {
    constructor(message: string) {
        super("CVF_ERR_002", message)
        this.name = "PhaseViolationError"
    }
}

export class RiskViolationError extends BaseGovernanceError {
    constructor(message: string) {
        super("CVF_ERR_003", message)
        this.name = "RiskViolationError"
    }
}

export class OperatorViolationError extends BaseGovernanceError {
    constructor(message: string) {
        super("CVF_ERR_004", message)
        this.name = "OperatorViolationError"
    }
}

export class ChangeViolationError extends BaseGovernanceError {
    constructor(message: string) {
        super("CVF_ERR_005", message)
        this.name = "ChangeViolationError"
    }
}

export class FreezeViolationError extends BaseGovernanceError {
    constructor(message: string) {
        super("CVF_ERR_006", message)
        this.name = "FreezeViolationError"
    }
}

export class EnvironmentViolationError extends BaseGovernanceError {
    constructor(message: string) {
        super("CVF_ERR_007", message)
        this.name = "EnvironmentViolationError"
    }
}

export class SkillViolationError extends BaseGovernanceError {
    constructor(message: string) {
        super("CVF_ERR_008", message)
        this.name = "SkillViolationError"
    }
}

export class SecurityException extends BaseGovernanceError {
    constructor(message: string) {
        super("CVF_ERR_009", message)
        this.name = "SecurityException"
    }
}

export class ValidationError extends BaseGovernanceError {
    constructor(message: string) {
        super("CVF_ERR_010", message)
        this.name = "ValidationError"
    }
}

export class ProviderError extends BaseGovernanceError {
    constructor(message: string) {
        super("CVF_ERR_011", message)
        this.name = "ProviderError"
    }
}

export class CertificationError extends BaseGovernanceError {
    constructor(message: string) {
        super("CVF_ERR_012", message)
        this.name = "CertificationError"
    }
}

// --- Error Code Reference ---
// CVF_ERR_001: Governance violation (multi-reason)
// CVF_ERR_002: Phase transition violation
// CVF_ERR_003: Risk level violation
// CVF_ERR_004: Operator permission violation
// CVF_ERR_005: Change control violation
// CVF_ERR_006: Freeze protocol violation
// CVF_ERR_007: Environment restriction violation
// CVF_ERR_008: Skill validation violation
// CVF_ERR_009: Security exception (bypass attempt)
// CVF_ERR_010: Input validation error
// CVF_ERR_011: AI provider error
// CVF_ERR_012: Certification error
