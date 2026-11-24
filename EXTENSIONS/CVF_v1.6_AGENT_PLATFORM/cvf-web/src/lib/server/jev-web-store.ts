import { createHash, randomUUID } from 'node:crypto';
import path from 'node:path';
import { SQLiteAtomicRecordAdapter, type AtomicSQLiteRow } from '@/lib/storage-adapter';

export const WEB_JEV_DAILY_LIMIT = 1_000_000;
const WATCH_LIMIT = 20;
const CALLS_PER_MINUTE = 30;
const MINUTE_MS = 60_000;
const QUESTION_LIMIT = 3;
const namespace = 'ui01-home-spec-jev-v1';

export type WebJevFallback = 'disabled' | 'unavailable' | 'daily_limit' | 'proof_limit' | 'rate_limit';
export type WebJevDecision = 'preselect' | 'clarify';
export type WebJevEvent = 'selection' | 'library' | 'no_match' | 'clarify' | 'export';
type OffReason = 'selection_changes' | 'library_or_no_match';
type Policy = { schema: 1; observed: number; replaced: number; autoOff: OffReason | null; proofUsed: number };
type RollingWindow = { schema: 1; choices: { runId: string; rejected: boolean }[]; autoOff: boolean; legacyAcknowledged: boolean };
type Preference = { schema: 1; enabled: boolean; afterAutoOff: boolean };
type Day = { schema: 1; liability: number };
type Attempt = { schema: 1; day: string; reserve: number; state: 'started' | 'settled' | 'unknown'; cost: number | null };
type Journey = {
    schema: 1; actor: string; ordinal: number | null; decision: WebJevDecision | 'fallback';
    templateId: string; probability: number | null; keywordTemplateId: string | null; finalTemplateId: string | null;
    replacementCounted: boolean; rejected: boolean; questions: number; exported: boolean;
    libraryOffered?: boolean; keywordOffer?: string | null;
    candidates?: string[];
};
export type WebJevStatus = { enabled: boolean; reason: OffReason | WebJevFallback | null };

export class WebJevRefusal extends Error {
    constructor(readonly code: WebJevFallback) { super(code); }
}

export function webJevActorKey(actor: { userId: string; orgId: string; teamId: string }): string {
    return createHash('sha256').update(JSON.stringify([actor.orgId, actor.teamId, actor.userId])).digest('hex');
}

function row(rows: AtomicSQLiteRow[], id: string) { return rows.find(entry => entry.id === id); }
function value<T>(rows: AtomicSQLiteRow[], id: string, validate: (value: unknown) => value is T): T | undefined {
    const stored = row(rows, id);
    if (!stored) return undefined;
    if (!validate(stored.value)) throw new WebJevRefusal('unavailable');
    return stored.value;
}
function put(rows: AtomicSQLiteRow[], id: string, data: unknown) {
    return { id, expectedRevision: row(rows, id)?.revision ?? null, value: data };
}
const obj = (data: unknown): data is Record<string, unknown> => !!data && typeof data === 'object' && !Array.isArray(data);
const count = (data: unknown, max = Number.MAX_SAFE_INTEGER): data is number =>
    typeof data === 'number' && Number.isSafeInteger(data) && data >= 0 && data <= max;
const unit = (data: unknown) => typeof data === 'number' && Number.isFinite(data) && data >= 0 && data <= 1;
const id = (data: unknown) => typeof data === 'string' && /^[a-z0-9_]{1,100}$/.test(data);
const boolean = (data: unknown) => typeof data === 'boolean';
const nullableId = (data: unknown) => data === null || id(data);
const validPolicy = (data: unknown): data is Policy => obj(data) && data.schema === 1 && count(data.observed, WATCH_LIMIT)
    && count(data.replaced, WATCH_LIMIT) && data.replaced <= data.observed && count(data.proofUsed)
    && (data.autoOff === null || data.autoOff === 'selection_changes' || data.autoOff === 'library_or_no_match');
