/** Server-only acceptance candidate/port contract. No concrete persistence or route. */
import { createHash } from 'node:crypto';
import { CANDIDATE_SCHEMA_V1, CANDIDATE_SCHEMA_V2, MAX_CONFIRMATION_BYTES } from './intent-spec-confirmation';
import {
    buildReviewedDraftPacket, getPendingReviewDecisions, getReviewOpenItems, INTENT_REVIEW_QUESTIONS,
    type IntentSpecReviewState,
} from './intent-spec-review';
import { validateOpenItemSet, validateStoredOpenItem } from './intent-spec-open-items';
import { assertCurrentIntentSpecActor, type IntentSpecActor } from './intent-spec-actor';

const hash = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const utf8 = (text: string) => new TextEncoder().encode(text);
const HASH = /^[a-f0-9]{64}$/;
function fail(): never { throw new Error('INVALID_SPEC_REVIEW_FILE'); }

function object(value: unknown, keys: readonly string[]): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)
        || Object.keys(value).length !== keys.length || !keys.every(key => Object.hasOwn(value, key))) fail();
    return value as Record<string, unknown>;
}
function stringMap(value: unknown): Record<string, string> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) fail();
    const entries = Object.entries(value);
    if (entries.length > 100 || entries.some(([key, item]) => typeof item !== 'string'
        || ['__proto__', 'constructor', 'prototype'].includes(key))) fail();
    return value as Record<string, string>;
}
const DECISION_KEYS = ['id', 'answer', 'disposition', 'needsReconfirmation', 'sourceValues'] as const;

/** Version 1 is exactly the original check. Version 2 adds only a non-empty openItems key per decision. */
function checkReview(input: unknown, version: 1 | 2 = 1): IntentSpecReviewState {
    const review = object(input, ['revision', 'values', 'packetSource', 'decisions', 'acknowledgedRevision']);
    if (!Number.isSafeInteger(review.revision) || (review.revision as number) < 1
        || review.acknowledgedRevision !== review.revision || typeof review.packetSource !== 'string'
        || !Array.isArray(review.decisions) || review.decisions.length !== INTENT_REVIEW_QUESTIONS.length) fail();
    const values = stringMap(review.values);
    review.decisions.forEach((item: unknown, index: number) => {
        const withItems = version === 2 && item && typeof item === 'object' && !Array.isArray(item)
            && Object.hasOwn(item, 'openItems');
        const decision = object(item, withItems ? [...DECISION_KEYS, 'openItems'] : DECISION_KEYS);
        if (withItems && (!Array.isArray(decision.openItems) || !decision.openItems.length
            || decision.openItems.some((entry: unknown) => validateStoredOpenItem(entry, values)))) fail();
        const question = INTENT_REVIEW_QUESTIONS[index];
        if (decision.id !== question.id || typeof decision.answer !== 'string'
            || !['ANSWERED', 'NOT_APPLICABLE'].includes(decision.disposition as string)
            || decision.needsReconfirmation !== false) fail();
        const sources = stringMap(decision.sourceValues);
        if (Object.keys(sources).length !== question.fields.length
            || question.fields.some(field => !Object.hasOwn(sources, field) || sources[field] !== (values[field] ?? ''))) fail();
    });
    const result = review as unknown as IntentSpecReviewState;
    if (getPendingReviewDecisions(result).length) fail();
    if (version === 2) {
        // One canonical encoding per state: v2 needs at least one item, unique ids and the safety cap.
        const items = getReviewOpenItems(result);
        if (!items.length || validateOpenItemSet(items)) fail();
    }
    return result;
}

export interface IntentSpecAcceptanceCandidate {
    readonly id: string;
    readonly actor: IntentSpecActor;
    readonly sourceFileSha256: string;
    readonly revision: number;
    readonly state: 'PENDING_STORE_COMMIT';
}
const OWNED = new WeakMap<IntentSpecAcceptanceCandidate, string>();

