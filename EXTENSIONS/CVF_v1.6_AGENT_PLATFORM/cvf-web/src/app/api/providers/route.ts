import { NextResponse } from 'next/server';
import { AIProvider, DEFAULT_MODELS, ProviderStatus } from '@/lib/ai';
import { isAlibabaApiKeyConfigured, resolveAlibabaApiKeySourceName } from '@/lib/alibaba-env';
import { isDeepSeekApiKeyConfigured, resolveDeepSeekApiKeySourceName } from '@/lib/deepseek-env';
import type { LaneStatus } from '@/lib/provider-lane-status';

/** Canary certification status per provider — updated by evaluate_cvf_provider_lane_certification.py */
const KNOWN_LANE_STATUS: Partial<Record<AIProvider, LaneStatus>> = {
    alibaba: 'CERTIFIED',  // 3 consecutive PASS 6/6 — 2026-04-21
    deepseek: 'CERTIFIED', // 3 consecutive PASS 6/6 — 2026-04-21
};

function laneStatusFor(provider: AIProvider, configured: boolean): LaneStatus {
    if (!configured) return 'UNCONFIGURED';
    return KNOWN_LANE_STATUS[provider] ?? 'EXPERIMENTAL';
}

function providerStatus(input: {
    provider: AIProvider;
    configured: boolean;
    model: string;
    keySourceName?: string | null;
}): ProviderStatus {
    return {
        provider: input.provider,
        configured: input.configured,
        model: input.model,
        laneStatus: laneStatusFor(input.provider, input.configured),
        keySourceName: input.configured ? input.keySourceName ?? input.provider.toUpperCase() + '_API_KEY' : null,
        readiness: input.configured ? 'live_task_ready' : 'not_configured',
    };
}

export async function GET() {
    const alibabaConfigured = isAlibabaApiKeyConfigured();
    const deepseekConfigured = isDeepSeekApiKeyConfigured();

    const providers: ProviderStatus[] = [
        providerStatus({
            provider: 'openai',
            configured: !!process.env.OPENAI_API_KEY,
            model: DEFAULT_MODELS.openai,
            keySourceName: 'OPENAI_API_KEY',
        }),
        providerStatus({
            provider: 'claude',
            configured: !!process.env.ANTHROPIC_API_KEY,
            model: DEFAULT_MODELS.claude,
            keySourceName: 'ANTHROPIC_API_KEY',
        }),
        providerStatus({
            provider: 'gemini',
            configured: !!process.env.GOOGLE_AI_API_KEY,
            model: DEFAULT_MODELS.gemini,
            keySourceName: 'GOOGLE_AI_API_KEY',
        }),
        providerStatus({
            provider: 'alibaba',
            configured: alibabaConfigured,
            model: DEFAULT_MODELS.alibaba,
            keySourceName: resolveAlibabaApiKeySourceName(),
        }),
        providerStatus({
            provider: 'openrouter',
            configured: !!process.env.OPENROUTER_API_KEY,
            model: DEFAULT_MODELS.openrouter,
            keySourceName: 'OPENROUTER_API_KEY',
        }),
        providerStatus({
            provider: 'deepseek',
            configured: deepseekConfigured,
            model: DEFAULT_MODELS.deepseek,
            keySourceName: resolveDeepSeekApiKeySourceName(),
        }),
    ];

    const defaultProvider = (process.env.DEFAULT_AI_PROVIDER as AIProvider) || 'openai';
    const anyConfigured = providers.some(p => p.configured);

    return NextResponse.json({
        providers,
        defaultProvider,
        anyConfigured,
        message: anyConfigured
            ? 'At least one provider is configured'
            : 'No providers configured. Please set API keys in .env.local',
    });
}