const validRollingWindow = (data: unknown): data is RollingWindow => obj(data) && data.schema === 1
    && boolean(data.autoOff) && boolean(data.legacyAcknowledged) && Array.isArray(data.choices) && data.choices.length <= 10
    && data.choices.every(entry => obj(entry) && typeof entry.runId === 'string' && boolean(entry.rejected));
const validPreference = (data: unknown): data is Preference => obj(data) && data.schema === 1 && boolean(data.enabled) && boolean(data.afterAutoOff);
const validDay = (data: unknown): data is Day => obj(data) && data.schema === 1 && count(data.liability);
const validRate = (data: unknown): data is number[] => Array.isArray(data)
    && data.length <= CALLS_PER_MINUTE && data.every(entry => count(entry));
const validAttempt = (data: unknown): data is Attempt => obj(data) && data.schema === 1 && typeof data.day === 'string'
    && /^day:\d{4}-\d{2}-\d{2}$/.test(data.day) && count(data.reserve, WEB_JEV_DAILY_LIMIT) && data.reserve > 0
    && (data.state === 'settled' ? count(data.cost, data.reserve) : (data.state === 'started' || data.state === 'unknown') && data.cost === null);
const validJourney = (data: unknown): data is Journey => obj(data) && data.schema === 1 && typeof data.actor === 'string'
    && /^[a-f0-9]{64}$/.test(data.actor) && (data.ordinal === null || count(data.ordinal, WATCH_LIMIT) && data.ordinal > 0)
    && ((data.decision === 'preselect' || data.decision === 'clarify') && unit(data.probability)
        || data.decision === 'fallback' && data.probability === null && data.ordinal === null)
    && id(data.templateId)
    && nullableId(data.keywordTemplateId) && nullableId(data.finalTemplateId)
    && boolean(data.replacementCounted) && boolean(data.rejected) && count(data.questions) && boolean(data.exported)
    && (data.libraryOffered === undefined || boolean(data.libraryOffered))
    && (data.keywordOffer === undefined || nullableId(data.keywordOffer))
    && (data.candidates === undefined || Array.isArray(data.candidates) && data.candidates.length <= 3
        && data.candidates.every(item => id(item) && item !== 'no_match') && new Set(data.candidates).size === data.candidates.length);

const getPolicy = (rows: AtomicSQLiteRow[]): Policy =>
    value(rows, 'policy', validPolicy) ?? { schema: 1, observed: 0, replaced: 0, autoOff: null, proofUsed: 0 };
const getRollingWindow = (rows: AtomicSQLiteRow[]): RollingWindow =>
    value(rows, 'rolling-window', validRollingWindow) ?? { schema: 1, choices: [], autoOff: false, legacyAcknowledged: false };
const preferenceKey = (actor: string) => `actor:${actor}`;
const journeyKey = (runId: string) => `journey:${runId}`;
const attemptKey = (attemptId: string) => `attempt:${attemptId}`;
const rateKey = (actor: string) => `rate:${actor}`;
const dayFormatter = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit',
});

function status(rows: AtomicSQLiteRow[], actor: string): WebJevStatus {
    const policy = getPolicy(rows);
    const preference = value(rows, preferenceKey(actor), validPreference);
    const rolling = getRollingWindow(rows);
    if (rolling.autoOff) return { enabled: false, reason: 'library_or_no_match' };
    const legacyReason = rolling.legacyAcknowledged ? null : policy.autoOff;
    if (legacyReason && !preference?.afterAutoOff) return { enabled: false, reason: legacyReason };
    return { enabled: preference?.enabled ?? true, reason: legacyReason };
}

function offered(journey: Journey, templateId: string): boolean {
    return id(templateId) && templateId !== 'no_match' && (
        journey.libraryOffered === true || journey.keywordOffer === templateId || journey.candidates?.includes(templateId)
        || (journey.decision !== 'clarify' && journey.templateId === templateId)
    );
}

