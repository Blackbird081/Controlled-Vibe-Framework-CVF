import { NextRequest, NextResponse } from 'next/server';
import { readBoundedRequestBody } from '@/lib/bounded-request-body';
import { resolveVerifiedSessionProvenance } from '@/lib/middleware-auth';
import { verifyServiceTokenRequest } from '@/lib/service-token-auth';
import { loadLineageConfig, resolveServiceIdentity, resolveSessionIdentity, type LineageFailure } from '@/lib/server/canonical-web-lineage';
import { controlOperation, type ControlAction } from '@/lib/server/canonical-web-admission-control';

export const runtime = 'nodejs';
const json = (body: object, status: number) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
function failure(f: LineageFailure) {
    if (['RELEASE_NOT_APPLICABLE', 'RELEASE_TOO_EARLY', 'HELD_RELEASE_LIMIT'].includes(f.reason)) return json({ success: false, code: f.reason, error: f.reason === 'HELD_RELEASE_LIMIT' ? 'Release capacity exhausted. An operator must run lineage maintenance.' : 'Held execution release was refused.', ...('releasableAt' in f && typeof f.releasableAt === 'string' ? { releasableAt: f.releasableAt } : {}) }, f.reason === 'HELD_RELEASE_LIMIT' ? 503 : 409);
    const code = f.reason === 'CONTROL_MIGRATION_REQUIRED' ? f.reason : f.reason === 'ADMISSION_CAPACITY' ? f.reason :
        f.reason === 'ADMISSION_CONFLICT' ? f.reason : f.reason === 'ADMISSION_STOPPED' ? f.reason :
        ({ BUSY: 'JOURNAL_BUSY', NOT_READY: 'JOURNAL_NOT_READY', COMMIT_UNKNOWN: 'JOURNAL_COMMIT_UNKNOWN', CONFLICT: 'ADMISSION_CONFLICT' } as Record<string, string>)[f.code] ?? 'JOURNAL_UNAVAILABLE';
    return json({ success: false, code, error: 'Control state is unavailable or the operation was refused.' }, code === 'ADMISSION_CONFLICT' || code === 'ADMISSION_STOPPED' ? 409 : 503);
}
function applicationOrigin(request: NextRequest): string | null {
    const configured = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL;
    try {
        const url = new URL(configured === undefined ? request.url : configured);
        return (url.protocol === 'http:' || url.protocol === 'https:') && !url.username && !url.password ? url.origin : null;
    } catch { return null; }
}
export async function POST(request: NextRequest) {
    let raw: string | null;
    try { raw = await readBoundedRequestBody(request, 4096); } catch { return json({ success: false, code: 'BAD_PAYLOAD', error: 'Invalid request.' }, 400); }
    if (raw === null) return json({ success: false, code: 'BAD_PAYLOAD', error: 'Request too large.' }, 413);
    const provenance = await resolveVerifiedSessionProvenance(request);
    if (!provenance.qualified) {
        // A supplied session cookie, even if invalid, must never be replaced by service identity.
        const cookies = request.headers.get('cookie') ?? '';
        if (provenance.reason !== 'NO_SESSION' || /(?:^|;\s*)(?:__Secure-)?(?:next-auth|authjs)\.session-token(?:\.\d+)?=/.test(cookies)) return json({ success: false, code: 'UNAUTHORIZED', error: 'Verified identity required.' }, 401);
        const token = request.headers.get('x-cvf-service-token');
        if (!token || !verifyServiceTokenRequest({ configuredToken: process.env.CVF_SERVICE_TOKEN, presentedToken: token,
            signature: request.headers.get('x-cvf-service-signature'), timestamp: request.headers.get('x-cvf-service-timestamp'), body: raw })) return json({ success: false, code: 'UNAUTHORIZED', error: 'Verified identity required.' }, 401);
    }
    let body: unknown;
    try { body = JSON.parse(raw); } catch { return json({ success: false, code: 'BAD_PAYLOAD', error: 'Invalid request.' }, 400); }
    if (!body || typeof body !== 'object' || Array.isArray(body)) return json({ success: false, code: 'BAD_PAYLOAD', error: 'Invalid request.' }, 400);
    const b = body as Record<string, unknown>;
    const valid = ((b.action === 'status' || b.action === 'stop') && Object.keys(b).length === 1) ||
        (b.action === 'resume' && Object.keys(b).length === 2 && Object.hasOwn(b, 'expectedRevision') && Number.isSafeInteger(b.expectedRevision) && (b.expectedRevision as number) >= 0) ||
        (b.action === 'release_held' && Object.keys(b).length === 3 && Number.isSafeInteger(b.expectedRevision) && (b.expectedRevision as number) >= 0 && typeof b.canonicalId === 'string' && /^[A-Za-z0-9._-]{1,100}$/.test(b.canonicalId));
    if (!valid) return json({ success: false, code: 'BAD_PAYLOAD', error: 'Invalid request.' }, 400);
    const origin = request.headers.get('origin');
    if (b.action !== 'status') {
        const allowedOrigin = applicationOrigin(request);
        if (!allowedOrigin || (origin && origin !== allowedOrigin)) return json({ success: false, code: 'FORBIDDEN_ORIGIN', error: 'Origin denied.' }, 403);
    }
    const config = loadLineageConfig();
    if (!config.ok) return failure(config);
    const identity = provenance.qualified ? resolveSessionIdentity(config.value, provenance) : resolveServiceIdentity(config.value, true);
    if (!identity.ok) return failure(identity);
    const result = controlOperation(config.value, identity.value, b as ControlAction);
    return result.ok ? json({ success: true, control: result.value }, 200) : failure(result);
}
