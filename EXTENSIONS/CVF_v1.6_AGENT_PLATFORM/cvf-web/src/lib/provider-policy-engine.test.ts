import { describe, it, expect, vi } from 'vitest';
import { resolveProviderPolicy, executeWithFailover, type ProviderPolicyInput } from './provider-policy-engine';

const ALL_PROVIDERS = ['alibaba', 'openai', 'deepseek', 'gemini', 'claude'] as const;
type P = typeof ALL_PROVIDERS[number];

function input(overrides: Partial<ProviderPolicyInput> = {}): ProviderPolicyInput {
    return {
        riskLevel: 'R1',
        preference: 'auto',
        configuredProviders: [...ALL_PROVIDERS] as P[],
        requestedProvider: 'alibaba',
        ...overrides,
    };
}

describe('resolveProviderPolicy — R0/R1 preference respected', () => {
    it('auto: returns requested provider if eligible', () => {
        const result = resolveProviderPolicy(input({ riskLevel: 'R0', preference: 'auto', requestedProvider: 'openai' }));
        expect(result.resolvedProvider).toBe('openai');
        expect(result.riskTierOverride).toBe(false);
    });

    it('fast: returns lowest-cost eligible provider', () => {
        const result = resolveProviderPolicy(input({ riskLevel: 'R0', preference: 'fast' }));
        // alibaba is 'free' tier — should win on cost
        expect(result.resolvedProvider).toBe('alibaba');
        expect(result.riskTierOverride).toBe(false);
    });

    it('accurate: returns highest-capability eligible provider', () => {
        const result = resolveProviderPolicy(input({ riskLevel: 'R0', preference: 'accurate' }));
        // claude has highest capability order
        expect(result.resolvedProvider).toBe('claude');
        expect(result.riskTierOverride).toBe(false);
    });

    it('includes fallback chain excluding resolved provider', () => {
        const result = resolveProviderPolicy(input({ riskLevel: 'R0', preference: 'auto', requestedProvider: 'alibaba' }));
        expect(result.fallbackChain).not.toContain('alibaba');
        expect(result.failoverAvailable).toBe(true);
    });
});

describe('resolveProviderPolicy — R2/R3 governance override', () => {
    it('R2: ignores preference, returns requested if eligible', () => {
        // alibaba maxRiskLevel is R1 — not eligible at R2
        // openai maxRiskLevel is R2 — eligible
        const result = resolveProviderPolicy(input({
            riskLevel: 'R2',
            preference: 'fast',
            requestedProvider: 'openai',
            configuredProviders: ['openai', 'gemini', 'claude'],
        }));
        expect(result.resolvedProvider).toBe('openai');
        expect(result.riskTierOverride).toBe(true);
    });

    it('R2: falls to first eligible if requested not eligible', () => {
        // alibaba is not eligible at R2
        const result = resolveProviderPolicy(input({
            riskLevel: 'R2',
            preference: 'accurate',
            requestedProvider: 'alibaba',
            configuredProviders: ['alibaba', 'openai', 'gemini'],
        }));
        expect(result.resolvedProvider).not.toBe('alibaba');
        expect(result.riskTierOverride).toBe(true);
        expect(result.rationale).toMatch(/R2/);
    });

    it('R3: override active, preference ignored', () => {
        const result = resolveProviderPolicy(input({
            riskLevel: 'R3',
            preference: 'accurate',
            requestedProvider: 'openai',
            configuredProviders: ['openai', 'claude'],
        }));
        expect(result.riskTierOverride).toBe(true);
    });
});

describe('resolveProviderPolicy — edge cases', () => {
    it('returns pass-through rationale when no eligible providers', () => {
        // alibaba maxRiskLevel is R1 — not eligible at R3
        const result = resolveProviderPolicy(input({
            riskLevel: 'R3',
            configuredProviders: ['alibaba'],
            requestedProvider: 'alibaba',
        }));
        expect(result.rationale).toMatch(/routing layer/);
        expect(result.resolvedProvider).toBe('alibaba');
    });

    it('fallbackChain empty when only one eligible provider', () => {
        const result = resolveProviderPolicy(input({
            riskLevel: 'R0',
            configuredProviders: ['alibaba'],
            requestedProvider: 'alibaba',
        }));
        expect(result.fallbackChain).toHaveLength(0);
        expect(result.failoverAvailable).toBe(false);
    });
});

describe('executeWithFailover', () => {
    it('returns primary result when primary succeeds', async () => {
        const execute = vi.fn().mockResolvedValue('ok');
        const r = await executeWithFailover('alibaba', ['openai'], false, execute);
        expect(r.provider).toBe('alibaba');
        expect(r.failoverUsed).toBe(false);
        expect(r.result).toBe('ok');
        expect(execute).toHaveBeenCalledOnce();
    });

    it('uses fallback when primary fails and riskTierOverride is false', async () => {
        const execute = vi.fn()
            .mockRejectedValueOnce(new Error('primary down'))
            .mockResolvedValue('fallback-ok');
        const r = await executeWithFailover('alibaba', ['openai'], false, execute);
        expect(r.provider).toBe('openai');
        expect(r.failoverUsed).toBe(true);
        expect(r.result).toBe('fallback-ok');
    });

    it('throws when primary fails and riskTierOverride is true', async () => {
        const execute = vi.fn().mockRejectedValue(new Error('primary down'));
        await expect(
            executeWithFailover('openai', ['gemini'], true, execute)
        ).rejects.toThrow('primary down');
        expect(execute).toHaveBeenCalledOnce();
    });

    it('throws when primary fails and fallbackChain is empty', async () => {
        const execute = vi.fn().mockRejectedValue(new Error('primary down'));
        await expect(
            executeWithFailover('openai', [], false, execute)
        ).rejects.toThrow('primary down');
    });
});
