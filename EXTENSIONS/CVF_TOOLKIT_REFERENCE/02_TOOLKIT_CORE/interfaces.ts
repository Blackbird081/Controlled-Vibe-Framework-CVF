// interfaces.ts
// CVF Toolkit Core — Shared Type Definitions
// Single source of truth for all types used across modules.

// --- Risk ---

export type RiskLevel = "R0" | "R1" | "R2" | "R3" | "R4"

export type CapabilityLevel = "C1" | "C2" | "C3" | "C4"

export type Environment = "dev" | "staging" | "prod"

// --- Phases ---

export type CVFPhase =
    | "P0_DESIGN"
    | "P1_BUILD"
    | "P2_INTERNAL_VALIDATION"
    | "P3_UAT"
    | "P4_APPROVED"
    | "P5_PRODUCTION"
    | "P6_FROZEN"

// --- Operators ---

export type OperatorRole = "VIEWER" | "ANALYST" | "REVIEWER" | "APPROVER" | "ADMIN"

export interface OperatorContext {
    id: string
    name: string
    role: OperatorRole
    permissions?: string[]
}

// --- Skills ---

export interface SkillDefinition {
    id: string
    name: string
    version: string
    description: string
    riskLevel: RiskLevel
    domain: string
    requiredPhase: number
    requiresApproval: boolean
    allowedRoles: OperatorRole[]
    allowedEnvironments?: Environment[]
    requiresUAT?: boolean
    freezeOnRelease?: boolean
    tags?: string[]
    active?: boolean
}

// --- Governance ---

export interface GovernanceContext {
    operatorId: string
    operatorRole: string
    skillId: string
    skillVersion: string
    environment: Environment
    requestedPhase: CVFPhase
    changeId?: string
    agentId?: string
}

export interface GovernanceDecision {
    allowed: boolean
    riskLevel: RiskLevel
    enforcedPhase: string
    requiresUAT: boolean
    requiresApproval: boolean
    requiresFreeze: boolean
    reasons?: string[]
}

// --- Risk Classification ---

export interface RiskClassificationInput {
    skillId: string
    skillBaseRisk: RiskLevel
    capabilityLevel: CapabilityLevel
    domain: string
    operatorRole: string
    environment: Environment
    changeType?: string
    providerChange?: boolean
    affectsProduction?: boolean
}

export interface RiskAssessmentResult {
    riskLevel: RiskLevel
    requiresApproval: boolean
    requiresUAT: boolean
    requiresFreeze: boolean
    environmentCapExceeded: boolean
    reasons: string[]
}

// --- Phase State ---

export interface PhaseState {
    projectId: string
    currentPhase: CVFPhase
    riskLevel: RiskLevel
    approvalGranted: boolean
    uatPassed: boolean
    freezeActive: boolean
    environment: Environment
}

// --- Change Control ---

export type ChangeType = "skill" | "risk" | "governance" | "policy" | "financial" | "provider" | "release"

export type ChangeStatus = "draft" | "submitted" | "approved" | "rejected" | "implemented" | "frozen"

export interface ChangeRequest {
    changeId: string
    changeType: ChangeType
    description: string
    requestedBy: string
    requestedAt: string
    affectedComponents: string[]
    riskAssessment: RiskLevel
    requiresApproval: boolean
    approvalChain: string[]
    status: ChangeStatus
    implementationReference?: string
    auditTrail: object[]
}

// --- Audit ---

export type AuditEventType =
    | "SKILL_INVOCATION"
    | "RISK_CLASSIFICATION"
    | "RISK_ASSESSMENT"
    | "PHASE_VALIDATION"
    | "GOVERNANCE_BLOCK"
    | "GOVERNANCE_DECISION"
    | "MODEL_INVOCATION"
    | "PROVIDER_CALL"
    | "APPROVAL_GRANTED"
    | "APPROVAL_REJECTED"
    | "UAT_EXECUTION"
    | "FREEZE_APPLIED"
    | "CERTIFICATION_ISSUED"

export interface AuditRecord {
    timestamp?: string
    eventType: AuditEventType
    operatorId?: string
    skillId?: string
    riskLevel?: string
    phase?: number
    details?: Record<string, unknown>
    correlationId?: string
}

// --- AI Provider ---

export interface AIRequest {
    model: string
    prompt: string
    systemPrompt?: string
    maxTokens?: number
    temperature?: number
}

export interface AIResponse {
    content: string
    model: string
    usage?: {
        promptTokens: number
        completionTokens: number
        totalTokens: number
    }
    finishReason?: string
}

export interface AIProvider {
    name: string
    invoke(request: AIRequest): Promise<AIResponse>
    healthCheck?(): Promise<boolean>
}

// --- Validation ---

export interface IValidationRule {
    ruleId: string
    ruleName: string
    domain: string
    severity: "error" | "warning" | "info"
    validate(output: unknown, context?: Record<string, unknown>): ValidationResult
}

export interface ValidationResult {
    passed: boolean
    ruleId: string
    message: string
    severity: "error" | "warning" | "info"
}
