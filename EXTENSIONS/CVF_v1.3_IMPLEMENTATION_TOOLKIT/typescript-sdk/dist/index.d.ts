export { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

/**
 * CVF TypeScript SDK - Type Definitions
 */
/** Risk levels for capabilities */
type RiskLevel = 'R0' | 'R1' | 'R2' | 'R3' | 'R4';
/** Lifecycle states for capabilities */
type CapabilityState = 'PROPOSED' | 'APPROVED' | 'ACTIVE' | 'DEPRECATED' | 'RETIRED';
/** Agent archetypes */
type Archetype = 'Analysis' | 'Execution' | 'Orchestration';
/** CVF Phases */
type Phase = 'A' | 'B' | 'C' | 'D';
/** Trace levels for audit */
type TraceLevel = 'Minimal' | 'Standard' | 'Full';
/** Input/Output field specification */
interface FieldSpec {
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
interface GovernanceSpec {
    allowed_archetypes: Archetype[];
    allowed_phases: Phase[];
    required_decisions?: string[];
    required_status: CapabilityState;
}
/** Execution specification */
interface ExecutionSpec {
    side_effects: boolean;
    rollback_possible: boolean;
    idempotent: boolean;
    execution_type?: string;
    expected_duration?: string;
}
/** Audit specification */
interface AuditSpec {
    trace_level: TraceLevel;
    required_fields: string[];
}
/** Failure information for R2/R3 contracts */
interface FailureInfo {
    known_failure_modes: string[];
    worst_case_impact: string;
    human_intervention_required: boolean;
}
/** Skill Contract definition */
interface SkillContract {
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
interface Capability extends SkillContract {
    state: CapabilityState;
    owner?: string;
    registered_by?: string;
    registered_at?: string;
    last_audit?: string;
    deprecation_reason?: string;
}
/** Audit log entry */
interface AuditLogEntry {
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
interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}
/** Execution result */
interface ExecutionResult<T = unknown> {
    success: boolean;
    outputs?: T;
    error?: string;
    audit_id: string;
    duration_ms: number;
}
/** Registry query options */
interface QueryOptions {
    domain?: string;
    risk_level?: RiskLevel;
    state?: CapabilityState;
    archetype?: Archetype;
    phase?: Phase;
}

/**
 * CVF TypeScript SDK - Contract Validator
 */

/**
 * Validate a Skill Contract
 */
declare function validateContract(contract: Partial<SkillContract>): ValidationResult;
/**
 * Validate inputs against contract input_spec
 */
declare function validateInputs(contract: SkillContract, inputs: Record<string, unknown>): ValidationResult;

/**
 * CVF TypeScript SDK - Skill Registry
 */

/**
 * Skill Registry - manages capability registration and lifecycle
 */
declare class SkillRegistry {
    private capabilities;
    private stateTransitions;
    /**
     * Register a new capability
     */
    register(contract: SkillContract, owner?: string): Capability;
    /**
     * Get a capability by ID
     */
    get(capabilityId: string): Capability | undefined;
    /**
     * List all capabilities
     */
    list(options?: QueryOptions): Capability[];
    /**
     * Transition capability to new state
     */
    transition(capabilityId: string, newState: CapabilityState, actor?: string): Capability;
    /**
     * Check if capability can be executed
     */
    canExecute(capabilityId: string, archetype: string, phase: string): boolean;
    /**
     * Deprecate a capability
     */
    deprecate(capabilityId: string, reason: string): Capability;
    /**
     * Export registry to JSON
     */
    export(): object;
    /**
     * Import capabilities from JSON
     */
    import(data: {
        capabilities: Capability[];
    }): void;
    /**
     * Get registry stats
     */
    stats(): Record<string, number>;
}

/**
 * CVF TypeScript SDK - Contract Loader
 */

/**
 * Load a contract from YAML file
 */
declare function loadContract(path: string): SkillContract;
/**
 * Parse contract from YAML string
 */
declare function parseContract(yamlContent: string): SkillContract;
/**
 * Load multiple contracts from a directory
 */
declare function loadContractsFromDir(dirPath: string): SkillContract[];

/**
 * CVF TypeScript SDK - Audit Logger
 */

/**
 * Audit Tracer - logs all capability executions
 */
declare class AuditTracer {
    private logs;
    private maxLogs;
    constructor(maxLogs?: number);
    /**
     * Log an execution
     */
    log(contract: SkillContract, actor: string, inputs: Record<string, unknown>, result: ExecutionResult): AuditLogEntry;
    /**
     * Sanitize inputs based on trace level
     */
    private sanitizeInputs;
    /**
     * Get logs for a capability
     */
    getLogsFor(capabilityId: string, limit?: number): AuditLogEntry[];
    /**
     * Get recent logs
     */
    getRecent(limit?: number): AuditLogEntry[];
    /**
     * Get failed executions
     */
    getFailures(limit?: number): AuditLogEntry[];
    /**
     * Get stats
     */
    getStats(): Record<string, number | string>;
    /**
     * Export logs
     */
    export(): AuditLogEntry[];
    /**
     * Clear logs
     */
    clear(): void;
}

/**
 * CVF TypeScript SDK
 *
 * Main entry point - exports all public APIs
 *
 * @example
 * ```typescript
 * import { SkillRegistry, validateContract, loadContract } from '@cvf/sdk';
 *
 * // Load and validate a contract
 * const contract = loadContract('./my_skill.contract.yaml');
 * const result = validateContract(contract);
 *
 * // Register in registry
 * const registry = new SkillRegistry();
 * registry.register(contract);
 * ```
 */

declare const VERSION = "1.3.0";

export { type Archetype, type AuditLogEntry, type AuditSpec, AuditTracer, type Capability, type CapabilityState, type ExecutionResult, type ExecutionSpec, type FailureInfo, type FieldSpec, type GovernanceSpec, type Phase, type QueryOptions, type RiskLevel, type SkillContract, SkillRegistry, type TraceLevel, VERSION, type ValidationResult, loadContract, loadContractsFromDir, parseContract, validateContract, validateInputs };