export class WebJevStore {
    private readonly adapter: SQLiteAtomicRecordAdapter;
    constructor(directory: string, private readonly proofLimit: number | null, private readonly now = Date.now) {
        if (!path.isAbsolute(directory) || (proofLimit !== null && (!count(proofLimit, 20) || proofLimit < 1))) {
            throw new WebJevRefusal('unavailable');
        }
        this.adapter = new SQLiteAtomicRecordAdapter(directory, namespace);
    }

    status(actor: string): WebJevStatus { return status(this.adapter.readAll(), actor); }

    preference(actor: string, enabled: boolean): WebJevStatus {
        return this.adapter.transaction(rows => {
            const policy = getPolicy(rows);
            const rolling = getRollingWindow(rows);
            const hadAutoOff = rolling.autoOff || (!rolling.legacyAcknowledged && policy.autoOff !== null);
            const preference: Preference = { schema: 1, enabled, afterAutoOff: policy.autoOff !== null };
            return { writes: [put(rows, preferenceKey(actor), preference),
                ...(enabled && hadAutoOff ? [put(rows, 'rolling-window', { schema: 1, choices: [], autoOff: false, legacyAcknowledged: true } satisfies RollingWindow)] : [])],
                result: { enabled, reason: enabled || !hadAutoOff ? null : rolling.autoOff ? 'library_or_no_match' : policy.autoOff } };
        });
    }

    reserve(actor: string, reserve: number): string {
        if (!count(reserve, WEB_JEV_DAILY_LIMIT) || reserve < 1) throw new WebJevRefusal('daily_limit');
        const attemptId = randomUUID();
        return this.adapter.transaction(rows => {
            if (!status(rows, actor).enabled) throw new WebJevRefusal('disabled');
            const now = this.now();
            if (!count(now)) throw new WebJevRefusal('unavailable');
            const key = rateKey(actor);
            const recent = (value(rows, key, validRate) ?? []).filter(at => at > now - MINUTE_MS);
            if (recent.length >= CALLS_PER_MINUTE) throw new WebJevRefusal('rate_limit');
            const day = `day:${dayFormatter.format(new Date(now))}`;
            const policy = getPolicy(rows);
            const existing = value(rows, day, validDay);
            const liability = (existing?.liability ?? 0) + reserve;
            if (liability > WEB_JEV_DAILY_LIMIT) throw new WebJevRefusal('daily_limit');
            if (this.proofLimit !== null && policy.proofUsed >= this.proofLimit) throw new WebJevRefusal('proof_limit');
            const attempt: Attempt = { schema: 1, day, reserve, state: 'started', cost: null };
            // The attempt is spent at the last app-owned send boundary, including a lost reply.
            return { writes: [
                put(rows, 'policy', { ...policy, proofUsed: policy.proofUsed + Number(this.proofLimit !== null) }),
                put(rows, day, { schema: 1, liability } satisfies Day),
                put(rows, attemptKey(attemptId), attempt),
                put(rows, key, [...recent, now]),
            ], result: attemptId };
        });
    }

    settle(attemptId: string, billed: number | null): void {
        const accepted = this.adapter.transaction(rows => {
            const key = attemptKey(attemptId);
            const attempt = value(rows, key, validAttempt);
            if (!attempt || attempt.state !== 'started') throw new WebJevRefusal('unavailable');
            const existing = value(rows, attempt.day, validDay);
            if (!existing || existing.liability < attempt.reserve) throw new WebJevRefusal('unavailable');
            if (!count(billed, attempt.reserve)) {
                // Preserve the full original liability on any unconfirmed or inconsistent cost.
                return { writes: [put(rows, key, { ...attempt, state: 'unknown' })], result: false };
            }
            return { writes: [
                put(rows, key, { ...attempt, state: 'settled', cost: billed }),
                put(rows, attempt.day, { ...existing, liability: existing.liability - attempt.reserve + billed }),
            ], result: true };
        });
        if (!accepted) throw new WebJevRefusal('unavailable');
    }

