/** Browser-side calls to the request-owned review save/reopen routes. Results are claims by the server
 * about its own store; none of them is an approval or build authority, and none ever throws.
 */
import type { SpecConfirmationCandidate } from './intent-spec-confirmation';

const HASH = /^[a-f0-9]{64}$/;
export type SaveOutcome =
    | { kind: 'saved'; id: string }
    | { kind: 'unavailable' | 'auth' | 'refused' | 'unconfirmed' };
export interface SavedReview {
    id: string; revision: number; language: 'en' | 'vi'; reviewerName: string; createdAt: string;
    assurance: string; draft: string;
}
export type ReopenOutcome =
    | { kind: 'ok'; record: SavedReview }
    | { kind: 'notfound' | 'unavailable' | 'auth' | 'failed' };

const record = (value: unknown): Record<string, unknown> | null =>
    value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;

/** Saved is reported only when the server's readback receipt names exactly this candidate. */
export async function saveReviewCandidate(candidate: SpecConfirmationCandidate): Promise<SaveOutcome> {
    let response: Response;
    try {
        response = await fetch('/api/intent-spec/reviews', {
            method: 'POST', credentials: 'same-origin', cache: 'no-store',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ candidate: candidate.fileContent, expectedSha256: candidate.fileSha256 }),
        });
    } catch { return { kind: 'unconfirmed' }; }
    if (response.status === 401) return { kind: 'auth' };
    if (response.status === 503) return { kind: 'unavailable' };
    if ([400, 403, 413, 415, 422].includes(response.status)) return { kind: 'refused' };
    let body: Record<string, unknown> | null = null;
    try { body = record(await response.json()); } catch { /* unconfirmed below */ }
    if (response.status === 201 && body && body.ok === true && body.state === 'STORE_PORT_READBACK_VERIFIED'
        && body.scope === 'SPEC_REVIEW_ONLY_NO_BUILD_AUTHORITY' && typeof body.id === 'string' && HASH.test(body.id)
        && body.sourceFileSha256 === candidate.fileSha256 && body.revision === candidate.revision) {
        return { kind: 'saved', id: body.id };
    }
    return { kind: 'unconfirmed' };
}

export async function readSavedReview(id: string): Promise<ReopenOutcome> {
    if (!HASH.test(id)) return { kind: 'notfound' };
    let response: Response;
    try {
        response = await fetch(`/api/intent-spec/reviews/${id}`, { method: 'GET', credentials: 'same-origin', cache: 'no-store' });
    } catch { return { kind: 'failed' }; }
    if (response.status === 401) return { kind: 'auth' };
    if (response.status === 404) return { kind: 'notfound' };
    if (response.status === 503) return { kind: 'unavailable' };
    try {
        const body = record(await response.json());
        const reviewer = record(body?.reviewer);
        if (response.status === 200 && body && body.ok === true && body.id === id
            && body.claimBoundary === 'SPEC_REVIEW_ONLY_NO_BUILD_AUTHORITY' && Number.isSafeInteger(body.revision)
            && (body.language === 'en' || body.language === 'vi') && typeof reviewer?.name === 'string'
            && typeof body.createdAt === 'string' && typeof body.assurance === 'string' && typeof body.draft === 'string') {
            return { kind: 'ok', record: {
                id, revision: body.revision as number, language: body.language, reviewerName: reviewer.name,
                createdAt: body.createdAt, assurance: body.assurance, draft: body.draft,
            } };
        }
    } catch { /* failed below */ }
    return { kind: 'failed' };
}
