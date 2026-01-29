/**
 * CVF TypeScript SDK - Type Definitions
 */

/** Risk levels for capabilities */
export type RiskLevel = 'R0' | 'R1' | 'R2' | 'R3';

/** Lifecycle states for capabilities */
export type CapabilityState =
    | 'PROPOSED'
    | 'APPROVED'
    | 'ACTIVE'
    | 'DEPRECATED'
    | 'RETIRED';

/** Agent archetypes */
export type Archetype = 'Analysis' | 'Execution' | 'Orchestration';

/** CVF Phases */
export type Phase = 'A' | 'B' | 'C' | 'D';

/** Trace levels for audit */
export type TraceLevel = 'Minimal' | 'Standard' | 'Full';

/** Input/Output field specification */
export interface FieldSpec {
    name: string;
    type: string;
    required?: boolean;
    default?: unknown;
    description?: string;
    enum?: string[];
    max_length?: number;
    range?: [number, number];
    success_criteria?: string;
}

/** Governance specification */
export interface GovernanceSpec {
    allowed_archetypes: Archetype[];
    allowed_phases: Phase[];
    required_decisions?: string[];
    required_status: CapabilityState;
}

/** Execution specification */
export interface ExecutionSpec {
    side_effects: boolean;
    rollback_possible: boolean;
    idempotent: boolean;
    execution_type?: string;
    expected_duration?: string;
}

/** Audit specification */
export interface AuditSpec {
    trace_level: TraceLevel;
    required_fields: string[];
}

/** Failure information for R2/R3 contracts */
export interface FailureInfo {
    known_failure_modes: string[];
    worst_case_impact: string;
    human_intervention_required: boolean;
}

/** Skill Contract definition */
export interface SkillContract {
    capability_id: string;
    domain: string;
    description: string;
    risk_level: RiskLevel;
    version: string;
    governance: GovernanceSpec;
    input_spec: FieldSpec[];
    output_spec: FieldSpec[];
    execution: ExecutionSpec;
    audit: AuditSpec;
    failure_info?: FailureInfo;
    constraints?: Record<string, unknown>;
}

/** Capability with lifecycle metadata */
export interface Capability extends SkillContract {
    state: CapabilityState;
    owner?: string;
    registered_by?: string;
    registered_at?: string;
    last_audit?: string;
    deprecation_reason?: string;
}

/** Audit log entry */
export interface AuditLogEntry {
    id: string;
    timestamp: string;
    capability_id: string;
    version: string;
    actor: string;
    inputs: Record<string, unknown>;
    outputs: Record<string, unknown> | null;
    success: boolean;
    error?: string;
    duration_ms: number;
    context?: Record<string, unknown>;
}

/** Validation result */
export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}

/** Execution result */
export interface ExecutionResult<T = unknown> {
    success: boolean;
    outputs?: T;
    error?: string;
    audit_id: string;
    duration_ms: number;
}

/** Registry query options */
export interface QueryOptions {
    domain?: string;
    risk_level?: RiskLevel;
    state?: CapabilityState;
    archetype?: Archetype;
    phase?: Phase;
}