    recordChoice(actor: string, runId: string, input: {
        templateId: string; probability: number | null; decision: WebJevDecision | 'fallback'; keywordTemplateId: string | null; candidates?: string[];
    }): void {
        this.adapter.transaction(rows => {
            const key = journeyKey(runId);
            const policy = getPolicy(rows);
            if (row(rows, key)) throw new WebJevRefusal('unavailable');
            const ordinal = input.decision !== 'fallback' && policy.observed < WATCH_LIMIT ? policy.observed + 1 : null;
            const journey: Journey = {
                schema: 1, actor, ordinal, ...input, finalTemplateId: null,
                replacementCounted: false, rejected: false, questions: 0, exported: false,
            };
            if (!validJourney(journey)) throw new WebJevRefusal('unavailable');
            const rolling = getRollingWindow(rows);
            if (input.decision === 'preselect') rolling.choices = [...rolling.choices, { runId, rejected: false }].slice(-10);
            return { writes: [
                put(rows, key, journey),
                ...(input.decision === 'preselect' ? [put(rows, 'rolling-window', rolling)] : []),
                ...(ordinal === null ? [] : [put(rows, 'policy', { ...policy, observed: ordinal })]),
            ], result: undefined };
        });
    }

    ownsJourney(actor: string, runId: string): boolean {
        return value(this.adapter.readAll(), journeyKey(runId), validJourney)?.actor === actor;
    }

    acceptsTemplate(actor: string, runId: string, templateId: string): boolean {
        const journey = value(this.adapter.readAll(), journeyKey(runId), validJourney);
        return journey?.actor === actor && offered(journey, templateId);
    }

    offerKeyword(actor: string, runId: string, templateId: string | null): void {
        this.adapter.transaction(rows => {
            const key = journeyKey(runId);
            const journey = value(rows, key, validJourney);
            if (!journey || journey.actor !== actor || !nullableId(templateId)) throw new WebJevRefusal('unavailable');
            return { writes: [put(rows, key, { ...journey, keywordOffer: templateId })], result: undefined };
        });
    }

    feedback(actor: string, runId: string, event: WebJevEvent, templateId?: string): WebJevStatus | null {
        return this.adapter.transaction(rows => {
            const key = journeyKey(runId);
            const journey = value(rows, key, validJourney);
            if (!journey || journey.actor !== actor) throw new WebJevRefusal('unavailable');
            const policy = getPolicy(rows);
            const rolling = getRollingWindow(rows);
            const entry = journey.decision === 'preselect' ? rolling.choices.find(item => item.runId === runId) : undefined;
            if (event === 'selection' && templateId) {
                if (!offered(journey, templateId)) return { writes: [], result: null };
                journey.finalTemplateId = templateId;
            } else if (event === 'library' || event === 'no_match') {
                if (event === 'library') journey.libraryOffered = true;
                journey.rejected = true;
                if (entry) entry.rejected = true;
            } else if (event === 'clarify') {
                journey.questions = Math.min(QUESTION_LIMIT, journey.questions + 1);
            } else if (event === 'export') {
                journey.exported = true;
            }
            if (rolling.choices.filter(item => item.rejected).length >= 3) rolling.autoOff = true;
            const preference = value(rows, preferenceKey(actor), validPreference);
            const legacyReason = rolling.legacyAcknowledged ? null : policy.autoOff;
            const effective = rolling.autoOff || (legacyReason && !preference?.afterAutoOff) ? false : preference?.enabled ?? true;
            return { writes: [put(rows, key, journey), put(rows, 'rolling-window', rolling)], result: { enabled: effective, reason: rolling.autoOff ? 'library_or_no_match' : legacyReason } };
        });
    }
}

export function openWebJevStore(): WebJevStore {
    const directory = process.env.CVF_WEB_JEV_CUSTODY_DIRECTORY;
    const configured = process.env.CVF_WEB_JEV_PROOF_MAX_CALLS;
    if (!directory || (configured !== undefined && !/^(?:[1-9]|1\d|20)$/.test(configured))) throw new WebJevRefusal('unavailable');
    return new WebJevStore(directory, configured === undefined ? null : Number(configured));
}
