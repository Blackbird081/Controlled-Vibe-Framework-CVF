import { randomUUID } from 'node:crypto';
import { readBoundedRequestBody } from '@/lib/bounded-request-body';
import { getHomeSpecFields, resolveHomeOutcomeId } from '@/lib/home-spec-jev-catalog';
import { resolveIntentSpecActor } from '@/lib/intent-spec-actor';
import { verifySessionCookie } from '@/lib/middleware-auth';
import { routeEligibleHomeKeywords as routeHomeSpecKeywords } from '@/lib/home-spec-keyword-router';
import { isLoopbackHostname, isSameBrowserOrigin } from '@/lib/server/browser-origin';
import {
    openWebJevStore, webJevActorKey, WebJevRefusal, type WebJevEvent, type WebJevFallback, type WebJevStore,
} from '@/lib/server/jev-web-store';
import { isWebJevAvailable, WebJevTransport } from '@/lib/server/jev-web-transport';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const RUN_ID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const BODY_MAX_BYTES = 4096;
const EVENTS = new Set<string>(['selection', 'library', 'no_match', 'clarify', 'export']);
type Payload =
    | { action: 'choose'; goal: string; templateId?: string }
    | { action: 'fields'; runId: string; templateId: string; goal: string }
    | { action: 'keyword'; runId: string; goal: string }
    | { action: 'skills'; runId: string; goal: string }
    | { action: 'feedback'; runId: string; event: WebJevEvent; templateId?: string }
    | { action: 'preference'; enabled: boolean };

const reply = (body: Record<string, unknown>, status = 200) => Response.json(body, {
    status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', Vary: 'Cookie, Origin' },
});
const exact = (value: Record<string, unknown>, keys: string[]) =>
    Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const runId = (value: unknown): value is string => typeof value === 'string' && RUN_ID.test(value);
const goal = (value: unknown): value is string => typeof value === 'string' && value.trim().length >= 8 && value.trim().length <= 1000;
const templateId = (value: unknown): value is string => typeof value === 'string' && value !== 'no_match'
    && resolveHomeOutcomeId(value) !== null;
const fallbackCode = (error: unknown): WebJevFallback => error instanceof WebJevRefusal ? error.code : 'unavailable';

function parse(value: unknown): Payload | null {
    if (!record(value)) return null;
    switch (value.action) {
        case 'choose':
            if (!goal(value.goal)) return null;
            if (exact(value, ['action', 'goal'])) return { action: value.action, goal: value.goal.trim() };
            if (exact(value, ['action', 'goal', 'templateId']) && templateId(value.templateId)) {
                return { action: value.action, goal: value.goal.trim(), templateId: value.templateId };
            }
            return null;
        case 'fields': return exact(value, ['action', 'runId', 'templateId', 'goal'])
            && runId(value.runId) && templateId(value.templateId) && goal(value.goal)
            ? { action: value.action, runId: value.runId, templateId: value.templateId, goal: value.goal.trim() } : null;
        case 'keyword':
        case 'skills': return exact(value, ['action', 'runId', 'goal']) && runId(value.runId) && goal(value.goal)
            ? { action: value.action, runId: value.runId, goal: value.goal.trim() } : null;
        case 'preference': return exact(value, ['action', 'enabled']) && typeof value.enabled === 'boolean'
            ? { action: value.action, enabled: value.enabled } : null;
        case 'feedback': {
            if (!runId(value.runId) || typeof value.event !== 'string' || !EVENTS.has(value.event)) return null;
            if (value.event === 'selection') return exact(value, ['action', 'runId', 'event', 'templateId']) && templateId(value.templateId)
                ? { action: value.action, runId: value.runId, event: value.event, templateId: value.templateId } : null;
            return exact(value, ['action', 'runId', 'event']) ? { action: value.action, runId: value.runId, event: value.event as WebJevEvent } : null;
        }
        default: return null;
    }
}

async function actorFor(request: Request): Promise<string | null> {
    if (request.headers.has('authorization')) return null;
    try {
        const actor = await resolveIntentSpecActor(request);
        if (actor.assurance === 'LOCAL_TEST_SESSION' && process.env.NODE_ENV !== 'test'
            && !isLoopbackHostname(new URL(request.url).hostname)) return null;
        return actor.role === 'owner' || actor.role === 'admin' ? webJevActorKey(actor) : null;
    } catch { return null; }
}

