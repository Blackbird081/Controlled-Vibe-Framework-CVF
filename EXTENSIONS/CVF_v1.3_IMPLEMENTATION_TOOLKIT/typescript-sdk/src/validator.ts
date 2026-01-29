/**
 * CVF TypeScript SDK - Contract Validator
 */

import type {
    SkillContract,
    ValidationResult,
    RiskLevel,
    FieldSpec
} from './types';

const VALID_RISK_LEVELS: RiskLevel[] = ['R0', 'R1', 'R2', 'R3'];
const VALID_ARCHETYPES = ['Analysis', 'Execution', 'Orchestration'];
const VALID_PHASES = ['A', 'B', 'C', 'D'];
const VALID_STATES = ['PROPOSED', 'APPROVED', 'ACTIVE', 'DEPRECATED', 'RETIRED'];
const VALID_TRACE_LEVELS = ['Minimal', 'Standard', 'Full'];

/**
 * Validate a Skill Contract
 */
export function validateContract(contract: Partial<SkillContract>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required root fields
    const requiredFields = [
        'capability_id',
        'domain',
        'description',
        'risk_level',
        'version',
        'governance',
        'input_spec',
        'output_spec',
        'execution',
        'audit'
    ];

    for (const field of requiredFields) {
        if (!(field in contract) || contract[field as keyof SkillContract] === undefined) {
            errors.push(`Missing required field: ${field}`);
        }
    }

    // Validate capability_id format
    if (contract.capability_id) {
        if (!/^[A-Z][A-Z0-9_]*_v\d+$/.test(contract.capability_id)) {
            warnings.push(
                `capability_id should follow format: NAME_v1 (e.g., CODE_REVIEW_v1)`
            );
        }
    }

    // Validate risk_level
    if (contract.risk_level && !VALID_RISK_LEVELS.includes(contract.risk_level)) {
        errors.push(`Invalid risk_level: ${contract.risk_level}. Must be one of: ${VALID_RISK_LEVELS.join(', ')}`);
    }

    // Validate governance
    if (contract.governance) {
        const gov = contract.governance;

        if (!gov.allowed_archetypes || gov.allowed_archetypes.length === 0) {
            errors.push('governance.allowed_archetypes must have at least 1 item');
        } else {
            for (const archetype of gov.allowed_archetypes) {
                if (!VALID_ARCHETYPES.includes(archetype)) {
                    errors.push(`Invalid archetype: ${archetype}`);
                }
            }
        }

        if (!gov.allowed_phases || gov.allowed_phases.length === 0) {
            errors.push('governance.allowed_phases must have at least 1 item');
        } else {
            for (const phase of gov.allowed_phases) {
                if (!VALID_PHASES.includes(phase)) {
                    errors.push(`Invalid phase: ${phase}`);
                }
            }
        }

        if (gov.required_status && !VALID_STATES.includes(gov.required_status)) {
            errors.push(`Invalid governance.required_status: ${gov.required_status}`);
        }
    }

    // Validate input_spec
    if (contract.input_spec) {
        if (!Array.isArray(contract.input_spec) || contract.input_spec.length === 0) {
            errors.push('input_spec must be a non-empty array');
        } else {
            contract.input_spec.forEach((field: FieldSpec, idx: number) => {
                if (!field.name) errors.push(`input_spec[${idx}]: missing 'name'`);
                if (!field.type) errors.push(`input_spec[${idx}]: missing 'type'`);
            });
        }
    }

    // Validate output_spec
    if (contract.output_spec) {
        if (!Array.isArray(contract.output_spec) || contract.output_spec.length === 0) {
            errors.push('output_spec must be a non-empty array');
        } else {
            contract.output_spec.forEach((field: FieldSpec, idx: number) => {
                if (!field.name) errors.push(`output_spec[${idx}]: missing 'name'`);
                if (!field.type) errors.push(`output_spec[${idx}]: missing 'type'`);
            });
        }
    }

    // Validate execution
    if (contract.execution) {
        const exec = contract.execution;
        if (typeof exec.side_effects !== 'boolean') {
            errors.push('execution.side_effects must be a boolean');
        }
        if (typeof exec.rollback_possible !== 'boolean') {
            errors.push('execution.rollback_possible must be a boolean');
        }
        if (typeof exec.idempotent !== 'boolean') {
            errors.push('execution.idempotent must be a boolean');
        }
    }

    // Validate audit
    if (contract.audit) {
        const audit = contract.audit;
        if (audit.trace_level && !VALID_TRACE_LEVELS.includes(audit.trace_level)) {
            errors.push(`Invalid audit.trace_level: ${audit.trace_level}`);
        }
        if (!audit.required_fields || audit.required_fields.length === 0) {
            warnings.push('audit.required_fields should not be empty');
        }
    }

    // Risk-specific validations
    if (contract.risk_level === 'R2' || contract.risk_level === 'R3') {
        if (!contract.failure_info) {
            warnings.push(`${contract.risk_level} contracts should have failure_info section`);
        }
    }

    if (contract.risk_level === 'R3') {
        if (!contract.governance?.required_decisions || contract.governance.required_decisions.length === 0) {
            warnings.push('R3 contracts should have required_decisions');
        }
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings
    };
}

/**
 * Validate inputs against contract input_spec
 */
export function validateInputs(
    contract: SkillContract,
    inputs: Record<string, unknown>
): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const spec of contract.input_spec) {
        const value = inputs[spec.name];

        // Check required
        if (spec.required !== false && value === undefined && spec.default === undefined) {
            errors.push(`Missing required input: ${spec.name}`);
            continue;
        }

        if (value !== undefined) {
            // Type validation (basic)
            const actualType = Array.isArray(value) ? 'array' : typeof value;
            const expectedType = spec.type.toLowerCase();

            if (expectedType !== 'any' && actualType !== expectedType) {
                // Allow number for integer
                if (!(expectedType === 'integer' && actualType === 'number')) {
                    errors.push(
                        `Input '${spec.name}': expected ${spec.type}, got ${actualType}`
                    );
                }
            }

            // Enum validation
            if (spec.enum && !spec.enum.includes(value as string)) {
                errors.push(
                    `Input '${spec.name}': must be one of: ${spec.enum.join(', ')}`
                );
            }

            // Max length
            if (spec.max_length && typeof value === 'string' && value.length > spec.max_length) {
                errors.push(
                    `Input '${spec.name}': exceeds max_length of ${spec.max_length}`
                );
            }

            // Range
            if (spec.range && typeof value === 'number') {
                const [min, max] = spec.range;
                if (value < min || value > max) {
                    errors.push(
                        `Input '${spec.name}': must be between ${min} and ${max}`
                    );
                }
            }
        }
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings
    };
}
