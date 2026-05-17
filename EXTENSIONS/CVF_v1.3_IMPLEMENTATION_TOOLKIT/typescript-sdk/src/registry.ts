/**
 * CVF TypeScript SDK - Skill Registry
 */

import type {
    Capability,
    SkillContract,
    CapabilityState,
    QueryOptions,
    ValidationResult
} from './types';
import { validateContract } from './validator';

/**
 * Skill Registry - manages capability registration and lifecycle
 */
export class SkillRegistry {
    private capabilities: Map<string, Capability> = new Map();
    private stateTransitions: Map<CapabilityState, CapabilityState[]> = new Map([
        ['PROPOSED', ['APPROVED']],
        ['APPROVED', ['ACTIVE']],
        ['ACTIVE', ['DEPRECATED']],
        ['DEPRECATED', ['RETIRED', 'ACTIVE']],
        ['RETIRED', []]
    ]);

    /**
     * Register a new capability
     */
    register(contract: SkillContract, owner?: string): Capability {
        // Validate contract
        const validation = validateContract(contract);
        if (!validation.valid) {
            throw new Error(`Invalid contract: ${validation.errors.join(', ')}`);
        }

        // Check for existing
        if (this.capabilities.has(contract.capability_id)) {
            throw new Error(`Capability already exists: ${contract.capability_id}`);
        }

        // Create capability with initial state
        const capability: Capability = {
            ...contract,
            state: 'PROPOSED',
            owner: owner,
            registered_by: owner,
            registered_at: new Date().toISOString()
        };

        this.capabilities.set(contract.capability_id, capability);
        return capability;
    }

    /**
     * Get a capability by ID
     */
    get(capabilityId: string): Capability | undefined {
        return this.capabilities.get(capabilityId);
    }

    /**
     * List all capabilities
     */
    list(options?: QueryOptions): Capability[] {
        let results = Array.from(this.capabilities.values());

        if (options?.domain) {
            results = results.filter(c => c.domain === options.domain);
        }
        if (options?.risk_level) {
            results = results.filter(c => c.risk_level === options.risk_level);
        }
        if (options?.state) {
            results = results.filter(c => c.state === options.state);
        }
        if (options?.archetype) {
            results = results.filter(c =>
                c.governance.allowed_archetypes.includes(options.archetype!)
            );
        }
        if (options?.phase) {
            results = results.filter(c =>
                c.governance.allowed_phases.includes(options.phase!)
            );
        }

        return results;
    }

    /**
     * Transition capability to new state
     */
    transition(capabilityId: string, newState: CapabilityState, actor?: string): Capability {
        const capability = this.capabilities.get(capabilityId);
        if (!capability) {
            throw new Error(`Capability not found: ${capabilityId}`);
        }

        const allowedTransitions = this.stateTransitions.get(capability.state) || [];
        if (!allowedTransitions.includes(newState)) {
            throw new Error(
                `Invalid transition: ${capability.state} -> ${newState}. ` +
                `Allowed: ${allowedTransitions.join(', ') || 'none'}`
            );
        }

        capability.state = newState;
        capability.last_audit = new Date().toISOString();

        return capability;
    }

    /**
     * Check if capability can be executed
     */
    canExecute(
        capabilityId: string,
        archetype: string,
        phase: string
    ): boolean {
        const capability = this.capabilities.get(capabilityId);
        if (!capability) return false;

        // Must be ACTIVE
        if (capability.state !== 'ACTIVE') return false;

        // Check archetype
        if (!capability.governance.allowed_archetypes.includes(archetype as any)) {
            return false;
        }

        // Check phase
        if (!capability.governance.allowed_phases.includes(phase as any)) {
            return false;
        }

        return true;
    }

    /**
     * Deprecate a capability
     */
    deprecate(capabilityId: string, reason: string): Capability {
        const capability = this.transition(capabilityId, 'DEPRECATED');
        capability.deprecation_reason = reason;
        return capability;
    }

    /**
     * Export registry to JSON
     */
    export(): object {
        return {
            version: '1.0',
            exported_at: new Date().toISOString(),
            capabilities: Array.from(this.capabilities.values())
        };
    }

    /**
     * Import capabilities from JSON
     */
    import(data: { capabilities: Capability[] }): void {
        for (const capability of data.capabilities) {
            this.capabilities.set(capability.capability_id, capability);
        }
    }

    /**
     * Get registry stats
     */
    stats(): Record<string, number> {
        const capabilities = Array.from(this.capabilities.values());
        return {
            total: capabilities.length,
            active: capabilities.filter(c => c.state === 'ACTIVE').length,
            proposed: capabilities.filter(c => c.state === 'PROPOSED').length,
            deprecated: capabilities.filter(c => c.state === 'DEPRECATED').length,
            retired: capabilities.filter(c => c.state === 'RETIRED').length,
            r0: capabilities.filter(c => c.risk_level === 'R0').length,
            r1: capabilities.filter(c => c.risk_level === 'R1').length,
            r2: capabilities.filter(c => c.risk_level === 'R2').length,
            r3: capabilities.filter(c => c.risk_level === 'R3').length
        };
    }
}
