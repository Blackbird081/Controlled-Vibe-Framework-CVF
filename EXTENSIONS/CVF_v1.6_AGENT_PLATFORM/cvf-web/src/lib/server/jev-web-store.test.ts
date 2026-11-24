import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SQLiteAtomicRecordAdapter } from '@/lib/storage-adapter';
import { WebJevStore } from './jev-web-store';

const actor = 'a'.repeat(64);
const otherActor = 'b'.repeat(64);
const namespace = 'ui01-home-spec-jev-v1';
let directory: string;
let time: number;
let store: WebJevStore;

beforeEach(() => {
    directory = mkdtempSync(path.join(tmpdir(), 'cvf-web-jev-unit-'));
    time = Date.parse('2026-11-22T02:00:00Z');
    store = new WebJevStore(directory, null, () => time);
});
afterEach(() => rmSync(directory, { recursive: true, force: true }));

describe('local Jev safeguards', () => {
    it('admits only recorded clarification candidates', () => {
        store.recordChoice(actor, 'candidates', {
            templateId: 'no_match', probability: .4, decision: 'clarify', keywordTemplateId: null,
            candidates: ['documentation', 'faq'],
        });
        expect(store.acceptsTemplate(actor, 'candidates', 'documentation')).toBe(true);
        expect(store.feedback(actor, 'candidates', 'selection', 'faq')).not.toBeNull();
        expect(store.acceptsTemplate(actor, 'candidates', 'review')).toBe(false);
        expect(store.feedback(actor, 'candidates', 'selection', 'review')).toBeNull();
    });
    it('holds unconfirmed spend against the shared daily cap', () => {
        const reservation = store.reserve(actor, 900_000);
        expect(() => store.settle(reservation, null)).toThrow('unavailable');
        expect(() => store.reserve(otherActor, 100_001)).toThrow('daily_limit');
        const remaining = store.reserve(otherActor, 100_000);
        store.settle(remaining, 1);
        expect(store.reserve(actor, 99_999)).toBeTruthy();
    });

    it('admits 30 attempts in a sliding minute per signed-in identity across store instances', () => {
        for (let index = 0; index < 30; index++) {
            store.settle(store.reserve(actor, 100), 1);
        }
        const reopened = new WebJevStore(directory, null, () => time);
        expect(() => reopened.reserve(actor, 100)).toThrow('rate_limit');
        expect(reopened.reserve(otherActor, 100)).toBeTruthy();
        time += 59_999;
        expect(() => reopened.reserve(actor, 100)).toThrow('rate_limit');
        time++;
        expect(reopened.reserve(actor, 100)).toBeTruthy();
    });

    it('limits the question counter and admits only outcomes offered within the journey', () => {
        store.recordChoice(actor, 'journey', {
            templateId: 'documentation', probability: .82, decision: 'preselect', keywordTemplateId: 'tos_review',
        });
        expect(store.feedback(actor, 'journey', 'selection', 'tos_review')).toBeNull();
        expect(store.acceptsTemplate(otherActor, 'journey', 'documentation')).toBe(false);
        expect(store.acceptsTemplate(actor, 'journey', 'documentation')).toBe(true);
        store.offerKeyword(actor, 'journey', 'tos_review');
        expect(store.feedback(actor, 'journey', 'selection', 'tos_review')).toMatchObject({ enabled: true });
        expect(store.feedback(actor, 'journey', 'selection', 'faq')).toBeNull();
        for (let index = 0; index < 10; index++) store.feedback(actor, 'journey', 'clarify');
        const row = new SQLiteAtomicRecordAdapter(directory, namespace).readAll().find(item => item.id === 'journey:journey');
        expect(row?.value).toMatchObject({ questions: 3, finalTemplateId: 'tos_review' });
        expect(store.feedback(actor, 'journey', 'library')).toEqual({ enabled: true, reason: null });
        expect(store.status(otherActor).enabled).toBe(true);
        expect(store.feedback(actor, 'journey', 'selection', 'faq')).toMatchObject({ enabled: true });
    });
});
it('turns off globally at three rejected preselects in the latest ten and can be re-enabled', () => {
 const choice = (n: number) => store.recordChoice(n % 2 ? actor : otherActor, `rolling${n}`, {templateId:'documentation', probability:.9, decision:'preselect', keywordTemplateId:null});
 const reject = (n: number) => store.feedback(n % 2 ? actor : otherActor, `rolling${n}`, n % 2 ? 'library' : 'no_match');
 choice(1); reject(1); choice(2); reject(2);
 expect(store.status(actor).enabled).toBe(true);
 for (let n=3; n<=11; n++) choice(n);
 reject(3); expect(store.status(actor).enabled).toBe(true); // choice 1 has left the window
 reject(4); expect(store.status(otherActor).enabled).toBe(false);
 store.preference(actor,true); expect(store.status(otherActor).enabled).toBe(true);
});

it('re-enables all accounts after a legacy shutoff without rewriting historical policy', () => {
 const adapter = new SQLiteAtomicRecordAdapter(directory, namespace);
 adapter.transaction(() => ({ writes: [{ id: 'policy', expectedRevision: null, value: { schema: 1, observed: 1, replaced: 0, autoOff: 'library_or_no_match', proofUsed: 0 } }], result: undefined }));
 expect(store.status(otherActor).enabled).toBe(false);
 store.preference(actor, true);
 expect(store.status(otherActor).enabled).toBe(true);
 expect(adapter.readAll().find(row => row.id === 'policy')?.value).toMatchObject({ autoOff: 'library_or_no_match' });
});

it('counts only explicit rejections and retains recent rejections when saving an already enabled preference', () => {
    for (const runId of ['first', 'second', 'third']) {
        store.recordChoice(actor, runId, { templateId: 'documentation', probability: .9, decision: 'preselect', keywordTemplateId: null, candidates: ['faq'] });
        store.feedback(actor, runId, 'selection', 'faq');
    }
    expect(store.status(actor).enabled).toBe(true);
    store.feedback(actor, 'first', 'library');
    store.feedback(actor, 'first', 'no_match');
    store.feedback(actor, 'second', 'no_match');
    store.preference(otherActor, true);
    expect(store.status(actor).enabled).toBe(true);
    store.feedback(actor, 'third', 'library');
    expect(store.status(otherActor).enabled).toBe(false);
});