/** Input hashes are rederived; valid hashing alone cannot make malformed review data acceptable. */
export function prepareIntentSpecAcceptance(
    actor: IntentSpecActor, received: Uint8Array, expectedFileSha256: string, now = Date.now(),
): IntentSpecAcceptanceCandidate {
    assertCurrentIntentSpecActor(actor, now);
    if (!ArrayBuffer.isView(received) || !received.byteLength || received.byteLength > MAX_CONFIRMATION_BYTES) fail();
    const bytes = new Uint8Array(received);
    if (!bytes.length || bytes.length > MAX_CONFIRMATION_BYTES || !HASH.test(expectedFileSha256)
        || hash(bytes) !== expectedFileSha256) fail();
    let text: string;
    let parsed: unknown;
    try {
        text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes);
        parsed = JSON.parse(text);
    } catch { return fail(); }
    const file = object(parsed, ['payload', 'payloadSha256']);
    // Only the exact exporter layout is admitted. Duplicates, BOM, whitespace rewrites and
    // noncanonical formatting cannot silently change the interpretation of received bytes.
    if (JSON.stringify(file) + '\n' !== text) fail();
    const payload = object(file.payload, ['schema', 'scope', 'reviewer', 'createdAt', 'language', 'review', 'draft']);
    const reviewer = object(payload.reviewer, ['name', 'verification']);
    if ((payload.schema !== CANDIDATE_SCHEMA_V1 && payload.schema !== CANDIDATE_SCHEMA_V2)
        || payload.scope !== 'SPEC_REVIEW_ONLY_NO_BUILD_AUTHORITY'
        || !['en', 'vi'].includes(payload.language as string)
        || reviewer.verification !== 'SELF_DECLARED' || typeof reviewer.name !== 'string'
        || !reviewer.name.trim() || reviewer.name.length > 120 || reviewer.name.trim() !== reviewer.name
        || typeof payload.createdAt !== 'string' || !Number.isFinite(Date.parse(payload.createdAt))
        || new Date(payload.createdAt).toISOString() !== payload.createdAt
        || typeof file.payloadSha256 !== 'string' || !HASH.test(file.payloadSha256)
        || hash(utf8(JSON.stringify(payload))) !== file.payloadSha256) fail();
    const review = checkReview(payload.review, payload.schema === CANDIDATE_SCHEMA_V2 ? 2 : 1);
    if (payload.draft !== buildReviewedDraftPacket(review, payload.language as 'en' | 'vi')) fail();
    const record = JSON.stringify({
        schema: 'cvf.intentSpecAcceptanceCandidate.v1', state: 'PENDING_STORE_COMMIT',
        scope: 'SPEC_REVIEW_ONLY_NO_BUILD_AUTHORITY', actor,
        preparedAt: new Date(now).toISOString(), sourceFileSha256: expectedFileSha256,
        sourceFile: text,
    }) + '\n';
    const candidate: IntentSpecAcceptanceCandidate = Object.freeze({
        id: hash(utf8(record)), actor, sourceFileSha256: expectedFileSha256,
        revision: review.revision, state: 'PENDING_STORE_COMMIT',
    });
    OWNED.set(candidate, record);
    return candidate;
}

/** A future adapter must throw on write conflict/failure. This port implies no durability. */
export interface IntentSpecAcceptanceStorePort {
    createIfAbsent(id: string, bytes: Uint8Array): Promise<void>;
    read(id: string): Promise<Uint8Array | null>;
}

export async function commitIntentSpecAcceptanceCandidate(
    actor: IntentSpecActor, candidate: IntentSpecAcceptanceCandidate,
    store: IntentSpecAcceptanceStorePort, clock: () => number = Date.now,
): Promise<Readonly<{ id: string; state: 'STORE_PORT_READBACK_VERIFIED'; claimBoundary: 'NO_DURABILITY_OR_BUILD_AUTHORITY' }>> {
    assertCurrentIntentSpecActor(actor, clock());
    const record = OWNED.get(candidate);
    if (!record || candidate.actor !== actor) throw new Error('OWNED_ACTOR_CANDIDATE_REQUIRED');
    const expected = utf8(record);
    try {
        await store.createIfAbsent(candidate.id, new Uint8Array(expected));
        const readback = await store.read(candidate.id);
        if (!readback || readback.byteLength !== expected.byteLength) throw new Error('READBACK_MISMATCH');
        const owned = new Uint8Array(readback);
        if (!owned.every((byte, index) => byte === expected[index]) || hash(owned) !== candidate.id) {
            throw new Error('READBACK_MISMATCH');
        }
        assertCurrentIntentSpecActor(actor, clock());
    } catch {
        // A port may have written before it failed. No rollback or acceptance is invented.
        throw new Error('STORE_COMMIT_UNCONFIRMED');
    }
    return Object.freeze({ id: candidate.id, state: 'STORE_PORT_READBACK_VERIFIED', claimBoundary: 'NO_DURABILITY_OR_BUILD_AUTHORITY' });
}
