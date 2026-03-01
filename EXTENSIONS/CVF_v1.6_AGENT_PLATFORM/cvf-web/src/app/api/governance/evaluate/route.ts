import { NextRequest, NextResponse } from 'next/server';
import { verifySessionCookie } from '@/lib/middleware-auth';
import { governanceEvaluate } from '@/lib/governance-engine';
import type { GovernanceEvaluateRequest } from '@/types/governance-engine';

function isBuildPhase(phase?: string): boolean {
    if (!phase) return false;
    const normalized = phase.trim().toUpperCase();
    return normalized === 'BUILD' || normalized === 'PHASE C' || normalized === 'C';
}

/**
 * POST /api/governance/evaluate
 * Proxy to v1.6.1 Governance Engine — full pipeline evaluation.
 * Requires auth (session cookie or service token).
 */
export async function POST(request: NextRequest) {
    try {
        // Auth check
        const session = await verifySessionCookie(request);
        const serviceToken = request.headers.get('x-cvf-service-token');
        const configuredToken = process.env.CVF_SERVICE_TOKEN;
        const isServiceAllowed = configuredToken && serviceToken === configuredToken;

        if (!session && !isServiceAllowed) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized: please login.' },
                { status: 401 },
            );
        }

        const body = await request.json();

        // Validate required fields
        if (!body.request_id || !body.artifact_id || !body.payload) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Missing required fields: request_id, artifact_id, payload',
                },
                { status: 400 },
            );
        }

        if (isBuildPhase(body.cvf_phase) && !body.skill_preflight?.declared) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Skill Preflight declaration is required for BUILD evaluation requests.',
                },
                { status: 400 },
            );
        }

        const payload: GovernanceEvaluateRequest = {
            request_id: body.request_id,
            artifact_id: body.artifact_id,
            payload: body.payload,
            cvf_phase: body.cvf_phase,
            cvf_risk_level: body.cvf_risk_level,
            skill_preflight: body.skill_preflight,
        };

        const result = await governanceEvaluate(payload);

        if (!result) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Governance Engine unavailable — use client-side evaluation as fallback.',
                    fallback: true,
                },
                { status: 503 },
            );
        }

        return NextResponse.json({ success: true, data: result });
    } catch (error) {
        console.error('[API] /governance/evaluate error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Internal error',
            },
            { status: 500 },
        );
    }
}
