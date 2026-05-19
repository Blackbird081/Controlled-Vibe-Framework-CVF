import { describe, expect, it } from 'vitest';
import {
    appBuilderFailureRecovery,
    documentationFailureRecovery,
    getGovernedPack,
    strategyAnalysisFailureRecovery,
} from './index';

const policies = [
    strategyAnalysisFailureRecovery,
    documentationFailureRecovery,
    appBuilderFailureRecovery,
];

describe('governed-packs registry', () => {
    it('returns strategy_analysis pack by templateId', () => {
        expect(getGovernedPack('strategy_analysis')).toMatchObject({
            packId: 'strategy_analysis',
            templateId: 'strategy_analysis',
        });
    });

    it('returns documentation pack by templateId', () => {
        expect(getGovernedPack('documentation')).toMatchObject({
            packId: 'documentation',
            templateId: 'documentation',
        });
    });

    it('returns app_builder_complete pack by templateId', () => {
        expect(getGovernedPack('app_builder_complete')).toMatchObject({
            packId: 'app_builder_complete',
            templateId: 'app_builder_complete',
        });
    });

    it('returns undefined for unknown templateId', () => {
        expect(getGovernedPack('unknown_template')).toBeUndefined();
    });

    it('all packs have non-empty recovery steps and escalation paths', () => {
        policies.forEach((policy) => {
            expect(policy.recoverySteps.length).toBeGreaterThan(0);
            expect(policy.escalationPath.length).toBeGreaterThan(0);
        });
    });

    it('all packs have matching packId in registry entry', () => {
        policies.forEach((policy) => {
            const pack = getGovernedPack(policy.packId);
            expect(pack?.packId).toBe(policy.packId);
            expect(pack?.failureRecovery).toBe(policy);
        });
    });
});
