import { NextRequest, NextResponse } from 'next/server';
import {
    processOpenClawMessage,
    getProposalHistory,
    clearProposalHistory,
} from '@/lib/openclaw-engine';

/**
 * POST /api/openclaw — Process a message through the OpenClaw pipeline
 *
 * Body: { message: string, provider?: string, apiKey?: string, model?: string }
 * Returns: { proposal, guard, decision, response, mode }
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        if (!body?.message || typeof body.message !== 'string' || !body.message.trim()) {
            return NextResponse.json(
                { error: 'Missing required field: message' },
                { status: 400 },
            );
        }

        const result = await processOpenClawMessage(body.message.trim(), {
            provider: body.provider,
            apiKey: body.apiKey,
            model: body.model,
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error('OpenClaw API error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal error' },
            { status: 500 },
        );
    }
}

/**
 * GET /api/openclaw — Return recent proposal history
 *
 * Query: ?clear=true to reset history
 * Returns: { proposals: StoredProposal[] }
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);

    if (searchParams.get('clear') === 'true') {
        clearProposalHistory();
        return NextResponse.json({ proposals: [], cleared: true });
    }

    return NextResponse.json({ proposals: getProposalHistory() });
}
