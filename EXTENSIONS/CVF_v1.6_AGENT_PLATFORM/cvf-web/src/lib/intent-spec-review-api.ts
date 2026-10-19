/** Server-only request handlers for saving/reopening a confirmed spec review. The actor always comes
 * from the request session owner; saved content is SPEC_REVIEW_ONLY_NO_BUILD_AUTHORITY, never approval.
 */
import { createHash } from 'node:crypto';
import { MAX_CONFIRMATION_BYTES } from './intent-spec-confirmation';
import { resolveIntentSpecActor, type IntentSpecActor } from './intent-spec-actor';
import { commitIntentSpecAcceptanceCandidate, prepareIntentSpecAcceptance } from './intent-spec-acceptance';
import { FileIntentSpecAcceptanceStore } from './intent-spec-file-store';
import { admitPrivateStoreProfile, ProfileError } from './intent-spec-private-profile';

/** JSON string escaping can expand control characters sixfold; the candidate itself stays <= MAX_CONFIRMATION_BYTES. */
export const SAVE_BODY_LIMIT = MAX_CONFIRMATION_BYTES * 6 + 4096;
const HASH = /^[a-f0-9]{64}$/;

const reply = (status: number, body: Record<string, unknown>) => Response.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store', Pragma: 'no-cache', 'X-Content-Type-Options': 'nosniff', Vary: 'Cookie, Origin' },
});
const refuse = (status: number, error: string) => reply(status, { ok: false, error });

/** State-changing browser requests must be same-origin; absent or foreign Origin is refused. */
function sameOrigin(request: Request): boolean {
    try {
        const origin = request.headers.get('origin');
        const site = request.headers.get('sec-fetch-site');
        return !!origin && origin === new URL(request.url).origin && (!site || site === 'same-origin');
    } catch { return false; }
}

async function readBody(request: Request): Promise<unknown> {
    const declared = request.headers.get('content-length');
    if (declared !== null && (!/^\d+$/.test(declared) || Number(declared) > SAVE_BODY_LIMIT)) throw new Error('BODY_TOO_LARGE');
    const reader = request.body?.getReader();
    if (!reader) throw new Error('INVALID_BODY');
    const chunks: Uint8Array[] = [];
    let total = 0;
    for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.byteLength;
        if (total > SAVE_BODY_LIMIT) { await reader.cancel(); throw new Error('BODY_TOO_LARGE'); }
        chunks.push(value);
    }
    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    try { return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); }
    catch { throw new Error('INVALID_BODY'); }
}

async function requestActor(request: Request): Promise<IntentSpecActor | null> {
    try { return await resolveIntentSpecActor(request); }
    catch (error) {
        if ((error as Error)?.message === 'CURRENT_SESSION_ACTOR_REQUIRED') return null;
        throw error;
    }
}

/** Explicit complete profile or no store. Any configuration/security problem is unavailable, never a memory/file fallback. */
async function openStore(actor: IntentSpecActor): Promise<FileIntentSpecAcceptanceStore | null> {
    try {
        const profile = await admitPrivateStoreProfile();
        return new FileIntentSpecAcceptanceStore(profile.root, actor, Date.now, { security: profile.security });
    } catch (error) {
        if (error instanceof ProfileError) return null;
        throw error;
    }
}

export async function handleSaveReview(request: Request): Promise<Response> {
    try {
        if (!sameOrigin(request)) return refuse(403, 'ORIGIN_REFUSED');
        const actor = await requestActor(request);
        if (!actor) return refuse(401, 'AUTH_REQUIRED');
        if (!(request.headers.get('content-type') ?? '').toLowerCase().startsWith('application/json')) return refuse(415, 'JSON_REQUIRED');
        let body: unknown;
        try { body = await readBody(request); }
        catch (error) { return (error as Error).message === 'BODY_TOO_LARGE' ? refuse(413, 'BODY_TOO_LARGE') : refuse(400, 'INVALID_BODY'); }
        const fields = body && typeof body === 'object' && !Array.isArray(body) ? body as Record<string, unknown> : null;
        // Actor, role, organization and time are never accepted from the client.
        if (!fields || Object.keys(fields).length !== 2 || typeof fields.candidate !== 'string'
            || typeof fields.expectedSha256 !== 'string' || !HASH.test(fields.expectedSha256)) return refuse(400, 'INVALID_BODY');
        const store = await openStore(actor);
        if (!store) return refuse(503, 'STORE_UNAVAILABLE');
        let candidate;
        try { candidate = prepareIntentSpecAcceptance(actor, new TextEncoder().encode(fields.candidate), fields.expectedSha256); }
        catch (error) {
            const code = (error as Error).message;
            if (code === 'CURRENT_SESSION_ACTOR_REQUIRED') return refuse(401, 'AUTH_REQUIRED');
            return refuse(422, 'INVALID_CANDIDATE');
        }
        try {
            const receipt = await commitIntentSpecAcceptanceCandidate(actor, candidate, store);
            return reply(201, {
                ok: true, id: receipt.id, state: receipt.state, claimBoundary: receipt.claimBoundary,
                scope: 'SPEC_REVIEW_ONLY_NO_BUILD_AUTHORITY', sourceFileSha256: candidate.sourceFileSha256,
                revision: candidate.revision, assurance: actor.assurance,
            });
        } catch {
            // The port may have written before failing; neither success nor rollback is claimed.
            return reply(500, { ok: false, error: 'STORE_COMMIT_UNCONFIRMED', state: 'UNCONFIRMED' });
        }
    } catch { return refuse(500, 'REQUEST_FAILED'); }
}

export async function handleReadReview(request: Request, id: string): Promise<Response> {
    try {
        const actor = await requestActor(request);
        if (!actor) return refuse(401, 'AUTH_REQUIRED');
        if (!HASH.test(id)) return refuse(404, 'NOT_FOUND');
        const store = await openStore(actor);
        if (!store) return refuse(503, 'STORE_UNAVAILABLE');
        let bytes: Uint8Array | null;
        try { bytes = await store.read(id); }
        catch { return refuse(500, 'STORED_RECORD_UNREADABLE'); }
        // Another actor's namespace and a missing record are the same answer.
        if (!bytes) return refuse(404, 'NOT_FOUND');
        const record = JSON.parse(new TextDecoder().decode(bytes));
        const file = JSON.parse(record.sourceFile);
        const payload = file.payload;
        return reply(200, {
            ok: true, id, recordSha256: createHash('sha256').update(bytes).digest('hex'),
            scope: record.scope, claimBoundary: 'SPEC_REVIEW_ONLY_NO_BUILD_AUTHORITY',
            sourceFileSha256: record.sourceFileSha256, revision: payload.review.revision, language: payload.language,
            reviewer: payload.reviewer, createdAt: payload.createdAt, preparedAt: record.preparedAt,
            assurance: record.actor.assurance, draft: payload.draft,
        });
    } catch { return refuse(500, 'REQUEST_FAILED'); }
}