function startWithoutJev(store: WebJevStore | undefined, actor: string, inputGoal: string, fallback: WebJevFallback) {
    const runId = randomUUID();
    const picked = routeHomeSpecKeywords(inputGoal);
    const keyword = templateId(picked.recommendedTemplateId) ? picked.recommendedTemplateId : null;
    const selected = picked.confidence === 'strong' ? keyword ?? 'no_match' : 'no_match';
    try {
        store?.recordChoice(actor, runId, {
            templateId: selected, probability: null, decision: 'fallback',
            keywordTemplateId: keyword,
        });
    } catch { /* Unavailable custody cannot block the keyword fallback. */ }
    return reply({ runId, templateId: selected, probability: null, decision: 'fallback', fallback });
}

export async function GET(request: Request): Promise<Response> {
    const actor = await actorFor(request);
    if (!actor) return reply({ enabled: false, reason: 'unavailable' }, 403);
    try {
        const status = openWebJevStore().status(actor);
        return reply(isWebJevAvailable() ? status : { enabled: false, reason: 'unavailable' });
    } catch {
        return reply({ enabled: false, reason: 'unavailable' });
    }
}

export async function POST(request: Request): Promise<Response> {
    if (!isSameBrowserOrigin(request)) return reply({ error: 'ORIGIN_REFUSED' }, 403);
    let payload: Payload | null;
    try {
        const raw = await readBoundedRequestBody(request, BODY_MAX_BYTES);
        payload = raw === null ? null : parse(JSON.parse(raw));
    } catch { payload = null; }
    if (!payload) return reply({ error: 'JEV_INVALID_REQUEST' }, 400);
    if (payload.action === 'choose' && payload.templateId) {
        const session = request.headers.has('authorization') ? null : await verifySessionCookie(request).catch(() => null);
        if (session?.authMode !== 'session') return reply({ error: 'SESSION_REQUIRED' }, 401);
        // Manual outcomes are catalog-only. No Jev journey, storage, or provider call is needed.
        return reply({ templateId: payload.templateId, probability: null, decision: 'fallback', fallback: null });
    }
    const actor = await actorFor(request);
    if (!actor) return reply({ error: 'JEV_ROLE_REQUIRED' }, 403);
    let store: WebJevStore | undefined;
    try {
        store = openWebJevStore();
        if (payload.action === 'preference') {
            const status = store.preference(actor, payload.enabled);
            return reply(isWebJevAvailable() ? status : { enabled: false, reason: 'unavailable' });
        }
        if (payload.action === 'feedback') {
            const status = store.feedback(actor, payload.runId, payload.event, payload.templateId);
            return status ? reply(status) : reply({ error: 'JEV_TEMPLATE_NOT_OFFERED' }, 400);
        }
        if (payload.action === 'keyword') {
            if (!store.ownsJourney(actor, payload.runId)) return reply({ error: 'JEV_RUN_NOT_FOUND' }, 404);
            const result = routeHomeSpecKeywords(payload.goal);
            const offer = result.confidence === 'strong' && templateId(result.recommendedTemplateId)
                ? result.recommendedTemplateId : null;
            store.offerKeyword(actor, payload.runId, offer);
            return reply({ templateId: offer });
        }
        if (!store.status(actor).enabled) throw new WebJevRefusal('disabled');
        if (payload.action !== 'choose' && !store.ownsJourney(actor, payload.runId)) {
            return reply({ error: 'JEV_RUN_NOT_FOUND' }, 404);
        }
        const transport = new WebJevTransport(store, actor, async () => (await actorFor(request)) === actor, request.signal);
        if (payload.action === 'fields') {
            if (!store.acceptsTemplate(actor, payload.runId, payload.templateId)) {
                return reply({ error: 'JEV_TEMPLATE_NOT_OFFERED' }, 400);
            }
            return reply({ missing: await transport.fields(payload.goal, payload.templateId) });
        }
        if (payload.action === 'skills') return reply({ skill: await transport.skills(payload.goal) });
        const result = await transport.choose(payload.goal);
        const runId = randomUUID();
        const baseline = routeHomeSpecKeywords(payload.goal).recommendedTemplateId;
        store.recordChoice(actor, runId, { ...result, keywordTemplateId: templateId(baseline) ? baseline : null });
        return reply({ runId, ...result });
    } catch (error) {
        const fallback = fallbackCode(error);
        if (payload.action === 'choose') return startWithoutJev(store, actor, payload.goal, fallback);
        if (payload.action === 'fields') return reply({ missing: getHomeSpecFields(payload.templateId), fallback });
        if (payload.action === 'skills') return reply({ skill: null });
        return reply({ enabled: false, reason: fallback }, 503);
    }
}
