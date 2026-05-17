import { describe, it, expect } from 'vitest';
import { SkillRegistry } from '../registry';
import { makeContract } from './fixtures';

describe('SkillRegistry', () => {
    it('registers a contract and sets initial state', () => {
        const registry = new SkillRegistry();
        const contract = makeContract();

        const capability = registry.register(contract, 'team-a');

        expect(capability.capability_id).toBe('CODE_REVIEW_v1');
        expect(capability.state).toBe('PROPOSED');
        expect(capability.owner).toBe('team-a');
        expect(capability.registered_by).toBe('team-a');
        expect(registry.get('CODE_REVIEW_v1')).toBeTruthy();
    });

    it('prevents duplicate registration', () => {
        const registry = new SkillRegistry();
        const contract = makeContract();
        registry.register(contract);

        expect(() => registry.register(contract)).toThrow(/already exists/i);
    });

    it('validates allowed transitions', () => {
        const registry = new SkillRegistry();
        const contract = makeContract();
        registry.register(contract);

        expect(() => registry.transition(contract.capability_id, 'ACTIVE')).toThrow(/Invalid transition/i);
        registry.transition(contract.capability_id, 'APPROVED');
        registry.transition(contract.capability_id, 'ACTIVE');

        const updated = registry.get(contract.capability_id);
        expect(updated?.state).toBe('ACTIVE');
        expect(updated?.last_audit).toBeTruthy();
    });

    it('checks execution permissions', () => {
        const registry = new SkillRegistry();
        const contract = makeContract();
        registry.register(contract);
        registry.transition(contract.capability_id, 'APPROVED');
        registry.transition(contract.capability_id, 'ACTIVE');

        expect(registry.canExecute(contract.capability_id, 'Execution', 'C')).toBe(true);
        expect(registry.canExecute(contract.capability_id, 'Analysis', 'A')).toBe(false);
    });

    it('returns stats', () => {
        const registry = new SkillRegistry();
        registry.register(makeContract({ capability_id: 'CAP_ONE_v1', risk_level: 'R0' }));
        registry.register(makeContract({ capability_id: 'CAP_TWO_v1', risk_level: 'R2' }));

        const stats = registry.stats();
        expect(stats.total).toBe(2);
        expect(stats.proposed).toBe(2);
        expect(stats.r0).toBe(1);
        expect(stats.r2).toBe(1);
    });
});
