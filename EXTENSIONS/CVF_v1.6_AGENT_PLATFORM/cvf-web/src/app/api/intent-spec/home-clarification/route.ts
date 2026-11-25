import { NextResponse } from 'next/server';
import { homeSpecExternalRequest } from '@/components/home/home-spec-external-request';
import { readBoundedRequestBody } from '@/lib/bounded-request-body';
import { appendCostEvent } from '@/lib/control-plane-events';
import type { HomeClarificationInput } from '@/lib/home-spec-clarification';
import { verifySessionCookie } from '@/lib/middleware-auth';
import { resolveOpenAIApiKey } from '@/lib/openai-env';
import { isSameBrowserOrigin } from '@/lib/server/browser-origin';
import { hasHomeClarificationBudgetStore, reserveHomeClarification } from '@/lib/server/home-spec-clarification-budget';
import { buildHomeClarificationCall, HOME_CLARIFICATION_MODEL, runHomeClarificationCall } from '@/lib/server/home-spec-clarification-provider';

export const runtime = 'nodejs';

function reply(status: string, httpStatus: number) {
    return NextResponse.json({ status }, { status: httpStatus, headers: { 'Cache-Control': 'no-store' } });
}

async function readInput(request: Request): Promise<HomeClarificationInput | null> {
    try {
        const raw = await readBoundedRequestBody(request, 12_000);
        if (!raw) return null;
        const value = JSON.parse(raw);
        if (!value || !['vi', 'en'].includes(value.language) || typeof value.goal !== 'string' || !value.goal.trim()
            || typeof value.extra !== 'string' || !Array.isArray(value.answers) || value.answers.length > 30
            || value.answers.some((answer: unknown) => typeof answer !== 'string')) return null;
        return { language: value.language, goal: value.goal, extra: value.extra, answers: value.answers };
    } catch {
        return null;
    }
}

export async function POST(request: Request) {
    if (!isSameBrowserOrigin(request)) return reply('unavailable', 403);
    const session = request.headers.has('authorization') ? null : await verifySessionCookie(request).catch(() => null);
    if (!session || session.impersonation) return reply('sign_in', 401);
    const key = resolveOpenAIApiKey();
    if (!key) return reply('missing_key', 503);
    const hostname = new URL(request.url).hostname;
    if (!hasHomeClarificationBudgetStore(hostname)) return reply('unavailable', 503);
    const input = await readInput(request);
    if (!input) return reply('invalid_input', 400);
    const details = [input.extra, ...input.answers].join('\n');
    if (homeSpecExternalRequest(input.goal, details)) return reply('outside_scope', 422);

    const call = buildHomeClarificationCall(input);
    try {
        const settle = await reserveHomeClarification(hostname, session.userId, call.bound.microUsd);
        if (!settle) return reply('limit', 429);
        const result = await runHomeClarificationCall(call, key, request.signal);
        const usage = result.usage ?? call.bound;
        // Preserve the conservative reservation if the provider sent no reliable usage.
        await appendCostEvent({
            userId: session.userId, teamId: session.teamId ?? 'team_exec', orgId: session.orgId ?? 'org_cvf',
            templateId: result.usage ? 'home-spec-clarification' : 'home-spec-clarification-unconfirmed',
            provider: 'openai', model: HOME_CLARIFICATION_MODEL, inputTokens: usage.inputTokens,
            outputTokens: usage.outputTokens, estimatedCostUSD: usage.microUsd / 1_000_000,
        });
        if (result.usage) await settle(usage.microUsd);
        if (result.status === 'ready') {
            return NextResponse.json({ status: result.status, clarification: result.clarification }, { headers: { 'Cache-Control': 'no-store' } });
        }
        return reply(result.status, result.status === 'timeout' ? 504 : 502);
    } catch {
        return reply('unavailable', 503);
    }
}
