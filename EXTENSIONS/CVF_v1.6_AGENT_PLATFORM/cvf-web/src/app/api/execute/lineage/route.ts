import { NextRequest, NextResponse } from 'next/server';
import { InvalidRequestBodyEncodingError, readBoundedRequestBody } from '@/lib/bounded-request-body';
import { resolveVerifiedSessionProvenance } from '@/lib/middleware-auth';
import { verifyServiceTokenRequest } from '@/lib/service-token-auth';
import {
    loadLineageConfig,
    readLineage,
    resolveServiceIdentity,
    resolveSessionIdentity,
    type LineageFailure,
    type LineageIdentity,
    type LineageResult,
} from '@/lib/server/canonical-web-lineage';

export const runtime = 'nodejs';

const MAX_BODY_BYTES = 4 * 1024;
const CANONICAL_ID_PATTERN = /^[a-zA-Z0-9._-]{1,100}$/;
const NO_STORE = { 'Cache-Control': 'no-store' };

function json(body: Record<string, unknown>, status: number): NextResponse {
    return NextResponse.json(body, { status, headers: NO_STORE });
}

/** Maps journal outcomes to explicit HTTP codes. Unavailable custody is never an empty successful history, and never carries Retry-After. */
function failureResponse(failure: LineageFailure): NextResponse {
    switch (failure.code) {
        case 'NOT_FOUND':
            return json({ success: false, code: 'JOURNAL_NOT_FOUND', error: 'No lineage record for this canonical id.' }, 404);
        case 'UNQUALIFIED':
            return json({ success: false, error: 'Unauthorized: verified identity required.' }, 401);
        case 'NOT_READY':
            return json({ success: false, code: 'JOURNAL_NOT_READY', error: 'The attempt lineage journal is not configured.' }, 503);
        case 'BUSY':
            return json({ success: false, code: 'JOURNAL_BUSY', error: 'The attempt lineage journal is busy.' }, 503);
        default:
            return json({ success: false, code: 'JOURNAL_UNAVAILABLE', error: 'The attempt lineage record is unavailable.' }, 503);
    }
}

/** POST { "canonicalId": string }. Same authN as /api/execute: verified session provenance, or the signed-body service verifier. */
export async function POST(request: NextRequest) {
    let rawBodyText: string | null;
    try {
        rawBodyText = await readBoundedRequestBody(request, MAX_BODY_BYTES);
    } catch (error) {
        if (error instanceof InvalidRequestBodyEncodingError) return json({ success: false, error: 'Invalid input payload.' }, 400);
        return json({ success: false, error: 'Invalid input payload.' }, 400);
    }
    if (rawBodyText === null) return json({ success: false, error: 'Request body exceeds 4 KiB limit.' }, 413);

    // AuthN before any body interpretation: only a qualified session or a verified signed service request proceeds.
    const provenance = await resolveVerifiedSessionProvenance(request);
    if (!provenance.qualified) {
        const serviceToken = request.headers.get('x-cvf-service-token');
        const serviceVerified = !!serviceToken && verifyServiceTokenRequest({
            configuredToken: process.env.CVF_SERVICE_TOKEN,
            presentedToken: serviceToken,
            signature: request.headers.get('x-cvf-service-signature'),
            timestamp: request.headers.get('x-cvf-service-timestamp'),
            body: rawBodyText,
        });
        if (!serviceVerified) {
            return json({ success: false, error: serviceToken ? 'Unauthorized: invalid service token or signature.' : 'Unauthorized: please login.' }, 401);
        }
    }
    const configResult = loadLineageConfig();
    if (!configResult.ok) return failureResponse(configResult);
    const identityResult: LineageResult<LineageIdentity> = provenance.qualified
        ? resolveSessionIdentity(configResult.value, provenance)
        : resolveServiceIdentity(configResult.value, true);
    if (!identityResult.ok) return failureResponse(identityResult);

    let body: unknown;
    try {
        body = JSON.parse(rawBodyText);
    } catch {
        return json({ success: false, error: 'Invalid input payload.' }, 400);
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) return json({ success: false, error: 'Invalid input payload.' }, 400);
    const keys = Object.keys(body);
    const canonicalId = (body as Record<string, unknown>).canonicalId;
    if (keys.length !== 1 || keys[0] !== 'canonicalId' || typeof canonicalId !== 'string' || !CANONICAL_ID_PATTERN.test(canonicalId)) {
        return json({ success: false, error: 'Body must be exactly { "canonicalId": string }.' }, 400);
    }

    const result = readLineage(configResult.value, identityResult.value, canonicalId);
    if (!result.ok) return failureResponse(result);
    return json({
        success: true,
        canonicalId: result.value.canonicalId,
        recordingStatus: result.value.recordingStatus,
        lineage: result.value,
    }, 200);
}
