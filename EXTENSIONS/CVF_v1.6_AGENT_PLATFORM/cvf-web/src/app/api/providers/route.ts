import { NextResponse } from 'next/server';
import { AIProvider, DEFAULT_MODELS, ProviderStatus } from '@/lib/ai';
import { isAlibabaApiKeyConfigured } from '@/lib/alibaba-env';
import { isDeepSeekApiKeyConfigured } from '@/lib/deepseek-env';
import type { LaneStatus } from '@/lib/provider-lane-status';

/** Canary certification status per provider — updated by evaluate_cvf_provider_lane_certification.py */
const KNOWN_LANE_STATUS: Partial<Record<AIProvider, LaneStatus>> = {
    alibaba: 'CERTIFIED',    // 3 consecutive PASS 6/6 — 2026-04-21
    deepseek: 'CANARY_PASS', // 1 PASS 6/6, 2 more needed for CERTIFIED — 2026-04-21
};

function laneStatusFor(provider: AIProvider, configured: boolean): LaneStatus {
    if (!configured) return 'UNCONFIGURED';
    return KNOWN_LANE_STATUS[provider] ?? 'EXPERIMENTAL';
}

export async function GET() {
    const alibabaConfigured = isAlibabaApiKeyConfigured();
    const deepseekConfigured = isDeepSeekApiKeyConfigured();

    const providers: ProviderStatus[] = [
        {
            provider: 'openai',
            configured: !!process.env.OPENAI_API_KEY,
            model: DEFAULT_MODELS.openai,
            laneStatus: laneStatusFor('openai', !!process.env.OPENAI_API_KEY),
        },
        {
            provider: 'claude',
            configured: !!process.env.ANTHROPIC_API_KEY,
            model: DEFAULT_MODELS.claude,
            laneStatus: laneStatusFor('claude', !!process.env.ANTHROPIC_API_KEY),
        },
        {
            provider: 'gemini',
            configured: !!process.env.GOOGLE_AI_API_KEY,
            model: DEFAULT_MODELS.gemini,
            laneStatus: laneStatusFor('gemini', !!process.env.GOOGLE_AI_API_KEY),
        },
        {
            provider: 'alibaba',
            configured: alibabaConfigured,
            model: DEFAULT_MODELS.alibaba,
            laneStatus: laneStatusFor('alibaba', alibabaConfigured),
        },
        {
            provider: 'openrouter',
            configured: !!process.env.OPENROUTER_API_KEY,
            model: DEFAULT_MODELS.openrouter,
            laneStatus: laneStatusFor('openrouter', !!process.env.OPENROUTER_API_KEY),
        },
        {
            provider: 'deepseek',
            configured: deepseekConfigured,
            model: DEFAULT_MODELS.deepseek,
            laneStatus: laneStatusFor('deepseek', deepseekConfigured),
        },
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
