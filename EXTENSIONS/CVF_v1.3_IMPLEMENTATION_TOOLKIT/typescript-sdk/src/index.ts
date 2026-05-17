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

// Types
export type {
    RiskLevel,
    CapabilityState,
    Archetype,
    Phase,
    TraceLevel,
    FieldSpec,
    GovernanceSpec,
    ExecutionSpec,
    AuditSpec,
    FailureInfo,
    SkillContract,
    Capability,
    AuditLogEntry,
    ValidationResult,
    ExecutionResult,
    QueryOptions
} from './types';

// Validator
export {
    validateContract,
    validateInputs
} from './validator';

// Registry
export { SkillRegistry } from './registry';

// Loader
export {
    loadContract,
    parseContract,
    loadContractsFromDir
} from './loader';

// Audit
export { AuditTracer } from './audit';

// Version
export const VERSION = '1.3.0';

// Re-export common utilities
export { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
