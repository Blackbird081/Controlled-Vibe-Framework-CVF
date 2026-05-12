import type { AIProvider } from './ai/types';
import { WEB_PROVIDER_DEFINITIONS, type RiskLevel } from './ai/provider-router-adapter';

export type ProviderPreference = 'fast' | 'accurate' | 'auto';

export interface ProviderPolicyInput {
    riskLevel: RiskLevel;
    preference: ProviderPreference;
    configuredProviders: AIProvider[];
    requestedProvider: AIProvider;
}

export interface ProviderPolicyResult {
    resolvedProvider: AIProvider;
    preference: ProviderPreference;
    riskTierOverride: boolean;
    failoverAvailable: boolean;
    fallbackChain: AIProvider[];
    rationale: string;
}

const RISK_ORDER: Record<RiskLevel, number> = { R0: 0, R1: 1, R2: 2, R3: 3 };

// Cost tier ordering: lower index = cheaper
const COST_ORDER: Record<string, number> = { free: 0, standard: 1, premium: 2 };

// Capability proxy: higher index = more capable (rough ranking)
const CAPABILITY_ORDER: Record<AIProvider, number> = {
    alibaba: 0,
    deepseek: 1,
    openrouter: 2,
    openai: 3,
    gemini: 3,
    claude: 4,
};

function eligibleForRisk(provider: AIProvider, riskLevel: RiskLevel): boolean {
    const def = WEB_PROVIDER_DEFINITIONS[provider];
    if (!def) return false;
    return RISK_ORDER[riskLevel] <= RISK_ORDER[def.maxRiskLevel];
}

function resolveByPreference(
    candidates: AIProvider[],
    preference: ProviderPreference,
    requested: AIProvider,
): AIProvider {
    if (preference === 'auto') {
        return candidates.includes(requested) ? requested : candidates[0];
    }
    if (preference === 'fast') {
        // Prefer lowest cost tier, then lowest capability (fastest/cheapest)
        return [...candidates].sort((a, b) => {
            const da = WEB_PROVIDER_DEFINITIONS[a];
            const db = WEB_PROVIDER_DEFINITIONS[b];
            const costDiff = (COST_ORDER[da?.costTier ?? 'standard'] ?? 1) - (COST_ORDER[db?.costTier ?? 'standard'] ?? 1);
            if (costDiff !== 0) return costDiff;
            return (CAPABILITY_ORDER[a] ?? 0) - (CAPABILITY_ORDER[b] ?? 0);
        })[0];
    }
    // accurate: prefer highest capability
    return [...candidates].sort((a, b) => (CAPABILITY_ORDER[b] ?? 0) - (CAPABILITY_ORDER[a] ?? 0))[0];
}

/**
 * Resolve the final provider for a request given risk tier and user preference.
 *
 * Governance rules:
 *   R0/R1 — user preference respected within configured providers
 *   R2     — preference ignored; governance selects from eligible providers
 *   R3     — same as R2, strictest tier
 *
 * This function only activates after enforcement decision is ALLOW.
 * It does NOT override BLOCK/CLARIFY/NEEDS_APPROVAL.
 */
export function resolveProviderPolicy(input: ProviderPolicyInput): ProviderPolicyResult {
    const { riskLevel, preference, configuredProviders, requestedProvider } = input;
    const riskRank = RISK_ORDER[riskLevel];

    const eligible = configuredProviders.filter(p => eligibleForRisk(p, riskLevel));

    const riskTierOverride = riskRank >= RISK_ORDER['R2'];

    if (eligible.length === 0) {
        // Fallback: return requested provider regardless — routing layer will handle DENY
        return {
            resolvedProvider: requestedProvider,
            preference,
            riskTierOverride,
            failoverAvailable: false,
            fallbackChain: [],
            rationale: 'No eligible provider for risk tier; passing through to routing layer',
        };
    }

    // For R2+: ignore preference, use requested if eligible, else first eligible
    if (riskTierOverride) {
        const resolved = eligible.includes(requestedProvider) ? requestedProvider : eligible[0];
        const fallback = eligible.filter(p => p !== resolved);
        return {
            resolvedProvider: resolved,
            preference,
            riskTierOverride: true,
            failoverAvailable: fallback.length > 0,
            fallbackChain: fallback,
            rationale: `Risk tier ${riskLevel} overrides preference; governance selects ${resolved}`,
        };
    }

    // R0/R1: apply preference
    const resolved = resolveByPreference(eligible, preference, requestedProvider);
    const fallback = eligible.filter(p => p !== resolved);

    return {
        resolvedProvider: resolved,
        preference,
        riskTierOverride: false,
        failoverAvailable: fallback.length > 0,
        fallbackChain: fallback,
        rationale: preference === 'auto'
            ? `Auto preference: ${resolved} selected (requested or first eligible)`
            : `Preference '${preference}' applied: ${resolved} selected`,
    };
}

/**
 * Execute with failover: attempts primary provider, falls back to first in chain on error.
 * Only active for R0/R1 (riskTierOverride === false).
 */
export async function executeWithFailover<T>(
    primary: AIProvider,
    fallbackChain: AIProvider[],
    riskTierOverride: boolean,
    execute: (provider: AIProvider) => Promise<T>,
): Promise<{ result: T; provider: AIProvider; failoverUsed: boolean }> {
    try {
        const result = await execute(primary);
        return { result, provider: primary, failoverUsed: false };
    } catch (err) {
        if (riskTierOverride || fallbackChain.length === 0) throw err;
        const fallback = fallbackChain[0];
        const result = await execute(fallback);
        return { result, provider: fallback, failoverUsed: true };
    }
}
