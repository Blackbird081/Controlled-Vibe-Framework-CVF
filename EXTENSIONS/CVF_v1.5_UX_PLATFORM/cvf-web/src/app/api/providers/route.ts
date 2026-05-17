import { NextResponse } from 'next/server';
import { AIProvider, DEFAULT_MODELS, ProviderStatus } from '@/lib/ai';

export async function GET() {
    const providers: ProviderStatus[] = [
        {
            provider: 'openai',
            configured: !!process.env.OPENAI_API_KEY,
            model: DEFAULT_MODELS.openai,
        },
        {
            provider: 'claude',
            configured: !!process.env.ANTHROPIC_API_KEY,
            model: DEFAULT_MODELS.claude,
        },
        {
            provider: 'gemini',
            configured: !!process.env.GOOGLE_AI_API_KEY,
            model: DEFAULT_MODELS.gemini,
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
